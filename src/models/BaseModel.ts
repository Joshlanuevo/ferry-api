export class BaseModel {
    constructor(data: Record<string, any> = {}) {
      this.initializeFromData(data);
    }
  
    protected initializeFromData(data: Record<string, any>): void {
      for (const [key, value] of Object.entries(data)) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          (this as any)[key] = this.transformers(key, value);
        }
      }
    }
  
    protected transformers(key: string, value: any): any {
      return value;
    }
}