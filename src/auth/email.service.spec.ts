import { ConfigService } from '@nestjs/config';
import { jest } from '@jest/globals';

const send = jest.fn(
  async (_message: unknown): Promise<{ error: Error | null }> => ({
    error: null,
  }),
);

jest.unstable_mockModule('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send } })),
}));

const { EmailService } = await import('./email.service.js');

describe('EmailService', () => {
  let service: InstanceType<typeof EmailService>;

  beforeEach(() => {
    send.mockReset();
    send.mockImplementation(async () => ({ error: null }));

    const configValues: Record<string, string> = {
      RESEND_API_KEY: 'test-api-key',
      RESEND_FROM_EMAIL: 'OrgFlow <verify@example.com>',
      APP_URL: 'http://localhost:3001/api/',
    };
    const configService = {
      getOrThrow: (key: string) => configValues[key],
    } as unknown as ConfigService;

    service = new EmailService(configService);
  });

  it('sends a verification link through Resend', async () => {
    await service.sendVerificationEmail('person@example.com', 'token+/=');

    expect(send).toHaveBeenCalledWith({
      from: 'OrgFlow <verify@example.com>',
      to: 'person@example.com',
      subject: 'Verify your email address',
      text: expect.stringContaining(
        'http://localhost:3001/api/auth/verify-email?token=token%2B%2F%3D',
      ),
    });
  });

  it('throws when Resend reports a delivery error', async () => {
    send.mockImplementationOnce(async () => ({
      error: new Error('delivery failed'),
    }));

    await expect(
      service.sendVerificationEmail('person@example.com', 'token'),
    ).rejects.toThrow(
      'Resend failed to send verification email: delivery failed',
    );
  });
});
