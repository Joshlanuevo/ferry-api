import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import routes from './routes';
import { errorLoggerMiddleware, loggerMiddleware } from './middlewares/loggerMiddleware';

dotenv.config();

const app = express();

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is not defined in environment variables.');
}

// Session Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
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

declare module 'express-session' {
  interface SessionData {
    ferryComputeCharges?: any;
    user?: {
      id: string;
      agentId: string;
      user_name: string;
    };
  }
}

export default app;