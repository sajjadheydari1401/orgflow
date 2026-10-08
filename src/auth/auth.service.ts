import { ConflictException, Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { db } from '../prisma/db.js';
import { RegisterWithEmailPasswordDto } from './dto/register-with-email-password.dto.js';
import type { RegisteredUserData } from './types/registered-user-data.interface.js';

@Injectable()
export class AuthService {
  constructor(private readonly logger: Logger) {}

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

    this.logger.log('User registered successfully', AuthService.name);

    return {
      id: result.id,
      email: result.email,
      displayName: result.displayName,
      isManager: result.isManager,
    };
  }
}
