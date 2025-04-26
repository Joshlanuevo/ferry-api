import { Request, Response, NextFunction } from "express";
import { v4 as uuid } from "uuid";
import rateLimit from "express-rate-limit";
import { getAvailableRoutes } from "../utils/generalUtils";

const beforeRoutesMiddleware = {
    /**
     * Inject Tracking ID to all incoming requests
     */
    injectTrackingId: (req: Request, res: Response, next: NextFunction) => {
        const trackingId = uuid();
        req.headers["x-correlation-id"] = trackingId;

        res.setHeader("x-correlation-id", trackingId);
        next();
    },

    /**
     * Middleware to log all incoming requests
     */
    requestLogger: (req: Request, res: Response, next: NextFunction) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        console.log("Request Body:", JSON.stringify(req.body, null, 2));
        console.log("Tracking ID:", req.headers["x-correlation-id"]);
        next();
    },

    // /**
    //  * Middleware to enforce JSON-only requests
    //  */
    // enforceJson: (req: Request, res: Response, next: NextFunction) => {
    //     if (req.headers["content-type"] !== "application/json") {
    //         const error = new Error("Invalid request. Only JSON requests are allowed.");
    //         return next(error);
    //     }
    //     next();
    // },

    /**
     * Middleware to validate routes
     */
    validateRoute: (req: Request, res: Response, next: NextFunction) => {
        const availableRoutes = getAvailableRoutes();

        const routeSet = new Set(availableRoutes.map(route => route.path));

        if (!routeSet.has(req.path)) {
            const error = new Error(`Route Not Found`);
            return next(error);
        }

        next();
    },

    /**
     * Middleware to validate that requests use the correct HTTP method for each route.
     */
    validateMethod: (req: Request, res: Response, next: NextFunction) => {
        const availableRoutes = getAvailableRoutes();

        const routeMap = availableRoutes.reduce((acc, route) => {
            acc[route.path] = route.method;
            return acc;
        }, {} as Record<string, string>);

        const expectedMethod = routeMap[req.path];

        if (expectedMethod && expectedMethod !== req.method) {
            const error = new Error(`Method Not Allowed. Use ${expectedMethod} instead of ${req.method}.`);
            return next(error);
        }

        next();
    },

    /**
     * Middleware for basic rate limiting
     * 24hr window, max 3 requests
     */
    rateLimiter: rateLimit({
        windowMs: 60 * 60 * 60 * 1000,
        max: 100,
        handler: (req: Request, res: Response, next: NextFunction) => {
            const error = new Error("Too many requests. Please try again later.");
            return next(error);
        }
    })
};

export default beforeRoutesMiddleware;