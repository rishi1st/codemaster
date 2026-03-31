/**
 * utils/problemUtility.js
 * ─────────────────────────────────────────────────────────────────────────────
 * New bug fixes (on top of previous version):
 *
 *  1. RAPID_API_KEY was a top-level const — read once at module load time.
 *     If dotenv hasn't run yet when this file is first require()'d, the key is
 *     permanently `undefined` and every Judge0 call returns HTTP 401.
 *     Fixed: read process.env.JUDGE0_API_KEY inside rapidHeaders() each call.
 *
 *  2. submitBatch had NO batch size cap. Judge0 CE silently truncates batches
 *     larger than 20 submissions — a problem with 25 hidden test cases would
 *     discard the last 5 results entirely, producing a wrong verdict with no error.
 *     Fixed: automatically chunks into ≤20 groups, submits in parallel, merges.
 *
 *  3. submitToken joined ALL tokens into one GET URL. At ~36 chars/token, 25+
 *     tokens exceed URL-safe limits on some proxies/Judge0 infrastructure.
 *     Fixed: poll each chunk separately in parallel, flatten results in order.
 *
 *  4. getSupportedLanguages() returned duplicates ('c++' AND 'cpp') because both
 *     are keys in LANGUAGE_MAP. Confusing in error messages.
 *     Fixed: filter out the 'cpp' alias from the public list.
 *
 * Retained from previous version:
 *  - sleep() proper Promise wrapper (was setTimeout without Promise)
 *  - Error propagation (no silent undefined returns)
 *  - MAX_POLL_ATTEMPTS timeout guard (was infinite loop)
 *  - Per-request axios timeout
 * ─────────────────────────────────────────────────────────────────────────────
 */

const axios = require('axios');

// ── Structured logger ─────────────────────────────────────────────────────────
const log = {
  info:  (fn, msg, meta = {}) => console.log  (JSON.stringify({ level: 'INFO',  fn, msg, ...meta, ts: new Date().toISOString() })),
  warn:  (fn, msg, meta = {}) => console.warn (JSON.stringify({ level: 'WARN',  fn, msg, ...meta, ts: new Date().toISOString() })),
  error: (fn, msg, meta = {}) => console.error(JSON.stringify({ level: 'ERROR', fn, msg, ...meta, ts: new Date().toISOString() })),
  debug: (fn, msg, meta = {}) => {
    if (process.env.NODE_ENV !== 'production')
      console.debug(JSON.stringify({ level: 'DEBUG', fn, msg, ...meta, ts: new Date().toISOString() }));
  },
};

// ── Config ────────────────────────────────────────────────────────────────────
const JUDGE0_BASE_URL  = 'https://judge0-ce.p.rapidapi.com';
const RAPID_API_HOST   = 'judge0-ce.p.rapidapi.com';

// Bug fix #2: Judge0 CE rejects/truncates batches over 20 submissions
const MAX_BATCH_SIZE   = 20;

const POLL_INTERVAL_MS  = parseInt(process.env.JUDGE0_POLL_INTERVAL_MS  || '1500', 10);
const POLL_TIMEOUT_MS   = parseInt(process.env.JUDGE0_POLL_TIMEOUT_MS   || '30000', 10);
const MAX_POLL_ATTEMPTS = Math.ceil(POLL_TIMEOUT_MS / POLL_INTERVAL_MS);
const AXIOS_TIMEOUT_MS  = 30000;

// Bug fix #1: lazy read — evaluated every call, not at module load time
const rapidHeaders = () => ({
  'x-rapidapi-key':  process.env.JUDGE0_API_KEY,
  'x-rapidapi-host': RAPID_API_HOST,
  'Content-Type':    'application/json',
});

// ── Utility ───────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Split arr into sub-arrays of at most n elements, preserving order. */
const chunk = (arr, n) => {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

// ── Language map ──────────────────────────────────────────────────────────────
const LANGUAGE_MAP = {
  'c++':        54,
  'cpp':        54,   // internal alias — same ID; excluded from display names
  'c':          50,
  'java':       62,
  'javascript': 63,
  'python':     71,
  'go':         60,
  'rust':       73,
  'typescript': 74,
};

/** Returns Judge0 language_id for a language string, or undefined if unsupported. */
const getLanguageById = (lang) => {
  if (!lang || typeof lang !== 'string') return undefined;
  return LANGUAGE_MAP[lang.toLowerCase().trim()];
};

/**
 * Bug fix #4: exclude the 'cpp' alias from the user-facing list.
 * Previously returned ['c++', 'cpp', 'c', 'java', ...] with the duplicate.
 */
const getSupportedLanguages = () =>
  Object.keys(LANGUAGE_MAP).filter((k) => k !== 'cpp');

// ── submitBatch ───────────────────────────────────────────────────────────────
/**
 * Submits code+testcase pairs to Judge0 CE.
 *
 * Bug fix #2: the previous version sent all N submissions in one request.
 * Judge0 CE silently truncates or rejects batches > MAX_BATCH_SIZE=20.
 * A 25-test-case problem would score on only 20 cases — completely wrong.
 *
 * Now: splits into ≤20-item chunks, submits all chunks in parallel,
 * and returns a single flattened token array in the original order.
 *
 * @param  {Array<{source_code,language_id,stdin,expected_output}>} submissions
 * @returns {Array<{token:string}>}
 * @throws  on network error or unexpected Judge0 response
 */
const submitBatch = async (submissions) => {
  const FN = 'submitBatch';

  if (!submissions?.length) {
    log.warn(FN, 'Empty submissions array received');
    return [];
  }

  const chunks = chunk(submissions, MAX_BATCH_SIZE);
  log.info(FN, 'Submitting batch to Judge0', {
    total:     submissions.length,
    chunks:    chunks.length,
    chunkSize: MAX_BATCH_SIZE,
  });

  // Parallel submit — Judge0 is the bottleneck; parallel minimises wall-clock time
  const chunkTokens = await Promise.all(
    chunks.map(async (batch, ci) => {
      log.debug(FN, `Submitting chunk ${ci + 1}/${chunks.length}`, { size: batch.length });
      try {
        const { data } = await axios.post(
          `${JUDGE0_BASE_URL}/submissions/batch`,
          { submissions: batch },
          {
            params:  { base64_encoded: 'false' },
            headers: rapidHeaders(),
            timeout: AXIOS_TIMEOUT_MS,
          }
        );
        if (!Array.isArray(data)) {
          throw new Error(`Chunk ${ci + 1}: unexpected response shape: ${JSON.stringify(data)}`);
        }
        log.debug(FN, `Chunk ${ci + 1} OK`, { tokens: data.length });
        return data; // [{token}, ...]
      } catch (err) {
        log.error(FN, `Chunk ${ci + 1} submission failed`, {
          error:   err.message,
          status:  err.response?.status,
          details: err.response?.data,
        });
        throw err;
      }
    })
  );

  const allTokens = chunkTokens.flat();
  log.info(FN, 'All chunks submitted successfully', { totalTokens: allTokens.length });
  return allTokens;
};

// ── submitToken ───────────────────────────────────────────────────────────────
/**
 * Polls Judge0 until every token reaches terminal status (status_id > 2).
 *
 * Bug fix #3: the previous version joined ALL tokens into one GET URL.
 * At ~36 chars/token, 25 tokens ≈ 900 chars of just tokens — plus the rest
 * of the URL and headers this exceeds safe limits on some reverse-proxies.
 * Now polls each chunk in parallel and flattens results in original order.
 *
 * Status IDs: 1=In Queue, 2=Processing, 3=Accepted, 4+=errors.
 *
 * @param  {string[]} resultTokens
 * @returns {Array}  Judge0 result objects in the same order as input tokens
 * @throws  on polling timeout or network error
 */
const submitToken = async (resultTokens) => {
  const FN = 'submitToken';

  if (!resultTokens?.length) {
    log.warn(FN, 'Empty token array');
    return [];
  }

  const tokenChunks = chunk(resultTokens, MAX_BATCH_SIZE);
  log.info(FN, 'Starting result polling', {
    tokenCount:  resultTokens.length,
    chunks:      tokenChunks.length,
    maxAttempts: MAX_POLL_ATTEMPTS,
    intervalMs:  POLL_INTERVAL_MS,
  });

  /**
   * Poll one chunk of tokens until all reach terminal status.
   * Independent per-chunk polling allows faster chunks to finish
   * without being blocked by slower ones.
   */
  const pollChunk = async (tokens, ci) => {
    let attempts = 0;

    while (true) {
      if (attempts >= MAX_POLL_ATTEMPTS) {
        const msg = `Chunk ${ci + 1} polling timed out after ${attempts} attempts (${POLL_TIMEOUT_MS}ms)`;
        log.error(FN, msg, { pendingTokens: tokens });
        throw new Error(msg);
      }

      attempts++;
      log.debug(FN, `Chunk ${ci + 1} poll ${attempts}/${MAX_POLL_ATTEMPTS}`);

      let result;
      try {
        const { data } = await axios.get(
          `${JUDGE0_BASE_URL}/submissions/batch`,
          {
            params: {
              tokens:         tokens.join(','),
              base64_encoded: 'false',
              fields:         '*',
            },
            headers: rapidHeaders(),
            timeout: AXIOS_TIMEOUT_MS,
          }
        );
        result = data;
      }catch (err) {
        log.error(FN, `Chunk ${ci + 1} poll request failed`, {
          attempt: attempts,
          error: err.message,
          httpStatus: err.response?.status,
        });
      
        // 🔥 Retry on timeout instead of failing
        if (err.code === 'ECONNABORTED') {
          log.warn(FN, `Timeout retrying chunk ${ci + 1}`);
          await sleep(POLL_INTERVAL_MS);
          continue;
        }
      
        throw err;
      }

      if (!result?.submissions || !Array.isArray(result.submissions)) {
        throw new Error(`Chunk ${ci + 1}: malformed poll response: ${JSON.stringify(result)}`);
      }

      const pending = result.submissions.filter((s) => s.status_id <= 2);
      log.debug(FN, `Chunk ${ci + 1} pending`, { pending: pending.length, total: result.submissions.length });

      if (pending.length === 0) {
        log.info(FN, `Chunk ${ci + 1} all done`, {
          attempts,
          statuses: result.submissions.map((s) => s.status?.description),
        });
        return result.submissions;
      }

      await sleep(POLL_INTERVAL_MS);
    }
  };

  // All chunks poll in parallel — fastest possible wall-clock time
  const chunkResults = await Promise.all(
    tokenChunks.map((tokens, ci) => pollChunk(tokens, ci))
  );

  // Flatten maintaining order (chunk 0 results first, then chunk 1, etc.)
  const allResults = chunkResults.flat();
  log.info(FN, 'All submissions reached terminal status', { total: allResults.length });
  return allResults;
};

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  getLanguageById,
  getSupportedLanguages,
  submitBatch,
  submitToken,
};
