/**
 * routes/problemCreater.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Bug fix / Route ordering:
 *  Express matches routes top-to-bottom. Static paths like "/solved" and
 *  "/stats" MUST be registered BEFORE the dynamic "/:id" route, otherwise
 *  Express interprets "solved" and "stats" as an :id value and routes them
 *  to getProblemById instead.
 *
 *  Original order was correct by accident; this file makes the intent explicit
 *  with comments and adds the new endpoints from the controller.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express        = require('express');
const problemRouter  = express.Router();

const adminAuthMiddleware = require('../middleware/adminAuth');
const userAuthMiddleware  = require('../middleware/userAuth');

const {
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemById,
  getAllProblem,
  solvedAllProblembyUser,
  submittedProblem,
  getProblemStats,
  getSolvedStatus,
} = require('../controller/userProblem');

// ── Admin routes ──────────────────────────────────────────────────────────────
problemRouter.post  ('/create',        adminAuthMiddleware, createProblem);
problemRouter.put   ('/update/:id',    adminAuthMiddleware, updateProblem);
problemRouter.delete('/delete/:id',    adminAuthMiddleware, deleteProblem);

// ── IMPORTANT: static routes MUST come before /:id ───────────────────────────
// If "/stats" were placed after "/:id", Express would match it as an ID value.

// GET /problem/stats — problem count breakdown by difficulty/tag + user solve %
problemRouter.get('/stats', userAuthMiddleware, getProblemStats);

// GET /problem/solved — paginated list of problems solved by current user
problemRouter.get('/solved', userAuthMiddleware, solvedAllProblembyUser);

// POST /problem/solved-status — check which problem IDs from a list are solved
problemRouter.post('/solved-status', userAuthMiddleware, getSolvedStatus);

// GET /problem/submittedProblem/:pid — user's submissions for a specific problem
problemRouter.get('/submittedProblem/:pid', userAuthMiddleware, submittedProblem);

// ── Dynamic routes (MUST come last) ──────────────────────────────────────────
// GET /problem/:id — fetch a single problem by MongoDB ObjectId
problemRouter.get('/:id', userAuthMiddleware, getProblemById);

// GET /problem — paginated + filtered problem list
problemRouter.get('/', userAuthMiddleware, getAllProblem);

module.exports = problemRouter;
