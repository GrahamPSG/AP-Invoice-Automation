import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ServiceTitanService } from './servicetitan.service';

// Mock fetch globally
global.fetch = jest.fn();

describe('ServiceTitanService', () => {
  let service: ServiceTitanService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceTitanService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'ST_BASE_URL':
                  return 'https://api.servicetitan.io';
                case 'ST_CLIENT_ID':
                  return 'test-client-id';
                case 'ST_CLIENT_SECRET':
                  return 'test-client-secret';
                case 'ST_TENANT_ID':
                  return 'test-tenant-id';
                case 'ST_BUSINESS_UNIT_ID':
                  return '1';
                case 'ST_SERVICE_STOCK_LOCATION_ID':
                  return '100';
                default:
                  return null;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ServiceTitanService>(ServiceTitanService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAccessToken', () => {
    it('should obtain access token successfully', async () => {
      // Arrange
      const mockTokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      // Act
      const token = await service.getAccessToken();

      // Assert
      expect(token).toBe('test-access-token');
      expect(fetch).toHaveBeenCalledWith(
        'https://auth.servicetitan.io/connect/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );
    });

    it('should handle token request failure', async () => {
      // Arrange
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid credentials',
      });

      // Act & Assert
      await expect(service.getAccessToken()).rejects.toThrow(
        'Failed to obtain ServiceTitan access token: 401 Unauthorized'
      );
    });

    it('should cache access token', async () => {
      // Arrange
      const mockTokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockTokenResponse,
      });

      // Act
      const token1 = await service.getAccessToken();
      const token2 = await service.getAccessToken();

      // Assert
      expect(token1).toBe('test-access-token');
      expect(token2).toBe('test-access-token');
      expect(fetch).toHaveBeenCalledTimes(1); // Token should be cached
    });
  });

  describe('searchPurchaseOrders', () => {
    it('should search purchase orders by number', async () => {
      // Arrange
      const mockPOs = {
        data: [
          {
            id: 12345,
            number: 'PO-12345',
            status: 'Open',
            total: 100.00,
            businessUnitId: 1,
            jobId: 67890,
            leadTechnicianId: 111,
          }
        ],
        hasMore: false,
        totalCount: 1,
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPOs,
        });

      // Act
      const result = await service.searchPurchaseOrders('12345');

      // Assert
      expect(result).toEqual(mockPOs.data);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/purchaseOrders'),
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': 'Bearer test-token',
            'ST-App-Key': 'test-client-id',
          },
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          text: async () => 'PO not found',
        });

      // Act & Assert
      await expect(service.searchPurchaseOrders('99999')).rejects.toThrow(
        'ServiceTitan API error: 404 Not Found'
      );
    });
  });

  describe('createBill', () => {
    it('should create a bill successfully', async () => {
      // Arrange
      const billData = {
        vendorId: 123,
        invoiceNumber: 'INV-001',
        invoiceDate: '2024-01-15',
        dueDate: '2024-02-14',
        total: 112.00,
        purchaseOrderId: 12345,
        jobId: 67890,
        businessUnitId: 1,
        items: [
          {
            sku: 'TEST-001',
            description: 'Test Item',
            quantity: 2,
            cost: 50.00,
            total: 100.00,
          }
        ],
      };

      const mockResponse = {
        id: 98765,
        number: 'BILL-98765',
        status: 'Open',
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      // Act
      const result = await service.createBill(billData);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/accounting/bills'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-token',
            'ST-App-Key': 'test-client-id',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(billData),
        })
      );
    });

    it('should handle bill creation errors', async () => {
      // Arrange
      const billData = {
        vendorId: 123,
        invoiceNumber: 'INV-001',
        invoiceDate: '2024-01-15',
        dueDate: '2024-02-14',
        total: 112.00,
        purchaseOrderId: 12345,
        jobId: 67890,
        businessUnitId: 1,
        items: [],
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          text: async () => JSON.stringify({
            error: 'validation_failed',
            details: ['Invoice number already exists']
          }),
        });

      // Act & Assert
      await expect(service.createBill(billData)).rejects.toThrow(
        'ServiceTitan API error: 400 Bad Request'
      );
    });
  });

  describe('getBusinessUnits', () => {
    it('should retrieve business units', async () => {
      // Arrange
      const mockBusinessUnits = {
        data: [
          {
            id: 1,
            name: 'Main Business Unit',
            active: true,
          }
        ],
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBusinessUnits,
        });

      // Act
      const result = await service.getBusinessUnits();

      // Assert
      expect(result).toEqual(mockBusinessUnits.data);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tenant/business-units'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('getLocations', () => {
    it('should retrieve locations', async () => {
      // Arrange
      const mockLocations = {
        data: [
          {
            id: 100,
            name: 'Service Stock',
            type: 'Truck',
            businessUnitId: 1,
          }
        ],
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockLocations,
        });

      // Act
      const result = await service.getLocations();

      // Assert
      expect(result).toEqual(mockLocations.data);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/inventory/locations'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });
});