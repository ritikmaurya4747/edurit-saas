import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { JwtPayload } from "@techrit/types";

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
