import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, MapPin, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const emptyForm = { name: '', building: '', floor: '', room: '', tenant_id: '' };

const Locations = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const canEdit = ['super_admin', 'tenant_admin', 'asset_manager'].includes(user?.role);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await axios.get(`${API}/locations`);
      setLocations(res.data);
    } catch {
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({ ...emptyForm, tenant_id: user?.tenant_id || '' });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (loc) => {
    setForm({ name: loc.name, building: loc.building || '', floor: loc.floor || '', room: loc.room || '', tenant_id: loc.tenant_id });
    setEditId(loc.id);
    setShowForm(true);
  };

  const saveLocation = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editId) {
        await axios.put(`${API}/locations/${editId}`, { name: form.name, building: form.building, floor: form.floor, room: form.room });
        toast.success('Location updated');
      } else {
        await axios.post(`${API}/locations`, form);
        toast.success('Location created');
      }
      setShowForm(false);
      fetchLocations();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API}/locations/${deleteId}`);
      toast.success('Location deleted');
      setDeleteId(null);
      fetchLocations();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Delete failed');
    }
  };

  const filtered = locations.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.building?.toLowerCase().includes(search.toLowerCase()) ||
    l.floor?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight">Location Master</h1>
            <p className="text-slate-500 mt-1">Manage office locations for asset tracking</p>
          </div>
          {canEdit && (
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" /> Add Location
            </button>
          )}
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search locations..."
            className="w-full max-w-sm border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{locations.length}</div>
            <div className="text-xs text-slate-500 mt-1">Total Locations</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{[...new Set(locations.map(l => l.building).filter(Boolean))].length}</div>
            <div className="text-xs text-slate-500 mt-1">Buildings</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{[...new Set(locations.map(l => l.floor).filter(Boolean))].length}</div>
            <div className="text-xs text-slate-500 mt-1">Floors</div>
          </Card>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 shimmer rounded-md"></div>)}</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <MapPin className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">{search ? 'No locations match your search' : 'No locations added yet'}</p>
              {canEdit && !search && (
                <button onClick={openCreate} className="mt-4 text-primary hover:underline text-sm">Add your first location</button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(loc => (
              <Card key={loc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg mt-0.5">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{loc.name}</p>
                        <div className="text-xs text-slate-500 mt-0.5 space-y-0.5">
                          {loc.building && <p>Building: {loc.building}</p>}
                          {loc.floor && <p>Floor: {loc.floor}</p>}
                          {loc.room && <p>Room: {loc.room}</p>}
                        </div>
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex gap-1 ml-2">
                        <button onClick={() => openEdit(loc)} className="p-1.5 hover:bg-muted rounded text-slate-400 hover:text-slate-700">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(loc.id)} className="p-1.5 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b">
                <h2 className="font-semibold text-lg">{editId ? 'Edit Location' : 'Add Location'}</h2>
                <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-slate-400" /></button>
              </div>
              <form onSubmit={saveLocation} className="p-5 space-y-4">
                {[
                  { key: 'name', label: 'Location Name *', placeholder: 'e.g. Server Room B' },
                  { key: 'building', label: 'Building', placeholder: 'e.g. Building A' },
                  { key: 'floor', label: 'Floor', placeholder: 'e.g. 2nd Floor' },
                  { key: 'room', label: 'Room / Desk', placeholder: 'e.g. Room 201' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
                    <input value={form[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                ))}
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
              <h2 className="font-semibold text-lg mb-2">Delete Location?</h2>
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

export default Locations;
