import { Module } from "@nestjs/common";
import { JwtModule, JwtModuleOptions } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PlatformAuthController } from "./auth/platform-auth.controller";
import { PlatformAuthService } from "./auth/platform-auth.service";
import { PlatformTenantsController } from "./tenants/platform-tenants.controller";
import { PlatformTenantsService } from "./tenants/platform-tenants.service";
import { PlatformJwtStrategy } from "./strategies/platform-jwt.strategy";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "platform-jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // expiry service mein har token pe alag di jaati hai (access 1h, refresh 30d)
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.getOrThrow<string>("PLATFORM_JWT_SECRET"),
      }),
    }),
  ],
  controllers: [PlatformAuthController, PlatformTenantsController],
  providers: [PlatformAuthService, PlatformTenantsService, PlatformJwtStrategy],
  exports: [PlatformAuthService, PlatformTenantsService],
})
export class PlatformModule {}