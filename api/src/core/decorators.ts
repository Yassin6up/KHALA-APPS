import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Injects the resolved app id (set by AppContextGuard). */
export const AppId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string =>
    ctx.switchToHttp().getRequest().appId,
);

/** Injects the authenticated user id (set by JwtAuthGuard). */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string =>
    ctx.switchToHttp().getRequest().userId,
);
