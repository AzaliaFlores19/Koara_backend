-- CreateEnum
CREATE TYPE "roles" AS ENUM ('ADMIN', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('CASH', 'TRANSFER', 'CARD');

-- CreateEnum
CREATE TYPE "entities" AS ENUM ('CATEGORY', 'USERS', 'PRODUCTS', 'INVOICES', 'INVOICE_PRODUCTS', 'CLIENTS', 'CAI', 'CAI_RANGE');

-- CreateEnum
CREATE TYPE "audit_action" AS ENUM ('CREATE', 'UPDATE', 'DEACTIVATE', 'LOGIN', 'LOGOUT');

-- CreateTable
CREATE TABLE "Users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "role" "roles" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "creation_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Products" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code_bar" TEXT NOT NULL,
    "description" VARCHAR(200),
    "category_id" UUID,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "min_stock" INTEGER NOT NULL DEFAULT 5,
    "price" DECIMAL(10,2) NOT NULL,
    "image" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clients" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "rtn" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoices" (
    "id" UUID NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "cai_range_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxes" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "payment_method" "payment_method" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CAI" (
    "id" UUID NOT NULL,
    "cai_code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CAI_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CAI_Range" (
    "id" UUID NOT NULL,
    "cai_id" UUID,
    "range_start" INTEGER NOT NULL,
    "range_end" INTEGER NOT NULL,
    "current_invoice_number" INTEGER NOT NULL,
    "expiration_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CAI_Range_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice_Product" (
    "id" UUID NOT NULL,
    "invoice_id" UUID,
    "product_id" UUID,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2),
    "item_subtotal" DECIMAL(10,2),

    CONSTRAINT "Invoice_Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Audit_Logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "entity" "entities" NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" "audit_action" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Audit_Logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Products_name_key" ON "Products"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Products_code_bar_key" ON "Products"("code_bar");

-- CreateIndex
CREATE UNIQUE INDEX "Categories_name_key" ON "Categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Clients_email_key" ON "Clients"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Invoices_invoice_number_key" ON "Invoices"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "CAI_cai_code_key" ON "CAI"("cai_code");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_Product_invoice_id_product_id_key" ON "Invoice_Product"("invoice_id", "product_id");

-- CreateIndex
CREATE INDEX "Audit_Logs_user_id_idx" ON "Audit_Logs"("user_id");

-- CreateIndex
CREATE INDEX "Audit_Logs_created_at_idx" ON "Audit_Logs"("created_at");

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoices" ADD CONSTRAINT "Invoices_cai_range_id_fkey" FOREIGN KEY ("cai_range_id") REFERENCES "CAI_Range"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoices" ADD CONSTRAINT "Invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoices" ADD CONSTRAINT "Invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CAI_Range" ADD CONSTRAINT "CAI_Range_cai_id_fkey" FOREIGN KEY ("cai_id") REFERENCES "CAI"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice_Product" ADD CONSTRAINT "Invoice_Product_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "Invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice_Product" ADD CONSTRAINT "Invoice_Product_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit_Logs" ADD CONSTRAINT "Audit_Logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
