import axios from 'axios';
import { FerrySearchTicketsRequest } from '../models/FerrySearchTickets/FerrySearchTicketsRequest';
import logger from '../utils/logger';

const API_CONFIG = {
  development: {
    baseUri: 'https://barkota-reseller-php-staging-4kl27j34za-uc.a.run.app',
    endpoint: '/outlet/search-ticket/searchbyreferenceanddate'
  },
  production: {
    baseUri: 'https://barkota-reseller-php-staging-4kl27j34za-uc.a.run.app',
    endpoint: '/outlet/search-ticket/searchbyreferenceanddate'
  }
};

/**
 * Calls external Barkota API to fetch ticket data
 */

export const fetchTicketData = async (
    request: FerrySearchTicketsRequest,
    token: string,
    trackingId: string,
): Promise<any> => {
    try {
      const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
      const { baseUri, endpoint } = API_CONFIG[env];
      const url = `${baseUri}${endpoint}`;
      const timeout = parseInt(process.env.API_TIMEOUT || '30000', 10);
  
      // Log external API request
      logger.info({
        message: `API Request: ${url}`,
        trackingId,
        method: 'POST',
        url
      });
  
      const startTime = Date.now();
  
      const response = await axios({
        method: 'POST',
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'X-Request-ID': trackingId,
        },
        data: request,
        timeout,
      });
  
      const responseTime = Date.now() - startTime;
      
      // Log response
      logger.info({
        message: `API Response: ${url}`,
        trackingId,
        statusCode: response.status,
        responseTime: `${responseTime}ms`,
      });
  
      // Handle API error messages
      if (response.data && response.data.error_message) {
        throw new Error(Array.isArray(response.data.error_message) 
          ? response.data.error_message.join(', ') 
          : response.data.error_message);
      }
  
      const responseData = response.data;
  
      // Handle Barkota API error format
      if (responseData.body && responseData.body.status) {
        const errorTitle = responseData.body.title || '';
        const errorDetail = responseData.body.detail || '';
        throw new Error(`Error: ${errorTitle} - ${errorDetail}`);
      }
  
      // Make sure we have an array of tickets in the response
      if (!responseData.body || !Array.isArray(responseData.body)) {
        throw new Error("Invalid response format from Barkota API");
      }
  
      return {
        data: responseData.body,
        meta: {
          totalResults: responseData.body.length,
          requestTimestamp: new Date().toISOString(),
          trackingId,
        }
      };
    } catch (error) {
      logger.error({
        message: 'API request failed',
        trackingId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        
        if (status === 401) {
          throw new Error('Authentication failed: Invalid or expired token');
        } else if (status === 400) {
          throw new Error(`Bad request: ${JSON.stringify(error.response?.data)}`);
        }
      }
      throw error;
    }
};