import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

function AcceptInvite({ onLogin }) {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const systemName = searchParams.get('system');
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`https://api.structorg.com/api/invite/${token}/`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setInfo(data);
      })
      .catch(() => setError('Invalid invite link'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    const stored = localStorage.getItem('struct_token');
    if (stored) {
      const res = await fetch(`https://api.structorg.com/api/invite/${token}/`, {
        headers: { Authorization: `Token ${stored}` }
      });
      const data = await res.json();
      if (data.success) {
        if (systemName) navigate(`/s/${encodeURIComponent(systemName)}`);
        else navigate('/');
      }
    } else {
      const redirect = systemName ? `/s/${encodeURIComponent(systemName)}` : '/';
      navigate(`/login?invite=${token}&redirect=${encodeURIComponent(redirect)}`);
    }
  };

  if (loading) return <div className="auth-container"><div className="auth-form">Loading...</div></div>;
  if (error) return <div className="auth-container"><div className="auth-form"><h2>Invalid Link</h2><p style={{color:'#888'}}>{error}</p></div></div>;

  return (
    <div className="auth-container">
      <div className="auth-form">
        <div style={{textAlign:'center', marginBottom:'32px'}}>
          <div style={{fontSize:'28px', fontWeight:'700', marginBottom:'8px'}}>STRUCT</div>
          <h2 style={{fontSize:'20px', fontWeight:'600', marginBottom:'8px'}}>You're invited!</h2>
          <p style={{color:'#888', fontSize:'14px', marginBottom:'8px'}}>
            Join <strong style={{color:'#fff'}}>{info?.workspace_name}</strong> as <strong style={{color:'#fff'}}>{info?.role}</strong>
          </p>
          {systemName && (
            <p style={{color:'#555', fontSize:'13px'}}>
              You'll be taken to <strong style={{color:'#888'}}>{systemName}</strong>
            </p>
          )}
        </div>
        <button onClick={handleAccept}
          style={{width:'100%', background:'#fff', color:'#000', border:'none', padding:'12px',
            borderRadius:'8px', fontSize:'14px', fontWeight:'700', cursor:'pointer'}}>
          Accept Invitation
        </button>
        <p style={{color:'#555', fontSize:'12px', textAlign:'center', marginTop:'16px'}}>{info?.email}</p>
      </div>
    </div>
  );
}

export default AcceptInvite;
