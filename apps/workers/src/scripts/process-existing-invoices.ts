#!/usr/bin/env ts-node
import { DocumentIntelligenceClient } from '../clients/document-intelligence.client';
import { GraphClient } from '../clients/graph.client';
import { PrismaClient } from '@prisma/client';
import { identifyCompany, generateInvoiceFilename, getSharePointFolder, CompanyIdentification } from '@paris/shared';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const documentIntelligence = new DocumentIntelligenceClient();
const graphClient = new GraphClient();

interface ProcessingResult {
  originalFile: string;
  newFileName: string;
  company: CompanyIdentification;
  destination: string;
  supplierName?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  total?: number;
  confidence: number;
  success: boolean;
  error?: string;
}

async function processInvoice(filePath: string): Promise<ProcessingResult> {
  const originalFile = path.basename(filePath);

  try {
    logger.info(`Processing: ${originalFile}`);

    // Read the PDF file
    const pdfBuffer = fs.readFileSync(filePath);

    // Analyze with Azure Document Intelligence
    const analysis = await documentIntelligence.analyzeInvoice(pdfBuffer);

    // Identify which company
    const company = identifyCompany(analysis.fullText || '');

    // Get SharePoint destination folder
    const destination = getSharePointFolder(company);

    // Generate new filename
    const newFileName = generateInvoiceFilename(
      analysis.supplierName || 'Unknown',
      analysis.invoiceNumber || 'Unknown',
      analysis.invoiceDate || new Date().toISOString()
    );

    return {
      originalFile,
      newFileName,
      company,
      destination,
      supplierName: analysis.supplierName,
      invoiceNumber: analysis.invoiceNumber,
      invoiceDate: analysis.invoiceDate,
      total: analysis.total ? analysis.total / 100 : undefined,
      confidence: analysis.confidence,
      success: true,
    };

  } catch (error: any) {
    logger.error(`Failed to process ${originalFile}:`, error);
    return {
      originalFile,
      newFileName: '',
      company: 'UNKNOWN',
      destination: '',
      confidence: 0,
      success: false,
      error: error.message,
    };
  }
}

async function uploadToSharePoint(
  filePath: string,
  newFileName: string,
  destination: string
): Promise<boolean> {
  try {
    const pdfBuffer = fs.readFileSync(filePath);
    await graphClient.uploadToSharePoint(newFileName, pdfBuffer, destination);
    logger.info(`✅ Uploaded: ${newFileName} to ${destination}`);
    return true;
  } catch (error: any) {
    logger.error(`❌ Upload failed: ${error.message}`);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
📄 Process Existing Invoices - Test Script

Usage:
  npm run process-invoices <folder-path> [options]

Options:
  --upload, -u        Actually upload to SharePoint (default: dry-run)
  --help, -h          Show this help message

Examples:
  # Dry run (shows what would happen without uploading)
  npm run process-invoices ./invoices

  # Actually upload to SharePoint
  npm run process-invoices ./invoices --upload

Description:
  This script processes all PDF invoices in a folder:
  - Extracts invoice data using Azure Document Intelligence
  - Identifies if invoice is for PSG or PM
  - Shows new filename: [VendorName]_[InvoiceNumber]_[Date].pdf
  - Shows destination SharePoint folder
  - Optionally uploads to SharePoint
    `);
    process.exit(0);
  }

  const folderPath = args[0];
  const shouldUpload = args.includes('--upload') || args.includes('-u');

  if (!fs.existsSync(folderPath)) {
    console.error(`❌ Error: Folder not found: ${folderPath}`);
    process.exit(1);
  }

  if (!fs.statSync(folderPath).isDirectory()) {
    console.error(`❌ Error: Not a directory: ${folderPath}`);
    process.exit(1);
  }

  console.log(`\n🔍 Processing invoices from: ${folderPath}`);
  console.log(`Mode: ${shouldUpload ? '📤 UPLOAD' : '🔬 DRY RUN'}\n`);

  if (shouldUpload) {
    console.log('⚠️  WARNING: Files will be uploaded to SharePoint!');
    console.log('Press Ctrl+C within 5 seconds to cancel...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Find all PDF files
  const files = fs.readdirSync(folderPath)
    .filter(file => file.toLowerCase().endsWith('.pdf'))
    .map(file => path.join(folderPath, file));

  if (files.length === 0) {
    console.log('❌ No PDF files found in folder');
    process.exit(1);
  }

  console.log(`Found ${files.length} PDF files\n`);
  console.log('─'.repeat(120));

  const results: ProcessingResult[] = [];
  const companyCounts = { PSG: 0, PM: 0, UNKNOWN: 0 };
  let uploadedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`\n[${i + 1}/${files.length}] Processing: ${path.basename(file)}`);

    const result = await processInvoice(file);
    results.push(result);

    if (result.success) {
      console.log(`  ✅ Success`);
      console.log(`  📄 Original:    ${result.originalFile}`);
      console.log(`  📝 New Name:    ${result.newFileName}`);
      console.log(`  🏢 Company:     ${result.company}`);
      console.log(`  📁 Destination: ${result.destination}`);
      console.log(`  🏪 Supplier:    ${result.supplierName || 'N/A'}`);
      console.log(`  🔢 Invoice #:   ${result.invoiceNumber || 'N/A'}`);
      console.log(`  📅 Date:        ${result.invoiceDate || 'N/A'}`);
      console.log(`  💰 Total:       ${result.total ? `$${result.total.toFixed(2)}` : 'N/A'}`);
      console.log(`  📊 Confidence:  ${(result.confidence * 100).toFixed(1)}%`);

      companyCounts[result.company]++;

      // Upload if requested
      if (shouldUpload && result.destination) {
        const uploaded = await uploadToSharePoint(
          file,
          result.newFileName,
          result.destination
        );
        if (uploaded) {
          uploadedCount++;
        } else {
          failedCount++;
        }
      }
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
      failedCount++;
    }

    console.log('─'.repeat(120));
  }

  // Summary
  console.log(`\n\n📊 SUMMARY`);
  console.log('═'.repeat(120));
  console.log(`\nTotal Files Processed: ${files.length}`);
  console.log(`  ✅ Successful: ${results.filter(r => r.success).length}`);
  console.log(`  ❌ Failed: ${failedCount}`);
  console.log(`\nCompany Distribution:`);
  console.log(`  🏢 Paris Service Group (PSG): ${companyCounts.PSG}`);
  console.log(`  🔧 Paris Mechanical (PM): ${companyCounts.PM}`);
  console.log(`  ❓ Unknown/Needs Review: ${companyCounts.UNKNOWN}`);

  if (shouldUpload) {
    console.log(`\nUpload Results:`);
    console.log(`  📤 Successfully Uploaded: ${uploadedCount}`);
    if (failedCount > 0) {
      console.log(`  ⚠️  Upload Failures: ${failedCount}`);
    }
  } else {
    console.log(`\n💡 This was a DRY RUN - no files were uploaded`);
    console.log(`   To actually upload, run with --upload flag`);
  }

  console.log('\n' + '═'.repeat(120));

  // Generate CSV report
  const csvPath = path.join(folderPath, `invoice-processing-report-${Date.now()}.csv`);
  const csvContent = [
    'Original File,New Filename,Company,Supplier,Invoice Number,Date,Total,Confidence,Success,Error',
    ...results.map(r => [
      r.originalFile,
      r.newFileName,
      r.company,
      r.supplierName || '',
      r.invoiceNumber || '',
      r.invoiceDate || '',
      r.total || '',
      (r.confidence * 100).toFixed(1),
      r.success,
      r.error || ''
    ].join(','))
  ].join('\n');

  fs.writeFileSync(csvPath, csvContent);
  console.log(`\n📄 Detailed report saved to: ${csvPath}\n`);

  await prisma.$disconnect();
  process.exit(0);
}

main().catch(error => {
  logger.error('Script failed:', error);
  process.exit(1);
});
