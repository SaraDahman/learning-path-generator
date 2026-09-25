import { Router } from 'express';
import { pathRequestSchema } from '../../shared/validation.js';
import * as pathController from '../controllers/path.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  asyncHandler,
  validateBody,
} from '../middleware/error.middleware.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  validateBody(pathRequestSchema),
  asyncHandler(pathController.generate),
);

export default router;
