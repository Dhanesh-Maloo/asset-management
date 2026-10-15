import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { MapPin, QrCode, Building2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/** Public, no-login view of a master QR code. Shows only non-sensitive asset fields. */
const PublicMasterQR = () => {
  const { masterId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Plain request without the app's auth header: this page must work for anyone
    axios.get(`${API}/public/master-qrs/${encodeURIComponent(masterId)}`, { headers: { Authorization: undefined } })
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.status === 429
        ? 'Too many requests. Please try again in a minute.'
        : 'This QR code is not available.'))
      .finally(() => setLoading(false));
  }, [masterId]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8" data-testid="public-master-qr">
      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-24"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>
        ) : error ? (
          <div className="text-center py-24">
            <QrCode className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-600 dark:text-slate-300">{error}</p>
            <Link to="/login" className="inline-block mt-4 text-primary hover:underline text-sm">Sign in</Link>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm">
              {data.organization && (
                <p className="text-xs uppercase tracking-wide text-slate-500 flex items-center gap-1"><Building2 className="h-3 w-3" />{data.organization}</p>
              )}
              <h1 className="text-2xl font-bold mt-1">{data.name}</h1>
              {data.location && <p className="text-slate-500 mt-1 flex items-center gap-1"><MapPin className="h-4 w-4" />{data.location}</p>}
              <p className="text-sm text-slate-500 mt-1">{data.asset_count} assets</p>
            </div>

            <div className="mt-4 bg-white dark:bg-slate-900 border rounded-2xl divide-y shadow-sm">
              {data.assets.map((a, i) => (
                <div key={`${a.asset_tag}-${i}`} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{a.asset_tag}</p>
                    <p className="text-sm text-slate-500 truncate">{a.product_name || '-'}</p>
                    {a.location && <p className="text-xs text-slate-400">{a.location}</p>}
                  </div>
                  <span className="text-xs border rounded-full px-2.5 py-1 capitalize shrink-0">{String(a.status).replace(/_/g, ' ')}</span>
                </div>
              ))}
              {data.assets.length === 0 && <p className="p-6 text-center text-slate-500 text-sm">No assets in this group.</p>}
            </div>
            <p className="text-center text-xs text-slate-400 mt-6">
              <Link to="/login" className="hover:underline">Staff sign in</Link> for full details
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default PublicMasterQR;
