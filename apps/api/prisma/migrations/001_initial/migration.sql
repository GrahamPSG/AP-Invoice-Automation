-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('QUEUED', 'PROCESSING', 'ARCHIVED', 'ERROR');

-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('PH', 'HVAC', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MatchAction" AS ENUM ('AUTO_FINALIZE', 'DRAFT_THEN_ALERT', 'HOLD_FOR_REVIEW', 'NON_JOB_STOCK_HOLD');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('FINALIZED', 'DRAFT', 'HELD');

-- CreateEnum
CREATE TYPE "HoldReason" AS ENUM ('MISSING_PO', 'VARIANCE_EXCEEDED', 'NEGATIVE_QUANTITY', 'NO_TECH_TRUCK', 'UNREADABLE', 'DUPLICATE', 'NO_VENDOR_MATCH', 'SERVICE_STOCK');

-- CreateTable
CREATE TABLE "Email" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'QUEUED',
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "sharepointRawPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "supplierNameRaw" TEXT NOT NULL,
    "supplierNameNormalized" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "totalBeforeTax" INTEGER NOT NULL,
    "gst" INTEGER NOT NULL,
    "pst" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "poNumberRaw" TEXT,
    "poNumberCore" TEXT,
    "isServiceStock" BOOLEAN NOT NULL DEFAULT false,
    "pageCount" INTEGER NOT NULL,
    "sourcePdfPath" TEXT NOT NULL,
    "renamedPdfPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineItem" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "unitPrice" INTEGER,
    "total" INTEGER,
    "category" "ItemCategory" NOT NULL,
    "inPricebook" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchResult" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "poFound" BOOLEAN NOT NULL,
    "poId" TEXT,
    "jobId" TEXT,
    "leadTechId" TEXT,
    "truckLocationId" TEXT,
    "vendorId" TEXT,
    "variance" INTEGER NOT NULL,
    "action" "MatchAction" NOT NULL,
    "reasons" TEXT[],
    "suggestions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "serviceTitanBillId" TEXT,
    "status" "BillStatus" NOT NULL,
    "pdfPath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hold" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "reason" "HoldReason" NOT NULL,
    "details" TEXT NOT NULL,
    "suggestedActions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,

    CONSTRAINT "Hold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorSynonym" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "synonym" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorSynonym_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DedupeEntry" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DedupeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuration" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "Configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Email_messageId_key" ON "Email"("messageId");

-- CreateIndex
CREATE INDEX "Email_status_receivedAt_idx" ON "Email"("status", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Attachment_sha256_key" ON "Attachment"("sha256");

-- CreateIndex
CREATE INDEX "Attachment_emailId_idx" ON "Attachment"("emailId");

-- CreateIndex
CREATE INDEX "Document_supplierNameNormalized_invoiceNumber_idx" ON "Document"("supplierNameNormalized", "invoiceNumber");

-- CreateIndex
CREATE INDEX "Document_poNumberCore_idx" ON "Document"("poNumberCore");

-- CreateIndex
CREATE INDEX "LineItem_documentId_idx" ON "LineItem"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchResult_documentId_key" ON "MatchResult"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "Bill_documentId_key" ON "Bill"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "Bill_vendorId_invoiceNumber_key" ON "Bill"("vendorId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "Bill_status_idx" ON "Bill"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Hold_documentId_key" ON "Hold"("documentId");

-- CreateIndex
CREATE INDEX "Hold_reason_resolvedAt_idx" ON "Hold"("reason", "resolvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_name_key" ON "Vendor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_normalized_key" ON "Vendor"("normalized");

-- CreateIndex
CREATE UNIQUE INDEX "VendorSynonym_synonym_key" ON "VendorSynonym"("synonym");

-- CreateIndex
CREATE UNIQUE INDEX "VendorSynonym_normalized_key" ON "VendorSynonym"("normalized");

-- CreateIndex
CREATE INDEX "VendorSynonym_normalized_idx" ON "VendorSynonym"("normalized");

-- CreateIndex
CREATE UNIQUE INDEX "DedupeEntry_vendorId_invoiceNumber_key" ON "DedupeEntry"("vendorId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "DedupeEntry_expiresAt_idx" ON "DedupeEntry"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Configuration_key_key" ON "Configuration"("key");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "Attachment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineItem" ADD CONSTRAINT "LineItem_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hold" ADD CONSTRAINT "Hold_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorSynonym" ADD CONSTRAINT "VendorSynonym_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;