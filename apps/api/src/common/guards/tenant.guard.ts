import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantSchool = request.tenantSchool;

    if (!user || !tenantSchool) {
      throw new ForbiddenException("Tenant context missing");
    }

    if (user.schoolId !== tenantSchool.id) {
      throw new ForbiddenException("Token does not belong to this school");
    }

    return true;
  }
}
