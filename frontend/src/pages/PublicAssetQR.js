import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { MapPin, QrCode, Building2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '');

const Row = ({ label, value }) =>
  value ? (
    <div className="flex items-center justify-between gap-4 px-6 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-right break-words min-w-0">{value}</span>
    </div>
  ) : null;

/** Public, no-login view of one asset, opened by scanning its QR code. Non-sensitive fields only. */
export const PublicAssetQR = () => {
  const { assetId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Plain request without the app's auth header: this page must work for anyone
    axios.get(`${API}/public/assets/${encodeURIComponent(assetId)}`, { headers: { Authorization: undefined } })
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.status === 429
        ? 'Too many requests. Please try again in a minute.'
        : 'This QR code is not available.'))
      .finally(() => setLoading(false));
  }, [assetId]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8" data-testid="public-asset-qr">
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
              <div className="flex items-start justify-between gap-3 mt-1">
                <h1 className="text-2xl font-bold">{data.asset_tag}</h1>
                <span className="text-xs border rounded-full px-2.5 py-1 capitalize shrink-0 mt-1">{String(data.status).replace(/_/g, ' ')}</span>
              </div>
              {data.product_name && <p className="text-slate-600 dark:text-slate-300 mt-1">{data.product_name}</p>}
              {data.location && <p className="text-slate-500 mt-1 flex items-center gap-1"><MapPin className="h-4 w-4" />{data.location}</p>}
            </div>

            <div className="mt-4 bg-white dark:bg-slate-900 border rounded-2xl divide-y shadow-sm">
              <Row label={data.assigned_label} value={data.assigned_to} />
              <Row label="Category" value={data.category} />
              <Row label="Serial number" value={data.serial_number} />
              <Row label="Department" value={data.department} />
              <Row label="Purchased" value={fmtDate(data.purchase_date)} />
              <Row label="Warranty until" value={fmtDate(data.warranty_end_date)} />
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
