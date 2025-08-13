export type Currency = number; // cents

export interface EmailIngest {
  id: string;
  messageId: string;
  from: string;
  receivedAt: string;
  subject: string;
  attachments: AttachmentRef[];
  status: "queued" | "archived" | "error";
}

export interface AttachmentRef {
  id: string;
  name: string;
  contentType: string;
  size: number;
  sha256: string;
  sharepointRawPath?: string; // archive path
}

export interface SupplierInvoiceDoc {
  id: string;
  supplierNameRaw: string;
  supplierNameNormalized: string;
  invoiceNumber: string;   // "Vendor Document #"
  invoiceDate: string;     // ISO date
  totalBeforeTax: Currency;
  gst: Currency;
  pst: Currency;
  total: Currency;
  poNumberRaw?: string;    // may contain -001 suffix etc.
  poNumberCore?: string;   // 7–8 digits
  isServiceStock: boolean; // "SERVICE STOCK" or equivalent
  lineItems: ParsedLineItem[];
  pageCount: number;
  sourcePdf: FileRef;
  renamedPdf: FileRef;
}

export interface ParsedLineItem {
  sku?: string;
  description: string;
  qty: number;
  unitPrice?: Currency;
  total?: Currency;
  category: "PH" | "HVAC" | "UNKNOWN";
  inPricebook: boolean;
}

export interface FileRef {
  path: string;
  url?: string;
  size: number;
  sha256: string;
}

export interface MatchResult {
  poFound: boolean;
  poId?: string;
  jobId?: string;
  leadTechId?: string;
  truckLocationId?: string;
  vendorId?: string;
  variance: Currency;  // billed - ordered
  action: "auto_finalize" | "draft_then_alert" | "hold_for_review" | "non_job_stock_hold";
  reasons: string[];
  suggestions?: Array<{
    jobId: string;
    confidence: number;
    basis: "name" | "address" | "date_amount";
  }>;
}

export interface BillRecord {
  id: string;
  vendorId: string;
  invoiceNumber: string;
  serviceTitanBillId?: string;
  status: "finalized" | "draft" | "held";
  pdfPath: string;
  createdAt: string;
}

export interface QueueMessage<T = any> {
  id: string;
  correlationId: string;
  timestamp: string;
  payload: T;
  retryCount: number;
  metadata?: Record<string, any>;
}

export interface ProcessingResult {
  success: boolean;
  message?: string;
  error?: string;
  nextStep?: string;
  data?: any;
}

export interface Config {
  varianceCents: number;
  dedupeWindowDays: number;
  dailySummaryHourPT: number;
  runScheduleCron: string;
  retentionYears: number;
  paths: {
    processedDir: string;
    rawDir: string;
  };
  teams: {
    channelId: string;
    webhookUrl?: string;
  };
  notifications: {
    emails: string[];
  };
}

export interface Hold {
  id: string;
  documentId: string;
  reason: HoldReason;
  details: string;
  suggestedActions?: string[];
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
}

export type HoldReason = 
  | "missing_po"
  | "variance_exceeded" 
  | "negative_quantity"
  | "no_tech_truck"
  | "unreadable"
  | "duplicate"
  | "no_vendor_match"
  | "service_stock";

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId?: string;
  before?: any;
  after?: any;
  timestamp: string;
  metadata?: Record<string, any>;
}