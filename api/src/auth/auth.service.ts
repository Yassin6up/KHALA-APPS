import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomInt } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../core/prisma.service';
import { RegisterDto } from './dto';

const APPLE_JWKS = createRemoteJWKSet(
  new URL('https://appleid.apple.com/auth/keys'),
);

@Injectable()
export class AuthService {
  // ephemeral OTP store (replace with Redis in production)
  private otp = new Map<string, { code: string; expires: number }>();
  private google = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // ---- OTP (email) ----
  async requestOtp(email: string) {
    const code = String(randomInt(1000, 9999));
    this.otp.set(email, { code, expires: Date.now() + 5 * 60_000 });
    // eslint-disable-next-line no-console
    console.log(`[OTP] ${email} → ${code}`);
    // TODO: integrate SendGrid / Resend to deliver by email
    return { sent: true };
  }

  async verifyOtp(email: string, code: string, fullName?: string) {
    const rec = this.otp.get(email);
    if (!rec || rec.expires < Date.now() || rec.code !== code) {
      throw new UnauthorizedException('رمز التحقق غير صحيح أو منتهي الصلاحية');
    }
    this.otp.delete(email);
    const user = await this.upsertUser({
      provider: 'otp',
      providerUid: email,
      email,
      fullName,
    });
    return this.issueTokens(user.id);
  }

  // ---- Email / Password ----
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (existing) {
      throw new UnauthorizedException('البريد الإلكتروني مسجل مسبقاً');
    }

    const secretHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        fullName: dto.fullName,
        avatarUrl: dto.avatarUrl,
        identities: {
          create: {
            provider: 'password',
            providerUid: dto.email,
            email: dto.email,
            secretHash,
          },
        },
      },
    });

    return this.issueTokens(user.id);
  }

  async login(email: string, password: string) {
    const identity = await this.prisma.userIdentity.findFirst({
      where: { provider: 'password', providerUid: email },
      include: { user: true },
    });

    if (!identity || !identity.secretHash) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const isValid = await bcrypt.compare(password, identity.secretHash);
    if (!isValid) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    return this.issueTokens(identity.userId);
  }


  // ---- Social ----
  async socialLogin(provider: 'apple' | 'google', idToken: string, fullName?: string) {
    const profile =
      provider === 'google'
        ? await this.verifyGoogle(idToken)
        : await this.verifyApple(idToken);

    const user = await this.upsertUser({
      provider,
      providerUid: profile.uid,
      email: profile.email,
      fullName: fullName ?? profile.name,
    });
    return this.issueTokens(user.id);
  }

  private async verifyGoogle(idToken: string) {
    const ticket = await this.google.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const p = ticket.getPayload();
    if (!p) throw new UnauthorizedException('Invalid Google token');
    return { uid: p.sub, email: p.email, name: p.name };
  }

  private async verifyApple(idToken: string) {
    try {
      const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
        issuer: 'https://appleid.apple.com',
        audience: process.env.APPLE_CLIENT_ID,
      });
      return {
        uid: payload.sub as string,
        email: payload.email as string | undefined,
        name: undefined as string | undefined,
      };
    } catch {
      throw new UnauthorizedException('Invalid Apple token');
    }
  }

  // ---- Shared identity upsert ----
  private async upsertUser(input: {
    provider: string;
    providerUid: string;
    email?: string;
    phone?: string;
    fullName?: string;
  }) {
    const existing = await this.prisma.userIdentity.findUnique({
      where: {
        provider_providerUid: {
          provider: input.provider,
          providerUid: input.providerUid,
        },
      },
      include: { user: true },
    });
    if (existing) return existing.user;

    return this.prisma.user.create({
      data: {
        email: input.email,
        phone: input.phone,
        fullName: input.fullName,
        identities: {
          create: {
            provider: input.provider,
            providerUid: input.providerUid,
            email: input.email,
          },
        },
      },
    });
  }

  // ---- Tokens ----
  async issueTokens(userId: string) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: Number(process.env.JWT_ACCESS_TTL ?? 900),
      },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, t: 'refresh' },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: Number(process.env.JWT_REFRESH_TTL ?? 2_592_000),
      },
    );
    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: this.hash(refreshToken),
        expiresAt: new Date(
          Date.now() + Number(process.env.JWT_REFRESH_TTL ?? 2_592_000) * 1000,
        ),
      },
    });
    return {
      accessToken,
      refreshToken,
      expiresIn: Number(process.env.JWT_ACCESS_TTL ?? 900),
    };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const hash = this.hash(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: hash },
    });
    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired');
    }
    // rotate
    await this.prisma.session.delete({ where: { id: session.id } });
    return this.issueTokens(payload.sub);
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
