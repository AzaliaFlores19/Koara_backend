/*
  Warnings:

  - A unique constraint covering the columns `[rtn]` on the table `Clients` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `base_code` to the `CAI_Range` table without a default value. This is not possible if the table is not empty.
  - Added the required column `client_name` to the `Invoices` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "entities" ADD VALUE 'COMPANY';

-- AlterTable
ALTER TABLE "CAI_Range" ADD COLUMN     "base_code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Categories" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "Clients" ALTER COLUMN "rtn" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Invoices" ADD COLUMN     "client_email" TEXT,
ADD COLUMN     "client_name" TEXT NOT NULL,
ADD COLUMN     "client_phone" TEXT,
ADD COLUMN     "client_rtn" TEXT;

-- CreateTable
CREATE TABLE "Company" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "rtn" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Clients_rtn_key" ON "Clients"("rtn");
