import { ConflictException, Logger } from '@nestjs/common';
import { jest } from '@jest/globals';
import { createHash } from 'node:crypto';
import type { Queue } from 'bullmq';
import type { RegisterWithEmailPasswordDto } from './dto/register-with-email-password.dto.js';
import type { VerificationEmailJob } from './types/verification-email-job.interface.js';

type UserRecord = {
  id: string;
  email: string;
  displayName: string;
  isManager: boolean;
};

type EmailJobRecord = {
  name: string;
  data: VerificationEmailJob;
  options: Record<string, unknown>;
};

const createdUser: UserRecord = {
  id: 'user-1',
  email: 'person@example.com',
  displayName: 'Person Example',
  isManager: false,
};

let existingUser: UserRecord | null = null;
const storedTokens: Array<{
  userId: string;
  tokenHash: string;
  expiresAt: string;
}> = [];
const queuedJobs: EmailJobRecord[] = [];

const firstUser = jest.fn(async () => existingUser);
const userWhere = jest.fn(() => ({ first: firstUser }));
const userCreate = jest.fn(async () => createdUser);
const tokenCreate = jest.fn(async (token: (typeof storedTokens)[number]) => {
  storedTokens.push(token);
  return token;
});
const queueAdd = jest.fn(
  async (
    name: string,
    data: VerificationEmailJob,
    options: EmailJobRecord['options'],
  ) => {
    queuedJobs.push({ name, data, options });
    return { id: 'email-job-1' };
  },
);
const hashPassword = jest.fn(async () => 'hashed-password');

jest.unstable_mockModule('../prisma/db.js', () => ({
  db: {
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
    storedTokens.length = 0;
    queuedJobs.length = 0;
    firstUser.mockClear();
    userWhere.mockClear();
    userCreate.mockClear();
    tokenCreate.mockClear();
    queueAdd.mockClear();

    service = new AuthService(
      { log: jest.fn() } as unknown as Logger,
      { add: queueAdd } as unknown as Queue<VerificationEmailJob>,
    );
  });

  it('stores a hashed verification token and queues the email', async () => {
    const input: RegisterWithEmailPasswordDto = {
      email: ' Person@Example.com ',
      password: 'password123',
      displayName: 'Person Example',
    };

    const result = await service.registerWithEmailPassword(input);
    const queuedJob = queuedJobs[0];

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
      createHash('sha256').update(queuedJob.data.token).digest('hex'),
    );
    expect(Date.parse(storedTokens[0].expiresAt)).toBeGreaterThan(Date.now());
    expect(queuedJob.name).toBe('send-verification-email');
    expect(queuedJob.data.email).toBe('person@example.com');
    expect(queuedJob.options).toEqual(
      expect.objectContaining({
        attempts: 5,
        backoff: { type: 'exponential', delay: 1_000 },
      }),
    );
  });

  it('does not create a user or queue an email when the email exists', async () => {
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
    expect(queueAdd).not.toHaveBeenCalled();
  });
});
