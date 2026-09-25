import AppError from '../errors/AppError.js';
import { getAdminSupabase } from '../config/supabase.js';

const mapPathWriteError = (error, level) => {
  const message = (error?.message || '').toLowerCase();
  const details = (error?.details || '').toLowerCase();

  if (error?.code === '23503' || message.includes('foreign key')) {
    return new AppError('Your account could not be linked to this path.', {
      statusCode: 500,
      code: 'PATH_PROFILE_MISSING',
      details: error,
    });
  }

  if (error?.code === '22P02' || message.includes('invalid input value for enum')) {
    return new AppError(
      'The generated path used a value this database does not accept.',
      {
        statusCode: 500,
        code: 'ENUM_MISMATCH',
        details: error,
      },
    );
  }

  console.warn(
    `[path] ${level} insert failed (${error?.code || 'unknown'}): ${error?.message}`,
  );

  return new AppError('The learning path could not be saved.', {
    statusCode: 500,
    code: 'PATH_SAVE_FAILED',
    details: error,
  });
};

export const insertLearningPath = async ({
  userId,
  careerGoal,
  skillLevel,
  background,
  timeCommitment,
}) => {
  const { data, error } = await getAdminSupabase()
    .from('learning_paths')
    .insert({
      user_id: userId,
      career_goal: careerGoal,
      skill_level: skillLevel,
      background,
      time_commitment: timeCommitment,
      status: 'active',
    })
    .select('id, user_id, career_goal, skill_level, background, time_commitment, status, created_at, updated_at')
    .single();

  if (error) throw mapPathWriteError(error, 'learning_paths');
  return data;
};

/**
 * Steps first without their resources, because resources.step_id needs the
 * generated step ids. The two calls are joined here rather than in the service.
 */
export const insertSteps = async (pathId, steps) => {
  const { data, error } = await getAdminSupabase()
    .from('steps')
    .insert(
      steps.map((step, index) => ({
        learning_path_id: pathId,
        // 1-based, so the client can render "Step 3 of 7" without adding one.
        step_order: index + 1,
        title: step.title,
        description: step.description,
        estimated_time: step.estimated_time,
        is_completed: false,
      })),
    )
    .select('id, learning_path_id, step_order, title, description, estimated_time, is_completed')
    .order('step_order');

  if (error) throw mapPathWriteError(error, 'steps');
  return data;
};

export const insertResourcesForStep = async (stepId, resources) => {
  if (resources.length === 0) return [];

  const { data, error } = await getAdminSupabase()
    .from('resources')
    .insert(
      resources.map((resource) => ({
        step_id: stepId,
        title: resource.title,
        url: resource.url,
        type: resource.type,
      })),
    )
    .select('id, step_id, title, url, type');

  if (error) throw mapPathWriteError(error, 'resources');
  return data;
};

export const deleteLearningPath = async (pathId) => {
  const { error } = await getAdminSupabase()
    .from('learning_paths')
    .delete()
    .eq('id', pathId);

  if (error) {
    console.warn(
      `[path] rollback failed (${error?.code || 'unknown'}): ${error?.message}`,
    );
  }

  return !error;
};

const mapPathReadError = (error) => {
  console.warn(`[path] read failed (${error?.code || 'unknown'}): ${error?.message}`);

  return new AppError('Your learning paths could not be read.', {
    statusCode: 500,
    code: 'PATH_READ_FAILED',
    details: error,
  });
};

const PATH_COLUMNS =
  'id, career_goal, skill_level, background, time_commitment, status, created_at, updated_at';

/**
 * Every read is filtered by user_id in the query itself, so another user's rows
 * are never loaded and then filtered out. Scoping in application code would
 * still put them in memory and make a mistake leak them.
 */
export const listPathsForUser = async (userId) => {
  const { data, error } = await getAdminSupabase()
    .from('learning_paths')
    .select(`${PATH_COLUMNS}, steps(step_order, is_completed)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw mapPathReadError(error);
  return data;
};

/**
 * Steps come back with their resources embedded, since resources hang off
 * steps.step_id. step_order is sorted in SQL; the service relies on that.
 */
export const getPathForUser = async (userId, pathId) => {
  const { data, error } = await getAdminSupabase()
    .from('learning_paths')
    .select(
      `${PATH_COLUMNS}, steps(id, step_order, title, description, estimated_time, is_completed, completed_at, resources(id, title, url, type))`,
    )
    .eq('id', pathId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw mapPathReadError(error);
  return data;
};

/**
 * completed_at and updated_at are written explicitly: there is no trigger on
 * this table, so omitting them silently leaves a step marked complete with no
 * timestamp and an updated_at that never moves.
 */
export const setStepCompletion = async ({ stepId, pathId, isCompleted }) => {
  const { data, error } = await getAdminSupabase()
    .from('steps')
    .update({
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', stepId)
    .eq('learning_path_id', pathId)
    .select('id, step_order, is_completed, completed_at, updated_at')
    .maybeSingle();

  if (error) throw mapPathWriteError(error, 'steps');
  return data;
};
