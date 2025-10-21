import { FILE_PATTERNS } from './constants';

export function extractPONumber(text: string): { raw: string; core: string } | null {
  const matches = text.match(FILE_PATTERNS.PO_NUMBER);
  if (!matches) return null;
  
  const raw = matches[0];
  const core = raw.replace(/-\d+$/, '');
  
  if (!FILE_PATTERNS.PO_CORE.test(core)) return null;
  
  return { raw, core };
}

export function normalizeVendorName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/inc|corp|ltd|llc|limited|corporation/g, '')
    .trim();
}

export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function parseCurrency(text: string): number {
  const cleaned = text.replace(/[^\d.-]/g, '');
  return Math.round(parseFloat(cleaned) * 100);
}

export function generateInvoiceFilename(
  vendorName: string,
  invoiceNumber: string,
  date: string
): string {
  // Format: [VendorName]_[InvoiceNumber]_[Date].pdf
  const cleanVendor = vendorName
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 40);

  const cleanInvoiceNumber = invoiceNumber
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 20);

  const dateStr = date.substring(0, 10); // YYYY-MM-DD

  return `${cleanVendor}_${cleanInvoiceNumber}_${dateStr}.pdf`;
}

export function calculateVariance(billed: number, ordered: number): number {
  return billed - ordered;
}

export function isWithinVariance(billed: number, ordered: number, maxVariance: number): boolean {
  return Math.abs(calculateVariance(billed, ordered)) <= maxVariance;
}

export function createCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function parseInvoiceDate(text: string): string | null {
  const patterns = [
    /(\d{4})-(\d{2})-(\d{2})/,
    /(\d{2})\/(\d{2})\/(\d{4})/,
    /(\d{2})-(\d{2})-(\d{4})/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let year, month, day;
      
      if (match[1].length === 4) {
        [, year, month, day] = match;
      } else {
        [, month, day, year] = match;
      }
      
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  return null;
}

export function dedupKey(vendorId: string, invoiceNumber: string): string {
  return `${vendorId}:${invoiceNumber.toLowerCase().replace(/\s+/g, '')}`;
}

export function isServiceStock(text: string): boolean {
  const patterns = [
    /service\s*stock/i,
    /stock\s*order/i,
    /inventory\s*stock/i,
    /shop\s*stock/i
  ];
  
  return patterns.some(p => p.test(text));
}

export function categorizeItem(description: string): "PH" | "HVAC" | "UNKNOWN" {
  const desc = description.toLowerCase();
  
  const phKeywords = ['plumb', 'pipe', 'water', 'drain', 'faucet', 'toilet', 'sink', 'valve', 'heating'];
  const hvacKeywords = ['hvac', 'air', 'condition', 'duct', 'vent', 'furnace', 'cool', 'refriger', 'filter'];
  
  const phScore = phKeywords.filter(k => desc.includes(k)).length;
  const hvacScore = hvacKeywords.filter(k => desc.includes(k)).length;
  
  if (phScore > hvacScore) return "PH";
  if (hvacScore > phScore) return "HVAC";
  return "UNKNOWN";
}

export function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 1000
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await fn();
        return resolve(result);
      } catch (error) {
        if (i === maxRetries - 1) {
          return reject(error);
        }
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  });
}

/**
 * Company identification for Paris Service Group vs Paris Mechanical
 */
export type CompanyIdentification = 'PSG' | 'PM' | 'UNKNOWN';

/**
 * Identify which Paris company an invoice is addressed to
 * @param invoiceText - Full text content from the invoice
 * @returns 'PSG' for Paris Service Group, 'PM' for Paris Mechanical, 'UNKNOWN' if cannot determine
 */
export function identifyCompany(invoiceText: string): CompanyIdentification {
  const text = invoiceText.toLowerCase();

  // Paris Service Group identifiers
  // Legal name: Paris Mechanical Service Group Ltd.
  const psgPatterns = [
    /paris\s+mechanical\s+service\s+group/i,
    /paris\s+service\s+group/i,
    /\bpmsg\b/i,
    /\bpsg\b/i
  ];

  // Paris Mechanical identifiers
  // Legal name: Paris Plumbing and Heating Ltd.
  // Must NOT match if it contains "service group"
  const pmPatterns = [
    /paris\s+plumbing\s+and\s+heating/i,
    /paris\s+plumbing/i,
    /paris\s+heating/i,
    /\bpph\b/i
  ];

  // Check for Paris Mechanical (but exclude if it's actually PSG)
  const hasPM = pmPatterns.some(p => p.test(invoiceText));
  const hasPSG = psgPatterns.some(p => p.test(invoiceText));

  // If it mentions "Paris Mechanical Service Group" or "Paris Service Group", it's PSG
  if (hasPSG) {
    return 'PSG';
  }

  // If it only mentions "Paris Mechanical" or "Paris Plumbing and Heating", it's PM
  if (hasPM) {
    return 'PM';
  }

  // Cannot determine
  return 'UNKNOWN';
}

/**
 * Get the SharePoint folder path for a company
 * @param company - Company identification
 * @returns SharePoint folder path from environment variables
 */
export function getSharePointFolder(company: CompanyIdentification): string {
  if (company === 'PSG') {
    return process.env.SP_PSG_DIR || process.env.SP_PROCESSED_DIR || '';
  } else if (company === 'PM') {
    return process.env.SP_PM_DIR || '';
  }
  return process.env.SP_UNKNOWN_DIR || process.env.SP_RAW_DIR || '';
}