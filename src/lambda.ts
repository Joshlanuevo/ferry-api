import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ferrySearchLambdaHandler } from './handlers/ferrySearchLambdaHandler';

// Main Lambda handler
export const handler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  // Route to appropriate handler based on path
  if (event.path === '/ferry/search' && event.httpMethod === 'POST') {
    return ferrySearchLambdaHandler(event);
  }
  
  // Handle unsupported routes
  return {
    statusCode: 404,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: false,
      code: 404,
      message: 'Not Found',
    }),
  };
};