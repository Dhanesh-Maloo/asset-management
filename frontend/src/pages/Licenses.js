import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Key, X, AlertTriangle, Sparkles } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const emptyForm = {
  name: '', vendor: '', license_key: '', seats_total: 1, seats_used: 0,
  purchase_date: '', expiry_date: '', cost: 0, license_type: 'perpetual',
  tenant_id: '', notes: ''
};

const LICENSE_TYPES = ['perpetual', 'subscription', 'trial', 'oem', 'open_source'];

const Licenses = () => {
  const { user } = useAuth();
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [seedingDemo, setSeedingDemo] = useState(false);

  const canEdit = ['super_admin', 'tenant_admin', 'asset_manager'].includes(user?.role);

  useEffect(() => { fetchLicenses(); }, []);

  const fetchLicenses = async () => {
    try {
      const res = await axios.get(`${API}/licenses`);
      setLicenses(res.data);
    } catch { toast.error('Failed to load licenses'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setForm({ ...emptyForm, tenant_id: user?.tenant_id || '' });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (lic) => {
    setForm({
      name: lic.name, vendor: lic.vendor || '', license_key: lic.license_key || '',
      seats_total: lic.seats_total, seats_used: lic.seats_used,
      purchase_date: lic.purchase_date ? lic.purchase_date.slice(0, 10) : '',
      expiry_date: lic.expiry_date ? lic.expiry_date.slice(0, 10) : '',
      cost: lic.cost, license_type: lic.license_type, tenant_id: lic.tenant_id, notes: lic.notes || ''
    });
    setEditId(lic.id);
    setShowForm(true);
  };

  const saveLicense = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        seats_total: parseInt(form.seats_total),
        seats_used: parseInt(form.seats_used),
        cost: parseFloat(form.cost) || 0,
        purchase_date: form.purchase_date || null,
        expiry_date: form.expiry_date || null,
      };
      if (editId) {
        await axios.put(`${API}/licenses/${editId}`, payload);
        toast.success('License updated');
      } else {
        await axios.post(`${API}/licenses`, payload);
        toast.success('License created');
      }
      setShowForm(false);
      fetchLicenses();
    } catch (e) { toast.error(e.response?.data?.detail || 'Save failed'); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API}/licenses/${deleteId}`);
      toast.success('License deleted');
      setDeleteId(null);
      fetchLicenses();
    } catch (e) { toast.error(e.response?.data?.detail || 'Delete failed'); }
  };

  const loadDemoData = async () => {
    setSeedingDemo(true);
    try {
      const res = await axios.post(`${API}/licenses/seed-demo`);
      const count = res.data.inserted;
      if (count > 0) {
        toast.success(`${count} demo licenses loaded! Dashboard chart is ready.`);
        fetchLicenses();
      } else {
        toast.info('Demo licenses already exist — nothing new was added.');
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to load demo data');
    } finally {
      setSeedingDemo(false);
    }
  };

  const isExpiringSoon = (expiry) => {
    if (!expiry) return false;
    const days = (new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30;
  };

  const isExpired = (expiry) => {
    if (!expiry) return false;
    return new Date(expiry) < new Date();
  };

  const filtered = licenses.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.vendor?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: licenses.length,
    expiringSoon: licenses.filter(l => isExpiringSoon(l.expiry_date)).length,
    expired: licenses.filter(l => isExpired(l.expiry_date)).length,
    totalSeats: licenses.reduce((s, l) => s + (l.seats_total || 0), 0),
    usedSeats: licenses.reduce((s, l) => s + (l.seats_used || 0), 0),
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold font-heading">Software Licenses</h1>
            <p className="text-slate-500 mt-1">Track software licenses, seats, and expiry dates</p>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <button onClick={loadDemoData} disabled={seedingDemo}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 text-sm">
                <Sparkles className="h-4 w-4" />
                {seedingDemo ? 'Loading...' : 'Load Demo Data'}
              </button>
              <button onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                <Plus className="h-4 w-4" /> Add License
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total Licenses', value: stats.total, color: 'text-primary' },
            { label: 'Expiring Soon', value: stats.expiringSoon, color: 'text-yellow-500' },
            { label: 'Expired', value: stats.expired, color: 'text-red-500' },
            { label: 'Total Seats', value: stats.totalSeats, color: 'text-blue-600' },
            { label: 'Used Seats', value: stats.usedSeats, color: 'text-green-600' },
          ].map(s => (
            <Card key={s.label} className="p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search licenses..."
            className="w-full max-w-sm border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-200 rounded-lg animate-pulse"></div>)}</div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-16 text-center">
            <Key className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">{search ? 'No licenses match your search' : 'No licenses added yet'}</p>
            {canEdit && !search && <button onClick={openCreate} className="mt-4 text-primary hover:underline text-sm">Add your first license</button>}
          </CardContent></Card>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>{['Name', 'Vendor', 'Type', 'Seats', 'Expiry', 'Cost', ''].map(h => (
                  <th key={h} className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(lic => {
                  const expired = isExpired(lic.expiry_date);
                  const expiring = isExpiringSoon(lic.expiry_date);
                  return (
                    <tr key={lic.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/10 p-1.5 rounded"><Key className="h-3.5 w-3.5 text-primary" /></div>
                          <div>
                            <p className="font-medium">{lic.name}</p>
                            {lic.license_key && <p className="text-xs text-slate-400 font-mono">{lic.license_key.slice(0, 20)}...</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{lic.vendor || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs capitalize">{lic.license_type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="text-xs">{lic.seats_used}/{lic.seats_total}</div>
                          <div className="flex-1 max-w-16 bg-slate-200 rounded-full h-1.5">
                            <div className="bg-primary rounded-full h-1.5" style={{ width: `${Math.min(100, (lic.seats_used / lic.seats_total) * 100)}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {lic.expiry_date ? (
                          <div className="flex items-center gap-1">
                            {(expired || expiring) && <AlertTriangle className={`h-3.5 w-3.5 ${expired ? 'text-red-500' : 'text-yellow-500'}`} />}
                            <span className={expired ? 'text-red-600' : expiring ? 'text-yellow-600' : 'text-slate-600'}>
                              {new Date(lic.expiry_date).toLocaleDateString()}
                            </span>
                          </div>
                        ) : <span className="text-slate-400">Never</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{lic.cost > 0 ? `₹${lic.cost.toLocaleString()}` : '—'}</td>
                      <td className="px-4 py-3">
                        {canEdit && (
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(lic)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setDeleteId(lic.id)} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
                <h2 className="font-semibold text-lg">{editId ? 'Edit License' : 'Add License'}</h2>
                <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-slate-400" /></button>
              </div>
              <form onSubmit={saveLicense} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Software Name *</label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="e.g. Microsoft Office 365" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vendor</label>
                    <input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="e.g. Microsoft" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">License Type</label>
                    <select value={form.license_type} onChange={e => setForm({ ...form, license_type: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                      {LICENSE_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Total Seats</label>
                    <input type="number" min="1" value={form.seats_total} onChange={e => setForm({ ...form, seats_total: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Used Seats</label>
                    <input type="number" min="0" value={form.seats_used} onChange={e => setForm({ ...form, seats_used: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Date</label>
                    <input type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                    <input type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cost (₹)</label>
                    <input type="number" min="0" step="0.01" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">License Key</label>
                    <input value={form.license_key} onChange={e => setForm({ ...form, license_key: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="XXXX-XXXX-XXXX-XXXX" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                    <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"></textarea>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50">
                    {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {deleteId && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
              <h2 className="font-semibold text-lg mb-2">Delete License?</h2>
              <p className="text-sm text-slate-500 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Licenses;
