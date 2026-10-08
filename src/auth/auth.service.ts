import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { db } from '../prisma/db.js';
import { RegisterWithEmailPasswordDto } from './dto/register-with-email-password.dto.js';

@Injectable()
export class AuthService {
  async registerWithEmailPassword(
    input: RegisterWithEmailPasswordDto,
  ): Promise<any> {
    const hashedPassword = await bcrypt.hash(input.password, 10);

    const exists = await db.orm.public.User.where({
      email: input.email.trim().toLowerCase(),
    }).first();

    if (exists) {
      throw new ConflictException('User with this email already exists');
    }

    const result = await db.orm.public.User.create({
      email: input.email.trim().toLowerCase(),
      hashedPassword,
      displayName: input.displayName?.trim(),
      isManager: false,
    });

    return {
      id: result.id,
      email: result.email,
      displayName: result.displayName,
      isManager: result.isManager,
    };
  }
}
