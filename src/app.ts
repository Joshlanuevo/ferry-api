import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import DynamoDBStore from 'connect-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import * as middlewares from './middlewares';
import errorHandler from './middlewares/errorHandler';
import routes from './routes';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

app.use(middlewares.securityMiddleware.helmetMiddleware);
app.use(middlewares.securityMiddleware.corsMiddleware);
app.use(middlewares.securityMiddleware.ipFilterMiddleware);
app.use(middlewares.beforeRoutesMiddleware.injectTrackingId);
app.use(middlewares.beforeRoutesMiddleware.requestLogger);
app.use(middlewares.beforeRoutesMiddleware.rateLimiter);

// Configure session for serverless environment
const DynamoStore = DynamoDBStore(session);
const dynamoDbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const isServerless = process.env.IS_OFFLINE !== 'true' && process.env.AWS_EXECUTION_ENV !== undefined;

// Use different session storage based on environment
const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || 'my-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// Use DynamoDB session store in serverless environment
if (isServerless) {
  sessionConfig.store = new DynamoStore({
    client: dynamoDbClient,
    table: `${process.env.SERVICE_NAME || 'attractions-api'}-${process.env.NODE_ENV || 'dev'}-sessions`,
    readCapacityUnits: 1,
    writeCapacityUnits: 1,
  });
}

app.use(session(sessionConfig));

// Routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Ferry API' });
});

app.use(middlewares.beforeRoutesMiddleware.validateRoute);
app.use(middlewares.beforeRoutesMiddleware.validateMethod);

app.use(middlewares.afterRoutesMiddleware.responseLogger);
app.use(errorHandler.errorLogger);

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