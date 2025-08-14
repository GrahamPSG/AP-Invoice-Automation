import { SplitProcessor } from './split-processor';
import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import * as pdfParse from 'pdf-parse';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';

// Mock modules
jest.mock('fs');
jest.mock('pdf-parse');
jest.mock('pdf-lib');

describe('SplitProcessor', () => {
  let processor: SplitProcessor;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockJob: jest.Mocked<Job>;

  beforeEach(() => {
    mockPrisma = {
      emailIngest: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    } as any;

    mockJob = {
      id: 'test-job-id',
      data: {
        attachmentId: 'test-attachment-id',
        pdfPath: '/tmp/test.pdf',
        supplierHint: 'test-supplier',
      },
      updateProgress: jest.fn(),
    } as any;

    processor = new SplitProcessor(mockPrisma);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('process', () => {
    it('should process single-page PDF successfully', async () => {
      // Arrange
      const mockPdfBuffer = Buffer.from('mock-pdf-content');
      const mockPdfData = {
        numpages: 1,
        text: 'Invoice content',
      };

      (fs.readFileSync as jest.Mock).mockReturnValue(mockPdfBuffer);
      (pdfParse as jest.Mock).mockResolvedValue(mockPdfData);
      
      mockPrisma.emailIngest.findFirst.mockResolvedValue({
        id: 'test-attachment-id',
        emailId: 'email-123',
        filename: 'invoice.pdf',
        contentType: 'application/pdf',
        size: 1024,
        attachmentId: 'att-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Act
      const result = await processor.process(mockJob);

      // Assert
      expect(result).toBeDefined();
      expect(result.pages).toBe(1);
      expect(result.files).toHaveLength(1);
      expect(mockJob.updateProgress).toHaveBeenCalledWith(100);
      expect(mockPrisma.emailIngest.update).toHaveBeenCalledWith({
        where: { attachmentId: 'test-attachment-id' },
        data: { status: 'PROCESSED' },
      });
    });

    it('should split multi-page PDF correctly', async () => {
      // Arrange
      const mockPdfBuffer = Buffer.from('mock-pdf-content');
      const mockPdfData = {
        numpages: 3,
        text: 'Multi-page invoice content',
      };

      const mockPdfDoc = {
        getPageCount: jest.fn().mockReturnValue(3),
        copyPages: jest.fn().mockResolvedValue(['page1', 'page2', 'page3']),
      };

      const mockNewPdfDoc = {
        addPage: jest.fn(),
        save: jest.fn().mockResolvedValue(Buffer.from('split-pdf')),
      };

      (fs.readFileSync as jest.Mock).mockReturnValue(mockPdfBuffer);
      (fs.writeFileSync as jest.Mock).mockImplementation();
      (pdfParse as jest.Mock).mockResolvedValue(mockPdfData);
      (PDFDocument.load as jest.Mock).mockResolvedValue(mockPdfDoc);
      (PDFDocument.create as jest.Mock).mockResolvedValue(mockNewPdfDoc);
      
      mockPrisma.emailIngest.findFirst.mockResolvedValue({
        id: 'test-attachment-id',
        emailId: 'email-123',
        filename: 'invoice.pdf',
        contentType: 'application/pdf',
        size: 1024,
        attachmentId: 'att-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Act
      const result = await processor.process(mockJob);

      // Assert
      expect(result.pages).toBe(3);
      expect(result.files).toHaveLength(3);
      expect(mockJob.updateProgress).toHaveBeenCalledWith(33);
      expect(mockJob.updateProgress).toHaveBeenCalledWith(66);
      expect(mockJob.updateProgress).toHaveBeenCalledWith(100);
    });

    it('should handle PDF processing errors', async () => {
      // Arrange
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File not found');
      });

      mockPrisma.emailIngest.findFirst.mockResolvedValue({
        id: 'test-attachment-id',
        emailId: 'email-123',
        filename: 'invoice.pdf',
        contentType: 'application/pdf',
        size: 1024,
        attachmentId: 'att-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Act & Assert
      await expect(processor.process(mockJob)).rejects.toThrow('File not found');
      
      expect(mockPrisma.emailIngest.update).toHaveBeenCalledWith({
        where: { attachmentId: 'test-attachment-id' },
        data: { status: 'FAILED', error: 'File not found' },
      });
    });

    it('should handle missing attachment record', async () => {
      // Arrange
      mockPrisma.emailIngest.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(processor.process(mockJob)).rejects.toThrow(
        'Attachment not found: test-attachment-id'
      );
    });
  });

  describe('generateSplitFilename', () => {
    it('should generate correct filename for single page', () => {
      // Act
      const filename = processor.generateSplitFilename('invoice.pdf', 1, 1);

      // Assert
      expect(filename).toBe('invoice.pdf');
    });

    it('should generate correct filename for multi-page', () => {
      // Act
      const filename = processor.generateSplitFilename('invoice.pdf', 2, 3);

      // Assert
      expect(filename).toBe('invoice_page_2_of_3.pdf');
    });

    it('should handle filename without extension', () => {
      // Act
      const filename = processor.generateSplitFilename('invoice', 1, 2);

      // Assert
      expect(filename).toBe('invoice_page_1_of_2.pdf');
    });
  });

  describe('splitPdfIntoPages', () => {
    it('should create individual PDF files for each page', async () => {
      // Arrange
      const mockPdfDoc = {
        getPageCount: jest.fn().mockReturnValue(2),
        copyPages: jest.fn()
          .mockResolvedValueOnce(['page1'])
          .mockResolvedValueOnce(['page2']),
      };

      const mockNewPdfDoc = {
        addPage: jest.fn(),
        save: jest.fn().mockResolvedValue(Buffer.from('split-pdf')),
      };

      (PDFDocument.load as jest.Mock).mockResolvedValue(mockPdfDoc);
      (PDFDocument.create as jest.Mock).mockResolvedValue(mockNewPdfDoc);
      (fs.writeFileSync as jest.Mock).mockImplementation();

      // Act
      const result = await processor.splitPdfIntoPages(
        Buffer.from('test-pdf'),
        'test.pdf',
        '/tmp'
      );

      // Assert
      expect(result).toHaveLength(2);
      expect(mockPdfDoc.copyPages).toHaveBeenCalledTimes(2);
      expect(mockNewPdfDoc.addPage).toHaveBeenCalledTimes(2);
      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
    });
  });
});