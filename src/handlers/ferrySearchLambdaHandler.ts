import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { validateFerrySearchRequest } from '../utils/validation';
import { fetchFerryData } from '../services/ferrySearchService';
import AuthService from '../services/authService';
import logger from '../utils/logger';
import { randomUUID } from 'crypto';

/**
 * Lambda handler for ferry search endpoint
 */
export const ferrySearchLambdaHandler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  const trackingId = event.headers['X-Request-ID'] || randomUUID();
  
  try {
    // Log incoming request
    logger.info({
      message: 'Lambda: Ferry search request',
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
    const request = validateFerrySearchRequest(JSON.parse(requestBody));

    // Fetch ferry data
    const results = await fetchFerryData(request, token, trackingId);

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
        message: 'Ferry search completed successfully',
        data: results,
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