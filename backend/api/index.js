import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import config from '../config/env.js';
import apiRoutes from '../routes/index.js';
import { notFoundHandler, errorHandler } from '../middleware/error.middleware.js';

const app = express();

// Global Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or any domain during dev/configured clients
    if (!origin || config.nodeEnv === 'development' || !config.clientUrl || config.clientUrl === '*' || origin === config.clientUrl || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Service Endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Kinetic Routine & Habit Tracker API',
    health: '/api/health',
    version: '1.0.0',
    documentation: 'See /api routes',
  });
});

// Health Check Endpoints
const healthPayload = () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  environment: config.nodeEnv,
});

app.get('/health', (req, res) => res.json(healthPayload()));
app.get('/api/health', (req, res) => res.json(healthPayload()));

// Mount Main API Routes
app.use('/api', apiRoutes);

// Catch 404 and forward to error handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
