import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Boxes, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);

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
            Asset Management
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
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>Asset Management</span>
          </div>

          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginBottom: '4px', letterSpacing: '-0.4px' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '28px' }}>
            Sign in to continue to your workspace
          </p>

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
              <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                data-testid="login-password-input"
                style={{
                  width: '100%', padding: '10px 42px 10px 14px',
                  border: '1.5px solid #e2e8f0', borderRadius: '8px',
                  fontSize: '14px', color: '#0f172a',
                  outline: 'none', background: 'white',
                  boxSizing: 'border-box',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748b', display: 'flex' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              </div>
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
