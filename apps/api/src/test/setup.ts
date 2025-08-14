import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    emailIngest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    supplierInvoiceDoc: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    matchResult: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    billCreation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    hold: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    vendor: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    dailySummary: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    appConfig: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  })),
}));

// Mock external services
jest.mock('../services/azure-document-intelligence.service', () => ({
  AzureDocumentIntelligenceService: jest.fn().mockImplementation(() => ({
    extractData: jest.fn(),
  })),
}));

jest.mock('../services/openai.service', () => ({
  OpenAIService: jest.fn().mockImplementation(() => ({
    enhanceParsedData: jest.fn(),
  })),
}));

jest.mock('../services/servicetitan.service', () => ({
  ServiceTitanService: jest.fn().mockImplementation(() => ({
    searchPurchaseOrders: jest.fn(),
    createBill: jest.fn(),
    getBusinessUnits: jest.fn(),
    getLocations: jest.fn(),
  })),
}));

jest.mock('../services/microsoft-graph.service', () => ({
  MicrosoftGraphService: jest.fn().mockImplementation(() => ({
    getEmailAttachments: jest.fn(),
    uploadToSharePoint: jest.fn(),
  })),
}));

jest.mock('../services/teams-notification.service', () => ({
  TeamsNotificationService: jest.fn().mockImplementation(() => ({
    sendMessage: jest.fn(),
  })),
}));

jest.mock('../services/email-notification.service', () => ({
  EmailNotificationService: jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn(),
  })),
}));