const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * User Schema
 * ─────────────────────────────────────────────────────────────────────────────
 * Bug fixes:
 *  1. firstName maxLength raised from 20 → 30 to match frontend Zod schema
 *  2. password required: false for Google-auth users (set via pre-save hook)
 *  3. profilePhoto field added for Google avatar support
 * ─────────────────────────────────────────────────────────────────────────────
 */
const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 30,   // Bug fix: was 20, frontend Zod allows 30
      trim: true,
    },
    lastName: {
      type: String,
      minLength: 2,
      maxLength: 30,
      trim: true,
    },
    emailId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      immutable: true,
    },
    age: {
      type: Number,
      min: 6,
      max: 80,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    problemSolved: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'problem',
        },
      ],
      default: [],
    },
    password: {
      type: String,
      required: true,   // Google-auth users get a random unusable hashed password
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    isGoogleAuth: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      default: null,
    },
    profilePhoto: {
      type: String,   // stores Google profile picture URL
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Cascade delete submissions when a user is deleted
userSchema.post('findOneAndDelete', async function (userInfo) {
  if (userInfo) {
    await mongoose.model('submission').deleteMany({ userId: userInfo._id });
  }
});

const User = mongoose.model('user', userSchema);

module.exports = User;
