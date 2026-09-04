-- AlterTable
ALTER TABLE "platform_users" ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "refresh_token_hash" VARCHAR(255);
