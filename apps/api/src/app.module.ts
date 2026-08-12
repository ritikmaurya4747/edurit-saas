import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { AuthModule } from "./modules/auth/auth.module";
import { SchoolModule } from "./modules/school/school.module";
import { StudentModule } from "./modules/student/student.module";
import { TeacherModule } from "./modules/teacher/teacher.module";
import { HealthController } from "./modules/health/health.controller";
import { TenantResolverGuard } from "./common/guards/tenant-resolver.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    AuthModule,
    SchoolModule,
    StudentModule,
    TeacherModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantResolverGuard,
    },
  ],
})
export class AppModule {}
