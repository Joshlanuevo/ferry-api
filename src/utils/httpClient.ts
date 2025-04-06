import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ModuleTypes } from '../enums/ModuleTypes';

export interface HttpRequestModel {
  base_uri: string;
  endpoint: string;
  method: string;
  queryParams?: Record<string, any>;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export class HttpClient {
  private axiosInstance: AxiosInstance;
  private moduleType: ModuleTypes;
  private requestModel: HttpRequestModel;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000, // Default timeout: 30 seconds
    });
    
    this.moduleType = ModuleTypes.CURRENCY_CONVERT; // Default module type
    this.requestModel = {
      base_uri: '',
      endpoint: '',
      method: 'GET',
    };
  }

  setModuleType(moduleType: ModuleTypes): void {
    this.moduleType = moduleType;
  }

  getRequestModel(): HttpRequestModel {
    return this.requestModel;
  }

  async request(requestModel: HttpRequestModel): Promise<any> {
    try {
      const config: AxiosRequestConfig = {
        method: requestModel.method,
        url: `${requestModel.base_uri}${requestModel.endpoint}`,
        params: requestModel.queryParams,
        headers: requestModel.headers,
        data: requestModel.body,
        timeout: requestModel.timeout || 30000,
      };

      const response: AxiosResponse = await this.axiosInstance.request(config);
      return { body: response.data };
    } catch (error: any) {
      if (error.response) {
        return {
          error_message: error.response.data?.message || 'API request failed',
          body: error.response.data
        };
      }
      return {
        error_message: error.message || 'Network request failed',
      };
    }
  }
}