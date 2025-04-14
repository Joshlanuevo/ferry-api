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
    // Always use console transport in Lambda
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add file transports when not in Lambda environment
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  try {
    logger.add(
      new winston.transports.File({ 
        filename: path.join(process.cwd(), 'logs', 'error.log'), 
        level: 'error' 
      })
    );
    logger.add(
      new winston.transports.File({ 
        filename: path.join(process.cwd(), 'logs', 'combined.log') 
      })
    );
  } catch (error) {
    console.error('Failed to initialize file logging: ', error);
  }
}

export default logger;