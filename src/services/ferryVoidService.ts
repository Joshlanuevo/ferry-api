import axios from 'axios';
import logger from '../utils/logger';

const API_CONFIG = {
    development: {
      baseUri: 'https://barkota-reseller-php-staging-4kl27j34za-uc.a.run.app',
      endpoint: '/outlet/ticket/void/ticket',
    },
    production: {
      baseUri: 'https://barkota-reseller-php-staging-4kl27j34za-uc.a.run.app',
      endpoint: '/outlet/ticket/void/ticket',
    }
};

/**
 * Voids a ferry booking with the given booking ID
 */
export const voidFerryBooking = async (
    bookingId: string,
    remarks: string,
    token: string,
    trackingId: string,
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
      const { baseUri, endpoint } = API_CONFIG[env];
      const url = `${baseUri}${endpoint}`;
      const timeout = parseInt(process.env.API_TIMEOUT || '30000', 10);
  
      // Log external API request
      logger.info({
        message: `API Request to void booking: ${url}`,
        trackingId,
        method: 'POST',
        url,
        bookingId,
      });
  
      const response = await axios({
        method: 'POST',
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'X-Request-ID': trackingId,
        },
        data: {
          bookingId,
          remarks,
        },
        timeout,
      });
  
      // Log response
      logger.info({
        message: `API Response for void booking: ${url}`,
        trackingId,
        statusCode: response.status,
        response: response.data,
      });
  
      // Check for error in the response
      if (response.data && response.data.error) {
        return {
          success: false,
          message: response.data.error,
        };
      }
  
      return {
        success: true,
      };
    } catch (error) {
      logger.error({
        message: 'API request to void booking failed',
        trackingId,
        error: error instanceof Error ? error.message : String(error),
        bookingId,
      });
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        
        return {
          success: false,
          message: `API error (${status}): ${message}`,
        };
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
};