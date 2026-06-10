import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { Boxes, Laptop, ShieldCheck, BarChart3 } from 'lucide-react';

const HIGHLIGHTS = [
  { icon: Laptop, text: 'Track every laptop, server and license in one place' },
  { icon: ShieldCheck, text: 'Role-based access with full audit trail' },
  { icon: BarChart3, text: 'Reports and analytics that keep you compliant' },
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
    <div className="min-h-screen flex bg-background">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-[44%] bg-sidebar text-sidebar-foreground flex-col justify-between p-10 relative overflow-hidden">
        {/* Subtle glow accents */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <Boxes className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold font-heading text-white">IT Asset Management</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-3xl xl:text-4xl font-bold font-heading text-white leading-tight mb-4">
            Every asset.
            <br />
            One source of truth.
          </h1>
          <p className="text-sm text-sidebar-foreground/80 leading-relaxed mb-8">
            Manage your company's hardware, software and licenses — from purchase to retirement.
          </p>
          <div className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-sidebar-foreground/90">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-sidebar-muted">
          © {new Date().getFullYear()} IT Asset Management. All rights reserved.
        </p>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-in" data-testid="login-card">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Boxes className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold font-heading">IT Asset Management</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold font-heading tracking-tight mb-1.5">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to manage your IT assets</p>
          </div>

          <GoogleSignInButton />

          <div className="relative my-6">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="login-email-input"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="/forgot-password" className="text-xs text-primary hover:underline font-medium" data-testid="forgot-password-link">
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                data-testid="login-password-input"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-testid="login-submit-btn"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <a href="/signup" className="text-primary hover:underline font-medium">
              Sign up for free
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
