import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import { QrCode, MapPin, Printer, Trash2, Search } from 'lucide-react';
import { masterQrUrl, printMasterQr } from '../lib/masterQr';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MasterQRs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const canManage = ['super_admin', 'tenant_admin', 'asset_manager'].includes(user?.role);

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API}/master-qrs`);
      setItems(res.data);
    } catch {
      toast.error('Failed to load master QR codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete master QR "${item.name}"? The assets are not affected, but the printed QR will stop working.`)) return;
    try {
      await axios.delete(`${API}/master-qrs/${item.id}`);
      toast.success('Master QR deleted');
      fetchItems();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to delete');
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = items.filter((i) => !q || i.name.toLowerCase().includes(q) || (i.location || '').toLowerCase().includes(q));

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="master-qrs-page">
        <div>
          <h1 className="text-3xl font-bold">Master QR Codes</h1>
          <p className="text-slate-500 mt-1">One QR code for a whole room, shelf or box of assets. Create them from the Assets page: select assets, then Master QR.</p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or location..."
            className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>

        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading">
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 shimmer rounded-md" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <QrCode className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">{search ? 'No master QR codes match your search' : 'No master QR codes yet'}</p>
              {canManage && !search && (
                <button onClick={() => navigate('/assets')} className="mt-4 text-primary hover:underline text-sm">Go to Assets to create one</button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow" data-testid="master-qr-card">
                <CardContent className="p-4 flex gap-4">
                  <button onClick={() => navigate(`/master-qr/${item.id}`)} className="p-2 bg-white border rounded-lg shrink-0 self-start">
                    <QRCodeSVG value={masterQrUrl(item.id)} size={88} level="M" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <button onClick={() => navigate(`/master-qr/${item.id}`)} className="font-semibold text-sm text-left hover:underline truncate block max-w-full">
                      {item.name}
                    </button>
                    {item.location && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{item.location}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">{item.asset_count} assets</p>
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(item.created_at).toLocaleDateString()}</p>
                    <div className="flex gap-1 mt-2">
                      <button onClick={() => printMasterQr(item)} title="Print label" className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground">
                        <Printer className="h-4 w-4" />
                      </button>
                      {canManage && (
                        <button onClick={() => handleDelete(item)} title="Delete" className="p-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MasterQRs;
