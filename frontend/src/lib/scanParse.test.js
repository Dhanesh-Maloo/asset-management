import { parseScannedValue } from './scanParse';

describe('parseScannedValue', () => {
  test('plain barcode is returned untouched (incl. leading S)', () => {
    expect(parseScannedValue('SQ7H3KYTWVG')).toMatchObject({ kind: 'plain', serial: 'SQ7H3KYTWVG' });
    expect(parseScannedValue('  PF3XK9LM \n')).toMatchObject({ kind: 'plain', serial: 'PF3XK9LM' });
  });

  test('plain serial containing a colon-free dash/number stays plain', () => {
    expect(parseScannedValue('DELL-SN-001234')).toMatchObject({ kind: 'plain', serial: 'DELL-SN-001234' });
  });

  test("this app's own label QR gives the asset id", () => {
    expect(parseScannedValue('https://asset.example.com/assets/abc-123')).toMatchObject({ kind: 'link', assetId: 'abc-123', serial: '' });
    expect(parseScannedValue('http://localhost:3000/assets/9f1c2d3e-aaaa-bbbb-cccc-1234567890ab')).toMatchObject({ assetId: '9f1c2d3e-aaaa-bbbb-cccc-1234567890ab' });
  });

  test('vendor link with serial in the query string', () => {
    expect(parseScannedValue('https://support.example.com/warranty?serialnumber=PF3XK9LM&x=1')).toMatchObject({ kind: 'link', serial: 'PF3XK9LM' });
    expect(parseScannedValue('https://x.com/p?SN=ABC12345')).toMatchObject({ serial: 'ABC12345' });
    expect(parseScannedValue('https://x.com/p?ServiceTag=7HQ2K93')).toMatchObject({ serial: '7HQ2K93' });
  });

  test('vendor link with serial in the path', () => {
    expect(parseScannedValue('https://www.dell.com/support/home/product-support/servicetag/7HQ2K93/overview')).toMatchObject({ serial: '7HQ2K93' });
    expect(parseScannedValue('https://pcsupport.example.com/products/laptops/sn/PF3XK9LM')).toMatchObject({ serial: 'PF3XK9LM' });
  });

  test('link without a serial never leaks the URL into serial', () => {
    const r = parseScannedValue('https://www.example.com/some/product/page?utm=1');
    expect(r).toMatchObject({ kind: 'link', serial: '', host: 'www.example.com' });
  });

  test('key:value text', () => {
    expect(parseScannedValue('SN:ABC12345;MODEL:T14')).toMatchObject({ kind: 'data', serial: 'ABC12345' });
    expect(parseScannedValue('S/N: ABC12345 | PN: 21AH00')).toMatchObject({ serial: 'ABC12345' });
    expect(parseScannedValue('Serial Number=ABC12345\nModel=T14')).toMatchObject({ serial: 'ABC12345' });
    expect(parseScannedValue('Asset Tag: AST-00007; Serial: ZZ99')).toMatchObject({ serial: 'ZZ99', tag: 'AST-00007' });
  });

  test('JSON payload', () => {
    expect(parseScannedValue('{"serial":"ABC12345","model":"T14"}')).toMatchObject({ kind: 'data', serial: 'ABC12345' });
    expect(parseScannedValue('{"asset_id":"abc-123"}')).toMatchObject({ assetId: 'abc-123' });
  });

  test('key:value text with no serial key falls back to plain', () => {
    expect(parseScannedValue('MODEL:T14;COLOR:BLACK')).toMatchObject({ kind: 'plain' });
  });

  test('empty / non-http schemes', () => {
    expect(parseScannedValue('')).toMatchObject({ serial: '' });
    expect(parseScannedValue('WIFI:S:MyNet;T:WPA;P:pass;;')).toMatchObject({ kind: 'plain' });
  });
});
