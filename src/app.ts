import express from 'express';
import session from 'express-session';
import serverless from 'serverless-http';
import routes from './routes';
import { errorLoggerMiddleware, loggerMiddleware } from './middlewares/loggerMiddleware';
import logger from './utils/logger';

const app = express();
const PORT = process.env.PORT || '3000';

// Session Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "my_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production", 
      httpOnly: true,
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);

// Middleware
app.use(express.json());
app.use(loggerMiddleware);

// Routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Ferry API' });
});

// Error handling middleware
app.use(errorLoggerMiddleware);

const server = app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});

// Error handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  server.close(() => process.exit(1));
});

declare module 'express-session' {
  interface SessionData {
    ferryComputeCharges?: any;
    user?: {
      id: string;
      agentId: string;
    };
  }
}

export const handler = serverless(app);