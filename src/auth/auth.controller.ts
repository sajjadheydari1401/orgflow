import { Body, Controller, Post } from '@nestjs/common';
import { RegisterWithEmailPasswordDto } from './dto/register-with-email-password.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  registerWithEmailPassword(@Body() input: RegisterWithEmailPasswordDto) {
    return this.authService.registerWithEmailPassword(input);
  }
}
