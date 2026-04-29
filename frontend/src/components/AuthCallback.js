import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthCallback = () => {
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // CRITICAL: Use useRef to prevent double-processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      // Google direct OAuth sends `code` as a query param (?code=...)
      const searchParams = new URLSearchParams(location.search);
      const googleCode = searchParams.get('code');

      // Emergent OAuth sends `session_id` in the URL fragment (#session_id=...)
      const hash = location.hash;
      const hashParams = new URLSearchParams(hash.substring(1));
      const sessionId = hashParams.get('session_id');

      if (!googleCode && !sessionId) {
        toast.error('Authentication failed: No session data received');
        window.location.replace('/login');
        return;
      }

      try {
        let response;

        if (googleCode) {
          // Direct Google OAuth flow — no withCredentials needed (JWT returned in body)
          response = await axios.post(
            `${API}/auth/google`,
            {
              code: googleCode,
              redirect_uri: window.location.origin + '/auth/callback',
            }
          );
        } else {
          response = await axios.post(
            `${API}/auth/session`,
            {},
            { headers: { 'X-Session-ID': sessionId } }
          );
        }

        const { user, token } = response.data;

        if (token) {
          localStorage.setItem('token', token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        localStorage.setItem('user', JSON.stringify(user));

        // Full page reload so AuthContext re-reads localStorage and sets user state.
        // React Router navigate() is a SPA navigation — it does NOT reload AuthContext,
        // so user stays null and ProtectedRoute redirects back to /login.
        window.location.replace('/dashboard');
      } catch (error) {
        const detail = error?.response?.data?.detail || error?.message || 'Unknown error';
        console.error('OAuth session exchange failed:', detail, error);
        toast.error(`Authentication failed: ${detail}`);
        setTimeout(() => window.location.replace('/login'), 3000);
      }
    };

    processSession();
  }, [location]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;