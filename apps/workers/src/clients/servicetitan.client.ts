import { logger } from '../utils/logger';
import { retryWithBackoff } from '@paris/shared';

export interface ServiceTitanPO {
  id: string;
  number: string;
  status: 'Open' | 'Sent' | 'PartiallyReceived' | 'Received' | 'Cancelled';
  vendorId: string;
  vendorName: string;
  jobId?: string;
  jobNumber?: string;
  locationId?: string;
  techniciansOnJob?: ServiceTitanTechnician[];
  total: number;
  items: ServiceTitanPOItem[];
  createdOn: string;
  sentOn?: string;
}

export interface ServiceTitanPOItem {
  id: string;
  skuId: string;
  skuName: string;
  description: string;
  quantity: number;
  cost: number;
  receivedQuantity?: number;
}

export interface ServiceTitanTechnician {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  truckId?: string;
  truckName?: string;
}

export interface ServiceTitanJob {
  id: string;
  number: string;
  customerName: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  appointmentDate?: string;
  total?: number;
  status: string;
}

export interface ServiceTitanVendor {
  id: string;
  name: string;
  isActive: boolean;
  accountNumber?: string;
}

export interface ServiceTitanBill {
  id: string;
  vendorId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  total: number;
  status: 'Draft' | 'PendingApproval' | 'Approved' | 'Paid';
  lineItems: ServiceTitanBillItem[];
}

export interface ServiceTitanBillItem {
  skuId: string;
  description: string;
  quantity: number;
  unitCost: number;
  total: number;
  jobId?: string;
  technicianId?: string;
  locationId?: string;
}

export class ServiceTitanClient {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private tenantId: string;
  private businessUnitId: string;
  private accessToken?: string;
  private tokenExpiry?: Date;
  
  constructor() {
    this.baseUrl = process.env.ST_BASE_URL!;
    this.clientId = process.env.ST_CLIENT_ID!;
    this.clientSecret = process.env.ST_CLIENT_SECRET!;
    this.tenantId = process.env.ST_TENANT_ID!;
    this.businessUnitId = process.env.ST_BUSINESS_UNIT_ID!;
    
    if (!this.baseUrl || !this.clientId || !this.clientSecret) {
      throw new Error('ServiceTitan credentials not configured');
    }
  }
  
  async findPO(poNumber: string): Promise<ServiceTitanPO | null> {
    try {
      logger.info(`Searching for PO: ${poNumber}`);
      
      const response = await this.makeRequest(
        `GET`,
        `/purchasing/v2/tenant/${this.tenantId}/purchase-orders`,
        {
          params: {
            number: poNumber,
            businessUnitId: this.businessUnitId,
            pageSize: 10,
          }
        }
      );

      const pos = response.data;
      if (!pos || pos.length === 0) {
        logger.info(`No PO found with number: ${poNumber}`);
        return null;
      }

      // Find exact match first
      let po = pos.find((p: any) => p.number === poNumber);
      
      // If no exact match, try fuzzy matching (remove suffix)
      if (!po && poNumber.includes('-')) {
        const coreNumber = poNumber.replace(/-\d+$/, '');
        po = pos.find((p: any) => p.number === coreNumber);
      }

      if (!po) {
        logger.info(`No matching PO found for: ${poNumber}`);
        return null;
      }

      // Get detailed PO info including items
      const detailedPO = await this.makeRequest(
        'GET',
        `/purchasing/v2/tenant/${this.tenantId}/purchase-orders/${po.id}`
      );

      return this.mapPOResponse(detailedPO);
      
    } catch (error) {
      logger.error(`Failed to find PO ${poNumber}:`, error);
      throw new Error(`ServiceTitan API error: ${error.message}`);
    }
  }
  
  async receivePO(
    poId: string, 
    vendorDocumentNumber: string, 
    attachmentData?: Buffer,
    lineItems?: { skuId: string; receivedQuantity: number }[]
  ): Promise<{ success: boolean; billId?: string }> {
    try {
      logger.info(`Receiving PO: ${poId}`);

      // First, create the receipt
      const receiptPayload = {
        vendorDocumentNumber,
        receivedItems: lineItems || [],
        notes: `Auto-received by PARIS AP Agent - Invoice: ${vendorDocumentNumber}`,
      };

      const receiptResponse = await this.makeRequest(
        'POST',
        `/purchasing/v2/tenant/${this.tenantId}/purchase-orders/${poId}/receipts`,
        { body: receiptPayload }
      );

      // If auto-billing is enabled, a bill should be auto-created
      // Check if bill was created
      const bills = await this.findBillsByVendorDocument(vendorDocumentNumber);
      let billId = bills.length > 0 ? bills[0].id : undefined;

      // Upload attachment if provided and bill exists
      if (attachmentData && billId) {
        await this.uploadBillAttachment(billId, attachmentData, vendorDocumentNumber);
      }

      logger.info(`PO ${poId} received successfully. Bill ID: ${billId}`);

      return {
        success: true,
        billId,
      };
      
    } catch (error) {
      logger.error(`Failed to receive PO ${poId}:`, error);
      
      // Check if this is a negative quantity error
      if (error.message.includes('negative') || error.message.includes('quantity')) {
        throw new Error('NEGATIVE_QUANTITY_ERROR');
      }
      
      throw new Error(`ServiceTitan receipt error: ${error.message}`);
    }
  }
  
  async createBill(billData: {
    vendorId: string;
    invoiceNumber: string;
    invoiceDate: string;
    total: number;
    lineItems: ServiceTitanBillItem[];
    jobId?: string;
    poId?: string;
  }): Promise<ServiceTitanBill> {
    try {
      logger.info(`Creating bill for vendor ${billData.vendorId}, invoice ${billData.invoiceNumber}`);

      const payload = {
        vendorId: billData.vendorId,
        invoiceNumber: billData.invoiceNumber,
        invoiceDate: billData.invoiceDate,
        total: billData.total / 100, // Convert from cents to dollars
        jobId: billData.jobId,
        purchaseOrderId: billData.poId,
        lineItems: billData.lineItems.map(item => ({
          skuId: item.skuId,
          description: item.description,
          quantity: item.quantity,
          unitCost: item.unitCost / 100, // Convert from cents
          total: item.total / 100,
          jobId: item.jobId,
          technicianId: item.technicianId,
          locationId: item.locationId,
        })),
      };

      const response = await this.makeRequest(
        'POST',
        `/accounting/v2/tenant/${this.tenantId}/bills`,
        { body: payload }
      );

      return this.mapBillResponse(response);
      
    } catch (error) {
      logger.error(`Failed to create bill:`, error);
      throw new Error(`ServiceTitan bill creation error: ${error.message}`);
    }
  }

  async finalizeBill(billId: string): Promise<void> {
    try {
      await this.makeRequest(
        'POST',
        `/accounting/v2/tenant/${this.tenantId}/bills/${billId}/approve`
      );
      
      logger.info(`Bill ${billId} finalized`);
    } catch (error) {
      logger.error(`Failed to finalize bill ${billId}:`, error);
      throw error;
    }
  }

  async adjustBillAmount(billId: string, newTotal: number, reason: string): Promise<void> {
    try {
      const payload = {
        total: newTotal / 100, // Convert to dollars
        adjustmentReason: reason,
      };

      await this.makeRequest(
        'PATCH',
        `/accounting/v2/tenant/${this.tenantId}/bills/${billId}`,
        { body: payload }
      );
      
      logger.info(`Bill ${billId} amount adjusted to ${newTotal} cents`);
    } catch (error) {
      logger.error(`Failed to adjust bill ${billId}:`, error);
      throw error;
    }
  }
  
  async findJobs(filters: {
    customerName?: string;
    address?: string;
    dateFrom?: string;
    dateTo?: string;
    amountRange?: { min: number; max: number };
  }): Promise<ServiceTitanJob[]> {
    try {
      const params: any = {
        businessUnitId: this.businessUnitId,
        pageSize: 50,
      };

      if (filters.customerName) {
        params.customerName = filters.customerName;
      }

      if (filters.dateFrom) {
        params.modifiedOnOrAfter = filters.dateFrom;
      }

      if (filters.dateTo) {
        params.modifiedBefore = filters.dateTo;
      }

      const response = await this.makeRequest(
        'GET',
        `/jpm/v2/tenant/${this.tenantId}/jobs`,
        { params }
      );

      let jobs = response.data || [];

      // Client-side filtering for complex criteria
      if (filters.address) {
        jobs = jobs.filter((job: any) => 
          job.address?.street?.toLowerCase().includes(filters.address!.toLowerCase()) ||
          job.address?.city?.toLowerCase().includes(filters.address!.toLowerCase())
        );
      }

      if (filters.amountRange) {
        jobs = jobs.filter((job: any) => {
          const total = job.total || 0;
          return total >= filters.amountRange!.min && total <= filters.amountRange!.max;
        });
      }

      return jobs.map(this.mapJobResponse);
      
    } catch (error) {
      logger.error('Failed to find jobs:', error);
      return [];
    }
  }

  async findVendorByName(vendorName: string): Promise<ServiceTitanVendor | null> {
    try {
      const response = await this.makeRequest(
        'GET',
        `/settings/v2/tenant/${this.tenantId}/vendors`,
        {
          params: {
            name: vendorName,
            isActive: true,
            pageSize: 20,
          }
        }
      );

      const vendors = response.data || [];
      
      // Exact match first
      let vendor = vendors.find((v: any) => 
        v.name.toLowerCase() === vendorName.toLowerCase()
      );

      // Fuzzy match if no exact match
      if (!vendor) {
        vendor = vendors.find((v: any) => 
          v.name.toLowerCase().includes(vendorName.toLowerCase()) ||
          vendorName.toLowerCase().includes(v.name.toLowerCase())
        );
      }

      return vendor ? this.mapVendorResponse(vendor) : null;
      
    } catch (error) {
      logger.error(`Failed to find vendor ${vendorName}:`, error);
      return null;
    }
  }

  async getTechniciansByJob(jobId: string): Promise<ServiceTitanTechnician[]> {
    try {
      const response = await this.makeRequest(
        'GET',
        `/jpm/v2/tenant/${this.tenantId}/jobs/${jobId}/appointments`
      );

      const appointments = response.data || [];
      const technicians: ServiceTitanTechnician[] = [];

      for (const appointment of appointments) {
        if (appointment.technicians) {
          for (const tech of appointment.technicians) {
            // Get truck/location info
            const techDetails = await this.getTechnicianDetails(tech.id);
            technicians.push(techDetails);
          }
        }
      }

      return technicians;
      
    } catch (error) {
      logger.error(`Failed to get technicians for job ${jobId}:`, error);
      return [];
    }
  }

  private async getTechnicianDetails(techId: string): Promise<ServiceTitanTechnician> {
    try {
      const response = await this.makeRequest(
        'GET',
        `/settings/v2/tenant/${this.tenantId}/technicians/${techId}`
      );

      return this.mapTechnicianResponse(response);
    } catch (error) {
      logger.error(`Failed to get technician details for ${techId}:`, error);
      return {
        id: techId,
        name: 'Unknown',
        email: '',
        employeeId: '',
      };
    }
  }

  private async findBillsByVendorDocument(vendorDocumentNumber: string): Promise<ServiceTitanBill[]> {
    try {
      const response = await this.makeRequest(
        'GET',
        `/accounting/v2/tenant/${this.tenantId}/bills`,
        {
          params: {
            invoiceNumber: vendorDocumentNumber,
            pageSize: 10,
          }
        }
      );

      return (response.data || []).map(this.mapBillResponse);
    } catch (error) {
      logger.error('Failed to find bills by vendor document:', error);
      return [];
    }
  }

  private async uploadBillAttachment(billId: string, attachmentData: Buffer, filename: string): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', new Blob([attachmentData]), `${filename}.pdf`);

      await this.makeRequest(
        'POST',
        `/accounting/v2/tenant/${this.tenantId}/bills/${billId}/attachments`,
        { 
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      logger.info(`Attachment uploaded for bill ${billId}`);
    } catch (error) {
      logger.error(`Failed to upload attachment for bill ${billId}:`, error);
      // Don't throw - attachment upload is not critical
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      const response = await fetch(`${this.baseUrl}/connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000); // Refresh 1 min early

      logger.info('ServiceTitan access token refreshed');
      return this.accessToken;
      
    } catch (error) {
      logger.error('Failed to get ServiceTitan access token:', error);
      throw new Error('ServiceTitan authentication failed');
    }
  }

  private async makeRequest(
    method: string, 
    endpoint: string, 
    options: { 
      body?: any; 
      params?: Record<string, any>; 
      headers?: Record<string, string>;
    } = {}
  ): Promise<any> {
    return retryWithBackoff(async () => {
      const token = await this.getAccessToken();
      
      let url = `${this.baseUrl}${endpoint}`;
      if (options.params) {
        const searchParams = new URLSearchParams();
        Object.entries(options.params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });
        url += `?${searchParams.toString()}`;
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'ST-App-Key': this.clientId,
        ...options.headers,
      };

      if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(url, {
        method,
        headers,
        body: options.body instanceof FormData 
          ? options.body 
          : options.body 
            ? JSON.stringify(options.body) 
            : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ServiceTitan API error: ${response.status} ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return await response.text();
    }, 3, 1000);
  }

  private mapPOResponse(data: any): ServiceTitanPO {
    return {
      id: data.id,
      number: data.number,
      status: data.status,
      vendorId: data.vendorId,
      vendorName: data.vendor?.name || 'Unknown',
      jobId: data.jobId,
      jobNumber: data.job?.number,
      locationId: data.locationId,
      total: Math.round((data.total || 0) * 100), // Convert to cents
      items: (data.items || []).map((item: any) => ({
        id: item.id,
        skuId: item.skuId,
        skuName: item.sku?.name || item.description,
        description: item.description,
        quantity: item.quantity,
        cost: Math.round((item.cost || 0) * 100),
        receivedQuantity: item.receivedQuantity || 0,
      })),
      createdOn: data.createdOn,
      sentOn: data.sentOn,
    };
  }

  private mapBillResponse(data: any): ServiceTitanBill {
    return {
      id: data.id,
      vendorId: data.vendorId,
      invoiceNumber: data.invoiceNumber,
      invoiceDate: data.invoiceDate,
      dueDate: data.dueDate,
      total: Math.round((data.total || 0) * 100),
      status: data.status,
      lineItems: (data.lineItems || []).map((item: any) => ({
        skuId: item.skuId,
        description: item.description,
        quantity: item.quantity,
        unitCost: Math.round((item.unitCost || 0) * 100),
        total: Math.round((item.total || 0) * 100),
        jobId: item.jobId,
        technicianId: item.technicianId,
        locationId: item.locationId,
      })),
    };
  }

  private mapJobResponse(data: any): ServiceTitanJob {
    return {
      id: data.id,
      number: data.number,
      customerName: data.customer?.name || 'Unknown',
      address: {
        street: data.location?.address?.street || '',
        city: data.location?.address?.city || '',
        state: data.location?.address?.state || '',
        zip: data.location?.address?.zip || '',
      },
      appointmentDate: data.appointmentDate,
      total: Math.round((data.total || 0) * 100),
      status: data.status,
    };
  }

  private mapVendorResponse(data: any): ServiceTitanVendor {
    return {
      id: data.id,
      name: data.name,
      isActive: data.isActive,
      accountNumber: data.accountNumber,
    };
  }

  private mapTechnicianResponse(data: any): ServiceTitanTechnician {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      employeeId: data.employeeId,
      truckId: data.truck?.id,
      truckName: data.truck?.name,
    };
  }
}