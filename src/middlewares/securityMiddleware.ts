import { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";

dotenv.config();

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["*"];
const allowedIPs = process.env.ALLOWED_IPS?.split(",") || [];

const securityMiddleware = {
    /**
     * Helmet Middleware (Security Headers)
     */
    helmetMiddleware: helmet(),

    /**
     * CORS Middleware
     */
    corsMiddleware: cors({
        origin: (origin, callback) => {
            if (!origin) {
                // Allow requests with no Origin (like curl, server-to-server)
                return callback(null, true);
            }
    
            const normalizedOrigin = origin.replace(/\/$/, "").trim();
            console.warn(`Blocked CORS request from origin: ${normalizedOrigin}`);
    
            if (allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes("*")) {
                return callback(null, true);
            } else {
                return callback(new Error(`CORS: Origin ${normalizedOrigin} is not allowed`), false);
            }
        },
        credentials: true,
    }),    

    /**
     * IP Filtering Middleware
     */
    ipFilterMiddleware: (req: Request, res: Response, next: NextFunction) => {
        let clientIp =
            (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

        if (clientIp) {
            // If x-forwarded-for has multiple IPs, take the first one
            clientIp = clientIp.split(",")[0].trim();

            // Normalize IPv6-mapped IPv4 addresses (e.g., ::ffff:192.168.1.59 → 192.168.1.59)
            if (clientIp.includes("::ffff:")) {
                clientIp = clientIp.split("::ffff:")[1];
            }
        }

        if (!clientIp || allowedIPs.includes("*") || allowedIPs.includes(clientIp)) {
            next();
        } else {
            res.status(403).json({ error: "Access denied. Your IP is not allowed." });
        }
    }
};

export default securityMiddleware;