import axios from 'axios';
import dotenv from 'dotenv';
import { getApiUrl } from '../config/ferryApiConfig';
import logger from '../utils/logger';

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
  trackingId: string,
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
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Request-ID': trackingId,
          'Authorization': `Bearer ${token}`,
        }
      }
    );

    logger.info({
      message: 'Ferry void ticket API response',
      trackingId,
      ticketId,
      response: response.data
    });

    // Check for errors in the response
    if (response.data.status) {
      const errorMsg = `Error: ${response.data.title || 'Unknown error'} - ${response.data.detail || 'No details provided'}`;
      throw new Error(errorMsg);
    }

    return response.data.success === true;
  } catch (error) {
    logger.error({
      message: 'Error voiding ferry ticket',
      trackingId,
      ticketId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    if (axios.isAxiosError(error) && error.response?.data) {
      logger.error({
        message: 'Ferry void API error response',
        trackingId,
        errorData: error.response.data
      });
    }
    
    throw error;
  }
}