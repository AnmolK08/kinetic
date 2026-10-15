import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/signup', authController.signUp);
router.post('/login', authController.signIn);
router.get('/me', authenticate, authController.getMe);

export default router;
