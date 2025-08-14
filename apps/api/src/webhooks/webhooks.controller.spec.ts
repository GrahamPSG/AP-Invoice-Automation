import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksController } from './webhooks.controller';
import { IngestService } from '../services/ingest.service';
import { createMock } from '@golevelup/ts-jest';

describe('WebhooksController', () => {
  let controller: WebhooksController;
  let ingestService: jest.Mocked<IngestService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        {
          provide: IngestService,
          useValue: createMock<IngestService>(),
        },
      ],
    }).compile();

    controller = module.get<WebhooksController>(WebhooksController);
    ingestService = module.get(IngestService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleEmailWebhook', () => {
    it('should process email webhook successfully', async () => {
      // Arrange
      const webhookPayload = {
        subscriptionId: 'test-subscription-id',
        changeType: 'created',
        resource: 'messages/ABC123',
        resourceData: {
          id: 'ABC123',
          subject: 'Invoice from Supplier',
          from: {
            emailAddress: {
              address: 'supplier@example.com',
              name: 'Test Supplier',
            },
          },
          receivedDateTime: '2024-01-15T10:00:00Z',
        },
      };

      const mockResult = {
        id: 'processed-123',
        status: 'PROCESSED',
        attachmentsProcessed: 1,
      };

      ingestService.processEmailWebhook.mockResolvedValue(mockResult);

      // Act
      const result = await controller.handleEmailWebhook(webhookPayload);

      // Assert
      expect(result).toEqual({
        success: true,
        data: mockResult,
      });
      expect(ingestService.processEmailWebhook).toHaveBeenCalledWith(webhookPayload);
    });

    it('should handle webhook processing errors', async () => {
      // Arrange
      const webhookPayload = {
        subscriptionId: 'test-subscription-id',
        changeType: 'created',
        resource: 'messages/ABC123',
        resourceData: {
          id: 'ABC123',
          subject: 'Invalid Email',
        },
      };

      ingestService.processEmailWebhook.mockRejectedValue(
        new Error('Processing failed')
      );

      // Act
      const result = await controller.handleEmailWebhook(webhookPayload);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Processing failed',
      });
    });

    it('should handle validation webhook requests', async () => {
      // Arrange
      const validationToken = 'validation-token-123';

      // Act
      const result = await controller.handleEmailWebhookValidation(validationToken);

      // Assert
      expect(result).toBe(validationToken);
    });
  });

  describe('handleServiceTitanWebhook', () => {
    it('should process ServiceTitan webhook successfully', async () => {
      // Arrange
      const webhookPayload = {
        eventType: 'PurchaseOrderUpdated',
        data: {
          id: 12345,
          number: 'PO-12345',
          status: 'Closed',
          total: 100.00,
        },
        timestamp: '2024-01-15T10:00:00Z',
      };

      const mockResult = {
        id: 'processed-456',
        eventProcessed: true,
      };

      ingestService.processServiceTitanWebhook.mockResolvedValue(mockResult);

      // Act
      const result = await controller.handleServiceTitanWebhook(webhookPayload);

      // Assert
      expect(result).toEqual({
        success: true,
        data: mockResult,
      });
      expect(ingestService.processServiceTitanWebhook).toHaveBeenCalledWith(webhookPayload);
    });

    it('should handle ServiceTitan webhook errors', async () => {
      // Arrange
      const webhookPayload = {
        eventType: 'InvalidEvent',
        data: {},
        timestamp: '2024-01-15T10:00:00Z',
      };

      ingestService.processServiceTitanWebhook.mockRejectedValue(
        new Error('Invalid event type')
      );

      // Act
      const result = await controller.handleServiceTitanWebhook(webhookPayload);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Invalid event type',
      });
    });
  });
});