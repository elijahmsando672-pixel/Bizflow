import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !password) { setError('Please fill in all fields'); return; }
    localStorage.setItem('token', 'demo-token');
    navigate('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fb', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: 'white', padding: 40, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: 420 }}>
        <Link to="/" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14, display: 'block', marginBottom: 24 }}>&larr; Back to Home</Link>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>Register Your Business</h1>
        <p style={{ color: '#6b7280', marginBottom: 24, fontSize: 14 }}>Create your account to get started</p>
        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, outline: 'none' }} placeholder="Elijah Msando" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, outline: 'none' }} placeholder="you@example.com" />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, outline: 'none' }} placeholder="••••••••" />
          </div>
          <button type="submit" style={{ width: '100%', padding: '14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Create Account</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#6b7280' }}>Already have an account? <Link to="/login" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link></p>
      </div>
    </div>
  );
}
