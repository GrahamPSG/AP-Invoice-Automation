import { Test, TestingModule } from '@nestjs/testing';
import { DocumentProcessingService } from './document-processing.service';
import { AzureDocumentIntelligenceService } from './azure-document-intelligence.service';
import { OpenAIService } from './openai.service';
import { ServiceTitanService } from './servicetitan.service';
import { PrismaService } from './prisma.service';
import { ConfigService } from '@nestjs/config';
import { SupplierInvoiceDoc } from '@paris/shared';

describe('DocumentProcessingService', () => {
  let service: DocumentProcessingService;
  let azureService: jest.Mocked<AzureDocumentIntelligenceService>;
  let openaiService: jest.Mocked<OpenAIService>;
  let serviceTitanService: jest.Mocked<ServiceTitanService>;
  let prismaService: jest.Mocked<PrismaService>;

  const mockInvoiceDoc: SupplierInvoiceDoc = {
    id: 'test-id',
    supplierNameRaw: 'Test Supplier Inc.',
    supplierNameNormalized: 'test-supplier-inc',
    invoiceNumber: 'INV-001',
    invoiceDate: '2024-01-15',
    totalBeforeTax: { amount: 10000, currency: 'CAD' },
    gst: { amount: 500, currency: 'CAD' },
    pst: { amount: 700, currency: 'CAD' },
    total: { amount: 11200, currency: 'CAD' },
    poNumberRaw: 'PO-12345',
    poNumberCore: '12345',
    isServiceStock: true,
    lineItems: [
      {
        sku: 'TEST-001',
        description: 'Test Item',
        quantity: 2,
        unitPrice: { amount: 5000, currency: 'CAD' },
        totalPrice: { amount: 10000, currency: 'CAD' }
      }
    ],
    pageCount: 1,
    sourcePdf: { path: '/tmp/source.pdf', filename: 'source.pdf' },
    renamedPdf: { path: '/tmp/renamed.pdf', filename: 'renamed.pdf' }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentProcessingService,
        {
          provide: AzureDocumentIntelligenceService,
          useValue: {
            extractData: jest.fn(),
          },
        },
        {
          provide: OpenAIService,
          useValue: {
            enhanceParsedData: jest.fn(),
          },
        },
        {
          provide: ServiceTitanService,
          useValue: {
            searchPurchaseOrders: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            supplierInvoiceDoc: {
              create: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            matchResult: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'DEDUPE_WINDOW_DAYS':
                  return '90';
                case 'VARIANCE_CENTS':
                  return '2500';
                default:
                  return null;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<DocumentProcessingService>(DocumentProcessingService);
    azureService = module.get(AzureDocumentIntelligenceService);
    openaiService = module.get(OpenAIService);
    serviceTitanService = module.get(ServiceTitanService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processDocument', () => {
    it('should successfully process a document', async () => {
      // Arrange
      const pdfPath = '/tmp/test.pdf';
      const supplierHint = 'test-supplier';
      
      azureService.extractData.mockResolvedValue({
        supplierName: 'Test Supplier Inc.',
        invoiceNumber: 'INV-001',
        invoiceDate: '2024-01-15',
        totalBeforeTax: 100.00,
        gst: 5.00,
        pst: 7.00,
        total: 112.00,
        poNumber: 'PO-12345',
        lineItems: [
          {
            description: 'Test Item',
            quantity: 2,
            unitPrice: 50.00,
            totalPrice: 100.00
          }
        ]
      });

      openaiService.enhanceParsedData.mockResolvedValue(mockInvoiceDoc);
      
      prismaService.supplierInvoiceDoc.findFirst.mockResolvedValue(null);
      prismaService.supplierInvoiceDoc.create.mockResolvedValue({
        id: 'created-id',
        ...mockInvoiceDoc,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Act
      const result = await service.processDocument(pdfPath, supplierHint);

      // Assert
      expect(result).toBeDefined();
      expect(azureService.extractData).toHaveBeenCalledWith(pdfPath);
      expect(openaiService.enhanceParsedData).toHaveBeenCalled();
      expect(prismaService.supplierInvoiceDoc.create).toHaveBeenCalled();
    });

    it('should detect duplicate invoices', async () => {
      // Arrange
      const pdfPath = '/tmp/test.pdf';
      const supplierHint = 'test-supplier';
      
      azureService.extractData.mockResolvedValue({
        supplierName: 'Test Supplier Inc.',
        invoiceNumber: 'INV-001',
        invoiceDate: '2024-01-15',
        totalBeforeTax: 100.00,
        gst: 5.00,
        pst: 7.00,
        total: 112.00,
        poNumber: 'PO-12345',
        lineItems: []
      });

      openaiService.enhanceParsedData.mockResolvedValue(mockInvoiceDoc);
      
      // Mock existing duplicate
      prismaService.supplierInvoiceDoc.findFirst.mockResolvedValue({
        id: 'existing-id',
        ...mockInvoiceDoc,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Act & Assert
      await expect(service.processDocument(pdfPath, supplierHint))
        .rejects.toThrow('Duplicate invoice detected');
    });

    it('should handle processing errors gracefully', async () => {
      // Arrange
      const pdfPath = '/tmp/test.pdf';
      const supplierHint = 'test-supplier';
      
      azureService.extractData.mockRejectedValue(new Error('OCR failed'));

      // Act & Assert
      await expect(service.processDocument(pdfPath, supplierHint))
        .rejects.toThrow('OCR failed');
    });
  });

  describe('matchToPurchaseOrder', () => {
    it('should find exact PO match', async () => {
      // Arrange
      const mockPO = {
        id: 12345,
        number: 'PO-12345',
        status: 'Open',
        total: 112.00,
        businessUnitId: 1,
        jobId: 67890,
        leadTechnicianId: 111,
        items: [
          {
            sku: 'TEST-001',
            description: 'Test Item',
            quantity: 2,
            cost: 50.00
          }
        ]
      };

      serviceTitanService.searchPurchaseOrders.mockResolvedValue([mockPO]);
      
      prismaService.matchResult.create.mockResolvedValue({
        id: 'match-id',
        supplierInvoiceDocId: 'test-id',
        serviceTitanPoId: 12345,
        matchType: 'EXACT',
        matchScore: 1.0,
        totalVarianceCents: 0,
        createdAt: new Date(),
      } as any);

      // Act
      const result = await service.matchToPurchaseOrder(mockInvoiceDoc);

      // Assert
      expect(result).toBeDefined();
      expect(result.matchType).toBe('EXACT');
      expect(result.matchScore).toBe(1.0);
      expect(serviceTitanService.searchPurchaseOrders).toHaveBeenCalledWith('12345');
    });

    it('should handle no PO match', async () => {
      // Arrange
      serviceTitanService.searchPurchaseOrders.mockResolvedValue([]);
      
      prismaService.matchResult.create.mockResolvedValue({
        id: 'match-id',
        supplierInvoiceDocId: 'test-id',
        serviceTitanPoId: null,
        matchType: 'NO_MATCH',
        matchScore: 0,
        totalVarianceCents: null,
        createdAt: new Date(),
      } as any);

      // Act
      const result = await service.matchToPurchaseOrder(mockInvoiceDoc);

      // Assert
      expect(result.matchType).toBe('NO_MATCH');
      expect(result.matchScore).toBe(0);
    });

    it('should calculate variance correctly', async () => {
      // Arrange
      const mockPO = {
        id: 12345,
        number: 'PO-12345',
        status: 'Open',
        total: 110.00, // $22 difference
        businessUnitId: 1,
        jobId: 67890,
        leadTechnicianId: 111,
        items: []
      };

      serviceTitanService.searchPurchaseOrders.mockResolvedValue([mockPO]);
      
      prismaService.matchResult.create.mockResolvedValue({
        id: 'match-id',
        supplierInvoiceDocId: 'test-id',
        serviceTitanPoId: 12345,
        matchType: 'PARTIAL',
        matchScore: 0.8,
        totalVarianceCents: 200, // $2.00 difference
        createdAt: new Date(),
      } as any);

      // Act
      const result = await service.matchToPurchaseOrder(mockInvoiceDoc);

      // Assert
      expect(result.totalVarianceCents).toBe(200);
    });
  });
});