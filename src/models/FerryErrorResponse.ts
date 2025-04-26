export class FerryErrorResponse {
    type: string;
    title: string;
    status: number;
    detail: string;
  
    constructor(data: Partial<FerryErrorResponse> = {}) {
      this.type = data.type ?? '';
      this.title = data.title ?? '';
      this.status = data.status ?? 0;
      this.detail = data.detail ?? '';
    }
}