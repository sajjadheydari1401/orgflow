import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import * as bcrypt from 'bcrypt';
import type { Queue } from 'bullmq';
import { createHash, randomBytes } from 'node:crypto';
import { db } from '../prisma/db.js';
import { RegisterWithEmailPasswordDto } from './dto/register-with-email-password.dto.js';
import type { RegisteredUserData } from './types/registered-user-data.interface.js';
import type { VerificationEmailJob } from './types/verification-email-job.interface.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly logger: Logger,
    @InjectQueue('email')
    private readonly emailQueue: Queue<VerificationEmailJob>,
  ) {}

  async registerWithEmailPassword(
    input: RegisterWithEmailPasswordDto,
  ): Promise<RegisteredUserData> {
    const hashedPassword = await bcrypt.hash(input.password, 12);

    const email = input.email.trim().toLowerCase();

    const exists = await db.orm.public.User.where({
      email,
    }).first();

    if (exists) {
      throw new ConflictException('User with this email already exists');
    }

    const result = await db.orm.public.User.create({
      email,
      hashedPassword,
      displayName: input.displayName?.trim(),
      isManager: false,
    });

    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await db.orm.public.EmailVerificationToken.create({
      userId: result.id,
      tokenHash,
      expiresAt,
    });

    await this.emailQueue.add(
      'send-verification-email',
      { email, token },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1_000 },
        removeOnComplete: true,
        removeOnFail: { age: 60 * 60 },
      },
    );

    this.logger.log('User registered successfully', AuthService.name);

    return {
      id: result.id,
      email: result.email,
      displayName: result.displayName,
      isManager: result.isManager,
    };
  }
}
