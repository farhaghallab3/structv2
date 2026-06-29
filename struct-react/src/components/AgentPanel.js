import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

const QUICK_ACTIONS = [
  { key: 'analyze',  icon: '📊', label: 'Analyze',  labelAr: 'تحليل'  },
  { key: 'report',   icon: '📄', label: 'Report',   labelAr: 'تقرير'  },
  { key: 'organize', icon: '📋', label: 'Organize', labelAr: 'تنظيم'  },
  { key: 'improve',  icon: '⚡', label: 'Improve',  labelAr: 'تحسين'  },
  { key: 'build',    icon: '🏗', label: 'Build',    labelAr: 'بناء'   },
];

const DEFAULT_PROMPTS = {
  analyze:  { en: 'Analyze this system and identify issues, risks, and opportunities.', ar: 'حلل هذا النظام وحدد المشاكل والمخاطر والفرص.' },
  report:   { en: 'Generate a progress report for this system.', ar: 'أنشئ تقرير تقدم لهذا النظام.' },
  organize: { en: 'How should I organize the data in this system?', ar: 'كيف أنظم البيانات في هذا النظام؟' },
  improve:  { en: 'Suggest improvements for this system.', ar: 'اقترح تحسينات لهذا النظام.' },
  build:    { en: 'Help me design and build a better system structure.', ar: 'ساعدني في تصميم هيكل أفضل لهذا النظام.' },
};

// Typing animation hook
function useTypingEffect(text, speed = 8, isActive = false) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const idxRef = useRef(0);

  useEffect(() => {
    if (!isActive || !text) { setDisplayed(text || ''); setDone(true); return; }
    setDisplayed('');
    setDone(false);
    idxRef.current = 0;
    const interval = setInterval(() => {
      idxRef.current += 1;
      setDisplayed(text.slice(0, idxRef.current));
      if (idxRef.current >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, isActive, speed]);

  return { displayed, done };
}

// Render markdown-style bold and bullet points
function renderResponse(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (!line.trim()) return <br key={i} />;
    // Bold **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={j} style={{ color: '#fff' }}>{part.slice(2, -2)}</strong>
        : part
    );
    // Bullet points
    if (line.trim().startsWith('- ') || line.trim().startsWith('• ') || line.trim().match(/^\d+\./)) {
      return (
        <div key={i} style={{ display: 'flex', gap: '8px', margin: '4px 0', paddingLeft: '4px' }}>
          <span style={{ color: '#555', flexShrink: 0, marginTop: '1px' }}>▸</span>
          <span>{parts}</span>
        </div>
      );
    }
    // Headings (#)
    if (line.startsWith('# ') || line.startsWith('## ') || line.startsWith('### ')) {
      const level = line.match(/^#+/)[0].length;
      const content = line.replace(/^#+\s/, '');
      const size = level === 1 ? '16px' : level === 2 ? '14px' : '13px';
      return (
        <div key={i} style={{ color: '#e0e0e0', fontWeight: '700', fontSize: size, margin: '12px 0 6px', borderBottom: level <= 2 ? '1px solid #1e1e1e' : 'none', paddingBottom: level <= 2 ? '6px' : '0' }}>
          {content}
        </div>
      );
    }
    return <p key={i} style={{ margin: '4px 0', lineHeight: '1.65' }}>{parts}</p>;
  });
}

export default function AgentPanel({ systemId, systemName, onClose }) {
  const [activeAction, setActiveAction] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError]       = useState('');
  const textareaRef = useRef(null);

  // Typing effect for the response
  const { displayed, done } = useTypingEffect(response, 6, !!response && !loading);

  const handleActionClick = (action) => {
    setActiveAction(action.key);
    // Detect language from any existing message, default Arabic
    const isArabic = /[\u0600-\u06FF]/.test(message);
    const lang = isArabic ? 'ar' : 'en';
    setMessage(DEFAULT_PROMPTS[action.key]?.[lang] || DEFAULT_PROMPTS[action.key]?.en || '');
    textareaRef.current?.focus();
  };

  const handleRun = async () => {
    if (!message.trim() || loading) return;
    setLoading(true);
    setResponse('');
    setError('');
    try {
      const result = await api.runAgent(systemId, message.trim(), activeAction || 'chat');
      if (result.success) {
        setResponse(result.response);
      } else {
        setError(result.response || 'Something went wrong');
      }
    } catch (err) {
      setError(err.message || 'Failed to reach agent');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleRun();
  };

  const handleClear = () => {
    setResponse('');
    setError('');
    setMessage('');
    setActiveAction(null);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
        pointerEvents: 'none',
      }}
    >
      {/* Panel */}
      <div
        style={{
          pointerEvents: 'all',
          width: 'min(480px, 100vw)',
          height: '100vh',
          background: '#0c0c0c',
          borderLeft: '1px solid #1e1e1e',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-24px 0 80px rgba(0,0,0,0.7)',
          animation: 'slideInRight 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
          .agent-dot {
            display: inline-block;
            width: 6px; height: 6px;
            border-radius: 50%;
            background: #6366f1;
            animation: pulse 1.2s ease-in-out infinite;
          }
          .agent-dot:nth-child(2) { animation-delay: 0.2s; }
          .agent-dot:nth-child(3) { animation-delay: 0.4s; }
          .agent-action-btn {
            transition: background 0.15s, color 0.15s, border-color 0.15s;
          }
          .agent-run-btn:hover:not(:disabled) {
            opacity: 0.88;
          }
        `}</style>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px', borderBottom: '1px solid #1a1a1a', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '15px', flexShrink: 0,
            }}>✦</div>
            <div>
              <div style={{ color: '#fff', fontWeight: '700', fontSize: '15px', lineHeight: 1 }}>Struct Agent</div>
              <div style={{ color: '#444', fontSize: '11px', marginTop: '3px' }}>{systemName}</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: '#161616', border: '1px solid #222', color: '#555',
            width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
            padding: 0,
          }}>✕</button>
        </div>

        {/* Quick Actions */}
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #141414', flexShrink: 0 }}>
          <div style={{ color: '#333', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', fontWeight: '600' }}>
            Quick Actions
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {QUICK_ACTIONS.map(action => (
              <button
                key={action.key}
                className="agent-action-btn"
                onClick={() => handleActionClick(action)}
                style={{
                  background: activeAction === action.key ? '#6366f115' : '#111',
                  border: `1px solid ${activeAction === action.key ? '#6366f155' : '#1e1e1e'}`,
                  color: activeAction === action.key ? '#818cf8' : '#555',
                  borderRadius: '20px', padding: '6px 14px',
                  fontSize: '12px', cursor: 'pointer', fontWeight: '600',
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Response Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {!response && !loading && !error && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', gap: '12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '36px', opacity: 0.15 }}>✦</div>
              <div style={{ color: '#2a2a2a', fontSize: '13px', maxWidth: '260px', lineHeight: 1.6 }}>
                Choose a quick action or type your request below. Agent responds in your language.
              </div>
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 0' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', flexShrink: 0,
              }}>✦</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 0' }}>
                <span className="agent-dot" />
                <span className="agent-dot" />
                <span className="agent-dot" />
              </div>
            </div>
          )}

          {error && (
            <div style={{
              background: '#ef444410', border: '1px solid #ef444430',
              borderRadius: '10px', padding: '14px 16px', color: '#ef4444', fontSize: '13px',
            }}>
              ⚠ {error}
            </div>
          )}

          {response && !loading && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', flexShrink: 0,
                }}>✦</div>
                <span style={{ color: '#555', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Struct Agent
                </span>
                {!done && (
                  <div style={{ display: 'flex', gap: '3px', alignItems: 'center', marginLeft: '4px' }}>
                    <span className="agent-dot" style={{ width: '4px', height: '4px' }} />
                    <span className="agent-dot" style={{ width: '4px', height: '4px' }} />
                    <span className="agent-dot" style={{ width: '4px', height: '4px' }} />
                  </div>
                )}
              </div>
              <div style={{
                color: '#aaa', fontSize: '13.5px', lineHeight: '1.7',
                background: '#0f0f0f', borderRadius: '12px',
                padding: '16px 18px', border: '1px solid #141414',
              }}>
                {renderResponse(displayed)}
                {!done && <span style={{ display: 'inline-block', width: '2px', height: '14px', background: '#6366f1', marginLeft: '2px', verticalAlign: 'middle', animation: 'pulse 0.8s ease-in-out infinite' }} />}
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{
          padding: '16px 20px', borderTop: '1px solid #141414', flexShrink: 0,
          background: '#0c0c0c',
        }}>
          {response && (
            <button onClick={handleClear} style={{
              background: 'transparent', border: 'none', color: '#333',
              fontSize: '12px', cursor: 'pointer', marginBottom: '10px',
              padding: '0', textDecoration: 'underline',
            }}>
              Clear & start over
            </button>
          )}
          <div style={{
            background: '#111', border: '1px solid #1e1e1e',
            borderRadius: '14px', overflow: 'hidden',
            transition: 'border-color 0.2s',
          }}
            onFocus={() => {}} // handled by textarea
          >
            <textarea
              ref={textareaRef}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the agent anything about this system..."
              rows={3}
              style={{
                width: '100%', background: 'transparent', border: 'none',
                color: '#ccc', fontSize: '13px', padding: '14px 16px',
                outline: 'none', resize: 'none', lineHeight: '1.6',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 14px', borderTop: '1px solid #161616',
            }}>
              <span style={{ color: '#2a2a2a', fontSize: '11px' }}>Ctrl+Enter to run</span>
              <button
                className="agent-run-btn"
                onClick={handleRun}
                disabled={loading || !message.trim()}
                style={{
                  background: loading || !message.trim() ? '#1a1a1a' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none', borderRadius: '8px',
                  color: loading || !message.trim() ? '#333' : '#fff',
                  padding: '7px 18px', fontSize: '13px', fontWeight: '700',
                  cursor: loading || !message.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? 'Thinking...' : 'Run ▶'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
