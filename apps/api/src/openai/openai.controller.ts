import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OpenAIService } from './openai.service';

@Controller('api/parse-proposal')
export class OpenAIController {
  constructor(private readonly openaiService: OpenAIService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async parsePDF(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are supported');
    }

    try {
      const result = await this.openaiService.parsePDF(
        file.buffer,
        file.originalname,
      );
      
      return {
        success: true,
        data: result,
        fileName: file.originalname,
        fileSize: file.size,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to parse PDF: ${error.message}`,
      );
    }
  }

  @Get('test')
  async testParsing() {
    try {
      const result = await this.openaiService.testParsing();
      return {
        success: true,
        data: result,
        message: 'Test parsing completed successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        `Test parsing failed: ${error.message}`,
      );
    }
  }

  @Post('test-pdf')
  @UseInterceptors(FileInterceptor('file'))
  async testPDFParsing(@UploadedFile() file: Express.Multer.File) {
    // Simulate OpenAI parsing for testing without API key
    const simulatedData = {
      squareFootage: 105010,
      unitCount: 141,
      buildingType: 'multi-family',
      fixtures: {
        toilets: 169,
        sinks: 211 + 141, // lavatories + kitchen sinks
        showers: 113,
        bathtubs: 85,
        floorDrains: 48,
      },
      hvac: {
        zones: 141,
        tonnage: 282,
        vents: 705 + 282, // supply + return
      },
      rawText: `Simulated extraction from: ${file?.originalname || 'uploaded file'}`,
    };

    return {
      success: true,
      data: simulatedData,
      fileName: file?.originalname || 'test.pdf',
      fileSize: file?.size || 0,
      message: 'Test PDF parsing (simulated)',
    };
  }
}