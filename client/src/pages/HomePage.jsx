import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import {
  Brain, Cpu, Globe, Users, ArrowRight, Zap, Sparkles,
  Code2, Terminal, ChevronRight, Play, Star, TrendingUp,
  Shield, Clock, BookOpen, MessageSquare,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
//  Static data — defined outside component for zero re-creation cost
// ─────────────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Brain,
    label: 'AI Coding Assistant',
    desc: 'Get intelligent hints, code reviews, and optimisation suggestions from your personal AI tutor.',
    route: '/problems',
    accent: '#22d3ee',
    tag: 'Popular',
  },
  {
    icon: Cpu,
    label: 'Algorithm Visualiser',
    desc: 'Watch sorting, graph, and DP algorithms animate step-by-step in real time.',
    route: '/algorithms',
    accent: '#818cf8',
    tag: null,
  },
  {
    icon: Globe,
    label: 'Multi-Language Compiler',
    desc: 'Write and run code in 15+ languages — C++, Python, Java, Go and more, with zero setup.',
    route: '/compiler',
    accent: '#34d399',
    tag: null,
  },
  {
    icon: Users,
    label: 'AI Interview Coach',
    desc: 'Practise with an adaptive AI interviewer that gives real-time feedback on your solutions.',
    route: '/ai',
    accent: '#f59e0b',
    tag: 'NEW',
  },
];

const STATS = [
  { value: '50K+',  label: 'Developers',    icon: Users    },
  { value: '500+',  label: 'Problems',      icon: Code2    },
  { value: '4.9★',  label: 'Rating',        icon: Star     },
  { value: '12+',   label: 'Languages',     icon: Terminal },
];

const WHY_ITEMS = [
  { icon: Zap,       title: 'Instant feedback',  desc: 'Know exactly where you went wrong in milliseconds, not minutes.' },
  { icon: TrendingUp,title: 'Track progress',    desc: 'Streaks, heatmaps, and skill graphs keep you motivated every day.' },
  { icon: Shield,    title: 'Industry patterns', desc: 'Problems curated from real FAANG and startup interviews.' },
  { icon: Clock,     title: 'Timed mock tests',  desc: 'Simulate interview pressure with a built-in countdown.' },
  { icon: BookOpen,  title: 'Deep explanations', desc: 'Every solution comes with complexity analysis and multiple approaches.' },
  { icon: MessageSquare, title: 'AI discussions', desc: "Ask the AI to explain any concept in plain English — or in code." },
];

const CODE_LINES = [
  { num: 1,  parts: [{ t: 'keyword', v: 'function ' }, { t: 'fn', v: 'twoSum' }, { t: 'default', v: '(nums, target) {' }] },
  { num: 2,  parts: [{ t: 'keyword', v: '  const ' }, { t: 'default', v: 'map = ' }, { t: 'keyword', v: 'new ' }, { t: 'fn', v: 'Map' }, { t: 'default', v: '();' }] },
  { num: 3,  parts: [] },
  { num: 4,  parts: [{ t: 'keyword', v: '  for ' }, { t: 'default', v: '(let i = 0; i < nums.length; i++) {' }] },
  { num: 5,  parts: [{ t: 'keyword', v: '    const ' }, { t: 'default', v: 'comp = target - nums[i];' }] },
  { num: 6,  parts: [] },
  { num: 7,  parts: [{ t: 'keyword', v: '    if ' }, { t: 'default', v: '(map.has(comp)) {' }] },
  { num: 8,  parts: [{ t: 'keyword', v: '      return ' }, { t: 'default', v: '[map.get(comp), i];' }] },
  { num: 9,  parts: [{ t: 'default', v: '    }' }] },
  { num: 10, parts: [{ t: 'default', v: '    map.set(nums[i], i);' }] },
  { num: 11, parts: [{ t: 'default', v: '  }' }] },
  { num: 12, parts: [{ t: 'default', v: '}' }] },
];

const TOKEN_COLOR = { keyword: '#818cf8', fn: '#22d3ee', default: '#94a3b8', comment: '#334155' };

// ─────────────────────────────────────────────────────────────────────────────
//  useIntersection — triggers once when element enters viewport
// ─────────────────────────────────────────────────────────────────────────────
const useIntersection = (threshold = 0.15) => {
  const ref    = useRef(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setSeen(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, seen];
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sub-components (memo'd to avoid cascade re-renders)
// ─────────────────────────────────────────────────────────────────────────────
const FeatureCard = memo(({ icon: Icon, label, desc, route, accent, tag, index, navigate }) => {
  const [ref, seen] = useIntersection();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      onClick={() => navigate(route)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 16, padding: '24px',
        background: hovered ? `linear-gradient(135deg, ${accent}0d, rgba(6,8,16,0.8))` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? accent + '35' : 'rgba(255,255,255,0.06)'}`,
        cursor: 'pointer',
        transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
        transform: seen
          ? hovered ? 'translateY(-4px)' : 'translateY(0)'
          : 'translateY(20px)',
        opacity: seen ? 1 : 0,
        transitionDelay: seen ? `${index * 80}ms` : '0ms',
        boxShadow: hovered ? `0 8px 32px ${accent}18` : 'none',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Glow orb */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 120, height: 120, borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.35s ease',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${accent}15`,
          border: `1px solid ${accent}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.25s',
          transform: hovered ? 'scale(1.08)' : 'scale(1)',
        }}>
          <Icon size={18} color={accent} />
        </div>
        {tag && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
            background: tag === 'NEW'
              ? 'linear-gradient(90deg, #22d3ee, #818cf8)'
              : 'rgba(250,204,21,0.15)',
            color: tag === 'NEW' ? '#f0f6ff' : '#fbbf24',
            border: tag === 'NEW' ? 'none' : '1px solid rgba(251,191,36,0.3)',
            letterSpacing: '0.06em',
          }}>
            {tag}
          </span>
        )}
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: '0 0 8px', lineHeight: 1.3 }}>
        {label}
      </h3>
      <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, margin: '0 0 16px' }}>
        {desc}
      </p>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 12, fontWeight: 600,
        color: hovered ? accent : '#334155',
        transition: 'color 0.2s',
      }}>
        Explore
        <ArrowRight size={12} style={{ transition: 'transform 0.2s', transform: hovered ? 'translateX(3px)' : 'translateX(0)' }} />
      </div>
    </div>
  );
});
FeatureCard.displayName = 'FeatureCard';

const StatCard = memo(({ value, label, icon: Icon, index }) => {
  const [ref, seen] = useIntersection();
  return (
    <div ref={ref} style={{
      textAlign: 'center', padding: '20px 16px',
      borderRadius: 12,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      transform: seen ? 'translateY(0)' : 'translateY(16px)',
      opacity: seen ? 1 : 0,
      transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${index * 80}ms`,
    }}>
      <Icon size={16} color="#818cf8" style={{ marginBottom: 8 }} />
      <div style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#334155', marginTop: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
});
StatCard.displayName = 'StatCard';

const WhyCard = memo(({ icon: Icon, title, desc, index }) => {
  const [ref, seen] = useIntersection();
  const [hovered, setHovered] = useState(false);
  return (
    <div ref={ref} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
      display: 'flex', alignItems: 'flex-start', gap: 14,
      padding: '18px',
      borderRadius: 12,
      background: hovered ? 'rgba(129,140,248,0.06)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${hovered ? 'rgba(129,140,248,0.2)' : 'rgba(255,255,255,0.05)'}`,
      transform: seen ? 'translateY(0)' : 'translateY(16px)',
      opacity: seen ? 1 : 0,
      transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${index * 70}ms`,
      cursor: 'default',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: 'rgba(129,140,248,0.1)',
        border: '1px solid rgba(129,140,248,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={15} color="#818cf8" />
      </div>
      <div>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px' }}>{title}</h4>
        <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.6 }}>{desc}</p>
      </div>
    </div>
  );
});
WhyCard.displayName = 'WhyCard';

// ─────────────────────────────────────────────────────────────────────────────
//  HomePage
// ─────────────────────────────────────────────────────────────────────────────
const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((s) => s.auth);

  const [heroVisible, setHeroVisible] = useState(false);
  const [activeLine,  setActiveLine]  = useState(0);
  const [cursorPos,   setCursorPos]   = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const lineInterval = useRef(null);

  // Hero entrance
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Code line highlighter
  useEffect(() => {
    lineInterval.current = setInterval(() => {
      setActiveLine((p) => (p + 1) % CODE_LINES.length);
    }, 900);
    return () => clearInterval(lineInterval.current);
  }, []);

  // Cursor glow
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const move = (e) => {
      const rect = el.getBoundingClientRect();
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    el.addEventListener('mousemove', move, { passive: true });
    return () => el.removeEventListener('mousemove', move);
  }, []);

  const heroAction = useCallback(() => {
    navigate(isAuthenticated ? '/problems' : '/signup');
  }, [navigate, isAuthenticated]);

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh', overflowX: 'hidden', position: 'relative',
        background: '#060810',
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
        color: '#e2e8f0',
      }}
    >
      {/* ── Global backgrounds ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {/* Deep space gradient */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 100% 60% at 50% -5%, #0d1a3a 0%, #060810 55%)' }} />

        {/* Cursor glow */}
        <div style={{
          position: 'absolute',
          left: cursorPos.x - 300, top: cursorPos.y - 300,
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(129,140,248,0.04) 0%, transparent 65%)',
          transition: 'left 0.1s linear, top 0.1s linear',
        }} />

        {/* Grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(129,140,248,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(129,140,248,0.025) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }} />

        {/* Floating particles */}
        {[...Array(14)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${4 + i * 7}%`,
            width: `${1.5 + (i % 3) * 0.8}px`,
            height: `${1.5 + (i % 3) * 0.8}px`,
            borderRadius: '50%',
            background: i % 3 === 0 ? '#818cf8' : i % 3 === 1 ? '#22d3ee' : '#34d399',
            opacity: 0.2,
            animation: `floatUp ${10 + i * 1.2}s ease-in-out infinite`,
            animationDelay: `${i * 0.7}s`,
          }} />
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 1, padding: 'clamp(60px,10vh,120px) clamp(20px,5vw,80px) clamp(40px,6vh,80px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
            gap: 'clamp(32px,5vw,64px)',
            alignItems: 'center',
          }}>

            {/* Left: copy */}
            <div>
              {/* Live pill */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '5px 14px', borderRadius: 20,
                background: 'rgba(34,211,238,0.07)',
                border: '1px solid rgba(34,211,238,0.2)',
                marginBottom: 24,
                transform: heroVisible ? 'translateY(0)' : 'translateY(12px)',
                opacity: heroVisible ? 1 : 0,
                transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)',
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22d3ee', animation: 'ping 2s infinite' }} />
                <span style={{ fontSize: 11, color: '#22d3ee', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Platform is live
                </span>
              </div>

              {/* Headline */}
              <h1 style={{
                fontSize: 'clamp(36px,6vw,68px)',
                fontWeight: 800, lineHeight: 1.1,
                margin: '0 0 20px', letterSpacing: '-0.03em',
                transform: heroVisible ? 'translateY(0)' : 'translateY(16px)',
                opacity: heroVisible ? 1 : 0,
                transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1) 0.08s',
              }}>
                <span style={{ color: '#f0f6ff' }}>Code</span>{' '}
                <span style={{
                  background: 'linear-gradient(90deg, #22d3ee, #818cf8)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>Smarter</span>
                <br />
                <span style={{ color: '#f0f6ff' }}>Interview</span>{' '}
                <span style={{
                  background: 'linear-gradient(90deg, #818cf8, #34d399)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>Better</span>
              </h1>

              <p style={{
                fontSize: 'clamp(14px,1.5vw,17px)',
                color: '#64748b', lineHeight: 1.75,
                margin: '0 0 32px', maxWidth: 480,
                transform: heroVisible ? 'translateY(0)' : 'translateY(12px)',
                opacity: heroVisible ? 1 : 0,
                transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1) 0.15s',
              }}>
                The all-in-one platform for mastering technical interviews — AI assistance, algorithm visualisation, live compiler, and adaptive mock interviews.
              </p>

              {/* CTAs */}
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 12,
                transform: heroVisible ? 'translateY(0)' : 'translateY(12px)',
                opacity: heroVisible ? 1 : 0,
                transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1) 0.22s',
              }}>
                <button
                  onClick={heroAction}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 24px', borderRadius: 10,
                    background: 'linear-gradient(135deg, #4f46e5, #6d28d9)',
                    border: '1px solid rgba(129,140,248,0.35)',
                    color: '#f0f6ff', fontSize: 14, fontWeight: 700,
                    fontFamily: 'inherit', cursor: 'pointer',
                    boxShadow: '0 4px 24px rgba(79,70,229,0.3)',
                    transition: 'all 0.25s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 6px 32px rgba(79,70,229,0.5)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 24px rgba(79,70,229,0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Sparkles size={15} />
                  {isAuthenticated ? `Continue, ${user?.firstName}` : 'Get Started Free'}
                </button>

                <button
                  onClick={() => navigate('/problems')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 24px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#94a3b8', fontSize: 14, fontWeight: 600,
                    fontFamily: 'inherit', cursor: 'pointer',
                    transition: 'all 0.25s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.color = '#e2e8f0';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Play size={13} />
                  Browse Problems
                </button>
              </div>

              {/* Social proof */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, marginTop: 28,
                transform: heroVisible ? 'translateY(0)' : 'translateY(10px)',
                opacity: heroVisible ? 1 : 0,
                transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s',
              }}>
                <div style={{ display: 'flex' }}>
                  {['#818cf8','#22d3ee','#34d399','#f59e0b'].map((c, i) => (
                    <div key={i} style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: `${c}30`, border: `2px solid ${c}60`,
                      marginLeft: i === 0 ? 0 : -8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700, color: c,
                    }}>
                      {['S','A','R','K'][i]}
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: '#475569' }}>
                  <span style={{ color: '#818cf8', fontWeight: 600 }}>50,000+</span> developers already levelling up
                </span>
              </div>
            </div>

            {/* Right: Code editor */}
            <div style={{
              transform: heroVisible ? 'translateY(0) rotate(0deg)' : 'translateY(20px) rotate(1deg)',
              opacity: heroVisible ? 1 : 0,
              transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s',
            }}>
              <div style={{
                borderRadius: 16, overflow: 'hidden',
                border: '1px solid rgba(129,140,248,0.15)',
                boxShadow: '0 0 0 1px rgba(129,140,248,0.05), 0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(79,70,229,0.1)',
                background: '#0a0d1a',
              }}>
                {/* Title bar */}
                <div style={{
                  padding: '10px 16px',
                  background: 'rgba(129,140,248,0.06)',
                  borderBottom: '1px solid rgba(129,140,248,0.1)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  {['#ef4444','#f59e0b','#22c55e'].map((c, i) => (
                    <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.8 }} />
                  ))}
                  <span style={{ fontSize: 11, color: '#334155', marginLeft: 8 }}>two-sum.js</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 9, padding: '2px 7px', borderRadius: 10,
                      background: 'rgba(34,211,238,0.1)',
                      border: '1px solid rgba(34,211,238,0.2)',
                      color: '#22d3ee', fontWeight: 600,
                    }}>JavaScript</span>
                  </div>
                </div>

                {/* Code lines */}
                <div style={{ padding: '16px 0', fontFamily: 'inherit', fontSize: 12, lineHeight: '26px' }}>
                  {CODE_LINES.map(({ num, parts }) => (
                    <div key={num} style={{
                      display: 'flex',
                      padding: '0 16px',
                      background: activeLine === num - 1 ? 'rgba(129,140,248,0.06)' : 'transparent',
                      borderLeft: activeLine === num - 1 ? '2px solid rgba(129,140,248,0.6)' : '2px solid transparent',
                      transition: 'all 0.3s ease',
                    }}>
                      <span style={{ color: '#1e293b', minWidth: 24, userSelect: 'none', marginRight: 12, textAlign: 'right', flexShrink: 0 }}>
                        {num}
                      </span>
                      <span>
                        {parts.map((p, i) => (
                          <span key={i} style={{ color: TOKEN_COLOR[p.t] }}>{p.v}</span>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Status bar */}
                <div style={{
                  padding: '8px 16px',
                  background: 'rgba(129,140,248,0.05)',
                  borderTop: '1px solid rgba(129,140,248,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 10, color: '#1e293b' }}>Ln {activeLine + 1}, Col 1</span>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {['O(n)', 'O(n) space', '✓ 2 tests'].map((t, i) => (
                      <span key={i} style={{ fontSize: 10, color: i === 2 ? '#34d399' : '#334155' }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI hint bubble */}
              <div style={{
                marginTop: 12, padding: '12px 14px', borderRadius: 12,
                background: 'rgba(34,211,238,0.06)',
                border: '1px solid rgba(34,211,238,0.15)',
                display: 'flex', alignItems: 'flex-start', gap: 10,
                animation: 'fadeSlide 0.8s ease 1s both',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                  background: 'rgba(34,211,238,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sparkles size={12} color="#22d3ee" />
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#22d3ee', margin: '0 0 3px' }}>AI Hint</p>
                  <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                    Using a HashMap gives O(n) time vs O(n²) brute force. Consider what complement you need at each step.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          STATS
      ═══════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 clamp(20px,5vw,80px) clamp(40px,6vh,80px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 12,
            padding: '24px',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            {STATS.map((s, i) => <StatCard key={s.label} {...s} index={i} />)}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURES
      ═══════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 1, padding: 'clamp(40px,6vh,80px) clamp(20px,5vw,80px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <SectionHeader
            label="Platform"
            title={<>Everything you need to<br /><span style={{ background: 'linear-gradient(90deg,#22d3ee,#818cf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>ace the interview</span></>}
            sub="Four powerful tools, one platform. Each one built to take you from beginner to interview-ready."
          />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,240px),1fr))',
            gap: 16, marginTop: 48,
          }}>
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.label} {...f} index={i} navigate={navigate} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          WHY CODEMASTER  (two-column)
      ═══════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 1, padding: 'clamp(40px,6vh,80px) clamp(20px,5vw,80px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,440px),1fr))',
            gap: 48, alignItems: 'center',
          }}>
            {/* Left copy */}
            <div>
              <SectionHeader
                label="Why CodeMaster"
                title={<>Built for<br /><span style={{ background: 'linear-gradient(90deg,#818cf8,#34d399)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>serious developers</span></>}
                sub="Not just another LeetCode clone. We thought deeply about what actually moves the needle in interview prep."
                left
              />
              <button
                onClick={() => navigate(isAuthenticated ? '/problems' : '/signup')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '11px 22px', borderRadius: 10, marginTop: 28,
                  background: 'linear-gradient(135deg, #4f46e5, #6d28d9)',
                  border: '1px solid rgba(129,140,248,0.35)',
                  color: '#f0f6ff', fontSize: 13, fontWeight: 700,
                  fontFamily: 'inherit', cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(79,70,229,0.25)',
                  transition: 'all 0.25s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 28px rgba(79,70,229,0.45)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(79,70,229,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Start for free <ChevronRight size={14} />
              </button>
            </div>

            {/* Right grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {WHY_ITEMS.map((item, i) => <WhyCard key={item.title} {...item} index={i} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CTA BANNER
      ═══════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 1, padding: 'clamp(40px,6vh,80px) clamp(20px,5vw,80px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <CtaBanner navigate={navigate} isAuthenticated={isAuthenticated} user={user} />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        position: 'relative', zIndex: 1, textAlign: 'center',
        padding: '24px clamp(20px,5vw,80px)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        fontSize: 12, color: '#1e293b',
      }}>
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} CodeMaster — Built for developers, by developers.{' '}
          <span style={{ color: '#334155' }}>All rights reserved.</span>
        </p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        @keyframes floatUp {
          0%   { transform: translateY(100vh); opacity: 0; }
          10%  { opacity: 0.2; }
          90%  { opacity: 0.15; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
        @keyframes ping {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hidden { display: none !important; }
        @media (min-width: 768px) { .hidden { display: block !important; } }
      `}</style>
    </div>
  );
};

// ── Small presentational helpers ────────────────────────────────────────────
const SectionHeader = memo(({ label, title, sub, left = false }) => {
  const [ref, seen] = useIntersection();
  return (
    <div ref={ref} style={{
      textAlign: left ? 'left' : 'center',
      maxWidth: left ? '100%' : 640,
      margin: left ? 0 : '0 auto',
      transform: seen ? 'translateY(0)' : 'translateY(16px)',
      opacity: seen ? 1 : 0,
      transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)',
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '3px 12px', borderRadius: 20, marginBottom: 16,
        background: 'rgba(129,140,248,0.08)',
        border: '1px solid rgba(129,140,248,0.18)',
      }}>
        <span style={{ fontSize: 10, color: '#818cf8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <h2 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 800, color: '#f0f6ff', margin: '0 0 14px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
        {title}
      </h2>
      {sub && <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.75, margin: 0 }}>{sub}</p>}
    </div>
  );
});
SectionHeader.displayName = 'SectionHeader';

const CtaBanner = memo(({ navigate, isAuthenticated, user }) => {
  const [ref, seen] = useIntersection();
  return (
    <div ref={ref} style={{
      borderRadius: 20, padding: 'clamp(36px,5vw,56px)',
      background: 'linear-gradient(135deg, rgba(79,70,229,0.12) 0%, rgba(109,40,217,0.08) 50%, rgba(34,211,238,0.06) 100%)',
      border: '1px solid rgba(129,140,248,0.18)',
      textAlign: 'center',
      boxShadow: '0 0 60px rgba(79,70,229,0.08)',
      transform: seen ? 'translateY(0)' : 'translateY(20px)',
      opacity: seen ? 1 : 0,
      transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1)',
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '3px 12px', borderRadius: 20, marginBottom: 20,
        background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)',
      }}>
        <Zap size={10} color="#22d3ee" />
        <span style={{ fontSize: 10, color: '#22d3ee', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Free forever plan available
        </span>
      </div>

      <h2 style={{
        fontSize: 'clamp(24px,4vw,42px)', fontWeight: 800, color: '#f0f6ff',
        margin: '0 0 14px', lineHeight: 1.2, letterSpacing: '-0.02em',
      }}>
        Ready to{' '}
        <span style={{ background: 'linear-gradient(90deg,#22d3ee,#818cf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          level up
        </span>
        ?
      </h2>
      <p style={{ fontSize: 14, color: '#475569', maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.75 }}>
        Join 50,000+ developers who've accelerated their coding interview preparation with CodeMaster.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
        <button
          onClick={() => navigate(isAuthenticated ? '/problems' : '/signup')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 28px', borderRadius: 10,
            background: 'linear-gradient(135deg, #4f46e5, #6d28d9)',
            border: '1px solid rgba(129,140,248,0.35)',
            color: '#f0f6ff', fontSize: 14, fontWeight: 700,
            fontFamily: 'inherit', cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(79,70,229,0.3)',
            transition: 'all 0.25s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 32px rgba(79,70,229,0.5)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(79,70,229,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Sparkles size={15} />
          {isAuthenticated ? `Go to Problems` : 'Create Free Account'}
        </button>
        <button
          onClick={() => navigate('/algorithms')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 28px', borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#94a3b8', fontSize: 14, fontWeight: 600,
            fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.25s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Brain size={14} />
          Explore Algorithms
        </button>
      </div>
    </div>
  );
});
CtaBanner.displayName = 'CtaBanner';

export default HomePage;
