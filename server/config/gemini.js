import 'dotenv/config';

// Availability shifts constantly. Measured on the free tier: the flash-lite
// family returned 200 every time, while gemini-3.7-flash returned 503 about
// half the time and gemini-2.5-flash now 404s for new users. The chain leads
// with the reliable models and falls back to the larger ones, which are better
// writers when they are available.
const DEFAULT_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.7-flash',
];

const apiKey = process.env.GEMINI_API_KEY?.trim() || '';
const configuredModels = (process.env.GEMINI_MODELS || '')
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean);

const models = configuredModels.length > 0 ? configuredModels : DEFAULT_MODELS;

const TIMEOUT_MS = 30_000;
// 503s are common enough on the free tier that one attempt per model is not
// enough; this allows a second try on each of the three default models.
const MAX_ATTEMPTS = 6;

export const isGeminiConfigured = () => apiKey.length > 0;

export const getGeminiSettings = () => ({
  apiKey,
  models,
  timeoutMs: TIMEOUT_MS,
  maxAttempts: MAX_ATTEMPTS,
});

/**
 * Gemini schema subset. The API rejects unknown schema keywords outright
 * (additionalProperties is a 400, not ignored), so only documented keys are used.
 * Mirrors aiPathSchema: resources are nested per step because the database
 * attaches them through resources.step_id.
 */
const buildResponseSchema = () => ({
  type: 'object',
  properties: {
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Short imperative step title' },
          description: {
            type: 'string',
            description: 'What the learner does and why it matters',
          },
          estimated_time: {
            type: 'string',
            description: 'Short free-text estimate, e.g. "3 hours" or "1 week"',
          },
          resources: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                url: { type: 'string', description: 'Absolute http or https URL' },
                type: {
                  type: 'string',
                  enum: ['article', 'course', 'video', 'documentation', 'other'],
                },
              },
              required: ['title', 'url', 'type'],
            },
          },
        },
        required: ['title', 'description', 'estimated_time', 'resources'],
      },
    },
  },
  required: ['steps'],
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callModel = async ({ apiKey: key, model, prompt, temperature }) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          responseMimeType: 'application/json',
          responseSchema: buildResponseSchema(),
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      retryable: [429, 500, 502, 503, 504].includes(response.status),
      error: payload?.error?.message || `HTTP ${response.status}`,
    };
  }

  const candidate = payload?.candidates?.[0];
  const text = (candidate?.content?.parts || [])
    .map((part) => part.text || '')
    .join('')
    .trim();

  if (!text) {
    return { ok: false, status: 502, retryable: false, error: 'empty response' };
  }

  return { ok: true, text, finishReason: candidate?.finishReason };
};

/**
 * Walks the model chain. Transient failures (429/5xx, and timeouts) get one
 * retry against the same model, then the next model is tried.
 */
export const generateJson = async ({ prompt, temperature = 0.4 }) => {
  const settings = getGeminiSettings();

  if (!settings.apiKey) {
    return { ok: false, code: 'AI_NOT_CONFIGURED', error: 'GEMINI_API_KEY is not set' };
  }

  const attempts = [];
  let budget = settings.maxAttempts;

  for (const model of settings.models) {
    if (budget <= 0) break;

    for (let attempt = 0; attempt < 2 && budget > 0; attempt += 1) {
      budget -= 1;

      try {
        const result = await callModel({
          apiKey: settings.apiKey,
          model,
          prompt,
          temperature,
        });

        if (result.ok) return { ok: true, model, text: result.text };

        attempts.push(`${model}: ${result.error}`);
        if (result.retryable && attempt === 0 && budget > 0) {
          await sleep(1500);
          continue;
        }
        break;
      } catch (error) {
        const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
        attempts.push(`${model}: ${timedOut ? 'timed out' : error?.message}`);
        if (timedOut && attempt === 0 && budget > 0) {
          continue;
        }
        break;
      }
    }
  }

  return { ok: false, code: 'AI_UPSTREAM_UNAVAILABLE', error: attempts.join(' | ') };
};
