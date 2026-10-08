import { jest } from '@jest/globals';
import { AuthService } from './auth.service.js';
import type { RegisterWithEmailPasswordDto } from './dto/register-with-email-password.dto.js';
import type { RegisteredUserData } from './types/registered-user-data.interface.js';

jest.unstable_mockModule('@nestjs/throttler', () => ({
  ThrottlerGuard: class ThrottlerGuard {},
}));

const { AuthController } = await import('./auth.controller.js');

describe('AuthController', () => {
  it('passes registration input to the service and returns its result', async () => {
    const input: RegisterWithEmailPasswordDto = {
      email: 'person@example.com',
      password: 'password123',
      displayName: 'Person Example',
    };
    const user: RegisteredUserData = {
      id: 'user-1',
      email: input.email,
      displayName: input.displayName,
      isManager: false,
    };
    const registerWithEmailPassword = jest.fn(async () => user);
    const controller = new AuthController({
      registerWithEmailPassword,
    } as unknown as AuthService);

    await expect(controller.registerWithEmailPassword(input)).resolves.toBe(
      user,
    );
    expect(registerWithEmailPassword).toHaveBeenCalledWith(input);
  });

  it('passes the verification token to the service', async () => {
    const verifyEmail = jest.fn(async () => ({ verified: true as const }));
    const controller = new AuthController({
      verifyEmail,
    } as unknown as AuthService);

    await expect(
      controller.verifyEmail({ token: 'verification-token' }),
    ).resolves.toEqual({
      verified: true,
    });
    expect(verifyEmail).toHaveBeenCalledWith('verification-token');
  });
});
