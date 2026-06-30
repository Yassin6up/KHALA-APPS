import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

const ADMIN_KEY = process.env.ADMIN_KEY ?? 'qader-admin-2025';
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'change-me-access';

export type AdminPrincipal = {
  sub: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'viewer';
};

/**
 * Authenticates admin requests two ways:
 *   1. `x-admin-key` header matching ADMIN_KEY  → root super-admin (bootstrap)
 *   2. `Authorization: Bearer <jwt>` with `adm: true` claim → real AdminUser
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();

    const key = req.headers['x-admin-key'];
    if (key && key === ADMIN_KEY) {
      req.admin = {
        sub: 'root',
        email: 'root@khala.app',
        name: 'Root',
        role: 'super_admin',
      } satisfies AdminPrincipal;
      return true;
    }

    const auth: string | undefined = req.headers['authorization'];
    if (auth?.startsWith('Bearer ')) {
      try {
        const payload = await this.jwt.verifyAsync(auth.slice(7), {
          secret: JWT_SECRET,
        });
        if (payload?.adm) {
          req.admin = {
            sub: payload.sub,
            email: payload.email,
            name: payload.name,
            role: payload.role,
          } satisfies AdminPrincipal;
          return true;
        }
      } catch {
        /* fall through to 401 */
      }
    }

    throw new UnauthorizedException('Admin authentication required');
  }
}
