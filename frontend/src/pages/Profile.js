import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { User, Laptop, Ticket, ShoppingCart, Key, Save, Eye, EyeOff, Plus, Copy, Trash2, KeyRound } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  // Password change state
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // API Keys state
  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchApiKeys();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API}/profile`);
      setProfile(res.data);
      setEditName(res.data.user?.name || '');
    } catch (e) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!editName.trim()) { toast.error('Name cannot be empty'); return; }
    setSaving(true);
    try {
      await axios.put(`${API}/profile`, { name: editName.trim() });
      toast.success('Profile updated');
      fetchProfile();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const res = await axios.get(`${API}/auth/api-keys`);
      setApiKeys(res.data);
    } catch (e) { /* silently ignore */ }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) { toast.error('Enter a name for the key'); return; }
    setCreatingKey(true);
    try {
      const res = await axios.post(`${API}/auth/api-keys`, { name: newKeyName.trim() });
      setNewlyCreatedKey(res.data.key);
      setNewKeyName('');
      fetchApiKeys();
      toast.success('API key created — copy it now, it will not be shown again');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to create API key');
    } finally {
      setCreatingKey(false);
    }
  };

  const revokeApiKey = async (keyId) => {
    try {
      await axios.delete(`${API}/auth/api-keys/${keyId}`);
      setApiKeys(prev => prev.filter(k => k.id !== keyId));
      toast.success('API key revoked');
    } catch (e) {
      toast.error('Failed to revoke key');
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) { toast.error('New passwords do not match'); return; }
    if (pwForm.new_password.length < 12) { toast.error('Password must be at least 12 characters'); return; }
    setPwLoading(true);
    try {
      await axios.put(`${API}/auth/change-password`, {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      toast.success('Password changed successfully');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const statusColor = (s) => {
    const map = { available: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', assigned: 'bg-blue-500/10 text-blue-700 dark:text-blue-400', in_use: 'bg-violet-500/10 text-violet-700 dark:text-violet-400', under_maintenance: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', disposed: 'bg-red-500/10 text-red-700 dark:text-red-400' };
    return map[s] || 'bg-muted text-slate-700';
  };

  const priorityColor = (p) => {
    const map = { low: 'bg-muted text-slate-600', medium: 'bg-blue-500/10 text-blue-700 dark:text-blue-400', high: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', critical: 'bg-red-500/10 text-red-700 dark:text-red-400' };
    return map[p] || 'bg-muted text-slate-600';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded w-48"></div>
            <div className="h-40 bg-muted rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'assets', label: `My Assets (${profile?.assigned_assets?.length || 0})` },
    { id: 'tickets', label: `Open Tickets (${profile?.open_tickets?.length || 0})` },
    { id: 'orders', label: `Recent Orders (${profile?.recent_orders?.length || 0})` },
    { id: 'security', label: 'Change Password' },
    { id: 'api-keys', label: 'API Keys' },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-6">My Profile</h1>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="text-2xl font-bold font-heading bg-transparent border-b-2 border-transparent focus:border-primary outline-none px-1"
                  />
                  <button onClick={saveProfile} disabled={saving}
                    className="flex items-center gap-1 text-sm px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
                <p className="text-slate-500 mt-1">{profile?.user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full capitalize">
                  {profile?.user?.role?.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-blue-600">{profile?.assigned_assets?.length || 0}</div>
            <div className="text-sm text-slate-500 flex items-center justify-center gap-1 mt-1"><Laptop className="h-3.5 w-3.5" /> Assets</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-orange-500">{profile?.open_tickets?.length || 0}</div>
            <div className="text-sm text-slate-500 flex items-center justify-center gap-1 mt-1"><Ticket className="h-3.5 w-3.5" /> Open Tickets</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{profile?.recent_orders?.length || 0}</div>
            <div className="text-sm text-slate-500 flex items-center justify-center gap-1 mt-1"><ShoppingCart className="h-3.5 w-3.5" /> Orders</div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === t.id ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-800'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <Card>
            <CardHeader><CardTitle>Account Information</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-3">
                {[
                  { label: 'Full Name', value: profile?.user?.name },
                  { label: 'Email', value: profile?.user?.email },
                  { label: 'Role', value: profile?.user?.role?.replace(/_/g, ' ') },
                  { label: 'Status', value: profile?.user?.status },
                  { label: 'Member Since', value: profile?.user?.created_at ? new Date(profile.user.created_at).toLocaleDateString() : '—' },
                ].map(item => (
                  <div key={item.label} className="flex items-center py-2 border-b border-slate-50 last:border-0">
                    <dt className="w-36 text-sm text-slate-500">{item.label}</dt>
                    <dd className="text-sm font-medium capitalize">{item.value || '—'}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <Card>
            <CardHeader><CardTitle>My Assigned Assets</CardTitle></CardHeader>
            <CardContent>
              {profile?.assigned_assets?.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Laptop className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  No assets assigned to you
                </div>
              ) : (
                <div className="space-y-2">
                  {profile.assigned_assets.map(asset => (
                    <div key={asset.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{asset.asset_tag}</p>
                        <p className="text-xs text-slate-500">S/N: {asset.serial_number}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {asset.location && <span className="text-xs text-slate-400">{asset.location}</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(asset.status)}`}>{asset.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <Card>
            <CardHeader><CardTitle>My Open Tickets</CardTitle></CardHeader>
            <CardContent>
              {profile?.open_tickets?.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Ticket className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  No open tickets
                </div>
              ) : (
                <div className="space-y-2">
                  {profile.open_tickets.map(ticket => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{ticket.title}</p>
                        <p className="text-xs text-slate-500">{ticket.ticket_number}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor(ticket.priority)}`}>{ticket.priority}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">{ticket.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <Card>
            <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
            <CardContent>
              {profile?.recent_orders?.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  No orders yet
                </div>
              ) : (
                <div className="space-y-2">
                  {profile.recent_orders.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Qty: {order.quantity}</p>
                        <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${order.status === 'approved' || order.status === 'fulfilled' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : order.status === 'rejected' ? 'bg-red-500/10 text-red-700 dark:text-red-400' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'}`}>
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* API Keys Tab */}
        {activeTab === 'api-keys' && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Create API Key</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-4">
                  API keys let external tools access the app on your behalf. Use the key as a Bearer token in the Authorization header.
                </p>
                <div className="flex gap-3 max-w-md">
                  <input
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    placeholder="Key name (e.g. My Integration)"
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    onKeyDown={e => e.key === 'Enter' && createApiKey()}
                  />
                  <button onClick={createApiKey} disabled={creatingKey}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                    <Plus className="h-4 w-4" /> {creatingKey ? 'Creating...' : 'Create'}
                  </button>
                </div>
                {newlyCreatedKey && (
                  <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <p className="text-xs font-medium text-green-800 mb-2">Copy your key now — it will not be shown again:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-white border border-green-300 rounded px-3 py-2 font-mono break-all">{newlyCreatedKey}</code>
                      <button onClick={() => { navigator.clipboard.writeText(newlyCreatedKey); toast.success('Copied!'); }}
                        className="shrink-0 p-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <button onClick={() => setNewlyCreatedKey(null)} className="text-xs text-green-700 mt-2 underline">Dismiss</button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Active API Keys ({apiKeys.length})</CardTitle></CardHeader>
              <CardContent>
                {apiKeys.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <KeyRound className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    No API keys yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {apiKeys.map(k => (
                      <div key={k.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{k.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{k.key_display}</p>
                          <p className="text-xs text-slate-400">Created {new Date(k.created_at).toLocaleDateString()}{k.last_used_at ? ` · Last used ${new Date(k.last_used_at).toLocaleDateString()}` : ''}</p>
                        </div>
                        <button onClick={() => revokeApiKey(k.id)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={changePassword} className="space-y-4 max-w-md">
                {[
                  { key: 'current_password', label: 'Current Password', showKey: 'current' },
                  { key: 'new_password', label: 'New Password', showKey: 'new' },
                  { key: 'confirm', label: 'Confirm New Password', showKey: 'confirm' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
                    <div className="relative">
                      <input
                        type={showPw[field.showKey] ? 'text' : 'password'}
                        value={pwForm[field.key]}
                        onChange={e => setPwForm({ ...pwForm, [field.key]: e.target.value })}
                        required
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <button type="button" onClick={() => setShowPw(p => ({ ...p, [field.showKey]: !p[field.showKey] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPw[field.showKey] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-slate-500">Password must be at least 12 characters with uppercase, lowercase, and a number.</p>
                <button type="submit" disabled={pwLoading}
                  className="w-full py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {pwLoading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Profile;
