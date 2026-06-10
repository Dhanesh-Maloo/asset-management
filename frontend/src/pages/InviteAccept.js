import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InviteAccept = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [form, setForm] = useState({ name: '', password: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    axios.get(`${API}/auth/invite/${token}`)
      .then(res => setInvite(res.data))
      .catch(err => setLoadError(err.response?.data?.detail || 'Invalid or expired invite link'))
      .finally(() => setLoadingInvite(false));
  }, [token]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => navigate('/login'), 2000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (form.password.length < 12) {
      setSubmitError('Password must be at least 12 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setSubmitError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/auth/invite/${token}/accept`, {
        name: form.name,
        password: form.password
      });
      setSuccess(true);
    } catch (err) {
      setSubmitError(err.response?.data?.detail || 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-sidebar flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold font-heading tracking-tight">Accept Invitation</h1>
          <p className="text-muted-foreground mt-1 text-sm">Create your account to get started</p>
        </div>

        {loadingInvite ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-slate-500 mt-3 text-sm">Verifying invitation...</p>
          </div>
        ) : loadError ? (
          <div className="text-center py-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-5 mb-6">
              <p className="text-destructive font-medium">{loadError}</p>
              <p className="text-red-500 text-sm mt-1">This link may have already been used or has expired.</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-primary text-white py-2.5 rounded-md font-semibold hover:bg-primary/90 transition-colors"
            >
              Go to Login
            </button>
          </div>
        ) : success ? (
          <div className="text-center py-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-5">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-emerald-700 dark:text-emerald-400 font-semibold">Account created successfully!</p>
              <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-1">Redirecting to login...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
              <input
                type="email"
                value={invite?.email || ''}
                disabled
                className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-muted/50 text-muted-foreground cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Role</label>
              <input
                type="text"
                value={(invite?.role || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                disabled
                className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-muted/50 text-muted-foreground cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Full Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border border-input rounded-md px-4 py-2.5 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Password <span className="text-red-500">*</span></label>
              <input
                type="password"
                placeholder="Minimum 12 characters"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                minLength={12}
                className="w-full border border-input rounded-md px-4 py-2.5 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Confirm Password <span className="text-red-500">*</span></label>
              <input
                type="password"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                required
                className="w-full border border-input rounded-md px-4 py-2.5 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>

            {submitError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-white py-2.5 rounded-md font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 mt-2"
            >
              {submitting ? 'Creating Account...' : 'Create Account'}
            </button>

            <p className="text-center text-xs text-muted-foreground mt-2">
              Already have an account?{' '}
              <button type="button" onClick={() => navigate('/login')} className="text-primary hover:underline font-medium">
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default InviteAccept;
