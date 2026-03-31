const express = require('express');
const authRouter = express.Router();

const {
  register,
  login,
  googleAuth,       // Bug fix: was commented out — now imported & registered
  logout,
  getProfile,
  getProfileById,
  adminRegister,
  deleteProfile,
  forgotPassword,
  resetPassword,
} = require('../controller/userAuth');

const userAuthMiddleware  = require('../middleware/userAuth');
const adminAuthMiddleware = require('../middleware/adminAuth');

// ── Public routes ──────────────────────────────────────────────────────────
authRouter.post('/register',      register);
authRouter.post('/login',         login);
authRouter.post('/google-auth',   googleAuth);        // ← Bug fix: uncommented
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password/:token', resetPassword);

// ── Authenticated routes ───────────────────────────────────────────────────
authRouter.post('/logout',         userAuthMiddleware, logout);
authRouter.get('/profiles',        userAuthMiddleware, getProfile);
authRouter.get('/profile/:id',     userAuthMiddleware, getProfileById);
authRouter.delete('/deleteProfile', userAuthMiddleware, deleteProfile);

// ── Auth check (used by frontend checkAuth thunk) ─────────────────────────
authRouter.get('/check', userAuthMiddleware, (req, res) => {
  const reply = {
    firstName: req.user.firstName,
    emailId:   req.user.emailId,
    _id:       req.user._id,
    role:      req.user.role,
  };
  res.status(200).json({ user: reply, message: 'Valid User' });
});

// ── Admin routes ───────────────────────────────────────────────────────────
authRouter.post('/admin/register', adminAuthMiddleware, adminRegister);

module.exports = authRouter;
