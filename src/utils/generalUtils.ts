import app from '../app'

export const getAvailableRoutes = () => {
    if (!app || !app._router) {
        console.log("No routes found.");
        return [];
    }

    const cleanPath = (path: string) => {
        return path
            .replace(/\\\//g, "/") // Convert "\/" to "/"
            .replace(/\(\?\=\/\|\$\)/g, "") // Remove optional trailing slashes
            .replace(/\?/g, "") // Remove any lingering "?" characters
            .replace(/\^/g, "") // Remove starting "^"
            .replace(/\$\//g, "/") // Remove ending "$/"
            .replace(/\/$/, ""); // Remove trailing slash
    };

    const getPath = (middleware: any, basePath = ""): { method: string; path: string }[] | null => {
        if (middleware.route) {
            // Extract methods and clean path
            const methods = Object.keys(middleware.route.methods).map((method) => method.toUpperCase());
            return methods.map((method) => ({
                method,
                path: cleanPath(basePath + middleware.route.path),
            }));
        } else if (middleware.name === "router" && middleware.handle.stack) {
            // Handle nested routes
            return middleware.handle.stack
                .flatMap((subMiddleware: any) =>
                    getPath(subMiddleware, cleanPath(basePath + middleware.regexp.source))
                )
                .filter(Boolean) as { method: string; path: string }[];
        }
        return null;
    };

    return app._router.stack
        .flatMap((middleware: any) => getPath(middleware))
        .filter(Boolean) as { method: string; path: string }[];
};

export const sanitizeObject = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    } else if (obj !== null && typeof obj === 'object') {
        return Object.entries(obj).reduce((acc, [key, value]) => {
            acc[key] = value === undefined ? '' : sanitizeObject(value);
            return acc;
        }, {} as any);
    }
    return obj;
};