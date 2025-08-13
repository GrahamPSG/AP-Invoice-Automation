import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as FormData from 'form-data';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private openai: OpenAI;
  private assistantId: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OpenAI API key not found. PDF parsing will not work.');
      return;
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });

    this.initializeAssistant();
  }

  private async initializeAssistant() {
    try {
      const assistant = await this.openai.beta.assistants.create({
        name: 'Construction Plan Analyzer',
        instructions: `You are an expert at analyzing construction plans and extracting building data. 
        When given a PDF file, extract the following information:
        - Square footage (total area)
        - Unit count (number of units/apartments)
        - Building type (single-family, multi-family, commercial, industrial)
        - Plumbing fixtures (toilets, sinks, showers, bathtubs)
        - HVAC requirements (zones, tonnage, vents)
        - Any floor drains or other drainage fixtures
        
        Return the data in a structured JSON format.`,
        model: 'gpt-4-turbo-preview',
        tools: [{ type: 'file_search' }],
      });

      this.assistantId = assistant.id;
      this.logger.log(`OpenAI Assistant created with ID: ${this.assistantId}`);
    } catch (error) {
      this.logger.error('Failed to create OpenAI assistant:', error);
    }
  }

  async parsePDF(fileBuffer: Buffer, fileName: string): Promise<any> {
    if (!this.openai || !this.assistantId) {
      throw new Error('OpenAI service not properly initialized');
    }

    try {
      this.logger.log(`Starting PDF parse for file: ${fileName}`);

      // Step 1: Upload the file to OpenAI
      const file = await this.openai.files.create({
        file: new File([fileBuffer], fileName, { type: 'application/pdf' }),
        purpose: 'assistants',
      });

      this.logger.log(`File uploaded to OpenAI with ID: ${file.id}`);

      // Step 2: Create a thread with the file
      const thread = await this.openai.beta.threads.create({
        messages: [
          {
            role: 'user',
            content: `Please analyze this construction plan PDF and extract all relevant building data including:
            1. Total square footage/area
            2. Number of units (if multi-family)
            3. Building type
            4. Complete fixture count (toilets, sinks, showers, bathtubs, floor drains)
            5. HVAC specifications (zones, tonnage, vents)
            
            Return the data in this JSON format:
            {
              "squareFootage": number,
              "unitCount": number,
              "buildingType": "single-family" | "multi-family" | "commercial" | "industrial",
              "fixtures": {
                "toilets": number,
                "sinks": number,
                "showers": number,
                "bathtubs": number,
                "floorDrains": number
              },
              "hvac": {
                "zones": number,
                "tonnage": number,
                "vents": number
              },
              "rawText": "extracted text for reference"
            }`,
            attachments: [
              {
                file_id: file.id,
                tools: [{ type: 'file_search' }],
              },
            ],
          },
        ],
      });

      // Step 3: Run the assistant
      const run = await this.openai.beta.threads.runs.create(thread.id, {
        assistant_id: this.assistantId,
      });

      // Step 4: Wait for completion
      let runStatus = await this.openai.beta.threads.runs.retrieve(
        thread.id,
        run.id,
      );

      while (runStatus.status !== 'completed') {
        if (runStatus.status === 'failed') {
          throw new Error(`Assistant run failed: ${runStatus.last_error?.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await this.openai.beta.threads.runs.retrieve(
          thread.id,
          run.id,
        );
      }

      // Step 5: Get the messages
      const messages = await this.openai.beta.threads.messages.list(thread.id);
      const assistantMessage = messages.data.find(msg => msg.role === 'assistant');

      if (!assistantMessage) {
        throw new Error('No response from assistant');
      }

      // Extract the content
      const content = assistantMessage.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from assistant');
      }

      // Parse the JSON response
      const textContent = content.text.value;
      
      // Try to extract JSON from the response
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        this.logger.log('Successfully parsed PDF data:', parsedData);
        return parsedData;
      }

      // If no JSON found, return the raw text
      return {
        rawText: textContent,
        error: 'Could not extract structured data',
      };

    } catch (error) {
      this.logger.error('Error parsing PDF:', error);
      throw error;
    }
  }

  async testParsing(): Promise<any> {
    // Create a simple test PDF content
    const testContent = `
      CONSTRUCTION PROJECT SPECIFICATIONS
      
      Project: Multi-Family Residential Building
      Location: 123 Main Street
      
      BUILDING SPECIFICATIONS:
      - Total Square Footage: 45,000 sq ft
      - Number of Units: 24 apartments
      - Building Type: Multi-Family Residential
      
      PLUMBING FIXTURES:
      - Toilets: 48 units
      - Sinks: 72 units  
      - Showers: 24 units
      - Bathtubs: 24 units
      - Floor Drains: 12 units
      
      HVAC REQUIREMENTS:
      - Number of Zones: 8
      - Total Tonnage: 45 tons
      - Supply/Return Vents: 96 total
    `;

    // For testing, we'll simulate the response
    return {
      squareFootage: 45000,
      unitCount: 24,
      buildingType: 'multi-family',
      fixtures: {
        toilets: 48,
        sinks: 72,
        showers: 24,
        bathtubs: 24,
        floorDrains: 12,
      },
      hvac: {
        zones: 8,
        tonnage: 45,
        vents: 96,
      },
      rawText: testContent,
    };
  }
}