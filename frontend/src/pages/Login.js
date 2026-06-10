import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { toast } from 'sonner';
import { Boxes, Mail, Lock, ArrowRight, Laptop, CheckCircle2, TrendingUp } from 'lucide-react';

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
    <div className="min-h-screen flex bg-white">
      {/* ── Left: form ─────────────────────────────── */}
      <div className="flex-1 flex flex-col px-6 sm:px-12 py-8">
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
          <div className="w-full max-w-[400px]" data-testid="login-card">
            <div className="stagger-in" style={{ animationDelay: '60ms' }}>
              <h1 className="text-[32px] leading-tight font-bold font-heading tracking-tight text-slate-900 mb-2">
                Welcome back
              </h1>
              <p className="text-[15px] text-slate-500 mb-8">
                Sign in to continue to your workspace.
              </p>
            </div>

            <div className="stagger-in" style={{ animationDelay: '120ms' }}>
              <GoogleSignInButton className="h-11 !rounded-[10px] !border-slate-200 !text-slate-700 hover:!bg-slate-50" />

              <div className="relative my-7 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-400">or sign in with email</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 stagger-in" style={{ animationDelay: '180ms' }}>
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-[13px] font-semibold text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    className="auth-input-light"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="login-email-input"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-[13px] font-semibold text-slate-700">Password</label>
                  <a href="/forgot-password" className="text-[13px] text-indigo-600 hover:text-indigo-700 font-medium" data-testid="forgot-password-link">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400 pointer-events-none" />
                  <input
                    id="password"
                    type="password"
                    className="auth-input-light"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    data-testid="login-password-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-btn-primary w-full h-12 rounded-[10px] text-[15px] font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                data-testid="login-submit-btn"
              >
                {loading ? 'Signing in…' : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500 stagger-in" style={{ animationDelay: '240ms' }}>
              Don't have an account?{' '}
              <a href="/signup" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                Start your free trial
              </a>
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400 animate-fade-in">
          © {new Date().getFullYear()} IT Asset Management
        </p>
      </div>

      {/* ── Right: inset visual panel ──────────────── */}
      <div className="hidden lg:block lg:w-[48%] xl:w-[52%] p-4">
        <div className="auth-panel auth-noise relative h-full w-full rounded-[28px] overflow-hidden flex flex-col justify-between p-10">
          {/* Headline */}
          <div className="relative z-10 max-w-md animate-fade-in">
            <h2 className="text-3xl xl:text-4xl font-bold font-heading text-white leading-[1.15] mb-4">
              Every asset.
              <br />
              One source of truth.
            </h2>
            <p className="text-[15px] text-white/60 leading-relaxed">
              Track hardware, software and licenses across your entire company — from purchase to retirement.
            </p>
          </div>

          {/* Floating glass tiles */}
          <div className="relative z-10 flex-1 flex items-center justify-center py-8">
            <div className="relative w-full max-w-sm h-64">
              {/* Stat tile */}
              <div className="glass-tile auth-float absolute top-0 left-0 rounded-2xl p-5 w-56" style={{ '--tilt': '-3deg' }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center">
                    <Laptop className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[13px] font-medium text-white/70">Total Assets</span>
                </div>
                <p className="text-3xl font-bold font-heading text-white tabular-nums">1,248</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="text-xs text-emerald-300 font-medium">+12% this quarter</span>
                </div>
              </div>

              {/* Activity tile */}
              <div className="glass-tile auth-float absolute bottom-0 right-0 rounded-2xl p-4 w-64" style={{ '--tilt': '2deg', animationDelay: '-3.5s' }}>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-emerald-400/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate">MacBook Pro M3 assigned</p>
                    <p className="text-xs text-white/50">to Priya Sharma · just now</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="relative z-10 animate-fade-in">
            <p className="text-[15px] text-white/85 leading-relaxed mb-3 max-w-md">
              "We replaced three spreadsheets and a shared inbox with this. Asset audits went from two weeks to one afternoon."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-[12px] font-bold text-white">
                RK
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white">Rahul Krishnan</p>
                <p className="text-xs text-white/50">IT Manager, 400-person company</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
