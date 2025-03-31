import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { validateFerryTicketRequest } from '../utils/validation';
import { createFerryTicket, getLatestTicket, getVoyageTotalFare } from '../services/ferryCreateTicket';
import AuthService from '../services/authService';
import logger from '../utils/logger';
import { randomUUID } from 'crypto';

/**
 * Lambda handler for ferry ticket creation endpoint
 */
export const ferryCreateTicketLambdaHandler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  const trackingId = event.headers['X-Request-ID'] || randomUUID();
  
  try {
    // Log incoming request
    logger.info({
      message: 'Lambda: Ferry ticket creation request',
      trackingId,
      method: event.httpMethod,
      path: event.path,
    });

    // Extract auth token from headers or get a new one if needed
    let token = '';
    const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
    token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    
    if (!token) {
      token = await AuthService.getToken();
      logger.info({
        message: 'Token retrieved for Lambda request',
        trackingId,
      });
    }

    // Parse and validate request
    const requestBody = event.body || '{}';
    const request = validateFerryTicketRequest(JSON.parse(requestBody));

    // Get the total voyage fare
    const totalFare = await getVoyageTotalFare(trackingId);

    // Create the ticket
    const response = await createFerryTicket(request, token, trackingId);
    
    if (!response.printUrl) {
      throw new Error("No print URL found.");
    }
    
    // Wait a bit for the system to process the ticket
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get the latest ticket data
    const ticketData = await getLatestTicket(trackingId);
    
    const confirmation_number = ticketData.transactionInfo.bookingReferenceNumber;

    // Return successful response
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'X-Request-ID': trackingId,
      },
      body: JSON.stringify({
        status: true,
        code: 200,
        message: 'Ferry ticket created successfully',
        data: {
          status: true,
          printUrl: response.printUrl,
          data: ticketData,
          booking_reference_no: confirmation_number,
          totalFare,
        },
        trackingId,
      }),
    };
  } catch (error) {
    const statusCode = error instanceof Error ? 400 : 500;
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    
    logger.error({
      message: `Lambda handler error: ${message}`,
      trackingId,
      error: error instanceof Error ? error.stack : String(error)
    });
    
    return {
      statusCode,
      headers: { 
        'Content-Type': 'application/json',
        'X-Request-ID': trackingId, 
      },
      body: JSON.stringify({
        status: false,
        code: statusCode,
        message,
        trackingId,
      }),
    };
  }
};