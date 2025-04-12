// import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
// import { validateFerryComputeChargesRequest } from '../utils/validation';
// import { computeFerryCharges } from '../services/ferryComputeChargesService';
// import AuthService from '../services/authService';
// import logger from '../utils/logger';
// import { randomUUID } from 'crypto';

// /**
//  * Lambda handler for ferry compute charges endpoint
//  */
// export const ferryComputeChargesLambdaHandler = async (
//   event: APIGatewayEvent,
// ): Promise<APIGatewayProxyResult> => {
//   const trackingId = event.headers['X-Request-ID'] || randomUUID();
  
//   try {
//     // Log incoming request
//     logger.info({
//       message: 'Lambda: Ferry compute charges request',
//       trackingId,
//       method: event.httpMethod,
//       path: event.path,
//     });

//     // Extract auth token from headers or get a new one if needed
//     let token = '';
//     const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
//     token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    
//     if (!token) {
//       token = await AuthService.getToken();
//       logger.info({
//         message: 'Token retrieved for Lambda request',
//         trackingId,
//       });
//     }

//     // Parse and validate request
//     const requestBody = event.body || '{}';
//     const request = validateFerryComputeChargesRequest(JSON.parse(requestBody));

//     // Compute ferry charges
//     const results = await computeFerryCharges(request, token, trackingId);

//     // Return successful response
//     return {
//       statusCode: 200,
//       headers: { 
//         'Content-Type': 'application/json',
//         'X-Request-ID': trackingId,
//       },
//       body: JSON.stringify({
//         status: true,
//         code: 200,
//         message: 'Ferry charges computed successfully',
//         data: results,
//         trackingId,
//       }),
//     };
//   } catch (error) {
//     const statusCode = error instanceof Error ? 400 : 500;
//     const message = error instanceof Error ? error.message : 'Unexpected server error';
    
//     logger.error({
//       message: `Lambda handler error: ${message}`,
//       trackingId,
//       error: error instanceof Error ? error.stack : String(error)
//     });
    
//     return {
//       statusCode,
//       headers: { 
//         'Content-Type': 'application/json',
//         'X-Request-ID': trackingId, 
//       },
//       body: JSON.stringify({
//         status: false,
//         code: statusCode,
//         message,
//         trackingId,
//       }),
//     };
//   }
// };