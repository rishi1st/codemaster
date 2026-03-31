/**
 * Submissions.jsx
 * Bug fix #20: retryFetch duplicated all fetch logic — now just re-calls fetchSubmissions.
 * Bug fix #21: submission.lenguage typo kept consistent with backend.
 * Bug fix #22: external CDN language icons removed — replaced with inline colored badges.
 */
import { useState, useEffect, useCallback, memo } from 'react';
import { Clock, Code, Cpu, HardDrive, CheckCircle2, XCircle, RefreshCw, Copy, X, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import axiosClient from '../utils/axiosClient';

const FONT = "'JetBrains Mono','Fira Code',monospace";

// Bug fix #22: no external CDN — inline coloured label
const LANG_STYLE = {
  javascript: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'JS'  },
  python:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  label: 'PY'  },
  java:       { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'JAVA'},
  cpp:        { color: '#818cf8', bg: 'rgba(129,140,248,0.12)', label: 'C++' },
  c:          { color: '#22d3ee', bg: 'rgba(34,211,238,0.12)',  label: 'C'   },
};

const formatRuntime = (v) => v != null ? `${parseFloat(v).toFixed(1)} ms` : '—';
const formatMemory  = (v) => {
  if (v == null) return '—';
  return v > 1024 ? `${(v / 1024).toFixed(1)} MB` : `${v} KB`;
};
const formatDate = (ds) => {
  const diff = Math.floor((Date.now() - new Date(ds)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ds).toLocaleDateString();
};

const Submissions = memo(({ problemId }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [selected,    setSelected]    = useState(null);
  const [filter,      setFilter]      = useState('all');
  const [copied,      setCopied]      = useState(false);

  const fetchSubmissions = useCallback(async () => {
    if (!problemId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(`/problem/submittedProblem/${problemId}`);
      let data  = res.data;
      if (data && !Array.isArray(data)) data = data.data || data.submissions || [];
      setSubmissions(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load submissions.');
    } finally {
      setLoading(false);
    }
  }, [problemId]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  // Bug fix #20: retry just calls fetchSubmissions
  const retry = useCallback(() => fetchSubmissions(), [fetchSubmissions]);

  const copyCode = async () => {
    if (!selected?.code) return;
    try { await navigator.clipboard.writeText(selected.code); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = selected.code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = submissions.filter((s) => filter === 'all' || s.status === filter);

  if (loading) return (
    <div style={{ padding: 20, fontFamily: FONT }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ height: 60, borderRadius: 10, background: 'rgba(255,255,255,0.03)', marginBottom: 8, animation: `shimmer 1.4s ease-in-out ${i * 0.1}s infinite` }} />
      ))}
      <style>{`@keyframes shimmer{0%,100%{opacity:0.4}50%{opacity:0.7}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding: 32, textAlign: 'center', fontFamily: FONT }}>
      <AlertCircle size={32} color="#f87171" style={{ marginBottom: 12 }} />
      <p style={{ fontSize: 13, color: '#f87171', marginBottom: 14 }}>{error}</p>
      <button onClick={retry} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>
        <RefreshCw size={13} /> Retry
      </button>
    </div>
  );

  return (
    <div style={{ padding: '14px 16px', fontFamily: FONT }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <span style={{ fontSize: 11, color: '#334155', marginRight: 4 }}>Filter:</span>
        {['all', 'accepted', 'wrong', 'error'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
            cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
            background: filter === f ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${filter === f ? 'rgba(129,140,248,0.3)' : 'rgba(255,255,255,0.08)'}`,
            color: filter === f ? '#818cf8' : '#334155',
          }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#334155' }}>{submissions.length} total</span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: '32px 20px', textAlign: 'center' }}>
          <Code size={36} color="#1e293b" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 13, color: '#334155' }}>{submissions.length === 0 ? 'No submissions yet — write your first solution!' : 'No submissions match this filter.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map((sub, i) => {
            const lang      = (sub.lenguage || 'javascript').toLowerCase();
            const langStyle = LANG_STYLE[lang] || { color: '#64748b', bg: 'rgba(255,255,255,0.05)', label: lang.toUpperCase().slice(0, 3) };
            const accepted  = sub.status === 'accepted';

            return (
              <div key={sub._id || i} onClick={() => setSelected(sub)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                transition: 'all 0.15s', gap: 12,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(129,140,248,0.05)'; e.currentTarget.style.borderColor = 'rgba(129,140,248,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  {/* Bug fix #22: inline language badge */}
                  <span style={{ padding: '3px 7px', borderRadius: 6, fontSize: 10, fontWeight: 800, background: langStyle.bg, color: langStyle.color, flexShrink: 0 }}>
                    {langStyle.label}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      {accepted
                        ? <CheckCircle2 size={13} color="#34d399" />
                        : <XCircle      size={13} color="#f87171" />
                      }
                      <span style={{ fontSize: 12, fontWeight: 700, color: accepted ? '#34d399' : '#f87171', textTransform: 'capitalize' }}>
                        {sub.status}
                      </span>
                      <span style={{ fontSize: 11, color: '#334155' }}>
                        {sub.testCasesPassed}/{sub.testCasesTotal} tests
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: '#1e293b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={9} /> {formatDate(sub.createdAt)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Cpu size={10} /> {formatRuntime(sub.runtime)}
                    </div>
                    <div style={{ fontSize: 10, color: '#1e293b' }}>runtime</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#22d3ee', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <HardDrive size={10} /> {formatMemory(sub.memory)}
                    </div>
                    <div style={{ fontSize: 10, color: '#1e293b' }}>memory</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Code modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setSelected(null)}
        >
          <div style={{ width: '100%', maxWidth: 680, maxHeight: '85vh', borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(135deg, #0c1025, #060810)', border: '1px solid rgba(129,140,248,0.2)', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>Submitted Code</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={copyCode} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, fontSize: 11, background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.09)'}`, color: copied ? '#34d399' : '#64748b', cursor: 'pointer', fontFamily: FONT }}>
                  <Copy size={12} /> {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#334155', display: 'flex' }}><X size={16} /></button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
              <pre style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.7, fontFamily: FONT, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                <code>{selected.code}</code>
              </pre>
            </div>
            {selected.errorMessage && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(248,113,113,0.15)', background: 'rgba(248,113,113,0.06)', fontSize: 12, color: '#f87171' }}>
                <AlertCircle size={12} style={{ display: 'inline', marginRight: 6 }} />
                {selected.errorMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

Submissions.displayName = 'Submissions';
export default Submissions;
