import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import logger from '../utils/logger';

// Middleware to add trackingId and log requests/responses
export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Generate trackingId
  const trackingId = randomUUID();
  (req as any).trackingId = trackingId;
  res.setHeader('X-Request-ID', trackingId);
  
  // Log start time
  const startTime = Date.now();
  
  // Log request details
  logger.info({
    message: `Request: ${req.method} ${req.path}`,
    trackingId,
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
  });
  
  // Override end method to log response
  const originalEnd = res.end;
  res.end = function(this: Response, ...args: any[]) {
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Log response
    logger.info({
      message: `Response: ${req.method} ${req.path}`,
      trackingId,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
    });
    
    // Restore original end
    res.end = originalEnd;
    return originalEnd.apply(this, args as [any, BufferEncoding, (() => void)?]);
  } as any;
  
  next();
};

// Error logging middleware
export const errorLoggerMiddleware = (
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const trackingId = (req as any).trackingId || randomUUID();
  
  logger.error({
    message: `Error: ${err.message}`,
    trackingId,
    method: req.method,
    path: req.path,
    error: {
      name: err.name,
      stack: err.stack,
    },
  });
  
  res.status(500).json({
    status: false,
    message: 'Internal Server Error',
    trackingId,
  });
};

// Helper to get trackingId
export const getTrackingId = (req: Request): string => {
  return (req as any).trackingId || randomUUID();
};