import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/response";

const errorHandler = {
    errorLogger: (err: any, req: Request, res: Response, next: NextFunction) => {
        console.error(`[${new Date().toISOString()}] ERROR:`, err.message || err);
        console.error("Request Path:", req.method, req.path);
        console.error("Tracking ID:", req.headers["x-correlation-id"]);

        const statusCode = err.statusCode || 500;

        if (!res.headersSent) {
            return sendResponse(req, res,  false, statusCode, err.message);
        }

        next();
    }
}

export default errorHandler;