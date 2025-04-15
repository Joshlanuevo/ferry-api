import { Request, Response, NextFunction } from 'express';
import { decryptMessage } from '../utils/encryption';
import logger from '../utils/logger';

// Extend the Request interface to include browserUid
declare global {
  namespace Express {
    interface Request {
      browserUid?: string;
    }
  }
}

export const validateSessionKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const trackingId = req.headers['x-tracking-id'] || 'no-tracking-id';
  const sessionKey = req.headers['session-key'];

  try {
    // No session key provided
    if (!sessionKey || typeof sessionKey !== 'string') {
      logger.warn({
        message: 'Missing or invalid Session-Key header',
        trackingId,
      });
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized: Invalid or missing session key' 
      });
      return;
    }

    // Decrypt the session key
    const decrypted = await decryptMessage(sessionKey);
    
    // Session key format should be: "browser_uid_timestamp"
    const parts = decrypted.split('_');
    if (parts.length !== 2) {
      logger.warn({
        message: 'Malformed Session-Key format',
        trackingId,
      });
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized: Invalid session key format' 
      });
      return;
    }

    const [browserUid, timestamp] = parts;
    const keyTimestamp = parseInt(timestamp, 10);
    const currentTime = Date.now();
    
    // Check if the key is expired (e.g., 1 hour)
    const SESSION_KEY_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
    if (currentTime - keyTimestamp > SESSION_KEY_EXPIRY_MS) {
      logger.warn({
        message: 'Expired Session-Key',
        trackingId,
        keyAge: (currentTime - keyTimestamp) / 1000 / 60, // in minutes
      });
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized: Session key expired' 
      });
      return;
    }

    // Store the browser UID in the request for later use if needed
    req.browserUid = browserUid;
    
    next();
  } catch (error) {
    logger.error({
      message: 'Error validating Session-Key',
      trackingId,
      error: error instanceof Error ? error.message : String(error),
    });
    
    res.status(401).json({ 
      success: false, 
      message: 'Unauthorized: Unable to validate session key' 
    });
    return;
  }
};