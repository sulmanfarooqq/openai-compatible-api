import worker from "./worker.mjs";

const splitApiKeys = (value = "") =>
  [...new Set(value.split(/[\s,]+/).map((key) => key.trim()).filter(Boolean))];

const getConfiguredKeys = (request) => {
  const env = globalThis.process?.env;
  const envKeys = splitApiKeys(env?.GEMINI_API_KEYS ?? env?.GEMINI_API_KEY ?? "");
  if (envKeys.length > 0) return { keys: envKeys, source: "env" };

  const auth = request.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  return { keys: splitApiKeys(token), source: "header" };
};

const RETRYABLE_STATUS = new Set([408, 425, 429]);
const isRetryable = (status) => RETRYABLE_STATUS.has(status) || (status >= 500 && status < 600);

const getRetryDelay = (response, attempt) => {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.min(seconds * 1000, 30_000);
    const date = Date.parse(retryAfter);
    if (Number.isFinite(date)) return Math.max(0, Math.min(date - Date.now(), 30_000));
  }
  const base = Number(globalThis.process?.env?.GEMINI_RETRY_BASE_MS ?? 250);
  const max = Number(globalThis.process?.env?.GEMINI_RETRY_MAX_MS ?? 8_000);
  return Math.min(max, base * (2 ** attempt));
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let roundRobinCursor = 0;

const withSelectedKey = async (request, keys, source, index, fn) => {
  const selected = keys[index % keys.length];
  if (source === "header") {
    const headers = new Headers(request.headers);
    headers.set("Authorization", `Bearer ${selected}`);
    return fn(new Request(request, { headers }));
  }

  const env = globalThis.process?.env;
  if (!env) return fn(request.clone());

  const original = env.GEMINI_API_KEYS;
  const rotated = keys.slice(index).concat(keys.slice(0, index));
  env.GEMINI_API_KEYS = rotated.join(",");
  try {
    return await fn(request.clone());
  } finally {
    if (original === undefined) delete env.GEMINI_API_KEYS;
    else env.GEMINI_API_KEYS = original;
  }
};

const fetchWithResilience = async (request) => {
  const { keys, source } = getConfiguredKeys(request);
  if (keys.length === 0) return worker.fetch(request);

  const configuredMax = Number(globalThis.process?.env?.GEMINI_MAX_KEY_ATTEMPTS ?? keys.length);
  const maxAttempts = Math.max(1, Math.min(keys.length, Number.isFinite(configuredMax) ? configuredMax : keys.length));
  const start = roundRobinCursor++ % keys.length;
  let lastResponse;
  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await withSelectedKey(
        request,
        keys,
        source,
        start + attempt,
        (selectedRequest) => worker.fetch(selectedRequest),
      );
      if (response.ok || !isRetryable(response.status) || attempt === maxAttempts - 1) return response;
      lastResponse = response;
      await sleep(getRetryDelay(response, attempt));
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts - 1) break;
      await sleep(Math.min(8_000, 250 * (2 ** attempt)));
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError ?? new Error("All configured Gemini API keys failed");
};

export default {
  fetch: fetchWithResilience,
};
