import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Printer, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { masterQrUrl, printMasterQr } from '../lib/masterQr';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Create a master QR code for the given assets.
 * Asks for a name and a location (suggests saved locations, or any free text).
 */
export const MasterQRDialog = ({ open, onOpenChange, assets, onCreated }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [savedLocations, setSavedLocations] = useState([]);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (!open) return;
    setCreated(null);
    setName('');
    setIsPublic(true);
    // Pre-fill when every selected asset is already in the same place
    const locs = [...new Set(assets.map((a) => (a.location || '').trim()).filter(Boolean))];
    setLocation(locs.length === 1 && assets.every((a) => (a.location || '').trim()) ? locs[0] : '');
    axios.get(`${API}/locations`).then((r) => setSavedLocations(r.data)).catch(() => setSavedLocations([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Give this QR a name'); return; }
    setSaving(true);
    try {
      const res = await axios.post(`${API}/master-qrs`, {
        name: name.trim(),
        location: location.trim(),
        asset_ids: assets.map((a) => a.id),
        is_public: isPublic,
      });
      setCreated(res.data);
      onCreated?.(res.data);
      toast.success('Master QR created');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create master QR');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="master-qr-dialog">
        {!created ? (
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create Master QR for {assets.length} asset{assets.length === 1 ? '' : 's'}</DialogTitle>
              <DialogDescription>One QR code that opens the list of all selected assets.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="mq-name">Name *</Label>
                <Input id="mq-name" value={name} maxLength={200} autoFocus onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chiller Room Equipment" data-testid="master-qr-name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mq-location">Location</Label>
                <Input id="mq-location" value={location} maxLength={200} list="mq-locations"
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Warehouse, Chiller, Home" data-testid="master-qr-location" />
                <datalist id="mq-locations">
                  {savedLocations.map((l) => <option key={l.id} value={l.name} />)}
                </datalist>
                <p className="text-xs text-muted-foreground">Pick a saved location or type a new one. Shown on the label.</p>
              </div>
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="mt-1" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} data-testid="master-qr-public" />
                <span>
                  Anyone who scans can view it (no login)
                  <span className="block text-xs text-muted-foreground">Shows asset tag, product, status and location only. Never serial numbers, prices or assigned users.</span>
                </span>
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} data-testid="master-qr-create-btn">
                {saving ? 'Creating...' : 'Create Master QR'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Master QR ready</DialogTitle>
              <DialogDescription>Saved under Master QR Codes in the sidebar. Print it and stick it on the room, shelf or box.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl">
                <QRCodeSVG value={masterQrUrl(created.id)} size={180} level="H" includeMargin />
              </div>
              <p className="font-bold text-lg">{created.name}</p>
              {created.location && <p className="text-sm text-muted-foreground">{created.location}</p>}
              <p className="text-xs text-muted-foreground">{created.asset_count} assets</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => navigate(`/master-qr/${created.id}`)}>
                <QrCode className="h-4 w-4 mr-2" /> Open
              </Button>
              <Button onClick={() => printMasterQr(created)}>
                <Printer className="h-4 w-4 mr-2" /> Print Label
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
