import { Request, Response, NextFunction } from 'express';
import { UserBalanceService } from '../services/userBalanceService';
import { isAdmin } from '../utils/user';
import { sendResponse } from '../utils/response';
import { getTrackingId } from './loggerMiddleware';
import logger from '../utils/logger';

export const extractUserFromHeaders = (req: Request, res: Response, next: NextFunction): void => {
  const trackingId = req.headers['x-tracking-id'] || 'no-tracking-id';
  const userId = req.headers['x-user-id'] as string;
  const agentId = req.headers['x-agent-id'] as string;
  const userName = req.headers['x-user-name'] as string;
  
  if (userId) {
    // Add user info to session
    if (!req.session) {
      req.session = {} as any;
    }
    
    req.session.user = {
      id: userId,
      agentId: agentId || '',
      user_name: userName || '',
    };
    
    logger.info({
      message: 'User information extracted from headers',
      trackingId,
      userId,
    });
  } else {
    logger.warn({
      message: 'No user ID found in headers',
      trackingId,
    });
  }
  
  next();
};

/**
 * Middleware to require admin permissions
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const trackingId = getTrackingId(req);
  
  if (!req.session?.user?.id) {
    logger.warn({
      message: 'Unauthenticated admin request',
      trackingId,
      path: req.path
    });
    
    sendResponse(req, res, false, 401, 'Session not found - please login first.', {
      status: 5,
      error: 'Session not found - please login first.'
    });
    return;
  }
  
  const userId = req.session.user.id;
  // Get user info and check admin status
  const user = await UserBalanceService.getUser(userId);
  
  if (!isAdmin(user)) {
    logger.warn({
      message: 'Non-admin attempting to access admin route',
      trackingId,
      userId: user?.id,
      path: req.path
    });
    
    sendResponse(req, res, false, 403, 'Permission denied. Admin access required.', {
      status: 6,
      error: 'Permission denied. Admin access required.'
    });
    return;
  }
  
  next();
}