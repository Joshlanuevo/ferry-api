import { Request, Response, NextFunction } from "express";

const afterRoutesMiddleware = {
    
    /**
     * Middleware to log all incoming responses
     */
    responseLogger: (req: Request, res: Response, next: NextFunction) => {
        const oldJson = res.json;
        res.json = function (data) {
            console.log(`[${new Date().toISOString()}] Response for ${req.method} ${req.path}`);
            console.log("Response Status:", res.statusCode);
            console.log("Response Data:", JSON.stringify(data, null, 2));
            console.log("Tracking ID:", req.headers["x-correlation-id"]);

            return oldJson.call(this, data);
        };

        next();
    },
};

export default afterRoutesMiddleware;