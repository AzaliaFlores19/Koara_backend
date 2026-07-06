/*
  Warnings:

  - A unique constraint covering the columns `[invoice_number,cai_range_id]` on the table `Invoices` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Invoices_invoice_number_key";

-- CreateIndex
CREATE UNIQUE INDEX "Invoices_invoice_number_cai_range_id_key" ON "Invoices"("invoice_number", "cai_range_id");
