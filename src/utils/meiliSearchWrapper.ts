import { MeiliSearch, Index } from 'meilisearch';
import { generateTenantToken } from './generateTenantToken';
import { config } from 'dotenv';

config();

export class MeiliWrapper {
  private client: MeiliSearch;
  private index?: Index;

  constructor(host?: string, apiKey?: string) {
    if (host && apiKey) {
      this.client = new MeiliSearch({ host, apiKey });
    } else {
      this.client = new MeiliSearch({
        host: process.env.MEILI_HOST || '',
        apiKey: process.env.MEILI_APIKEY || ''
      });
    }
  }

  setIndex(indexName: string): this {
    this.index = this.client.index(indexName);
    return this;
  }

  async addDocuments(documents: any[], key?: string): Promise<any> {
    if (!this.index) throw new Error('Index not set');
    return this.index.addDocuments(documents, { primaryKey: key });
  }

  async updateDocuments(documents: any[], key?: string): Promise<any> {
    if (!this.index) throw new Error('Index not set');
    return this.index.updateDocuments(documents, { primaryKey: key });
  }

  async deleteDocument(documentId: string): Promise<any> {
    if (!this.index) throw new Error('Index not set');
    return this.index.deleteDocument(documentId);
  }

  async getMeiliUserApiKey(
    userId?: string,
    agencyId?: string,
    type?: string
  ): Promise<string> {
    // Value guards
    if (!userId && !agencyId) {
      throw new Error("Either userId or agencyId must be provided");
    }

    let filter: any = {};

    if (agencyId) {
      filter = { filter: `agency_id = ${agencyId}` };
      if (type) {
        filter = { filter: `type = ${type} AND agency_id = ${agencyId}` };
      }
    }

    if (userId) {
      filter = { filter: `userId = ${userId}` };
      if (type) {
        filter = { filter: `type = ${type} AND userId = ${userId}` };
      }
    }

    const searchRules: any = {
      '*': filter,
      'holiday_packages': {}
    };

    // Expires in 24 hours
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    const options = {
      apiKey: process.env.MEILI_APIKEY || '',
      expiresAt
    };

    const apiKeyUid = process.env.MEILI_APIKEY_UID || '';
    const token = generateTenantToken(apiKeyUid, searchRules, {
        apiKey: process.env.MEILI_APIKEY || '',
        expiresAt
    });
  
    return token;
  }
}