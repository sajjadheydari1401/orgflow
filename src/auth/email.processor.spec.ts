import { jest } from '@jest/globals';
import type { Job } from 'bullmq';
import { EmailProcessor } from './email.processor.js';
import type { EmailService } from './email.service.js';
import type { VerificationEmailJob } from './types/verification-email-job.interface.js';

describe('EmailProcessor', () => {
  it('sends verification email jobs through EmailService', async () => {
    const sendVerificationEmail = jest.fn(async () => undefined);
    const processor = new EmailProcessor({
      sendVerificationEmail,
    } as unknown as EmailService);
    const job = {
      name: 'send-verification-email',
      data: { email: 'person@example.com', token: 'token-value' },
    } as unknown as Job<VerificationEmailJob>;

    await processor.process(job);

    expect(sendVerificationEmail).toHaveBeenCalledWith(
      'person@example.com',
      'token-value',
    );
  });

  it('rejects unsupported email job names', async () => {
    const processor = new EmailProcessor({
      sendVerificationEmail: jest.fn(async () => undefined),
    } as unknown as EmailService);
    const job = {
      name: 'unknown-email-job',
      data: { email: 'person@example.com', token: 'token-value' },
    } as unknown as Job<VerificationEmailJob>;

    await expect(processor.process(job)).rejects.toThrow(
      'Unsupported email job: unknown-email-job',
    );
  });
});
