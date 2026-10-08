import { BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { jest } from '@jest/globals';
import { createHash } from 'node:crypto';
import type { RegisterWithEmailPasswordDto } from './dto/register-with-email-password.dto.js';
import type { RegisteredUserData } from './types/registered-user-data.interface.js';
import type { EmailService } from './email.service.js';

type VerificationRecord = {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: string;
  usedAt: string | null;
};

const createdUser: RegisteredUserData = {
  id: 'user-1',
  email: 'person@example.com',
  displayName: 'Person Example',
  isManager: false,
};

let existingUser: RegisteredUserData | null = null;
let verificationRecord: VerificationRecord | null = null;
let affectedVerificationRows = 1;
const storedTokens: Array<{
  userId: string;
  tokenHash: string;
  expiresAt: string;
}> = [];
const sentEmails: Array<{ email: string; token: string }> = [];

const firstUser = jest.fn(async () => existingUser);
const userUpdateAll = jest.fn(async () => [createdUser]);
const userWhere = jest.fn(() => ({
  first: firstUser,
  updateAll: userUpdateAll,
}));
const userCreate = jest.fn(async () => createdUser);
const tokenCreate = jest.fn(async (token: (typeof storedTokens)[number]) => {
  storedTokens.push(token);
  return token;
});
const sendVerificationEmail = jest.fn(async (email: string, token: string) => {
  sentEmails.push({ email, token });
});
const hashPassword = jest.fn(async () => 'hashed-password');
const tokenFirst = jest.fn(async () => verificationRecord);
const tokenUpdateAll = jest.fn(async () =>
  Array.from({ length: affectedVerificationRows }, () => ({ id: 'token-1' })),
);
const tokenQuery = {
  where: jest.fn(() => tokenQuery),
  first: tokenFirst,
  updateAll: tokenUpdateAll,
};
const transactionContext = {
  orm: {
    public: {
      User: { where: userWhere },
      EmailVerificationToken: { where: jest.fn(() => tokenQuery) },
    },
  },
};
const transaction = jest.fn(
  async (callback: (tx: typeof transactionContext) => Promise<unknown>) =>
    callback(transactionContext),
);

jest.unstable_mockModule('../prisma/db.js', () => ({
  db: {
    transaction,
    orm: {
      public: {
        User: { where: userWhere, create: userCreate },
        EmailVerificationToken: { create: tokenCreate },
      },
    },
  },
}));

jest.unstable_mockModule('bcrypt', () => ({ hash: hashPassword }));

const { AuthService } = await import('./auth.service.js');

describe('AuthService', () => {
  let service: InstanceType<typeof AuthService>;

  beforeEach(() => {
    existingUser = null;
    verificationRecord = null;
    affectedVerificationRows = 1;
    storedTokens.length = 0;
    sentEmails.length = 0;
    firstUser.mockClear();
    userWhere.mockClear();
    userCreate.mockClear();
    tokenCreate.mockClear();
    sendVerificationEmail.mockClear();
    tokenFirst.mockClear();
    tokenUpdateAll.mockClear();
    userUpdateAll.mockClear();
    transaction.mockClear();

    service = new AuthService(
      { log: jest.fn() } as unknown as Logger,
      { sendVerificationEmail } as unknown as EmailService,
    );
  });

  it('stores a hashed verification token and sends the verification email', async () => {
    const input: RegisterWithEmailPasswordDto = {
      email: ' Person@Example.com ',
      password: 'password123',
      displayName: 'Person Example',
    };

    const result = await service.registerWithEmailPassword(input);
    const sentEmail = sentEmails[0];

    expect(result).toEqual(createdUser);
    expect(userWhere).toHaveBeenCalledWith({ email: 'person@example.com' });
    expect(userCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'person@example.com',
        hashedPassword: 'hashed-password',
      }),
    );
    expect(storedTokens).toHaveLength(1);
    expect(storedTokens[0].userId).toBe(createdUser.id);
    expect(storedTokens[0].tokenHash).toBe(
      createHash('sha256').update(sentEmail.token).digest('hex'),
    );
    expect(Date.parse(storedTokens[0].expiresAt)).toBeGreaterThan(Date.now());
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      'person@example.com',
      sentEmail.token,
    );
  });

  it('does not create a user or send an email when the email exists', async () => {
    existingUser = createdUser;

    await expect(
      service.registerWithEmailPassword({
        email: createdUser.email,
        password: 'password123',
        displayName: createdUser.displayName,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(userCreate).not.toHaveBeenCalled();
    expect(tokenCreate).not.toHaveBeenCalled();
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('consumes a valid token and marks its user email verified', async () => {
    const token = 'verification-token';
    verificationRecord = {
      id: 'token-1',
      tokenHash: createHash('sha256').update(token).digest('hex'),
      userId: createdUser.id,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      usedAt: null,
    };

    await expect(service.verifyEmail(token)).resolves.toEqual({
      verified: true,
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(tokenFirst).toHaveBeenCalledTimes(1);
    expect(tokenUpdateAll).toHaveBeenCalledWith({
      usedAt: expect.any(String),
    });
    expect(userUpdateAll).toHaveBeenCalledWith({
      emailVerifiedAt: expect.any(String),
    });
  });

  it('rejects a missing verification token', async () => {
    await expect(service.verifyEmail('unknown-token')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(tokenUpdateAll).not.toHaveBeenCalled();
    expect(userUpdateAll).not.toHaveBeenCalled();
  });

  it('rejects an expired verification token', async () => {
    verificationRecord = {
      id: 'token-1',
      tokenHash: 'stored-hash',
      userId: createdUser.id,
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
      usedAt: null,
    };

    await expect(service.verifyEmail('expired-token')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(tokenUpdateAll).not.toHaveBeenCalled();
    expect(userUpdateAll).not.toHaveBeenCalled();
  });

  it('rejects a token consumed by a concurrent request', async () => {
    verificationRecord = {
      id: 'token-1',
      tokenHash: 'stored-hash',
      userId: createdUser.id,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      usedAt: null,
    };
    affectedVerificationRows = 0;

    await expect(service.verifyEmail('racing-token')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(tokenUpdateAll).toHaveBeenCalledTimes(1);
    expect(userUpdateAll).not.toHaveBeenCalled();
  });
});
