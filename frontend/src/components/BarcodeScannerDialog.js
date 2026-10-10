import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';

const READER_ID = 'barcode-scanner-reader';

const FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
];

/**
 * Camera-based barcode / QR scanner in a dialog.
 * Calls onScan(text) once with the first decoded value and closes.
 * Includes a manual entry field as a fallback (no camera, permission denied, HTTP).
 */
export function BarcodeScannerDialog({ open, onOpenChange, onScan, title = 'Scan Barcode / QR' }) {
  const scannerRef = useRef(null);
  const handledRef = useRef(false);
  const [error, setError] = useState('');
  const [manual, setManual] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    handledRef.current = false;
    setError('');
    setManual('');
    let cancelled = false;

    // Dialog content mounts after open; wait a tick so the reader div exists.
    const timer = setTimeout(async () => {
      if (cancelled || !document.getElementById(READER_ID)) return;
      const scanner = new Html5Qrcode(READER_ID, { formatsToSupport: FORMATS, verbose: false });
      scannerRef.current = scanner;
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 160 } },
          (text) => {
            if (handledRef.current) return;
            handledRef.current = true;
            onScan(text.trim());
            onOpenChange(false);
          },
          () => {}
        );
        if (cancelled) await scanner.stop().catch(() => {});
      } catch (e) {
        setError(
          window.isSecureContext
            ? 'Could not access the camera. Allow camera permission, or type the value below.'
            : 'Camera needs HTTPS (or localhost). Type the value below instead.'
        );
      }
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        scanner.stop().then(() => scanner.clear()).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submitManual = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!manual.trim()) return;
    onScan(manual.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="scanner-dialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Point the camera at the serial number barcode or asset QR label.</DialogDescription>
        </DialogHeader>
        <div id={READER_ID} className="w-full overflow-hidden rounded-md bg-black/5 min-h-[200px]" />
        {error && <p className="text-sm text-orange-600">{error}</p>}
        <form onSubmit={submitManual} className="flex gap-2">
          <Input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Or type / use a handheld scanner"
            data-testid="scanner-manual-input"
          />
          <Button type="submit" variant="outline">Use</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
