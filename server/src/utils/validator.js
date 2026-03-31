/**
 * validator.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Server-side input validator — mirrors the frontend Zod schema EXACTLY.
 * Throws a descriptive Error on any violation so controllers can catch cleanly.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const validate = (data = {}) => {
    const { firstName, emailId, password } = data;
  
    // ── firstName ──────────────────────────────────────────────────────────────
    if (!firstName || typeof firstName !== 'string' || !firstName.trim()) {
      throw new Error('First name is required');
    }
    const name = firstName.trim();
    if (name.length < 3)  throw new Error('Name should contain at least 3 characters');
    if (name.length > 30) throw new Error('Name should not exceed 30 characters');
  
    // ── emailId ────────────────────────────────────────────────────────────────
    if (!emailId || typeof emailId !== 'string' || !emailId.trim()) {
      throw new Error('Email is required');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailId.trim())) {
      throw new Error('Invalid email address');
    }
  
    // ── password ───────────────────────────────────────────────────────────────
    if (!password || typeof password !== 'string') {
      throw new Error('Password is required');
    }
    if (password.length < 8)  throw new Error('Password should be at least 8 characters');
    if (password.length > 20) throw new Error('Password should not exceed 20 characters');
  
    // Must contain at least one special character — same regex as Zod schema
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharRegex.test(password)) {
      throw new Error('Password must contain at least one special symbol (!@#$...)');
    }
  };
  
  module.exports = validate;
  