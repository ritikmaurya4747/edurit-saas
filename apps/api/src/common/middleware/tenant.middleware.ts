import { Injectable, NestMiddleware, NotFoundException } from "@nestjs/common";
import { prisma } from "@techrit/database";

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  async use(req: any, res: any, next: () => void) {
    const subdomain = this.extractSubdomain(req);

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

    req.tenantSchool = school;
    next();
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
