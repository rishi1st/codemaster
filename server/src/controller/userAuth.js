const User = require('../models/user');
const validate = require('../utils/validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const sendEmail = require('../utils/mailer');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─────────────────────────────────────────────────────────────────────────────
//  Structured Logger  — JSON lines, compatible with Datadog / Logtail / Winston
// ─────────────────────────────────────────────────────────────────────────────
const log = {
  info:  (fn, msg, meta = {}) => console.log  (JSON.stringify({ level: 'INFO',  fn, msg, ...meta, ts: new Date().toISOString() })),
  warn:  (fn, msg, meta = {}) => console.warn (JSON.stringify({ level: 'WARN',  fn, msg, ...meta, ts: new Date().toISOString() })),
  error: (fn, msg, meta = {}) => console.error(JSON.stringify({ level: 'ERROR', fn, msg, ...meta, ts: new Date().toISOString() })),
  debug: (fn, msg, meta = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(JSON.stringify({ level: 'DEBUG', fn, msg, ...meta, ts: new Date().toISOString() }));
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  Shared helper — sign JWT and set HttpOnly cookie
// ─────────────────────────────────────────────────────────────────────────────
const issueTokenCookie = (res, payload) => {
  const token = jwt.sign(payload, process.env.JWT_KEY, { expiresIn: 3600 });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000,
  });
  return token;
};

// ─────────────────────────────────────────────────────────────────────────────
//  REGISTER
// ─────────────────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  const FN = 'register';
  log.info(FN, 'Registration attempt', { emailId: req.body?.emailId });

  try {
    // Bug fix: validator now mirrors frontend Zod rules — no more "week Password"
    validate(req.body);
    log.debug(FN, 'Validation passed');

    const { emailId, password } = req.body;
    const normalizedEmail = emailId.trim().toLowerCase();

    // Duplicate email guard
    const existing = await User.findOne({ emailId: normalizedEmail });
    if (existing) {
      log.warn(FN, 'Duplicate registration attempt', { emailId: normalizedEmail });
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      ...req.body,
      emailId: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      role: 'user',   // Bug fix: never trust client-sent role
    });

    log.info(FN, 'User created', { userId: user._id, emailId: user.emailId });

    issueTokenCookie(res, { _id: user._id, role: 'user', emailId: user.emailId });

    log.info(FN, 'Registration successful, token issued', { userId: user._id });

    return res.status(201).json({
      user: { _id: user._id, firstName: user.firstName, emailId: user.emailId, role: user.role },
      message: 'User registered successfully',
    });

  } catch (error) {
    log.error(FN, 'Registration failed', { error: error.message, stack: error.stack });
    // Bug fix: return error.message directly so frontend can display it
    return res.status(400).json({ message: error.message || 'Registration failed' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const FN = 'login';
  log.info(FN, 'Login attempt', { emailId: req.body?.emailId });

  try {
    const { emailId, password } = req.body;

    if (!emailId || !password) {
      log.warn(FN, 'Missing credentials');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ emailId: emailId.trim().toLowerCase() });

    // Bug fix: null-check user BEFORE bcrypt to prevent crash
    if (!user) {
      log.warn(FN, 'Login failed – user not found', { emailId });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Bug fix: block Google-auth users from password login
    if (user.isGoogleAuth) {
      log.warn(FN, 'Google-auth user attempted password login', { userId: user._id });
      return res.status(400).json({
        message: 'This account uses Google Sign-In. Please continue with Google.',
        googleAuth: true,
      });
    }

    log.debug(FN, 'User found, comparing password', { userId: user._id });

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      log.warn(FN, 'Login failed – wrong password', { userId: user._id });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    issueTokenCookie(res, { _id: user._id, role: user.role, emailId: user.emailId });

    log.info(FN, 'Login successful', { userId: user._id, role: user.role });

    return res.status(200).json({
      user: { _id: user._id, firstName: user.firstName, emailId: user.emailId, role: user.role },
      message: 'Logged in successfully',
    });

  } catch (error) {
    log.error(FN, 'Login error', { error: error.message, stack: error.stack });
    return res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GOOGLE AUTH — unified login + register via Google ID token
// ─────────────────────────────────────────────────────────────────────────────
const googleAuth = async (req, res) => {
  const FN = 'googleAuth';
  log.info(FN, 'Google auth attempt');

  try {
    const { credential } = req.body;

    if (!credential) {
      log.warn(FN, 'No Google credential provided');
      return res.status(400).json({ message: 'Google credential is required' });
    }

    // Verify the Google ID token cryptographically
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyError) {
      log.error(FN, 'Google token verification failed', { error: verifyError.message });
      return res.status(401).json({ message: 'Invalid Google credential. Please try again.' });
    }

    const { sub: googleId, email, given_name, family_name, picture } = ticket.getPayload();
    const normalizedEmail = email.toLowerCase();

    log.debug(FN, 'Google token verified', { googleId, email: normalizedEmail });

    // Look up by googleId first, then fall back to email (for account linking)
    let user = await User.findOne({ $or: [{ googleId }, { emailId: normalizedEmail }] });
    let isNewUser = false;

    if (!user) {
      // ── New user: register via Google ──────────────────────────────────────
      user = await User.create({
        firstName: given_name || normalizedEmail.split('@')[0],
        lastName: family_name || '',
        emailId: normalizedEmail,
        googleId,
        isGoogleAuth: true,
        role: 'user',
        profilePhoto: picture || null,
        // Random 32-byte unusable password — satisfies schema `required: true`
        password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
      });
      isNewUser = true;
      log.info(FN, 'New user created via Google', { userId: user._id, emailId: user.emailId });

    } else if (!user.googleId) {
      // ── Existing email account: link Google to it ─────────────────────────
      user.googleId     = googleId;
      user.isGoogleAuth = true;
      if (picture && !user.profilePhoto) user.profilePhoto = picture;
      await user.save();
      log.info(FN, 'Existing account linked to Google', { userId: user._id });

    } else {
      // ── Returning Google user ─────────────────────────────────────────────
      log.info(FN, 'Existing Google user logged in', { userId: user._id });
    }

    issueTokenCookie(res, { _id: user._id, role: user.role, emailId: user.emailId });

    return res.status(isNewUser ? 201 : 200).json({
      user: { _id: user._id, firstName: user.firstName, emailId: user.emailId, role: user.role },
      message: isNewUser ? 'Account created with Google' : 'Logged in with Google',
      isNewUser,
    });

  } catch (error) {
    log.error(FN, 'Google auth error', { error: error.message, stack: error.stack });
    return res.status(500).json({ message: 'Google authentication failed. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  LOGOUT
// ─────────────────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  const FN = 'logout';
  log.info(FN, 'Logout attempt');

  try {
    const { token } = req.cookies;

    if (!token) {
      log.warn(FN, 'No token found in cookies');
      return res.status(400).json({ message: 'No active session found' });
    }

    // Bug fix: use jwt.VERIFY (not decode) to reject tampered tokens
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_KEY);
    } catch (jwtError) {
      log.warn(FN, 'Invalid or expired token on logout — clearing cookie anyway', { error: jwtError.message });
      res.clearCookie('token');
      return res.status(200).json({ message: 'Logged out successfully' });
    }

    // Blocklist token in Redis until it would naturally expire
    await redisClient.set(`token:${token}`, 'blocked');
    await redisClient.expireAt(`token:${token}`, payload.exp);

    res.clearCookie('token');
    log.info(FN, 'Logout successful, token blocklisted', { userId: payload._id, exp: payload.exp });

    return res.status(200).json({ message: 'Logged out successfully' });

  } catch (error) {
    log.error(FN, 'Logout error', { error: error.message, stack: error.stack });
    return res.status(500).json({ message: 'Logout failed. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET ALL PROFILES  (admin-only — guard in router)
// ─────────────────────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  const FN = 'getProfile';
  log.info(FN, 'Fetching all profiles', { requestedBy: req.user?._id });

  try {
    // Bug fix: strip sensitive fields — never send password / reset tokens
    const profiles = await User.find({}).select(
      '-password -resetPasswordToken -resetPasswordExpires'
    );
    log.info(FN, 'Profiles fetched', { count: profiles.length });
    return res.status(200).json(profiles);

  } catch (error) {
    log.error(FN, 'Failed to fetch profiles', { error: error.message, stack: error.stack });
    return res.status(500).json({ message: 'Failed to fetch profiles' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET PROFILE BY ID
// ─────────────────────────────────────────────────────────────────────────────
const getProfileById = async (req, res) => {
  const FN = 'getProfileById';
  const { id } = req.params;
  log.info(FN, 'Fetching profile by ID', { targetId: id, requestedBy: req.user?._id });

  try {
    const user = await User.findById(id).select(
      '-password -resetPasswordToken -resetPasswordExpires'
    );

    if (!user) {
      log.warn(FN, 'User not found', { targetId: id });
      return res.status(404).json({ message: 'User not found' });
    }

    log.info(FN, 'Profile fetched', { targetId: id });
    return res.status(200).json(user);

  } catch (error) {
    log.error(FN, 'Failed to fetch profile', { targetId: id, error: error.message, stack: error.stack });
    return res.status(400).json({ message: 'Failed to fetch profile' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN REGISTER
// ─────────────────────────────────────────────────────────────────────────────
const adminRegister = async (req, res) => {
  const FN = 'adminRegister';
  log.info(FN, 'Admin registration attempt', { emailId: req.body?.emailId });

  try {
    validate(req.body);

    const { emailId, password } = req.body;
    const normalizedEmail = emailId.trim().toLowerCase();

    const existing = await User.findOne({ emailId: normalizedEmail });
    if (existing) {
      log.warn(FN, 'Duplicate admin registration', { emailId: normalizedEmail });
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      ...req.body,
      emailId: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      role: 'admin',   // Bug fix: always set server-side
    });

    issueTokenCookie(res, { _id: user._id, role: 'admin', emailId: user.emailId });

    log.info(FN, 'Admin registered successfully', { userId: user._id });
    return res.status(201).json({ message: 'Admin registered successfully' });

  } catch (error) {
    log.error(FN, 'Admin registration failed', { error: error.message, stack: error.stack });
    return res.status(400).json({ message: error.message || 'Admin registration failed' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE PROFILE
// ─────────────────────────────────────────────────────────────────────────────
const deleteProfile = async (req, res) => {
  const FN = 'deleteProfile';
  const userId = req.user?._id;
  log.info(FN, 'Account deletion request', { userId });

  try {
    if (!userId) {
      log.warn(FN, 'No user ID on request');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) {
      log.warn(FN, 'User to delete not found', { userId });
      return res.status(404).json({ message: 'User not found' });
    }

    log.info(FN, 'User deleted', { userId });
    res.clearCookie('token');
    return res.status(200).json({ message: 'Account deleted successfully' });

  } catch (error) {
    log.error(FN, 'Delete profile error', { userId, error: error.message, stack: error.stack });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  FORGOT PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  const FN = 'forgotPassword';
  log.info(FN, 'Forgot-password request', { emailId: req.body?.emailId });

  try {
    const { emailId } = req.body;

    if (!emailId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailId)) {
      log.warn(FN, 'Invalid email format');
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const user = await User.findOne({ emailId: emailId.trim().toLowerCase() });

    // Security: identical response whether user exists or not (prevents enumeration)
    if (!user) {
      log.warn(FN, 'Password reset for unknown email (silent)', { emailId });
      return res.status(200).json({
        message: 'If this email exists in our system, you will receive a reset link shortly',
      });
    }

    if (user.isGoogleAuth) {
      log.warn(FN, 'Password reset on Google-auth account', { userId: user._id });
      return res.status(400).json({
        message: 'This account uses Google Sign-In. Please sign in with Google.',
        googleAuth: true,
      });
    }

    const rawToken    = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken   = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 min
    await user.save();

    log.debug(FN, 'Reset token saved', { userId: user._id, expiresIn: '15min' });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;

    try {
      await sendEmail({
        to: user.emailId,
        subject: 'Password Reset — CodeMaster',
        html: buildResetEmailHtml(resetUrl),
      });
      log.info(FN, 'Password reset email sent', { userId: user._id });
      return res.status(200).json({
        message: 'Password reset email sent if the account exists',
        success: true,
      });

    } catch (emailError) {
      log.error(FN, 'Email failed — rolling back token', {
        userId: user._id,
        error: emailError.message,
      });
      user.resetPasswordToken   = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res.status(500).json({ message: 'Failed to send reset email. Please try again later.' });
    }

  } catch (error) {
    log.error(FN, 'Forgot-password unexpected error', { error: error.message, stack: error.stack });
    return res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  RESET PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  const FN = 'resetPassword';
  log.info(FN, 'Password reset attempt');

  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!token || !newPassword) {
      log.warn(FN, 'Missing token or new password');
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken:   hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      log.warn(FN, 'Invalid or expired reset token used');
      return res.status(400).json({
        message: 'Invalid or expired reset link. Please request a new one.',
      });
    }

    log.debug(FN, 'Valid reset token, updating password', { userId: user._id });

    user.password             = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    log.info(FN, 'Password reset successful', { userId: user._id, emailId: user.emailId });

    return res.status(200).json({
      message: 'Password has been reset successfully. You can now log in.',
    });

  } catch (error) {
    log.error(FN, 'Reset-password error', { error: error.message, stack: error.stack });
    return res.status(500).json({ message: 'Failed to reset password. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  Email Template
// ─────────────────────────────────────────────────────────────────────────────
const buildResetEmailHtml = (resetUrl) => `
  <div style="background:#0f172a;color:#e2e8f0;font-family:'Segoe UI',Tahoma,sans-serif;
              padding:40px 30px;border-radius:16px;max-width:560px;margin:auto;
              box-shadow:0 8px 40px rgba(0,0,0,0.6);">
    <div style="text-align:center;margin-bottom:28px;">
      <span style="font-size:32px;">🔐</span>
      <h2 style="color:#60a5fa;margin:12px 0 4px;font-size:22px;">Password Reset</h2>
      <p style="color:#94a3b8;font-size:13px;margin:0;">CodeMaster Account Security</p>
    </div>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin-bottom:28px;">
      We received a request to reset your password. Click the button below to choose a new one.
      This link expires in <strong style="color:#f87171;">15 minutes</strong>.
    </p>
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${resetUrl}"
         style="background:linear-gradient(90deg,#4f46e5,#3b82f6);color:#fff;
                padding:14px 36px;font-size:15px;font-weight:600;
                text-decoration:none;border-radius:10px;display:inline-block;
                box-shadow:0 4px 20px rgba(59,130,246,0.5);">
        Reset My Password
      </a>
    </div>
    <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0;">
    <p style="font-size:12px;color:#64748b;line-height:1.6;text-align:center;">
      If you didn't request this, you can safely ignore this email.<br/>
      🔒 We never store your password in plain text.
    </p>
  </div>
`;

// ─────────────────────────────────────────────────────────────────────────────
//  Exports
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  register,
  login,
  googleAuth,    // ← NEW: was missing from exports
  logout,
  getProfile,
  getProfileById,
  adminRegister,
  deleteProfile,
  forgotPassword,
  resetPassword,
};
