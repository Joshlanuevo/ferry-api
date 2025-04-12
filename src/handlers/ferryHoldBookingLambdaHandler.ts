// import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
// import logger from '../utils/logger';
// import { randomUUID } from 'crypto';

// /**
//  * Lambda handler for ferry hold booking endpoint
//  */
// export const ferryHoldBookingLambdaHandler = async (
//     event: APIGatewayEvent,
//   ): Promise<APIGatewayProxyResult> => {
//     const trackingId = event.headers['X-Request-ID'] || randomUUID();
    
//     try {
//       // Log incoming request
//       logger.info({
//         message: 'Lambda: Ferry hold booking request',
//         trackingId,
//         method: event.httpMethod,
//         path: event.path,
//       });
  
//       // Return maintenance mode message
//       return {
//         statusCode: 402,
//         headers: { 
//           'Content-Type': 'application/json',
//           'X-Request-ID': trackingId,
//         },
//         body: JSON.stringify({
//           status: false,
//           code: 402,
//           message: "Ferry Module Is Under Maintenance Mode. We will notify once it's back.",
//           trackingId,
//         }),
//       };
//     } catch (error) {
//       const message = error instanceof Error ? error.message : 'Unexpected server error';
      
//       logger.error({
//         message: `Lambda handler error: ${message}`,
//         trackingId,
//         error: error instanceof Error ? error.stack : String(error)
//       });
      
//       return {
//         statusCode: 500,
//         headers: { 
//           'Content-Type': 'application/json',
//           'X-Request-ID': trackingId, 
//         },
//         body: JSON.stringify({
//           status: false,
//           code: 500,
//           message,
//           trackingId,
//         }),
//       };
//     }
// };