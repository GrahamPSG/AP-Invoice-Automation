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
    },
    billCreation: {
      create: jest.fn(),
      update: jest.fn(),
    },
    hold: {
      create: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  })),
}));

// Mock BullMQ
jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    close: jest.fn(),
  })),
}));

// Mock IORedis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  }));
});

// Mock PDF processing libraries
jest.mock('pdf-parse', () => jest.fn());
jest.mock('pdf-lib', () => ({
  PDFDocument: {
    load: jest.fn(),
    create: jest.fn(),
  },
}));

// Mock Azure services
jest.mock('@azure/ai-document-intelligence', () => ({
  DocumentIntelligenceClient: jest.fn().mockImplementation(() => ({
    beginAnalyzeDocument: jest.fn(),
  })),
  AzureKeyCredential: jest.fn(),
}));

jest.mock('@azure/storage-blob', () => ({
  BlobServiceClient: jest.fn().mockImplementation(() => ({
    getContainerClient: jest.fn(),
  })),
}));

// Mock Microsoft Graph
jest.mock('@microsoft/microsoft-graph-client', () => ({
  Client: {
    init: jest.fn().mockReturnValue({
      api: jest.fn().mockReturnValue({
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
      }),
    }),
  },
}));