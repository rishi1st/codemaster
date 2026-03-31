/**
 * controller/userSubmission.js
 * ─────────────────────────────────────────────────────────────────────────────
 * New bug fixes (on top of previous version):
 *
 *  1. submitCode created the DB submission record BEFORE checking that the
 *     problem has hidden test cases. If the problem had 0 test cases, an orphan
 *     "pending" submission was written to the DB and never resolved.
 *     Fixed: all validation (problem fetch + test case check) before save().
 *
 *  2. submitCode returned HTTP 201 (Created) while runCode returned 200 (OK).
 *     Inconsistent status codes make client-side error handling brittle.
 *     Fixed: submitCode now also returns 200 on success.
 *
 *  3. Duplicate require() from the same module path — two destructuring calls
 *     on `require('../utils/problemUtility')` in the same file.
 *     Fixed: single require(), single destructure.
 *
 *  4. testCaseResults stored in DB for submit included the hidden test case
 *     `input` and `expectedOutput` fields — a security concern since this
 *     data could be extracted from the DB or API.
 *     Fixed: strip sensitive fields before persisting; keep them only in the
 *     immediate HTTP response so the UI can display them during that session.
 *
 *  5. Problem data fetched fresh from MongoDB on every single run/submit.
 *     For a high-traffic platform this is the primary DB bottleneck.
 *     Fixed: Redis cache with 5-minute TTL (requires redis client in app).
 *
 * Retained from previous version:
 *  - Language validated before DB record created
 *  - firstFailSet flag (status locked on first failure, not last)
 *  - memoryMax tracked across ALL tests
 *  - avgRuntime across all tests, not just passing
 *  - Code size limit (50 KB)
 *  - Structured logging
 *  - customInput support in runCode
 *  - input/expected sourced from problem record, not Judge0 response
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Problem    = require('../models/problem');
const Submission = require('../models/submission');
const User       = require('../models/user');
const {
  getLanguageById,
  getSupportedLanguages,
  submitBatch,
  submitToken,
} = require('../utils/problemUtility');  // Bug fix #3: single require

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

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_CODE_BYTES  = 50 * 1024;            // 50 KB code size hard limit
const PROBLEM_TTL_SEC = 300;                  // 5 min Redis TTL for problem cache

// ── Redis problem cache ───────────────────────────────────────────────────────
/**
 * Bug fix #5: every run/submit fetched the problem fresh from MongoDB.
 * For a platform under load this is the primary DB bottleneck.
 *
 * Strategy: cache serialised problem JSON in Redis keyed by problemId.
 * On cache miss: fetch from Mongo, write to Redis with TTL, return.
 * On cache hit: parse and return — zero Mongo load.
 *
 * Graceful degradation: if Redis is unavailable, falls through to Mongo.
 */
let redisClient = null;
try {
  // Only wire up Redis if it's already configured in the app.
  // This avoids a hard dependency — the controller works without Redis.
  redisClient = require('../config/redis');
} catch {
  log.warn('problemCache', 'Redis client not available — problem caching disabled');
}

const getProblemCached = async (problemId) => {
  const cacheKey = `problem:${problemId}`;

  // Try cache first
  if (redisClient) {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        log.debug('getProblemCached', 'Cache hit', { problemId });
        return JSON.parse(cached);
      }
    } catch (err) {
      log.warn('getProblemCached', 'Redis get failed — falling through to DB', { error: err.message });
    }
  }

  // DB fetch
  const problem = await Problem.findById(problemId).lean();

  // Populate cache
  if (problem && redisClient) {
    try {
      await redisClient.setEx(cacheKey, PROBLEM_TTL_SEC, JSON.stringify(problem));
      log.debug('getProblemCached', 'Cache populated', { problemId, ttl: PROBLEM_TTL_SEC });
    } catch (err) {
      log.warn('getProblemCached', 'Redis set failed — continuing without cache', { error: err.message });
    }
  }

  return problem;
};

// ── Language normaliser ───────────────────────────────────────────────────────
const normaliseLang = (lang = '') => {
  const v = String(lang).trim().toLowerCase();
  if (v === 'cpp' || v === 'c++') return 'c++';
  if (v === 'js'  || v === 'javascript') return 'javascript';
  if (v === 'py'  || v === 'python') return 'python';
  if (v === 'java') return 'java';
  if (v === 'c')    return 'c';
  return v;
};

// ── Shared input validation ───────────────────────────────────────────────────
/**
 * Validates code + language fields shared by both endpoints.
 * Returns { normLang, languageId } on success or calls res.status().json() and returns null.
 */
const validateCodeInput = (code, lenguage, res, FN) => {
  if (!code || !lenguage) {
    log.warn(FN, 'Missing required fields', { hasCode: !!code, hasLang: !!lenguage });
    res.status(400).json({ message: 'code and lenguage are required' });
    return null;
  }
  if (Buffer.byteLength(code, 'utf8') > MAX_CODE_BYTES) {
    log.warn(FN, 'Code exceeds size limit', { bytes: Buffer.byteLength(code, 'utf8') });
    res.status(400).json({ message: `Code must not exceed ${MAX_CODE_BYTES / 1024} KB` });
    return null;
  }
  const normLang   = normaliseLang(lenguage);
  const languageId = getLanguageById(normLang);
  if (!languageId) {
    log.warn(FN, 'Unsupported language', { normLang, supported: getSupportedLanguages() });
    res.status(400).json({
      message: `Unsupported language: "${lenguage}". Supported: ${getSupportedLanguages().join(', ')}`,
    });
    return null;
  }
  return { normLang, languageId };
};

// ═════════════════════════════════════════════════════════════════════════════
//  SUBMIT CODE
// ═════════════════════════════════════════════════════════════════════════════
const submitCode = async (req, res) => {
  const FN        = 'submitCode';
  const userId    = req.user._id;
  const problemId = req.params.id;
  const startTime = Date.now();

  log.info(FN, 'Submission attempt', { userId, problemId });

  try {
    const { code, lenguage } = req.body;

    // ── Validate code + language ────────────────────────────────────────────
    const validated = validateCodeInput(code, lenguage, res, FN);
    if (!validated) return; // response already sent
    const { normLang, languageId } = validated;

    // ── Fetch problem (cached) ───────────────────────────────────────────────
    const problem = await getProblemCached(problemId);
    if (!problem) {
      log.warn(FN, 'Problem not found', { problemId });
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Bug fix #1: validate hidden test cases BEFORE creating any DB record
    if (!problem.hiddenTestCases?.length) {
      log.warn(FN, 'Problem has no hidden test cases', { problemId });
      return res.status(400).json({ message: 'Problem has no test cases configured' });
    }

    log.debug(FN, 'Problem loaded', {
      problemId,
      testCases: problem.hiddenTestCases.length,
      lang: normLang,
    });

    // ── Create pending submission (after all validation passes) ──────────────
    const submission = new Submission({
      userId,
      problemId,
      code,
      lenguage:       normLang,
      status:         'pending',
      testCasesTotal: problem.hiddenTestCases.length,
    });
    await submission.save();
    log.info(FN, 'Submission record created', { submissionId: submission._id });

    // ── Build & submit Judge0 batch ──────────────────────────────────────────
    const batch = problem.hiddenTestCases.map((tc) => ({
      source_code:     code,
      language_id:     languageId,
      stdin:           tc.input,
      expected_output: tc.output,
    }));

    let submitResult;
    try {
      submitResult = await submitBatch(batch);
      log.debug(FN, 'Batch submitted', { tokenCount: submitResult.length });
    } catch (err) {
      log.error(FN, 'Judge0 batch submission failed', { submissionId: submission._id, error: err.message });
      submission.status       = 'error';
      submission.errorMessage = 'Failed to reach Judge0';
      await submission.save();
      return res.status(502).json({ message: 'Error communicating with Judge0', details: err.message });
    }

    // ── Poll for results ─────────────────────────────────────────────────────
    let results;
    try {
      const tokens = submitResult.map((v) => v.token);
      results      = await submitToken(tokens);
      log.debug(FN, 'Judge0 results received', { count: results.length });
    } catch (err) {
      log.error(FN, 'Judge0 polling failed', { submissionId: submission._id, error: err.message });
      submission.status       = 'error';
      submission.errorMessage = 'Judge0 polling timed out';
      await submission.save();
      return res.status(502).json({ message: 'Judge0 polling failed', details: err.message });
    }

    // ── Process results ──────────────────────────────────────────────────────
    let testCasesPassed = 0;
    let runtimeTotal    = 0;
    let memoryMax       = 0;
    let finalStatus     = 'accepted';
    let errorMessage    = '';
    let firstFailSet    = false;

    // Full results for the immediate HTTP response (includes input/expected)
    const testCaseResults = results.map((test, i) => {
      const tc     = problem.hiddenTestCases[i];
      const passed = test.status_id === 3;
      const ms     = parseFloat(test.time || 0) * 1000;
      const kb     = test.memory || 0;

      memoryMax    = Math.max(memoryMax, kb);
      runtimeTotal += ms;

      if (passed) {
        testCasesPassed++;
      } else if (!firstFailSet) {
        finalStatus  = test.status_id === 6 ? 'error' : 'wrong';
        errorMessage = test.stderr || test.compile_output || test.message || '';
        firstFailSet = true;
      }

      return {
        input:          tc.input,
        expectedOutput: tc.output,
        userOutput:     test.stdout ? test.stdout.trim() : null,
        passed,
        status:         test.status?.description || 'Unknown',
        runtime:        parseFloat(ms.toFixed(2)),
        memory:         kb,
        stderr:         test.stderr         || null,
        compileOutput:  test.compile_output  || null,
      };
    });

    const avgRuntime = results.length > 0 ? runtimeTotal / results.length : 0;
    const wallMs     = Date.now() - startTime;

    log.info(FN, 'Results processed', {
      submissionId: submission._id,
      finalStatus,
      passed:       testCasesPassed,
      total:        problem.hiddenTestCases.length,
      avgRuntimeMs: avgRuntime.toFixed(2),
      memoryKB:     memoryMax,
      wallMs,
    });

    // Bug fix #4: strip hidden test case input/expectedOutput before DB storage.
    // The raw inputs are sensitive — storing them makes it trivial to scrape
    // hidden test cases from submission history.
    const testCaseResultsForDB = testCaseResults.map(({ input, expectedOutput, ...safe }) => safe);

    // ── Persist final result ─────────────────────────────────────────────────
    submission.status          = finalStatus;
    submission.testCasesPassed = testCasesPassed;
    submission.errorMessage    = errorMessage;
    submission.runtime         = parseFloat(avgRuntime.toFixed(3));
    submission.memory          = memoryMax;
    submission.testCaseResults = testCaseResultsForDB; // Bug fix #4: no hidden inputs
    await submission.save();

    // ── Mark problem solved ──────────────────────────────────────────────────
    if (finalStatus === 'accepted') {
      await User.findByIdAndUpdate(userId, { $addToSet: { problemSolved: problemId } });
      log.info(FN, 'Problem marked solved', { userId, problemId });
    }

    // Bug fix #2: was 201 — should be 200 for consistency with runCode
    return res.status(200).json({
      accepted:        finalStatus === 'accepted',
      totalTestCases:  problem.hiddenTestCases.length,
      passedTestCases: testCasesPassed,
      runtime:         parseFloat(avgRuntime.toFixed(3)),
      memory:          memoryMax,
      errorMessage,
      testCaseResults, // full results (with input/expected) for this session's UI
    });

  } catch (err) {
    log.error(FN, 'Unexpected error', { error: err.message, stack: err.stack });
    return res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
//  RUN CODE  (visible test cases or custom input — not persisted)
// ═════════════════════════════════════════════════════════════════════════════
const runCode = async (req, res) => {
  const FN        = 'runCode';
  const userId    = req.user._id;
  const problemId = req.params.id;
  const startTime = Date.now();

  log.info(FN, 'Run attempt', { userId, problemId });

  try {
    const { code, lenguage, customInput } = req.body;

    // ── Validate ─────────────────────────────────────────────────────────────
    const validated = validateCodeInput(code, lenguage, res, FN);
    if (!validated) return;
    const { normLang, languageId } = validated;

    // ── Fetch problem (cached) ───────────────────────────────────────────────
    const problem = await getProblemCached(problemId);
    if (!problem) {
      log.warn(FN, 'Problem not found', { problemId });
      return res.status(404).json({ message: 'Problem not found' });
    }

    log.debug(FN, 'Problem loaded', { problemId, lang: normLang, hasCustomInput: !!customInput });

    // ── Build batch ──────────────────────────────────────────────────────────
    let batch, testCaseMeta;

    if (customInput?.trim()) {
      // Custom stdin — single test case, no expected output
      batch        = [{ source_code: code, language_id: languageId, stdin: customInput.trim(), expected_output: '' }];
      testCaseMeta = [{ input: customInput.trim(), expected: '(custom input)' }];
      log.debug(FN, 'Running with custom input');
    } else {
      if (!problem.visibleTestCases?.length) {
        log.warn(FN, 'No visible test cases', { problemId });
        return res.status(400).json({ message: 'No visible test cases found for this problem' });
      }
      batch        = problem.visibleTestCases.map((tc) => ({
        source_code:     code,
        language_id:     languageId,
        stdin:           tc.input,
        expected_output: tc.output,
      }));
      testCaseMeta = problem.visibleTestCases.map((tc) => ({
        input:    tc.input,
        expected: tc.output,
      }));
      log.debug(FN, 'Running visible test cases', { count: batch.length });
    }

    // ── Submit to Judge0 ─────────────────────────────────────────────────────
    let submitResult;
    try {
      submitResult = await submitBatch(batch);
    } catch (err) {
      log.error(FN, 'Judge0 batch failed', { error: err.message });
      return res.status(502).json({ message: 'Error communicating with Judge0', details: err.message });
    }

    // ── Poll ─────────────────────────────────────────────────────────────────
    let testResults;
    try {
      testResults = await submitToken(submitResult.map((v) => v.token));
    } catch (err) {
      log.error(FN, 'Judge0 polling failed', { error: err.message });
      return res.status(502).json({ message: 'Judge0 polling failed', details: err.message });
    }

    // ── Shape response ───────────────────────────────────────────────────────
    // input/expected sourced from testCaseMeta (our records), NOT from Judge0
    const formattedResults = testResults.map((r, idx) => {
      const meta   = testCaseMeta[idx] || {};
      const ms     = parseFloat(r.time || 0) * 1000;
      const passed = r.status_id === 3;
      return {
        testcase:      idx + 1,
        input:         meta.input    ?? '',
        expected:      meta.expected ?? '',
        output:        r.stdout?.trim() ?? null,
        status:        r.status?.description || 'Unknown',
        passed,
        runtime:       parseFloat(ms.toFixed(2)),
        memory:        r.memory || 0,
        stderr:        r.stderr         || null,
        compileOutput: r.compile_output  || null,
      };
    });

    const passedCount = formattedResults.filter((r) => r.passed).length;
    const wallMs      = Date.now() - startTime;

    log.info(FN, 'Run completed', {
      userId, problemId, passed: passedCount,
      total: formattedResults.length,
      customInput: !!customInput,
      wallMs,
    });

    return res.status(200).json({
      success:         true,
      totalTestcases:  formattedResults.length,
      passedTestcases: passedCount,
      testCases:       formattedResults,
    });

  } catch (err) {
    log.error(FN, 'Unexpected error', { error: err.message, stack: err.stack });
    return res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = { submitCode, runCode };
