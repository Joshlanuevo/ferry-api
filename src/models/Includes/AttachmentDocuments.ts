import { BaseModel } from '../BaseModel';

export class AttachmentDocuments extends BaseModel {
    id: string = '';
    name: string = '';
    url!: string;
  
    constructor(data: Partial<AttachmentDocuments> = {}) {
      super(data);
  
      // Apply transformers
      if (this.url) {
        this.url = this.url.replace(/ /g, "%20");
      }
    }
  
    getRequiredFields(): string[] {
      return ["name", "url"];
    }
}