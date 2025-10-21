# Invoice Processing Scripts

## process-existing-invoices.ts

Test script to process existing invoices from a folder and validate the company identification and file naming logic.

### Usage

#### Dry Run (Default)
Shows what would happen without actually uploading to SharePoint:

```bash
cd apps/workers
npm run process-invoices /path/to/invoice/folder
```

#### Upload Mode
Actually processes and uploads invoices to SharePoint:

```bash
cd apps/workers
npm run process-invoices /path/to/invoice/folder --upload
```

### What It Does

1. **Scans Folder** - Finds all PDF files in the specified folder
2. **OCR Processing** - Extracts invoice data using Azure Document Intelligence
3. **Company Identification** - Determines if invoice is for:
   - **PSG** (Paris Service Group / Paris Mechanical Service Group Ltd.)
   - **PM** (Paris Mechanical / Paris Plumbing and Heating Ltd.)
   - **UNKNOWN** (Cannot determine)
4. **File Naming** - Generates new filename: `[VendorName]_[InvoiceNumber]_[Date].pdf`
5. **Shows Results** - Displays:
   - Original filename
   - New filename
   - Company identification
   - Destination SharePoint folder
   - Extracted invoice data (supplier, invoice #, date, total)
   - Confidence score
6. **Generates Report** - Creates a CSV file with all results

### Output Example

```
🔍 Processing invoices from: ./test-invoices
Mode: 🔬 DRY RUN

Found 15 PDF files

────────────────────────────────────────────────────────────

[1/15] Processing: invoice-abc-supply.pdf
  ✅ Success
  📄 Original:    invoice-abc-supply.pdf
  📝 New Name:    ABC_Supply_INV12345_2025-10-21.pdf
  🏢 Company:     PSG
  📁 Destination: Paris Mechanical(1)/Paris Service Group - Documents/Supplier Invoices
  🏪 Supplier:    ABC Supply
  🔢 Invoice #:   INV12345
  📅 Date:        2025-10-21
  💰 Total:       $1,234.56
  📊 Confidence:  95.3%

────────────────────────────────────────────────────────────

📊 SUMMARY
════════════════════════════════════════════════════════════

Total Files Processed: 15
  ✅ Successful: 14
  ❌ Failed: 1

Company Distribution:
  🏢 Paris Service Group (PSG): 10
  🔧 Paris Mechanical (PM): 3
  ❓ Unknown/Needs Review: 1

💡 This was a DRY RUN - no files were uploaded
   To actually upload, run with --upload flag

📄 Detailed report saved to: ./test-invoices/invoice-processing-report-1729512345678.csv
```

### CSV Report

The script generates a detailed CSV report with columns:
- Original File
- New Filename
- Company (PSG/PM/UNKNOWN)
- Supplier
- Invoice Number
- Date
- Total
- Confidence (%)
- Success (true/false)
- Error (if any)

### Requirements

Before running, ensure you have:
1. Azure Document Intelligence configured (`.env` file)
2. SharePoint credentials configured (for upload mode)
3. All dependencies installed (`pnpm install`)

### Troubleshooting

**Low confidence scores (<50%)**
- Invoice may be a scanned image (poor quality)
- Invoice format may not be standard
- These will typically go to the "Unknown" folder for manual review

**Company identification errors**
- Check if invoice clearly mentions company name
- Review the company identification patterns in `packages/shared/src/utils.ts:150`

**Upload failures**
- Verify SharePoint credentials in `.env`
- Check SharePoint folder paths are correct
- Ensure proper permissions on SharePoint site
