import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Flashlight, FlashlightOff } from 'lucide-react';

const READER_ID = 'barcode-scanner-reader';

/** Wide scan box sized from the live video: serial barcodes are long and thin, so use most of the width. */
const scanBox = (viewW, viewH) => {
  const width = Math.max(120, Math.floor(viewW * 0.85));
  const height = Math.max(80, Math.min(Math.floor(viewH * 0.55), Math.floor(width * 0.5)));
  return { width, height };
};

/** HD back-camera stream with continuous autofocus where the phone supports it. */
const VIDEO_CONSTRAINTS = {
  facingMode: 'environment',
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  advanced: [{ focusMode: 'continuous' }],
};

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
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomRange, setZoomRange] = useState(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!open) return undefined;
    handledRef.current = false;
    setError('');
    setManual('');
    setTorchSupported(false);
    setTorchOn(false);
    setZoomRange(null);
    let cancelled = false;

    // Dialog content mounts after open; wait a tick so the reader div exists.
    const timer = setTimeout(async () => {
      if (cancelled || !document.getElementById(READER_ID)) return;
      const scanner = new Html5Qrcode(READER_ID, {
        formatsToSupport: FORMATS,
        verbose: false,
        // use the phone's built-in (much faster / more accurate) barcode detector when available
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      });
      scannerRef.current = scanner;
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 15, qrbox: scanBox, videoConstraints: VIDEO_CONSTRAINTS },
          (text) => {
            if (handledRef.current) return;
            handledRef.current = true;
            try { navigator.vibrate?.(120); } catch (e) { /* vibration not supported */ }
            onScan(text.trim());
            onOpenChange(false);
          },
          () => {}
        );
        if (cancelled) { await scanner.stop().catch(() => {}); return; }
        try {
          const caps = scanner.getRunningTrackCapabilities?.() || {};
          setTorchSupported(!!caps.torch);
          if (caps.zoom && caps.zoom.max > caps.zoom.min) {
            setZoomRange({ min: caps.zoom.min, max: Math.min(caps.zoom.max, 5), step: caps.zoom.step || 0.1 });
            setZoom(caps.zoom.min);
          }
        } catch (e) { /* capabilities unavailable on this browser */ }
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

  const toggleTorch = async () => {
    const next = !torchOn;
    try {
      await scannerRef.current?.applyVideoConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch (e) {
      setTorchSupported(false);
    }
  };

  const changeZoom = async (value) => {
    setZoom(value);
    try {
      await scannerRef.current?.applyVideoConstraints({ advanced: [{ zoom: value }] });
    } catch (e) { /* zoom not applicable */ }
  };

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
          <DialogDescription>Hold the phone 15–25 cm away and keep the barcode inside the box. Use the light or zoom if it won't read. Printed text without a barcode can't be scanned here — use the label photo option.</DialogDescription>
        </DialogHeader>
        <div id={READER_ID} className="w-full overflow-hidden rounded-md bg-black/5 min-h-[200px]" />
        {error && <p className="text-sm text-orange-600">{error}</p>}
        {(torchSupported || zoomRange) && (
          <div className="flex items-center gap-3">
            {torchSupported && (
              <Button type="button" variant={torchOn ? 'default' : 'outline'} size="sm" onClick={toggleTorch} data-testid="scanner-torch">
                {torchOn ? <FlashlightOff className="h-4 w-4 mr-1" /> : <Flashlight className="h-4 w-4 mr-1" />}
                {torchOn ? 'Light off' : 'Light on'}
              </Button>
            )}
            {zoomRange && (
              <label className="flex flex-1 items-center gap-2 text-xs text-muted-foreground">
                Zoom
                <input
                  type="range"
                  className="flex-1"
                  min={zoomRange.min}
                  max={zoomRange.max}
                  step={zoomRange.step}
                  value={zoom}
                  onChange={(e) => changeZoom(parseFloat(e.target.value))}
                  data-testid="scanner-zoom"
                />
              </label>
            )}
          </div>
        )}
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
