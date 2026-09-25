import { Router } from 'express';
import { loginSchema, signupSchema } from '../../shared/validation.js';
import * as authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  asyncHandler,
  validateBody,
} from '../middleware/error.middleware.js';

const router = Router();

router.post(
  '/register',
  validateBody(signupSchema),
  asyncHandler(authController.register),
);

router.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(authController.login),
);

router.get('/me', requireAuth, asyncHandler(authController.me));

router.post('/logout', requireAuth, asyncHandler(authController.logout));

export default router;