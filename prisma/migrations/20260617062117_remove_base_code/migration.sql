/*
  Warnings:

  - You are about to drop the column `base_code` on the `Users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Users_base_code_key";

-- AlterTable
ALTER TABLE "Users" DROP COLUMN "base_code";
