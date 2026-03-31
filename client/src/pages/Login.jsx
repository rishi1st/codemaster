import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, googleAuthUser, clearError } from '../redux/authSlice';
import { Eye, EyeOff, Zap, Terminal, ArrowRight, Cpu, Brain, Trophy } from 'lucide-react';

// ── Zod schema ─────────────────────────────────────────────────────────────
const loginSchema = z.object({
  emailId: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'At least 8 characters required')
    .max(20, 'Max 20 characters')
    .refine((v) => /[!@#$%^&*(),.?":{}|<>]/.test(v), {
      message: 'Must contain at least one special symbol',
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
    s.id  = 'gsi-script';
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = resolve;
    document.head.appendChild(s);
  });

// ── Animated grid background ───────────────────────────────────────────────
const FEATURES = [
  { icon: Cpu,    label: 'AI-powered coding assistant',       color: '#22d3ee' },
  { icon: Brain,  label: 'Algorithm & DS visualizations',     color: '#818cf8' },
  { icon: Trophy, label: 'Mock interviews & leaderboards',    color: '#34d399' },
];

// ═══════════════════════════════════════════════════════════════════════════
const Login = () => {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const { isAuthenticated, loading, error } = useSelector((s) => s.auth);

  const [showPass,     setShowPass]     = useState(false);
  const [gLoading,     setGLoading]     = useState(false);
  const [visible,      setVisible]      = useState(false);
  const [cursorPos,    setCursorPos]    = useState({ x: 0, y: 0 });
  const googleBtnRef = useRef(null);
  const containerRef = useRef(null);
  const initializedRef = useRef(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // Redirect when authenticated
  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  // Entrance animation
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Clear error on unmount
  useEffect(() => () => dispatch(clearError()), [dispatch]);

  // Parallax cursor glow
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

  // Google callback
  const onGoogleCredential = useCallback(
    async (resp) => {
      setGLoading(true);
      try {
        await dispatch(googleAuthUser({ credential: resp.credential })).unwrap();
      } catch {
        // error is in Redux state
      } finally {
        setGLoading(false);
      }
    },
    [dispatch],
  );

  // Init Google button
  

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
  
      initializedRef.current = true;
    });
  }, []);

  const onSubmit = (data) => dispatch(loginUser(data));

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#060810', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
    >
      {/* ── Deep space background ── */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, #0d1a3a 0%, #060810 60%)' }} />

      {/* ── Cursor glow ── */}
      <div
        className="absolute pointer-events-none transition-opacity duration-300"
        style={{
          left: cursorPos.x - 200,
          top:  cursorPos.y - 200,
          width: 400, height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)',
        }}
      />

      {/* ── Grid lines ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(56,189,248,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* ── Floating particles ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              left:   `${8 + i * 8}%`,
              width:  `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              background: i % 3 === 0 ? '#22d3ee' : i % 3 === 1 ? '#818cf8' : '#34d399',
              opacity: 0.4,
              animation: `floatUp ${8 + i * 1.2}s ease-in-out infinite`,
              animationDelay: `${i * 0.6}s`,
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
          border: '1px solid rgba(56,189,248,0.12)',
          boxShadow: '0 0 0 1px rgba(56,189,248,0.05), 0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(56,189,248,0.04)',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.98)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1), opacity 0.6s ease',
        }}
      >

        {/* ── Left: Branding Panel ─────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col justify-between p-10"
          style={{
            background: 'linear-gradient(135deg, #0a0f23 0%, #0d1530 50%, #080d1f 100%)',
            borderRight: '1px solid rgba(56,189,248,0.1)',
          }}
        >
          <div>
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 mb-12 group" style={{ textDecoration: 'none' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(129,140,248,0.2))',
                border: '1px solid rgba(34,211,238,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Terminal size={18} color="#22d3ee" />
              </div>
              <span style={{
                fontSize: 18, fontWeight: 700, letterSpacing: '0.5px',
                background: 'linear-gradient(90deg, #22d3ee, #818cf8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                CodeMaster
              </span>
            </Link>

            {/* Headline */}
            <div style={{ marginBottom: 32 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 20,
                background: 'rgba(34,211,238,0.08)',
                border: '1px solid rgba(34,211,238,0.2)',
                marginBottom: 16,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3ee', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 11, color: '#22d3ee', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Live Platform
                </span>
              </div>
              <h1 style={{ fontSize: 30, fontWeight: 700, color: '#f0f6ff', lineHeight: 1.25, margin: 0, marginBottom: 12 }}>
                Welcome back,<br />
                <span style={{
                  background: 'linear-gradient(90deg, #22d3ee, #818cf8)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  Coder
                </span>
              </h1>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, margin: 0 }}>
                Pick up where you left off. Your problems, your progress, your pace.
              </p>
            </div>

            {/* Feature list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {FEATURES.map(({ icon: Icon, label, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: `${color}15`,
                    border: `1px solid ${color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={15} color={color} />
                  </div>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal decoration */}
          <div style={{
            borderRadius: 10, overflow: 'hidden',
            border: '1px solid rgba(56,189,248,0.1)',
            background: 'rgba(6,8,16,0.8)',
          }}>
            <div style={{
              padding: '8px 12px', background: 'rgba(56,189,248,0.05)',
              borderBottom: '1px solid rgba(56,189,248,0.08)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {['#ef4444','#f59e0b','#22c55e'].map((c, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
              ))}
              <span style={{ fontSize: 11, color: '#475569', marginLeft: 4 }}>session.sh</span>
            </div>
            <div style={{ padding: '12px 16px' }}>
              {['$ codemaster --resume-session', '> Loading your progress...', '> 47 problems solved ✓', '> Streak: 12 days 🔥'].map((line, i) => (
                <div key={i} style={{
                  fontSize: 12, lineHeight: 2,
                  color: i === 0 ? '#22d3ee' : i === 3 ? '#34d399' : '#475569',
                  fontFamily: 'inherit',
                }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Form Panel ────────────────────────────────────────── */}
        <div className="flex flex-col justify-center"
          style={{
            padding: 'clamp(28px, 5vw, 48px)',
            background: 'linear-gradient(135deg, #080c1a 0%, #060810 100%)',
          }}
        >
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden" style={{ textDecoration: 'none' }}>
            <Terminal size={16} color="#22d3ee" />
            <span style={{ fontSize: 16, fontWeight: 700, color: '#22d3ee' }}>CodeMaster</span>
          </Link>

          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f0f6ff', margin: '0 0 4px' }}>Sign In</h2>
          <p style={{ fontSize: 13, color: '#475569', margin: '0 0 28px' }}>
            Enter your credentials to access your account
          </p>

          {/* Error banner */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10, padding: '12px 14px', marginBottom: 20,
            }}>
              <span style={{ fontSize: 14 }}>⚠️</span>
              <span style={{ fontSize: 13, color: '#fca5a5', lineHeight: 1.5 }}>{error}</span>
            </div>
          )}

          {/* ── Google Sign-In ── */}
          {GOOGLE_CLIENT_ID && (
            <>
              <div style={{ marginBottom: 16 }}>
                {gLoading ? (
                  <div style={{
                    height: 44, borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 8, color: '#64748b', fontSize: 13,
                  }}>
                    <span className="loading loading-spinner loading-sm" />
                    Authenticating with Google...
                  </div>
                ) : (
                  <div
                    ref={googleBtnRef}
                    style={{ width: '100%', borderRadius: 10, overflow: 'hidden' }}
                  />
                )}
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ fontSize: 11, color: '#334155', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  or email
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>
            </>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

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
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => {
                  if (!errors.emailId) {
                    e.target.style.borderColor = 'rgba(34,211,238,0.4)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(34,211,238,0.06)';
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
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#f87171' }}>
                  {errors.emailId.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8', letterSpacing: '0.04em' }}>
                  PASSWORD
                </label>
                <Link to="/forgot-password" style={{
                  fontSize: 12, color: '#22d3ee', textDecoration: 'none',
                  opacity: 0.8, transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.opacity = 1}
                onMouseLeave={(e) => e.target.style.opacity = 0.8}
                >
                  Forgot?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${errors.password ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 10, padding: '11px 42px 11px 14px',
                    fontSize: 14, color: '#e2e8f0',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={(e) => {
                    if (!errors.password) {
                      e.target.style.borderColor = 'rgba(34,211,238,0.4)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(34,211,238,0.06)';
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
                    color: '#475569', padding: 2,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#94a3b8'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#f87171' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px 20px',
                background: loading
                  ? 'rgba(34,211,238,0.1)'
                  : 'linear-gradient(135deg, #0891b2, #0e7490)',
                border: '1px solid rgba(34,211,238,0.3)',
                borderRadius: 10,
                color: loading ? '#22d3ee' : '#f0f6ff',
                fontSize: 14, fontWeight: 600,
                fontFamily: 'inherit',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(8,145,178,0.25)',
                letterSpacing: '0.02em',
                marginTop: 4,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #06b6d4, #0891b2)';
                  e.currentTarget.style.boxShadow = '0 4px 28px rgba(8,145,178,0.4)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #0891b2, #0e7490)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(8,145,178,0.25)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  Signing in...
                </>
              ) : (
                <>
                  <Zap size={15} />
                  Sign In
                  <ArrowRight size={14} style={{ opacity: 0.7 }} />
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <p style={{ textAlign: 'center', fontSize: 13, color: '#334155', marginTop: 24 }}>
            No account?{' '}
            <Link to="/signup" style={{
              color: '#22d3ee', textDecoration: 'none', fontWeight: 500,
              transition: 'opacity 0.2s',
            }}>
              Create one →
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        @keyframes floatUp {
          0%   { transform: translateY(100vh); opacity: 0; }
          10%  { opacity: 0.4; }
          90%  { opacity: 0.3; }
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

export default Login;
