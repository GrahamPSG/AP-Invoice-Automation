import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.baseUrl = this.configService.get<string>('OPENAI_BASE_URL') || 'https://api.openai.com/v1';
  }

  async enhanceDocumentParsing(ocrText: string, documentType: 'invoice' | 'receipt' = 'invoice'): Promise<any> {
    try {
      this.logger.log(`Enhancing document parsing for ${documentType}`);
      
      if (!this.apiKey) {
        this.logger.warn('OpenAI API key not configured, skipping AI enhancement');
        return null;
      }

      const prompt = this.buildParsingPrompt(ocrText, documentType);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at extracting structured data from supplier invoices for AP automation. Return only valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;
      
      if (!content) {
        this.logger.warn('No content returned from OpenAI');
        return null;
      }

      return JSON.parse(content);
      
    } catch (error) {
      this.logger.error('Failed to enhance document parsing with AI', error);
      return null;
    }
  }

  async categorizeLineItem(description: string): Promise<'PH' | 'HVAC' | 'UNKNOWN'> {
    try {
      if (!this.apiKey) {
        // Fallback to basic keyword matching
        return this.basicCategorization(description);
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Categorize plumbing/heating supplier items. Respond with only: PH (plumbing/heating), HVAC (air conditioning/ventilation), or UNKNOWN.'
            },
            {
              role: 'user',
              content: `Categorize this item: "${description}"`
            }
          ],
          temperature: 0,
          max_tokens: 10
        }),
      });

      if (!response.ok) {
        return this.basicCategorization(description);
      }

      const result = await response.json();
      const category = result.choices?.[0]?.message?.content?.trim();
      
      if (['PH', 'HVAC', 'UNKNOWN'].includes(category)) {
        return category as 'PH' | 'HVAC' | 'UNKNOWN';
      }
      
      return this.basicCategorization(description);
      
    } catch (error) {
      this.logger.error('Failed to categorize line item with AI', error);
      return this.basicCategorization(description);
    }
  }

  async suggestVendorMatch(supplierName: string, knownVendors: string[]): Promise<string | null> {
    try {
      if (!this.apiKey || knownVendors.length === 0) {
        return null;
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Match supplier names to known vendors. Return the best match or "NONE" if no good match exists.'
            },
            {
              role: 'user',
              content: `Supplier: "${supplierName}"\nKnown vendors: ${knownVendors.join(', ')}`
            }
          ],
          temperature: 0,
          max_tokens: 50
        }),
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      const match = result.choices?.[0]?.message?.content?.trim();
      
      return knownVendors.includes(match) ? match : null;
      
    } catch (error) {
      this.logger.error('Failed to suggest vendor match with AI', error);
      return null;
    }
  }

  private buildParsingPrompt(ocrText: string, documentType: string): string {
    return `
Extract structured data from this ${documentType} OCR text. Focus on:

1. Supplier/vendor name
2. Invoice number  
3. Invoice date (YYYY-MM-DD format)
4. PO number (7-8 digits, may have -001 suffix)
5. Line items with descriptions, quantities, unit prices
6. Tax amounts (GST, PST, HST)
7. Total amount before and after tax

OCR Text:
${ocrText}

Return JSON with this structure:
{
  "supplierName": "string",
  "invoiceNumber": "string", 
  "invoiceDate": "YYYY-MM-DD",
  "poNumber": "string or null",
  "totalBeforeTax": number (in cents),
  "gst": number (in cents),
  "pst": number (in cents), 
  "total": number (in cents),
  "lineItems": [
    {
      "description": "string",
      "quantity": number,
      "unitPrice": number (in cents),
      "total": number (in cents)
    }
  ],
  "confidence": number (0-1)
}`;
  }

  private basicCategorization(description: string): 'PH' | 'HVAC' | 'UNKNOWN' {
    const desc = description.toLowerCase();
    
    const phKeywords = ['plumb', 'pipe', 'water', 'drain', 'faucet', 'toilet', 'sink', 'valve', 'heating', 'boiler'];
    const hvacKeywords = ['hvac', 'air', 'condition', 'duct', 'vent', 'furnace', 'cool', 'refriger', 'filter', 'compressor'];
    
    const phScore = phKeywords.filter(k => desc.includes(k)).length;
    const hvacScore = hvacKeywords.filter(k => desc.includes(k)).length;
    
    if (phScore > hvacScore) return 'PH';
    if (hvacScore > phScore) return 'HVAC';
    return 'UNKNOWN';
  }
}