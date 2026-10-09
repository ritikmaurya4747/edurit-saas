import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/tenant-auth.decorator';
import type { AuthUser } from '../types/auth-user';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const user: AuthUser | undefined = context.switchToHttp().getRequest().user;
    if (!user) throw new ForbiddenException('Not authenticated');
    if (user.isAdmin) return true;

    const missing = required.filter((p) => !user.permissions.includes(p));
    if (missing.length > 0) {
      throw new ForbiddenException(`You do not have permission to perform this action (${missing.join(', ')})`);
    }
    return true;
  }
}
