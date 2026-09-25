import { z } from 'zod';

export const signupSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Must match the Postgres enums exactly. A mismatch surfaces as a raw database
// error on insert rather than a validation message, so these are the source of
// truth for both the API and the AI contract.
export const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'];
export const RESOURCE_TYPES = [
  'article',
  'course',
  'video',
  'documentation',
  'other',
];

export const pathRequestSchema = z.object({
  career_goal: z
    .string()
    .trim()
    .min(1, 'Career goal is required')
    .max(255, 'Career goal must be 255 characters or fewer'),
  skill_level: z.enum(SKILL_LEVELS, {
    error: 'Choose a skill level',
  }),
  background: z
    .string()
    .trim()
    .max(500, 'Background must be 500 characters or fewer')
    .default(''),
  time_commitment: z
    .string()
    .trim()
    .min(1, 'Time commitment is required')
    .max(80, 'Time commitment must be 80 characters or fewer'),
});

export const aiResourceSchema = z.object({
  title: z.string().trim().min(1).max(200),
  // Zod v4's .url() accepts any scheme, so http/https is enforced here instead.
  url: z
    .string()
    .trim()
    .min(1)
    .refine(
      (value) => /^https?:\/\/\S+$/i.test(value),
      'Resource URL must start with http:// or https://',
    ),
  type: z.enum(RESOURCE_TYPES),
});

// Resources are per step (resources.step_id), so they are nested here rather
// than returned as a path-level list. estimated_time is a free-text string
// column, not an integer.
export const aiStepSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1).max(2000),
  estimated_time: z.string().trim().min(1).max(60),
  resources: z.array(aiResourceSchema),
});

export const aiPathSchema = z.object({
  // 4 to 12 is deliberate: fewer is not a roadmap, more is not something
  // anyone finishes.
  steps: z.array(aiStepSchema).min(4).max(12),
});

export const stepCompletionSchema = z.object({
  is_completed: z.boolean({
    error: 'is_completed must be true or false',
  }),
});

// PostgREST rejects a non-uuid in a filter with 22P02, which would surface as a
// 500. Validating the shape here keeps a bad URL a 400.
export const pathIdParamSchema = z.object({
  id: z.string().uuid('That path id is not valid'),
});

export const stepParamsSchema = pathIdParamSchema.extend({
  stepId: z.string().uuid('That step id is not valid'),
});