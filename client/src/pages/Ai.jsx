/**
 * AI.jsx - Fully Responsive Version
 * Features:
 * ✅ Mobile-first responsive design
 * ✅ Auto-scroll with proper height management
 * ✅ Touch-friendly buttons
 * ✅ Responsive model selector
 * ✅ Adaptive font sizes
 */

import { useEffect, useRef, useCallback, useState, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import ReactMarkdown from 'react-markdown';
import {
  Bot, Send, User, Loader2, AlertCircle, Settings, ChevronDown, Menu, X
} from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { addMessage, setLoading, resetChat } from '../redux/aiSlice';

// Constants
const FONT = "'JetBrains Mono','Fira Code',monospace";
const MAX_HISTORY = 20;

// Status colors
const STATUS = {
  online:    { color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)' },
  thinking:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' },
  error:     { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
};

// Available models
const MODELS = {
  'DeepSeek Chat': 'deepseek/deepseek-chat',
  'DeepSeek R1': 'deepseek/deepseek-r1',
  'GPT-4o Mini': 'openai/gpt-4o-mini',
  'Mistral 7B': 'mistralai/mistral-7b-instruct:free',
  'Llama 3.2': 'meta-llama/llama-3.2-3b-instruct:free',
};

// Quick actions (responsive)
const QUICK_ACTIONS = [
  { label: '💡 Hint', msg: (t) => `Give me a hint for "${t}"` },
  { label: '⚡ Solution', msg: (t) => `Show me the solution for "${t}" with complexity analysis` },
  { label: '🐛 Debug', msg: (t) => `Help me debug my code for "${t}"` },
  { label: '🧪 Edge Cases', msg: (t) => `List edge cases for "${t}"` },
];

// Markdown components (same as before)
const mkComponents = {
  code({ inline, className, children }) {
    if (inline) {
      return (
        <code style={{
          background: 'rgba(129,140,248,0.12)',
          padding: '2px 6px',
          borderRadius: 4,
          fontSize: '0.85em',
          fontFamily: FONT,
          border: '1px solid rgba(129,140,248,0.18)',
          color: '#c4b5fd',
          wordBreak: 'break-word',
        }}>
          {children}
        </code>
      );
    }
    return (
      <pre style={{
        margin: '8px 0 0',
        padding: '12px',
        borderRadius: 9,
        background: 'linear-gradient(135deg, #0c1025, #060810)',
        border: '1px solid rgba(129,140,248,0.15)',
        overflowX: 'auto',
        fontSize: '0.85em',
        lineHeight: 1.6,
        WebkitOverflowScrolling: 'touch',
      }}>
        <code className={className} style={{ fontFamily: FONT, color: '#94a3b8' }}>
          {children}
        </code>
      </pre>
    );
  },
  table: ({ children }) => (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <table style={{ 
        borderCollapse: 'collapse', 
        width: '100%', 
        marginTop: 8, 
        fontSize: '0.85em',
        minWidth: '300px',
      }}>
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th style={{
      border: '1px solid rgba(129,140,248,0.2)',
      padding: '8px 10px',
      background: 'rgba(129,140,248,0.08)',
      color: '#818cf8',
      fontSize: '0.85em',
      textAlign: 'left',
    }}>
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td style={{ 
      border: '1px solid rgba(255,255,255,0.07)', 
      padding: '6px 10px',
      fontSize: '0.85em',
    }}>
      {children}
    </td>
  ),
  p: ({ children }) => <p style={{ margin: '4px 0', lineHeight: 1.6, fontSize: '0.9em' }}>{children}</p>,
  ul: ({ children }) => <ul style={{ margin: '6px 0', paddingLeft: '1.2em' }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ margin: '6px 0', paddingLeft: '1.2em' }}>{children}</ol>,
  li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
  strong: ({ children }) => <strong style={{ color: '#e2e8f0', fontWeight: 700 }}>{children}</strong>,
};

// Message Bubble - Responsive
const Bubble = memo(({ msg, fmtTime }) => {
  const isUser = msg.role === 'user';
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      gap: '8px',
      alignItems: 'flex-start',
      maxWidth: '100%',
    }}>
      {!isUser && (
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          flexShrink: 0,
          marginTop: '2px',
          background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(129,140,248,0.3)',
        }}>
          <Bot size={14} color="#fff" />
        </div>
      )}

      <div style={{
        maxWidth: isUser ? '85%' : '85%',
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: '6px',
      }}>
        <div style={{
          padding: '8px 12px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser
            ? 'linear-gradient(135deg, #4f46e5, #6d28d9)'
            : 'rgba(255,255,255,0.025)',
          border: isUser
            ? '1px solid rgba(129,140,248,0.35)'
            : '1px solid rgba(255,255,255,0.07)',
          fontSize: '0.9em',
          color: isUser ? '#f0f6ff' : '#94a3b8',
          lineHeight: 1.5,
          wordBreak: 'break-word',
        }}>
          {isUser ? (
            <span style={{ whiteSpace: 'pre-wrap' }}>{msg.parts[0].text}</span>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={mkComponents}
            >
              {msg.parts[0].text}
            </ReactMarkdown>
          )}
        </div>
        
        <span style={{ 
          fontSize: '10px', 
          color: '#1e293b', 
          flexShrink: 0, 
          marginBottom: '4px',
          whiteSpace: 'nowrap',
        }}>
          {fmtTime(msg.timestamp)}
        </span>
      </div>

      {isUser && (
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          flexShrink: 0,
          marginTop: '2px',
          background: 'rgba(79,70,229,0.2)',
          border: '1px solid rgba(129,140,248,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <User size={14} color="#818cf8" />
        </div>
      )}
    </div>
  );
});
Bubble.displayName = 'Bubble';

// Thinking Dots - Responsive
const ThinkingDots = () => (
  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
    <div style={{
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      flexShrink: 0,
      background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid rgba(129,140,248,0.3)',
    }}>
      <Bot size={14} color="#fff" />
    </div>
    <div style={{
      padding: '12px 16px',
      borderRadius: '16px 16px 16px 4px',
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.07)',
      display: 'flex',
      gap: '6px',
      alignItems: 'center',
    }}>
      {[0, 150, 300].map((delay) => (
        <div
          key={delay}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#334155',
            animation: `bounce 1.2s ease-in-out ${delay}ms infinite`,
          }}
        />
      ))}
    </div>
  </div>
);

// Main AI Component - Fully Responsive
const AI = ({ problem, language, currentCode, problemId  }) => {
  const { messages, isLoading } = useSelector((s) => s.ai);
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const [netError, setNetError] = useState(null);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [currentModel, setCurrentModel] = useState('DeepSeek Chat');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const { ref: registerRef, ...msgProps } = register('message', {
    required: true,
    minLength: 2,
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll to bottom - smooth and reliable
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Reset on problem change
  useEffect(() => {
    dispatch(resetChat({ firstName: user?.firstName, problemName: problem?.title }));
    setNetError(null);
  }, [dispatch, user, problem?.title]);

  // Cleanup
  useEffect(() => () => abortRef.current?.abort(), []);

  // Close model selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showModelSelector && !event.target.closest('.model-selector')) {
        setShowModelSelector(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showModelSelector]);

  // Submit handler
  const onSubmit = useCallback(
    async (data) => {
      const userMessage = {
        role: "user",
        parts: [{ text: data.message }],
        timestamp: new Date().toISOString(),
      };
  
      dispatch(addMessage(userMessage));
      reset();
      dispatch(setLoading(true));
  
      try {
        const response = await axiosClient.post("/ai/chat", {
          messages: [...messages, userMessage],
          title: problem?.title,
          description: problem?.description,
          testCases: problem?.visibleTestCases,
          startCode: problem?.startCode,
          language,
          currentCode,          // ← now defined
          problemId,            // ← now defined
        });
  
        dispatch(
          addMessage({
            role: "model",
            parts: [{ text: response.data.message }],
            timestamp: new Date().toISOString(),
          })
        );
      } catch (error) {
        console.error("API Error:", error);
        dispatch(
          addMessage({
            role: "model",
            parts: [{ text: "❌ Sorry, I'm having trouble connecting right now. Please try again shortly." }],
            timestamp: new Date().toISOString(),
          })
        );
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, messages, problem, language, currentCode, problemId, reset]   // ← include dependencies
  );

  const setQuick = (text) => {
    reset({ message: text });
    inputRef.current?.focus();
  };

  const fmtTime = (ts) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const statusKey = isLoading ? 'thinking' : netError ? 'error' : 'online';
  const st = STATUS[statusKey];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      maxHeight: '100%',
      width: '100%',
      fontFamily: FONT,
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* Header - Responsive */}
      <div style={{
        padding: isMobile ? '12px 16px' : '10px 20px',
        flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(4,6,12,0.95)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div style={{
            width: isMobile ? '36px' : '32px',
            height: isMobile ? '36px' : '32px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4f46e5, #6d28d9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Bot size={isMobile ? 18 : 16} color="#fff" />
          </div>
          
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ 
              fontSize: isMobile ? '14px' : '13px', 
              fontWeight: 700, 
              color: '#e2e8f0', 
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              CodeMaster AI
            </p>
            <p style={{ 
              fontSize: isMobile ? '10px' : '10px', 
              color: '#334155', 
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {problem?.title
                ? `${problem.title.slice(0, isMobile ? 20 : 36)}${problem.title.length > (isMobile ? 20 : 36) ? '…' : ''}`
                : 'DSA Mentor'}
            </p>
          </div>
        </div>

        {/* Controls - Responsive */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          <div className="model-selector" style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowModelSelector(!showModelSelector);
              }}
              style={{
                padding: isMobile ? '6px 10px' : '4px 8px',
                borderRadius: '6px',
                background: 'rgba(129,140,248,0.1)',
                border: '1px solid rgba(129,140,248,0.2)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: isMobile ? '11px' : '10px',
                color: '#818cf8',
                fontFamily: FONT,
                whiteSpace: 'nowrap',
              }}
            >
              <Settings size={isMobile ? 12 : 12} />
              <span style={{ display: isMobile ? 'none' : 'inline' }}>{currentModel}</span>
              <span style={{ display: isMobile ? 'inline' : 'none' }}>Model</span>
              <ChevronDown size={10} />
            </button>

            {showModelSelector && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                background: '#0f1119',
                border: '1px solid rgba(129,140,248,0.2)',
                borderRadius: '8px',
                padding: '4px 0',
                zIndex: 1000,
                minWidth: isMobile ? '140px' : '160px',
                maxHeight: '300px',
                overflowY: 'auto',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}>
                {Object.keys(MODELS).map((model) => (
                  <button
                    key={model}
                    onClick={() => {
                      setCurrentModel(model);
                      setShowModelSelector(false);
                    }}
                    style={{
                      width: '100%',
                      padding: isMobile ? '10px 12px' : '8px 12px',
                      textAlign: 'left',
                      background: model === currentModel ? 'rgba(129,140,248,0.15)' : 'transparent',
                      border: 'none',
                      color: model === currentModel ? '#818cf8' : '#94a3b8',
                      fontSize: isMobile ? '12px' : '11px',
                      cursor: 'pointer',
                      fontFamily: FONT,
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (model !== currentModel) {
                        e.currentTarget.style.background = 'rgba(129,140,248,0.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (model !== currentModel) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {model}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status - Responsive */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: isMobile ? '6px 10px' : '4px 10px',
            borderRadius: '20px',
            background: st.bg,
            border: `1px solid ${st.border}`,
          }}>
            <div style={{
              width: isMobile ? '8px' : '6px',
              height: isMobile ? '8px' : '6px',
              borderRadius: '50%',
              background: st.color,
              animation: isLoading ? 'pulse 1.2s infinite' : 'none',
            }} />
            <span style={{ 
              fontSize: isMobile ? '10px' : '10px', 
              fontWeight: 700, 
              color: st.color,
              whiteSpace: 'nowrap',
            }}>
              {isLoading ? 'Thinking…' : netError ? 'Error' : 'Online'}
            </span>
          </div>
        </div>
      </div>

      {/* Error Banner - Responsive */}
      {netError && (
        <div style={{
          margin: '12px 16px 0',
          padding: '12px 16px',
          borderRadius: '10px',
          background: netError.type === 'error' ? 'rgba(248,113,113,0.1)' : 'rgba(245,158,11,0.1)',
          border: `1px solid ${netError.type === 'error' ? 'rgba(248,113,113,0.3)' : 'rgba(245,158,11,0.3)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
        }}>
          <AlertCircle size={16} color={netError.type === 'error' ? '#f87171' : '#f59e0b'} />
          <span style={{ 
            fontSize: isMobile ? '12px' : '12px', 
            color: netError.type === 'error' ? '#fca5a5' : '#fcd34d', 
            flex: 1 
          }}>
            {netError.text}
          </span>
          <button
            onClick={() => setNetError(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#334155',
              padding: '4px',
              fontSize: '14px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Messages Container - Scrollable */}
      <div
        ref={messagesContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '16px' : '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {messages.length === 0 && !isLoading && (
          <div style={{
            textAlign: 'center',
            padding: isMobile ? '40px 20px' : '60px 20px',
            color: '#334155',
          }}>
            <Bot size={isMobile ? 48 : 64} color="#1e293b" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ fontSize: isMobile ? '14px' : '16px', margin: 0 }}>
              Ask me anything about this problem!
            </p>
            <p style={{ fontSize: isMobile ? '12px' : '13px', marginTop: '8px', color: '#1e293b' }}>
              I can help with hints, solutions, debugging, and more.
            </p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <Bubble key={i} msg={msg} fmtTime={fmtTime} />
        ))}

        {isLoading && <ThinkingDots />}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions - Responsive Horizontal Scroll */}
      {problem && (
        <div style={{
          padding: isMobile ? '12px 16px' : '8px 20px',
          flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(4,6,12,0.8)',
        }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            paddingBottom: '4px',
          }}>
            {QUICK_ACTIONS.map(({ label, msg }) => (
              <button
                key={label}
                onClick={() => setQuick(msg(problem.title))}
                disabled={isLoading}
                style={{
                  padding: isMobile ? '8px 14px' : '6px 14px',
                  borderRadius: '20px',
                  fontSize: isMobile ? '12px' : '11px',
                  fontWeight: 500,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#94a3b8',
                  opacity: isLoading ? 0.45 : 1,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'rgba(129,140,248,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(129,140,248,0.3)';
                    e.currentTarget.style.color = '#818cf8';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form - Sticky at bottom */}
      <form onSubmit={handleSubmit(onSubmit)} style={{
        padding: isMobile ? '12px 16px' : '12px 20px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(4,6,12,0.95)',
        backdropFilter: 'blur(10px)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              {...msgProps}
              ref={(el) => {
                registerRef(el);
                inputRef.current = el;
              }}
              placeholder="Ask anything about this problem…"
              disabled={isLoading}
              rows={isMobile ? 2 : 1}
              style={{
                width: '100%',
                padding: isMobile ? '12px 14px' : '10px 14px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${errors.message ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: '#e2e8f0',
                fontSize: isMobile ? '14px' : '13px',
                fontFamily: FONT,
                outline: 'none',
                resize: 'none',
                lineHeight: '1.4',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(onSubmit)();
                }
              }}
            />
            {errors.message && (
              <span style={{ 
                position: 'absolute', 
                bottom: '-18px', 
                left: 0, 
                fontSize: '10px', 
                color: '#f87171' 
              }}>
                At least 2 characters
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: isMobile ? '44px' : '40px',
              height: isMobile ? '44px' : '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5, #6d28d9)',
              border: '1px solid rgba(129,140,248,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
          >
            {isLoading ? (
              <Loader2 size={isMobile ? 18 : 16} color="#fff" style={{ animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <Send size={isMobile ? 18 : 16} color="#fff" />
            )}
          </button>
        </div>

        <div style={{ 
          marginTop: '8px', 
          display: 'flex', 
          justifyContent: 'space-between',
          fontSize: isMobile ? '9px' : '9px',
          color: '#1e293b',
        }}>
          <span>
            {messages.length > 1 ? `${messages.length} messages` : ''}
          </span>
          <span>
            {isMobile ? 'Enter to send • Shift+Enter for new line' : 'Press Enter to send • Shift+Enter for new line'}
          </span>
        </div>
      </form>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(129,140,248,0.3);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(129,140,248,0.5);
        }
        
        textarea::placeholder {
          color: #1e293b;
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          textarea {
            font-size: 16px !important; /* Prevents zoom on focus in iOS */
          }
        }
      `}</style>
    </div>
  );
};

export default AI;