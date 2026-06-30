import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Resolves the calling app from the `x-app-key` header and attaches
 * `req.appId` to the request. Every app-scoped query must filter by this id.
 * This is the backbone of the multi-app tenancy model.
 */
@Injectable()
export class AppContextGuard implements CanActivate {
  // tiny in-memory cache: app key -> appId
  private cache = new Map<string, string>();

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const key = req.headers['x-app-key'] as string | undefined;
    if (!key) throw new UnauthorizedException('Missing x-app-key header');

    let appId = this.cache.get(key);
    if (!appId) {
      const app = await this.prisma.app.findUnique({ where: { key } });
      if (!app || app.status !== 'active') {
        throw new UnauthorizedException('Unknown or inactive app');
      }
      appId = app.id;
      this.cache.set(key, appId);
    }

    req.appId = appId;
    req.appKey = key;
    return true;
  }
}
