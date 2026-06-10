import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Mail, MailCheck, Boxes } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // email | sent
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/forgot-password`, { email });
      // If SMTP is not configured the backend returns the token directly — redirect immediately
      if (res.data.reset_token) {
        navigate(`/reset-password?token=${res.data.reset_token}`);
        return;
      }
      setStep('sent');
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
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

      <Card className="w-full max-w-md relative z-10 shadow-2xl animate-fade-in" data-testid="forgot-password-card">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center font-heading">
            {step === 'email' ? 'Forgot Password' : 'Check Your Email'}
          </CardTitle>
          <CardDescription className="text-center">
            {step === 'email'
              ? 'Enter your registered email address to receive a reset link'
              : `We sent a password reset link to ${email}`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 'email' && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    data-testid="forgot-email-input"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading} data-testid="request-reset-btn">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/login')}
                data-testid="back-to-login-btn"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </form>
          )}

          {step === 'sent' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
                <MailCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm text-muted-foreground">
                Click the <strong>Reset Password</strong> button in the email. The link expires in <strong>1 hour</strong>.
              </p>
              <p className="text-xs text-muted-foreground">
                Didn't receive it? Check your spam folder, or{' '}
                <button
                  className="text-primary underline"
                  onClick={() => setStep('email')}
                >
                  try again
                </button>
                .
              </p>
              <Button variant="ghost" className="w-full" onClick={() => navigate('/login')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
