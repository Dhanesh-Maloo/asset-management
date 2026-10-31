import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AlertTriangle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Check = ({ checked, onChange, children, testId }) => (
  <label className="flex items-start gap-2 text-sm cursor-pointer">
    <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={checked} onChange={(e) => onChange(e.target.checked)} data-testid={testId} />
    <span>{children}</span>
  </label>
);

/** Exit checklist for a leaving employee: take back the assets they hold, then optionally deactivate the account. */
export const OffboardDialog = ({ employee, canDeactivate, onClose, onDone }) => {
  const [data, setData] = useState(null);
  const [returned, setReturned] = useState({});
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [deactivate, setDeactivate] = useState(false);
  const [force, setForce] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!employee) return undefined;
    let cancelled = false;
    setData(null);
    setLocation('');
    setNotes('');
    setDeactivate(false);
    setForce(false);
    axios.get(`${API}/users/${employee.id}/offboarding`)
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        setReturned(Object.fromEntries(res.data.assets.map((a) => [a.id, true])));
      })
      .catch((e) => {
        toast.error(e.response?.data?.detail || 'Could not load the checklist');
        onClose();
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee?.id]);

  const selectedIds = data ? data.assets.filter((a) => returned[a.id]).map((a) => a.id) : [];
  const notReturned = data ? data.assets.length - selectedIds.length : 0;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await axios.post(`${API}/users/${employee.id}/offboard`, {
        returned_asset_ids: selectedIds,
        location: location.trim(),
        notes: notes.trim(),
        deactivate,
        force,
      });
      const parts = [`${res.data.returned} asset(s) taken back`];
      if (res.data.deactivated) parts.push('account deactivated');
      toast.success(parts.join(', '));
      onDone();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Offboarding failed');
    } finally {
      setSaving(false);
    }
  };

  const otherItems = data
    ? [
        data.open_tickets && `${data.open_tickets} open ticket(s) assigned to them`,
        data.open_orders && `${data.open_orders} order(s) still open`,
        data.open_reservations && `${data.open_reservations} active reservation(s)`,
      ].filter(Boolean)
    : [];

  return (
    <Dialog open={!!employee} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg" data-testid="offboard-dialog">
        <DialogHeader>
          <DialogTitle>Offboard {employee?.name}</DialogTitle>
          <DialogDescription>Take back what they hold. Untick anything that was not handed over.</DialogDescription>
        </DialogHeader>

        {!data ? (
          <div className="space-y-2 py-2" aria-busy="true">
            {[...Array(3)].map((_, i) => <div key={i} className="h-10 shimmer rounded-md" />)}
          </div>
        ) : (
          <div className="space-y-4 py-1">
            <div>
              <Label className="mb-2 block">Assets held ({data.assets.length})</Label>
              {data.assets.length === 0 ? (
                <p className="text-sm text-muted-foreground">They are not holding any assets.</p>
              ) : (
                <div className="space-y-1.5 max-h-52 overflow-y-auto rounded-md border border-border p-2">
                  {data.assets.map((a) => (
                    <Check key={a.id} checked={!!returned[a.id]} onChange={(v) => setReturned((r) => ({ ...r, [a.id]: v }))} testId={`offboard-asset-${a.id}`}>
                      <span className="font-mono font-medium">{a.asset_tag}</span>
                      {a.product_name && <span className="ml-2 text-muted-foreground">{a.product_name}</span>}
                      <span className="ml-2 text-xs text-muted-foreground capitalize">{(a.status || '').replace(/_/g, ' ')}</span>
                    </Check>
                  ))}
                </div>
              )}
            </div>

            {selectedIds.length > 0 && (
              <div>
                <Label>Store them at (optional)</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. IT Store, Mumbai" data-testid="offboard-location" />
              </div>
            )}
            <div>
              <Label>Notes (optional)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Last working day 30 Nov" />
            </div>

            {otherItems.length > 0 && (
              <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-800 dark:text-amber-300 flex gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  Still linked to them: {otherItems.join(', ')}. Reassign these separately.
                </div>
              </div>
            )}

            {canDeactivate && (
              <div className="space-y-2 pt-1 border-t border-border">
                <Check checked={deactivate} onChange={setDeactivate} testId="offboard-deactivate">
                  Deactivate their account (they can no longer sign in)
                </Check>
                {deactivate && notReturned > 0 && (
                  <Check checked={force} onChange={setForce} testId="offboard-force">
                    <span className="text-destructive">{notReturned} asset(s) not handed back: deactivate anyway</span>
                  </Check>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!data || saving || (!selectedIds.length && !deactivate) || (deactivate && notReturned > 0 && !force)}
            data-testid="confirm-offboard"
          >
            {saving ? 'Working…' : 'Complete offboarding'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OffboardDialog;
