CREATE TABLE "PasswordResetOtp" (
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" TIMESTAMP(3) NOT NULL,
    "resetTokenHash" TEXT,
    "resetTokenExpiresAt" TIMESTAMP(3),

    CONSTRAINT "PasswordResetOtp_pkey" PRIMARY KEY ("email")
);
