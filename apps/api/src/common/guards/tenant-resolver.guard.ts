import { CanActivate, ExecutionContext, Injectable, NotFoundException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { prisma } from "@techrit/database";
import { SKIP_TENANT_KEY } from "../decorators/skip-tenant.decorator";

@Injectable()
export class TenantResolverGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skip) return true;

    const request = context.switchToHttp().getRequest();
    const subdomain = this.extractSubdomain(request);

    if (!subdomain) {
      throw new NotFoundException("School subdomain not provided");
    }

    const school = await prisma.school.findUnique({
      where: { subdomain },
      select: { id: true, subdomain: true, isActive: true, name: true },
    });

    if (!school || !school.isActive) {
      throw new NotFoundException(`School '${subdomain}' not found or inactive`);
    }

    request.tenantSchool = school;
    return true;
  }

  private extractSubdomain(req: any): string | null {
    const headerSubdomain = req.headers["x-school-subdomain"];
    if (headerSubdomain) return String(headerSubdomain).toLowerCase();

    const host = req.headers["host"] || "";
    const hostWithoutPort = host.split(":")[0];
    const parts = hostWithoutPort.split(".");

    if (parts.length >= 2 && parts[0] !== "www" && parts[0] !== "api") {
      return parts[0].toLowerCase();
    }
    return null;
  }
}
