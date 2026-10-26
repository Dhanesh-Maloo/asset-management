import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ScanLine, ExternalLink, Save, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Statuses that can be set by a plain update. Disposal and checkout have their own flows.
const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_use', label: 'In use' },
  { value: 'under_maintenance', label: 'Under maintenance' },
];

const statusLabel = (s) => (s || '').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

/**
 * Shown after scanning a barcode that matches an asset already in inventory.
 * Lets managers update status / location / assignee right away, without leaving the scan flow.
 * `result` is the response of GET /assets/lookup. `onScanNext` reopens the scanner.
 */
export function ScanResultDialog({ open, onOpenChange, result, users, canManage, onUpdated, onScanNext, onOpenDetails }) {
  const [asset, setAsset] = useState(null);
  const [status, setStatus] = useState('');
  const [location, setLocation] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [assignedName, setAssignedName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!result?.asset) return;
    setAsset(result.asset);
    setStatus(result.asset.status || '');
    setLocation(result.asset.location || '');
    setAssignUserId('');
    setAssignedName(result.assigned_name || '');
  }, [result]);

  if (!asset) return null;

  const changed = {};
  if (status && status !== asset.status) changed.status = status;
  if (location.trim() !== (asset.location || '')) changed.location = location.trim();

  const saveChanges = async () => {
    if (!Object.keys(changed).length) return;
    setSaving(true);
    try {
      const res = await axios.patch(`${API}/assets/${asset.id}`, changed);
      setAsset(res.data);
      toast.success('Asset updated');
      onUpdated?.();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update asset');
    } finally {
      setSaving(false);
    }
  };

  const assign = async () => {
    if (!assignUserId) return;
    setSaving(true);
    try {
      const res = await axios.patch(`${API}/assets/${asset.id}/assign`, { assigned_to: assignUserId });
      const u = users.find((x) => x.id === assignUserId);
      setAsset(res.data);
      setStatus(res.data.status);
      setAssignedName(u?.name || u?.email || '');
      setAssignUserId('');
      toast.success(`Assigned to ${u?.name || 'user'}`);
      onUpdated?.();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to assign asset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="scan-result-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {asset.asset_tag}
            <Badge variant="outline">{statusLabel(asset.status)}</Badge>
          </DialogTitle>
          <DialogDescription>Already in your inventory.</DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Product</dt>
          <dd className="font-medium">{result?.product_name || '—'}</dd>
          <dt className="text-muted-foreground">Serial number</dt>
          <dd className="font-mono break-all">{asset.serial_number}</dd>
          <dt className="text-muted-foreground">Location</dt>
          <dd>{asset.location || '—'}</dd>
          <dt className="text-muted-foreground">Assigned to</dt>
          <dd>{assignedName || '—'}</dd>
        </dl>

        {canManage && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger data-testid="scan-result-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    {!STATUS_OPTIONS.some((o) => o.value === asset.status) && (
                      <SelectItem value={asset.status} disabled>{statusLabel(asset.status)}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={200} data-testid="scan-result-location" />
              </div>
            </div>
            <Button onClick={saveChanges} disabled={saving || !Object.keys(changed).length} className="w-full" data-testid="scan-result-save">
              <Save className="h-4 w-4 mr-2" /> Save changes
            </Button>

            {users?.length > 0 && (
              <div className="flex gap-2">
                <Select value={assignUserId} onValueChange={setAssignUserId}>
                  <SelectTrigger data-testid="scan-result-assign-select"><SelectValue placeholder="Assign to…" /></SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}{u.employee_id ? ` [${u.employee_id}]` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={assign} disabled={saving || !assignUserId} data-testid="scan-result-assign">
                  <UserPlus className="h-4 w-4 mr-1" /> Assign
                </Button>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenDetails?.(asset.id)}>
            <ExternalLink className="h-4 w-4 mr-2" /> Full details
          </Button>
          <Button variant="outline" onClick={onScanNext} data-testid="scan-result-next">
            <ScanLine className="h-4 w-4 mr-2" /> Scan next
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
