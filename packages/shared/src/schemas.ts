import { z } from 'zod';

export const EmailIngestSchema = z.object({
  id: z.string().uuid(),
  messageId: z.string(),
  from: z.string().email(),
  receivedAt: z.string().datetime(),
  subject: z.string(),
  attachments: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    contentType: z.string(),
    size: z.number().positive(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    sharepointRawPath: z.string().optional()
  })),
  status: z.enum(["queued", "archived", "error"])
});

export const SupplierInvoiceDocSchema = z.object({
  id: z.string().uuid(),
  supplierNameRaw: z.string(),
  supplierNameNormalized: z.string(),
  invoiceNumber: z.string(),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalBeforeTax: z.number().int(),
  gst: z.number().int(),
  pst: z.number().int(),
  total: z.number().int(),
  poNumberRaw: z.string().optional(),
  poNumberCore: z.string().regex(/^\d{7,8}$/).optional(),
  isServiceStock: z.boolean(),
  lineItems: z.array(z.object({
    sku: z.string().optional(),
    description: z.string(),
    qty: z.number(),
    unitPrice: z.number().int().optional(),
    total: z.number().int().optional(),
    category: z.enum(["PH", "HVAC", "UNKNOWN"]),
    inPricebook: z.boolean()
  })),
  pageCount: z.number().positive().int(),
  sourcePdf: z.object({
    path: z.string(),
    url: z.string().url().optional(),
    size: z.number().positive(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/)
  }),
  renamedPdf: z.object({
    path: z.string(),
    url: z.string().url().optional(),
    size: z.number().positive(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/)
  })
});

export const MatchResultSchema = z.object({
  poFound: z.boolean(),
  poId: z.string().optional(),
  jobId: z.string().optional(),
  leadTechId: z.string().optional(),
  truckLocationId: z.string().optional(),
  vendorId: z.string().optional(),
  variance: z.number().int(),
  action: z.enum(["auto_finalize", "draft_then_alert", "hold_for_review", "non_job_stock_hold"]),
  reasons: z.array(z.string()),
  suggestions: z.array(z.object({
    jobId: z.string(),
    confidence: z.number().min(0).max(1),
    basis: z.enum(["name", "address", "date_amount"])
  })).optional()
});

export const ConfigSchema = z.object({
  varianceCents: z.number().positive().int(),
  dedupeWindowDays: z.number().positive().int(),
  dailySummaryHourPT: z.number().min(0).max(23),
  runScheduleCron: z.string(),
  retentionYears: z.number().positive().int(),
  paths: z.object({
    processedDir: z.string(),
    rawDir: z.string()
  }),
  teams: z.object({
    channelId: z.string(),
    webhookUrl: z.string().url().optional()
  }),
  notifications: z.object({
    emails: z.array(z.string().email())
  })
});

export const HoldReasonSchema = z.enum([
  "missing_po",
  "variance_exceeded",
  "negative_quantity",
  "no_tech_truck",
  "unreadable",
  "duplicate",
  "no_vendor_match",
  "service_stock"
]);

export const HoldSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  reason: HoldReasonSchema,
  details: z.string(),
  suggestedActions: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  resolvedAt: z.string().datetime().optional(),
  resolvedBy: z.string().optional(),
  resolution: z.string().optional()
});