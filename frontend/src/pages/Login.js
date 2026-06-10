import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { toast } from 'sonner';
import { Boxes, ShieldCheck, Layers, LineChart } from 'lucide-react';

const TRUST_CHIPS = [
  { icon: Layers, label: 'Multi-tenant' },
  { icon: ShieldCheck, label: 'Role-based access' },
  { icon: LineChart, label: 'Full audit trail' },
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

  return (
    <div className="auth-canvas auth-noise auth-grid min-h-screen flex flex-col items-center justify-center p-4">
      {/* Aurora blobs */}
      <div className="auth-blob h-[34rem] w-[34rem] bg-indigo-600/40 -top-40 -left-40" />
      <div className="auth-blob h-[28rem] w-[28rem] bg-violet-600/30 -bottom-32 -right-24" style={{ animationDelay: '-6s' }} />
      <div className="auth-blob h-72 w-72 bg-cyan-500/20 top-1/3 right-1/4" style={{ animationDelay: '-12s' }} />

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
        <p className="text-[13px] text-white/40 mt-1">Every asset. One source of truth.</p>
      </div>

      {/* Glass card with gradient ring */}
      <div className="relative w-full max-w-sm stagger-in" style={{ animationDelay: '100ms' }} data-testid="login-card">
        <div className="gradient-ring rounded-2xl p-px">
          <div className="glass-card rounded-2xl p-7">
            <h2 className="text-lg font-semibold font-heading text-white mb-1">Welcome back</h2>
            <p className="text-sm text-white/40 mb-6">Sign in to your workspace</p>

            <GoogleSignInButton className="!bg-white/5 !border-white/10 !text-white hover:!bg-white/10 hover:!text-white h-11" />

            <div className="relative my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[11px] uppercase tracking-wider text-white/30">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-[13px] font-medium text-white/70">Email</label>
                <input
                  id="email"
                  type="email"
                  className="auth-input"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  data-testid="login-email-input"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-[13px] font-medium text-white/70">Password</label>
                  <a href="/forgot-password" className="text-xs text-indigo-300/80 hover:text-indigo-200 transition-colors" data-testid="forgot-password-link">
                    Forgot password?
                  </a>
                </div>
                <input
                  id="password"
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  data-testid="login-password-input"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="auth-btn-primary w-full h-11 rounded-lg text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
                data-testid="login-submit-btn"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Signup link */}
      <p className="relative mt-6 text-sm text-white/40 stagger-in" style={{ animationDelay: '200ms' }}>
        Don't have an account?{' '}
        <a href="/signup" className="text-indigo-300 hover:text-indigo-200 font-medium transition-colors">
          Start your free trial
        </a>
      </p>

      {/* Trust chips */}
      <div className="relative flex items-center gap-2 mt-8 flex-wrap justify-center stagger-in" style={{ animationDelay: '300ms' }}>
        {TRUST_CHIPS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[12px] text-white/50">
            <Icon className="h-3.5 w-3.5 text-indigo-300/70" />
            {label}
          </div>
        ))}
      </div>

      <p className="relative mt-10 text-[11px] text-white/25">
        © {new Date().getFullYear()} IT Asset Management. All rights reserved.
      </p>
    </div>
  );
};

export default Login;
