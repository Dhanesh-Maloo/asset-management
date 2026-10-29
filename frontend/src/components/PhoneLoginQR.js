import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, RefreshCw, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/** Shows a one-time QR that signs a phone into this account without typing the password. */
export const PhoneLoginQR = () => {
  const [qr, setQr] = useState(null);          // { id, code, expiresAt }
  const [status, setStatus] = useState('idle'); // idle | pending | used | expired
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [creating, setCreating] = useState(false);

  const generate = useCallback(async () => {
    setCreating(true);
    try {
      const res = await axios.post(`${API}/auth/qr-login/create`);
      setQr({ id: res.data.id, code: res.data.code, expiresAt: Date.now() + res.data.expires_in * 1000 });
      setStatus('pending');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not create the QR code');
    } finally {
      setCreating(false);
    }
  }, []);

  // Countdown, and mark expired locally when it reaches zero
  useEffect(() => {
    if (status !== 'pending' || !qr) return undefined;
    const tick = () => {
      const left = Math.max(0, Math.ceil((qr.expiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) setStatus('expired');
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [status, qr]);

  // Poll so the screen can show when the phone has used the code
  useEffect(() => {
    if (status !== 'pending' || !qr) return undefined;
    const poll = setInterval(() => {
      axios.get(`${API}/auth/qr-login/${qr.id}/status`)
        .then((res) => { if (res.data.status !== 'pending') setStatus(res.data.status); })
        .catch(() => { /* keep waiting; the countdown still ends it */ });
    }, 2000);
    return () => clearInterval(poll);
  }, [status, qr]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5" /> Sign in on phone</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-500 mb-4 max-w-xl">
          Scan the code with your phone camera to sign that phone into your account without typing the password.
          Each code works once and expires after 90 seconds. Only generate it when your phone is in your hand,
          and never share a screenshot of it.
        </p>

        {status === 'idle' && (
          <button onClick={generate} disabled={creating}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
            {creating ? 'Creating…' : 'Show sign-in QR'}
          </button>
        )}

        {status === 'pending' && qr && (
          <div className="flex flex-col items-start gap-3">
            <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-sm">
              <QRCodeSVG value={`${window.location.origin}/qr-login#code=${qr.code}`} size={220} level="M" includeMargin />
            </div>
            <p className="text-sm text-slate-500">Expires in <span className="font-semibold tabular-nums">{secondsLeft}s</span></p>
          </div>
        )}

        {status === 'used' && (
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 text-sm font-medium max-w-md">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Your phone is signed in. This code can't be used again.
          </div>
        )}

        {status === 'expired' && <p className="text-sm text-slate-500 mb-3">This code has expired.</p>}

        {(status === 'used' || status === 'expired') && (
          <button onClick={generate} disabled={creating}
            className="flex items-center gap-2 px-4 py-2 mt-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">
            <RefreshCw className="h-4 w-4" /> Generate a new code
          </button>
        )}
      </CardContent>
    </Card>
  );
};
