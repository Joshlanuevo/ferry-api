import session from 'express-session';
import connectDynamoDB from 'connect-dynamodb';
import AWS from 'aws-sdk';

const DynamoDBStore = connectDynamoDB(session);

export const configureSession = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

  // ✅ Configure AWS region globally
  if (isLambda && process.env.AWS_REGION) {
    AWS.config.update({
      region: process.env.AWS_REGION,
    });
  }

  const sessionOptions: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  };

  if (isLambda && (isProduction || !isDevelopment)) {
    sessionOptions.store = new DynamoDBStore({
      table: `ferry-api-sessions-${process.env.NODE_ENV || 'dev'}`,
      reapInterval: 0 // optional if you're using TTL
    });
  }

  return sessionOptions;
};