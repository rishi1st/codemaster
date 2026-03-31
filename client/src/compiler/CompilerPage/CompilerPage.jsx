import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axiosClient from '../../utils/axiosClient';
import Editor from '@monaco-editor/react';
import {
  Play, Copy, Download, Settings, FileText, X, ChevronDown, Plus,
  Terminal, AlertCircle, CheckCircle2, Zap, Clock, Cpu, Maximize2,
  TrendingUp, Lightbulb, Bug, ChevronRight, Loader2,
  Code2, Braces, Activity, Wifi, WifiOff, Hash, ArrowRight, RotateCcw
} from 'lucide-react';

// ─── Language Config ──────────────────────────────────────────────────────────

const LANGUAGES = [
  { id: 50,  name: 'C',          tag: 'C99',    mono: 'c',          ext: 'c',
    hex: '#A8C4E0', bp: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}' },
  { id: 54,  name: 'C++',        tag: 'C++17',  mono: 'cpp',        ext: 'cpp',
    hex: '#60A0D0', bp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}' },
  { id: 62,  name: 'Java',       tag: 'JDK17',  mono: 'java',       ext: 'java',
    hex: '#F0A030', bp: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}' },
  { id: 63,  name: 'JavaScript', tag: 'ES2024', mono: 'javascript', ext: 'js',
    hex: '#F5D020', bp: 'console.log("Hello, World!");' },
  { id: 71,  name: 'Python',     tag: '3.11',   mono: 'python',     ext: 'py',
    hex: '#4A9FD0', bp: 'print("Hello, World!")' },
  { id: 72,  name: 'Ruby',       tag: '3.2',    mono: 'ruby',       ext: 'rb',
    hex: '#E04040', bp: 'puts "Hello, World!"' },
  { id: 74,  name: 'TypeScript', tag: 'TS5',    mono: 'typescript', ext: 'ts',
    hex: '#3090E0', bp: 'console.log("Hello, World!");' },
];

const getLang = (id) => LANGUAGES.find(l => l.id === id) ?? LANGUAGES[1];
const STORAGE_KEY = 'codeforge_v3';
let _uid = 100;
const uid = () => ++_uid;

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:    '#060A12',
  surf:  '#0A0E1A',
  surf2: '#0D1220',
  surf3: '#101828',
  bdr:   '#152030',
  bdr2:  '#1C2C40',
  text:  '#B8CCE0',
  muted: '#364860',
  cyan:  '#00D4FF',
  cyan2: '#00FFCC',
  red:   '#FF4560',
  amber: '#FFB020',
  green: '#00E676',
};

// ─── Drag resize hook ─────────────────────────────────────────────────────────

function useDragResize(initial, axis, min, max, invert = false) {
  const [size, setSize] = useState(initial);
  const state = useRef({ dragging: false, startPos: 0, startSize: initial });

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    const s = state.current;
    s.dragging = true;
    s.startPos = axis === 'x' ? e.clientX : e.clientY;
    s.startSize = size;

    const onMove = (ev) => {
      if (!s.dragging) return;
      const delta = (axis === 'x' ? ev.clientX : ev.clientY) - s.startPos;
      setSize(Math.min(max, Math.max(min, s.startSize + (invert ? -delta : delta))));
    };
    const onUp = () => {
      s.dragging = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [size, axis, min, max, invert]);

  return [size, onMouseDown];
}

// ─── Micro components ─────────────────────────────────────────────────────────

const Tag = ({ children, color = C.cyan }) => (
  <span style={{
    fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 2,
    background: color + '18', color, border: `1px solid ${color}33`,
    fontFamily: 'monospace', letterSpacing: '0.07em', textTransform: 'uppercase', flexShrink: 0,
  }}>{children}</span>
);

const Dot = ({ color = C.green }) => (
  <span style={{
    display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
    background: color, boxShadow: `0 0 6px ${color}`,
    animation: 'hb 2s ease-in-out infinite', flexShrink: 0,
  }} />
);

const PanelHandle = ({ axis, onMouseDown }) => {
  const isX = axis === 'x';
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flexShrink: 0,
        width: isX ? 5 : '100%',
        height: isX ? '100%' : 5,
        cursor: isX ? 'col-resize' : 'row-resize',
        background: hover ? C.cyan + '28' : 'transparent',
        position: 'relative', zIndex: 10,
        transition: 'background 0.15s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        width: isX ? 1 : 48, height: isX ? 48 : 1,
        background: hover
          ? `linear-gradient(${isX ? '180deg' : '90deg'}, transparent, ${C.cyan}, transparent)`
          : `linear-gradient(${isX ? '180deg' : '90deg'}, transparent, ${C.bdr2}, transparent)`,
        transition: 'background 0.15s',
        pointerEvents: 'none',
      }} />
    </div>
  );
};

const StatBadge = ({ icon: Icon, label, value, color }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '2px 7px', borderRadius: 2,
    border: `1px solid ${color}33`, background: color + '0C',
    fontSize: 9, color, fontFamily: 'monospace',
  }}>
    <Icon size={9} />
    <span style={{ color: C.muted }}>{label}:</span>
    <span style={{ fontWeight: 700 }}>{value}</span>
  </div>
);

const Toast = ({ msg, type }) => {
  const map = { success: C.green, error: C.red, info: C.cyan };
  const col = map[type] ?? C.cyan;
  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : Activity;
  return (
    <div style={{
      position: 'fixed', top: 16, right: 16, zIndex: 9999,
      padding: '8px 14px', borderRadius: 3, fontSize: 11,
      background: '#060A12EE', border: `1px solid ${col}55`,
      color: col, fontWeight: 700, fontFamily: 'monospace',
      boxShadow: `0 0 24px ${col}22, 0 4px 20px #0008`,
      animation: 'toastIn 0.15s ease',
      display: 'flex', alignItems: 'center', gap: 8,
      letterSpacing: '0.05em',
    }}>
      <Icon size={12} />
      {msg}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CompilerPage() {
  const [files, setFiles] = useState([{
    id: 1, name: 'main', langId: 54, active: true,
    content: getLang(54).bp,
  }]);
  const [stdin,        setStdin]        = useState('');
  const [output,       setOutput]       = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [toast,        setToast]        = useState(null);
  const [runCount,     setRunCount]     = useState(0);
  const [outTab,       setOutTab]       = useState('stdout');
  const [showLangDd,   setShowLangDd]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize,     setFontSize]     = useState(13);
  const [wordWrap,     setWordWrap]     = useState(false);
  const [minimap,      setMinimap]      = useState(false);
  const [lineNums,     setLineNums]     = useState(true);
  const [connected,    setConnected]    = useState(true);
  const [clock,        setClock]        = useState('');

  const [editorTheme,  setEditorTheme]  = useState('codeforge-dark');

  // Resizable panels — leftW is % of total width
  const [leftW,  leftDrag]  = useDragResize(60, 'x', 28, 80);
  const [stdinH, stdinDrag] = useDragResize(130, 'y', 60, 300);

  const editorRef  = useRef(null);
  const monacoRef  = useRef(null);
  const langDdRef  = useRef(null);
  const themeReady = useRef(false);

  const activeFile = useMemo(() => files.find(f => f.active) ?? files[0], [files]);
  const activeLang = useMemo(() => getLang(activeFile.langId), [activeFile]);

  // ── Clock ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-US', { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Persistence ──────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!s) return;
      if (s.files?.length) setFiles(s.files);
      if (s.stdin) setStdin(s.stdin);
      if (s.fontSize) setFontSize(s.fontSize);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ files, stdin, fontSize }));
  }, [files, stdin, fontSize]);

  // ── Click-outside ────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => { if (!langDdRef.current?.contains(e.target)) setShowLangDd(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Toast helper ─────────────────────────────────────────────────────────────
  const notify = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  }, []);

  // ── File ops ─────────────────────────────────────────────────────────────────
  const setActiveId    = (id) => setFiles(fs => fs.map(f => ({ ...f, active: f.id === id })));
  const updateContent  = (v)  => setFiles(fs => fs.map(f => f.active ? { ...f, content: v ?? '' } : f));

  const addFile = () => {
    const id = uid();
    setFiles(fs => fs.map(f => ({ ...f, active: false })).concat({
      id, name: `file${id}`, langId: 54, active: true, content: getLang(54).bp,
    }));
  };

  const closeFile = (id, e) => {
    e.stopPropagation();
    if (files.length <= 1) return;
    const rest = files.filter(f => f.id !== id);
    if (files.find(f => f.id === id)?.active) rest[rest.length - 1].active = true;
    setFiles([...rest]);
  };

  const changeLang = (langId) => {
    setFiles(fs => fs.map(f => f.active ? { ...f, langId } : f));
    setShowLangDd(false);
  };

  const resetFile    = () => { updateContent(activeLang.bp); notify('Reset to boilerplate', 'info'); };
  const copyCode     = () => { navigator.clipboard.writeText(activeFile.content); notify('Copied', 'success'); };
  const downloadCode = () => {
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([activeFile.content], { type: 'text/plain' })),
      download: `${activeFile.name}.${activeLang.ext}`,
    });
    a.click();
    notify('Downloaded', 'success');
  };

  // ── Run ──────────────────────────────────────────────────────────────────────
  const runCode = useCallback(async () => {
    if (loading) return;
    setLoading(true); setOutput(null); setOutTab('stdout'); setConnected(true);
    try {
      const { data } = await axiosClient.post('/compiler', {
        sourceCode: activeFile.content,
        languageId: activeFile.langId,
        stdin,
      });
      setOutput(data);
      setRunCount(c => c + 1);
      if (data.stderr) { setOutTab('stderr'); notify('Errors detected', 'error'); }
      else notify('Execution complete', 'success');
    } catch (err) {
      setConnected(false);
      const msg = err.response?.data?.message || 'Network error — check connection.';
      setOutput({ stdout: '', stderr: msg, time: null, memory: null });
      setOutTab('stderr');
      notify('Execution failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [loading, activeFile, stdin, notify]);

  // ── Monaco setup ─────────────────────────────────────────────────────────────
  const onEditorMount = useCallback((editor, monaco) => {
    editorRef.current  = editor;
    monacoRef.current  = monaco;

    if (!themeReady.current) {
      monaco.editor.defineTheme('codeforge-dark', {
        base: 'vs-dark', inherit: true,
        rules: [
          { token: 'comment',   foreground: '2E4A60', fontStyle: 'italic' },
          { token: 'keyword',   foreground: '00CCFF', fontStyle: 'bold'   },
          { token: 'string',    foreground: '00FFB0'  },
          { token: 'number',    foreground: 'FF9040'  },
          { token: 'type',      foreground: 'A080FF'  },
          { token: 'function',  foreground: '60C8FF'  },
          { token: 'variable',  foreground: 'C0D4E8'  },
          { token: 'delimiter', foreground: '304050'  },
          { token: 'operator',  foreground: '00AACC'  },
        ],
        colors: {
          'editor.background':               '#07090F',
          'editor.foreground':               '#C0D4E8',
          'editor.lineHighlightBackground':  '#0C1422',
          'editorLineNumber.foreground':     '#1E3040',
          'editorLineNumber.activeForeground':'#00A8CC',
          'editorCursor.foreground':         '#00D4FF',
          'editorCursor.background':         '#000000',
          'editor.selectionBackground':      '#00D4FF1E',
          'editor.inactiveSelectionBackground': '#00D4FF0C',
          'editorIndentGuide.background':    '#0C1422',
          'editorIndentGuide.activeBackground':'#152030',
          'scrollbar.shadow':                '#00000000',
          'scrollbarSlider.background':      '#10202C',
          'scrollbarSlider.hoverBackground': '#00D4FF18',
          'editorBracketMatch.background':   '#00D4FF14',
          'editorBracketMatch.border':       '#00D4FF40',
          'editorWidget.background':         '#0A0E1A',
          'editorSuggestWidget.background':  '#0A0E1A',
          'editorSuggestWidget.border':      '#152030',
          'editorSuggestWidget.selectedBackground': '#00D4FF18',
        },
      });
      themeReady.current = true;
    }

    monaco.editor.setTheme('codeforge-dark');
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      // trigger via state — can't reference runCode directly here safely
      document.dispatchEvent(new CustomEvent('codeforge:run'));
    });
  }, []);

  useEffect(() => {
    const handler = () => runCode();
    document.addEventListener('codeforge:run', handler);
    return () => document.removeEventListener('codeforge:run', handler);
  }, [runCode]);

  // Apply editor option changes live
  useEffect(() => {
    editorRef.current?.updateOptions({ fontSize, wordWrap: wordWrap ? 'on' : 'off', minimap: { enabled: minimap }, lineNumbers: lineNums ? 'on' : 'off' });
  }, [fontSize, wordWrap, minimap, lineNums]);

  useEffect(() => {
    if (monacoRef.current) monacoRef.current.editor.setTheme(editorTheme);
  }, [editorTheme]);

  // ── Global CSS ────────────────────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600;1,400&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    @keyframes hb     { 0%,100%{ opacity:1; } 50%{ opacity:.4; } }
    @keyframes spin   { to{ transform: rotate(360deg); } }
    @keyframes toastIn{ from{ transform:translateX(16px); opacity:0; } to{ transform:none; opacity:1; } }
    @keyframes fadeUp { from{ transform:translateY(5px); opacity:0; } to{ transform:none; opacity:1; } }
    @keyframes scan   { 0%{ transform:translateY(-120%); } 100%{ transform:translateY(400%); } }
    ::-webkit-scrollbar            { width:4px; height:4px; }
    ::-webkit-scrollbar-track      { background:transparent; }
    ::-webkit-scrollbar-thumb      { background:${C.bdr2}; border-radius:2px; }
    ::-webkit-scrollbar-thumb:hover{ background:${C.cyan}44; }
    .cf-ftab { transition: background .12s, color .12s; }
    .cf-ftab:hover { background: ${C.surf2} !important; }
    .cf-ibtn { transition: background .12s, border-color .12s; }
    .cf-ibtn:hover { background: ${C.surf3} !important; border-color: ${C.bdr2} !important; }
    .cf-lopt { transition: background .1s; }
    .cf-lopt:hover { background: ${C.surf3} !important; }
    .cf-tab  { transition: color .12s, border-color .12s; }
    .cf-tab:hover { color: ${C.cyan} !important; }
    .cf-run:hover  { filter: brightness(1.1); }
    .cf-run:active { transform: scale(0.97); }
    .cf-toggle { width:32px; height:18px; border-radius:9px; background:${C.bdr2}; position:relative; cursor:pointer; transition:background .15s; border:none; padding:0; }
    .cf-toggle.on { background:${C.cyan}; }
    .cf-toggle::after { content:''; position:absolute; width:12px; height:12px; border-radius:50%; background:#fff; top:3px; left:3px; transition:transform .15s; }
    .cf-toggle.on::after { transform:translateX(14px); }
    .cf-setting { display:flex; align-items:center; justify-content:space-between; padding:6px 0; border-bottom:1px solid ${C.bdr}; }
    .cf-setting:last-child { border-bottom:none; }
    textarea { caret-color: ${C.cyan}; }
  `;

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: C.bg, color: C.text,
      fontFamily: '"IBM Plex Mono", "JetBrains Mono", monospace',
      fontSize: 12, overflow: 'hidden', userSelect: 'none',
    }}>
      <style>{css}</style>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* ── Top meta bar ─────────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, height: 28,
        background: C.surf, borderBottom: `1px solid ${C.bdr}`,
        display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10,
      }}>
        <Code2 size={12} color={C.cyan} />
        <span style={{ fontSize: 10, fontWeight: 600, color: C.cyan, letterSpacing: '0.14em' }}>
          CODE<span style={{ color: C.text }}>FORGE</span>
        </span>
        <span style={{ color: C.bdr2, fontSize: 10 }}>|</span>
        <span style={{ fontSize: 9, color: C.muted }}>AI Execution Engine v2.0</span>
        {runCount > 0 && <Tag color={C.cyan}>{runCount} executions</Tag>}

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: 12, fontSize: 9, color: C.muted, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {connected ? <Wifi size={9} color={C.green} /> : <WifiOff size={9} color={C.red} />}
            <span style={{ color: connected ? C.green : C.red, fontWeight: 700 }}>
              {connected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Dot color={C.green} />
            <span>AI READY</span>
          </div>
          <span style={{ color: C.bdr2 }}>|</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{clock}</span>
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, height: 44,
        background: C.surf, borderBottom: `1px solid ${C.bdr}`,
        display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px',
      }}>
        {/* Language picker */}
        <div ref={langDdRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowLangDd(v => !v)}
            className="cf-ibtn"
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
              background: C.surf2, border: `1px solid ${C.bdr}`, borderRadius: 3,
              cursor: 'pointer', color: C.text, fontFamily: 'monospace', fontSize: 11, fontWeight: 500,
            }}
          >
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: activeLang.hex, flexShrink: 0,
              boxShadow: `0 0 6px ${activeLang.hex}99`,
            }} />
            {activeLang.name}
            <Tag color={activeLang.hex}>{activeLang.tag}</Tag>
            <ChevronDown size={11} style={{ color: C.muted }} />
          </button>

          {showLangDd && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 500,
              background: C.surf, border: `1px solid ${C.bdr2}`, borderRadius: 4,
              minWidth: 210, padding: 4,
              boxShadow: `0 16px 50px #000B, 0 0 0 1px ${C.cyan}0E`,
              animation: 'fadeUp 0.1s ease',
            }}>
              {LANGUAGES.map(l => (
                <button
                  key={l.id} className="cf-lopt"
                  onClick={() => changeLang(l.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '6px 10px', borderRadius: 2, cursor: 'pointer',
                    background: l.id === activeFile.langId ? C.cyan + '10' : 'transparent',
                    border: 'none',
                    color: l.id === activeFile.langId ? C.cyan : C.text,
                    fontFamily: 'monospace', fontSize: 11, textAlign: 'left',
                  }}
                >
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: l.hex, flexShrink: 0,
                    boxShadow: l.id === activeFile.langId ? `0 0 5px ${l.hex}` : 'none',
                  }} />
                  <span style={{ flex: 1 }}>{l.name}</span>
                  <Tag color={l.hex}>{l.tag}</Tag>
                  {l.id === activeFile.langId && <ArrowRight size={9} color={C.cyan} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 18, background: C.bdr }} />

        {/* Icon actions */}
        {[
          { icon: Copy,      fn: copyCode,     tip: 'Copy code'    },
          { icon: Download,  fn: downloadCode, tip: 'Download file' },
          { icon: RotateCcw, fn: resetFile,    tip: 'Reset editor' },
        ].map(({ icon: Icon, fn, tip }) => (
          <button key={tip} className="cf-ibtn" onClick={fn} title={tip}
            style={{
              padding: 7, background: C.surf2, border: `1px solid ${C.bdr}`,
              borderRadius: 3, cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center',
            }}>
            <Icon size={13} />
          </button>
        ))}

        <button
          className="cf-ibtn"
          onClick={() => setShowSettings(v => !v)}
          title="Settings"
          style={{
            padding: 7, borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center',
            background: showSettings ? C.cyan + '18' : C.surf2,
            border: `1px solid ${showSettings ? C.cyan + '55' : C.bdr}`,
            color: showSettings ? C.cyan : C.muted,
          }}
        >
          <Settings size={13} />
        </button>

        <div style={{ flex: 1 }} />

        {/* File info */}
        <div style={{ display: 'flex', gap: 10, fontSize: 9, color: C.muted }}>
          <span>{activeFile.content.split('\n').length} ln</span>
          <span>{activeFile.content.length} ch</span>
        </div>

        <div style={{ width: 1, height: 18, background: C.bdr }} />

        {/* RUN */}
        <button
          className="cf-run"
          onClick={runCode}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '6px 20px', borderRadius: 3,
            cursor: loading ? 'not-allowed' : 'pointer',
            background: loading
              ? C.muted
              : `linear-gradient(90deg, ${C.cyan}, ${C.cyan2})`,
            border: 'none',
            color: '#040810', fontWeight: 700, fontSize: 10,
            fontFamily: 'monospace', letterSpacing: '0.12em',
            transition: 'filter .12s, transform .1s',
            opacity: loading ? 0.55 : 1,
            boxShadow: loading ? 'none' : `0 0 22px ${C.cyan}44, 0 2px 8px #000`,
          }}
        >
          {loading
            ? <Loader2 size={11} style={{ animation: 'spin 0.65s linear infinite' }} />
            : <Play size={11} fill="#040810" />
          }
          {loading ? 'RUNNING' : 'EXECUTE'}
          {!loading && (
            <kbd style={{
              fontSize: 8, background: '#04081040', borderRadius: 2,
              padding: '1px 4px', letterSpacing: 0, fontFamily: 'sans-serif',
            }}>⌘↵</kbd>
          )}
        </button>
      </div>

      {/* ── Settings panel ───────────────────────────────────────────────────── */}
      {showSettings && (
        <div style={{
          flexShrink: 0, background: C.surf2, borderBottom: `1px solid ${C.bdr}`,
          padding: '8px 16px', animation: 'fadeUp 0.12s ease',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0 28px', maxWidth: 740 }}>
            <div className="cf-setting">
              <span style={{ fontSize: 10, color: C.muted }}>Font size ({fontSize}px)</span>
              <input type="range" min={10} max={20} value={fontSize} step={1}
                onChange={e => setFontSize(+e.target.value)} style={{ width: 80 }} />
            </div>
            <div className="cf-setting">
              <span style={{ fontSize: 10, color: C.muted }}>Editor theme</span>
              <select value={editorTheme} onChange={e => setEditorTheme(e.target.value)}
                style={{
                  background: C.surf, border: `1px solid ${C.bdr}`, color: C.text,
                  borderRadius: 2, padding: '2px 6px', fontSize: 9,
                  fontFamily: 'monospace', outline: 'none',
                }}>
                <option value="codeforge-dark">Codeforge Dark</option>
                <option value="vs-dark">VS Dark</option>
                <option value="hc-black">High Contrast</option>
                <option value="light">Light</option>
              </select>
            </div>
            <div className="cf-setting">
              <span style={{ fontSize: 10, color: C.muted }}>Word wrap</span>
              <button className={`cf-toggle ${wordWrap ? 'on' : ''}`} onClick={() => setWordWrap(v => !v)} />
            </div>
            <div className="cf-setting">
              <span style={{ fontSize: 10, color: C.muted }}>Minimap</span>
              <button className={`cf-toggle ${minimap ? 'on' : ''}`} onClick={() => setMinimap(v => !v)} />
            </div>
            <div className="cf-setting">
              <span style={{ fontSize: 10, color: C.muted }}>Line numbers</span>
              <button className={`cf-toggle ${lineNums ? 'on' : ''}`} onClick={() => setLineNums(v => !v)} />
            </div>
          </div>
        </div>
      )}

      {/* ── File tabs ────────────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, height: 32,
        display: 'flex', alignItems: 'stretch',
        background: C.surf, borderBottom: `1px solid ${C.bdr}`,
        overflowX: 'auto',
      }}>
        {files.map(f => {
          const fl = getLang(f.langId);
          return (
            <div
              key={f.id}
              className="cf-ftab"
              onClick={() => setActiveId(f.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px',
                cursor: 'pointer', flexShrink: 0, userSelect: 'none',
                background: f.active ? C.bg : 'transparent',
                borderRight: `1px solid ${C.bdr}`,
                borderBottom: `1px solid ${f.active ? C.cyan : 'transparent'}`,
                color: f.active ? C.text : C.muted,
                fontSize: 10, fontWeight: f.active ? 500 : 400,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: fl.hex, flexShrink: 0,
                boxShadow: f.active ? `0 0 4px ${fl.hex}` : 'none' }} />
              <FileText size={9} style={{ opacity: 0.5 }} />
              <span>{f.name}.{fl.ext}</span>
              <span
                onClick={e => closeFile(f.id, e)}
                style={{ marginLeft: 2, cursor: 'pointer', padding: '1px 2px', borderRadius: 2, lineHeight: 1 }}
                onMouseEnter={e => { e.currentTarget.style.color = C.red; e.currentTarget.style.background = C.red + '15'; }}
                onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.background = ''; }}
              >
                <X size={9} />
              </span>
            </div>
          );
        })}
        <button
          onClick={addFile}
          style={{
            padding: '0 12px', background: 'transparent', border: 'none',
            borderRight: `1px solid ${C.bdr}`,
            cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = C.cyan; e.currentTarget.style.background = C.cyan + '08'; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.background = ''; }}
        >
          <Plus size={11} />
        </button>
        <div style={{ flex: 1 }} />
      </div>

      {/* ── Main resizable workspace ──────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* LEFT — Editor */}
        <div style={{ width: `${leftW}%`, minWidth: 200, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
          {/* Editor header */}
          <div style={{
            flexShrink: 0, height: 24,
            background: C.surf2, borderBottom: `1px solid ${C.bdr}`,
            display: 'flex', alignItems: 'center', padding: '0 10px', gap: 8,
          }}>
            <Braces size={9} color={C.muted} />
            <span style={{ fontSize: 9, color: C.muted, flex: 1 }}>
              {activeFile.name}.{activeLang.ext}
            </span>
            <Tag color={activeLang.hex}>{activeLang.name}</Tag>
            <Tag color={C.muted}>UTF-8</Tag>
            <Tag color={C.muted}>LF</Tag>
          </div>

          {/* Monaco */}
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            {/* Subtle scanline */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2, overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', left: 0, right: 0, height: '30%',
                background: 'linear-gradient(transparent, rgba(0,212,255,0.009), transparent)',
                animation: 'scan 10s linear infinite',
              }} />
            </div>

            <Editor
              height="100%"
              language={activeLang.mono}
              theme="codeforge-dark"
              value={activeFile.content}
              onChange={updateContent}
              onMount={onEditorMount}
              options={{
                fontSize,
                fontFamily: '"JetBrains Mono", "Fira Code", "IBM Plex Mono", monospace',
                fontLigatures: true,
                minimap: { enabled: minimap },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: wordWrap ? 'on' : 'off',
                lineNumbers: lineNums ? 'on' : 'off',
                glyphMargin: false,
                folding: true,
                padding: { top: 14, bottom: 14 },
                scrollbar: { vertical: 'auto', horizontal: 'auto', verticalScrollbarSize: 3, horizontalScrollbarSize: 3 },
                renderLineHighlight: 'all',
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                bracketPairColorization: { enabled: true },
                guides: { bracketPairs: 'active' },
                hover: { enabled: true },
                inlineSuggest: { enabled: true },
                suggest: { preview: true },
                renderWhitespace: 'none',
                occurrencesHighlight: true,
                selectionHighlight: true,
              }}
            />
          </div>
        </div>

        {/* Horizontal drag handle */}
        <PanelHandle axis="x" onMouseDown={leftDrag} />

        {/* RIGHT — I/O */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 240 }}>

          {/* STDIN */}
          <div style={{
            flexShrink: 0, height: stdinH,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            borderBottom: `1px solid ${C.bdr}`,
          }}>
            <div style={{
              flexShrink: 0, height: 24,
              background: C.surf2, borderBottom: `1px solid ${C.bdr}`,
              display: 'flex', alignItems: 'center', padding: '0 10px', gap: 6,
            }}>
              <Terminal size={9} color={C.muted} />
              <span style={{ fontSize: 9, color: C.muted, letterSpacing: '0.07em', flex: 1 }}>STDIN</span>
              <span style={{ fontSize: 9, color: C.bdr2 }}>{stdin.split('\n').length} ln · {stdin.length} ch</span>
            </div>
            <textarea
              value={stdin}
              onChange={e => setStdin(e.target.value)}
              placeholder="// input for your program (stdin)…"
              style={{
                flex: 1, resize: 'none', border: 'none', outline: 'none',
                background: C.surf, padding: '10px 12px', color: C.text,
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: Math.max(10, fontSize - 1), lineHeight: 1.7, width: '100%',
              }}
            />
          </div>

          {/* Vertical drag handle */}
          <PanelHandle axis="y" onMouseDown={stdinDrag} />

          {/* OUTPUT */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Output tab bar */}
            <div style={{
              flexShrink: 0, height: 30,
              background: C.surf2, borderBottom: `1px solid ${C.bdr}`,
              display: 'flex', alignItems: 'stretch', padding: '0 6px', gap: 2,
            }}>
              {[
                { id: 'stdout',   icon: Terminal,    label: 'STDOUT',   dot: output?.stdout   ? C.green : null },
                { id: 'stderr',   icon: AlertCircle, label: 'STDERR',   dot: output?.stderr   ? C.red   : null },
                { id: 'analysis', icon: TrendingUp,  label: 'ANALYSIS', dot: output?.analysis ? C.cyan  : null },
              ].map(t => (
                <button
                  key={t.id}
                  className="cf-tab"
                  onClick={() => setOutTab(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '0 10px', background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: `2px solid ${outTab === t.id ? C.cyan : 'transparent'}`,
                    color: outTab === t.id ? C.cyan : C.muted,
                    fontSize: 9, fontWeight: outTab === t.id ? 700 : 400,
                    fontFamily: 'monospace', letterSpacing: '0.07em',
                  }}
                >
                  <t.icon size={9} />
                  {t.label}
                  {t.dot && <span style={{ width: 4, height: 4, borderRadius: '50%', background: t.dot, boxShadow: `0 0 3px ${t.dot}` }} />}
                </button>
              ))}

              {output && (output.time || output.memory) && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, paddingRight: 4 }}>
                  {output.time   && <StatBadge icon={Clock} label="time"   value={`${output.time}s`}    color={C.green} />}
                  {output.memory && <StatBadge icon={Cpu}   label="mem"    value={`${output.memory}KB`} color={C.cyan}  />}
                </div>
              )}
            </div>

            {/* Output body */}
            <div style={{ flex: 1, overflow: 'auto', padding: 12, userSelect: 'text' }}>

              {/* STDOUT TAB */}
              {outTab === 'stdout' && (
                <>
                  {loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, gap: 16 }}>
                      <div style={{ position: 'relative', width: 44, height: 44 }}>
                        <div style={{ position: 'absolute', inset: 0, border: `1px solid ${C.cyan}22`, borderRadius: '50%' }} />
                        <div style={{ position: 'absolute', inset: 3, border: '1px solid transparent', borderTopColor: C.cyan, borderRadius: '50%', animation: 'spin 0.55s linear infinite' }} />
                        <div style={{ position: 'absolute', inset: 8, border: '1px solid transparent', borderTopColor: C.cyan2, borderRadius: '50%', animation: 'spin 0.85s linear infinite reverse' }} />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: C.cyan, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 4 }}>EXECUTING</div>
                        <div style={{ fontSize: 9, color: C.muted }}>AI compiler processing…</div>
                      </div>
                    </div>
                  )}

                  {!loading && !output && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, gap: 10, color: C.muted }}>
                      <div style={{
                        width: 38, height: 38, border: `1px solid ${C.bdr2}`, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Play size={14} style={{ marginLeft: 2 }} />
                      </div>
                      <span style={{ fontSize: 9, letterSpacing: '0.07em' }}>RUN TO SEE OUTPUT</span>
                      <span style={{ fontSize: 9, color: C.bdr2 }}>⌘↵ or click Execute</span>
                    </div>
                  )}

                  {!loading && output?.stdout && (
                    <div style={{ animation: 'fadeUp 0.14s ease' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                        <CheckCircle2 size={10} color={C.green} />
                        <span style={{ fontSize: 9, color: C.green, fontWeight: 700, letterSpacing: '0.08em' }}>SUCCESS</span>
                      </div>
                      <pre style={{
                        margin: 0, padding: '10px 12px', borderRadius: 3,
                        background: C.surf, border: `1px solid ${C.bdr}`,
                        borderLeft: `2px solid ${C.green}`,
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: Math.max(10, fontSize - 1), color: C.text,
                        whiteSpace: 'pre-wrap', lineHeight: 1.75, wordBreak: 'break-word',
                      }}>
                        {output.stdout}
                      </pre>
                    </div>
                  )}

                  {!loading && output && !output.stdout && !output.stderr && (
                    <div style={{
                      padding: '10px 12px', borderRadius: 3,
                      background: C.surf, border: `1px solid ${C.bdr}`,
                      fontSize: 10, color: C.muted, fontStyle: 'italic',
                    }}>
                      (no output produced)
                    </div>
                  )}
                </>
              )}

              {/* STDERR TAB */}
              {outTab === 'stderr' && (
                <>
                  {!output?.stderr && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 0', fontSize: 10, color: C.muted }}>
                      <CheckCircle2 size={11} color={C.green} />
                      No errors
                    </div>
                  )}
                  {output?.stderr && (
                    <div style={{ animation: 'fadeUp 0.14s ease' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                        <AlertCircle size={10} color={C.red} />
                        <span style={{ fontSize: 9, color: C.red, fontWeight: 700, letterSpacing: '0.08em' }}>ERROR</span>
                      </div>
                      <pre style={{
                        margin: 0, padding: '10px 12px', borderRadius: 3,
                        background: C.red + '07', border: `1px solid ${C.red}20`,
                        borderLeft: `2px solid ${C.red}`,
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: Math.max(10, fontSize - 1), color: '#FF7080',
                        whiteSpace: 'pre-wrap', lineHeight: 1.75, wordBreak: 'break-word',
                      }}>
                        {output.stderr}
                      </pre>
                    </div>
                  )}
                </>
              )}

              {/* ANALYSIS TAB */}
              {outTab === 'analysis' && (
                <>
                  {!output?.analysis && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, gap: 8, color: C.muted }}>
                      <TrendingUp size={22} style={{ opacity: 0.15 }} />
                      <span style={{ fontSize: 9, letterSpacing: '0.07em' }}>RUN CODE TO SEE ANALYSIS</span>
                    </div>
                  )}

                  {output?.analysis && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeUp 0.14s ease' }}>

                      {output.analysis.complexity && (
                        <div style={{ padding: '10px 12px', borderRadius: 3, background: C.surf, border: `1px solid ${C.bdr}`, borderLeft: `2px solid ${C.cyan}` }}>
                          <div style={{ fontSize: 9, color: C.muted, letterSpacing: '0.07em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Activity size={8} /> COMPLEXITY
                          </div>
                          <code style={{ fontFamily: 'monospace', fontSize: 16, color: C.cyan, fontWeight: 700 }}>
                            {output.analysis.complexity}
                          </code>
                        </div>
                      )}

                      {output.analysis.issues?.length > 0 && (
                        <div style={{ padding: '10px 12px', borderRadius: 3, background: C.red + '07', border: `1px solid ${C.red}1A`, borderLeft: `2px solid ${C.red}` }}>
                          <div style={{ fontSize: 9, color: C.red, letterSpacing: '0.07em', marginBottom: 8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Bug size={8} /> ISSUES ({output.analysis.issues.length})
                          </div>
                          {output.analysis.issues.map((iss, i) => (
                            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, fontSize: 10, color: '#FF8090', alignItems: 'flex-start', lineHeight: 1.5 }}>
                              <ChevronRight size={9} style={{ flexShrink: 0, marginTop: 2, color: C.red }} />
                              {iss}
                            </div>
                          ))}
                        </div>
                      )}

                      {output.analysis.suggestions?.length > 0 && (
                        <div style={{ padding: '10px 12px', borderRadius: 3, background: C.cyan + '07', border: `1px solid ${C.cyan}1A`, borderLeft: `2px solid ${C.cyan}` }}>
                          <div style={{ fontSize: 9, color: C.cyan, letterSpacing: '0.07em', marginBottom: 8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Lightbulb size={8} /> SUGGESTIONS
                          </div>
                          {output.analysis.suggestions.map((s, i) => (
                            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, fontSize: 10, color: C.text, alignItems: 'flex-start', lineHeight: 1.5 }}>
                              <ArrowRight size={9} style={{ flexShrink: 0, marginTop: 2, color: C.cyan }} />
                              {s}
                            </div>
                          ))}
                        </div>
                      )}

                      {(output.time || output.memory) && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {output.time && (
                            <div style={{ padding: '8px 12px', background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 3 }}>
                              <div style={{ fontSize: 9, color: C.muted, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={8} /> EXEC TIME
                              </div>
                              <span style={{ fontSize: 18, fontWeight: 700, color: C.green }}>{output.time}</span>
                              <span style={{ fontSize: 9, color: C.muted, marginLeft: 3 }}>s</span>
                            </div>
                          )}
                          {output.memory && (
                            <div style={{ padding: '8px 12px', background: C.surf, border: `1px solid ${C.bdr}`, borderRadius: 3 }}>
                              <div style={{ fontSize: 9, color: C.muted, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Cpu size={8} /> MEMORY
                              </div>
                              <span style={{ fontSize: 18, fontWeight: 700, color: C.cyan }}>{output.memory}</span>
                              <span style={{ fontSize: 9, color: C.muted, marginLeft: 3 }}>KB</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom status bar ─────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, height: 22,
        background: loading ? C.cyan + 'BB' : C.surf,
        borderTop: `1px solid ${loading ? C.cyan : C.bdr}`,
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 10,
        transition: 'background 0.25s, border-color 0.25s',
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, fontFamily: 'monospace' }}>
          {loading ? (
            <><Loader2 size={9} style={{ animation: 'spin 0.7s linear infinite', color: '#030608' }} />
              <span style={{ color: '#030608', fontWeight: 700, letterSpacing: '0.08em' }}>EXECUTING — AI ENGINE ACTIVE</span></>
          ) : output ? (
            output.stderr
              ? <><AlertCircle size={9} color={C.red} /><span style={{ color: C.red, fontWeight: 700 }}>FAILED</span></>
              : <><CheckCircle2 size={9} color={C.green} /><span style={{ color: C.green, fontWeight: 700 }}>SUCCESS</span>
                  {output.time   && <span style={{ color: C.muted }}>· {output.time}s</span>}
                  {output.memory && <span style={{ color: C.muted }}>· {output.memory}KB</span>}</>
          ) : (
            <><Hash size={9} color={C.muted} /><span style={{ color: C.muted }}>READY</span></>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: 9, color: C.muted, fontFamily: 'monospace' }}>
          <span>Ln 1 Col 1</span>
          <span style={{ color: C.bdr2 }}>|</span>
          <span>{activeLang.name} {activeLang.tag}</span>
          <span style={{ color: C.bdr2 }}>|</span>
          <span>AI Compiler</span>
        </div>
      </div>
    </div>
  );
}