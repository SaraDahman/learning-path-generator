import { Router } from 'express';
import {
  pathIdParamSchema,
  pathRequestSchema,
  stepCompletionSchema,
  stepParamsSchema,
} from '../../shared/validation.js';
import * as pathController from '../controllers/path.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  asyncHandler,
  validateBody,
  validateParams,
} from '../middleware/error.middleware.js';

const router = Router();

// Every route here is protected. There is no public read path.
router.use(requireAuth);

router.get('/', asyncHandler(pathController.list));

router.post(
  '/',
  validateBody(pathRequestSchema),
  asyncHandler(pathController.generate),
);

router.get(
  '/:id',
  validateParams(pathIdParamSchema),
  asyncHandler(pathController.getOne),
);

router.patch(
  '/:id/steps/:stepId',
  validateParams(stepParamsSchema),
  validateBody(stepCompletionSchema),
  asyncHandler(pathController.setStepCompletion),
);

router.delete(
  '/:id',
  validateParams(pathIdParamSchema),
  asyncHandler(pathController.remove),
);

export default router;
