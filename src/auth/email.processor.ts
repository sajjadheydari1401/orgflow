import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { EmailService } from './email.service.js';
import type { VerificationEmailJob } from './types/verification-email-job.interface.js';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<VerificationEmailJob>): Promise<void> {
    if (job.name !== 'send-verification-email') {
      throw new Error(`Unsupported email job: ${job.name}`);
    }

    await this.emailService.sendVerificationEmail(
      job.data.email,
      job.data.token,
    );
  }
}
