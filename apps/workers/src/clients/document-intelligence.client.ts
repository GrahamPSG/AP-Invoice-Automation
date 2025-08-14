import { DocumentAnalysisClient, AzureKeyCredential } from '@azure/ai-document-intelligence';
import { logger } from '../utils/logger';

export interface DocumentAnalysisResult {
  supplierName?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  poNumber?: string;
  totalBeforeTax?: number;
  gst?: number;
  pst?: number;
  hst?: number;
  total?: number;
  lineItems: DocumentLineItem[];
  confidence: number;
}

export interface DocumentLineItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
  confidence: number;
}

export class DocumentIntelligenceClient {
  private client: DocumentAnalysisClient;
  private modelId: string;

  constructor() {
    const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
    const apiKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;
    this.modelId = process.env.AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID || 'prebuilt-invoice';

    if (!endpoint || !apiKey) {
      throw new Error('Azure Document Intelligence credentials not configured');
    }

    this.client = new DocumentAnalysisClient(
      endpoint,
      new AzureKeyCredential(apiKey)
    );
  }

  async analyzeInvoice(pdfBuffer: Buffer, supplierHint?: string): Promise<DocumentAnalysisResult> {
    try {
      logger.info('Starting document analysis with Azure Document Intelligence');

      const poller = await this.client.beginAnalyzeDocument(
        this.modelId,
        pdfBuffer,
        {
          locale: 'en-CA', // Canadian locale for proper tax handling
        }
      );

      const result = await poller.pollUntilDone();

      if (!result.documents || result.documents.length === 0) {
        throw new Error('No documents found in analysis result');
      }

      const document = result.documents[0];
      const fields = document.fields || {};

      // Extract standard invoice fields
      const analysis: DocumentAnalysisResult = {
        supplierName: this.extractFieldValue(fields.VendorName) || 
                     this.extractFieldValue(fields.MerchantName) ||
                     supplierHint,
        invoiceNumber: this.extractFieldValue(fields.InvoiceId) ||
                      this.extractFieldValue(fields.InvoiceNumber),
        invoiceDate: this.extractFieldValue(fields.InvoiceDate),
        poNumber: this.extractPONumber(fields),
        total: this.extractCurrencyValue(fields.InvoiceTotal),
        totalBeforeTax: this.extractCurrencyValue(fields.SubTotal),
        gst: this.extractTaxValue(fields, 'GST'),
        pst: this.extractTaxValue(fields, 'PST'),
        hst: this.extractTaxValue(fields, 'HST'),
        lineItems: this.extractLineItems(fields.Items),
        confidence: document.confidence || 0,
      };

      // If we couldn't extract total before tax, calculate it
      if (!analysis.totalBeforeTax && analysis.total) {
        const totalTax = (analysis.gst || 0) + (analysis.pst || 0) + (analysis.hst || 0);
        analysis.totalBeforeTax = analysis.total - totalTax;
      }

      logger.info(`Document analysis completed with confidence: ${analysis.confidence}`);
      
      return analysis;

    } catch (error) {
      logger.error('Document analysis failed', error);
      throw new Error(`Document Intelligence analysis failed: ${error.message}`);
    }
  }

  async analyzeWithCustomModel(pdfBuffer: Buffer, customModelId: string): Promise<DocumentAnalysisResult> {
    try {
      logger.info(`Analyzing with custom model: ${customModelId}`);

      const poller = await this.client.beginAnalyzeDocument(
        customModelId,
        pdfBuffer
      );

      const result = await poller.pollUntilDone();
      
      if (!result.documents || result.documents.length === 0) {
        throw new Error('No documents found in custom model analysis');
      }

      const document = result.documents[0];
      const fields = document.fields || {};

      // Custom models might have different field names
      return {
        supplierName: this.extractFieldValue(fields.supplier_name) ||
                     this.extractFieldValue(fields.vendor_name),
        invoiceNumber: this.extractFieldValue(fields.invoice_number) ||
                      this.extractFieldValue(fields.invoice_id),
        invoiceDate: this.extractFieldValue(fields.invoice_date),
        poNumber: this.extractFieldValue(fields.po_number) ||
                 this.extractFieldValue(fields.purchase_order),
        total: this.extractCurrencyValue(fields.total_amount),
        totalBeforeTax: this.extractCurrencyValue(fields.subtotal),
        gst: this.extractCurrencyValue(fields.gst),
        pst: this.extractCurrencyValue(fields.pst),
        hst: this.extractCurrencyValue(fields.hst),
        lineItems: this.extractCustomLineItems(fields.line_items),
        confidence: document.confidence || 0,
      };

    } catch (error) {
      logger.error(`Custom model analysis failed: ${error.message}`);
      // Fallback to prebuilt model
      return this.analyzeInvoice(pdfBuffer);
    }
  }

  async detectLanguageAndLayout(pdfBuffer: Buffer) {
    try {
      const poller = await this.client.beginAnalyzeDocument(
        'prebuilt-layout',
        pdfBuffer
      );

      const result = await poller.pollUntilDone();
      
      return {
        pages: result.pages?.length || 0,
        tables: result.tables?.length || 0,
        language: result.languages?.[0]?.locale || 'en',
        confidence: result.pages?.[0]?.confidence || 0,
      };

    } catch (error) {
      logger.error('Layout analysis failed', error);
      return {
        pages: 1,
        tables: 0,
        language: 'en',
        confidence: 0,
      };
    }
  }

  private extractFieldValue(field: any): string | undefined {
    if (!field) return undefined;
    
    if (field.kind === 'string') {
      return field.value;
    }
    
    if (field.kind === 'date') {
      return field.value?.toISOString?.()?.split('T')[0];
    }
    
    if (field.content) {
      return field.content;
    }
    
    return field.value?.toString();
  }

  private extractCurrencyValue(field: any): number | undefined {
    if (!field) return undefined;
    
    if (field.kind === 'currency') {
      return Math.round((field.value?.amount || 0) * 100); // Convert to cents
    }
    
    if (field.kind === 'number') {
      return Math.round((field.value || 0) * 100);
    }
    
    // Try to parse as string
    const stringValue = this.extractFieldValue(field);
    if (stringValue) {
      const cleaned = stringValue.replace(/[^\d.-]/g, '');
      const amount = parseFloat(cleaned);
      return isNaN(amount) ? undefined : Math.round(amount * 100);
    }
    
    return undefined;
  }

  private extractPONumber(fields: any): string | undefined {
    // Look for PO number in various fields
    const poFields = [
      'PurchaseOrder',
      'CustomerOrderNumber',
      'PONumber',
      'ReferenceNumber'
    ];

    for (const fieldName of poFields) {
      const value = this.extractFieldValue(fields[fieldName]);
      if (value) {
        // Look for PO number pattern (7-8 digits, optional suffix)
        const match = value.match(/\b\d{7,8}(?:-\d{1,3})?\b/);
        if (match) {
          return match[0];
        }
      }
    }

    return undefined;
  }

  private extractTaxValue(fields: any, taxType: 'GST' | 'PST' | 'HST'): number | undefined {
    // Look for tax in various formats
    const taxFields = [
      `${taxType}Amount`,
      `Tax${taxType}`,
      `${taxType.toLowerCase()}_amount`,
      `${taxType.toLowerCase()}`,
    ];

    for (const fieldName of taxFields) {
      const value = this.extractCurrencyValue(fields[fieldName]);
      if (value !== undefined) {
        return value;
      }
    }

    // Look in tax breakdown array
    if (fields.TaxDetails?.values) {
      for (const taxDetail of fields.TaxDetails.values) {
        const taxName = this.extractFieldValue(taxDetail.properties?.TaxCategory);
        if (taxName?.toUpperCase().includes(taxType)) {
          return this.extractCurrencyValue(taxDetail.properties?.TaxAmount);
        }
      }
    }

    return undefined;
  }

  private extractLineItems(itemsField: any): DocumentLineItem[] {
    if (!itemsField?.values) {
      return [];
    }

    return itemsField.values.map((item: any) => {
      const props = item.properties || {};
      
      return {
        description: this.extractFieldValue(props.Description) ||
                    this.extractFieldValue(props.ProductName) ||
                    this.extractFieldValue(props.ItemName) ||
                    'Unknown Item',
        quantity: this.extractNumberValue(props.Quantity),
        unitPrice: this.extractCurrencyValue(props.UnitPrice),
        total: this.extractCurrencyValue(props.TotalPrice) ||
               this.extractCurrencyValue(props.Amount),
        confidence: item.confidence || 0,
      };
    }).filter((item: DocumentLineItem) => item.description !== 'Unknown Item');
  }

  private extractCustomLineItems(itemsField: any): DocumentLineItem[] {
    if (!itemsField?.values) {
      return [];
    }

    return itemsField.values.map((item: any) => {
      const props = item.properties || {};
      
      return {
        description: this.extractFieldValue(props.description) ||
                    this.extractFieldValue(props.item_description) ||
                    'Unknown Item',
        quantity: this.extractNumberValue(props.quantity) ||
                 this.extractNumberValue(props.qty),
        unitPrice: this.extractCurrencyValue(props.unit_price) ||
                  this.extractCurrencyValue(props.price),
        total: this.extractCurrencyValue(props.line_total) ||
               this.extractCurrencyValue(props.amount),
        confidence: item.confidence || 0,
      };
    }).filter((item: DocumentLineItem) => item.description !== 'Unknown Item');
  }

  private extractNumberValue(field: any): number | undefined {
    if (!field) return undefined;
    
    if (field.kind === 'number') {
      return field.value;
    }
    
    const stringValue = this.extractFieldValue(field);
    if (stringValue) {
      const number = parseFloat(stringValue.replace(/[^\d.-]/g, ''));
      return isNaN(number) ? undefined : number;
    }
    
    return undefined;
  }
}