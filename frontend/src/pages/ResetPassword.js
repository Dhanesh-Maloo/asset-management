import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, KeyRound, Check, AlertCircle, Boxes } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  useEffect(() => {
    const t = searchParams.get('token');
    if (t) {
      setToken(t);
    } else {
      setInvalidLink(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, {
        token,
        new_password: newPassword,
      });
      setDone(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sidebar relative overflow-hidden p-4">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="relative flex items-center gap-2.5 mb-6">
        <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
          <Boxes className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-semibold font-heading text-white">IT Asset Management</span>
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl animate-fade-in">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center font-heading">
            {done ? 'Password Updated' : 'Set New Password'}
          </CardTitle>
          <CardDescription className="text-center">
            {done
              ? 'Your password has been reset successfully'
              : invalidLink
              ? 'This reset link is invalid or missing'
              : 'Enter your new password below'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Invalid link */}
          {invalidLink && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-sm text-muted-foreground">
                This link is invalid. Please request a new password reset.
              </p>
              <Button className="w-full" onClick={() => navigate('/forgot-password')}>
                Go to Forgot Password
              </Button>
            </div>
          )}

          {/* Success */}
          {done && !invalidLink && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm text-muted-foreground">You can now sign in with your new password.</p>
              <Button className="w-full" onClick={() => navigate('/login')}>
                Go to Login
              </Button>
            </div>
          )}

          {/* Reset form */}
          {!done && !invalidLink && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
