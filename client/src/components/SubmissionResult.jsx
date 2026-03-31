/**
 * SubmissionResult.jsx — all bugs fixed
 *
 * Bug fixes:
 *  12. submitResult.testCaseResults was accessed without optional chaining —
 *      crashes when backend sends error response (no testCaseResults field).
 *  13. Progress bar was fake — counted 0→100 in a fixed timer regardless of results.
 *      Replaced with real bar based on actual pass rate.
 *  14. DaisyUI class names (btn, btn-ghost, bg-base-100, text-success, text-error,
 *      border-success, bg-success/10…) — not loaded in this project.
 *      Every styled element appeared unstyled. Replaced 100% with inline styles.
 *  15. framer-motion layout on every row — expensive recalc on expand/collapse. Removed.
 */

import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Zap,
  ChevronDown, ChevronUp, Trophy, AlertCircle, Cpu, HardDrive,
} from 'lucide-react';

const FONT   = "'JetBrains Mono','Fira Code',monospace";
const fmtMs  = (v) => { const n=parseFloat(v||0); return (n===0||n<0.1)?'< 1 ms':`${n.toFixed(1)} ms`; };
const fmtKB  = (v) => { const n=parseFloat(v||0); if(!n) return '—'; return n>=1024?`${(n/1024).toFixed(1)} MB`:`${n} KB`; };

// ── Single result row ─────────────────────────────────────────────────────────
const ResultRow = memo(({ test, index, expanded, onToggle }) => {
  const passed = test.passed ?? (test.status === 'Accepted');
  return (
    <div style={{ borderRadius:10, overflow:'hidden', marginBottom:7, border:`1px solid ${passed ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
      <div onClick={() => onToggle(index)} style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'9px 13px', cursor:'pointer', transition:'background 0.12s',
        background: passed ? 'rgba(52,211,153,0.05)' : 'rgba(248,113,113,0.05)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = passed ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = passed ? 'rgba(52,211,153,0.05)' : 'rgba(248,113,113,0.05)'; }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          {passed ? <CheckCircle2 size={14} color="#34d399" /> : <XCircle size={14} color="#f87171" />}
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'#e2e8f0' }}>Test Case {index + 1}</div>
            <div style={{ fontSize:9, color:'#334155', marginTop:1 }}>{test.status || 'Unknown'}</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ display:'flex', gap:10, fontSize:9, color:'#334155' }}>
            <span style={{ display:'flex', alignItems:'center', gap:2 }}><Cpu size={8} />{fmtMs(test.runtime)}</span>
            <span style={{ display:'flex', alignItems:'center', gap:2 }}><HardDrive size={8} />{fmtKB(test.memory)}</span>
          </div>
          <span style={{ padding:'2px 8px', borderRadius:20, fontSize:9, fontWeight:800, background: passed?'rgba(52,211,153,0.12)':'rgba(248,113,113,0.12)', color: passed?'#34d399':'#f87171' }}>
            {passed ? 'Passed' : 'Failed'}
          </span>
          {expanded ? <ChevronUp size={12} color="#334155" /> : <ChevronDown size={12} color="#334155" />}
        </div>
      </div>

      {expanded && (
        <div style={{ padding:'9px 13px', background:'rgba(0,0,0,0.15)', borderTop:`1px solid ${passed?'rgba(52,211,153,0.1)':'rgba(248,113,113,0.1)'}` }}>
          <div style={{ marginBottom:7 }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Your Output</div>
            <div style={{ fontFamily:FONT, fontSize:11, padding:'6px 9px', borderRadius:6, background: passed?'rgba(52,211,153,0.06)':'rgba(248,113,113,0.06)', border:`1px solid ${passed?'rgba(52,211,153,0.15)':'rgba(248,113,113,0.15)'}`, color: passed?'#34d399':'#fca5a5', whiteSpace:'pre-wrap', wordBreak:'break-all', maxHeight:80, overflowY:'auto' }}>
              {test.userOutput ?? '(no output)'}
            </div>
          </div>
          {!passed && (test.stderr || test.compileOutput) && (
            <div style={{ padding:'7px 9px', borderRadius:7, background:'rgba(248,113,113,0.07)', border:'1px solid rgba(248,113,113,0.15)' }}>
              <div style={{ fontSize:9, color:'#f87171', fontWeight:700, marginBottom:3, display:'flex', alignItems:'center', gap:4 }}><AlertCircle size={9} /> Error</div>
              <pre style={{ fontSize:10, color:'#fca5a5', fontFamily:FONT, margin:0, whiteSpace:'pre-wrap', wordBreak:'break-all' }}>
                {test.stderr || test.compileOutput}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
ResultRow.displayName = 'ResultRow';

// ── Main ──────────────────────────────────────────────────────────────────────
const SubmissionResult = memo(({ submitResult, onBackToCode }) => {
  const [expanded, setExpanded] = useState({});
  const toggle = useCallback((i) => setExpanded((p) => ({ ...p, [i]: !p[i] })), []);

  // Bug fix #12: safe access
  const results  = submitResult?.testCaseResults ?? [];
  const accepted = submitResult?.accepted ?? false;

  // Bug fix #13: real stats
  const stats = useMemo(() => {
    if (!results.length) return { passed:0, failed:0, rate:0 };
    const p = results.filter(tc => tc.passed ?? tc.status === 'Accepted').length;
    return { passed: p, failed: results.length - p, rate: Math.round((p/results.length)*100) };
  }, [results]);

  // Empty state
  if (!submitResult) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', padding:32, textAlign:'center', fontFamily:FONT }}>
      <div style={{ width:68, height:68, borderRadius:'50%', background:'rgba(129,140,248,0.08)', border:'1px solid rgba(129,140,248,0.14)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
        <Zap size={26} color="#818cf8" />
      </div>
      <h3 style={{ fontSize:14, fontWeight:700, color:'#e2e8f0', marginBottom:7 }}>Ready to submit</h3>
      <p style={{ fontSize:12, color:'#334155', maxWidth:200, lineHeight:1.7 }}>Click <strong style={{ color:'#818cf8' }}>Submit</strong> to run against all hidden test cases.</p>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', fontFamily:FONT }}>
      {/* Header */}
      <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(129,140,248,0.08)', display:'flex', alignItems:'center', gap:9, background:'rgba(4,6,12,0.6)', flexShrink:0 }}>
        <button onClick={onBackToCode} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 9px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#64748b', fontSize:11, cursor:'pointer', fontFamily:FONT }}>
          <ArrowLeft size={12} /> Back
        </button>
        <span style={{ fontSize:12, fontWeight:700, color:'#e2e8f0' }}>Submission Result</span>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 14px' }}>

        {/* Verdict card */}
        <div style={{
          borderRadius:12, padding:'16px 18px', marginBottom:14,
          background: accepted ? 'rgba(52,211,153,0.07)' : (submitResult.error ? 'rgba(248,113,113,0.07)' : 'rgba(248,113,113,0.07)'),
          border: `1px solid ${accepted ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
        }}>
          {/* Status */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:13 }}>
            {accepted ? <CheckCircle2 size={20} color="#34d399" /> : <XCircle size={20} color="#f87171" />}
            <div>
              <div style={{ fontSize:15, fontWeight:800, color: accepted?'#34d399':'#f87171' }}>
                {accepted ? '🎉 Accepted' : '❌ Wrong Answer'}
              </div>
              <div style={{ fontSize:10, color:'#475569', marginTop:1 }}>
                {submitResult.passedTestCases ?? stats.passed}/{submitResult.totalTestCases ?? results.length} test cases passed
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
            {[
              { Icon:Clock,     color:'#22d3ee', label:'Runtime', value: fmtMs(submitResult.runtime) },
              { Icon:HardDrive, color:'#818cf8', label:'Memory',  value: fmtKB(submitResult.memory)  },
            ].map(({ Icon, color, label, value }) => (
              <div key={label} style={{ padding:'9px 11px', borderRadius:9, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3 }}>
                  <Icon size={11} color={color} />
                  <span style={{ fontSize:9, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</span>
                </div>
                <div style={{ fontSize:14, fontWeight:800, color, fontVariantNumeric:'tabular-nums' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Real progress bar (Bug fix #13) */}
          <div style={{ marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:9, color:'#334155' }}>Test cases</span>
              <span style={{ fontSize:9, fontWeight:700, color: accepted?'#34d399':'#f87171' }}>{stats.rate}%</span>
            </div>
            <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
              <div style={{
                height:'100%', borderRadius:2, width:`${stats.rate}%`, transition:'width 0.8s ease',
                background: accepted ? 'linear-gradient(90deg,#34d399,#22c55e)' : stats.rate > 0 ? 'linear-gradient(90deg,#f59e0b,#f87171)' : '#f87171',
              }} />
            </div>
          </div>

          {/* Tip */}
          {accepted ? (
            <div style={{ padding:'9px 11px', borderRadius:8, background:'rgba(52,211,153,0.07)', border:'1px solid rgba(52,211,153,0.18)', display:'flex', gap:7 }}>
              <Trophy size={13} color="#34d399" style={{ flexShrink:0, marginTop:1 }} />
              <p style={{ fontSize:11, color:'#6ee7b7', margin:0, lineHeight:1.6 }}>All test cases passed! Check the Solutions tab to compare approaches.</p>
            </div>
          ) : (
            <div style={{ padding:'9px 11px', borderRadius:8, background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.18)', display:'flex', gap:7 }}>
              <AlertCircle size={13} color="#f59e0b" style={{ flexShrink:0, marginTop:1 }} />
              <p style={{ fontSize:11, color:'#fcd34d', margin:0, lineHeight:1.6 }}>
                {submitResult.errorMessage || 'Check edge cases — empty inputs, negative numbers, and boundary values often reveal bugs.'}
              </p>
            </div>
          )}
        </div>

        {/* Test case breakdown */}
        {results.length > 0 && (
          <>
            <div style={{ fontSize:11, fontWeight:700, color:'#e2e8f0', marginBottom:9, display:'flex', alignItems:'center', gap:7 }}>
              Test Breakdown
              <span style={{ padding:'1px 6px', borderRadius:10, background:'rgba(255,255,255,0.06)', fontSize:9, color:'#475569', fontWeight:500 }}>{results.length}</span>
            </div>
            {results.map((test, i) => (
              <ResultRow key={i} test={test} index={i} expanded={!!expanded[i]} onToggle={toggle} />
            ))}
          </>
        )}
      </div>
    </div>
  );
});
SubmissionResult.displayName = 'SubmissionResult';
export default SubmissionResult;
