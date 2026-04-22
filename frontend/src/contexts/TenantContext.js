import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const TenantContext = createContext(null);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DEFAULT_BRANDING = {
  logo_url: '',
  primary_color: '#4F46E5',
  secondary_color: '#F1F5F9',
  company_name: 'IT Assets',
  enabled_features: ['products', 'orders', 'assets', 'tickets', 'users', 'groups', 'workflows']
};

export const TenantProvider = ({ children }) => {
  const [tenantBranding, setTenantBranding] = useState(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenantBranding();
  }, []);

  const fetchTenantBranding = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.tenant_id) {
        const response = await axios.get(`${API}/tenants/${user.tenant_id}`);
        setTenantBranding({
          logo_url: response.data.logo_url || '',
          primary_color: response.data.primary_color || '#4F46E5',
          secondary_color: response.data.secondary_color || '#F1F5F9',
          company_name: response.data.company_name || response.data.name,
          enabled_features: response.data.enabled_features || DEFAULT_BRANDING.enabled_features
        });
      }
    } catch (error) {
      console.error('Failed to fetch tenant branding', error);
    } finally {
      setLoading(false);
    }
  };

  const isFeatureEnabled = (feature) => {
    return tenantBranding.enabled_features.includes(feature);
  };

  const refreshBranding = () => {
    fetchTenantBranding();
  };

  return (
    <TenantContext.Provider value={{ tenantBranding, isFeatureEnabled, refreshBranding, loading }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};