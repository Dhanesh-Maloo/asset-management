import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Palette, Upload, Settings, Building2, Bell, Database, Trash2, Mail, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AVAILABLE_FEATURES = [
  { id: 'products', label: 'Product Catalog', description: 'Browse and order IT equipment' },
  { id: 'orders', label: 'Orders', description: 'Order management and approvals' },
  { id: 'assets', label: 'Assets', description: 'Asset tracking and assignment' },
  { id: 'tickets', label: 'Helpdesk', description: 'IT support ticketing system' },
  { id: 'users', label: 'Users', description: 'User management' },
  { id: 'groups', label: 'Groups', description: 'User groups and permissions' },
  { id: 'workflows', label: 'Workflows', description: 'Approval workflows configuration' },
];

const TenantSettings = () => {
  const { user } = useAuth();
  const { refreshBranding } = useTenant();
  const [tenant, setTenant] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [demoStatus, setDemoStatus] = useState(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailSent, setTestEmailSent] = useState(false);
  
  const [formData, setFormData] = useState({
    logo_url: '',
    primary_color: '#4F46E5',
    secondary_color: '#F1F5F9',
    company_name: '',
    subdomain: '',
    enabled_features: [],
    currency: 'USD',
    slack_webhook_url: ''
  });

  useEffect(() => {
    fetchTenant();
    fetchDemoStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTenant = async (tenantId) => {
    try {
      let tid = tenantId || user.tenant_id;
      
      if (!tid && user.role === 'super_admin') {
        // Load tenants list for super admin to pick from
        const res = await axios.get(`${API}/tenants`);
        setTenants(res.data);
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API}/tenants/${tid}`);
      setTenant(response.data);
      setFormData({
        logo_url: response.data.logo_url || '',
        primary_color: response.data.primary_color || '#4F46E5',
        secondary_color: response.data.secondary_color || '#F1F5F9',
        company_name: response.data.company_name || response.data.name,
        subdomain: response.data.subdomain || '',
        enabled_features: response.data.enabled_features || [],
        currency: response.data.settings?.currency || 'USD',
        slack_webhook_url: response.data.settings?.slack_webhook_url || ''
      });
    } catch (error) {
      console.error('Failed to fetch tenant', error);
      toast.error('Failed to load tenant settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchDemoStatus = async () => {
    if (!user?.tenant_id) return;
    try {
      const res = await axios.get(`${API}/demo-data/status`);
      setDemoStatus(res.data);
    } catch { /* silent */ }
  };

  const handleLoadDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await axios.post(`${API}/demo-data/seed`);
      toast.success(res.data.message || 'Demo data loaded');
      setDemoStatus({ has_demo_data: true });
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to load demo data');
    } finally { setDemoLoading(false); }
  };

  const handleDeleteDemo = async () => {
    if (!window.confirm('This will permanently delete all demo data (assets, tickets, products, licenses, orders, vendors, departments). Cannot be undone. Continue?')) return;
    setDemoLoading(true);
    try {
      const res = await axios.delete(`${API}/demo-data`);
      toast.success(res.data.message || 'Demo data cleared');
      setDemoStatus({ has_demo_data: false, count: 0 });
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to delete demo data');
    } finally { setDemoLoading(false); }
  };

  const handleTestEmail = async () => {
    setTestEmailLoading(true);
    setTestEmailSent(false);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/auth/test-email`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setTestEmailSent(true);
      toast.success(`Test email sent to ${user.email}! Check your inbox.`);
    } catch (e) {
      const msg = e.response?.data?.detail || 'Failed to send test email';
      toast.error(msg);
    } finally { setTestEmailLoading(false); }
  };

  const handleSelectTenant = (tenantId) => {
    setSelectedTenantId(tenantId);
    setLoading(true);
    fetchTenant(tenantId);
  };

  const handleSave = async () => {
    if (!tenant) return;
    
    setSaving(true);
    try {
      const payload = {
        ...formData,
        settings: { currency: formData.currency },
        slack_webhook_url: formData.slack_webhook_url || null
      };
      await axios.patch(`${API}/tenants/${tenant.id}`, payload);
      toast.success('Tenant settings updated successfully');
      refreshBranding();
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleFeature = (featureId) => {
    setFormData(prev => ({
      ...prev,
      enabled_features: prev.enabled_features.includes(featureId)
        ? prev.enabled_features.filter(f => f !== featureId)
        : [...prev.enabled_features, featureId]
    }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!tenant) {
    return (
      <DashboardLayout>
        <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in">
          {user.role === 'super_admin' && tenants.length > 0 ? (
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-1">Tenant Settings</h1>
              <p className="text-sm text-muted-foreground mb-6">Select a tenant to configure</p>
              <Card>
                <CardContent className="p-6">
                  <Label className="mb-2 block">Select Tenant</Label>
                  <Select value={selectedTenantId} onValueChange={handleSelectTenant}>
                    <SelectTrigger className="w-full max-w-md" data-testid="tenant-selector">
                      <SelectValue placeholder="Choose a tenant to configure..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {t.name} ({t.domain})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Settings className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No tenant configuration available</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in" data-testid="tenant-settings-page">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-1">
            Tenant Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure your white-label branding and features
          </p>
        </div>

        <div className="grid gap-6">
          {/* Branding */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-violet-500/10 p-3 rounded-md">
                  <Palette className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <CardTitle>Branding</CardTitle>
                  <CardDescription>Customize your organization's look and feel</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Acme Corporation"
                  data-testid="company-name-input"
                />
              </div>

              <div>
                <Label htmlFor="subdomain">Subdomain</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="subdomain"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                    placeholder="acme"
                    className="flex-1"
                    data-testid="subdomain-input"
                  />
                  <span className="text-sm text-muted-foreground">.yourapp.com</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Your custom subdomain URL</p>
              </div>

              <Separator />

              <div>
                <Label htmlFor="currency">Base Currency</Label>
                <Select value={formData.currency} onValueChange={(val) => setFormData({ ...formData, currency: val })}>
                  <SelectTrigger data-testid="currency-select" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                    <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                    <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">All product prices will be displayed in this currency</p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-20 h-10"
                      data-testid="primary-color-input"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      placeholder="#4F46E5"
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondary_color">Secondary Color</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="w-20 h-10"
                      data-testid="secondary-color-input"
                    />
                    <Input
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      placeholder="#F1F5F9"
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  data-testid="logo-url-input"
                />
                <p className="text-xs text-muted-foreground mt-1">Direct URL to your company logo</p>
              </div>
            </CardContent>
          </Card>

          {/* Feature Toggles */}
          {user.role === 'super_admin' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 p-3 rounded-md">
                    <Settings className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Enabled Features</CardTitle>
                    <CardDescription>Control which modules are available for this tenant</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {AVAILABLE_FEATURES.map(feature => (
                    <div key={feature.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium">{feature.label}</p>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                      <Switch
                        checked={formData.enabled_features.includes(feature.id)}
                        onCheckedChange={() => toggleFeature(feature.id)}
                        data-testid={`feature-${feature.id}-switch`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Integrations */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/10 p-3 rounded-md">
                  <Bell className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle>Notifications & Integrations</CardTitle>
                  <CardDescription>Send alerts to Slack or Microsoft Teams via incoming webhooks (free)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="slack_webhook_url">Slack / Teams Incoming Webhook URL</Label>
                <Input
                  id="slack_webhook_url"
                  value={formData.slack_webhook_url}
                  onChange={(e) => setFormData({ ...formData, slack_webhook_url: e.target.value })}
                  placeholder="https://hooks.slack.com/services/..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Alerts (expiring warranties, overdue maintenance) will be posted here automatically every 24 hours.
                  Get a free webhook URL from Slack → App Directory → Incoming Webhooks, or from Teams → Connectors.
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-indigo-500" />
                      Email (SendGrid)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Used for password reset and user invite emails. Powered by SendGrid — configured and active.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestEmail}
                    disabled={testEmailLoading}
                    className="ml-4 shrink-0"
                  >
                    {testEmailLoading ? (
                      'Sending…'
                    ) : testEmailSent ? (
                      <><CheckCircle className="h-4 w-4 mr-1 text-green-500" /> Sent!</>
                    ) : (
                      <><Mail className="h-4 w-4 mr-1" /> Send Test Email</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demo Data */}
          {['tenant_admin', 'super_admin'].includes(user.role) && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/10 p-3 rounded-md">
                    <Database className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle>Demo Data</CardTitle>
                    <CardDescription>
                      Load sample assets, tickets, products, licenses and more to explore the application.
                      Delete it when you're ready to add real data.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {demoStatus?.has_demo_data ? (
                  <div className="flex items-center justify-between p-4 bg-warning/10 border border-warning/20 rounded-lg">
                    <div className="text-sm text-amber-800">
                      <strong>Demo data is active.</strong> The app currently contains sample data for exploration.
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteDemo}
                      disabled={demoLoading}
                      className="ml-4 whitespace-nowrap"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {demoLoading ? 'Deleting...' : 'Delete Demo Data'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-muted/50 border border-slate-200 rounded-lg">
                    <div className="text-sm text-slate-600">
                      No demo data loaded. Load sample data to see how the application looks with real content.
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoadDemo}
                      disabled={demoLoading}
                      className="ml-4 whitespace-nowrap"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      {demoLoading ? 'Loading...' : 'Load Demo Data'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => fetchTenant()}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} data-testid="save-tenant-settings-btn">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TenantSettings;