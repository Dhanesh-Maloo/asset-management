import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { toast } from 'sonner';
import { Boxes, ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TRIAL_FEATURES = [
  'Product Catalog',
  'Order Management',
  'Asset Tracking',
  'Helpdesk Tickets',
  '5 Users',
  'Basic Support'
];

const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'AED', label: 'AED — UAE Dirham' },
  { value: 'SAR', label: 'SAR — Saudi Riyal' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
];

const Field = ({ id, label, children, optional }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="text-[13px] font-semibold text-slate-700">
      {label} {optional && <span className="text-slate-400 font-normal">(optional)</span>}
    </label>
    {children}
  </div>
);

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
    currency: 'USD'
  });

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
      toast.success('Account created successfully! Please login.');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
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

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── Left: form ─────────────────────────────── */}
      <div className="flex-1 flex flex-col px-6 sm:px-12 py-8 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-2.5 animate-fade-in">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Boxes className="h-5 w-5 text-white" />
          </div>
          <span className="text-[15px] font-bold font-heading tracking-tight text-slate-900">
            IT Asset Management
          </span>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-full max-w-[440px]" data-testid="signup-card">
            <div className="stagger-in" style={{ animationDelay: '60ms' }}>
              <h1 className="text-[32px] leading-tight font-bold font-heading tracking-tight text-slate-900 mb-2">
                Create your workspace
              </h1>
              <p className="text-[15px] text-slate-500 mb-8">
                14-day free trial. No credit card required.
              </p>
            </div>

            <div className="stagger-in" style={{ animationDelay: '120ms' }}>
              <GoogleSignInButton text="Sign up with Google" className="h-11 !rounded-[10px] !border-slate-200 !text-slate-700 hover:!bg-slate-50" />

              <div className="relative my-7 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-400">or sign up with email</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 stagger-in" style={{ animationDelay: '180ms' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="company_name" label="Company Name">
                  <input
                    id="company_name"
                    className="auth-input-light no-icon"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Acme Corporation"
                    required
                    data-testid="signup-company-name"
                  />
                </Field>
                <Field id="domain" label="Company Domain">
                  <input
                    id="domain"
                    className="auth-input-light no-icon"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    placeholder="acme.com"
                    required
                    data-testid="signup-domain"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="subdomain" label="Subdomain" optional>
                  <div className="flex items-center gap-2">
                    <input
                      id="subdomain"
                      className="auth-input-light no-icon"
                      value={formData.subdomain}
                      onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
                      placeholder="acme"
                      data-testid="signup-subdomain"
                    />
                  </div>
                </Field>
                <Field id="currency" label="Base Currency">
                  <select
                    id="currency"
                    className="auth-input-light no-icon appearance-none cursor-pointer"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    data-testid="signup-currency"
                  >
                    {CURRENCIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="admin_name" label="Your Name">
                  <input
                    id="admin_name"
                    className="auth-input-light no-icon"
                    value={formData.admin_name}
                    onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                    placeholder="John Doe"
                    required
                    data-testid="signup-admin-name"
                  />
                </Field>
                <Field id="admin_email" label="Work Email">
                  <input
                    id="admin_email"
                    type="email"
                    className="auth-input-light no-icon"
                    value={formData.admin_email}
                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                    placeholder="john@acme.com"
                    required
                    data-testid="signup-admin-email"
                  />
                </Field>
              </div>

              <Field id="admin_password" label="Password">
                <input
                  id="admin_password"
                  type="password"
                  className="auth-input-light no-icon"
                  value={formData.admin_password}
                  onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  data-testid="signup-admin-password"
                />
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="auth-btn-primary w-full h-12 rounded-[10px] text-[15px] font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                data-testid="signup-submit-btn"
              >
                {loading ? 'Creating Account…' : (
                  <>
                    Create Free Account
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>

              <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                Your data is isolated per company with role-based access
              </p>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500 stagger-in" style={{ animationDelay: '240ms' }}>
              Already have an account?{' '}
              <a href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                Sign in
              </a>
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400 animate-fade-in">
          © {new Date().getFullYear()} IT Asset Management
        </p>
      </div>

      {/* ── Right: inset visual panel ──────────────── */}
      <div className="hidden lg:block lg:w-[44%] xl:w-[46%] p-4">
        <div className="auth-panel auth-noise relative h-full w-full rounded-[28px] overflow-hidden flex flex-col justify-between p-10">
          {/* Headline */}
          <div className="relative z-10 max-w-md animate-fade-in">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-white/80 mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              Free 14-day trial
            </div>
            <h2 className="text-3xl xl:text-4xl font-bold font-heading text-white leading-[1.15] mb-4">
              Start tracking in minutes,
              <br />
              not months.
            </h2>
            <p className="text-[15px] text-white/60 leading-relaxed">
              Set up your company workspace, import your assets, and invite your team — all before lunch.
            </p>
          </div>

          {/* Floating feature tile */}
          <div className="relative z-10 flex-1 flex items-center justify-center py-8">
            <div className="glass-tile auth-float rounded-2xl p-6 w-full max-w-sm" style={{ '--tilt': '-1.5deg' }}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-4">
                Everything in your trial
              </p>
              <div className="grid grid-cols-2 gap-3">
                {TRIAL_FEATURES.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
                    <span className="text-[13px] text-white/85">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trust line */}
          <div className="relative z-10 flex items-center gap-3 animate-fade-in">
            <div className="flex -space-x-2">
              {['AK', 'SR', 'MJ'].map((init) => (
                <div key={init} className="h-8 w-8 rounded-full bg-white/15 border-2 border-white/25 flex items-center justify-center text-[10px] font-bold text-white">
                  {init}
                </div>
              ))}
            </div>
            <p className="text-[13px] text-white/60">
              Join teams managing thousands of assets every day
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
