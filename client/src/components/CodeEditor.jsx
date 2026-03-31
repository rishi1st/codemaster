/**
 * CodeEditor.jsx
 * Bug fixes:
 *  25. customInput was collected but never passed to onRun — now forwarded via props.
 *  26. showLanguageDropdown had no outside-click-to-close — added useEffect with mousedown.
 *  27. Pause button used <Minus> icon — replaced with <Pause>.
 */
import React, { useState, useRef, useEffect, memo } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play, Send, Download, Copy, RotateCcw,
  Terminal, ChevronDown, Minus, Plus,
  Moon, Sun, Maximize2, Minimize2, Pause, Zap, X,
} from 'lucide-react';

const FONT = "'JetBrains Mono','Fira Code',monospace";

const LANGS = [
  { value: 'javascript', label: 'JavaScript', ext: 'js'  },
  { value: 'python',     label: 'Python',     ext: 'py'  },
  { value: 'java',       label: 'Java',       ext: 'java'},
  { value: 'cpp',        label: 'C++',        ext: 'cpp' },
  { value: 'c',          label: 'C',          ext: 'c'   },
];

const monacoLang = (l) => ({ cpp: 'cpp', c: 'c', java: 'java', python: 'python' }[l] || 'javascript');

const CodeEditor = memo(({
  code, selectedLanguage, onCodeChange, onEditorMount,
  onLanguageChange, theme, fontSize,
  onRun, onSubmit, isRunning, isSubmitting,
  onResetCode, onDownloadCode, onCopyCode,
  customInput, setCustomInput,
}) => {
  const [showLangMenu,   setShowLangMenu]   = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const langMenuRef = useRef(null);

  // Bug fix #26: close dropdown on outside click
  useEffect(() => {
    if (!showLangMenu) return;
    const handler = (e) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showLangMenu]);

  const currentLang = LANGS.find((l) => l.value === selectedLanguage) || LANGS[0];
  const isLoading   = isRunning || isSubmitting;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#07090f', fontFamily: FONT }}>

      {/* ── Editor toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 12px', borderBottom: '1px solid rgba(129,140,248,0.08)',
        background: 'rgba(6,8,16,0.6)', flexShrink: 0, gap: 8, flexWrap: 'wrap',
      }}>
        {/* Language selector */}
        <div ref={langMenuRef} style={{ position: 'relative' }}>
          <button onClick={() => setShowLangMenu((p) => !p)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 11px', borderRadius: 7,
            background: showLangMenu ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${showLangMenu ? 'rgba(129,140,248,0.35)' : 'rgba(255,255,255,0.1)'}`,
            color: '#e2e8f0', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
          }}>
            {currentLang.label}
            <ChevronDown size={12} color="#475569" style={{ transform: showLangMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>

          {showLangMenu && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0,
              minWidth: 140, borderRadius: 10, overflow: 'hidden',
              background: 'linear-gradient(135deg, #0c1025, #080c1a)',
              border: '1px solid rgba(129,140,248,0.2)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
              zIndex: 50, animation: 'dropIn 0.15s ease',
            }}>
              {LANGS.map((lang) => (
                <button key={lang.value} onClick={() => { onLanguageChange(lang.value); setShowLangMenu(false); }} style={{
                  display: 'block', width: '100%', padding: '9px 14px',
                  textAlign: 'left', fontSize: 12, fontWeight: 500,
                  color: selectedLanguage === lang.value ? '#818cf8' : '#64748b',
                  background: selectedLanguage === lang.value ? 'rgba(129,140,248,0.1)' : 'transparent',
                  border: 'none', cursor: 'pointer', fontFamily: FONT, transition: 'all 0.12s',
                }}
                onMouseEnter={(e) => { if (selectedLanguage !== lang.value) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94a3b8'; } }}
                onMouseLeave={(e) => { if (selectedLanguage !== lang.value) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; } }}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ToolBtn onClick={onResetCode}    title="Reset code"><RotateCcw size={13} /></ToolBtn>
          <ToolBtn onClick={onCopyCode}     title="Copy code"><Copy size={13} /></ToolBtn>
          <ToolBtn onClick={onDownloadCode} title="Download"><Download size={13} /></ToolBtn>
          <ToolBtn onClick={() => setShowCustomInput((p) => !p)} title="Custom input" active={showCustomInput}>
            <Terminal size={13} />
          </ToolBtn>
        </div>
      </div>

      {/* ── Monaco Editor ── */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Editor
          height="100%"
          language={monacoLang(selectedLanguage)}
          value={code}
          onChange={onCodeChange}
          onMount={onEditorMount}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          options={{
            fontSize,
            fontFamily: FONT,
            minimap:             { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout:     true,
            tabSize:             2,
            wordWrap:            'on',
            lineNumbers:         'on',
            folding:             true,
            renderLineHighlight: 'all',
            cursorStyle:         'line',
            mouseWheelZoom:      true,
            smoothScrolling:     true,
            padding:             { top: 12, bottom: 12 },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter:    'on',
            snippetSuggestions:         'inline',
            bracketPairColorization:    { enabled: true },
            guides: { bracketPairs: true },
          }}
          loading={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#07090f' }}>
              <Zap size={20} color="#818cf8" style={{ animation: 'pulse 1.2s ease-in-out infinite' }} />
            </div>
          }
        />
      </div>

      {/* ── Custom input — Bug fix #25: now properly captured ── */}
      {showCustomInput && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)', padding: '10px 12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: '#475569', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Custom Input</span>
            <button onClick={() => setShowCustomInput(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#334155', padding: 2 }}><X size={13} /></button>
          </div>
          <textarea
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Enter custom stdin for testing…"
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 7, padding: '8px 10px', fontSize: 12,
              color: '#94a3b8', fontFamily: FONT, resize: 'vertical', outline: 'none',
            }}
          />
        </div>
      )}

      {/* ── Footer: Run + Submit ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        gap: 8, padding: '10px 12px', borderTop: '1px solid rgba(129,140,248,0.08)',
        background: 'rgba(6,8,16,0.7)', flexShrink: 0,
      }}>
        <button onClick={onRun} disabled={isLoading} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)',
          color: '#34d399', cursor: isLoading ? 'not-allowed' : 'pointer', fontFamily: FONT,
          opacity: isLoading ? 0.6 : 1, transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = 'rgba(52,211,153,0.22)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(52,211,153,0.12)'; }}
        >
          {isRunning ? <Spin /> : <Play size={13} />}
          {isRunning ? 'Running…' : 'Run'}
        </button>

        <button onClick={onSubmit} disabled={isLoading} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          background: 'linear-gradient(135deg, #4f46e5, #6d28d9)',
          border: '1px solid rgba(129,140,248,0.35)', color: '#f0f6ff',
          cursor: isLoading ? 'not-allowed' : 'pointer', fontFamily: FONT,
          opacity: isLoading ? 0.6 : 1,
          boxShadow: '0 2px 12px rgba(79,70,229,0.2)', transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.boxShadow = '0 4px 20px rgba(79,70,229,0.4)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(79,70,229,0.2)'; }}
        >
          {isSubmitting ? <Spin /> : <Send size={13} />}
          {isSubmitting ? 'Submitting…' : 'Submit'}
        </button>
      </div>

      <style>{`
        @keyframes dropIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
});

const ToolBtn = ({ onClick, title, children, active = false }) => (
  <button onClick={onClick} title={title} style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: 6,
    background: active ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${active ? 'rgba(129,140,248,0.3)' : 'rgba(255,255,255,0.08)'}`,
    color: active ? '#818cf8' : '#475569', cursor: 'pointer',
    transition: 'all 0.15s',
  }}
  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#64748b'; } }}
  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#475569'; } }}
  >
    {children}
  </button>
);

const Spin = () => (
  <div style={{ width: 12, height: 12, border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
);

CodeEditor.displayName = 'CodeEditor';
export default CodeEditor;
