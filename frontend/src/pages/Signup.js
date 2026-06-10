import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
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
    <div className="min-h-screen flex bg-background">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-[40%] bg-sidebar text-sidebar-foreground flex-col justify-between p-10 relative overflow-hidden">
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
            Start tracking your assets in minutes.
          </h1>
          <p className="text-sm text-sidebar-foreground/80 leading-relaxed mb-8">
            No credit card required. Set up your company workspace and invite your team today.
          </p>
          <div className="rounded-lg bg-white/5 border border-white/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-sidebar-muted mb-3">
              Included in your free trial
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {TRIAL_FEATURES.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-sm text-sidebar-foreground/90">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="relative text-xs text-sidebar-muted">
          © {new Date().getFullYear()} IT Asset Management. All rights reserved.
        </p>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-lg py-8 animate-fade-in" data-testid="signup-card">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Boxes className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold font-heading">IT Asset Management</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold font-heading tracking-tight mb-1.5">Start your free trial</h2>
            <p className="text-sm text-muted-foreground">Create your company workspace in seconds</p>
          </div>

          <GoogleSignInButton text="Sign up with Google" />

          <div className="relative my-6">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">or sign up with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Company Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 text-primary rounded-md h-6 w-6 flex items-center justify-center text-xs font-bold">1</div>
                <h3 className="text-sm font-semibold">Company Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Acme Corporation"
                    required
                    data-testid="signup-company-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Company Domain *</Label>
                  <Input
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    placeholder="acme.com"
                    required
                    data-testid="signup-domain"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="subdomain"
                      value={formData.subdomain}
                      onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
                      placeholder="acme"
                      data-testid="signup-subdomain"
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">.yourapp.com</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Base Currency *</Label>
                  <Select value={formData.currency} onValueChange={(val) => setFormData({ ...formData, currency: val })}>
                    <SelectTrigger data-testid="signup-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                      <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                      <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Admin Account */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 text-primary rounded-md h-6 w-6 flex items-center justify-center text-xs font-bold">2</div>
                <h3 className="text-sm font-semibold">Admin Account</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin_name">Your Name *</Label>
                  <Input
                    id="admin_name"
                    value={formData.admin_name}
                    onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                    placeholder="John Doe"
                    required
                    data-testid="signup-admin-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin_email">Email Address *</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    value={formData.admin_email}
                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                    placeholder="john@acme.com"
                    required
                    data-testid="signup-admin-email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin_password">Password *</Label>
                <Input
                  id="admin_password"
                  type="password"
                  value={formData.admin_password}
                  onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  data-testid="signup-admin-password"
                />
                <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
              </div>
            </div>

            {/* Mobile-only trial features */}
            <div className="lg:hidden bg-muted/50 p-4 rounded-lg border border-border">
              <h4 className="text-sm font-semibold mb-3">Included in Free Trial:</h4>
              <div className="grid grid-cols-2 gap-2">
                {TRIAL_FEATURES.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
              data-testid="signup-submit-btn"
            >
              {loading ? 'Creating Account…' : (
                <>
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <a href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
