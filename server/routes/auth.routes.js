import { Router } from 'express';
import { loginSchema, signupSchema } from '../../shared/validation.js';
import * as authController from '../controllers/auth.controller.js';
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

export default router;