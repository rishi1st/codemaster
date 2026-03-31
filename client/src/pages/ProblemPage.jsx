

import {
  useState, useEffect, useRef, useCallback, useMemo,
  lazy, Suspense,
} from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Play, Send, ArrowLeft, Menu, X, GripVertical,
  Code2, FileText, BookOpen, History, MessageSquare,
  Terminal, Zap, AlertCircle,
  Sun, Moon, Maximize2, Minimize2,
  Clock, Pause, RotateCcw,
} from 'lucide-react';
import axiosClient from '../utils/axiosClient';

// ── Lazy panels ───────────────────────────────────────────────────────────────
const ProblemDescription = lazy(() => import('../components/ProblemDescription'));
const Editorial          = lazy(() => import('../components/Editorial'));
const Solutions          = lazy(() => import('../components/Solutions'));
const Submissions        = lazy(() => import('../components/Submissions'));
const CodeEditor         = lazy(() => import('../components/CodeEditor'));
const TestCaseOutput     = lazy(() => import('../components/TestCaseOutput'));
const SubmissionResult   = lazy(() => import('../components/SubmissionResult'));
const AI                 = lazy(() => import('../components/AI'));

// ── Constants ─────────────────────────────────────────────────────────────────
const FONT      = "'JetBrains Mono','Fira Code',monospace";
const MOBILE_BP = 768;
const MIN_PCT   = 22;
const MAX_PCT   = 78;
const DEF_L     = 50;

const DIFF = {
  easy:   { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)'  },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)'  },
  hard:   { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
};

const L_TABS = [
  { id: 'description', Icon: FileText,      label: 'Description'  },
  { id: 'editorial',   Icon: BookOpen,      label: 'Editorial'    },
  { id: 'solutions',   Icon: Code2,         label: 'Solutions'    },
  { id: 'submissions', Icon: History,       label: 'Submissions'  },
  { id: 'chatAi',      Icon: MessageSquare, label: 'AI Assistant' },
];
const R_TABS = [
  { id: 'code',     Icon: Code2,    label: 'Code'      },
  { id: 'testcase', Icon: Terminal, label: 'Test Cases'},
  { id: 'result',   Icon: Zap,      label: 'Result'    },
];

// ── Safe localStorage ─────────────────────────────────────────────────────────
const lsG  = (k,fb=null)=>{ try{const v=localStorage.getItem(k);return v!==null?v:fb;}catch{return fb;} };
const lsS  = (k,v)=>{ try{localStorage.setItem(k,String(v));}catch{} };
const lsGJ = (k,fb)=>{ try{const v=localStorage.getItem(k);return v!==null?JSON.parse(v):fb;}catch{return fb;} };
const lsSJ = (k,v)=>{ try{localStorage.setItem(k,JSON.stringify(v));}catch{} };

// ── Inlined hooks ─────────────────────────────────────────────────────────────

const useWindowSize = () => {
  const g = ()=>({width:typeof window!=='undefined'?window.innerWidth:1280,height:typeof window!=='undefined'?window.innerHeight:800});
  const [s,setS]=useState(g); const t=useRef(null);
  useEffect(()=>{const h=()=>{clearTimeout(t.current);t.current=setTimeout(()=>setS(g()),80);}; window.addEventListener('resize',h); return()=>{window.removeEventListener('resize',h);clearTimeout(t.current);};},[]);
  return s;
};

const useTimer = () => {
  const [time,setTime]=useState(0); const [running,setRunning]=useState(false);
  const iRef=useRef(null);
  const tick=useCallback(()=>setTime(t=>t+1),[]);
  const startTimer=useCallback(()=>{if(iRef.current)return;iRef.current=setInterval(tick,1000);setRunning(true);},[tick]);
  const pauseTimer=useCallback(()=>{clearInterval(iRef.current);iRef.current=null;setRunning(false);},[]);
  const resetTimer=useCallback(()=>{clearInterval(iRef.current);iRef.current=null;setTime(0);setRunning(false);},[]);
  useEffect(()=>()=>clearInterval(iRef.current),[]);
  return{time,isRunning:running,startTimer,pauseTimer,resetTimer};
};

const useTheme = () => {
  const [theme,setTheme]=useState(()=>lsG('theme','dark'));
  useEffect(()=>{lsS('theme',theme);document.documentElement.setAttribute('data-theme',theme);},[theme]);
  const toggleTheme=useCallback(()=>setTheme(p=>p==='dark'?'light':'dark'),[]);
  return{theme,toggleTheme};
};

const useFontSize = () => {
  const [fs,setFs]=useState(()=>{const n=parseInt(lsG('edfs','14'),10);return isNaN(n)?14:Math.min(24,Math.max(12,n));});
  useEffect(()=>{lsS('edfs',fs);},[fs]);
  const inc=useCallback(()=>setFs(p=>Math.min(p+1,24)),[]);
  const dec=useCallback(()=>setFs(p=>Math.max(p-1,12)),[]);
  return{fontSize:fs,increaseFontSize:inc,decreaseFontSize:dec};
};

const useFullscreen = () => {
  const [isFS,setIsFS]=useState(()=>typeof document!=='undefined'?!!document.fullscreenElement:false);
  useEffect(()=>{
    const h=()=>setIsFS(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange',h);
    document.addEventListener('webkitfullscreenchange',h);
    return()=>{document.removeEventListener('fullscreenchange',h);document.removeEventListener('webkitfullscreenchange',h);};
  },[]);
  const toggle=useCallback(async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch{}},[]);
  return{isFullscreen:isFS,toggleFullscreen:toggle};
};

const useLocalStorage=(k,init)=>{
  const [v,setV]=useState(()=>lsGJ(k,init));
  useEffect(()=>lsSJ(k,v),[k,v]);
  return[v,setV];
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const NL=(lang)=>{if(!lang)return'javascript';const v=String(lang).trim().toLowerCase();if(v==='c++'||v==='cpp')return'cpp';if(v==='js'||v==='javascript')return'javascript';if(v==='py'||v==='python')return'python';if(v==='java')return'java';if(v==='c')return'c';return'javascript';};
const CK=(id,lang)=>`code:${id}:${NL(lang)}`;

const Spinner=()=>(
  <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%'}}>
    <div style={{width:26,height:26,border:'2px solid rgba(129,140,248,0.18)',borderTopColor:'#818cf8',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
  </div>
);

const IB={background:'none',border:'none',cursor:'pointer',color:'#475569',padding:5,display:'flex',alignItems:'center',borderRadius:5,transition:'color 0.15s'};
const SP={width:11,height:11,border:'1.5px solid rgba(255,255,255,0.25)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite'};

// ── TabBar ────────────────────────────────────────────────────────────────────
const TabBar=({tabs,active,onSelect,isMobile})=>(
  <div style={{display:'flex',borderBottom:'1px solid rgba(129,140,248,0.09)',background:'rgba(4,6,12,0.82)',flexShrink:0,overflowX:'auto'}}>
    {tabs.map(({id,Icon,label})=>{
      const a=active===id;
      return(
        <button key={id} onClick={()=>onSelect(id)} style={{
          display:'flex',alignItems:'center',gap:5,padding:'9px 13px',
          fontSize:11,fontWeight:a?700:500,color:a?'#e2e8f0':'#334155',
          background:'none',border:'none',borderBottom:`2px solid ${a?'#818cf8':'transparent'}`,
          cursor:'pointer',fontFamily:FONT,whiteSpace:'nowrap',transition:'all 0.15s',
        }}
        onMouseEnter={e=>{if(!a)e.currentTarget.style.color='#64748b';}}
        onMouseLeave={e=>{if(!a)e.currentTarget.style.color='#334155';}}
        >
          <Icon size={12}/>{!isMobile&&label}
        </button>
      );
    })}
  </div>
);

// ── LeftPanel ─────────────────────────────────────────────────────────────────
const LeftPanel = ({ problem, activeTab, setActiveTab, isMobile, id, lang, currentCode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#06080f' }}>
    <TabBar tabs={L_TABS} active={activeTab} onSelect={setActiveTab} isMobile={isMobile} />
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <Suspense fallback={<Spinner />}>
        {problem && (
          <>
            {activeTab === 'description' && <ProblemDescription problem={problem} />}
            {activeTab === 'editorial' && <Editorial problem={problem} />}
            {activeTab === 'solutions' && <Solutions problem={problem} />}
            {activeTab === 'submissions' && <Submissions problemId={id} />}
            {activeTab === 'chatAi' && (
              <AI
                problem={problem}
                language={lang}
                currentCode={currentCode}   // ← pass current code
                problemId={id}              // ← pass problem ID
              />
            )}
          </>
        )}
      </Suspense>
    </div>
  </div>
);

// ── RightPanel ────────────────────────────────────────────────────────────────
const RightPanel=({activeTab,setActiveTab,isMobile,edProps})=>(
  <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden',background:'#06080f'}}>
    <TabBar tabs={R_TABS} active={activeTab} onSelect={setActiveTab} isMobile={isMobile}/>
    <div style={{flex:1,overflow:'hidden'}}>
      <Suspense fallback={<Spinner/>}>
        {activeTab==='code'&&(
          <CodeEditor
            code={edProps.code} selectedLanguage={edProps.lang}
            onCodeChange={edProps.onCode} onEditorMount={edProps.onMount}
            onLanguageChange={edProps.onLang}
            theme={edProps.theme} fontSize={edProps.fs}
            onRun={edProps.onRun} onSubmit={edProps.onSubmit}
            isRunning={edProps.isRunning} isSubmitting={edProps.isSubmitting}
            onResetCode={edProps.onReset} onDownloadCode={edProps.onDl} onCopyCode={edProps.onCopy}
            customInput={edProps.custom} setCustomInput={edProps.setCustom}
          />
        )}
        {activeTab==='testcase'&&<TestCaseOutput runResult={edProps.runResult} onBackToCode={()=>setActiveTab('code')}/>}
        {activeTab==='result'  &&<SubmissionResult submitResult={edProps.submitResult} onBackToCode={()=>setActiveTab('code')}/>}
      </Suspense>
    </div>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
export default function ProblemPage() {
  const{id}=useParams(); const navigate=useNavigate();
  const{width}=useWindowSize(); const isMobile=width<MOBILE_BP;

  // Hooks
  const{time,isRunning:timerOn,startTimer,pauseTimer,resetTimer}=useTimer();
  const{theme,toggleTheme}=useTheme();
  const{fontSize,increaseFontSize,decreaseFontSize}=useFontSize();
  const{isFullscreen,toggleFullscreen}=useFullscreen();
  const[selLang,setSelLang]=useLocalStorage('coding-language','javascript');

  // State
  const[problem,setProblem]=useState(null);
  const[code,setCode]=useState('');
  const[custom,setCustom]=useState('');
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState(null);
  const[runResult,setRunResult]=useState(null);
  const[submitResult,setSubmitResult]=useState(null);
  const[isRunning,setIsRunning]=useState(false);
  const[isSubmitting,setIsSubmitting]=useState(false);

  // Layout
  const[leftTab,setLeftTab]=useState('description');
  const[rightTab,setRightTab]=useState('code');
  const[mobilePanel,setMobilePanel]=useState('left');
  const[mobileMenu,setMobileMenu]=useState(false);
  const[leftPct,setLeftPct]=useState(DEF_L);
  const[dragging,setDragging]=useState(false);

  // Refs
  const cRef=useRef(null); const dragRef=useRef(null);
  const debRef=useRef(null); const hydRef=useRef(false);
  const edRef=useRef(null);

  // Fetch
  useEffect(()=>{
    if(!id)return; let dead=false;
    setLoading(true); setError(null);
    axiosClient.get(`/problem/${id}`)
      .then(({data})=>{
        if(dead)return;
        setProblem(data);
        if(!hydRef.current){
          const cached=lsG(CK(id,selLang));
          const starter=data?.startCode?.find(s=>NL(s?.language)===NL(selLang))?.initialCode||'';
          setCode(cached||starter);
          hydRef.current=true;
        }
      })
      .catch(e=>{if(!dead)setError(e?.response?.data?.message||'Failed to load problem');})
      .finally(()=>{if(!dead)setLoading(false);});
    return()=>{dead=true;};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[id]);

  // Persist code
  useEffect(()=>{
    if(!problem||!id)return;
    clearTimeout(debRef.current);
    debRef.current=setTimeout(()=>lsS(CK(id,selLang),code),500);
    return()=>clearTimeout(debRef.current);
  },[code,id,selLang,problem]);

  // Drag divider
  const onPD=useCallback(e=>{
    e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current={x:e.clientX,start:leftPct}; setDragging(true);
  },[leftPct]);
  const onPM=useCallback(e=>{
    if(!dragging||!dragRef.current||!cRef.current)return;
    const d=((e.clientX-dragRef.current.x)/cRef.current.offsetWidth)*100;
    setLeftPct(Math.min(MAX_PCT,Math.max(MIN_PCT,dragRef.current.start+d)));
  },[dragging]);
  const onPU=useCallback(()=>{setDragging(false);dragRef.current=null;},[]);

  // Editor handlers
  const onCode =useCallback(v=>setCode(v??''),[]);
  const onMount =useCallback(ed=>{edRef.current=ed;},[]);
  const onLang  =useCallback(lang=>{
    const nl=NL(lang); setSelLang(nl);
    const c=lsG(CK(id,nl));
    const s=problem?.startCode?.find(sc=>NL(sc?.language)===nl)?.initialCode||'';
    setCode(c??s);
  },[id,problem,setSelLang]);

  const onRun=useCallback(async()=>{
    if(!problem)return;
    setIsRunning(true); setRunResult(null); setRightTab('testcase'); startTimer();
    try{const{data}=await axiosClient.post(`/submission/run/${id}`,{code,lenguage:NL(selLang),customInput:custom||undefined}); setRunResult(data??{});}
    catch(e){setRunResult({success:false,error:e?.response?.data?.message||'Error running code'});}
    finally{setIsRunning(false);}
  },[problem,id,code,selLang,custom,startTimer]);

  const onSubmit=useCallback(async()=>{
    if(!problem)return;
    setIsSubmitting(true); setSubmitResult(null); setRightTab('result'); startTimer();
    try{const{data}=await axiosClient.post(`/submission/submit/${id}`,{code,lenguage:NL(selLang)}); setSubmitResult(data??{});}
    catch(e){setSubmitResult({success:false,error:e?.response?.data?.message||'Error submitting'});}
    finally{setIsSubmitting(false);}
  },[problem,id,code,selLang,startTimer]);

  const onReset =useCallback(()=>{const s=problem?.startCode?.find(sc=>NL(sc?.language)===NL(selLang))?.initialCode||'';setCode(s);},[problem,selLang]);
  const onCopy  =useCallback(async()=>{try{await navigator.clipboard.writeText(code);}catch{const t=Object.assign(document.createElement('textarea'),{value:code});document.body.appendChild(t);t.select();document.execCommand('copy');document.body.removeChild(t);}},[code]);
  const onDl    =useCallback(()=>{const EXT={javascript:'js',python:'py',java:'java',cpp:'cpp',c:'c'};const url=URL.createObjectURL(new Blob([code],{type:'text/plain'}));Object.assign(document.createElement('a'),{href:url,download:`solution.${EXT[NL(selLang)]||'txt'}`}).click();URL.revokeObjectURL(url);},[code,selLang]);

  const fmtT=useCallback(s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}` ,[]);

  // Loading
  if(loading&&!problem)return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#060810',fontFamily:FONT}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:34,height:34,border:'2px solid rgba(129,140,248,0.18)',borderTopColor:'#818cf8',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}}/>
        <p style={{fontSize:11,color:'#334155'}}>Loading problem…</p>
      </div>
    </div>
  );

  // Error
  if(error)return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#060810',fontFamily:FONT,padding:24}}>
      <div style={{maxWidth:360,textAlign:'center'}}>
        <AlertCircle size={34} color="#f87171" style={{marginBottom:12}}/>
        <h2 style={{fontSize:15,fontWeight:700,color:'#f0f6ff',marginBottom:7}}>Failed to load</h2>
        <p style={{fontSize:12,color:'#475569',marginBottom:16}}>{error}</p>
        <div style={{display:'flex',gap:9,justifyContent:'center'}}>
          <button onClick={()=>window.location.reload()} style={{padding:'7px 15px',borderRadius:7,background:'linear-gradient(135deg,#4f46e5,#6d28d9)',border:'none',color:'#f0f6ff',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:FONT}}>Retry</button>
          <button onClick={()=>navigate('/problems')} style={{padding:'7px 15px',borderRadius:7,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#64748b',fontSize:11,cursor:'pointer',fontFamily:FONT,display:'flex',alignItems:'center',gap:5}}>
            <ArrowLeft size={12}/>Problems
          </button>
        </div>
      </div>
    </div>
  );

  const ds=DIFF[problem?.difficulty?.toLowerCase()]||DIFF.easy;
  const edProps={code,lang:NL(selLang),onCode,onMount,onLang,theme,fs:fontSize,onRun,onSubmit,isRunning,isSubmitting,onReset,onDl,onCopy,custom,setCustom,runResult,submitResult};

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:'#060810',fontFamily:FONT,color:'#e2e8f0',overflow:'hidden'}}>

      {/* ── Navbar ── */}
      <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',height:50,padding:'0 14px',flexShrink:0,background:'rgba(4,6,12,0.97)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(129,140,248,0.1)',zIndex:100}}>

        {/* Left: back + title */}
        <div style={{display:'flex',alignItems:'center',gap:9,minWidth:0,flex:1}}>
          <button onClick={()=>navigate('/problems')} style={{...IB,color:'#334155'}} title="Back to problems"><ArrowLeft size={15}/></button>
          <div style={{width:1,height:13,background:'rgba(255,255,255,0.07)'}}/>
          {problem&&<>
            <span style={{fontSize:12,fontWeight:700,color:'#e2e8f0',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'clamp(80px,18vw,220px)'}}>{problem.title}</span>
            <span style={{padding:'2px 7px',borderRadius:20,fontSize:9,fontWeight:800,color:ds.color,background:ds.bg,border:`1px solid ${ds.border}`,textTransform:'capitalize',flexShrink:0,letterSpacing:'0.04em'}}>{problem.difficulty}</span>
          </>}
        </div>

        {/* Center: timer */}
        <div style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:20,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',flexShrink:0}}>
          <Clock size={10} color="#334155"/>
          <span style={{fontSize:11,fontVariantNumeric:'tabular-nums',color:'#94a3b8',fontWeight:600,minWidth:34}}>{fmtT(time)}</span>
          {!timerOn
            ?<button onClick={startTimer} style={{background:'none',border:'none',cursor:'pointer',color:'#34d399',padding:1,display:'flex'}}><Play size={9}/></button>
            :<button onClick={pauseTimer} style={{background:'none',border:'none',cursor:'pointer',color:'#f59e0b',padding:1,display:'flex'}}><Pause size={9}/></button>
          }
          <button onClick={resetTimer} style={{background:'none',border:'none',cursor:'pointer',color:'#f87171',padding:1,display:'flex'}}><RotateCcw size={9}/></button>
        </div>

        {/* Right: controls + run + submit */}
        <div style={{display:'flex',alignItems:'center',gap:4,flex:1,justifyContent:'flex-end'}}>
          {!isMobile&&(
            <div style={{display:'flex',alignItems:'center',gap:2,padding:'3px 7px',borderRadius:6,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
              <button onClick={decreaseFontSize} style={{...IB,padding:'2px 3px',fontSize:9}}>A-</button>
              <span style={{fontSize:9,color:'#475569',minWidth:16,textAlign:'center'}}>{fontSize}</span>
              <button onClick={increaseFontSize} style={{...IB,padding:'2px 3px',fontSize:9}}>A+</button>
            </div>
          )}
          <button onClick={toggleTheme}     style={IB} title="Toggle theme">{theme==='dark'?<Moon size={13}/>:<Sun size={13}/>}</button>
          <button onClick={toggleFullscreen} style={IB} title="Fullscreen">{isFullscreen?<Minimize2 size={13}/>:<Maximize2 size={13}/>}</button>

          <button onClick={onRun} disabled={isRunning||isSubmitting||!problem} style={{
            display:'flex',alignItems:'center',gap:4,padding:'5px 12px',borderRadius:7,fontSize:11,fontWeight:700,
            background:'rgba(52,211,153,0.11)',border:'1px solid rgba(52,211,153,0.3)',color:'#34d399',
            cursor:(isRunning||!problem)?'not-allowed':'pointer',fontFamily:FONT,opacity:!problem?0.4:1,transition:'all 0.15s',
          }}
          onMouseEnter={e=>{if(!isRunning&&problem)e.currentTarget.style.background='rgba(52,211,153,0.22)';}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(52,211,153,0.11)';}}
          title="Run code (Ctrl+Enter)"
          >
            {isRunning?<div style={SP}/>:<Play size={11}/>}
            {!isMobile&&(isRunning?'Running…':'Run')}
          </button>

          <button onClick={onSubmit} disabled={isRunning||isSubmitting||!problem} style={{
            display:'flex',alignItems:'center',gap:4,padding:'5px 12px',borderRadius:7,fontSize:11,fontWeight:700,
            background:'linear-gradient(135deg,#4f46e5,#6d28d9)',border:'1px solid rgba(129,140,248,0.35)',color:'#f0f6ff',
            cursor:(isSubmitting||!problem)?'not-allowed':'pointer',fontFamily:FONT,opacity:!problem?0.4:1,
            boxShadow:'0 2px 10px rgba(79,70,229,0.22)',transition:'all 0.15s',
          }}
          onMouseEnter={e=>{if(!isSubmitting&&problem)e.currentTarget.style.boxShadow='0 4px 18px rgba(79,70,229,0.42)';}}
          onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 2px 10px rgba(79,70,229,0.22)';}}
          title="Submit solution"
          >
            {isSubmitting?<div style={SP}/>:<Send size={11}/>}
            {!isMobile&&(isSubmitting?'Submitting…':'Submit')}
          </button>

          {isMobile&&<button onClick={()=>setMobileMenu(true)} style={IB}><Menu size={16}/></button>}
        </div>
      </header>

      {/* ── Main split area ── */}
      <div ref={cRef} style={{flex:1,display:'flex',overflow:'hidden',userSelect:dragging?'none':'auto'}} onPointerMove={onPM} onPointerUp={onPU}>
        {isMobile?(
          <div style={{flex:1,overflow:'hidden'}}>
            {mobilePanel==='left'
              ?<LeftPanel  problem={problem} activeTab={leftTab}  setActiveTab={setLeftTab}  isMobile id={id} lang={NL(selLang)} currentCode={code} />
              :<RightPanel activeTab={rightTab} setActiveTab={setRightTab} isMobile edProps={edProps}/>
            }
          </div>
        ):(
          <>
            <div style={{width:`${leftPct}%`,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:`${MIN_PCT}%`}}>
              <LeftPanel problem={problem} activeTab={leftTab} setActiveTab={setLeftTab} isMobile={false} id={id} lang={NL(selLang)} currentCode={code} />
            </div>

            {/* Drag handle */}
            <div onPointerDown={onPD} style={{
              width:5,flexShrink:0,cursor:'col-resize',zIndex:10,
              display:'flex',alignItems:'center',justifyContent:'center',
              background:dragging?'rgba(129,140,248,0.32)':'rgba(129,140,248,0.07)',
              borderLeft:'1px solid rgba(129,140,248,0.1)',borderRight:'1px solid rgba(129,140,248,0.1)',
              transition:'background 0.15s',
            }}
            onMouseEnter={e=>{if(!dragging)e.currentTarget.style.background='rgba(129,140,248,0.17)';}}
            onMouseLeave={e=>{if(!dragging)e.currentTarget.style.background='rgba(129,140,248,0.07)';}}
            >
              <GripVertical size={10} color="rgba(129,140,248,0.38)"/>
            </div>

            <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:`${100-MAX_PCT}%`}}>
              <RightPanel activeTab={rightTab} setActiveTab={setRightTab} isMobile={false} edProps={edProps}/>
            </div>
          </>
        )}
      </div>

      {/* ── Mobile bottom bar ── */}
      {isMobile&&(
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 13px',background:'rgba(4,6,12,0.98)',borderTop:'1px solid rgba(129,140,248,0.1)',flexShrink:0}}>
          <div style={{display:'flex',gap:6}}>
            {[['left','Problem'],['right','Code']].map(([p,l])=>(
              <button key={p} onClick={()=>setMobilePanel(p)} style={{
                padding:'5px 11px',borderRadius:7,fontSize:10,fontWeight:600,cursor:'pointer',fontFamily:FONT,
                background:mobilePanel===p?'linear-gradient(135deg,#4f46e5,#6d28d9)':'rgba(255,255,255,0.04)',
                border:`1px solid ${mobilePanel===p?'rgba(129,140,248,0.35)':'rgba(255,255,255,0.07)'}`,
                color:mobilePanel===p?'#f0f6ff':'#64748b',
              }}>{l}</button>
            ))}
          </div>
          <div style={{display:'flex',gap:6}}>
            <button onClick={onRun} disabled={isRunning} style={{display:'flex',alignItems:'center',gap:4,padding:'5px 11px',borderRadius:7,fontSize:10,fontWeight:700,cursor:isRunning?'not-allowed':'pointer',fontFamily:FONT,background:'rgba(52,211,153,0.11)',border:'1px solid rgba(52,211,153,0.3)',color:'#34d399'}}>
              {isRunning?<div style={SP}/>:<Play size={10}/>} Run
            </button>
            <button onClick={onSubmit} disabled={isSubmitting} style={{display:'flex',alignItems:'center',gap:4,padding:'5px 11px',borderRadius:7,fontSize:10,fontWeight:700,cursor:isSubmitting?'not-allowed':'pointer',fontFamily:FONT,background:'linear-gradient(135deg,#4f46e5,#6d28d9)',border:'1px solid rgba(129,140,248,0.3)',color:'#f0f6ff'}}>
              {isSubmitting?<div style={SP}/>:<Send size={10}/>} Submit
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile slide menu ── */}
      {mobileMenu&&isMobile&&(
        <div style={{position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,0.72)',backdropFilter:'blur(8px)'}} onClick={()=>setMobileMenu(false)}>
          <div style={{position:'absolute',left:0,top:0,bottom:0,width:248,background:'linear-gradient(135deg,#0c1025,#080c1a)',borderRight:'1px solid rgba(129,140,248,0.15)',padding:'16px 13px',animation:'slideL 0.2s cubic-bezier(0.16,1,0.3,1)',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <span style={{fontSize:12,fontWeight:700,color:'#f0f6ff'}}>Navigation</span>
              <button onClick={()=>setMobileMenu(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#475569'}}><X size={15}/></button>
            </div>
            <p style={{fontSize:9,color:'#334155',letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:6}}>Problem</p>
            {L_TABS.map(({id:t,Icon,label})=>(
              <button key={t} onClick={()=>{setLeftTab(t);setMobilePanel('left');setMobileMenu(false);}} style={{
                width:'100%',display:'flex',alignItems:'center',gap:9,padding:'8px 10px',borderRadius:7,marginBottom:2,fontSize:11,
                background:leftTab===t?'rgba(129,140,248,0.12)':'transparent',
                border:`1px solid ${leftTab===t?'rgba(129,140,248,0.2)':'transparent'}`,
                color:leftTab===t?'#e2e8f0':'#64748b',cursor:'pointer',fontFamily:FONT,textAlign:'left',
              }}><Icon size={12}/>{label}</button>
            ))}
            <div style={{height:1,background:'rgba(255,255,255,0.06)',margin:'10px 0'}}/>
            <p style={{fontSize:9,color:'#334155',letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:6}}>Editor</p>
            {R_TABS.map(({id:t,Icon,label})=>(
              <button key={t} onClick={()=>{setRightTab(t);setMobilePanel('right');setMobileMenu(false);}} style={{
                width:'100%',display:'flex',alignItems:'center',gap:9,padding:'8px 10px',borderRadius:7,marginBottom:2,fontSize:11,
                background:rightTab===t?'rgba(129,140,248,0.12)':'transparent',
                border:`1px solid ${rightTab===t?'rgba(129,140,248,0.2)':'transparent'}`,
                color:rightTab===t?'#e2e8f0':'#64748b',cursor:'pointer',fontFamily:FONT,textAlign:'left',
              }}><Icon size={12}/>{label}</button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        @keyframes spin  { to{transform:rotate(360deg)} }
        @keyframes slideL{ from{transform:translateX(-100%)} to{transform:translateX(0)} }
        *{ box-sizing:border-box; }
        ::-webkit-scrollbar{ width:4px; height:4px; }
        ::-webkit-scrollbar-track{ background:transparent; }
        ::-webkit-scrollbar-thumb{ background:rgba(129,140,248,0.16); border-radius:2px; }
        ::-webkit-scrollbar-thumb:hover{ background:rgba(129,140,248,0.3); }
      `}</style>
    </div>
  );
}
