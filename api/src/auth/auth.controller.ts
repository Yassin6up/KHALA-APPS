import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AppContextGuard } from '../core/app-context.guard';
import { AuthService } from './auth.service';
import { RefreshDto, RequestOtpDto, SocialLoginDto, VerifyOtpDto, LoginDto, RegisterDto } from './dto';

@ApiTags('auth')
@ApiSecurity('app-key')
@UseGuards(AppContextGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('otp/request')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp(dto.email);
  }

  @Post('otp/verify')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto.email, dto.code, dto.fullName);
  }

  @Post('social')
  social(@Body() dto: SocialLoginDto) {
    return this.auth.socialLogin(dto.provider, dto.idToken, dto.fullName);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }
}
