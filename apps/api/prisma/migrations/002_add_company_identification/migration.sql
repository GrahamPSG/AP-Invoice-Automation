-- Add Company enum type
CREATE TYPE "Company" AS ENUM ('PSG', 'PM', 'UNKNOWN');

-- Add company column to Document table with default value UNKNOWN
ALTER TABLE "Document" ADD COLUMN "company" "Company" NOT NULL DEFAULT 'UNKNOWN';

-- Add sharepointPath column to Document table
ALTER TABLE "Document" ADD COLUMN "sharepointPath" TEXT;

-- Add index on company for faster filtering
CREATE INDEX "Document_company_idx" ON "Document"("company");
