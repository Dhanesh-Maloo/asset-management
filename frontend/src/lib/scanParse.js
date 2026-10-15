/**
 * Interpret whatever a barcode / QR code contained.
 *
 * Returns { kind, assetId, serial, tag, host }
 *   kind: 'plain' | 'link' | 'data'
 *   - plain: an ordinary barcode (e.g. "SQ7H3KYTWVG"); returned untouched as `serial`
 *   - link:  a URL. We pull the serial out of it when we can; `serial` is '' when we cannot
 *   - data:  JSON or "SN: abc; MODEL: x" style text
 *   assetId is set for this app's own label QR codes (…/assets/<id>).
 */

const SERIAL_KEYS = ['sn', 's/n', 'serial', 'serialno', 'serialnumber', 'serial_number', 'serial-number',
  'servicetag', 'service_tag', 'service-tag', 'st', 'snr', 'svctag'];
const TAG_KEYS = ['assettag', 'asset_tag', 'asset-tag', 'tag'];

const norm = (k) => String(k).toLowerCase().replace(/[\s.]/g, '');
const isSerialKey = (k) => SERIAL_KEYS.includes(norm(k));
const isTagKey = (k) => TAG_KEYS.includes(norm(k));
const clean = (v) => String(v ?? '').trim();

function fromEntries(entries) {
  let serial = '';
  let tag = '';
  entries.forEach(([k, v]) => {
    const val = clean(v);
    if (!val) return;
    if (!serial && isSerialKey(k)) serial = val;
    else if (!tag && isTagKey(k)) tag = val;
  });
  return { serial, tag };
}

function parseLink(value) {
  let url;
  try { url = new URL(value); } catch { return null; }
  if (!/^https?:$/.test(url.protocol)) return null;

  const base = { kind: 'link', assetId: '', serial: '', tag: '', host: url.hostname };

  // This app's own label: …/assets/<id>
  const master = url.pathname.match(/\/master-qr\/([^/]+)\/?$/);
  if (master) return { ...base, masterId: decodeURIComponent(master[1]) };
  const own = url.pathname.match(/\/assets\/([^/]+)\/?$/);
  if (own) return { ...base, assetId: decodeURIComponent(own[1]) };

  // ?sn=… / ?serialnumber=… / ?servicetag=…
  const fromQuery = fromEntries([...url.searchParams.entries()]);
  // Vendor pages often carry it in the path: …/servicetag/ABC123  …/sn/ABC123  …/serial/ABC123
  const segs = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  let fromPath = '';
  for (let i = 0; i < segs.length - 1; i += 1) {
    if (isSerialKey(segs[i])) { fromPath = segs[i + 1]; break; }
  }
  return { ...base, serial: fromQuery.serial || clean(fromPath), tag: fromQuery.tag };
}

function parseJson(value) {
  if (!value.startsWith('{')) return null;
  try {
    const obj = JSON.parse(value);
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      return { kind: 'data', assetId: clean(obj.asset_id || obj.id), ...fromEntries(Object.entries(obj)), host: '' };
    }
  } catch { /* not JSON */ }
  return null;
}

function parseKeyValue(value) {
  // "SN: ABC123; MODEL: X1" / "S/N=ABC123|PN=…" / one pair per line
  const parts = value.split(/[;|\n\r,]+/).map((p) => p.trim()).filter(Boolean);
  const entries = [];
  parts.forEach((p) => {
    const m = p.match(/^([A-Za-z][A-Za-z0-9 _./-]{0,30}?)\s*[:=]\s*(.+)$/);
    if (m) entries.push([m[1], m[2]]);
  });
  if (!entries.length) return null;
  const { serial, tag } = fromEntries(entries);
  if (!serial && !tag) return null;
  return { kind: 'data', assetId: '', serial, tag, host: '' };
}

export function parseScannedValue(raw) {
  const value = clean(raw);
  if (!value) return { kind: 'plain', assetId: '', serial: '', tag: '', host: '' };
  return parseLink(value) || parseJson(value) || parseKeyValue(value)
    || { kind: 'plain', assetId: '', serial: value, tag: '', host: '' };
}
