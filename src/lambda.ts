import serverless from 'serverless-http';
import app from './app';
import logger from './utils/logger';

// Log when the Lambda container is initialized
logger.info('Lambda container initialized');

// Create the serverless handler
const handler = serverless(app, {
  request: (req: any, event: any, context: any) => {
    // Create a unique ID for request tracking across container invocations
    const trackingId = event.requestContext?.requestId || 
      `lambda-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
    // Add tracking ID to request object
    req.trackingId = trackingId;
    
    logger.info({
      message: `Request received: ${req.method} ${req.path}`,
      trackingId,
      path: req.path,
      method: req.method,
      headers: req.headers,
      query: req.query,
    });
  },
  response: (response: any) => {
    logger.info({
      message: `Response sent: ${response.statusCode}`,
      statusCode: response.statusCode,
    });
  }
});

export { handler };