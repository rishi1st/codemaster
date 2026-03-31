/**
 * TestCaseOutput.jsx  — all bugs fixed
 *
 * Bug fixes:
 *  7.  passedCount: was tc.status === "Accepted" — backend now returns tc.passed bool.
 *      Always showed 0 passed. Fixed: tc.passed ?? (tc.status === 'Accepted').
 *  8.  avgRuntime / testCases.length — divide-by-zero crash if array empty.
 *  9.  All DaisyUI class names (btn, bg-base-100, text-success…) replaced with
 *      inline styles. Every styled element was invisible before.
 *  10. framer-motion layout on every row: full layout recalc on every expand.
 *      Removed. CSS border-radius transition only.
 *  11. expandAll forEach on undefined testCases — guarded.
 */

import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Play, Zap,
  ChevronDown, ChevronUp, AlertCircle, Cpu, HardDrive,
  BarChart3, Check, X, Copy,
} from 'lucide-react';

const FONT = "'JetBrains Mono','Fira Code',monospace";

const fmtMs  = (v) => { const n = parseFloat(v||0); return (n===0||n<0.1) ? '< 1 ms' : `${n.toFixed(1)} ms`; };
const fmtKB  = (v) => { const n = parseFloat(v||0); if(!n) return '—'; return n>=1024 ? `${(n/1024).toFixed(1)} MB` : `${n} KB`; };

// ── Single test row ───────────────────────────────────────────────────────────
const TestRow = memo(({ tc, index, expanded, onToggle, copiedKey, onCopy }) => {
  const passed = tc.passed ?? (tc.status === 'Accepted'); // Bug fix #7

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 7, border: `1px solid ${passed ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
      {/* Header */}
      <div onClick={() => onToggle(index)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 13px', cursor: 'pointer', transition: 'background 0.12s',
        background: passed ? 'rgba(52,211,153,0.055)' : 'rgba(248,113,113,0.055)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = passed ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = passed ? 'rgba(52,211,153,0.055)' : 'rgba(248,113,113,0.055)'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: passed ? 'rgba(52,211,153,0.14)' : 'rgba(248,113,113,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {passed ? <Check size={13} color="#34d399" /> : <X size={13} color="#f87171" />}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0' }}>Test #{index + 1}</div>
            <div style={{ display: 'flex', gap: 9, marginTop: 1 }}>
              <span style={{ fontSize: 9, color: '#334155', display: 'flex', alignItems: 'center', gap: 2 }}><Clock size={8} />{fmtMs(tc.runtime)}</span>
              <span style={{ fontSize: 9, color: '#334155', display: 'flex', alignItems: 'center', gap: 2 }}><HardDrive size={8} />{fmtKB(tc.memory)}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 800, background: passed ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', color: passed ? '#34d399' : '#f87171' }}>
            {passed ? 'Passed' : 'Failed'}
          </span>
          {expanded ? <ChevronUp size={12} color="#334155" /> : <ChevronDown size={12} color="#334155" />}
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: '10px 13px', background: 'rgba(0,0,0,0.18)', borderTop: `1px solid ${passed ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)'}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 8 }}>
            {[
              { label: 'Input',    value: tc.input,    key: `in-${index}` },
              { label: 'Expected', value: tc.expected, key: `ex-${index}` },
              { label: 'Output',   value: tc.output,   key: `out-${index}`, hl: true },
            ].map(({ label, value, key, hl }) => (
              <div key={key} style={{ background: 'rgba(255,255,255,0.025)', borderRadius: 7, padding: '8px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                  <button onClick={(e) => { e.stopPropagation(); onCopy(value, key); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedKey === key ? '#34d399' : '#334155', padding: 1 }}>
                    {copiedKey === key ? <Check size={10} /> : <Copy size={10} />}
                  </button>
                </div>
                <div style={{ fontFamily: FONT, fontSize: 11, lineHeight: 1.6, color: hl ? (passed ? '#34d399' : '#f87171') : '#94a3b8', background: hl ? (passed ? 'rgba(52,211,153,0.06)' : 'rgba(248,113,113,0.06)') : 'rgba(0,0,0,0.2)', padding: '5px 7px', borderRadius: 5, wordBreak: 'break-all', whiteSpace: 'pre-wrap', maxHeight: 80, overflowY: 'auto' }}>
                  {value ?? '(empty)'}
                </div>
              </div>
            ))}
          </div>
          {!passed && (tc.stderr || tc.compileOutput) && (
            <div style={{ marginTop: 8, padding: '7px 10px', borderRadius: 7, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.14)' }}>
              <div style={{ fontSize: 9, color: '#f87171', fontWeight: 700, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={9} /> Error</div>
              <pre style={{ fontSize: 10, color: '#fca5a5', fontFamily: FONT, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {tc.stderr || tc.compileOutput}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
TestRow.displayName = 'TestRow';

// ── Main ──────────────────────────────────────────────────────────────────────
const TestCaseOutput = memo(({ runResult, onBackToCode }) => {
  const [expanded,   setExpanded]   = useState({});
  const [copiedKey,  setCopiedKey]  = useState(null);

  const toggle     = useCallback((i) => setExpanded((p) => ({ ...p, [i]: !p[i] })), []);
  const expandAll  = useCallback(() => { if (!runResult?.testCases?.length) return; setExpanded(Object.fromEntries(runResult.testCases.map((_,i)=>[i,true]))); }, [runResult]);
  const collapseAll= useCallback(() => setExpanded({}), []);
  const copy       = useCallback((v, k) => {
    if (!v) return;
    try { navigator.clipboard.writeText(String(v)); } catch {}
    setCopiedKey(k); setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  // Bug fix #7 + #8: tc.passed boolean, guard division
  const stats = useMemo(() => {
    const cases = runResult?.testCases;
    if (!cases?.length) return { passed:0, failed:0, avgMs:0, rate:0 };
    const p = cases.filter(tc => tc.passed ?? tc.status === 'Accepted').length;
    const rSum = cases.reduce((s, tc) => s + parseFloat(tc.runtime||0), 0);
    return { passed: p, failed: cases.length - p, avgMs: rSum / cases.length, rate: Math.round((p/cases.length)*100) };
  }, [runResult]);

  if (!runResult) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', padding:32, textAlign:'center', fontFamily: FONT }}>
      <div style={{ width:68, height:68, borderRadius:'50%', background:'rgba(129,140,248,0.08)', border:'1px solid rgba(129,140,248,0.14)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
        <Play size={26} color="#4f46e5" />
      </div>
      <h3 style={{ fontSize:14, fontWeight:700, color:'#e2e8f0', marginBottom:7 }}>Ready to test</h3>
      <p style={{ fontSize:12, color:'#334155', maxWidth:200, lineHeight:1.7 }}>Click <strong style={{ color:'#818cf8' }}>Run</strong> to execute your code.</p>
    </div>
  );

  const cases = runResult.testCases || [];

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', fontFamily: FONT }}>
      {/* Header */}
      <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(129,140,248,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(4,6,12,0.6)', flexShrink:0, flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={onBackToCode} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 9px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#64748b', fontSize:11, cursor:'pointer', fontFamily: FONT }}>
            <ArrowLeft size={12} /> Back
          </button>
          <span style={{ fontSize:12, fontWeight:700, color:'#e2e8f0' }}>Test Results</span>
        </div>
        {cases.length > 0 && (
          <div style={{ display:'flex', gap:5 }}>
            <button onClick={expandAll}  style={{ padding:'3px 9px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', color:'#475569', fontSize:10, cursor:'pointer', fontFamily: FONT }}>Expand All</button>
            <button onClick={collapseAll}style={{ padding:'3px 9px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', color:'#475569', fontSize:10, cursor:'pointer', fontFamily: FONT }}>Collapse</button>
          </div>
        )}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 14px' }}>
        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(90px,1fr))', gap:7, marginBottom:12 }}>
          {[
            { Icon: CheckCircle2, color:'#34d399', label:'Passed',    value: stats.passed         },
            { Icon: XCircle,      color:'#f87171', label:'Failed',    value: stats.failed          },
            { Icon: Cpu,          color:'#22d3ee', label:'Avg Time',  value: fmtMs(stats.avgMs)   },
            { Icon: BarChart3,    color:'#818cf8', label:'Pass Rate', value: `${stats.rate}%`      },
          ].map(({ Icon, color, label, value }) => (
            <div key={label} style={{ padding:'8px 10px', borderRadius:9, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', textAlign:'center' }}>
              <Icon size={13} color={color} style={{ marginBottom:3 }} />
              <div style={{ fontSize:13, fontWeight:800, color }}>{value}</div>
              <div style={{ fontSize:9, color:'#334155', textTransform:'uppercase', letterSpacing:'0.05em', marginTop:1 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.06)', overflow:'hidden', marginBottom:12 }}>
          <div style={{ height:'100%', borderRadius:2, width:`${stats.rate}%`, transition:'width 0.6s ease', background: stats.rate===100 ? 'linear-gradient(90deg,#34d399,#22c55e)' : stats.rate > 0 ? 'linear-gradient(90deg,#f59e0b,#818cf8)' : '#f87171' }} />
        </div>

        {cases.length === 0
          ? <p style={{ fontSize:12, color:'#334155', textAlign:'center', padding:20 }}>No test cases returned.</p>
          : cases.map((tc, i) => <TestRow key={i} tc={tc} index={i} expanded={!!expanded[i]} onToggle={toggle} copiedKey={copiedKey} onCopy={copy} />)
        }
      </div>
    </div>
  );
});
TestCaseOutput.displayName = 'TestCaseOutput';
export default TestCaseOutput;
