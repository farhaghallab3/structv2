import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';

const QUICK_ACTIONS = [
  { key: 'analyze',  icon: '◈', label: 'Analyze'  },
  { key: 'report',   icon: '▤', label: 'Report'   },
  { key: 'organize', icon: '≡', label: 'Organize' },
  { key: 'improve',  icon: '↑', label: 'Improve'  },
  { key: 'build',    icon: '+', label: 'Build'     },
];

const DEFAULT_PROMPTS = {
  analyze:  'Analyze this system and identify issues, risks, and opportunities.',
  report:   'Generate a comprehensive report for this system.',
  organize: 'How should I organize the data in this system?',
  improve:  'Suggest improvements for this system.',
  build:    'Help me design and build a better system structure.',
};

const LEVEL_COLORS = { red: '#ef4444', yellow: '#f59e0b', green: '#22c55e' };
const LEVEL_ICONS  = { red: '🔴', yellow: '🟡', green: '🟢' };

const READING_STEPS = [
  'Reading Tables...',
  'Reading Records...',
  'Reading KPIs...',
  'Analyzing Structure...',
];

function AgentPanel({ systemId, systemName, systemData, onClose, onOpenReport, showToast }) {
  const getSaved = () => { try { return JSON.parse(localStorage.getItem(`agent_state_${systemId}`)) || {}; } catch { return {}; } };
  const [activeAction, setActiveAction] = useState(() => getSaved().activeAction || null);
  const [message, setMessage]           = useState(() => getSaved().message || '');
  const [phase, setPhase]               = useState(() => getSaved().phase || 'idle'); // idle | reading | result | applying | done
  const [readingStep, setReadingStep]   = useState(() => getSaved().readingStep || 0);
  const [result, setResult]             = useState(() => getSaved().result || null);
  const [applied, setApplied]           = useState(() => getSaved().applied || []);
  const [reportHtml, setReportHtml]     = useState(() => getSaved().reportHtml || null);
  const textareaRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(`agent_state_${systemId}`, JSON.stringify({ activeAction, message, phase, readingStep, result, applied, reportHtml }));
  }, [activeAction, message, phase, readingStep, result, applied, reportHtml, systemId]);

  const handleActionClick = (action) => {
    setActiveAction(action.key);
    setMessage(DEFAULT_PROMPTS[action.key] || '');
    textareaRef.current?.focus();
  };

  const handleRun = async () => {
    const msg = message.trim() || (activeAction && DEFAULT_PROMPTS[activeAction]) || '';
    if (!msg) return;

    setPhase('reading');
    setResult(null);
    setApplied([]);
    setReportHtml(null);
    setReadingStep(0);

    // Animate reading steps
    for (let i = 0; i < READING_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 500));
      setReadingStep(i + 1);
    }

    try {
      const data = await api.runAgent(systemId, msg, activeAction || 'analyze');
      if (data.error) {
        setResult({ error: data.error });
      } else {
        setResult(data);
        if (data.report_html) setReportHtml(data.report_html);
      }
      setPhase('result');
    } catch (err) {
      setResult({ error: err.message || 'Failed to reach agent' });
      setPhase('result');
    }
  };

  const handleApply = async () => {
    if (!result?.proposed_actions?.length) return;
    setPhase('applying');
    try {
      const res = await api.agentApply(systemId, result.proposed_actions);
      setApplied(res.executed || []);
      setPhase('done');
      showToast('Actions applied successfully');
    } catch (err) {
      showToast('Failed to apply actions');
      setPhase('result');
    }
  };

  const handleOpenReport = () => {
    if (reportHtml && onOpenReport) onOpenReport(reportHtml, systemName);
  };

  const handleClear = () => {
    setPhase('idle');
    setResult(null);
    setApplied([]);
    setReportHtml(null);
    setMessage('');
    setActiveAction(null);
    setReadingStep(0);
  };

  return (
    <div style={{position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'stretch', justifyContent:'flex-end', pointerEvents:'none'}}>
      <div style={{pointerEvents:'all', width:'min(480px,100vw)', height:'100vh', background:'#0c0c0c',
        borderLeft:'1px solid #1e1e1e', display:'flex', flexDirection:'column',
        boxShadow:'-24px 0 80px rgba(0,0,0,0.7)'}}>
        <style>{`
          @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
          @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
          .step-done { color: #22c55e; }
          .step-active { color: #fff; animation: pulse 1s infinite; }
          .step-pending { color: #333; }
        `}</style>

        {/* Header */}
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px', borderBottom:'1px solid #1a1a1a', flexShrink:0}}>
          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <div style={{width:'32px', height:'32px', borderRadius:'10px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px'}}>✦</div>
            <div>
              <div style={{color:'#fff', fontWeight:'700', fontSize:'15px'}}>Struct Agent</div>
              <div style={{color:'#444', fontSize:'11px'}}>{systemName}</div>
            </div>
          </div>
          <button onClick={onClose} style={{background:'#161616', border:'1px solid #222', color:'#555',
            width:'30px', height:'30px', borderRadius:'8px', cursor:'pointer', fontSize:'16px'}}>✕</button>
        </div>

        {/* Quick Actions */}
        <div style={{padding:'14px 20px', borderBottom:'1px solid #141414', flexShrink:0}}>
          <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
            {QUICK_ACTIONS.map(a => (
              <button key={a.key} onClick={() => handleActionClick(a)}
                style={{background: activeAction===a.key ? '#6366f115' : '#111',
                  border:`1px solid ${activeAction===a.key ? '#6366f155' : '#1e1e1e'}`,
                  color: activeAction===a.key ? '#818cf8' : '#555',
                  borderRadius:'20px', padding:'6px 14px', fontSize:'12px', cursor:'pointer', fontWeight:'600',
                  display:'flex', alignItems:'center', gap:'5px'}}>
                <span style={{fontSize:'10px'}}>{a.icon}</span> {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{flex:1, overflowY:'auto', padding:'20px'}}>

          {/* IDLE */}
          {phase === 'idle' && (
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              height:'100%', gap:'12px', textAlign:'center'}}>
              <div style={{fontSize:'36px', opacity:0.1}}>✦</div>
              <div style={{color:'#2a2a2a', fontSize:'13px', maxWidth:'260px', lineHeight:1.6}}>
                Choose a quick action or describe what you need. The agent will analyze and execute inside Struct.
              </div>
            </div>
          )}

          {/* READING */}
          {phase === 'reading' && (
            <div style={{padding:'8px 0'}}>
              <div style={{color:'#555', fontSize:'12px', marginBottom:'16px', textTransform:'uppercase', letterSpacing:'0.08em'}}>Agent working...</div>
              {READING_STEPS.map((step, i) => (
                <div key={i} style={{display:'flex', alignItems:'center', gap:'10px', padding:'8px 0',
                  animation: i < readingStep ? 'none' : 'fadeIn 0.3s ease'}}>
                  <span style={{fontSize:'13px'}}>
                    {i < readingStep ? '✓' : i === readingStep ? '◌' : '○'}
                  </span>
                  <span className={i < readingStep ? 'step-done' : i === readingStep ? 'step-active' : 'step-pending'}
                    style={{fontSize:'13px'}}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* RESULT */}
          {(phase === 'result' || phase === 'done') && result && (
            <div style={{animation:'fadeIn 0.4s ease'}}>

              {result.error ? (
                <div style={{background:'#ef444410', border:'1px solid #ef444430', borderRadius:'10px',
                  padding:'14px 16px', color:'#ef4444', fontSize:'13px'}}>⚠ {result.error}</div>
              ) : (
                <>
                  {/* Summary */}
                  {result.summary && (
                    <div style={{marginBottom:'20px'}}>
                      <div style={{color:'#555', fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'8px'}}>Summary</div>
                      <div style={{color:'#ccc', fontSize:'13px', lineHeight:'1.7', background:'#0f0f0f',
                        borderRadius:'10px', padding:'14px 16px', border:'1px solid #141414'}}>
                        {result.summary}
                      </div>
                    </div>
                  )}

                  {/* Findings */}
                  {result.findings?.length > 0 && (
                    <div style={{marginBottom:'20px'}}>
                      <div style={{color:'#555', fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'8px'}}>Findings</div>
                      {result.findings.map((f, i) => (
                        <div key={i} style={{display:'flex', alignItems:'flex-start', gap:'10px', padding:'8px 0',
                          borderBottom:'1px solid #0f0f0f'}}>
                          <span style={{fontSize:'12px', marginTop:'1px'}}>{LEVEL_ICONS[f.level] || '●'}</span>
                          <span style={{color: LEVEL_COLORS[f.level] || '#888', fontSize:'13px', lineHeight:'1.5'}}>{f.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Report */}
                  {reportHtml && (
                    <div style={{marginBottom:'20px'}}>
                      <button onClick={handleOpenReport}
                        style={{width:'100%', background:'#6366f115', border:'1px solid #6366f144',
                          color:'#818cf8', padding:'12px', borderRadius:'10px', cursor:'pointer',
                          fontSize:'13px', fontWeight:'600', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}>
                        ▤ Open Report
                      </button>
                    </div>
                  )}

                  {/* Proposed Actions */}
                  {result.proposed_actions?.length > 0 && phase !== 'done' && (
                    <div style={{marginBottom:'20px'}}>
                      <div style={{color:'#555', fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'8px'}}>
                        Agent can execute ({result.proposed_actions.length} actions)
                      </div>
                      {result.proposed_actions.map((a, i) => (
                        <div key={i} style={{display:'flex', alignItems:'center', gap:'10px', padding:'8px 0',
                          borderBottom:'1px solid #0f0f0f'}}>
                          <span style={{color:'#22c55e', fontSize:'12px'}}>✓</span>
                          <span style={{color:'#aaa', fontSize:'13px'}}>{a.label}</span>
                          <span style={{color:'#333', fontSize:'11px', marginLeft:'auto'}}>{a.type}</span>
                        </div>
                      ))}
                      <button onClick={handleApply}
                        style={{width:'100%', marginTop:'16px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                          border:'none', color:'#fff', padding:'12px', borderRadius:'10px',
                          cursor:'pointer', fontSize:'14px', fontWeight:'700'}}>
                        ✦ Apply All
                      </button>
                    </div>
                  )}

                  {/* Suggestions */}
                  {result.suggestions?.length > 0 && (
                    <div style={{marginBottom:'20px'}}>
                      <div style={{color:'#555', fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'8px'}}>Suggestions</div>
                      {result.suggestions.map((s, i) => (
                        <div key={i} style={{display:'flex', gap:'8px', padding:'6px 0', color:'#666', fontSize:'13px'}}>
                          <span style={{color:'#333', flexShrink:0}}>▸</span> {s}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* APPLYING */}
          {phase === 'applying' && (
            <div style={{padding:'8px 0'}}>
              <div style={{color:'#555', fontSize:'12px', marginBottom:'16px', textTransform:'uppercase', letterSpacing:'0.08em'}}>Executing...</div>
              {result.proposed_actions?.map((a, i) => (
                <div key={i} style={{display:'flex', alignItems:'center', gap:'10px', padding:'8px 0', color:'#888', fontSize:'13px',
                  animation:`fadeIn ${0.2 + i * 0.1}s ease`}}>
                  <span style={{animation:'pulse 1s infinite', color:'#6366f1'}}>◌</span> {a.label}
                </div>
              ))}
            </div>
          )}

          {/* DONE */}
          {phase === 'done' && applied.length > 0 && (
            <div style={{animation:'fadeIn 0.4s ease', marginTop:'8px'}}>
              <div style={{color:'#555', fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'12px'}}>Executed</div>
              {applied.map((a, i) => (
                <div key={i} style={{color:'#22c55e', fontSize:'13px', padding:'6px 0',
                  borderBottom:'1px solid #0f0f0f', animation:`fadeIn ${0.1 + i * 0.08}s ease`}}>
                  {a}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{padding:'16px 20px', borderTop:'1px solid #141414', flexShrink:0, background:'#0c0c0c'}}>
          {(phase === 'result' || phase === 'done') && (
            <button onClick={handleClear} style={{background:'transparent', border:'none', color:'#333',
              fontSize:'12px', cursor:'pointer', marginBottom:'10px', textDecoration:'underline'}}>
              Clear & start over
            </button>
          )}
          <div style={{background:'#111', border:'1px solid #1e1e1e', borderRadius:'14px', overflow:'hidden'}}>
            <textarea ref={textareaRef} value={message} onChange={e => setMessage(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter' && (e.ctrlKey||e.metaKey)) handleRun(); }}
              placeholder="What do you want the agent to do?"
              rows={3}
              style={{width:'100%', background:'transparent', border:'none', color:'#ccc', fontSize:'13px',
                padding:'14px 16px', outline:'none', resize:'none', lineHeight:'1.6',
                fontFamily:'inherit', boxSizing:'border-box'}}
            />
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'8px 14px', borderTop:'1px solid #161616'}}>
              <span style={{color:'#2a2a2a', fontSize:'11px'}}>Ctrl+Enter to run</span>
              <button onClick={handleRun} disabled={phase==='reading'||phase==='applying'||!message.trim()}
                style={{background: (phase==='reading'||phase==='applying'||!message.trim()) ? '#1a1a1a' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  border:'none', borderRadius:'8px',
                  color: (phase==='reading'||phase==='applying'||!message.trim()) ? '#333' : '#fff',
                  padding:'7px 18px', fontSize:'13px', fontWeight:'700',
                  cursor: (phase==='reading'||phase==='applying'||!message.trim()) ? 'not-allowed' : 'pointer'}}>
                {phase==='reading'||phase==='applying' ? '...' : 'Run ▶'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentPanel;
