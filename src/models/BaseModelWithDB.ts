import { BaseModel } from "./BaseModel";
import { FirebaseCollections } from "../enums/FirebaseCollections";
import { FirebaseLib } from "../lib/FirebaseLib";
import { isFullArray } from "../utils/helpers";

export abstract class BaseModelWithDB extends BaseModel {
    protected collection!: FirebaseCollections;
    protected firebase: FirebaseLib;
  
    constructor(data: Partial<any> = {}) {
      super(data);
      this.firebase = new FirebaseLib();
    }
  
    abstract getDocId(): string;
  
    protected getDocIdKey(): string {
      return "id";
    }
  
    async get(docID?: string, doFill: boolean = true): Promise<Record<string, any>> {
      if (!docID) {
        docID = this.getDocId();
      }
      
      if (!docID) {
        throw new Error("Doc ID not found");
      }
      
      const fieldsForSaving = this.fieldsForFirebase();
      let data = {};
      
      if (Array.isArray(fieldsForSaving) && fieldsForSaving.length > 0) {
        const collection = this.getCollectionValue();
        data = await this.firebase.getData(collection, docID);
      }
      
      if (!isFullArray(data)) return {};
      
      if (!doFill) return data;
      
      this.fill(data);
      return data;
    }
  
    protected fill(data: Record<string, any>): void {
      Object.entries(data).forEach(([key, value]) => {
        // Use transformers for special cases if defined
        const transformedValue = this.transformers(key, value);
        
        // TypeScript needs indexing for dynamic property access
        (this as any)[key] = transformedValue;
      });
    }
  
    protected transformers(key: string, value: any): any {
      return value;
    }
  
    protected fieldsForFirebase(): string[] {
      return Object.keys(this);
    }
  
    protected getCollectionValue(): string {
      return this.collection;
    }
}