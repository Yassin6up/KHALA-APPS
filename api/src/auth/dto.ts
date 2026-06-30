import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class RequestOtpDto {
  @IsEmail() email!: string;
}

export class VerifyOtpDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(4) code!: string;
  @IsOptional() @IsString() fullName?: string;
}

export class SocialLoginDto {
  @IsIn(['apple', 'google']) provider!: 'apple' | 'google';
  @IsString() idToken!: string;
  @IsOptional() @IsString() fullName?: string;
}

export class RefreshDto {
  @IsString() refreshToken!: string;
}

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
}

export class RegisterDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() avatarUrl?: string;
}
