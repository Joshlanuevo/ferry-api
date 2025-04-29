import { Request, Response } from "express";
import { sendResponse } from "../utils/response";

/**
 * Handle common error response logic
 */
export const handleErrorResponse = async (
    req: Request,
    res: Response,
    error: unknown,
    trackingId: string,
    operation: string,
  ): Promise<void> => {
    const isKnownError = error instanceof Error;
    const statusCode = isKnownError ? 400 : 500;
    const message = isKnownError
      ? (error as Error).message
      : `Internal server error. Please contact support@pinoyonlinebiz.com for assistance and present this tracking ID: ${trackingId}`;
    
    sendResponse(req, res, false, statusCode, message, error);
}