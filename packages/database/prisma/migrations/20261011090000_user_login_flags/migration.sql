-- AlterTable
ALTER TABLE "users" ADD COLUMN     "last_login_at" TIMESTAMPTZ,
ADD COLUMN     "must_change_password" BOOLEAN NOT NULL DEFAULT false;

