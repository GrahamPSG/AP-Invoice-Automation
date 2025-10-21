import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';

export class GraphClient {
  private client: Client;
  
  constructor() {
    const credential = new ClientSecretCredential(
      process.env.GRAPH_TENANT_ID!,
      process.env.GRAPH_CLIENT_ID!,
      process.env.GRAPH_CLIENT_SECRET!
    );
    
    const authProvider = new TokenCredentialAuthenticationProvider(
      credential,
      { scopes: ['https://graph.microsoft.com/.default'] }
    );
    
    this.client = Client.initWithMiddleware({ authProvider });
  }
  
  async getMessage(messageId: string) {
    return await this.client
      .api(`/users/${process.env.GRAPH_SHARED_MAILBOX}/messages/${messageId}`)
      .expand('attachments')
      .get();
  }
  
  async getAttachment(messageId: string, attachmentId: string) {
    return await this.client
      .api(`/users/${process.env.GRAPH_SHARED_MAILBOX}/messages/${messageId}/attachments/${attachmentId}`)
      .get();
  }
  
  /**
   * Upload a file to SharePoint
   * @param fileName - Name of the file to upload
   * @param content - File content as Buffer
   * @param destinationPath - Path relative to the drive root (e.g., "Paris Service Group - Documents/Supplier Invoices")
   * @returns Upload response from SharePoint
   */
  async uploadToSharePoint(fileName: string, content: Buffer, destinationPath: string) {
    const siteId = process.env.SP_SITE_ID!;
    const driveId = process.env.SP_DRIVE_ID!;

    // Ensure destination path doesn't start with /
    const cleanPath = destinationPath.replace(/^\/+/, '');

    // Encode the file path for URL
    const encodedPath = encodeURIComponent(`${cleanPath}/${fileName}`);

    try {
      // For files larger than 4MB, we should use createUploadSession
      // For now, use simple upload (works for files < 4MB)
      const result = await this.client
        .api(`/sites/${siteId}/drives/${driveId}/root:/${cleanPath}/${fileName}:/content`)
        .put(content);

      return result;
    } catch (error: any) {
      throw new Error(`SharePoint upload failed: ${error.message}`);
    }
  }

  /**
   * List recent messages from the shared mailbox
   * @param top - Number of messages to retrieve (default 50)
   * @returns Array of message objects
   */
  async listMessages(top: number = 50) {
    return await this.client
      .api(`/users/${process.env.GRAPH_SHARED_MAILBOX}/messages`)
      .top(top)
      .select('id,subject,from,receivedDateTime,hasAttachments')
      .orderby('receivedDateTime DESC')
      .get();
  }
}