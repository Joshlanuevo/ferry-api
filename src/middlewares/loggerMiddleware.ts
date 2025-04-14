import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import logger from '../utils/logger';

// Middleware to add logging for each request
export const loggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Use tracking ID from Lambda if available, otherwise generate one
  if (!req.trackingId) {
    req.trackingId = randomUUID();
  }
  
  logger.info({
    message: `Incoming request: ${req.method} ${req.url}`,
    trackingId: req.trackingId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    headers: req.headers,
    user: req.session?.user?.id || 'unauthenticated'
  });
  
  // Track response time
  const start = Date.now();
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info({
      message: `Response sent: ${res.statusCode}`,
      trackingId: req.trackingId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      user: req.session?.user?.id || 'unauthenticated'
    });
  });
  
  next();
};

// Middleware to handle and log errors
export const errorLoggerMiddleware = (
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  logger.error({
    message: `Error processing request: ${err.message}`,
    trackingId: req.trackingId || 'no-tracking-id',
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.session?.user?.id || 'unauthenticated'
  });
  
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error', 
    tracking_id: req.trackingId 
  });
};

// Helper to get tracking ID from request
export const getTrackingId = (req: Request): string => {
  return req.trackingId || 'no-tracking-id';
};

// Add tracking ID to Request interface
declare global {
  namespace Express {
    interface Request {
      trackingId?: string;
    }
  }
}