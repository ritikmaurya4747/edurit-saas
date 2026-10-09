import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./core/database/prisma.module";
import { CommonModule } from "./common/common.module";
import { PlatformModule } from "./modules/platform/platform.module";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
import { AcademicModule } from "./modules/academic/academic.module";
import { TimetableModule } from "./modules/timetable/timetable.module";
import { StudentsModule } from "./modules/students/students.module";
import { AdmissionsModule } from "./modules/admissions/admissions.module";
import { StaffModule } from "./modules/staff/staff.module";
import { AttendanceModule } from "./modules/attendance/attendance.module";
import { HomeworkModule } from "./modules/homework/homework.module";
import { ExaminationModule } from "./modules/examination/examination.module";
import { BillingModule } from "./modules/billing/billing.module";
import { CommunicationModule } from "./modules/communication/communication.module";
import { OperationsModule } from "./modules/operations/operations.module";
import { UsersModule } from "./modules/users/users.module";
import { TenantsModule } from "./modules/tenants/tenants.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { CalendarModule } from "./modules/calendar/calendar.module";
import { TransportModule } from "./modules/transport/transport.module";
import { LibraryModule } from "./modules/library/library.module";
import { CertificatesModule } from "./modules/certificates/certificates.module";
import { PortalModule } from "./modules/portal/portal.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ImportsModule } from "./modules/imports/imports.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Per client IP. The tenant web app forwards the browser IP (X-Forwarded-For),
    // and one dashboard screen fans out several requests, so 60/min was too tight.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    PrismaModule,
    CommonModule,
    PlatformModule,
    AuthModule,
    HealthModule,
    // School (tenant) ERP modules
    AcademicModule,
    TimetableModule,
    StudentsModule,
    AdmissionsModule,
    StaffModule,
    AttendanceModule,
    HomeworkModule,
    ExaminationModule,
    BillingModule,
    CommunicationModule,
    OperationsModule,
    UsersModule,
    TenantsModule,
    DashboardModule,
    CalendarModule,
    TransportModule,
    LibraryModule,
    CertificatesModule,
    NotificationsModule,
    ImportsModule,
    // Student & parent self-service (only their own / their children's data)
    PortalModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
