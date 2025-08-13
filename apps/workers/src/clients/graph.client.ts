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
  
  async uploadToSharePoint(filePath: string, content: Buffer) {
    // TODO: Implement SharePoint upload
    throw new Error('Not implemented');
  }
}