export class ServiceTitanClient {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private tenantId: string;
  private businessUnitId: string;
  
  constructor() {
    this.baseUrl = process.env.ST_BASE_URL!;
    this.clientId = process.env.ST_CLIENT_ID!;
    this.clientSecret = process.env.ST_CLIENT_SECRET!;
    this.tenantId = process.env.ST_TENANT_ID!;
    this.businessUnitId = process.env.ST_BUSINESS_UNIT_ID!;
  }
  
  async findPO(poNumber: string) {
    // TODO: Implement PO search
    throw new Error('Not implemented');
  }
  
  async receivePO(poId: string, vendorDocumentNumber: string, attachmentData?: Buffer) {
    // TODO: Implement PO receiving
    throw new Error('Not implemented');
  }
  
  async createBill(billData: any) {
    // TODO: Implement bill creation
    throw new Error('Not implemented');
  }
  
  async findJobs(filters: any) {
    // TODO: Implement job search for suggestions
    throw new Error('Not implemented');
  }
}