import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ScanLine, Trash2, AlertTriangle, CheckCircle, Camera } from 'lucide-react';
import { LabelPhotoDialog } from './LabelPhotoDialog';
import { parseScannedValue } from '../lib/scanParse';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const emptyShared = { product_id: '', location: '', purchase_date: '', purchase_price: 0 };

/**
 * Bulk "scan to add" for hardware barcode scanners (USB / Bluetooth).
 * A scanner types the serial like a keyboard and presses Enter; each scan adds a row.
 * Product, location and purchase date are entered once and shared by every scanned unit.
 */
export function ScanToAddDialog({ open, onOpenChange, products, existingSerials, onCreated }) {
  const scanRef = useRef(null);
  const [shared, setShared] = useState(emptyShared);
  const [scanValue, setScanValue] = useState('');
  const [rows, setRows] = useState([]); // { serial, tag }
  const [saving, setSaving] = useState(false);
  const [skipped, setSkipped] = useState([]);
  const [lastMsg, setLastMsg] = useState(null); // { type: 'ok' | 'warn', text }
  const [labelOpen, setLabelOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setShared(emptyShared);
      setScanValue('');
      setRows([]);
      setSkipped([]);
      setLastMsg(null);
    }
  }, [open]);

  // A scanner types into whatever has focus. After the user clicks a dropdown or button,
  // send printable keystrokes back to the scan box (unless they are typing in another field).
  useEffect(() => {
    if (!open) return undefined;
    const redirect = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return;
      scanRef.current?.focus();
    };
    document.addEventListener('keydown', redirect);
    return () => document.removeEventListener('keydown', redirect);
  }, [open]);

  const refocus = () => setTimeout(() => scanRef.current?.focus(), 50);

  const addSerial = (input) => {
    // A QR code may hold a link or "SN: …" text; plain barcodes pass through unchanged.
    const parsed = parseScannedValue(input);
    const serial = parsed.serial;
    if (!serial) {
      setLastMsg({ type: 'warn', text: parsed.kind === 'link' ? `Link (${parsed.host}) has no serial number in it` : 'No serial number found' });
      return;
    }
    const lower = serial.toLowerCase();
    if (rows.some((r) => r.serial.toLowerCase() === lower)) {
      setLastMsg({ type: 'warn', text: `${serial} was already scanned` });
      return;
    }
    if (existingSerials.has(lower)) {
      setLastMsg({ type: 'warn', text: `${serial} already exists in your assets` });
      return;
    }
    setRows((prev) => [...prev, { serial, tag: '' }]);
    setLastMsg({ type: 'ok', text: `Added ${serial}` });
  };

  const handleScanKey = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const serial = scanValue.trim();
    if (!serial) return;
    setScanValue('');
    refocus();
    addSerial(serial);
  };

  const handleSave = async () => {
    if (rows.length === 0) return toast.error('Scan at least one serial number');
    if (!shared.product_id) return toast.error('Select a product');
    if (!shared.location.trim()) return toast.error('Location is required');
    if (!shared.purchase_date) return toast.error('Purchase date is required');

    setSaving(true);
    try {
      const res = await axios.post(`${API}/assets/bulk-create`, {
        product_id: shared.product_id,
        location: shared.location.trim(),
        purchase_date: shared.purchase_date,
        purchase_price: shared.purchase_price === '' ? 0 : shared.purchase_price,
        items: rows.map((r) => ({ serial_number: r.serial, asset_tag: r.tag.trim() || null })),
      });
      const { created, skipped: skippedItems } = res.data;
      if (created.length) {
        toast.success(`${created.length} asset${created.length > 1 ? 's' : ''} added`);
        onCreated();
      }
      if (skippedItems.length === 0) {
        onOpenChange(false);
      } else {
        // Keep only the rows that were not created so the user can fix them
        const skippedSerials = new Set(skippedItems.map((s) => s.serial_number.toLowerCase()));
        setRows((prev) => prev.filter((r) => skippedSerials.has(r.serial.toLowerCase())));
        setSkipped(skippedItems);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add assets');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        data-testid="scan-to-add-dialog"
        onOpenAutoFocus={(e) => { e.preventDefault(); scanRef.current?.focus(); }}
      >
        <DialogHeader>
          <DialogTitle>Scan to Add Assets</DialogTitle>
          <DialogDescription>
            Fill the shared details once, then scan each device's serial barcode. Asset tags are generated automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Product *</Label>
            <Select value={shared.product_id} onValueChange={(v) => { setShared({ ...shared, product_id: v }); refocus(); }}>
              <SelectTrigger data-testid="scan-product-select"><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {Object.values(products).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Location *</Label>
            <Input value={shared.location} onChange={(e) => setShared({ ...shared, location: e.target.value })} placeholder="Warehouse, Rack A" maxLength={200} />
          </div>
          <div>
            <Label>Purchase Date *</Label>
            <Input type="date" value={shared.purchase_date} onChange={(e) => setShared({ ...shared, purchase_date: e.target.value })} />
          </div>
          <div>
            <Label>Purchase Price (each)</Label>
            <Input
              type="number" step="0.01" min="0" value={shared.purchase_price}
              onChange={(e) => { const v = e.target.value; setShared({ ...shared, purchase_price: v === '' ? '' : parseFloat(v) || 0 }); }}
            />
          </div>
        </div>

        <div className="rounded-lg bg-slate-900 p-4">
          <div className="flex items-center gap-2 text-white mb-2">
            <ScanLine className="h-4 w-4" />
            <span className="text-sm font-semibold flex-1">Scan serial number</span>
            <Button type="button" size="sm" variant="secondary" className="h-7 text-xs" onClick={() => setLabelOpen(true)} data-testid="scan-label-photo-btn">
              <Camera className="h-3.5 w-3.5 mr-1" /> Photo of label
            </Button>
          </div>
          <Input
            ref={scanRef}
            value={scanValue}
            onChange={(e) => setScanValue(e.target.value)}
            onKeyDown={handleScanKey}
            placeholder="Scan barcode, or type serial and press Enter…"
            className="bg-white/10 text-white placeholder:text-white/40 border-white/20 font-mono"
            data-testid="scan-serial-input"
            autoComplete="off"
          />
          <p className="text-xs text-white/60 mt-2">The scanner types the serial and presses Enter automatically.</p>
          {lastMsg && (
            <p className={`text-xs mt-2 flex items-center gap-1 ${lastMsg.type === 'ok' ? 'text-emerald-400' : 'text-orange-400'}`}>
              {lastMsg.type === 'ok' ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              {lastMsg.text}
            </p>
          )}
        </div>

        {skipped.length > 0 && (
          <div className="rounded-md border border-orange-300 bg-orange-50 dark:bg-orange-950/20 p-3 text-sm">
            <p className="font-medium text-orange-700 dark:text-orange-400 flex items-center gap-1 mb-1">
              <AlertTriangle className="h-4 w-4" /> {skipped.length} not added
            </p>
            <ul className="text-xs text-orange-700 dark:text-orange-400 space-y-0.5">
              {skipped.map((s) => (<li key={s.serial_number}><span className="font-mono">{s.serial_number}</span> — {s.reason}</li>))}
            </ul>
          </div>
        )}

        <div>
          <p className="text-sm font-medium mb-2">Scanned devices ({rows.length})</p>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground border border-dashed rounded-md p-4 text-center">Nothing scanned yet</p>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {rows.map((r, i) => (
                <div key={r.serial} className="flex items-center gap-2">
                  <span className="w-6 text-xs text-muted-foreground text-right">{i + 1}</span>
                  <span className="font-mono text-sm flex-1 truncate" title={r.serial}>{r.serial}</span>
                  <Input
                    className="h-8 w-40 text-xs"
                    placeholder="Asset tag (auto)"
                    value={r.tag}
                    maxLength={100}
                    onChange={(e) => setRows((prev) => prev.map((x) => (x.serial === r.serial ? { ...x, tag: e.target.value } : x)))}
                  />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label={`Remove ${r.serial}`}
                    onClick={() => { setRows((prev) => prev.filter((x) => x.serial !== r.serial)); refocus(); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <LabelPhotoDialog
          open={labelOpen}
          onOpenChange={(v) => { setLabelOpen(v); if (!v) refocus(); }}
          products={products}
          onApply={({ serial_number, product_id }) => {
            if (product_id && !shared.product_id) setShared((s) => ({ ...s, product_id }));
            addSerial(serial_number);
          }}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handleSave} disabled={saving || rows.length === 0} data-testid="scan-save-btn">
            {saving ? 'Adding…' : `Add ${rows.length || ''} asset${rows.length === 1 ? '' : 's'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
