import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Boxes, ArrowRight, ShieldCheck } from 'lucide-react';

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

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);
  const [formData, setFormData] = useState({
    company_name: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    domain: '',
    subdomain: '',
    currency: 'USD',
  });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (window.innerWidth / 2);
    const dy = (e.clientY - cy) / (window.innerHeight / 2);
    const max = 7;
    setTilt({
      x: Math.max(-max, Math.min(max, dy * -max)),
      y: Math.max(-max, Math.min(max, dx * max)),
    });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

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
    <div
      className="auth3d-bg"
      style={{ alignItems: 'flex-start', paddingTop: '32px', paddingBottom: '32px' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background blobs */}
      <div className="auth3d-blob auth3d-blob-1" />
      <div className="auth3d-blob auth3d-blob-2" />
      <div className="auth3d-blob auth3d-blob-3" />

      {/* Perspective grid floor */}
      <div className="auth3d-grid" />

      {/* Floating 3D rings */}
      <div className="auth3d-ring auth3d-ring-1" />
      <div className="auth3d-ring auth3d-ring-2" />
      <div className="auth3d-ring auth3d-ring-3" />

      {/* Glowing dots */}
      <div className="auth3d-dot auth3d-dot-1" />
      <div className="auth3d-dot auth3d-dot-2" />
      <div className="auth3d-dot auth3d-dot-3" />
      <div className="auth3d-dot auth3d-dot-4" />
      <div className="auth3d-dot auth3d-dot-5" />
      <div className="auth3d-dot auth3d-dot-6" />

      {/* 3D Card */}
      <div className="auth3d-perspective" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div
          ref={cardRef}
          className="auth3d-card"
          data-testid="signup-card"
          style={{
            width: '100%',
            maxWidth: '500px',
            padding: '40px 40px 36px',
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition:
              tilt.x === 0 && tilt.y === 0
                ? 'transform 0.65s cubic-bezier(0.16,1,0.3,1)'
                : 'transform 0.08s ease-out',
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-7">
            <div className="auth3d-logo">
              <Boxes className="h-5 w-5 text-white" />
            </div>
            <span
              className="font-bold text-[15px] tracking-tight"
              style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'Manrope, sans-serif' }}
            >
              IT Asset Management
            </span>
          </div>

          {/* Heading */}
          <h1
            className="text-[28px] font-bold leading-tight mb-1.5"
            style={{ color: '#fff', fontFamily: 'Manrope, sans-serif' }}
          >
            Create your workspace
          </h1>
          <p className="text-sm mb-7" style={{ color: 'rgba(255,255,255,0.38)' }}>
            14-day free trial. No credit card required.
          </p>

          {/* Google */}
          <button
            type="button"
            className="auth3d-google-btn"
            onClick={handleGoogleSignIn}
            data-testid="google-signin-btn"
          >
            <svg className="mr-2.5 h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign up with Google
          </button>

          <div className="auth3d-divider">
            <span>or sign up with email</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="auth3d-label">Company Name</label>
                <div className="auth3d-field">
                  <input
                    id="company_name"
                    className="auth3d-input no-icon"
                    placeholder="Acme Corporation"
                    value={formData.company_name}
                    onChange={set('company_name')}
                    required
                    data-testid="signup-company-name"
                  />
                </div>
              </div>
              <div>
                <label className="auth3d-label">Company Domain</label>
                <div className="auth3d-field">
                  <input
                    id="domain"
                    className="auth3d-input no-icon"
                    placeholder="acme.com"
                    value={formData.domain}
                    onChange={set('domain')}
                    required
                    data-testid="signup-domain"
                  />
                </div>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="auth3d-label">
                  Subdomain{' '}
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                    (optional)
                  </span>
                </label>
                <div className="auth3d-field">
                  <input
                    id="subdomain"
                    className="auth3d-input no-icon"
                    placeholder="acme"
                    value={formData.subdomain}
                    onChange={(e) =>
                      setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })
                    }
                    data-testid="signup-subdomain"
                  />
                </div>
              </div>
              <div>
                <label className="auth3d-label">Base Currency</label>
                <div className="auth3d-field">
                  <select
                    id="currency"
                    className="auth3d-input no-icon"
                    style={{ appearance: 'none', cursor: 'pointer' }}
                    value={formData.currency}
                    onChange={set('currency')}
                    data-testid="signup-currency"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.value} value={c.value} style={{ background: '#0d0d1a' }}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="auth3d-label">Your Name</label>
                <div className="auth3d-field">
                  <input
                    id="admin_name"
                    className="auth3d-input no-icon"
                    placeholder="John Doe"
                    value={formData.admin_name}
                    onChange={set('admin_name')}
                    required
                    data-testid="signup-admin-name"
                  />
                </div>
              </div>
              <div>
                <label className="auth3d-label">Work Email</label>
                <div className="auth3d-field">
                  <input
                    id="admin_email"
                    type="email"
                    className="auth3d-input no-icon"
                    placeholder="john@acme.com"
                    value={formData.admin_email}
                    onChange={set('admin_email')}
                    required
                    data-testid="signup-admin-email"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="auth3d-label">Password</label>
              <div className="auth3d-field">
                <input
                  id="admin_password"
                  type="password"
                  className="auth3d-input no-icon"
                  placeholder="At least 6 characters"
                  value={formData.admin_password}
                  onChange={set('admin_password')}
                  required
                  minLength={6}
                  data-testid="signup-admin-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth3d-btn"
              data-testid="signup-submit-btn"
            >
              {loading ? (
                'Creating Account…'
              ) : (
                <>
                  Create Free Account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Trust line */}
            <div className="flex items-center justify-center gap-1.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="text-xs">Your data is isolated per company with role-based access</span>
            </div>
          </form>

          <p className="text-center text-sm mt-5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Already have an account?{' '}
            <a
              href="/login"
              className="font-semibold transition-colors"
              style={{ color: 'rgba(129,140,248,0.9)' }}
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
