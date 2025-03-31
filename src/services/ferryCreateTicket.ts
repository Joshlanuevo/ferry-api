import axios from 'axios';
import { FerryTicketRequest } from '../models/FerryTicket/FerryTicketRequest';
import { FerryTicketResponse } from '../models/FerryTicket/FerryTicketResponse';
import logger from '../utils/logger';

const API_CONFIG = {
  development: {
    baseUri: 'https://barkota-reseller-php-staging-4kl27j34za-uc.a.run.app',
    endpoint: '/outlet/confirm-booking'
  },
  production: {
    baseUri: 'https://barkota-reseller-php-staging-4kl27j34za-uc.a.run.app',
    endpoint: '/outlet/confirm-booking'
  }
};

/**
 * Creates a ferry ticket by calling the external Barkota API
 */
export const createFerryTicket = async (
  request: FerryTicketRequest,
  token: string,
  trackingId: string,
): Promise<FerryTicketResponse> => {
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
      throw new Error(response.data.error_message);
    }

    // Check if response has status property indicating an error
    if (response.data && response.data.status) {
      const errorMsg = `Error: ${response.data.title || 'Unknown error'} - ${response.data.detail || 'No details provided'}`;
      throw new Error(errorMsg);
    }

    // Validate response format
    if (!response.data || typeof response.data !== 'object') {
      throw new Error("Invalid response format from Barkota API");
    }

    return {
      ...response.data,
      meta: {
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

/**
 * Function to search for tickets
 */
export const searchFerryTickets = async (
    dateFrom: string = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: string = new Date().toISOString().split('T')[0],
    token: string,
    trackingId: string,
  ): Promise<any> => {
    try {
      const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
      const baseUri = API_CONFIG[env].baseUri;
      const url = `${baseUri}/outlet/search-ticket/searchbyreferenceanddate`;
      const timeout = parseInt(process.env.API_TIMEOUT || '30000', 10);
  
      // Log the request
      logger.info({
        message: `API Request: ${url}`,
        trackingId,
        method: 'POST',
        url
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
          dateFrom,
          dateTo
        },
        timeout,
      });
  
      // Log the response structure to see what we're getting
      logger.info({
        message: 'Ticket search response structure',
        trackingId,
        responseStructure: {
          keys: Object.keys(response.data),
          hasData: !!response.data.data,
          dataType: response.data.data ? typeof response.data.data : 'undefined',
          isDataArray: Array.isArray(response.data.data)
        }
      });
  
      if (response.data && response.data.error_message) {
        throw new Error(response.data.error_message);
      }
  
      // Handle different response formats
      let ticketsData;
      
      if (Array.isArray(response.data)) {
        // If response is directly an array
        ticketsData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // If response has a data property that's an array
        ticketsData = response.data.data;
      } else if (response.data.tickets && Array.isArray(response.data.tickets)) {
        // Some APIs use 'tickets' as the key
        ticketsData = response.data.tickets;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        // Some APIs use 'results' as the key
        ticketsData = response.data.results;
      } else {
        // If we can't find any expected format, log the response and throw an error
        logger.error({
          message: 'Unexpected API response format',
          trackingId,
          responseData: response.data
        });
        throw new Error("Invalid response format from Barkota API. Expected data array.");
      }
  
      return ticketsData;
    } catch (error) {
      logger.error({
        message: 'Ticket search failed',
        trackingId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  };

/**
 * Gets the latest ticket
 */
export const getLatestTicket = async (token: string, trackingId: string): Promise<any[]> => {
  try {
    const tickets = await searchFerryTickets(undefined, undefined, token, trackingId);
    
    if (!tickets || tickets.length === 0) {
      throw new Error("No tickets found.");
    }
    
    // Group tickets by booking reference number
    const ticketGroups: Record<string, any[]> = {};
    for (const ticket of tickets) {
      const refNo = ticket.transactionInfo?.bookingReferenceNumber;
      if (!refNo) continue;
      
      if (!ticketGroups[refNo]) {
        ticketGroups[refNo] = [];
      }
      ticketGroups[refNo].push(ticket);
    }
    
    // Return the first group (latest tickets)
    const ticketGroupsArray = Object.values(ticketGroups);
    if (ticketGroupsArray.length === 0) {
      throw new Error("No valid tickets found.");
    }
    
    return ticketGroupsArray[0];
  } catch (error) {
    logger.error({
      message: 'Failed to get latest ticket',
      trackingId,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
};

/**
 * Gets the total fare from voyage data
 */
export const getVoyageTotalFare = async (cachedComputeCharges: any): Promise<number> => {
  if (!cachedComputeCharges || typeof cachedComputeCharges !== 'object') {
    throw new Error("No cached compute charges found.");
  }
  
  return cachedComputeCharges.total;
};