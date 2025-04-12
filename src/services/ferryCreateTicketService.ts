import axios from 'axios';
import dotenv from 'dotenv';
import { FerryTicketRequest } from '../models/FerryTicket/FerryTicketRequest';
import { FerryTicketResponse } from '../models/FerryTicket/FerryTicketResponse';
import { FerrySearchTicketsRequest } from '../models/FerrySearchTickets/FerrySearchTicketsRequest';
import { getApiUrl } from '../config/ferryApiConfig';
import logger from '../utils/logger';

dotenv.config();

/**
 * Creates a ferry ticket by calling the external Barkota API
 */
export const createFerryTicket = async (
  request: FerryTicketRequest,
  token: string,
  trackingId: string,
): Promise<FerryTicketResponse> => {
  try {
    const url = getApiUrl('createFerryTicket');
    const timeout = parseInt(process.env.API_TIMEOUT || '30000', 10);

    // Log external API request
    logger.info({
      message: `API Request: ${url}`,
      trackingId,
      method: 'POST',
      url,
      data: JSON.stringify(request)  // Log the request data for debugging
    });

    const startTime = Date.now();

    const response = await axios({
      method: 'POST',
      url,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Request-ID': trackingId,
        'Authorization': `Bearer ${token}`,
      },
      data: request,
      timeout,
      validateStatus: status => status < 500, // Accept only 2xx responses
    });

    const responseTime = Date.now() - startTime;
    
    // Log response
    logger.info({
      message: `API Response: ${url}`,
      trackingId,
      statusCode: response.status,
      responseTime: `${responseTime}ms`,
      responseData: response.data,
    });

      // Better handling of error responses
      if (response.status >= 400) {
      const errorData = response.data || {};
      const errorMessage = errorData.error_message || 
        (errorData.title ? `${errorData.title}: ${errorData.detail || ''}` : 'Unknown error');
        throw new Error(`API Error (${response.status}): ${errorMessage}`);
      }

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
      error: error instanceof Error ? error.message : String(error),
      request: JSON.stringify(request),
    });
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const responseData = error.response?.data;
      
      if (status === 401) {
        throw new Error('Authentication failed: Invalid or expired token');
      } else if (status === 400) {
        throw new Error(`Bad request: ${JSON.stringify(error.response?.data)}`);
      }
      // Include detailed error information
      throw new Error(`API Error (${status || 'unknown'}): ${JSON.stringify(responseData) || error.message}`);
    }
    throw error;
  }
};

/**
 * Function to search for tickets
 */
export const searchFerryTickets = async (
    searchParams: FerrySearchTicketsRequest,
    trackingId: string,
  ): Promise<any> => {
    try {
      const url = getApiUrl('searchTickets');
      const timeout = parseInt(process.env.API_TIMEOUT || '30000', 10);

      // Prepare default dates if not provided
      if (!searchParams.dateFrom) {
        searchParams.dateFrom = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }
      if (!searchParams.dateTo) {
        searchParams.dateTo = new Date().toISOString().split('T')[0];
      }
  
      // Log the request
      logger.info({
        message: `API Request: ${url}`,
        trackingId,
        method: 'POST',
        url,
        data: searchParams,
      });

      const startTime = Date.now(); // Store start time before request
  
      const response = await axios({
        method: 'POST',
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Request-ID': trackingId,
        },
        data: searchParams,
        timeout,
        validateStatus: status => status < 500,
      });

      const responseTime = Date.now() - startTime; // Calculate actual response time
  
      // Log response
      logger.info({
        message: `API Response: ${url}`,
        trackingId,
        statusCode: response.status,
        responseTime: `${responseTime}ms`,
        responseData: response.data,
      });

      if (response.status >= 400) {
        throw new Error(`API Error (${response.status}): ${JSON.stringify(response.data)}`);
      }
  
      if (response.data && response.data.error_message) {
        throw new Error(response.data.error_message);
      }
  
      // Handle different response formats
      let ticketsData;
      
      if (Array.isArray(response.data)) {
        ticketsData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        ticketsData = response.data.data;
      } else if (response.data.tickets && Array.isArray(response.data.tickets)) {
        ticketsData = response.data.tickets;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        ticketsData = response.data.results;
      } else {
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
        error: error instanceof Error ? error.message : String(error),
        searchParams: JSON.stringify(searchParams)
      });
      throw error;
    }
  };

/**
 * Gets the latest ticket
 */
export const getLatestTicket = async (trackingId: string): Promise<any[]> => {
  try {
    // Using empty search params will get all recent tickets
    const searchParams: FerrySearchTicketsRequest = {
      dateFrom: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0]
    };

    const tickets = await searchFerryTickets(searchParams, trackingId);
    
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