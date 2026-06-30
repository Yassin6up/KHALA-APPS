import {
  CanActivate, createParamDecorator, ExecutionContext,
  Injectable, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class CoachGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const auth: string | undefined = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Coach token required');
    const token = auth.slice(7);
    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: process.env.COACH_JWT_SECRET ?? process.env.JWT_ACCESS_SECRET,
      });
      if (payload.role !== 'coach') throw new UnauthorizedException();
      req.coachId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired coach token');
    }
  }
}

export const CurrentCoach = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    return ctx.switchToHttp().getRequest().coachId;
  },
);
