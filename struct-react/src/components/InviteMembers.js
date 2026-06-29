import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

function InviteMembers({ workspace, systemName, systemId, showToast, onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    if (workspace) loadMembers();
  }, [workspace]);

  const loadMembers = async () => {
    try {
      const data = await api.listMembers(workspace.id, systemId);
      setMembers(Array.isArray(data) ? data : []);
    } catch {}
  };

  const handleInvite = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const data = await api.inviteMember(workspace.id, email.trim(), role, systemName, systemId);
      setInviteLink(data.invite_link);
      showToast(`Invite sent to ${email}`);
      setEmail('');
      loadMembers();
    } catch (err) {
      showToast(err.message || 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  const roleColors = { admin: '#ef4444', member: '#3b82f6', view: '#22c55e' };

  return (
    <div style={{padding:'8px 0'}}>
      <div style={{marginBottom:'24px'}}>
        <div style={{color:'#666', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'16px'}}>
          Invite to workspace
        </div>

        <div style={{display:'flex', gap:'8px', marginBottom:'12px'}}>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleInvite()}
            placeholder="name@company.com"
            style={{flex:1, background:'#0d0d0d', color:'#fff', border:'1px solid #2a2a2a',
              padding:'10px 12px', borderRadius:'8px', fontSize:'14px', outline:'none'}}
          />
          <select value={role} onChange={e => setRole(e.target.value)}
            style={{background:'#0d0d0d', color:'#fff', border:'1px solid #2a2a2a',
              padding:'10px 12px', borderRadius:'8px', fontSize:'14px', outline:'none', cursor:'pointer'}}>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="view">View only</option>
          </select>
          <button onClick={handleInvite} disabled={loading || !email.trim()}
            style={{background:'#fff', color:'#000', border:'none', padding:'10px 20px',
              borderRadius:'8px', fontSize:'14px', fontWeight:'700', cursor:'pointer',
              opacity: loading || !email.trim() ? 0.5 : 1}}>
            {loading ? '...' : 'Invite'}
          </button>
        </div>

        <div style={{color:'#555', fontSize:'12px', lineHeight:'1.6'}}>
          <strong style={{color:'#888'}}>Admin</strong> — full access, can invite others<br/>
          <strong style={{color:'#888'}}>Member</strong> — can edit records and tables<br/>
          <strong style={{color:'#888'}}>View only</strong> — read-only, no editing
        </div>
      </div>

      {inviteLink && (
        <div style={{background:'#0f0f0f', border:'1px solid #22c55e33', borderRadius:'8px', padding:'12px 16px', marginBottom:'20px'}}>
          <div style={{color:'#22c55e', fontSize:'12px', marginBottom:'6px'}}>✓ Invite link generated</div>
          <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
            <input readOnly value={inviteLink}
              style={{flex:1, background:'#111', color:'#888', border:'1px solid #222',
                padding:'8px 12px', borderRadius:'6px', fontSize:'12px', outline:'none'}}
            />
            <button onClick={() => { navigator.clipboard.writeText(inviteLink); showToast('Link copied!'); }}
              style={{background:'#111', color:'#ccc', border:'1px solid #2a2a2a', padding:'8px 14px',
                borderRadius:'6px', fontSize:'12px', cursor:'pointer'}}>
              Copy
            </button>
          </div>
        </div>
      )}

      {members.length > 0 && (
        <div>
          <div style={{color:'#666', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'12px'}}>
            Current members ({members.length})
          </div>
          {members.map((m, i) => (
            <div key={i} style={{display:'flex', alignItems:'center', gap:'12px', padding:'10px 0',
              borderBottom:'1px solid #111'}}>
              <div style={{width:'32px', height:'32px', borderRadius:'50%', background:'#1a1a2e',
                display:'flex', alignItems:'center', justifyContent:'center', color:'#888', fontSize:'13px', fontWeight:'600'}}>
                {(m.name || m.email)[0].toUpperCase()}
              </div>
              <div style={{flex:1}}>
                <div style={{color:'#ccc', fontSize:'14px'}}>{m.name || m.email}</div>
                {m.name && <div style={{color:'#555', fontSize:'12px'}}>{m.email}</div>}
              </div>
              <span style={{background: roleColors[m.role]+'18', color: roleColors[m.role],
                border:'1px solid '+roleColors[m.role]+'33',
                padding:'3px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'500'}}>
                {m.role}
              </span>
              <span style={{fontSize:'11px', color: m.accepted ? '#22c55e' : '#f59e0b'}}>
                {m.accepted ? '✓ Accepted' : '⏳ Pending'}
              </span>
            </div>
          ))}
        </div>
      )}

      {members.length === 0 && (
        <div style={{color:'#555', fontSize:'13px', textAlign:'center', padding:'20px 0'}}>
          No members yet. Invite someone to collaborate.
        </div>
      )}
    </div>
  );
}

export default InviteMembers;
