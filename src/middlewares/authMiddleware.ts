import { Request, Response, NextFunction } from 'express';
import jwtUtil from '../utils/jwt';
import { sendResponse } from '../utils/response';

// Type declaration for augmenting Request
declare global {
    namespace Express {
      interface Request {
        user?: {
          userId: string;
          status?: string;
          role?: string;
          agency_id?: string;
          country_name?: string;
          region_name?: string;
          currency?: string;
        };
      }
    }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
  
    if (!authHeader?.startsWith('Bearer ')) {
      return sendResponse(req, res, false, 401, "Unauthorized: No token provided", null);
    }
  
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwtUtil.verifyToken(token);
  
      if (!decoded || typeof decoded !== 'object' || !('data' in decoded)) {
        throw new Error("Invalid token format");
      }
  
      req.user = decoded.data;
      next();
    } catch (error) {
      return sendResponse(req, res, false, 401, "Unauthorized: Invalid token", null);
    }
};