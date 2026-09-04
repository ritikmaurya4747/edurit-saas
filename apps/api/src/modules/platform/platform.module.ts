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
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.getOrThrow<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get<string>("JWT_EXPIRES_IN", "7d") as any,
        },
      }),
    }),
  ],
  controllers: [PlatformAuthController, PlatformTenantsController],
  providers: [PlatformAuthService, PlatformTenantsService, PlatformJwtStrategy],
  exports: [PlatformAuthService, PlatformTenantsService],
})
export class PlatformModule {}