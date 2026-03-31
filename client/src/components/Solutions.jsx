/**
 * Solutions.jsx
 * Bug fixes:
 *  A. referenceSolution was never returned by the backend → always empty.
 *     Fixed in getProblemById backend (add referenceSolution to .select()).
 *  B. dangerouslySetInnerHTML used for syntax highlighting → XSS risk.
 *     Replaced with safe token-based rendering.
 *  C. style jsx not valid without Babel plugin → CSS classes never applied.
 *     Replaced with inline styles on each token span.
 *  D. All available languages are shown in a tab-switcher UI.
 */
import React, { useState, useMemo, useCallback, memo } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, Code2, Lock } from 'lucide-react';

const FONT = "'JetBrains Mono','Fira Code',monospace";

// ── Language display config ────────────────────────────────────────────────
const LANG_STYLE = {
  javascript: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'JavaScript' },
  python:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  label: 'Python'     },
  java:       { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Java'       },
  cpp:        { color: '#818cf8', bg: 'rgba(129,140,248,0.12)', label: 'C++'        },
  c:          { color: '#22d3ee', bg: 'rgba(34,211,238,0.12)',  label: 'C'          },
};
const getLangStyle = (l = '') => {
  const key = l.toLowerCase().replace('c++', 'cpp');
  return LANG_STYLE[key] || { color: '#64748b', bg: 'rgba(255,255,255,0.06)', label: l };
};

// ── Safe syntax tokenizer (no innerHTML / no XSS) ─────────────────────────
// Each token: { type, text }
const KEYWORDS = new Set([
  'function','const','let','var','return','if','else','for','while','do',
  'class','new','import','export','default','from','of','in','try','catch',
  'finally','throw','async','await','this','super','static','extends',
  'public','private','protected','void','int','long','double','float',
  'boolean','true','false','null','undefined','None','True','False',
  'def','elif','pass','lambda','import','from','as','with','yield',
  'String','System','out','println',
]);

const tokenize = (code) => {
  const tokens = [];
  let i = 0;
  while (i < code.length) {
    // Single-line comment
    if (code[i] === '/' && code[i + 1] === '/') {
      let j = i;
      while (j < code.length && code[j] !== '\n') j++;
      tokens.push({ type: 'comment', text: code.slice(i, j) });
      i = j;
      continue;
    }
    // Python/shell comment
    if (code[i] === '#') {
      let j = i;
      while (j < code.length && code[j] !== '\n') j++;
      tokens.push({ type: 'comment', text: code.slice(i, j) });
      i = j;
      continue;
    }
    // String (double quote)
    if (code[i] === '"') {
      let j = i + 1;
      while (j < code.length && !(code[j] === '"' && code[j-1] !== '\\')) j++;
      tokens.push({ type: 'string', text: code.slice(i, j + 1) });
      i = j + 1;
      continue;
    }
    // String (single quote)
    if (code[i] === "'") {
      let j = i + 1;
      while (j < code.length && !(code[j] === "'" && code[j-1] !== '\\')) j++;
      tokens.push({ type: 'string', text: code.slice(i, j + 1) });
      i = j + 1;
      continue;
    }
    // Number
    if (/[0-9]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[0-9.]/.test(code[j])) j++;
      tokens.push({ type: 'number', text: code.slice(i, j) });
      i = j;
      continue;
    }
    // Word (keyword or identifier)
    if (/[a-zA-Z_$]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j])) j++;
      const word = code.slice(i, j);
      tokens.push({ type: KEYWORDS.has(word) ? 'keyword' : 'ident', text: word });
      i = j;
      continue;
    }
    // Punctuation / operators
    if (/[{}()[\];,.]/.test(code[i])) {
      tokens.push({ type: 'punct', text: code[i] });
      i++;
      continue;
    }
    // Everything else (whitespace, newlines, operators)
    tokens.push({ type: 'plain', text: code[i] });
    i++;
  }
  return tokens;
};

const TOKEN_COLOR = {
  keyword: '#c084fc',
  comment: '#6b7280',
  string:  '#86efac',
  number:  '#fbbf24',
  ident:   '#93c5fd',
  punct:   '#e2e8f0',
  plain:   '#94a3b8',
};

// Renders code with safe inline-styled tokens — no dangerouslySetInnerHTML
const HighlightedCode = memo(({ code }) => {
  const tokens = useMemo(() => tokenize(code || ''), [code]);
  return (
    <pre style={{
      margin: 0, padding: '16px', fontSize: 12, lineHeight: 1.75,
      fontFamily: FONT, overflowX: 'auto', overflowY: 'auto',
      maxHeight: 420, background: 'transparent',
      whiteSpace: 'pre',
    }}>
      {tokens.map((tok, i) => (
        <span key={i} style={{ color: TOKEN_COLOR[tok.type] || '#94a3b8' }}>
          {tok.text}
        </span>
      ))}
    </pre>
  );
});
HighlightedCode.displayName = 'HighlightedCode';

// ─────────────────────────────────────────────────────────────────────────────
const Solutions = ({ problem }) => {
  // Active language tab — default to first available
  const [activeLang, setActiveLang] = useState(null);
  const [copied,     setCopied]     = useState(false);
  const [expanded,   setExpanded]   = useState(true);

  // Normalise the solutions array
  const solutions = useMemo(() => {
    if (!problem?.referenceSolution?.length) return [];
    return problem.referenceSolution.map((s) => ({
      ...s,
      _langKey: (s.language || '').toLowerCase().replace('c++', 'cpp'),
    }));
  }, [problem?.referenceSolution]);

  // Active solution — default to first on load
  const currentLang = activeLang ?? solutions[0]?._langKey ?? null;
  const currentSol  = solutions.find((s) => s._langKey === currentLang) || solutions[0];

  const copyCode = useCallback(async () => {
    if (!currentSol?.completeCode) return;
    try { await navigator.clipboard.writeText(currentSol.completeCode); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = currentSol.completeCode;
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [currentSol]);

  // ── No solutions ──
  if (!solutions.length) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 32, textAlign: 'center', fontFamily: FONT }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Lock size={22} color="#334155" />
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>Solutions Locked</h3>
      <p style={{ fontSize: 12, color: '#334155', maxWidth: 240, lineHeight: 1.7 }}>
        Solutions become available after you solve the problem. Keep coding!
      </p>
      <div style={{ marginTop: 18, padding: '12px 16px', borderRadius: 10, background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.12)', maxWidth: 260 }}>
        <p style={{ fontSize: 11, color: '#475569', margin: 0, lineHeight: 1.7 }}>
          💡 <strong style={{ color: '#818cf8' }}>Pro tip:</strong> Try solving it yourself first — it's the best way to grow.
        </p>
      </div>
    </div>
  );

  const langStyle = getLangStyle(currentSol?.language || '');

  // ── Solutions UI ──
  return (
    <div style={{ padding: 16, fontFamily: FONT, display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Code2 size={14} color="#818cf8" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>Reference Solutions</span>
          </div>
          <span style={{ fontSize: 11, color: '#334155' }}>
            {solutions.length} language{solutions.length > 1 ? 's' : ''}
          </span>
        </div>
        <p style={{ fontSize: 11, color: '#334155', margin: 0 }}>
          Study these solutions after attempting the problem yourself.
        </p>
      </div>

      {/* ── Language tabs ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12,
        padding: '10px 12px', borderRadius: 10,
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
      }}>
        {solutions.map((sol) => {
          const ls     = getLangStyle(sol.language);
          const active = sol._langKey === currentLang;
          return (
            <button
              key={sol._langKey}
              onClick={() => { setActiveLang(sol._langKey); setExpanded(true); setCopied(false); }}
              style={{
                padding: '5px 13px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
                background: active ? ls.bg : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? ls.color + '55' : 'rgba(255,255,255,0.08)'}`,
                color: active ? ls.color : '#475569',
                boxShadow: active ? `0 0 10px ${ls.color}22` : 'none',
              }}
              onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#64748b'; } }}
              onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#475569'; } }}
            >
              {ls.label}
            </button>
          );
        })}
      </div>

      {/* ── Active solution code block ── */}
      {currentSol && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 10, overflow: 'hidden', border: `1px solid ${langStyle.color}30` }}>

          {/* Code block header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '9px 14px',
            background: `${langStyle.bg}`,
            borderBottom: `1px solid ${langStyle.color}22`,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Traffic lights */}
              {['#ef4444','#f59e0b','#22c55e'].map((c, i) => (
                <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.75 }} />
              ))}
              <span style={{ fontSize: 11, color: '#475569', marginLeft: 4 }}>
                solution.{({ javascript:'js', python:'py', java:'java', cpp:'cpp', c:'c' })[currentSol._langKey] || currentSol._langKey}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {/* Copy button */}
              <button onClick={copyCode} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
                background: copied ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${copied ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.1)'}`,
                color: copied ? '#34d399' : '#64748b',
              }}
              onMouseEnter={(e) => { if (!copied) { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#94a3b8'; } }}
              onMouseLeave={(e) => { if (!copied) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#64748b'; } }}
              >
                {copied
                  ? <><Check size={11} /> Copied!</>
                  : <><Copy size={11} /> Copy</>
                }
              </button>

              {/* Collapse toggle */}
              <button onClick={() => setExpanded((p) => !p)} style={{
                width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#334155', cursor: 'pointer',
              }}>
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
          </div>

          {/* Code area — safe highlighted rendering */}
          {expanded && (
            <div style={{ flex: 1, background: '#060810', overflow: 'hidden' }}>
              <HighlightedCode code={currentSol.completeCode} />
            </div>
          )}
        </div>
      )}

      {/* Bottom tip */}
      <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontSize: 11, color: '#334155', margin: 0, lineHeight: 1.6 }}>
          📚 If you're still stuck, try the <strong style={{ color: '#818cf8' }}>AI Assistant</strong> tab — ask it to explain any part of the solution.
        </p>
      </div>
    </div>
  );
};

export default Solutions;
