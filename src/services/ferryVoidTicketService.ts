import axios from 'axios';
import dotenv from 'dotenv';
import { FerryErrorResponse } from '../models/FerryErrorResponse';
import { getApiUrl } from '../config/ferryApiConfig';

dotenv.config();

interface VoidResponse {
  success: boolean;
  status?: string;
  title?: string;
  detail?: string;
}

/**
 * Makes a request to the Barkota API to void a ticket
 */
export async function voidTicket(
  ticketId: string, 
  remarks: string, 
  token: string,
): Promise<boolean> {
  try {
    const url = getApiUrl('voidTicket');
    const timeout = parseInt(process.env.API_TIMEOUT || '30000', 10);
    
    const response = await axios.post<VoidResponse>(
      `${url}`,
      {
        ticketId: ticketId,
        remarks: remarks,
        timeout: timeout,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      }
    );

    // Check for errors in the response
    if (response.data.status) {
      const errorMsg = `Error: ${response.data.title || 'Unknown error'} - ${response.data.detail || 'No details provided'}`;
      throw new Error(errorMsg);
    }

    return response.data.success === true;
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
}