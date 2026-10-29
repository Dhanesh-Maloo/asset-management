import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AssetDetail from './AssetDetail';
import { PublicAssetQR } from './PublicAssetQR';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
  </div>
);

/** Employees get the full page only for assets the API lets them open; otherwise the public view. */
const EmployeeAssetView = () => {
  const { assetId } = useParams();
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    axios.get(`${API}/assets/${encodeURIComponent(assetId)}`)
      .then(() => setAllowed(true))
      .catch(() => setAllowed(false));
  }, [assetId]);

  if (allowed === null) return <Spinner />;
  return allowed ? <AssetDetail /> : <PublicAssetQR />;
};

/** /assets/:id is what every asset QR code points to: public for visitors, full detail for signed-in users. */
export const AssetRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <PublicAssetQR />;
  return user.role === 'employee' ? <EmployeeAssetView /> : <AssetDetail />;
};
