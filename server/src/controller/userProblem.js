/**
 * controller/userProblem.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Bug fixes:
 *  1.  console.log(error1) — `error1` was undefined → ReferenceError at runtime
 *  2.  console.log(error2) — same, `error2` undefined
 *  3.  updateProblem spread entire req.body into findByIdAndUpdate — an attacker
 *      could overwrite `problemCreator` or `_id` by sending those fields
 *  4.  getAllProblem returned ALL fields including hiddenTestCases and
 *      referenceSolution to regular users — data leak
 *  5.  solvedAllProblembyUser had no null check — crashes if user not found
 *  6.  submittedProblem had no null check on problemId
 *  7.  deleteProblem didn't clean up related Submissions or SolutionVideos
 *  8.  No pagination validation — page < 1 or limit > 100 accepted silently
 *  9.  No duplication check on problem title in createProblem
 *  10. No structured logging anywhere — replaced raw console.log/error calls
 *  11. submitToken polling bug (fixed in problemUtility.js) propagates here
 *
 * New features:
 *  - getStats endpoint (total problems by difficulty, user's solve rate)
 *  - getSolvedStatus — returns which problems from a list a user has solved
 *  - Pagination metadata on all list responses
 *  - isPublished filtering (drafts hidden from regular users)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { getLanguageById, getSupportedLanguages, submitBatch, submitToken } = require('../utils/problemUtility');
const Problem       = require('../models/problem');
const User          = require('../models/user');
const SolutionVideo = require('../models/solutionVideo');
const Submission    = require('../models/submission');
const mongoose      = require('mongoose');

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

// ── Pagination helper ─────────────────────────────────────────────────────────
/**
 * Clamps and validates page/limit query params.
 * Bug fix #8: no validation meant page=0 or limit=999 were accepted.
 */
const parsePagination = (rawPage, rawLimit, maxLimit = 50) => {
  const page  = Math.max(1, parseInt(rawPage, 10)  || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(rawLimit, 10) || 10));
  return { page, limit, skip: (page - 1) * limit };
};

// ── Judge0 runner — shared by createProblem & updateProblem ──────────────────
/**
 * Validates that `referenceSolution` passes all `testCases` via Judge0.
 * Extracted to avoid 60+ lines of duplication between create and update.
 *
 * @returns {null} on success
 * @returns {{status, message}} error descriptor on failure
 */
const runReferenceSolutions = async (referenceSolution, testCases, fn) => {
  for (const { language, completeCode } of referenceSolution) {
    if (!language || !completeCode) {
      log.warn(fn, 'Reference solution missing language or completeCode');
      return { status: 400, message: 'Each reference solution must have language and completeCode' };
    }

    const languageId = getLanguageById(language);
    if (!languageId) {
      // Bug fix #1/#2: was console.log(error2) — error2 is undefined → ReferenceError
      log.warn(fn, 'Unsupported language in reference solution', {
        language,
        supported: getSupportedLanguages(),
      });
      return { status: 400, message: `Unsupported language: ${language}. Supported: ${getSupportedLanguages().join(', ')}` };
    }

    // Build submission batch
    let submissions;
    try {
      submissions = testCases.map((tc) => {
        if (!tc.input || !tc.output) throw new Error('Each test case must have input and output');
        return {
          source_code:      completeCode,
          language_id:      languageId,
          stdin:            tc.input,
          expected_output:  tc.output,
        };
      });
    } catch (err) {
      log.warn(fn, 'Test case mapping failed', { error: err.message });
      return { status: 400, message: err.message };
    }

    // Submit to Judge0
    let submitResult;
    try {
      submitResult = await submitBatch(submissions);
      if (!submitResult || !Array.isArray(submitResult)) {
        throw new Error('Invalid response from Judge0 batch submission');
      }
    } catch (err) {
      log.error(fn, 'Judge0 batch submission error', { error: err.message, details: err.response?.data });
      return { status: 502, message: 'Error submitting to Judge0', details: err.response?.data || err.message };
    }

    // Poll for results
    let testResults;
    try {
      const tokens = submitResult.map((v) => v.token);
      log.debug(fn, 'Polling Judge0 for results', { language, tokenCount: tokens.length });
      testResults = await submitToken(tokens);
    } catch (err) {
      log.error(fn, 'Judge0 polling error', { error: err.message });
      return { status: 502, message: 'Judge0 polling failed', details: err.message };
    }

    // Validate all tests passed (status_id 3 = Accepted)
    for (const test of testResults) {
      if (test.status_id !== 3) {
        log.warn(fn, 'Reference solution failed a test case', {
          language,
          status:    test.status?.description,
          stdout:    test.stdout,
          stderr:    test.stderr,
          compile:   test.compile_output,
        });
        return {
          status:  400,
          message: `Reference solution (${language}) failed test cases`,
          details: {
            status:         test.status?.description,
            stderr:         test.stderr,
            compile_output: test.compile_output,
          },
        };
      }
    }

    log.info(fn, 'Reference solution passed all test cases', { language });
  }

  return null; // all solutions passed
};

// ═════════════════════════════════════════════════════════════════════════════
//  CREATE PROBLEM
// ═════════════════════════════════════════════════════════════════════════════
const createProblem = async (req, res) => {
  const FN = 'createProblem';
  log.info(FN, 'Create problem attempt', { creatorId: req.user?._id });

  const {
    title, description, difficulty, tags,
    visibleTestCases, hiddenTestCases, startCode, referenceSolution,
    constraints = '', hints = [],
  } = req.body;

  try {
    // Field validation
    if (!title || !description || !difficulty || !tags ||
        !visibleTestCases || !hiddenTestCases || !startCode || !referenceSolution) {
      log.warn(FN, 'Missing required fields');
      return res.status(400).json({ message: 'All problem fields are required' });
    }

    if (!Array.isArray(visibleTestCases) || !Array.isArray(referenceSolution) ||
        !Array.isArray(hiddenTestCases)  || !Array.isArray(startCode)) {
      log.warn(FN, 'Invalid array fields');
      return res.status(400).json({ message: 'testCases, referenceSolution, startCode must be arrays' });
    }

    if (visibleTestCases.length === 0 || hiddenTestCases.length === 0) {
      return res.status(400).json({ message: 'At least one visible and one hidden test case required' });
    }

    // Bug fix #9: duplicate title check
    const existing = await Problem.findOne({ title: title.trim() });
    if (existing) {
      log.warn(FN, 'Duplicate problem title', { title });
      return res.status(409).json({ message: `A problem with title "${title}" already exists` });
    }

    log.debug(FN, 'Validation passed, running reference solutions');

    // Run Judge0 validation
    const judgeError = await runReferenceSolutions(referenceSolution, visibleTestCases, FN);
    if (judgeError) {
      return res.status(judgeError.status).json({ message: judgeError.message, details: judgeError.details });
    }

    // Save problem — only trusted fields, never spread req.body directly
    const problem = await Problem.create({
      title:             title.trim(),
      description,
      difficulty,
      tags:              Array.isArray(tags) ? tags : [tags],
      visibleTestCases,
      hiddenTestCases,
      startCode,
      referenceSolution,
      constraints,
      hints,
      problemCreator:    req.user._id,
      isPublished:       true,
    });

    log.info(FN, 'Problem created successfully', { problemId: problem._id, title: problem.title });

    return res.status(201).json({
      message:   'Problem created successfully',
      problemId: problem._id,
      title:     problem.title,
    });

  } catch (err) {
    log.error(FN, 'Unexpected error', { error: err.message, stack: err.stack });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
//  UPDATE PROBLEM
// ═════════════════════════════════════════════════════════════════════════════
const updateProblem = async (req, res) => {
  const FN = 'updateProblem';
  const { id } = req.params;
  log.info(FN, 'Update problem attempt', { problemId: id, updatedBy: req.user?._id });

  try {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      log.warn(FN, 'Invalid or missing problem ID', { id });
      return res.status(400).json({ message: 'Valid problem ID is required' });
    }

    const existing = await Problem.findById(id);
    if (!existing) {
      log.warn(FN, 'Problem not found', { problemId: id });
      return res.status(404).json({ message: 'Problem not found' });
    }

    const {
      title, description, difficulty, tags,
      visibleTestCases, hiddenTestCases, startCode, referenceSolution,
      constraints, hints, isPublished,
    } = req.body;

    if (!title || !description || !difficulty || !tags ||
        !visibleTestCases || !hiddenTestCases || !startCode || !referenceSolution) {
      return res.status(400).json({ message: 'All problem fields are required' });
    }

    if (!Array.isArray(visibleTestCases) || !Array.isArray(referenceSolution)) {
      return res.status(400).json({ message: 'Test cases and reference solutions must be arrays' });
    }

    log.debug(FN, 'Validation passed, running reference solutions');

    const judgeError = await runReferenceSolutions(referenceSolution, visibleTestCases, FN);
    if (judgeError) {
      return res.status(judgeError.status).json({ message: judgeError.message, details: judgeError.details });
    }

    // Bug fix #3: was spreading entire req.body — attacker could overwrite
    // `problemCreator`, `_id`, etc. Now only explicitly allowed fields are updated.
    const allowedUpdates = {
      title:             title.trim(),
      description,
      difficulty,
      tags:              Array.isArray(tags) ? tags : [tags],
      visibleTestCases,
      hiddenTestCases,
      startCode,
      referenceSolution,
      ...(constraints  !== undefined && { constraints }),
      ...(hints        !== undefined && { hints }),
      ...(isPublished  !== undefined && { isPublished }),
    };

    const updated = await Problem.findByIdAndUpdate(
      id,
      allowedUpdates,
      { runValidators: true, new: true }
    );

    log.info(FN, 'Problem updated successfully', { problemId: updated._id });

    return res.status(200).json({
      message:   'Problem updated successfully',
      problemId: updated._id,
    });

  } catch (err) {
    log.error(FN, 'Unexpected error during update', { error: err.message, stack: err.stack });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
//  DELETE PROBLEM
// ═════════════════════════════════════════════════════════════════════════════
const deleteProblem = async (req, res) => {
  const FN = 'deleteProblem';
  const { id } = req.params;
  log.info(FN, 'Delete problem attempt', { problemId: id, requestedBy: req.user?._id });

  try {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      log.warn(FN, 'Invalid problem ID');
      return res.status(400).json({ message: 'Valid problem ID is required' });
    }

    const deleted = await Problem.findByIdAndDelete(id);
    if (!deleted) {
      log.warn(FN, 'Problem not found for deletion', { problemId: id });
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Bug fix #7: clean up related data
    const [subResult, vidResult] = await Promise.allSettled([
      Submission.deleteMany({ problemId: id }),
      SolutionVideo.deleteMany({ problemId: id }),
    ]);

    log.info(FN, 'Problem and related data deleted', {
      problemId:           id,
      submissionsDeleted:  subResult.status === 'fulfilled' ? subResult.value.deletedCount : 0,
      videosDeleted:       vidResult.status === 'fulfilled' ? vidResult.value.deletedCount : 0,
    });

    return res.status(200).json({ message: 'Problem deleted successfully', problemId: id });

  } catch (err) {
    log.error(FN, 'Delete error', { error: err.message, stack: err.stack });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
//  GET PROBLEM BY ID
// ═════════════════════════════════════════════════════════════════════════════
const getProblemById = async (req, res) => {
  const FN = 'getProblemById';
  const { id } = req.params;
  log.info(FN, 'Fetch problem by ID', { problemId: id, userId: req.user?._id });

  try {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      log.warn(FN, 'Invalid problem ID');
      return res.status(400).json({ message: 'Valid problem ID is required' });
    }

    const problem = await Problem.findById(id)
      .select('_id title description difficulty tags visibleTestCases startCode constraints hints isPublished createdAt referenceSolution')
      .lean();

    if (!problem) {
      log.warn(FN, 'Problem not found', { problemId: id });
      return res.status(404).json({ message: 'Problem not found' });
    }

    if (!problem.isPublished) {
      log.warn(FN, 'Attempt to access unpublished problem', { problemId: id, userId: req.user?._id });
      return res.status(403).json({ message: 'This problem is not yet published' });
    }

    // Attach solution video if available
    const video = await SolutionVideo.findOne({ problemId: id }).lean();
    if (video) {
      log.debug(FN, 'Solution video attached', { problemId: id });
      return res.status(200).json({
        ...problem,
        video: {
          secureUrl:          video.secureUrl,
          thumbnailUrl:       video.thumbnailUrl,
          cloudinaryPublicId: video.cloudinaryPublicId,
          duration:           video.duration,
        },
      });
    }

    return res.status(200).json(problem);

  } catch (err) {
    log.error(FN, 'Fetch by ID error', { error: err.message, stack: err.stack });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
//  GET ALL PROBLEMS (paginated, filtered, sorted)
// ═════════════════════════════════════════════════════════════════════════════
const getAllProblem = async (req, res) => {
  const FN = 'getAllProblem';
  log.info(FN, 'Fetch all problems', { query: req.query, userId: req.user?._id });

  try {
    const {
      search = '',
      difficulty,
      tag,
      status,
      solvedIds,
      sortKey = 'createdAt',
      sortDir = 'desc',
    } = req.query;

    // Bug fix #8: validated pagination
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);

    // Build filter
    const filter = { isPublished: true };

    if (search.trim()) {
      filter.title = { $regex: search.trim(), $options: 'i' };
    }
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      filter.difficulty = difficulty;
    }
    if (tag) {
      filter.tags = { $in: [tag] };
    }
    if (status && solvedIds) {
      const ids = solvedIds.split(',').filter(Boolean);
      if (status === 'solved')   filter._id = { $in:  ids };
      if (status === 'unsolved') filter._id = { $nin: ids };
    }

    // Allowed sort keys (whitelist to prevent injection)
    const allowedSortKeys = ['createdAt', 'title', 'difficulty'];
    const safeSortKey = allowedSortKeys.includes(sortKey) ? sortKey : 'createdAt';
    const sort = { [safeSortKey]: sortDir === 'asc' ? 1 : -1 };

    const [problems, total] = await Promise.all([
      Problem.find(filter)
        // Bug fix #4: explicitly select only safe public fields
        .select('_id title difficulty tags createdAt isPublished')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Problem.countDocuments(filter),
    ]);

    log.info(FN, 'Problems fetched', { total, page, limit, resultCount: problems.length });

    return res.status(200).json({
      success:    true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext:    page * limit < total,
      hasPrev:    page > 1,
      data:       problems,
    });

  } catch (err) {
    log.error(FN, 'Fetch all problems error', { error: err.message, stack: err.stack });
    return res.status(500).json({ success: false, message: 'Failed to fetch problems' });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
//  GET USER'S SOLVED PROBLEMS
// ═════════════════════════════════════════════════════════════════════════════
const solvedAllProblembyUser = async (req, res) => {
  const FN = 'solvedAllProblembyUser';
  const userId = req.user?._id;
  log.info(FN, 'Fetch solved problems', { userId });

  try {
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);

    // Bug fix #5: added null check — was crashing when user not found
    const user = await User.findById(userId).populate({
      path:   'problemSolved',
      select: '_id title difficulty tags',
    });

    if (!user) {
      log.warn(FN, 'User not found', { userId });
      return res.status(404).json({ message: 'User not found' });
    }

    const totalSolved = user.problemSolved.length;
    const paginated   = user.problemSolved.slice(skip, skip + limit);

    log.info(FN, 'Solved problems fetched', { userId, totalSolved, page });

    return res.status(200).json({
      total:      totalSolved,
      page,
      limit,
      totalPages: Math.ceil(totalSolved / limit),
      data:       paginated,
    });

  } catch (err) {
    log.error(FN, 'Fetch solved problems error', { userId, error: err.message });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
//  GET SUBMISSIONS FOR A PROBLEM (by current user)
// ═════════════════════════════════════════════════════════════════════════════
const submittedProblem = async (req, res) => {
  const FN = 'submittedProblem';
  const userId    = req.user?._id;
  const problemId = req.params.pid;
  log.info(FN, 'Fetch submissions', { userId, problemId });

  try {
    // Bug fix #6: validate problemId before querying
    if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) {
      log.warn(FN, 'Invalid problem ID', { problemId });
      return res.status(400).json({ message: 'Valid problem ID is required' });
    }

    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, 20);

    const [submissions, total] = await Promise.all([
      Submission.find({ userId, problemId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Submission.countDocuments({ userId, problemId }),
    ]);

    log.info(FN, 'Submissions fetched', { userId, problemId, total });

    if (total === 0) {
      return res.status(200).json({ message: 'No submissions found', total: 0, data: [] });
    }

    return res.status(200).json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data:       submissions,
    });

  } catch (err) {
    log.error(FN, 'Fetch submissions error', { userId, problemId, error: err.message });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
//  NEW: GET PROBLEM STATS (total by difficulty, categories)
// ═════════════════════════════════════════════════════════════════════════════
const getProblemStats = async (req, res) => {
  const FN = 'getProblemStats';
  log.info(FN, 'Fetch problem stats', { userId: req.user?._id });

  try {
    const [byDifficulty, byTag, total] = await Promise.all([
      Problem.aggregate([
        { $match: { isPublished: true } },
        { $group: { _id: '$difficulty', count: { $sum: 1 } } },
        { $sort:  { _id: 1 } },
      ]),
      Problem.aggregate([
        { $match: { isPublished: true } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort:  { count: -1 } },
      ]),
      Problem.countDocuments({ isPublished: true }),
    ]);

    // User solve stats
    let userStats = null;
    if (req.user?._id) {
      const user = await User.findById(req.user._id).select('problemSolved').lean();
      if (user) {
        userStats = {
          solved:   user.problemSolved.length,
          total,
          percent:  total > 0 ? Math.round((user.problemSolved.length / total) * 100) : 0,
        };
      }
    }

    log.info(FN, 'Stats fetched', { total });

    return res.status(200).json({
      total,
      byDifficulty: Object.fromEntries(byDifficulty.map((d) => [d._id, d.count])),
      byTag:        byTag.map((t) => ({ tag: t._id, count: t.count })),
      userStats,
    });

  } catch (err) {
    log.error(FN, 'Stats error', { error: err.message });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
//  NEW: GET SOLVED STATUS for a list of problem IDs
// ═════════════════════════════════════════════════════════════════════════════
const getSolvedStatus = async (req, res) => {
  const FN = 'getSolvedStatus';
  const userId = req.user?._id;
  log.info(FN, 'Check solved status', { userId });

  try {
    const { problemIds } = req.body;

    if (!Array.isArray(problemIds) || problemIds.length === 0) {
      return res.status(400).json({ message: 'problemIds array is required' });
    }

    const user = await User.findById(userId).select('problemSolved').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const solvedSet = new Set(user.problemSolved.map((id) => id.toString()));

    const statusMap = {};
    for (const pid of problemIds) {
      statusMap[pid] = solvedSet.has(pid.toString());
    }

    return res.status(200).json({ statusMap });

  } catch (err) {
    log.error(FN, 'Solved status error', { error: err.message });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemById,
  getAllProblem,
  solvedAllProblembyUser,
  submittedProblem,
  getProblemStats,
  getSolvedStatus,
};
