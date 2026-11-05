-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "major" TEXT,
ADD COLUMN     "passwordHash" TEXT;
