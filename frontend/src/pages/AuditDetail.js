import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { BarcodeScannerDialog } from '../components/BarcodeScannerDialog';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { parseScannedValue } from '../lib/scanParse';
import { toast } from 'sonner';
import { ArrowLeft, Camera, CheckCircle, AlertTriangle, HelpCircle, ScanLine } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Section = ({ title, icon: Icon, tone, count, children, empty }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-base flex items-center gap-2">
        <Icon className={`h-4 w-4 ${tone}`} />
        {title}
        <span className="text-xs font-normal text-muted-foreground">({count})</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      {count === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : <div className="space-y-1.5 max-h-72 overflow-y-auto">{children}</div>}
    </CardContent>
  </Card>
);

const AuditDetail = () => {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const keepScanningRef = useRef(false);
  const justScannedRef = useRef(false);

  const fetchAudit = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/audits/${auditId}`);
      setAudit(res.data);
    } catch {
      toast.error('Stock-take not found');
      navigate('/audits');
    } finally {
      setLoading(false);
    }
  }, [auditId, navigate]);

  useEffect(() => { fetchAudit(); }, [fetchAudit]);

  const submitCode = async (raw) => {
    const parsed = parseScannedValue(raw);
    const value = (parsed.assetId || parsed.tag || parsed.serial || raw || '').trim();
    if (!value) return;
    setBusy(true);
    try {
      const res = await axios.post(`${API}/audits/${auditId}/scan`, { code: value });
      setLastResult({ ...res.data, code: value });
      await fetchAudit();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Scan failed');
    } finally {
      setBusy(false);
    }
  };

  const handleTyped = async (e) => {
    e.preventDefault();
    const value = code;
    setCode('');
    await submitCode(value);
    inputRef.current?.focus();
  };

  // The camera dialog reads one code and closes itself, so reopen it after each scan to keep going down a shelf.
  // justScannedRef tells that automatic close apart from the user dismissing the dialog, which stops the loop.
  const handleCameraScan = async (text) => {
    keepScanningRef.current = true;
    justScannedRef.current = true;
    await submitCode(text);
    setTimeout(() => { if (keepScanningRef.current) setScannerOpen(true); }, 600);
  };

  const closeScanner = (open) => {
    if (!open) {
      if (justScannedRef.current) justScannedRef.current = false;
      else keepScanningRef.current = false;
    }
    setScannerOpen(open);
  };

  const handleComplete = async () => {
    const missing = audit.missing_count;
    if (!window.confirm(missing ? `${missing} asset(s) are still unscanned and will be reported as missing. Finish the stock-take?` : 'Finish the stock-take?')) return;
    try {
      await axios.post(`${API}/audits/${auditId}/complete`);
      toast.success('Stock-take completed');
      fetchAudit();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not complete');
    }
  };

  if (loading || !audit) {
    return (
      <DashboardLayout>
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-4" aria-busy="true" aria-label="Loading stock-take">
          <div className="h-8 w-64 shimmer rounded-md" />
          <div className="h-24 shimmer rounded-lg" />
          <div className="h-56 shimmer rounded-lg" />
        </div>
      </DashboardLayout>
    );
  }

  const open = audit.status === 'open';
  const pct = audit.expected_count ? Math.round((audit.found_count / audit.expected_count) * 100) : 0;
  const resultStyle = {
    found: ['bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', 'Found'],
    unexpected: ['bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30', 'Not expected here'],
    duplicate: ['bg-muted text-muted-foreground border-border', 'Already scanned'],
    unknown: ['bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30', 'Not in the system'],
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto animate-fade-in space-y-6" data-testid="audit-detail-page">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => navigate('/audits')} aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold font-heading tracking-tight leading-tight">{audit.name}</h1>
              <p className="text-sm text-muted-foreground">{audit.location}</p>
            </div>
            <Badge variant={open ? 'default' : 'secondary'}>{open ? 'In progress' : 'Completed'}</Badge>
          </div>
          {open && <Button onClick={handleComplete} data-testid="complete-audit-btn">Finish stock-take</Button>}
        </div>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="font-medium">{audit.found_count} of {audit.expected_count} found</span>
              <span className="text-muted-foreground">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </CardContent>
        </Card>

        {open && (
          <Card>
            <CardContent className="p-5 space-y-3">
              <form onSubmit={handleTyped} className="flex gap-2">
                <div className="relative flex-1">
                  <ScanLine className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Scan or type an asset tag / serial number, then press Enter"
                    className="pl-9"
                    data-testid="audit-code-input"
                  />
                </div>
                <Button type="submit" disabled={busy || !code.trim()}>Add</Button>
                <Button type="button" variant="outline" onClick={() => setScannerOpen(true)} data-testid="audit-camera-btn">
                  <Camera className="h-4 w-4 mr-2" />
                  Camera
                </Button>
              </form>
              {lastResult && resultStyle[lastResult.result] && (
                <div className={`rounded-md border px-3 py-2 text-sm ${resultStyle[lastResult.result][0]}`} data-testid="audit-last-result">
                  <strong>{lastResult.asset_tag || lastResult.code}</strong> · {resultStyle[lastResult.result][1]}
                  {lastResult.result === 'unexpected' && lastResult.system_location && <> (system says: {lastResult.system_location})</>}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Section title="Missing" icon={AlertTriangle} tone="text-red-500" count={audit.missing_count} empty={open ? 'Everything scanned so far matches.' : 'Nothing is missing.'}>
            {audit.missing.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <span className="font-mono font-medium">{m.asset_tag}</span>
                <span className="text-xs text-muted-foreground">{m.serial_number}</span>
              </div>
            ))}
          </Section>
          <Section title="Found" icon={CheckCircle} tone="text-emerald-500" count={audit.found_count} empty="Nothing scanned yet.">
            {audit.found.map((f) => (
              <div key={f.asset_id} className="flex items-center justify-between text-sm">
                <span className="font-mono font-medium">{f.asset_tag}</span>
                <span className="text-xs text-muted-foreground">{new Date(f.at).toLocaleTimeString()}</span>
              </div>
            ))}
          </Section>
          <Section title="Not expected here" icon={HelpCircle} tone="text-amber-500" count={audit.unexpected_count} empty="No stray assets.">
            {audit.unexpected.map((u) => (
              <div key={u.asset_id} className="flex items-center justify-between text-sm">
                <span className="font-mono font-medium">{u.asset_tag}</span>
                <span className="text-xs text-muted-foreground">system: {u.system_location || 'no location'}</span>
              </div>
            ))}
          </Section>
          <Section title="Not in the system" icon={HelpCircle} tone="text-red-500" count={audit.unknown_count} empty="Every scanned code was recognised.">
            {audit.unknown.map((u) => (
              <div key={u} className="font-mono text-sm">{u}</div>
            ))}
          </Section>
        </div>
      </div>

      <BarcodeScannerDialog
        open={scannerOpen}
        onOpenChange={closeScanner}
        onScan={handleCameraScan}
        title="Scan assets in this location"
      />
    </DashboardLayout>
  );
};

export default AuditDetail;
