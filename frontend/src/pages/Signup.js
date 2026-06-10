import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { toast } from 'sonner';
import { Boxes, ArrowRight, CheckCircle2 } from 'lucide-react';

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

  const SectionLabel = ({ step, title }) => (
    <div className="flex items-center gap-3">
      <div className="h-6 w-6 rounded-md bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center text-[11px] font-bold text-indigo-300">
        {step}
      </div>
      <h3 className="text-[13px] font-semibold text-white/80 uppercase tracking-wider">{title}</h3>
      <div className="h-px flex-1 bg-white/[0.07]" />
    </div>
  );

  return (
    <div className="auth-canvas auth-noise auth-grid min-h-screen flex flex-col items-center justify-center p-4 py-10">
      {/* Aurora blobs */}
      <div className="auth-blob h-[34rem] w-[34rem] bg-indigo-600/40 -top-40 -right-40" />
      <div className="auth-blob h-[28rem] w-[28rem] bg-violet-600/30 -bottom-32 -left-24" style={{ animationDelay: '-6s' }} />
      <div className="auth-blob h-72 w-72 bg-cyan-500/20 top-1/4 left-1/4" style={{ animationDelay: '-12s' }} />

      {/* Brand */}
      <div className="relative flex flex-col items-center mb-8 animate-fade-in">
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-2xl bg-indigo-500/40 blur-xl" />
          <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl ring-1 ring-white/20">
            <Boxes className="h-7 w-7 text-white" />
          </div>
        </div>
        <h1 className="text-xl font-bold font-heading tracking-tight text-white">
          IT Asset <span className="text-gradient-brand">Management</span>
        </h1>
        <p className="text-[13px] text-white/40 mt-1">Start tracking your assets in minutes</p>
      </div>

      {/* Glass card */}
      <div className="relative w-full max-w-xl stagger-in" style={{ animationDelay: '100ms' }} data-testid="signup-card">
        <div className="gradient-ring rounded-2xl p-px">
          <div className="glass-card rounded-2xl p-7 md:p-8">
            <h2 className="text-lg font-semibold font-heading text-white mb-1">Create your workspace</h2>
            <p className="text-sm text-white/40 mb-6">Free trial — no credit card required</p>

            <GoogleSignInButton text="Sign up with Google" className="!bg-white/5 !border-white/10 !text-white hover:!bg-white/10 hover:!text-white h-11" />

            <div className="relative my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[11px] uppercase tracking-wider text-white/30">or sign up with email</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">
              {/* Company Information */}
              <div className="space-y-4">
                <SectionLabel step="1" title="Company" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="company_name" className="text-[13px] font-medium text-white/70">Company Name *</label>
                    <input
                      id="company_name"
                      className="auth-input"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="Acme Corporation"
                      required
                      data-testid="signup-company-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="domain" className="text-[13px] font-medium text-white/70">Company Domain *</label>
                    <input
                      id="domain"
                      className="auth-input"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      placeholder="acme.com"
                      required
                      data-testid="signup-domain"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="subdomain" className="text-[13px] font-medium text-white/70">Subdomain <span className="text-white/30">(optional)</span></label>
                    <div className="flex items-center gap-2">
                      <input
                        id="subdomain"
                        className="auth-input"
                        value={formData.subdomain}
                        onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
                        placeholder="acme"
                        data-testid="signup-subdomain"
                      />
                      <span className="text-sm text-white/30 whitespace-nowrap">.yourapp.com</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="currency" className="text-[13px] font-medium text-white/70">Base Currency *</label>
                    <select
                      id="currency"
                      className="auth-input appearance-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      data-testid="signup-currency"
                    >
                      {CURRENCIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Admin Account */}
              <div className="space-y-4">
                <SectionLabel step="2" title="Your Account" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="admin_name" className="text-[13px] font-medium text-white/70">Your Name *</label>
                    <input
                      id="admin_name"
                      className="auth-input"
                      value={formData.admin_name}
                      onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                      placeholder="John Doe"
                      required
                      data-testid="signup-admin-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="admin_email" className="text-[13px] font-medium text-white/70">Email Address *</label>
                    <input
                      id="admin_email"
                      type="email"
                      className="auth-input"
                      value={formData.admin_email}
                      onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                      placeholder="john@acme.com"
                      required
                      data-testid="signup-admin-email"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="admin_password" className="text-[13px] font-medium text-white/70">Password *</label>
                  <input
                    id="admin_password"
                    type="password"
                    className="auth-input"
                    value={formData.admin_password}
                    onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    data-testid="signup-admin-password"
                  />
                  <p className="text-xs text-white/30">Minimum 6 characters</p>
                </div>
              </div>

              {/* Trial features */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-3">
                  Included in your free trial
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {TRIAL_FEATURES.map((feature) => (
                    <div key={feature} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span className="text-[13px] text-white/60">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-btn-primary w-full h-11 rounded-lg text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="signup-submit-btn"
              >
                {loading ? 'Creating Account…' : (
                  <>
                    Create Free Account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <p className="relative mt-6 text-sm text-white/40 stagger-in" style={{ animationDelay: '200ms' }}>
        Already have an account?{' '}
        <a href="/login" className="text-indigo-300 hover:text-indigo-200 font-medium transition-colors">
          Sign in
        </a>
      </p>

      <p className="relative mt-8 text-[11px] text-white/25">
        © {new Date().getFullYear()} IT Asset Management. All rights reserved.
      </p>
    </div>
  );
};

export default Signup;
