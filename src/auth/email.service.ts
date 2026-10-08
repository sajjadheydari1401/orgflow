import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly from: string;
  private readonly appUrl: string;

  constructor(configService: ConfigService) {
    this.resend = new Resend(
      configService.getOrThrow<string>('RESEND_API_KEY'),
    );
    this.from = configService.getOrThrow<string>('RESEND_FROM_EMAIL');
    this.appUrl = configService.getOrThrow<string>('APP_URL');
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.appUrl.replace(/\/$/, '')}/auth/verify-email?token=${encodeURIComponent(token)}`;
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: 'Verify your email address',
      text: `Verify your email address by opening this link: ${verificationUrl}\n\nThis link expires in 30 minutes.`,
    });

    if (error) {
      throw new Error(
        `Resend failed to send verification email: ${error.message}`,
      );
    }
  }
}
