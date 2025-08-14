# Testing Guide - PARIS AP Agent

This document outlines the testing strategy and implementation for the automated AP invoice processing system.

## Test Structure

The testing suite is organized across three main applications:

### API Tests (`apps/api`)
- **Framework**: Jest with ts-jest
- **Coverage**: Services, controllers, and integration tests
- **Location**: `apps/api/src/**/*.spec.ts`

### Workers Tests (`apps/workers`)
- **Framework**: Jest with ts-jest
- **Coverage**: Queue processors and document handling
- **Location**: `apps/workers/src/**/*.spec.ts`

### Admin UI Tests (`apps/admin`)
- **Framework**: Jest with React Testing Library
- **Coverage**: Components and authentication flows
- **Location**: `apps/admin/src/**/*.test.ts`

## Running Tests

### Run All Tests
```bash
pnpm test
```

### Run Tests by Application
```bash
# API tests only
pnpm test:api

# Workers tests only
pnpm test:workers

# Admin UI tests only
pnpm test:admin
```

### Watch Mode
```bash
# API
cd apps/api && pnpm test --watch

# Workers
cd apps/workers && pnpm test --watch

# Admin
cd apps/admin && pnpm test:watch
```

## Test Coverage

### Critical Components Tested

#### Document Processing Pipeline
- **File**: `apps/api/src/services/document-processing.service.spec.ts`
- **Coverage**:
  - PDF document processing and validation
  - Duplicate invoice detection
  - Purchase order matching algorithms
  - Variance calculation logic
  - Error handling and graceful degradation

#### ServiceTitan API Integration
- **File**: `apps/api/src/services/servicetitan.service.spec.ts`
- **Coverage**:
  - Authentication token management
  - Purchase order search and retrieval
  - Bill creation with proper mappings
  - API error handling and retry logic
  - Business unit and location queries

#### Queue Processing
- **File**: `apps/workers/src/processors/split-processor.spec.ts`
- **Coverage**:
  - PDF splitting for multi-page invoices
  - File naming conventions
  - Progress reporting
  - Error handling for corrupted PDFs
  - Database state management

#### API Endpoints
- **Files**: 
  - `apps/api/src/webhooks/webhooks.controller.spec.ts`
  - `apps/api/src/queues/queues.controller.spec.ts`
- **Coverage**:
  - Webhook request handling
  - Queue monitoring and management
  - Job retry and removal operations
  - Error response formatting

#### Authentication & Authorization
- **File**: `apps/admin/src/app/api/auth/[...nextauth]/route.test.ts`
- **Coverage**:
  - Azure AD integration
  - Role-based access control
  - Session management
  - User provisioning

### Mock Strategy

#### External Services
All external services are mocked to ensure reliable, fast tests:

- **Azure Document Intelligence**: Mocked OCR responses
- **Microsoft Graph API**: Mocked email and SharePoint operations
- **ServiceTitan API**: Mocked authentication and data endpoints
- **OpenAI API**: Mocked document enhancement responses
- **Database**: Prisma Client mocked with predictable responses

#### Queue System
- **BullMQ**: Mocked worker and queue operations
- **Redis**: In-memory mock for caching operations

#### File System
- **PDF Processing**: Mocked pdf-parse and pdf-lib operations
- **File I/O**: Mocked fs operations for predictable testing

## Test Data

### Sample Documents
Tests use standardized sample data representing common invoice scenarios:

#### Standard Invoice
```typescript
{
  supplierName: 'Test Supplier Inc.',
  invoiceNumber: 'INV-001',
  total: 112.00,
  poNumber: 'PO-12345',
  lineItems: [...] // Standard items with SKUs
}
```

#### Complex Invoice
```typescript
{
  supplierName: 'Complex Supplier',
  invoiceNumber: 'INV-999',
  total: 2500.00,
  poNumber: undefined, // No PO match scenario
  lineItems: [...] // >5 items, unknown SKUs
}
```

### ServiceTitan Test Data
```typescript
{
  purchaseOrder: {
    id: 12345,
    number: 'PO-12345',
    status: 'Open',
    businessUnitId: 1,
    jobId: 67890
  }
}
```

## Test Configuration

### Jest Configuration
Each application has its own `jest.config.js` with appropriate settings:

- **Module mapping**: Resolves workspace packages
- **Transform rules**: TypeScript and React JSX support
- **Coverage collection**: Excludes generated files and types
- **Setup files**: Common mocks and test utilities

### Environment Variables
Tests use mock environment variables to avoid requiring real API keys:

```bash
# ServiceTitan
ST_CLIENT_ID=test-client-id
ST_CLIENT_SECRET=test-client-secret

# Azure
AZURE_AD_CLIENT_ID=test-azure-client-id
AZURE_DOCUMENT_INTELLIGENCE_KEY=test-key

# OpenAI
OPENAI_API_KEY=test-openai-key
```

## Continuous Integration

### Test Pipeline
The CI/CD pipeline runs tests in this order:

1. **Dependency Installation**: `pnpm install`
2. **Linting**: `pnpm lint`
3. **Type Checking**: `pnpm typecheck`
4. **Unit Tests**: `pnpm test`
5. **Build Verification**: `pnpm build`

### Coverage Requirements
- **Minimum Coverage**: 80% line coverage
- **Critical Paths**: 95% coverage for document processing
- **Error Handling**: 90% coverage for service integrations

## Test Maintenance

### Adding New Tests
1. Create test files adjacent to source files with `.spec.ts` or `.test.ts` extension
2. Follow existing patterns for mocking and assertions
3. Update this documentation with new test scenarios

### Updating Mocks
When external APIs change:
1. Update corresponding mock responses in `/src/test/setup.ts`
2. Verify all affected tests still pass
3. Add regression tests for API changes

### Performance Testing
For performance-critical operations:
- Document processing should complete within 5 seconds
- ServiceTitan API calls should timeout appropriately
- Queue processing should handle backpressure

## Debugging Tests

### Common Issues
1. **Mock Timing**: Async operations may need `await` in test setup
2. **File Paths**: Use absolute paths in test configurations
3. **Environment Variables**: Ensure all required vars are mocked

### Debug Commands
```bash
# Run single test file
npx jest src/services/document-processing.service.spec.ts

# Debug mode
npx jest --debug src/services/document-processing.service.spec.ts

# Verbose output
npx jest --verbose
```

This comprehensive testing strategy ensures the reliability and maintainability of the PARIS AP Agent system across all critical business processes.