/**
 * models/submission.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Bug fixes:
 *  1. lenguage enum was ["javascript","c++","java"] — "python" and "c" were
 *     missing. Any Python or C submission failed Mongoose validation before
 *     ever reaching Judge0. Added all supported languages.
 *  2. No index on createdAt — submissions always queried sorted DESC by date,
 *     causing a full collection scan on every load.
 *  3. No index on status — filter-by-status queries were O(n).
 *
 * New:
 *  - code field has maxlength guard at schema level (50 KB)
 *  - testCaseResults stored per submission for richer history view
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require("mongoose");
const { Schema } = mongoose;

// ── Per-test-case result sub-document ────────────────────────────────────────
const testCaseResultSchema = new Schema(
  {
    input:          { type: String, default: "" },
    expectedOutput: { type: String, default: "" },
    userOutput:     { type: String, default: null },
    passed:         { type: Boolean, default: false },
    status:         { type: String, default: "Unknown" },
    runtime:        { type: Number, default: 0 },  // ms
    memory:         { type: Number, default: 0 },  // KB
  },
  { _id: false }
);

// ── Main schema ───────────────────────────────────────────────────────────────
const submissionSchema = new Schema(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      "user",
      required: true,
    },
    problemId: {
      type:     Schema.Types.ObjectId,
      ref:      "problem",
      required: true,
    },
    code: {
      type:      String,
      required:  true,
      maxlength: [51200, "Code must not exceed 50 KB"],  // guard against huge payloads
    },

    // Bug fix #1: "python" and "c" were missing — Python/C submissions always
    // failed schema validation before Judge0 was ever called.
    lenguage: {
      type:     String,
      required: true,
      enum:     ["javascript", "c++", "java", "python", "c"],
    },

    status: {
      type:    String,
      enum:    ["pending", "accepted", "wrong", "error"],
      default: "pending",
    },

    runtime:  { type: Number, default: 0 },  // average ms across passing cases
    memory:   { type: Number, default: 0 },  // peak KB across ALL cases

    errorMessage:    { type: String,  default: "" },
    testCasesPassed: { type: Number,  default: 0  },
    testCasesTotal:  { type: Number,  default: 0  },

    // Store per-test details so the UI can show a rich submission breakdown
    testCaseResults: { type: [testCaseResultSchema], default: [] },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Primary lookup: user's submissions for a specific problem (used by Submissions.jsx)
submissionSchema.index({ userId: 1, problemId: 1 });

// Bug fix #2: sort by newest first is the default in submittedProblem controller
submissionSchema.index({ createdAt: -1 });

// Bug fix #3: filter by status (accepted / wrong / error) without full scan
submissionSchema.index({ status: 1 });

// Combined index for admin / analytics queries (problem-wide stats)
submissionSchema.index({ problemId: 1, status: 1 });

// ── Model ─────────────────────────────────────────────────────────────────────
module.exports = mongoose.model("submission", submissionSchema);
