import { Controller, Get } from "@nestjs/common";
import { SkipTenant } from "../../common/decorators/skip-tenant.decorator";

@Controller("health")
export class HealthController {
  @SkipTenant()
  @Get()
  check() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}
