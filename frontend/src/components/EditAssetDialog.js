import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const dateOnly = (v) => (v ? v.slice(0, 10) : '');

const formFromAsset = (asset) => ({
  asset_tag: asset.asset_tag || '',
  serial_number: asset.serial_number || '',
  status: asset.status || 'available',
  location: asset.location || '',
  department_id: asset.department_id || '',
  purchase_date: dateOnly(asset.purchase_date),
  warranty_start_date: dateOnly(asset.warranty_start_date),
  warranty_end_date: dateOnly(asset.warranty_end_date),
  warranty_provider: asset.warranty_provider || '',
  purchase_price: asset.purchase_price || 0,
  depreciation_method: asset.depreciation_method || 'straight_line',
  depreciation_rate: asset.depreciation_rate ?? 20,
  salvage_value: asset.salvage_value || 0,
  expiry_date: dateOnly(asset.expiry_date),
  is_leased: asset.is_leased || false,
  lessor_name: asset.lessor_name || '',
  lease_start_date: dateOnly(asset.lease_start_date),
  lease_end_date: dateOnly(asset.lease_end_date),
  monthly_lease_payment: asset.monthly_lease_payment || 0,
});

/** Edit every field of one asset. Used from the asset details page. */
export function EditAssetDialog({ open, onOpenChange, asset, onSaved }) {
  const [form, setForm] = useState({});
  const [departments, setDepartments] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !asset) return;
    setForm(formFromAsset(asset));
    axios.get(`${API}/departments`).then((res) => setDepartments(res.data)).catch(() => setDepartments([]));
  }, [open, asset]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {};
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) payload[k] = v;
      });
      await axios.patch(`${API}/assets/${asset.id}`, payload);
      toast.success('Asset updated successfully');
      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update asset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="edit-asset-dialog">
        <DialogHeader>
          <DialogTitle>Edit Asset — {asset?.asset_tag}</DialogTitle>
          <DialogDescription>Update any field for this asset</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Asset Tag</Label>
              <Input value={form.asset_tag || ''} onChange={(e) => set({ asset_tag: e.target.value })} />
            </div>
            <div>
              <Label>Serial Number</Label>
              <Input value={form.serial_number || ''} onChange={(e) => set({ serial_number: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={form.status || 'available'} onValueChange={(v) => set({ status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                  <SelectItem value="disposed">Disposed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Input value={form.location || ''} onChange={(e) => set({ location: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Department</Label>
            <Select value={form.department_id || 'none'} onValueChange={(v) => set({ department_id: v === 'none' ? '' : v })}>
              <SelectTrigger><SelectValue placeholder="No department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No department</SelectItem>
                {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Purchase Date</Label>
              <Input type="date" value={form.purchase_date || ''} onChange={(e) => set({ purchase_date: e.target.value })} />
            </div>
            <div>
              <Label>Warranty Start</Label>
              <Input type="date" value={form.warranty_start_date || ''} onChange={(e) => set({ warranty_start_date: e.target.value })} />
            </div>
            <div>
              <Label>Warranty End</Label>
              <Input type="date" value={form.warranty_end_date || ''} onChange={(e) => set({ warranty_end_date: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Warranty Provider</Label>
              <Input value={form.warranty_provider || ''} onChange={(e) => set({ warranty_provider: e.target.value })} />
            </div>
            <div>
              <Label>Purchase Price (₹)</Label>
              <Input type="number" min="0" value={form.purchase_price || 0} onChange={(e) => set({ purchase_price: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Depreciation Method</Label>
              <Select value={form.depreciation_method || 'straight_line'} onValueChange={(v) => set({ depreciation_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="straight_line">Straight Line</SelectItem>
                  <SelectItem value="declining_balance">Declining Balance</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Depreciation Rate (%)</Label>
              <Input type="number" min="0" max="100" value={form.depreciation_rate ?? 20} onChange={(e) => set({ depreciation_rate: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Salvage Value (₹)</Label>
              <Input type="number" min="0" value={form.salvage_value || 0} onChange={(e) => set({ salvage_value: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div>
            <Label>Expiry Date</Label>
            <Input type="date" value={form.expiry_date || ''} onChange={(e) => set({ expiry_date: e.target.value })} className="w-48" />
          </div>
          <div>
            <Label>Ownership Type</Label>
            <Select value={form.is_leased ? 'leased' : 'owned'} onValueChange={(v) => set({ is_leased: v === 'leased' })}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="owned">Owned</SelectItem>
                <SelectItem value="leased">Leased</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.is_leased && (
            <div className="space-y-3 p-3 border border-primary/20 rounded-lg bg-primary/5">
              <p className="text-xs font-semibold text-primary">Lease Details</p>
              <div>
                <Label>Lessor Name</Label>
                <Input value={form.lessor_name || ''} onChange={(e) => set({ lessor_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Lease Start</Label>
                  <Input type="date" value={form.lease_start_date || ''} onChange={(e) => set({ lease_start_date: e.target.value })} />
                </div>
                <div>
                  <Label>Lease End</Label>
                  <Input type="date" value={form.lease_end_date || ''} onChange={(e) => set({ lease_end_date: e.target.value })} />
                </div>
                <div>
                  <Label>Monthly Payment (₹)</Label>
                  <Input type="number" min="0" value={form.monthly_lease_payment || 0} onChange={(e) => set({ monthly_lease_payment: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving} data-testid="save-asset-btn">{saving ? 'Saving...' : 'Save Changes'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
