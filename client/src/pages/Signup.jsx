import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router';
import { registerUser, googleAuthUser, clearError } from '../redux/authSlice';
import { Eye, EyeOff, Sparkles, Terminal, ArrowRight, Cpu, Brain, Trophy, Check } from 'lucide-react';

// ── Zod schema ─────────────────────────────────────────────────────────────
const signupSchema = z.object({
  firstName: z
    .string()
    .min(3, 'At least 3 characters required')
    .max(30, 'Max 30 characters'),
  emailId: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'At least 8 characters required')
    .max(20, 'Max 20 characters')
    .refine((v) => /[!@#$%^&*(),.?":{}|<>]/.test(v), {
      message: 'Must contain at least one special symbol',
    }),
  // Bug fix: terms checkbox validated via Zod — form won't submit without it
  terms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the Terms to continue' }),
  }),
});

// ── Google GSI loader ──────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const loadGSI = () =>
  new Promise((resolve) => {
    if (window.google?.accounts) return resolve();
    if (document.getElementById('gsi-script')) {
      document.getElementById('gsi-script').addEventListener('load', resolve);
      return;
    }
    const s = document.createElement('script');
    s.id = 'gsi-script';
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = resolve;
    document.head.appendChild(s);
  });

const FEATURES = [
  { icon: Cpu,    label: '500+ problems with AI hints',     color: '#22d3ee' },
  { icon: Brain,  label: 'Visual algorithm walkthroughs',   color: '#818cf8' },
  { icon: Trophy, label: 'Real-time leaderboards & streaks', color: '#34d399' },
];

const PASSWORD_RULES = [
  { test: (v) => v.length >= 8,                           label: '8+ characters'       },
  { test: (v) => v.length <= 20,                          label: 'Max 20 characters'   },
  { test: (v) => /[!@#$%^&*(),.?":{}|<>]/.test(v),       label: 'Special symbol'      },
];

// ═══════════════════════════════════════════════════════════════════════════
const Signup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((s) => s.auth);

  const [showPass,  setShowPass]  = useState(false);
  const [gLoading,  setGLoading]  = useState(false);
  const [visible,   setVisible]   = useState(false);
  const [passVal,   setPassVal]   = useState('');
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const googleBtnRef = useRef(null);
  const containerRef = useRef(null);
  const initializedRef = useRef(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { terms: false },
  });

  // Watch password for strength indicator
  const watchedPass = watch('password', '');
  useEffect(() => setPassVal(watchedPass || ''), [watchedPass]);

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => () => dispatch(clearError()), [dispatch]);

  // Cursor glow
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const move = (e) => {
      const rect = el.getBoundingClientRect();
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    el.addEventListener('mousemove', move);
    return () => el.removeEventListener('mousemove', move);
  }, []);

  const onGoogleCredential = useCallback(
    async (resp) => {
      setGLoading(true);
      try {
        await dispatch(googleAuthUser({ credential: resp.credential })).unwrap();
      } catch {
        // error in Redux state
      } finally {
        setGLoading(false);
      }
    },
    [dispatch],
  );

  

useEffect(() => {
  if (!GOOGLE_CLIENT_ID || !googleBtnRef.current || initializedRef.current) return;

  loadGSI().then(() => {
    if (!window.google?.accounts) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: onGoogleCredential,
    });

    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: 'filled_black',
      size: 'large',
    });

    initializedRef.current = true; // 👈 important
  });
}, []);

  // Strip `terms` before sending to API
  const onSubmit = ({ terms: _t, ...data }) => dispatch(registerUser(data));

  // Password strength score (0–3)
  const strengthScore = PASSWORD_RULES.filter((r) => r.test(passVal)).length;
  const strengthColors = ['#ef4444', '#f59e0b', '#22c55e', '#22d3ee'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Strong'];

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center relative overflow-hidden py-8"
      style={{ background: '#060810', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
    >
      {/* Background */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, #130d2e 0%, #060810 60%)' }} />

      {/* Cursor glow */}
      <div className="absolute pointer-events-none"
        style={{
          left: cursorPos.x - 200, top: cursorPos.y - 200,
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(129,140,248,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(129,140,248,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              left: `${6 + i * 9}%`,
              width: `${2 + (i % 3)}px`, height: `${2 + (i % 3)}px`,
              background: i % 3 === 0 ? '#818cf8' : i % 3 === 1 ? '#22d3ee' : '#34d399',
              opacity: 0.35,
              animation: `floatUp ${9 + i * 1.1}s ease-in-out infinite`,
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          Main Card
      ══════════════════════════════════════════════════════════════ */}
      <div
        className="relative w-full mx-4"
        style={{
          maxWidth: 960,
          display: 'grid',
          gridTemplateColumns: window.innerWidth >= 1024 ? '1fr 1fr' : '1fr',
          borderRadius: 20,
          overflow: 'hidden',
          border: '1px solid rgba(129,140,248,0.12)',
          boxShadow: '0 0 0 1px rgba(129,140,248,0.05), 0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(129,140,248,0.04)',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.98)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1), opacity 0.6s ease',
        }}
      >

        {/* ── Left: Branding ───────────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col justify-between p-10"
          style={{
            background: 'linear-gradient(135deg, #0d0a23 0%, #120d2e 50%, #090718 100%)',
            borderRight: '1px solid rgba(129,140,248,0.1)',
          }}
        >
          <div>
            <Link to="/" className="flex items-center gap-3 mb-12" style={{ textDecoration: 'none' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(34,211,238,0.2))',
                border: '1px solid rgba(129,140,248,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Terminal size={18} color="#818cf8" />
              </div>
              <span style={{
                fontSize: 18, fontWeight: 700,
                background: 'linear-gradient(90deg, #818cf8, #22d3ee)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                CodeMaster
              </span>
            </Link>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 20,
              background: 'rgba(129,140,248,0.08)',
              border: '1px solid rgba(129,140,248,0.2)',
              marginBottom: 16,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 11, color: '#818cf8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Free to join
              </span>
            </div>

            <h1 style={{ fontSize: 30, fontWeight: 700, color: '#f0f6ff', lineHeight: 1.25, margin: '0 0 12px' }}>
              Start your<br />
              <span style={{
                background: 'linear-gradient(90deg, #818cf8, #22d3ee)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                coding journey
              </span>
            </h1>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, margin: '0 0 28px' }}>
              Join 50,000+ developers who've levelled up their interview skills.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
              {FEATURES.map(({ icon: Icon, label, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: `${color}15`, border: `1px solid ${color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={15} color={color} />
                  </div>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: 12, padding: 16, borderRadius: 12,
            background: 'rgba(6,8,16,0.6)',
            border: '1px solid rgba(129,140,248,0.1)',
          }}>
            {[['50K+', 'Developers'], ['500+', 'Problems'], ['4.9★', 'Rating']].map(([val, lbl]) => (
              <div key={lbl} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#818cf8' }}>{val}</div>
                <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Form ──────────────────────────────────────────────── */}
        <div className="flex flex-col justify-center"
          style={{
            padding: 'clamp(24px, 4vw, 44px)',
            background: 'linear-gradient(135deg, #080c1a 0%, #060810 100%)',
          }}
        >
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-6 lg:hidden" style={{ textDecoration: 'none' }}>
            <Terminal size={16} color="#818cf8" />
            <span style={{ fontSize: 16, fontWeight: 700, color: '#818cf8' }}>CodeMaster</span>
          </Link>

          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f0f6ff', margin: '0 0 4px' }}>Create Account</h2>
          <p style={{ fontSize: 13, color: '#475569', margin: '0 0 24px' }}>
            Join thousands of developers mastering coding skills
          </p>

          {/* Error banner */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10, padding: '12px 14px', marginBottom: 18,
            }}>
              <span style={{ fontSize: 14 }}>⚠️</span>
              <span style={{ fontSize: 13, color: '#fca5a5', lineHeight: 1.5 }}>{error}</span>
            </div>
          )}

          {/* ── Google Sign-Up ── */}
          {GOOGLE_CLIENT_ID && (
            <>
              <div style={{ marginBottom: 14 }}>
                {gLoading ? (
                  <div style={{
                    height: 44, borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 8, color: '#64748b', fontSize: 13,
                  }}>
                    <span className="loading loading-spinner loading-sm" />
                    Signing up with Google...
                  </div>
                ) : (
                  <div ref={googleBtnRef} style={{ width: '100%', borderRadius: 10, overflow: 'hidden' }} />
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ fontSize: 11, color: '#334155', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  or register with email
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>
            </>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.04em' }}>
                FULL NAME
              </label>
              <input
                type="text"
                {...register('firstName')}
                placeholder="John Doe"
                autoComplete="given-name"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${errors.firstName ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 10, padding: '11px 14px',
                  fontSize: 14, color: '#e2e8f0',
                  fontFamily: 'inherit', outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => {
                  if (!errors.firstName) {
                    e.target.style.borderColor = 'rgba(129,140,248,0.4)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(129,140,248,0.06)';
                  }
                }}
                onBlur={(e) => {
                  if (!errors.firstName) {
                    e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              />
              {errors.firstName && (
                <p style={{ margin: '5px 0 0', fontSize: 12, color: '#f87171' }}>{errors.firstName.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.04em' }}>
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                {...register('emailId')}
                placeholder="you@example.com"
                autoComplete="email"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${errors.emailId ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 10, padding: '11px 14px',
                  fontSize: 14, color: '#e2e8f0',
                  fontFamily: 'inherit', outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => {
                  if (!errors.emailId) {
                    e.target.style.borderColor = 'rgba(129,140,248,0.4)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(129,140,248,0.06)';
                  }
                }}
                onBlur={(e) => {
                  if (!errors.emailId) {
                    e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              />
              {errors.emailId && (
                <p style={{ margin: '5px 0 0', fontSize: 12, color: '#f87171' }}>{errors.emailId.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.04em' }}>
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Min 8 chars, 1 special symbol"
                  autoComplete="new-password"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${errors.password ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 10, padding: '11px 42px 11px 14px',
                    fontSize: 14, color: '#e2e8f0',
                    fontFamily: 'inherit', outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={(e) => {
                    if (!errors.password) {
                      e.target.style.borderColor = 'rgba(129,140,248,0.4)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(129,140,248,0.06)';
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.password) {
                      e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass((p) => !p)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#475569', padding: 2, transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#94a3b8'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength meter */}
              {passVal.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: i < strengthScore ? strengthColors[strengthScore] : 'rgba(255,255,255,0.08)',
                        transition: 'background 0.3s',
                      }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {PASSWORD_RULES.map((rule) => (
                        <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Check size={10} color={rule.test(passVal) ? '#22c55e' : '#334155'} />
                          <span style={{ fontSize: 10, color: rule.test(passVal) ? '#4ade80' : '#334155' }}>
                            {rule.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    {strengthScore > 0 && (
                      <span style={{ fontSize: 10, color: strengthColors[strengthScore], fontWeight: 600 }}>
                        {strengthLabels[strengthScore]}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {errors.password && (
                <p style={{ margin: '5px 0 0', fontSize: 12, color: '#f87171' }}>{errors.password.message}</p>
              )}
            </div>

            {/* Terms — Bug fix: now connected to Zod via react-hook-form register */}
            <div>
              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  {...register('terms')}
                  style={{ marginTop: 2, accentColor: '#818cf8', flexShrink: 0 }}
                />
                <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
                  I agree to the{' '}
                  <a href="#" style={{ color: '#818cf8', textDecoration: 'none' }}>Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" style={{ color: '#818cf8', textDecoration: 'none' }}>Privacy Policy</a>
                </span>
              </label>
              {errors.terms && (
                <p style={{ margin: '5px 0 0', fontSize: 12, color: '#f87171' }}>{errors.terms.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px 20px',
                background: loading
                  ? 'rgba(129,140,248,0.1)'
                  : 'linear-gradient(135deg, #4f46e5, #6d28d9)',
                border: '1px solid rgba(129,140,248,0.3)',
                borderRadius: 10,
                color: loading ? '#818cf8' : '#f0f6ff',
                fontSize: 14, fontWeight: 600,
                fontFamily: 'inherit',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(79,70,229,0.25)',
                letterSpacing: '0.02em',
                marginTop: 2,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1, #7c3aed)';
                  e.currentTarget.style.boxShadow = '0 4px 28px rgba(79,70,229,0.4)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #4f46e5, #6d28d9)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(79,70,229,0.25)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  Creating account...
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Create Account
                  <ArrowRight size={14} style={{ opacity: 0.7 }} />
                </>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#334155', marginTop: 20 }}>
            Already a member?{' '}
            <Link to="/login" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 500 }}>
              Sign in →
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        @keyframes floatUp {
          0%   { transform: translateY(100vh); opacity: 0; }
          10%  { opacity: 0.35; }
          90%  { opacity: 0.25; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        input::placeholder { color: #334155; }
      `}</style>
    </div>
  );
};

export default Signup;
