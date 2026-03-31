/**
 * Pod.jsx — Problem of the Day card
 * ─────────────────────────────────────────────────────────────────────────────
 * Bug fixes:
 *  1. problem.tags.split(',') → tags is now an Array — throws "split is not a
 *     function". Fixed with Array.isArray guard + safe helper.
 *  2. calculateTimeUntilRenewal always counted to "tomorrow 6AM" — after 06:00
 *     today the countdown jumped to ~24h instead of counting to today's 06:00.
 *     Fixed to count to the NEXT 06:00 (today or tomorrow).
 *  3. Timer ticked every 60s — could be up to 59s stale on mount. Changed to
 *     tick every second for accurate HH:MM:SS display.
 *  4. generateAcceptanceRate recreated on every render. Extracted outside
 *     component and memoized at call site.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useMemo, memo } from 'react';
import { Award, Clock, ArrowRight, Zap, Target } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

// Bug fix #1: safe tag normaliser — handles both Array and legacy String
const normaliseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  return tags.split(',').map((t) => t.trim()).filter(Boolean);
};

// Bug fix #4: outside component — not recreated on render
const generateAcceptanceRate = (problemId) => {
  if (!problemId) return 75;
  let hash = 0;
  for (let i = 0; i < problemId.length; i++) {
    hash = ((hash << 5) - hash) + problemId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 35) + 55; // 55–90%
};

// Bug fix #2: correctly counts to the NEXT 06:00, not blindly to "tomorrow 06:00"
const getNextRenewal = () => {
  const now       = new Date();
  const candidate = new Date(now);
  candidate.setHours(6, 0, 0, 0);
  // If 06:00 today has already passed, use tomorrow's 06:00
  if (candidate <= now) candidate.setDate(candidate.getDate() + 1);
  return candidate;
};

const calcTimeLeft = () => {
  const diff    = getNextRenewal() - Date.now();
  const h       = Math.floor(diff / 3_600_000);
  const m       = Math.floor((diff % 3_600_000) / 60_000);
  const s       = Math.floor((diff % 60_000) / 1_000);
  return { h, m, s, label: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` };
};

const DIFFICULTY_STYLE = {
  easy:   { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)'  },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)'  },
  hard:   { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
};

// ── Component ─────────────────────────────────────────────────────────────────
const Pod = memo(({ problem, onProblemClick }) => {
  // Bug fix #3: tick every second for accurate countdown
  const [timeLeft, setTimeLeft] = useState(calcTimeLeft);

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTimeLeft()), 1_000);
    return () => clearInterval(id);
  }, []);

  // Bug fix #4: memoised per problem._id — not recalculated every second
  const acceptanceRate = useMemo(
    () => generateAcceptanceRate(problem?._id),
    [problem?._id]
  );

  if (!problem) return null;

  const tags   = normaliseTags(problem.tags); // Bug fix #1
  const diff   = problem.difficulty?.toLowerCase() || 'easy';
  const dStyle = DIFFICULTY_STYLE[diff] || DIFFICULTY_STYLE.easy;
  const FONT   = "'JetBrains Mono','Fira Code',monospace";

  return (
    <div style={{
      borderRadius: 16, marginBottom: 24, overflow: 'hidden',
      background: 'linear-gradient(135deg, rgba(79,70,229,0.08) 0%, rgba(34,211,238,0.04) 100%)',
      border: '1px solid rgba(129,140,248,0.2)',
      boxShadow: '0 8px 32px rgba(79,70,229,0.1)',
      fontFamily: FONT,
      animation: 'slideDown 0.5s cubic-bezier(0.16,1,0.3,1)',
    }}>
      {/* Top gradient bar */}
      <div style={{ height: 2, background: 'linear-gradient(90deg, #4f46e5, #818cf8, #22d3ee)' }} />

      <div style={{ padding: 'clamp(20px,3vw,28px)' }}>
        {/* Header row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '4px 12px', borderRadius: 20,
            background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.25)',
          }}>
            <Award size={13} color="#fbbf24" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Problem of the Day
            </span>
          </div>

          {/* Countdown — Bug fix #2 & #3 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 20,
            background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)',
          }}>
            <Clock size={12} color="#22d3ee" />
            <span style={{ fontSize: 12, color: '#22d3ee', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {timeLeft.label}
            </span>
          </div>
        </div>

        {/* Title + meta */}
        <h2 style={{ fontSize: 'clamp(16px,2.5vw,22px)', fontWeight: 800, color: '#f0f6ff', margin: '0 0 12px', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
          {problem.title}
        </h2>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          {/* Difficulty badge */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            color: dStyle.color, background: dStyle.bg, border: `1px solid ${dStyle.border}`,
            textTransform: 'capitalize',
          }}>
            <Target size={10} />
            {problem.difficulty}
          </span>

          {/* Acceptance rate */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>Acceptance</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{acceptanceRate}%</span>
            <div style={{ width: 60, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2,
                width: `${acceptanceRate}%`,
                background: `linear-gradient(90deg, ${dStyle.color}, #818cf8)`,
                transition: 'width 0.8s ease',
              }} />
            </div>
          </div>
        </div>

        {/* Tags — Bug fix #1 */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {tags.slice(0, 4).map((tag) => (
              <span key={tag} style={{
                padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)',
                color: '#818cf8',
              }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Description snippet */}
        {problem.description && (
          <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, margin: '0 0 20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {problem.description.substring(0, 160)}…
          </p>
        )}

        {/* CTA */}
        <button
          onClick={() => onProblemClick(problem._id)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 22px', borderRadius: 10,
            background: 'linear-gradient(135deg, #4f46e5, #6d28d9)',
            border: '1px solid rgba(129,140,248,0.35)',
            color: '#f0f6ff', fontSize: 13, fontWeight: 700,
            fontFamily: FONT, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(79,70,229,0.25)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(79,70,229,0.45)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(79,70,229,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Zap size={14} />
          Solve Challenge
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
});

Pod.displayName = 'Pod';
export default Pod;
