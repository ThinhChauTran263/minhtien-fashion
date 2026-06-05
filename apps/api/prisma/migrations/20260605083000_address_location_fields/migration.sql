-- Bring the Address table in sync with the current Prisma schema for fresh local databases.
CREATE TYPE "AddressType" AS ENUM ('HOME', 'OFFICE');
CREATE TYPE "AddressFormat" AS ENUM ('OLD', 'NEW');

ALTER TABLE "Address"
  ADD COLUMN "provinceId" INTEGER,
  ADD COLUMN "districtId" INTEGER,
  ADD COLUMN "wardCode" TEXT,
  ADD COLUMN "type" "AddressType" NOT NULL DEFAULT 'HOME',
  ADD COLUMN "format" "AddressFormat" NOT NULL DEFAULT 'NEW';
