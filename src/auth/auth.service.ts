import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from './auth.constants.js';
import { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { db } from '../prisma/db.js';
import { RegisterWithEmailPasswordDto } from './dto/register-with-email-password.dto.js';
import type { RegisteredUserData } from './types/auth.js';
import { EmailService } from './email.service.js';
import { LoginWithEmailPasswordDto } from './dto/login-with-email-password.dto.js';
import type { LoginUserData } from './types/auth.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly logger: Logger,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // REGISTER
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

    // Generate a cryptographically random token for the verification link.
    const token = randomBytes(32).toString('base64url');

    // Store only a hash so the database never contains the usable token.
    const tokenHash = createHash('sha256').update(token).digest('hex');

    // Expire the verification link after 30 minutes.
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // Persist the token hash and its expiry against the new user.
    await db.orm.public.EmailVerificationToken.create({
      userId: result.id,
      tokenHash,
      expiresAt,
    });

    // Send the verification email before returning the registration response.
    await this.emailService.sendVerificationEmail(email, token);

    // Log registration without including the token or password.
    this.logger.log('User registered successfully', AuthService.name);

    return {
      id: result.id,
      email: result.email,
      displayName: result.displayName,
      isManager: result.isManager,
    };
  }

  //EMAIL VERIFY
  async verifyEmail(token: string): Promise<{ verified: true }> {
    // Hash the submitted token to compare it with the stored hash.
    const tokenHash = createHash('sha256').update(token).digest('hex');

    // Use one timestamp for expiry checks and both database updates.
    const now = new Date().toISOString();

    // Consume the token and verify its account atomically.
    await db.transaction(async (tx) => {
      // Find the token record by its hash, never by the raw token.
      const verification = await tx.orm.public.EmailVerificationToken.where(
        (record) => record.tokenHash.eq(tokenHash),
      ).first();

      // Reject unknown, already-used, or expired tokens.
      if (
        !verification ||
        verification.usedAt !== null ||
        Date.parse(verification.expiresAt) <= Date.now()
      ) {
        throw new BadRequestException(
          'Verification token is invalid or expired',
        );
      }

      // Claim the token only if it is still unused and unexpired.
      const consumed = await tx.orm.public.EmailVerificationToken.where(
        (record) => record.id.eq(verification.id),
      )
        .where((record) => record.usedAt.isNull())
        .where((record) => record.expiresAt.gt(now))
        .updateAll({ usedAt: now });

      // A zero-row update means another request already consumed the token.
      if (consumed.length !== 1) {
        throw new BadRequestException(
          'Verification token is invalid or expired',
        );
      }

      // Mark the user verified only after successfully consuming the token.
      await tx.orm.public.User.where({ id: verification.userId }).updateAll({
        emailVerifiedAt: now,
      });
    });

    // Signal successful verification to the controller.
    return { verified: true };
  }

  //LOGIN
  async loginWithEmailPassword(input: LoginWithEmailPasswordDto): Promise<{
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
    user: LoginUserData;
  }> {
    const email = input.email.trim().toLowerCase();
    const user = await db.orm.public.User.where({ email }).first();

    if (!user || !(await bcrypt.compare(input.password, user.hashedPassword))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException(
        'Please verify your email before logging in',
      );
    }

    const tokens = await this.generateTokens(user.id, user.email);

    await this.storeRefreshTokenHash(user.id, tokens.refreshToken);

    this.logger.log('User logged in successfully', AuthService.name);

    const userData: LoginUserData = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      isManager: user.isManager,
      mobile: user.mobile,
      avatar: user.avatarUrl,
    };

    return {
      user: userData,
      tokens,
    };
  }

  // GENERATE TOKENS
  private async generateTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, tokenType: 'access' },
        {
          secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
          expiresIn: ACCESS_TOKEN_TTL_SECONDS,
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, tokenType: 'refresh' },
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
          expiresIn: REFRESH_TOKEN_TTL_SECONDS,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  // STORE REFRESH TOKEN HASH
  private async storeRefreshTokenHash(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, 12);

    await db.orm.public.User.where({ id: userId }).update({
      refreshTokenHash: hash,
    });
  }

  // REFRESH TOKEN
  async refresh(userId: string, refreshToken: string) {
    const user = await db.orm.public.User.where({ id: userId })
      .select('id', 'email', 'refreshTokenHash')
      .first();

    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    // Rotate the refresh token by storing the new token's hash.
    await this.storeRefreshTokenHash(user.id, tokens.refreshToken);

    return { tokens };
  }

  // LOGOUT
  async logout(userId: string, refreshToken: string) {
    const user = await db.orm.public.User.where({ id: userId })
      .select('refreshTokenHash')
      .first();

    if (!user?.refreshTokenHash) {
      return;
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);

    if (isValid) {
      await db.orm.public.User.where({ id: userId }).update({
        refreshTokenHash: null,
      });
    }
  }
}
