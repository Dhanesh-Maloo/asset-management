import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';

/** URL encoded in a master QR code. Resolved live, so it never changes when assets are added or moved. */
export const masterQrUrl = (id) => `${window.location.origin}/master-qr/${id}`;

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** Open a print window with a label for one master QR code. */
export const printMasterQr = (master) => {
  const svg = renderToStaticMarkup(
    <QRCodeSVG value={masterQrUrl(master.id)} size={160} level="H" includeMargin />
  );
  const w = window.open('', '_blank');
  if (!w) return false;
  const count = master.asset_count ?? (master.asset_ids || []).length;
  w.document.write(`<!DOCTYPE html><html><head><title>Master QR - ${esc(master.name)}</title>
    <style>
      @page { margin: 0.5cm; }
      body { font-family: Arial, sans-serif; padding: 8px; }
      .label { width: 3.5in; border: 2px solid #000; border-radius: 6px; overflow: hidden; padding: 6px 8px; box-sizing: border-box; text-align: center; }
      .header { background: #1e293b; color: #fff; font-size: 9px; font-weight: bold; letter-spacing: 1.5px; padding: 3px 0; margin: -6px -8px 6px -8px; text-transform: uppercase; }
      .name { font-size: 18px; font-weight: 900; }
      .loc { font-size: 12px; color: #444; margin-top: 2px; }
      .count { font-size: 11px; color: #666; margin-top: 2px; }
      .footer { font-size: 8px; color: #777; margin-top: 4px; }
      svg { width: 160px !important; height: 160px !important; }
    </style></head><body>
    <div class="label">
      <div class="header">Master QR</div>
      ${svg}
      <div class="name">${esc(master.name)}</div>
      ${master.location ? `<div class="loc">${esc(master.location)}</div>` : ''}
      <div class="count">${count} assets</div>
      <div class="footer">Scan to see all assets in this group</div>
    </div></body></html>`);
  w.document.close();
  setTimeout(() => { w.print(); }, 500);
  return true;
};
