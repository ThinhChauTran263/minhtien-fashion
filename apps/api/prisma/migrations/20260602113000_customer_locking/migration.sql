ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "isLocked" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "lockedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lockReason" TEXT;

CREATE INDEX IF NOT EXISTS "User_role_deletedAt_isLocked_idx" ON "User"("role", "deletedAt", "isLocked");
