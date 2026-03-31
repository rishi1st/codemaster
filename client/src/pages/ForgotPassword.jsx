import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axiosClient from '../utils/axiosClient';
import { Link } from 'react-router';
import { toast } from 'react-toastify';
import { Mail, ArrowLeft, Terminal, Send, CheckCircle, Loader } from 'lucide-react';

const forgotPasswordSchema = z.object({
  emailId: z.string().email('Invalid email address'),
});

const ForgotPassword = () => {
  const [isLoading, setIsLoading]   = useState(false);
  const [emailSent, setEmailSent]   = useState(false);
  const [sentTo,    setSentTo]      = useState('');
  const [visible,   setVisible]     = useState(false);
  const [cursorPos, setCursorPos]   = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const { register, handleSubmit, formState: { errors }, getValues } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  // Entrance animation
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

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

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      await axiosClient.post('/user/forgot-password', data);
      setSentTo(data.emailId);
      setEmailSent(true);
      toast.success('Password reset link sent!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center relative overflow-hidden p-4"
      style={{ background: '#060810', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
    >
      {/* ── Deep space background ── */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, #130d2e 0%, #060810 60%)',
      }} />

      {/* ── Cursor glow ── */}
      <div className="absolute pointer-events-none" style={{
        left: cursorPos.x - 200, top: cursorPos.y - 200,
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 70%)',
      }} />

      {/* ── Grid lines ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(129,140,248,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(129,140,248,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* ── Floating particles ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="absolute rounded-full" style={{
            left:   `${6 + i * 9}%`,
            width:  `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
            background: i % 3 === 0 ? '#818cf8' : i % 3 === 1 ? '#22d3ee' : '#34d399',
            opacity: 0.3,
            animation: `floatUp ${9 + i * 1.1}s ease-in-out infinite`,
            animationDelay: `${i * 0.7}s`,
          }} />
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          Card
      ══════════════════════════════════════════════════════════ */}
      <div
        style={{
          width: '100%', maxWidth: 440,
          borderRadius: 20,
          border: '1px solid rgba(129,140,248,0.12)',
          background: 'linear-gradient(135deg, #080c1a 0%, #060810 100%)',
          boxShadow: '0 0 0 1px rgba(129,140,248,0.05), 0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(129,140,248,0.04)',
          overflow: 'hidden',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.98)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1), opacity 0.6s ease',
        }}
      >
        {/* ── Top accent bar ── */}
        <div style={{
          height: 3,
          background: 'linear-gradient(90deg, #4f46e5, #818cf8, #22d3ee)',
        }} />

        <div style={{ padding: 'clamp(28px, 6vw, 40px)' }}>

          {/* ── Logo ── */}
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            textDecoration: 'none', marginBottom: 32,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(34,211,238,0.2))',
              border: '1px solid rgba(129,140,248,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Terminal size={16} color="#818cf8" />
            </div>
            <span style={{
              fontSize: 16, fontWeight: 700,
              background: 'linear-gradient(90deg, #818cf8, #22d3ee)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              CodeMaster
            </span>
          </Link>

          {/* ════════════════════════════════════════════════════
              SUCCESS STATE
          ════════════════════════════════════════════════════ */}
          {emailSent ? (
            <div style={{ textAlign: 'center' }}>
              {/* Animated checkmark ring */}
              <div style={{
                width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
                background: 'rgba(52,211,153,0.08)',
                border: '1px solid rgba(52,211,153,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'scaleIn 0.4s cubic-bezier(0.16,1,0.3,1)',
              }}>
                <CheckCircle size={36} color="#34d399" />
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f0f6ff', margin: '0 0 8px' }}>
                Check your inbox
              </h2>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, margin: '0 0 6px' }}>
                We sent a reset link to
              </p>
              <p style={{
                fontSize: 14, fontWeight: 600, color: '#818cf8',
                margin: '0 0 28px',
                wordBreak: 'break-all',
              }}>
                {sentTo}
              </p>

              {/* Info box */}
              <div style={{
                background: 'rgba(129,140,248,0.06)',
                border: '1px solid rgba(129,140,248,0.15)',
                borderRadius: 10, padding: '12px 16px',
                marginBottom: 28, textAlign: 'left',
              }}>
                {[
                  '🔗  Link expires in 15 minutes',
                  '📂  Check spam / junk if not in inbox',
                  '🔒  Link is single-use only',
                ].map((line) => (
                  <p key={line} style={{ fontSize: 12, color: '#64748b', margin: '4px 0', lineHeight: 1.6 }}>
                    {line}
                  </p>
                ))}
              </div>

              <Link
                to="/login"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '11px 20px', boxSizing: 'border-box',
                  background: 'rgba(129,140,248,0.08)',
                  border: '1px solid rgba(129,140,248,0.2)',
                  borderRadius: 10, color: '#94a3b8',
                  fontSize: 14, fontWeight: 500,
                  textDecoration: 'none', fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(129,140,248,0.14)';
                  e.currentTarget.style.color = '#c4b5fd';
                  e.currentTarget.style.borderColor = 'rgba(129,140,248,0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(129,140,248,0.08)';
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.borderColor = 'rgba(129,140,248,0.2)';
                }}
              >
                <ArrowLeft size={15} />
                Back to Sign In
              </Link>
            </div>

          ) : (
            /* ════════════════════════════════════════════════════
               FORM STATE
            ════════════════════════════════════════════════════ */
            <>
              {/* Icon + header */}
              <div style={{ marginBottom: 28 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: 'rgba(129,140,248,0.1)',
                  border: '1px solid rgba(129,140,248,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <Mail size={22} color="#818cf8" />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f0f6ff', margin: '0 0 6px' }}>
                  Reset Password
                </h2>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, margin: 0 }}>
                  Enter your account email and we'll send you a secure reset link.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Email field */}
                <div>
                  <label style={{
                    display: 'block', fontSize: 12, fontWeight: 500,
                    color: '#94a3b8', marginBottom: 6, letterSpacing: '0.04em',
                  }}>
                    EMAIL ADDRESS
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      {...register('emailId')}
                      placeholder="you@example.com"
                      autoComplete="email"
                      autoFocus
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${errors.emailId ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: 10,
                        padding: '11px 14px 11px 40px',
                        fontSize: 14, color: '#e2e8f0',
                        fontFamily: 'inherit',
                        outline: 'none',
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
                    <Mail
                      size={15}
                      color="#334155"
                      style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                    />
                  </div>
                  {errors.emailId && (
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: '#f87171' }}>
                      {errors.emailId.message}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%', padding: '12px 20px',
                    background: isLoading
                      ? 'rgba(129,140,248,0.1)'
                      : 'linear-gradient(135deg, #4f46e5, #6d28d9)',
                    border: '1px solid rgba(129,140,248,0.3)',
                    borderRadius: 10,
                    color: isLoading ? '#818cf8' : '#f0f6ff',
                    fontSize: 14, fontWeight: 600,
                    fontFamily: 'inherit',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s',
                    boxShadow: isLoading ? 'none' : '0 4px 20px rgba(79,70,229,0.25)',
                    letterSpacing: '0.02em',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1, #7c3aed)';
                      e.currentTarget.style.boxShadow = '0 4px 28px rgba(79,70,229,0.4)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #4f46e5, #6d28d9)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(79,70,229,0.25)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ fontSize: 11, color: '#334155', letterSpacing: '0.06em', textTransform: 'uppercase' }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>

              {/* Back to login */}
              <Link
                to="/login"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '11px 20px', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, color: '#64748b',
                  fontSize: 14, fontWeight: 500,
                  textDecoration: 'none', fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
                  e.currentTarget.style.color = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                <ArrowLeft size={15} />
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        @keyframes floatUp {
          0%   { transform: translateY(100vh); opacity: 0; }
          10%  { opacity: 0.3; }
          90%  { opacity: 0.2; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        input::placeholder { color: #334155; }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
