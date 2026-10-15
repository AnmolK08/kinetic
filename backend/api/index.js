import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import config from '../config/env.js';
import apiRoutes from '../routes/index.js';
import { notFoundHandler, errorHandler } from '../middleware/error.middleware.js';

const app = express();

// Global Middlewares
app.use(cors({
  origin: config.clientUrl || '*',
  credentials: true,
}));
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  });
});

// Mount Main API Routes
app.use('/api', apiRoutes);

// Catch 404 and forward to error handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
