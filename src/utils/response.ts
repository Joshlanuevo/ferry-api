import { Request, Response } from "express";

/**
 * Custom response function for Express handlers
 */
export const sendResponse = (
    req: Request,
    res: Response,
    status: boolean,
    code: number,
    message: string,
    data: any = null,
): void => {
    const trackingId = req.headers["x-correlation-id"];

    res.status(code).json({
        status,
        code,
        message,
        data,
        trackingId,
    });
};