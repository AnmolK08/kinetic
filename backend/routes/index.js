import express from 'express';
import routineRoutes from './routine.routes.js';
import authRoutes from './auth.routes.js';
import analyticsRoutes from './analytics.routes.js';

const router = express.Router();

router.use('/routines', routineRoutes);
router.use('/auth', authRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
