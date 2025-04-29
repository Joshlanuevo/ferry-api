import axios from 'axios';
import dotenv from 'dotenv';
import { FerryErrorResponse } from '../models/FerryErrorResponse';
import { FerrySearchTicketsRequest } from '../models/FerrySearchTickets/FerrySearchTicketsRequest';
import { getApiUrl } from '../config/ferryApiConfig';

dotenv.config();

/**
 * Calls external Barkota API to fetch ticket data
 */

export const fetchTicketData = async (
    request: FerrySearchTicketsRequest,
    token: string,
): Promise<any> => {
    try {
      const url = getApiUrl('searchTickets');
      const timeout = parseInt(process.env.API_TIMEOUT || '30000', 10);
  
      const response = await axios({
        method: 'POST',
        url,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        data: request,
        timeout,
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
        }
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        if (errorData && errorData.error) {
          const errorResponse = new FerryErrorResponse(errorData);
          throw new Error(`Error: ${errorResponse.title} - ${errorResponse.detail}`);
        }
        throw new Error(`API request failed: ${error.message} - ${JSON.stringify(error.response?.data || {})}`);
      }
      throw error;
    }
};