import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Printer, Pencil, X, Check, Globe, Lock } from 'lucide-react';
import { masterQrUrl, printMasterQr } from '../lib/masterQr';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MasterQRDetail = () => {
  const { masterId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [master, setMaster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', location: '' });
  const canManage = ['super_admin', 'tenant_admin', 'asset_manager'].includes(user?.role);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/master-qrs/${masterId}`);
      setMaster(res.data);
    } catch (e) {
      toast.error(e.response?.status === 404 ? 'Master QR not found' : 'Failed to load master QR');
      setMaster(null);
    } finally {
      setLoading(false);
    }
  }, [masterId]);

  useEffect(() => { load(); }, [load]);

  const startEdit = () => { setForm({ name: master.name, location: master.location || '' }); setEditing(true); };

  const saveEdit = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    try {
      await axios.put(`${API}/master-qrs/${masterId}`, { name: form.name.trim(), location: form.location.trim() });
      setEditing(false);
      toast.success('Updated');
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update');
    }
  };

  const togglePublic = async () => {
    try {
      await axios.put(`${API}/master-qrs/${masterId}`, { is_public: !master.is_public });
      toast.success(master.is_public ? 'Now login-only' : 'Now public');
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update');
    }
  };

  const removeAsset = async (asset) => {
    if (master.assets.length <= 1) { toast.error('A master QR needs at least one asset. Delete the QR instead.'); return; }
    try {
      await axios.put(`${API}/master-qrs/${masterId}`, { asset_ids: master.assets.filter((a) => a.id !== asset.id).map((a) => a.id) });
      toast.success(`${asset.asset_tag} removed from this QR`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to remove asset');
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="space-y-4" aria-busy="true" aria-label="Loading">
        <div className="h-8 w-56 shimmer rounded-md" />
        <div className="h-48 shimmer rounded-lg" />
        <div className="h-32 shimmer rounded-lg" />
      </div>
    </DashboardLayout>
  );
  if (!master) {
    return (
      <DashboardLayout>
        <Button variant="outline" onClick={() => navigate('/master-qrs')}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="master-qr-detail">
        <button onClick={() => navigate('/master-qrs')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Master QR Codes
        </button>

        <Card>
          <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shrink-0">
              <QRCodeSVG value={masterQrUrl(master.id)} size={160} level="H" includeMargin />
            </div>
            <div className="flex-1 min-w-0 w-full">
              {editing ? (
                <div className="space-y-2 max-w-md">
                  <Input value={form.name} maxLength={200} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" />
                  <Input value={form.location} maxLength={200} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit}><Check className="h-4 w-4 mr-1" />Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(false)}><X className="h-4 w-4 mr-1" />Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold">{master.name}</h1>
                  {master.location && <p className="text-slate-500 mt-1 flex items-center gap-1"><MapPin className="h-4 w-4" />{master.location}</p>}
                  <p className="text-sm text-slate-500 mt-1">{master.asset_count} assets · created {new Date(master.created_at).toLocaleDateString()}</p>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => printMasterQr(master)}><Printer className="h-4 w-4 mr-2" />Print Label</Button>
                    {canManage && (
                      <Button variant="outline" onClick={togglePublic} title="Toggle whether anyone can view this without logging in">
                        {master.is_public ? <><Globe className="h-4 w-4 mr-2" />Public</> : <><Lock className="h-4 w-4 mr-2" />Login only</>}
                      </Button>
                    )}
                    {canManage && <Button variant="outline" onClick={startEdit}><Pencil className="h-4 w-4 mr-2" />Edit</Button>}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Assets in this group</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Tag</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Serial</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  {canManage && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {master.assets.map((a) => (
                  <TableRow key={a.id} className="cursor-pointer" onClick={() => navigate(`/assets/${a.id}`)}>
                    <TableCell className="font-medium">{a.asset_tag}</TableCell>
                    <TableCell>{a.product_name || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{a.serial_number}</TableCell>
                    <TableCell><Badge variant="outline">{String(a.status || '').replace(/_/g, ' ')}</Badge></TableCell>
                    <TableCell>{a.location || '-'}</TableCell>
                    {canManage && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => removeAsset(a)} title="Remove from this QR" className="p-1 text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {master.asset_ids.length > master.assets.length && (
              <p className="text-xs text-muted-foreground mt-3">{master.asset_ids.length - master.assets.length} asset(s) in this group were deleted and are hidden.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MasterQRDetail;
