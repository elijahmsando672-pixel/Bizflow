import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#111827', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <Link to="/" style={{ fontSize: 24, fontWeight: 'bold', color: '#2563eb', textDecoration: 'none' }}>BizFlow</Link>
        <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link to="/login" style={{ color: '#374151', textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>
          <Link to="/register" style={{ background: '#2563eb', color: 'white', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>Get Started</Link>
        </nav>
      </header>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 16, lineHeight: 1.2 }}>
          Run Your Entire Business From <span style={{ color: '#2563eb' }}>One Platform</span>
        </h1>
        <p style={{ fontSize: 20, color: '#6b7280', marginBottom: 32, maxWidth: 600, margin: '0 auto 32px' }}>
          POS, Inventory, CRM, Team Management, Analytics, and Multi-Branch Support.
        </p>
        <Link to="/register" style={{ display: 'inline-block', background: '#2563eb', color: 'white', padding: '16px 40px', borderRadius: 12, textDecoration: 'none', fontSize: 16, fontWeight: 600 }}>Start Free Trial</Link>
      </main>
    </div>
  );
}
