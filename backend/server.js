import app from './api/index.js';
import config from './config/env.js';
import prisma from './config/prisma.js';
import { initCronJobs } from './cron/routine-scheduler.cron.js';

const server = app.listen(config.port, () => {
  console.log(`===============================================`);
  console.log(`🚀 Kinetic Backend running on port ${config.port}`);
  console.log(`📡 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Health Check: http://localhost:${config.port}/api/health`);
  console.log(`===============================================`);

  // Initialize background cron jobs
  initCronJobs();
});

// Graceful Shutdown
const shutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Prisma disconnected.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
