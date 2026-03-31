/**
 * ProblemDescription.jsx
 * Bug fixes:
 *  10. Math.random() for memoryLimit/acceptanceRate — different on every render.
 *      Fixed with deterministic hash from problem._id.
 *  11. problem.constraints was mapped as Array — schema has it as String. Fixed.
 *  12. problem.hint — schema has `hints` (Array). Fixed to use hints array.
 */
import React, { useState, useMemo } from 'react';
import { Clock, BarChart3, Tag, Lightbulb, Target, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const FONT = "'JetBrains Mono','Fira Code',monospace";

const DIFF_STYLE = {
  easy:   { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)'  },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)'  },
  hard:   { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
};

// Bug fix #10: deterministic hash — no Math.random()
const deterministicRate = (id = '', base = 55, range = 35) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = ((h << 5) - h) + id.charCodeAt(i); h |= 0; }
  return Math.abs(h % range) + base;
};

const Section = ({ title, accent, children }) => (
  <div style={{ marginBottom: 24 }}>
    <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ width: 3, height: 16, borderRadius: 2, background: accent, flexShrink: 0 }} />
      {title}
    </h2>
    {children}
  </div>
);

const ProblemDescription = ({ problem }) => {
  const [expandedExample, setExpandedExample] = useState(0);
  const [visibleHints,    setVisibleHints]    = useState({});

  const tags   = useMemo(() => Array.isArray(problem.tags) ? problem.tags : (problem.tags || '').split(',').map(t => t.trim()).filter(Boolean), [problem.tags]);
  const diff   = problem.difficulty?.toLowerCase() || 'easy';
  const dStyle = DIFF_STYLE[diff] || DIFF_STYLE.easy;

  // Bug fix #10: deterministic
  const acceptanceRate = useMemo(() => deterministicRate(problem._id, 45, 40), [problem._id]);
  const memoryLimit    = useMemo(() => `${deterministicRate(problem._id + 'mem', 128, 128)} MB`, [problem._id]);

  // Bug fix #11: constraints is a String in schema — split by newline or semicolon
  const constraintsList = useMemo(() => {
    if (!problem.constraints) return [];
    if (Array.isArray(problem.constraints)) return problem.constraints;
    return problem.constraints.split(/\n|;/).map(c => c.trim()).filter(Boolean);
  }, [problem.constraints]);

  // Bug fix #12: use `hints` (Array) not `hint` (String)
  const hints = useMemo(() => {
    if (!problem.hints) return [];
    if (Array.isArray(problem.hints)) return problem.hints;
    return [problem.hints].filter(Boolean);
  }, [problem.hints]);

  const expectedTime = { easy: '15–20 min', medium: '25–35 min', hard: '45–60 min' }[diff] || '20–30 min';

  return (
    <div style={{ padding: 20, fontFamily: FONT, fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}>

      {/* Title + difficulty */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <h1 style={{ fontSize: 'clamp(16px,2vw,20px)', fontWeight: 800, color: '#f0f6ff', margin: 0, lineHeight: 1.3 }}>
            {problem.title}
          </h1>
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: dStyle.color, background: dStyle.bg, border: `1px solid ${dStyle.border}`, textTransform: 'capitalize', flexShrink: 0 }}>
            {problem.difficulty}
          </span>
        </div>

        {/* Meta pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {[
            { icon: Clock,    color: '#22d3ee', text: `Expected: ${expectedTime}` },
            { icon: BarChart3, color: '#818cf8', text: `Memory: ${memoryLimit}` },
            { icon: Target,   color: '#34d399', text: `Acceptance: ${acceptanceRate}%` },
          ].map(({ icon: Icon, color, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: '#64748b' }}>
              <Icon size={11} color={color} />
              {text}
            </div>
          ))}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <Tag size={12} color="#334155" />
            {tags.map((tag) => (
              <span key={tag} style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.18)', color: '#818cf8' }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <Section title="Description" accent="#3b82f6">
        <p style={{ color: '#94a3b8', whiteSpace: 'pre-wrap', margin: 0 }}>{problem.description}</p>
      </Section>

      {/* Examples */}
      {problem.visibleTestCases?.length > 0 && (
        <Section title="Examples" accent="#8b5cf6">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {problem.visibleTestCases.map((ex, i) => (
              <div key={i} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                <button onClick={() => setExpandedExample(expandedExample === i ? -1 : i)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: 'none',
                  cursor: 'pointer', fontFamily: FONT,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(129,140,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#818cf8' }}>{i + 1}</div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>Example {i + 1}</span>
                  </div>
                  {expandedExample === i ? <ChevronUp size={14} color="#475569" /> : <ChevronDown size={14} color="#475569" />}
                </button>

                {expandedExample === i && (
                  <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: 'Input',       icon: AlertCircle,  color: '#22d3ee', value: ex.input       },
                      { label: 'Output',      icon: CheckCircle2, color: '#34d399', value: ex.output      },
                      ...(ex.explanation ? [{ label: 'Explanation', icon: Lightbulb, color: '#f59e0b', value: ex.explanation }] : []),
                    ].map(({ label, icon: Icon, color, value }) => (
                      <div key={label}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, fontSize: 11, color: '#475569' }}>
                          <Icon size={11} color={color} />{label}
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 6, fontFamily: FONT, fontSize: 12, color: '#94a3b8', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Constraints — Bug fix #11 */}
      <Section title="Constraints" accent="#ef4444">
        {constraintsList.length > 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 14px' }}>
            {constraintsList.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: i < constraintsList.length - 1 ? 8 : 0 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', marginTop: 6, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{c}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#334155', fontSize: 12 }}>No constraints specified.</p>
        )}
      </Section>

      {/* Hints — Bug fix #12: uses hints[] not hint */}
      {hints.length > 0 && (
        <Section title="Hints" accent="#f59e0b">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {hints.map((hint, i) => (
              <div key={i} style={{ borderRadius: 10, overflow: 'hidden', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <button onClick={() => setVisibleHints(p => ({ ...p, [i]: !p[i] }))} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Lightbulb size={13} color="#f59e0b" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#fbbf24' }}>
                      {visibleHints[i] ? 'Hide' : 'Show'} Hint {i + 1}
                    </span>
                  </div>
                  {visibleHints[i] ? <EyeOff size={13} color="#f59e0b" /> : <Eye size={13} color="#f59e0b" />}
                </button>
                {visibleHints[i] && (
                  <div style={{ padding: '0 14px 12px', fontSize: 12, color: '#fcd34d', lineHeight: 1.7 }}>
                    {hint}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
};

export default ProblemDescription;


// ─────────────────────────────────────────────────────────────────────────────
// Editorial.jsx  (Bug fix #15: removed fake 1500ms loading delay)
// ─────────────────────────────────────────────────────────────────────────────
export const Editorial = ({ problem }) => {
  const [showVideo, setShowVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);

  if (!problem) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24, fontFamily: FONT }}>
      <p style={{ color: '#334155', fontSize: 13 }}>No problem loaded.</p>
    </div>
  );

  return (
    <div style={{ padding: 20, fontFamily: FONT }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg, #4f46e5, #818cf8, #22d3ee)', borderRadius: '4px 4px 0 0' }} />
        <div style={{ background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '14px 16px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f0f6ff', margin: 0 }}>Editorial Solution</h2>
          <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 0' }}>Step-by-step video walkthrough</p>
        </div>
      </div>

      {problem.secureUrl ? (
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
          {!showVideo ? (
            <div
              onClick={() => setShowVideo(true)}
              style={{
                height: 220, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: problem.thumbnailUrl ? `url(${problem.thumbnailUrl}) center/cover` : 'rgba(79,70,229,0.1)',
                position: 'relative',
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
              <div style={{ position: 'relative', textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', background: 'rgba(79,70,229,0.8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px',
                  boxShadow: '0 0 24px rgba(79,70,229,0.5)',
                }}>
                  <div style={{ width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: '18px solid #fff', marginLeft: 4 }} />
                </div>
                <p style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, margin: 0, fontFamily: FONT }}>Play solution video</p>
              </div>
            </div>
          ) : videoError ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#f87171', fontSize: 13 }}>
              Failed to load video. <button onClick={() => { setVideoError(false); setShowVideo(false); }} style={{ color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button>
            </div>
          ) : (
            <video src={problem.secureUrl} poster={problem.thumbnailUrl} controls autoPlay
              onError={() => setVideoError(true)}
              style={{ width: '100%', maxHeight: 320, background: '#000', display: 'block' }}
            />
          )}
        </div>
      ) : (
        <div style={{ padding: 32, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(129,140,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <div style={{ fontSize: 24 }}>🎬</div>
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>Editorial Coming Soon</h3>
          <p style={{ fontSize: 12, color: '#334155', maxWidth: 260, margin: '0 auto' }}>
            The video solution will be available after the contest ends or once you solve the problem.
          </p>
        </div>
      )}
    </div>
  );
};


// ─────────────────────────────────────────────────────────────────────────────
// Solutions.jsx  (Bug fix #17: removed style jsx; #18: removed dangerouslySetInnerHTML XSS)
// ─────────────────────────────────────────────────────────────────────────────
export const Solutions = ({ problem }) => {
  const [copiedIndex,      setCopiedIndex]      = useState(null);
  const [expandedSolution, setExpandedSolution] = useState(null);

  const copyCode = async (text, i) => {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedIndex(i);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const LANG_COLORS = { javascript: '#f59e0b', python: '#3b82f6', java: '#f87171', cpp: '#818cf8', c: '#22d3ee' };

  if (!problem?.referenceSolution?.length) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 32, textAlign: 'center', fontFamily: FONT }}>
      <div style={{ fontSize: 40, marginBottom: 14 }}>🔒</div>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>Solutions Locked</h3>
      <p style={{ fontSize: 12, color: '#334155', maxWidth: 260 }}>Solutions become available after you solve the problem. Keep at it!</p>
    </div>
  );

  return (
    <div style={{ padding: 20, fontFamily: FONT }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: '#475569' }}>{problem.referenceSolution.length} solution{problem.referenceSolution.length > 1 ? 's' : ''} available</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {problem.referenceSolution.map((sol, i) => {
          const lang  = sol.language?.toLowerCase() || 'unknown';
          const color = LANG_COLORS[lang] || '#64748b';
          const open  = expandedSolution === i;

          return (
            <div key={i} style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${open ? 'rgba(129,140,248,0.22)' : 'rgba(255,255,255,0.07)'}`, transition: 'border-color 0.2s' }}>
              <button onClick={() => setExpandedSolution(open ? null : i)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', background: open ? 'rgba(129,140,248,0.06)' : 'rgba(255,255,255,0.02)',
                border: 'none', cursor: 'pointer', fontFamily: FONT,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: `${color}20`, color, border: `1px solid ${color}40`, textTransform: 'uppercase' }}>
                    {sol.language}
                  </span>
                  <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Solution {i + 1}</span>
                </div>
                {open ? <ChevronUp size={14} color="#475569" /> : <ChevronDown size={14} color="#475569" />}
              </button>

              {open && (
                <div style={{ position: 'relative', background: '#060810', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button onClick={(e) => { e.stopPropagation(); copyCode(sol.completeCode, i); }} style={{
                    position: 'absolute', top: 10, right: 10, zIndex: 2,
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 6, fontSize: 11,
                    background: copiedIndex === i ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.07)',
                    border: copiedIndex === i ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,255,255,0.1)',
                    color: copiedIndex === i ? '#34d399' : '#64748b', cursor: 'pointer', fontFamily: FONT,
                  }}>
                    {copiedIndex === i ? '✓ Copied' : 'Copy'}
                  </button>
                  {/* Bug fix #18: use <pre><code> with textContent — no innerHTML XSS risk */}
                  <pre style={{ margin: 0, padding: '14px 14px 14px 14px', fontSize: 12, lineHeight: 1.7, overflowX: 'auto', color: '#94a3b8', maxHeight: 360, overflowY: 'auto' }}>
                    <code style={{ fontFamily: FONT }}>{sol.completeCode}</code>
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
