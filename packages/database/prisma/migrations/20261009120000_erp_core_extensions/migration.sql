-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'ALUMNI', 'TRANSFERRED', 'DROPPED');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "AdmissionStage" AS ENUM ('ENQUIRY', 'DOCUMENT_VERIFICATION', 'ENTRANCE_TEST', 'OFFER_SENT', 'ADMITTED', 'WAITLISTED', 'REJECTED');

-- AlterTable
ALTER TABLE "staff" ADD COLUMN     "basic_salary" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "department" VARCHAR(128),
ADD COLUMN     "designation" VARCHAR(128),
ADD COLUMN     "joining_date" DATE,
ADD COLUMN     "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "address" TEXT,
ADD COLUMN     "admission_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" VARCHAR(255),
ADD COLUMN     "first_name" VARCHAR(128) NOT NULL DEFAULT '',
ADD COLUMN     "last_name" VARCHAR(128) NOT NULL DEFAULT '',
ADD COLUMN     "phone" VARCHAR(32),
ADD COLUMN     "photo_url" TEXT,
ADD COLUMN     "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "fee_payments" ADD COLUMN     "collected_by_id" UUID,
ADD COLUMN     "receipt_number" VARCHAR(64),
ADD COLUMN     "remarks" TEXT;

-- AlterTable
ALTER TABLE "notices" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "priority" VARCHAR(16) NOT NULL DEFAULT 'INFO',
ADD COLUMN     "status" VARCHAR(16) NOT NULL DEFAULT 'PUBLISHED';

-- CreateTable
CREATE TABLE "staff_leaves" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "leave_type" VARCHAR(32) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "action_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_leaves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_attendance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "attendance_date" DATE NOT NULL,
    "check_in" TIMESTAMPTZ,
    "check_out" TIMESTAMPTZ,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_appraisals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "period" VARCHAR(32) NOT NULL,
    "rating" DECIMAL(3,1),
    "remarks" TEXT,
    "status" VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    "reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_appraisals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_enquiries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "student_name" VARCHAR(255) NOT NULL,
    "parent_name" VARCHAR(255),
    "phone" VARCHAR(32) NOT NULL,
    "email" VARCHAR(255),
    "dob" DATE,
    "gender" VARCHAR(16),
    "class_applied" VARCHAR(64) NOT NULL,
    "source" VARCHAR(32) NOT NULL DEFAULT 'WALK_IN',
    "stage" "AdmissionStage" NOT NULL DEFAULT 'ENQUIRY',
    "test_date" TIMESTAMPTZ,
    "test_score" DECIMAL(5,2),
    "notes" TEXT,
    "student_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "admission_enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_seats" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "room_number" VARCHAR(32) NOT NULL,
    "seat_number" VARCHAR(16) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'GENERATED',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_seats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staff_leaves_tenant_id_staff_id_idx" ON "staff_leaves"("tenant_id", "staff_id");

-- CreateIndex
CREATE INDEX "staff_leaves_tenant_id_status_idx" ON "staff_leaves"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "staff_attendance_tenant_id_attendance_date_idx" ON "staff_attendance"("tenant_id", "attendance_date");

-- CreateIndex
CREATE UNIQUE INDEX "staff_attendance_tenant_id_staff_id_attendance_date_key" ON "staff_attendance"("tenant_id", "staff_id", "attendance_date");

-- CreateIndex
CREATE INDEX "staff_appraisals_tenant_id_idx" ON "staff_appraisals"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_appraisals_tenant_id_staff_id_period_key" ON "staff_appraisals"("tenant_id", "staff_id", "period");

-- CreateIndex
CREATE INDEX "admission_enquiries_tenant_id_stage_idx" ON "admission_enquiries"("tenant_id", "stage");

-- CreateIndex
CREATE INDEX "exam_seats_tenant_id_exam_id_idx" ON "exam_seats"("tenant_id", "exam_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_seats_exam_id_student_id_key" ON "exam_seats"("exam_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_seats_exam_id_room_number_seat_number_key" ON "exam_seats"("exam_id", "room_number", "seat_number");

-- CreateIndex
CREATE UNIQUE INDEX "fee_payments_tenant_id_receipt_number_key" ON "fee_payments"("tenant_id", "receipt_number");

-- AddForeignKey
ALTER TABLE "staff_leaves" ADD CONSTRAINT "staff_leaves_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_leaves" ADD CONSTRAINT "staff_leaves_tenant_id_staff_id_fkey" FOREIGN KEY ("tenant_id", "staff_id") REFERENCES "staff"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_tenant_id_staff_id_fkey" FOREIGN KEY ("tenant_id", "staff_id") REFERENCES "staff"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_appraisals" ADD CONSTRAINT "staff_appraisals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_appraisals" ADD CONSTRAINT "staff_appraisals_tenant_id_staff_id_fkey" FOREIGN KEY ("tenant_id", "staff_id") REFERENCES "staff"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_enquiries" ADD CONSTRAINT "admission_enquiries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_seats" ADD CONSTRAINT "exam_seats_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_seats" ADD CONSTRAINT "exam_seats_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_seats" ADD CONSTRAINT "exam_seats_tenant_id_student_id_fkey" FOREIGN KEY ("tenant_id", "student_id") REFERENCES "students"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Backfill: students that already have a linked user account inherit its name
UPDATE "students" s
SET "first_name" = u."first_name", "last_name" = u."last_name"
FROM "users" u
WHERE s."user_id" = u."id" AND s."first_name" = '';
