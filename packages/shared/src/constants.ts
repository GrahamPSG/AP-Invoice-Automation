export const QUEUE_NAMES = {
  INGEST: 'email-ingest',
  SPLIT: 'document-split',
  PARSE: 'document-parse',
  MATCH: 'servicetitan-match',
  BILL: 'servicetitan-bill',
  WRITE: 'file-write',
  NOTIFY: 'notification'
} as const;

export const DEFAULT_CONFIG = {
  varianceCents: 2500, // $25
  dedupeWindowDays: 90,
  dailySummaryHourPT: 7,
  runScheduleCron: "0 6-18 * * 1-6",
  retentionYears: 3
} as const;

export const VENDOR_CATEGORIES = {
  PH: ['plumbing', 'heating', 'pipes', 'fixtures', 'water heater'],
  HVAC: ['hvac', 'air conditioning', 'cooling', 'ventilation', 'ductwork', 'furnace']
} as const;

export const SERVICETITAN_ITEMS = {
  PH_LUMPSUM: '1Dollar.PH',
  HVAC_LUMPSUM: '1Dollar.HVAC'
} as const;

export const FILE_PATTERNS = {
  PO_NUMBER: /\b\d{7,8}(?:-\d{1,3})?\b/g,
  PO_CORE: /^\d{7,8}$/,
  INVOICE_NUMBER: /(?:inv|invoice|bill)[\s#-]*(\w+)/i,
  DATE: /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/,
  CURRENCY: /\$?\s*[\d,]+\.?\d{0,2}/
} as const;

export const ERROR_CODES = {
  GRAPH_AUTH_FAILED: 'GRAPH_001',
  GRAPH_RATE_LIMIT: 'GRAPH_002',
  ST_AUTH_FAILED: 'ST_001',
  ST_NOT_FOUND: 'ST_002',
  ST_NEGATIVE_QTY: 'ST_003',
  OCR_FAILED: 'OCR_001',
  OCR_UNREADABLE: 'OCR_002',
  DUPLICATE_INVOICE: 'DUP_001',
  VALIDATION_FAILED: 'VAL_001'
} as const;