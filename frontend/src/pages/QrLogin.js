import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { QrCode } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/** Landing page for the "Sign in on phone" QR. Redeems the one-time code in the URL fragment. */
export const QrLogin = () => {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // the code works once; never redeem twice (StrictMode double-run)
    started.current = true;

    const code = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('code');
    // Drop the code from the address bar and history straight away
    window.history.replaceState(null, '', window.location.pathname);
    if (!code) {
      setError('This QR code is incomplete. Generate a new one from your profile.');
      return;
    }

    // No stored Authorization header: the code alone must establish the session
    axios.post(`${API}/auth/qr-login/redeem`, { code }, { headers: { Authorization: undefined } })
      .then((res) => {
        loginWithToken(res.data.token, res.data.user);
        navigate('/dashboard', { replace: true });
      })
      .catch((e) => setError(e.response?.data?.detail || 'Sign-in failed. Generate a new QR code and try again.'));
  }, [loginWithToken, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4" data-testid="qr-login-page">
      {error ? (
        <div className="text-center max-w-sm">
          <QrCode className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 dark:text-slate-300">{error}</p>
          <Link to="/login" className="inline-block mt-4 text-primary hover:underline text-sm">Sign in with password</Link>
        </div>
      ) : (
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-slate-500 mt-4">Signing you in…</p>
        </div>
      )}
    </div>
  );
};
