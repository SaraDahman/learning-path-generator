import AppError from '../errors/AppError.js';
import { generateJson, isGeminiConfigured } from '../config/gemini.js';
import { aiPathSchema } from '../../shared/validation.js';
import * as pathRepository from '../repositories/path.repository.js';

const buildPrompt = ({ careerGoal, skillLevel, background, timeCommitment }) => {
  const context = [
    `Career goal: ${careerGoal}`,
    `Current level: ${skillLevel}`,
    background ? `Existing background: ${background}` : 'Existing background: not specified, assume none',
    `Time commitment: ${timeCommitment}`,
  ].join('\n');

  return `You are a curriculum designer. Build a practical, ordered learning path for this person.

${context}

Rules:
- Order the steps so each one builds on the previous. No filler steps.
- 3 to 12 steps. Fewer if the goal is narrow, more if it is broad.
- Cover the essentials first, then the material that makes them employable.
- estimated_time is short free text such as "3 hours", "2 evenings", or "1 week". It is a label, not a number.
- Attach 1 to 3 real resources to each step, matching that step's subject. Use absolute http or https URLs that you are confident exist. If you cannot cite a real resource for a step, return an empty list for it rather than inventing a link.
- resource type must be one of: article, course, video, documentation, other.
- Write descriptions for a learner at the stated level, not for an expert.
- Return only the JSON object. No preamble, no markdown fences.`;
};

const parseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) {
      try {
        return JSON.parse(fenced[1].trim());
      } catch {
        return null;
      }
    }
    return null;
  }
};

const formatIssues = (error) =>
  error.issues
    .slice(0, 8)
    .map((issue) => `- ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');

const describe = (candidate) => {
  const issues = aiPathSchema.safeParse(candidate);
  if (issues.success) return { ok: true, value: issues.data };
  return { ok: false, issues: formatIssues(issues.error) };
};

/**
 * Two attempts, per the ai-path-generation skill: the first from the plain
 * prompt, and if the response cannot be parsed or does not validate, exactly
 * one repair attempt that repeats the request alongside the specific failures.
 * The repair is not a shortcut around validation; it runs the same parser.
 */
const requestPath = async (input) => {
  const prompt = buildPrompt(input);
  let lastIssues = null;
  let upstreamFailure = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const ask = attempt === 0
      ? prompt
      : `${prompt}\n\nYour previous response was rejected:\n${lastIssues}\n\nReturn a corrected JSON object with 4 to 12 steps, fixing exactly the problems listed above.`;

    const result = await generateJson({
      prompt: ask,
      temperature: attempt === 0 ? 0.4 : 0.2,
    });

    if (!result.ok) {
      if (result.code === 'AI_NOT_CONFIGURED') {
        throw new AppError('Path generation is not configured on this server.', {
          statusCode: 503,
          code: 'AI_NOT_CONFIGURED',
        });
      }
      // An upstream failure is not something a reworded prompt can fix.
      upstreamFailure = result.error;
      break;
    }

    const parsed = parseJson(result.text);
    if (parsed === null) {
      lastIssues = 'The response was not valid JSON at all.';
      continue;
    }

    const described = describe(parsed);
    if (described.ok) return described;

    lastIssues = described.issues;
    console.warn(`[path] attempt ${attempt + 1} failed validation:\n${lastIssues}`);
  }

  if (lastIssues === null) {
    console.warn(`[path] generation failed upstream: ${upstreamFailure}`);
    throw new AppError(
      'We could not generate a learning path right now. Please try again.',
      {
        statusCode: 502,
        code: 'AI_REQUEST_FAILED',
        details: { provider: 'gemini' },
      },
    );
  }

  throw new AppError('The generated learning path did not match the expected format.', {
    statusCode: 502,
    code: 'AI_INVALID_RESPONSE',
    details: { issues: lastIssues },
  });
};

export const generatePath = async (userId, input) => {
  if (!isGeminiConfigured()) {
    throw new AppError('Path generation is not configured on this server.', {
      statusCode: 503,
      code: 'AI_NOT_CONFIGURED',
    });
  }

  // The request arrives in the shared schema's snake_case. The prompt builder
  // takes camelCase, so map it explicitly rather than passing `input` straight
  // through: a silent key mismatch here makes the prompt read
  // "Career goal: undefined" and the model invents an unrelated topic, while
  // the row still saves the correct goal because the insert uses snake_case.
  const promptInput = {
    careerGoal: input.career_goal,
    skillLevel: input.skill_level,
    background: input.background,
    timeCommitment: input.time_commitment,
  };

  const validated = await requestPath(promptInput);
  const steps = validated.value.steps;

  const path = await pathRepository.insertLearningPath({
    userId,
    careerGoal: input.career_goal,
    skillLevel: input.skill_level,
    background: input.background,
    timeCommitment: input.time_commitment,
  });

  let insertedSteps;

  try {
    insertedSteps = await pathRepository.insertSteps(path.id, steps);

    for (const [index, step] of steps.entries()) {
      await pathRepository.insertResourcesForStep(
        insertedSteps[index].id,
        step.resources,
      );
    }
  } catch (error) {
    // No transaction spans these REST calls, so an orphaned parent row would
    // otherwise survive a failed step or resource insert.
    const removed = await pathRepository.deleteLearningPath(path.id);
    console.warn(`[path] save rolled back: ${error?.code || 'unknown'}`);

    throw new AppError(
      removed
        ? 'The learning path could not be saved, so nothing was kept.'
        : 'The learning path could not be saved.',
      {
        statusCode: 500,
        code: 'PATH_SAVE_FAILED',
      },
    );
  }

  return {
    id: path.id,
    careerGoal: path.career_goal,
    skillLevel: path.skill_level,
    background: path.background,
    timeCommitment: path.time_commitment,
    status: path.status,
    createdAt: path.created_at,
    stepCount: steps.length,
    resourceCount: steps.reduce(
      (total, step) => total + step.resources.length,
      0,
    ),
    steps: steps.map((step, index) => ({
      id: insertedSteps[index].id,
      order: insertedSteps[index].step_order,
      title: step.title,
      description: step.description,
      estimatedTime: step.estimated_time,
      resources: step.resources,
    })),
  };
};
