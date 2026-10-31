import React, { useEffect, useRef, useState } from 'react';
import { createWorker } from 'tesseract.js';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Loader2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const BRANDS = ['Lenovo', 'Dell', 'HP', 'Hewlett', 'Apple', 'Asus', 'Acer', 'Samsung', 'LG', 'Logitech', 'Microsoft',
  'Cisco', 'Huawei', 'MSI', 'Toshiba', 'Epson', 'Canon', 'Brother', 'Zebra', 'Jabra', 'Poly', 'Netgear', 'TP-Link'];

const MAX_SIDE = 1800;
const BARCODE_ELEMENT_ID = 'label-barcode-reader';

/** Downscale + grayscale + contrast stretch: makes OCR faster and more reliable on phone photos. */
async function prepareImage(file) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  let min = 255; let max = 0;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = g;
    if (g < min) min = g;
    if (g > max) max = g;
  }
  const range = Math.max(1, max - min);
  for (let i = 0; i < d.length; i += 4) {
    const v = ((d[i] - min) / range) * 255;
    d[i] = v; d[i + 1] = v; d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** Return a copy of the canvas rotated by 90, 180 or 270 degrees clockwise. */
function rotateCanvas(src, deg) {
  if (deg === 0) return src;
  const swap = deg === 90 || deg === 270;
  const out = document.createElement('canvas');
  out.width = swap ? src.height : src.width;
  out.height = swap ? src.width : src.height;
  const ctx = out.getContext('2d');
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  return out;
}

const canvasToFile = (canvas) => new Promise((resolve) => {
  canvas.toBlob((b) => resolve(new File([b], 'label.png', { type: 'image/png' })), 'image/png');
});

/** Try to decode a barcode/QR from the photo in each orientation. Returns the first value found or ''. */
async function decodeBarcodeFromCanvas(canvas, elementId) {
  for (const deg of [0, 90, 270, 180]) {
    try {
      const reader = new Html5Qrcode(elementId, { verbose: false });
      const text = await reader.scanFile(await canvasToFile(rotateCanvas(canvas, deg)), false);
      reader.clear();
      if (text) return text.trim().toUpperCase();
    } catch { /* nothing in this orientation */ }
  }
  return '';
}

/** Pull likely serial numbers and brand out of raw OCR text. */
export function parseLabelText(text) {
  const clean = text.replace(/[|]/g, 'I');
  const labelled = [];
  const re = /(?:S\s*\/\s*N|SN|Serial(?:\s*(?:No\.?|Number|#))?|Service\s*Tag)\s*[:#.\-]?\s*([A-Z0-9][A-Z0-9\-]{4,24})/gi;
  let m;
  while ((m = re.exec(clean)) !== null) labelled.push(m[1].toUpperCase());

  // Part / model numbers look like serials but are not: never offer them as candidates.
  const notSerial = new Set();
  const partRe = /(?:\(1P\)\s*(?:Part\s*No\.?)?|Part\s*No\.?|P\/N|Model\s*No\.?|MTM)\s*[:#.\-]?\s*([A-Z0-9][A-Z0-9\-]{3,24})/gi;
  while ((m = partRe.exec(clean)) !== null) notSerial.add(m[1].toUpperCase());

  // Fallback candidates: mixed letters+digits tokens, 6–20 chars
  const loose = (clean.match(/\b[A-Z0-9][A-Z0-9\-]{5,19}\b/gi) || [])
    .map((t) => t.toUpperCase())
    .filter((t) => /[A-Z]/.test(t) && /\d/.test(t) && !labelled.includes(t) && !notSerial.has(t));

  const brand = BRANDS.find((b) => new RegExp(`\\b${b}\\b`, 'i').test(clean)) || '';
  return { labelled, loose: [...new Set(loose)].slice(0, 8), brand: brand === 'Hewlett' ? 'HP' : brand };
}

/** Suggest the catalog product whose name words best match the OCR text. */
function matchProduct(products, text) {
  const hay = text.toLowerCase();
  let best = null;
  let bestScore = 0;
  Object.values(products).forEach((p) => {
    const words = (p.name || '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
    if (!words.length) return;
    const hits = words.filter((w) => hay.includes(w)).length;
    const score = hits / words.length;
    if (hits >= 1 && score >= 0.5 && score + hits * 0.01 > bestScore) {
      best = p;
      bestScore = score + hits * 0.01;
    }
  });
  return best;
}

/**
 * Free, in-browser OCR (Tesseract.js): photograph a box or sticker, review what was read, then apply.
 * Nothing is uploaded to a server. Results are suggestions; the user confirms before applying.
 */
export function LabelPhotoDialog({ open, onOpenChange, products, onApply }) {
  const fileRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | reading | done | error
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState('');
  const [rawText, setRawText] = useState('');
  const [candidates, setCandidates] = useState({ labelled: [], loose: [], brand: '' });
  const [serial, setSerial] = useState('');
  const [productId, setProductId] = useState('');
  const [error, setError] = useState('');
  const [stage, setStage] = useState('');

  useEffect(() => {
    if (open) {
      setStatus('idle'); setProgress(0); setPreview(''); setRawText('');
      setCandidates({ labelled: [], loose: [], brand: '' }); setSerial(''); setProductId(''); setError('');
    }
  }, [open]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setStatus('reading'); setProgress(0); setError(''); setStage('');
    let worker;
    try {
      const canvas = await prepareImage(file);
      worker = await createWorker('eng', 1, {
        logger: (m) => { if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100)); },
      });

      // Boxes are often photographed sideways: try upright first, then rotated, stop once a serial is found.
      let best = { text: '', parsed: { labelled: [], loose: [], brand: '' } };
      for (const deg of [0, 90, 270, 180]) {
        setStage(deg === 0 ? '' : `rotated ${deg}°`);
        setProgress(0);
        const { data } = await worker.recognize(rotateCanvas(canvas, deg));
        const text = data.text || '';
        const parsed = parseLabelText(text);
        const better = parsed.labelled.length > best.parsed.labelled.length ||
          (best.parsed.labelled.length === 0 && text.length > best.text.length);
        if (better) best = { text, parsed };
        if (parsed.labelled.length > 0) break;
      }

      // Barcodes are more reliable than OCR: add whatever the photo's barcode decodes to.
      setStage('barcode');
      const barcode = await decodeBarcodeFromCanvas(canvas, BARCODE_ELEMENT_ID);
      const { parsed, text } = best;
      let barcodeSerials = [];
      if (barcode) {
        // Labels use a leading "S" data identifier for serials (barcode "SQ7H…" = serial "Q7H…").
        const known = [...parsed.labelled, ...parsed.loose];
        const stripped = barcode.startsWith('S') ? barcode.slice(1) : '';
        if (stripped && known.includes(stripped)) barcodeSerials = [];
        else barcodeSerials = [barcode];
      }
      const merged = { ...parsed, labelled: [...parsed.labelled, ...barcodeSerials.filter((c) => !parsed.labelled.includes(c))] };

      setRawText(text + (barcode ? `\n\n[barcode] ${barcode}` : ''));
      setCandidates(merged);
      setSerial(merged.labelled[0] || '');
      const match = matchProduct(products, text);
      if (match) setProductId(match.id);
      setStatus('done');
    } catch (err) {
      setError('Could not read the photo. Try a closer, well-lit, sharp photo, or type the details.');
      setStatus('error');
    } finally {
      if (worker) worker.terminate().catch(() => {});
    }
  };

  const apply = () => {
    const s = serial.trim();
    if (!s) return;
    onApply({ serial_number: s, product_id: productId || '' });
    onOpenChange(false);
  };

  const chips = [...candidates.labelled, ...candidates.loose];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="label-photo-dialog">
        <DialogHeader>
          <DialogTitle>Read label from photo</DialogTitle>
          <DialogDescription>
            Take or choose a photo of the box or sticker. Text is read on your device (free, nothing is uploaded).
          </DialogDescription>
        </DialogHeader>

        <div id={BARCODE_ELEMENT_ID} className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true" />
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} data-testid="label-photo-input" />
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={status === 'reading'}>
          <Camera className="h-4 w-4 mr-2" />
          {preview ? 'Take / choose another photo' : 'Take / choose photo'}
        </Button>

        {preview && <img src={preview} alt="Label preview" className="max-h-40 rounded-md border object-contain bg-muted" />}

        {status === 'reading' && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading text{stage ? ` (${stage})` : ''}… {progress > 0 ? `${progress}%` : '(first time downloads the reader, ~10 MB)'}
          </p>
        )}
        {status === 'error' && <p className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-1"><AlertTriangle className="h-4 w-4" />{error}</p>}

        {status === 'done' && (
          <div className="space-y-3">
            <div>
              <Label>Serial number *</Label>
              <Input value={serial} onChange={(e) => setSerial(e.target.value.toUpperCase())} className="font-mono" placeholder="Pick one below or type it" data-testid="label-serial-input" />
              {chips.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {chips.map((c) => (
                    <button key={c} type="button" onClick={() => setSerial(c)}
                      className={`font-mono text-xs px-2 py-1 rounded border ${serial === c ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">No serial found. Check the text below or retake the photo.</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Check carefully: OCR can mix up O/0 and I/1.</p>
            </div>

            <div>
              <Label>Product {candidates.brand && <span className="text-xs text-muted-foreground">(detected brand: {candidates.brand})</span>}</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger><SelectValue placeholder="Select product (optional)" /></SelectTrigger>
                <SelectContent>
                  {Object.values(products).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">Text read from photo</summary>
              <pre className="mt-1 whitespace-pre-wrap rounded bg-muted p-2 max-h-40 overflow-y-auto">{rawText || '(nothing read)'}</pre>
            </details>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={apply} disabled={status !== 'done' || !serial.trim()} data-testid="label-apply-btn">Use this</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
