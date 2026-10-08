import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RegisterWithEmailPasswordDto } from './dto/register-with-email-password.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { AuthService } from './auth.service.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  registerWithEmailPassword(@Body() input: RegisterWithEmailPasswordDto) {
    return this.authService.registerWithEmailPassword(input);
  }

  @Get('verify-email')
  @UseGuards(ThrottlerGuard)
  verifyEmail(@Query() input: VerifyEmailDto) {
    return this.authService.verifyEmail(input.token);
  }
}
