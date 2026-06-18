import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Boxes, ArrowRight, CheckCircle2 } from 'lucide-react';

const FEATURES = [
  'Track assets from purchase to disposal',
  'Automated warranty & maintenance alerts',
  'Role-based access for your entire team',
  'Real-time reports & depreciation tracking',
];

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(formData.email, formData.password);
    if (result.success) {
      toast.success('Login successful!');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Login failed');
    }
    setLoading(false);
  };

  const handleGoogleSignIn = () => {
    const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!googleClientId) return;
    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: window.location.origin + '/auth/callback',
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Left Panel ── */}
      <div style={{
        width: '44%',
        background: 'linear-gradient(160deg, #0f2444 0%, #1a3d6e 60%, #0f2444 100%)',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 52px',
        position: 'relative',
        overflow: 'hidden',
      }} className="hidden lg:flex">

        {/* Dot grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        {/* Accent circle */}
        <div style={{
          position: 'absolute', right: '-80px', top: '-80px',
          width: '320px', height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '42px', height: '42px',
            background: '#2563eb',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
          }}>
            <Boxes size={20} color="white" />
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '16px', letterSpacing: '-0.3px' }}>
            IT Asset Management
          </span>
        </div>

        {/* Hero copy */}
        <div style={{ marginTop: 'auto', marginBottom: 'auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(37,99,235,0.2)',
            border: '1px solid rgba(37,99,235,0.4)',
            borderRadius: '20px',
            padding: '4px 14px',
            marginBottom: '20px',
          }}>
            <span style={{ color: '#93c5fd', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>
              ENTERPRISE ASSET PLATFORM
            </span>
          </div>

          <h2 style={{
            color: 'white',
            fontSize: '34px',
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: '16px',
            letterSpacing: '-0.5px',
          }}>
            Track every asset.<br />Always in control.
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: '15px',
            lineHeight: 1.65,
            marginBottom: '36px',
            maxWidth: '340px',
          }}>
            One platform to manage hardware, software licenses, warranties,
            and your entire IT inventory — from purchase to disposal.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={16} color="#60a5fa" style={{ flexShrink: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: '32px',
          position: 'relative', zIndex: 1,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: '24px',
        }}>
          {[
            { n: '10k+', label: 'Assets tracked' },
            { n: '500+', label: 'Companies' },
            { n: '99.9%', label: 'Uptime SLA' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ color: 'white', fontWeight: 800, fontSize: '20px' }}>{s.n}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '48px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Mobile logo */}
          <div className="flex lg:hidden" style={{ alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
            <div style={{ width: '36px', height: '36px', background: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Boxes size={18} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>IT Asset Management</span>
          </div>

          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginBottom: '4px', letterSpacing: '-0.4px' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '28px' }}>
            Sign in to continue to your workspace
          </p>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            data-testid="google-signin-btn"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '11px 16px',
              border: '1.5px solid #e2e8f0',
              borderRadius: '10px',
              background: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: '#334155',
              marginBottom: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              transition: 'border-color 0.15s',
              boxSizing: 'border-box',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>or sign in with email</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="login-email-input"
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '1.5px solid #e2e8f0', borderRadius: '8px',
                  fontSize: '14px', color: '#0f172a',
                  outline: 'none', background: 'white',
                  boxSizing: 'border-box',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Password</label>
                <a
                  href="/forgot-password"
                  data-testid="forgot-password-link"
                  style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}
                >
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                data-testid="login-password-input"
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '1.5px solid #e2e8f0', borderRadius: '8px',
                  fontSize: '14px', color: '#0f172a',
                  outline: 'none', background: 'white',
                  boxSizing: 'border-box',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              data-testid="login-submit-btn"
              style={{
                width: '100%', padding: '11px',
                background: loading ? '#93c5fd' : '#2563eb',
                color: 'white', border: 'none',
                borderRadius: '10px', fontSize: '15px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(37,99,235,0.3)',
                transition: 'background 0.15s, box-shadow 0.15s',
                boxSizing: 'border-box',
              }}
            >
              {loading ? 'Signing in…' : (<>Sign In <ArrowRight size={16} /></>)}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#64748b', marginTop: '20px' }}>
            Don't have an account?{' '}
            <a href="/signup" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
              Start your free trial
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
