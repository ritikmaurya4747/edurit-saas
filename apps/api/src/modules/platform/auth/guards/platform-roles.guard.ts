import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PLATFORM_ROLES_KEY } from "../decorators/platform-roles.decorator";

@Injectable()
export class PlatformRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    // method aur class dono pe lage roles padhta hai
    const roles = this.reflector.getAllAndOverride<string[]>(PLATFORM_ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (!roles?.length) return true;

    const user = ctx.switchToHttp().getRequest().user;
    return !!user && roles.includes(user.role);
  }
}