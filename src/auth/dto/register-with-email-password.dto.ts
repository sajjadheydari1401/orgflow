import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterWithEmailPasswordDto {
  @ApiProperty({ example: 'sajjad@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Sajjad Heydari' })
  @IsString()
  @Matches(/\S/)
  @MinLength(3)
  displayName!: string;
}
