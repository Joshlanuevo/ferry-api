import express from 'express';
import dotenv from 'dotenv';
import * as middlewares from './middlewares';
import errorHandler from './middlewares/errorHandler';
import routes from './routes';

dotenv.config();

const app = express();

// Middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(middlewares.securityMiddleware.helmetMiddleware);
app.use(middlewares.securityMiddleware.corsMiddleware);
app.use(middlewares.securityMiddleware.ipFilterMiddleware);
app.use(middlewares.beforeRoutesMiddleware.injectTrackingId);
app.use(middlewares.beforeRoutesMiddleware.requestLogger);
app.use(middlewares.beforeRoutesMiddleware.rateLimiter);
app.use(middlewares.beforeRoutesMiddleware.validateRoute);
app.use(middlewares.beforeRoutesMiddleware.validateMethod);
app.use(middlewares.afterRoutesMiddleware.responseLogger);

// Routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Ferry API' });
});

app.use(errorHandler.errorLogger);

export default app;