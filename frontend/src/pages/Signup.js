import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Boxes, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'AED', label: 'AED — UAE Dirham' },
  { value: 'SAR', label: 'SAR — Saudi Riyal' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
];

const PERKS = [
  '14-day free trial — no credit card required',
  'Unlimited assets & users during trial',
  'Role-based access control built in',
  'Data isolated per company with full audit trail',
];

const inputStyle = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #e2e8f0', borderRadius: '8px',
  fontSize: '14px', color: '#0f172a',
  outline: 'none', background: 'white',
  boxSizing: 'border-box',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  fontFamily: 'inherit',
};

const labelStyle = {
  display: 'block', fontSize: '13px', fontWeight: 600,
  color: '#374151', marginBottom: '6px',
};

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    domain: '',
    subdomain: '',
    currency: 'USD',
  });

  const set = (key) => (e) => setFormData({ ...formData, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/auth/signup`, null, {
        params: {
          company_name: formData.company_name,
          admin_name: formData.admin_name,
          admin_email: formData.admin_email,
          admin_password: formData.admin_password,
          domain: formData.domain,
          subdomain: formData.subdomain || '',
          currency: formData.currency,
        },
      });
      toast.success('Account created! Please login.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      const detail = error.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((e) => e.msg || JSON.stringify(e)).join(', ')
        : typeof detail === 'string'
        ? detail
        : 'Signup failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
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
        width: '40%',
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

        {/* Accent glow */}
        <div style={{
          position: 'absolute', left: '-100px', bottom: '-100px',
          width: '350px', height: '350px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '42px', height: '42px', background: '#2563eb',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
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
            borderRadius: '20px', padding: '4px 14px', marginBottom: '20px',
          }}>
            <span style={{ color: '#93c5fd', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>
              FREE 14-DAY TRIAL
            </span>
          </div>

          <h2 style={{
            color: 'white', fontSize: '32px', fontWeight: 800,
            lineHeight: 1.2, marginBottom: '14px', letterSpacing: '-0.5px',
          }}>
            Set up your IT asset<br />registry in minutes.
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.55)', fontSize: '15px',
            lineHeight: 1.65, marginBottom: '36px', maxWidth: '320px',
          }}>
            Everything your IT team needs to track hardware, licenses,
            warranties, and vendors — all in one place.
          </p>

          {/* Perks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {PERKS.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <CheckCircle2 size={16} color="#60a5fa" style={{ flexShrink: 0, marginTop: '1px' }} />
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: 1.4 }}>{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trust badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          position: 'relative', zIndex: 1,
          borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px',
        }}>
          <ShieldCheck size={16} color="rgba(255,255,255,0.4)" />
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
            Your data is isolated per company with role-based access control
          </span>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        background: '#f8fafc', padding: '48px 24px', overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: '520px' }}>

          {/* Mobile logo */}
          <div className="flex lg:hidden" style={{ alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
            <div style={{ width: '36px', height: '36px', background: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Boxes size={18} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>IT Asset Management</span>
          </div>

          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginBottom: '4px', letterSpacing: '-0.4px' }}>
            Create your workspace
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '28px' }}>
            14-day free trial · No credit card required
          </p>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            data-testid="google-signin-btn"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              padding: '11px 16px', border: '1.5px solid #e2e8f0', borderRadius: '10px',
              background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: '#334155',
              marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', boxSizing: 'border-box',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign up with Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>or sign up with email</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {/* Row 1 — Company + Domain */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Company Name</label>
                <input
                  id="company_name" className="auth-input" placeholder="Acme Corporation"
                  value={formData.company_name} onChange={set('company_name')}
                  required data-testid="signup-company-name" style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Company Domain</label>
                <input
                  id="domain" placeholder="acme.com"
                  value={formData.domain} onChange={set('domain')}
                  required data-testid="signup-domain" style={inputStyle}
                />
              </div>
            </div>

            {/* Row 2 — Subdomain + Currency */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>
                  Subdomain{' '}
                  <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '12px' }}>(optional)</span>
                </label>
                <input
                  id="subdomain" placeholder="acme"
                  value={formData.subdomain}
                  onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
                  data-testid="signup-subdomain" style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Base Currency</label>
                <select
                  id="currency" value={formData.currency} onChange={set('currency')}
                  data-testid="signup-currency"
                  style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3 — Name + Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Your Name</label>
                <input
                  id="admin_name" placeholder="John Doe"
                  value={formData.admin_name} onChange={set('admin_name')}
                  required data-testid="signup-admin-name" style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Work Email</label>
                <input
                  id="admin_email" type="email" placeholder="john@acme.com"
                  value={formData.admin_email} onChange={set('admin_email')}
                  required data-testid="signup-admin-email" style={inputStyle}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Password</label>
              <input
                id="admin_password" type="password" placeholder="At least 6 characters"
                value={formData.admin_password} onChange={set('admin_password')}
                required minLength={6} data-testid="signup-admin-password" style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              data-testid="signup-submit-btn"
              style={{
                width: '100%', padding: '11px',
                background: loading ? '#93c5fd' : '#2563eb',
                color: 'white', border: 'none', borderRadius: '10px',
                fontSize: '15px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(37,99,235,0.3)',
                boxSizing: 'border-box', marginBottom: '12px',
              }}
            >
              {loading ? 'Creating Account…' : (<>Create Free Account <ArrowRight size={16} /></>)}
            </button>

            <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
              By signing up you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#64748b', marginTop: '20px' }}>
            Already have an account?{' '}
            <a href="/login" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
