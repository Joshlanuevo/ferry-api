import dotenv from 'dotenv';
import winston from 'winston';
import path from 'path';

dotenv.config();  

const logFormat = winston.format.printf(({ level, message, timestamp, trackingId, ...rest }) => {
  const logObject = {
    level,
    message,
    timestamp,
    trackingId,
    ...rest
  };
  return JSON.stringify(logObject);
});

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    logFormat
  ),
  defaultMeta: { service: 'ferry-api' },
  transports: [
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'combined.log') 
    }),
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ] : [])
  ]
});

export default logger;