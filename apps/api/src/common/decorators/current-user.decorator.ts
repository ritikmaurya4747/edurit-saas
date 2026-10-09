import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../types/auth-user';

export const CurrentPlatformUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

// Tenant (school) user. `@CurrentUser() user: AuthUser` or `@CurrentUser('tenantId')`.
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const user: AuthUser | undefined = ctx.switchToHttp().getRequest().user;
    return data ? user?.[data] : user;
  },
);
