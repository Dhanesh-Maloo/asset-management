import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Building2, X, Globe, Phone, Mail, User } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const emptyForm = { name: '', contact_name: '', email: '', phone: '', website: '', category: '', tenant_id: '', notes: '' };
const CATEGORIES = ['Hardware', 'Software', 'Networking', 'Cloud Services', 'Maintenance', 'Security', 'Other'];

const Vendors = () => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const canEdit = ['super_admin', 'tenant_admin', 'asset_manager'].includes(user?.role);

  useEffect(() => { fetchVendors(); }, []);

  const fetchVendors = async () => {
    try {
      const res = await axios.get(`${API}/vendors`);
      setVendors(res.data);
    } catch { toast.error('Failed to load vendors'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setForm({ ...emptyForm, tenant_id: user?.tenant_id || '' });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (v) => {
    setForm({ name: v.name, contact_name: v.contact_name || '', email: v.email || '', phone: v.phone || '', website: v.website || '', category: v.category || '', tenant_id: v.tenant_id, notes: v.notes || '' });
    setEditId(v.id);
    setShowForm(true);
  };

  const saveVendor = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editId) {
        const { tenant_id, ...payload } = form;
        await axios.put(`${API}/vendors/${editId}`, payload);
        toast.success('Vendor updated');
      } else {
        await axios.post(`${API}/vendors`, form);
        toast.success('Vendor created');
      }
      setShowForm(false);
      fetchVendors();
    } catch (e) { toast.error(e.response?.data?.detail || 'Save failed'); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API}/vendors/${deleteId}`);
      toast.success('Vendor deleted');
      setDeleteId(null);
      fetchVendors();
    } catch (e) { toast.error(e.response?.data?.detail || 'Delete failed'); }
  };

  const filtered = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.category?.toLowerCase().includes(search.toLowerCase()) ||
    v.contact_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight">Vendor Management</h1>
            <p className="text-slate-500 mt-1">Track suppliers, vendors, and their contact details</p>
          </div>
          {canEdit && (
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" /> Add Vendor
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{vendors.length}</div>
            <div className="text-xs text-slate-500 mt-1">Total Vendors</div>
          </Card>
          {CATEGORIES.slice(0, 3).map(cat => (
            <Card key={cat} className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{vendors.filter(v => v.category === cat).length}</div>
              <div className="text-xs text-slate-500 mt-1">{cat}</div>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search vendors..."
            className="w-full max-w-sm border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-40 shimmer rounded-lg"></div>)}
          </div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-16 text-center">
            <Building2 className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">{search ? 'No vendors match your search' : 'No vendors added yet'}</p>
            {canEdit && !search && <button onClick={openCreate} className="mt-4 text-primary hover:underline text-sm">Add your first vendor</button>}
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(v => (
              <Card key={v.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2.5 rounded-lg">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{v.name}</p>
                        {v.category && (
                          <span className="text-xs px-2 py-0.5 bg-muted text-slate-600 rounded-full">{v.category}</span>
                        )}
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(v)} className="p-1.5 hover:bg-muted rounded text-slate-400 hover:text-slate-700"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteId(v.id)} className="p-1.5 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5 text-sm text-slate-600">
                    {v.contact_name && <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-slate-400" />{v.contact_name}</div>}
                    {v.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" /><a href={`mailto:${v.email}`} className="hover:text-primary">{v.email}</a></div>}
                    {v.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" />{v.phone}</div>}
                    {v.website && <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-slate-400" /><a href={v.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">{v.website.replace(/^https?:\/\//, '')}</a></div>}
                    {v.notes && <p className="text-xs text-slate-400 mt-2 line-clamp-2">{v.notes}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
                <h2 className="font-semibold text-lg">{editId ? 'Edit Vendor' : 'Add Vendor'}</h2>
                <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-slate-400" /></button>
              </div>
              <form onSubmit={saveVendor} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Name *</label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="e.g. Dell Technologies" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
                    <input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Contact name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="vendor@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="+91 98765 43210" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                    <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="https://example.com" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                    <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"></textarea>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-2 border border-slate-300 rounded-lg text-sm hover:bg-muted/50">Cancel</button>
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
              <h2 className="font-semibold text-lg mb-2">Delete Vendor?</h2>
              <p className="text-sm text-slate-500 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2 border border-slate-300 rounded-lg text-sm hover:bg-muted/50">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Vendors;
