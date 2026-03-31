/**
 * models/problem.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Bug fixes:
 *  1. tags was type String — a problem can only have ONE tag. Changed to [String]
 *     so problems can belong to multiple categories (e.g. ['array','dp']).
 *     This also matches the existing getAllProblem filter: filter.tags = { $in: [tag] }
 *  2. No timestamps — impossible to sort by creation date, audit changes, or
 *     implement "newest problems" features. Added timestamps: true.
 *  3. No DB indexes — title search ($regex), difficulty filter, and tag filter
 *     all did full collection scans. Added compound + individual indexes.
 *
 * New:
 *  - constraints field (problem constraints string)
 *  - hints array (optional hints for the problem)
 *  - isPublished flag (draft vs live)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

// ── Sub-schemas ───────────────────────────────────────────────────────────────
const visibleTestCaseSchema = new Schema(
  {
    input:       { type: String, required: true },
    output:      { type: String, required: true },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const hiddenTestCaseSchema = new Schema(
  {
    input:  { type: String, required: true },
    output: { type: String, required: true },
  },
  { _id: false }
);

const startCodeSchema = new Schema(
  {
    language:    { type: String, required: true },
    initialCode: { type: String, required: true },
  },
  { _id: false }
);

const referenceSolutionSchema = new Schema(
  {
    language:     { type: String, required: true },
    completeCode: { type: String, required: true },
  },
  { _id: false }
);

// ── Main schema ───────────────────────────────────────────────────────────────
const problemSchema = new Schema(
  {
    title: {
      type:     String,
      required: true,
      trim:     true,
    },
    description: {
      type:     String,
      required: true,
    },
    difficulty: {
      type:     String,
      enum:     ['easy', 'medium', 'hard'],
      required: true,
    },

    // Bug fix #1: was `type: String` — only one tag allowed.
    // Changed to [String] so a problem can have multiple tags.
    // The getAllProblem query already uses $in which expects an array field.
    tags: {
      type: [String],
      enum: ['array', 'linkedList', 'graph', 'dp', 'math', 'recursion', 'loops', 'string', 'search', 'tree', 'greedy', 'backtracking', 'twoPointers', 'slidingWindow', 'binarySearch'],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message:   'At least one tag is required',
      },
    },

    visibleTestCases:  { type: [visibleTestCaseSchema],  required: true },
    hiddenTestCases:   { type: [hiddenTestCaseSchema],   required: true },
    startCode:         { type: [startCodeSchema],        required: true },
    referenceSolution: { type: [referenceSolutionSchema], required: true },

    problemCreator: {
      type:     Schema.Types.ObjectId,
      ref:      'user',
      required: true,
    },

    // New fields
    constraints: {
      type:    String,
      default: '',
    },
    hints: {
      type:    [String],
      default: [],
    },
    isPublished: {
      type:    Boolean,
      default: true,
    },
    solvableCount: {
      type:    Number,
      default: 0,
      min:     0,
    },
  },
  {
    // Bug fix #2: timestamps were missing — can't sort/filter by creation date
    timestamps: true,
  }
);

// ── Indexes (Bug fix #3) ──────────────────────────────────────────────────────
// Title search (case-insensitive regex queries)
problemSchema.index({ title: 'text' });
// Compound index for the most common filter combo: difficulty + tags
problemSchema.index({ difficulty: 1, tags: 1 });
// Sort by creation date (newest first is default in getAllProblem)
problemSchema.index({ createdAt: -1 });
// isPublished for draft filtering
problemSchema.index({ isPublished: 1 });

// ── Model ─────────────────────────────────────────────────────────────────────
const Problem = mongoose.model('problem', problemSchema);
module.exports = Problem;
