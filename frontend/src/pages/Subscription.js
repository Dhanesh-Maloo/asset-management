import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Crown, Check, AlertTriangle, Users, Laptop, ShoppingCart, Ticket, Zap, FileText, Download, Mail, CalendarDays, ArrowUpCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TIER_STYLES = {
  free: { border: 'border-slate-300', badge: 'bg-muted text-slate-700', icon: 'text-slate-500', gradient: 'from-slate-50 to-slate-100' },
  pro: { border: 'border-blue-400', badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400', icon: 'text-blue-500', gradient: 'from-blue-50 to-indigo-50' },
  enterprise: { border: 'border-amber-400', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', icon: 'text-amber-500', gradient: 'from-amber-50 to-orange-50' },
};

const STATUS_STYLES = {
  paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  overdue: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

const Subscription = () => {
  const { user } = useAuth();
  const [tiers, setTiers] = useState([]);
  const [usage, setUsage] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const requests = [
        axios.get(`${API}/subscription-tiers`),
        user.tenant_id ? axios.get(`${API}/tenants/${user.tenant_id}/usage`) : Promise.resolve({ data: null }),
        axios.get(`${API}/invoices`),
      ];
      const [tiersRes, usageRes, invoicesRes] = await Promise.all(requests);
      setTiers(tiersRes.data);
      setUsage(usageRes.data);
      setInvoices(invoicesRes.data || []);
    } catch (error) {
      console.error('Failed to fetch subscription data', error);
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercent = (current, limit) => {
    if (limit === -1) return 0;
    if (limit === 0) return 100;
    return Math.min(Math.round((current / limit) * 100), 100);
  };

  const getUsageColor = (percent) => {
    if (percent >= 90) return 'text-red-600';
    if (percent >= 70) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const formatLimit = (val) => (val === -1 ? 'Unlimited' : val);

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleDownloadInvoice = (invoice) => {
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html>
<html><head><title>Invoice #${invoice.id.slice(0, 8).toUpperCase()}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
  h1 { font-size: 28px; font-weight: 900; margin: 0; }
  .meta { text-align: right; font-size: 13px; color: #555; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; background: ${invoice.status === 'paid' ? '#d1fae5' : invoice.status === 'overdue' ? '#fee2e2' : '#fef3c7'}; color: ${invoice.status === 'paid' ? '#065f46' : invoice.status === 'overdue' ? '#991b1b' : '#92400e'}; }
  table { width: 100%; border-collapse: collapse; margin-top: 24px; }
  th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-size: 13px; }
  td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
  .total { font-weight: bold; font-size: 16px; }
  .footer { margin-top: 40px; font-size: 12px; color: #aaa; text-align: center; }
</style>
</head><body>
<div class="header">
  <div><h1>INVOICE</h1><p style="color:#555;margin-top:4px">IT Asset Management Platform</p></div>
  <div class="meta">
    <div><strong>Invoice #</strong> ${invoice.id.slice(0, 8).toUpperCase()}</div>
    <div><strong>Date:</strong> ${formatDate(invoice.created_at)}</div>
    <div style="margin-top:6px"><span class="badge">${invoice.status.toUpperCase()}</span></div>
  </div>
</div>
<table>
  <thead><tr><th>Description</th><th>Period</th><th>Amount</th></tr></thead>
  <tbody>
    <tr>
      <td>${invoice.description}</td>
      <td>${formatDate(invoice.period_start)} – ${formatDate(invoice.period_end)}</td>
      <td class="total">${formatCurrency(invoice.amount, invoice.currency)}</td>
    </tr>
  </tbody>
</table>
${invoice.paid_at ? `<p style="margin-top:16px;font-size:13px;color:#555">Paid on: ${formatDate(invoice.paid_at)}</p>` : ''}
<div class="footer">Thank you for using our platform.</div>
</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const openUpgradeDialog = (tier) => {
    setSelectedTier(tier);
    setUpgradeOpen(true);
  };

  const handleUpgradeRequest = () => {
    toast.success(`Upgrade request for ${selectedTier?.name} plan sent to your administrator.`);
    setUpgradeOpen(false);
  };

  const currentTierSlug = usage?.tier?.slug || 'free';
  const style = (slug) => TIER_STYLES[slug] || TIER_STYLES.free;

  const usageMetrics = usage ? [
    { label: 'Users', icon: Users, current: usage.current_usage.users, limit: usage.limits.max_users },
    { label: 'Assets', icon: Laptop, current: usage.current_usage.assets, limit: usage.limits.max_assets },
    { label: 'Orders (this month)', icon: ShoppingCart, current: usage.current_usage.orders_this_month, limit: usage.limits.max_orders_per_month },
    { label: 'Tickets (this month)', icon: Ticket, current: usage.current_usage.tickets_this_month, limit: usage.limits.max_tickets_per_month },
  ] : [];

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in" data-testid="subscription-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-1">
            Subscription & Billing
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor your plan, usage, billing history, and explore available tiers
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-40 bg-muted rounded" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <>
            {/* Current Plan + Usage */}
            {usage && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Crown className={`h-5 w-5 ${style(currentTierSlug).icon}`} />
                    <h2 className="text-xl font-semibold font-heading">Current Plan</h2>
                    <Badge className={style(currentTierSlug).badge} data-testid="current-tier-badge">
                      {usage.tier?.name}
                    </Badge>
                  </div>
                  {usage.subscription_started_at && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      <span>Active since {formatDate(usage.subscription_started_at)}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {usageMetrics.map((m) => {
                    const pct = getUsagePercent(m.current, m.limit);
                    const Icon = m.icon;
                    return (
                      <Card key={m.label} data-testid={`usage-card-${m.label.toLowerCase().split(' ')[0]}`}>
                        <CardContent className="pt-5 pb-4 px-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{m.label}</span>
                            </div>
                            {m.limit !== -1 && pct >= 90 && (
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            )}
                          </div>
                          <div className="flex items-baseline gap-1 mb-2">
                            <span className={`text-2xl font-bold font-heading ${getUsageColor(pct)}`}>
                              {m.current}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              / {formatLimit(m.limit)}
                            </span>
                          </div>
                          {m.limit !== -1 ? (
                            <Progress value={pct} className="h-2" />
                          ) : (
                            <div className="h-2 w-full bg-emerald-100 rounded-full">
                              <div className="h-full bg-emerald-500 rounded-full w-0" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            <Separator className="my-8" />

            {/* Available Plans */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-5">
                <Zap className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold font-heading">Available Plans</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tiers.map((tier) => {
                  const isCurrent = tier.id === usage?.tier?.id;
                  const s = style(tier.slug);
                  const isUpgrade = tier.sort_order > (usage?.tier?.sort_order || 0);
                  return (
                    <Card
                      key={tier.id}
                      className={`relative overflow-hidden transition-shadow hover:shadow-lg ${s.border} ${isCurrent ? 'ring-2 ring-primary' : ''}`}
                      data-testid={`tier-card-${tier.slug}`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-b ${s.gradient} opacity-40 pointer-events-none`} />
                      <CardHeader className="relative">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl">{tier.name}</CardTitle>
                          {isCurrent && (
                            <Badge variant="default" className="text-xs" data-testid="current-plan-badge">Current</Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1">{tier.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="relative">
                        <ul className="space-y-2.5 mb-6">
                          {(tier.highlights || []).map((h, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                        {isCurrent ? (
                          <Button variant="outline" disabled className="w-full" data-testid={`plan-btn-${tier.slug}`}>
                            Current Plan
                          </Button>
                        ) : (
                          <Button
                            variant={isUpgrade ? 'default' : 'outline'}
                            className="w-full"
                            data-testid={`plan-btn-${tier.slug}`}
                            onClick={() => openUpgradeDialog(tier)}
                          >
                            {isUpgrade ? <ArrowUpCircle className="h-4 w-4 mr-2" /> : null}
                            {isUpgrade ? 'Upgrade' : 'Switch'} to {tier.name}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <Separator className="my-8" />

            {/* Billing History */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold font-heading">Billing History</h2>
              </div>

              {invoices.length === 0 ? (
                <Card>
                  <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-muted-foreground font-medium">No invoices yet</p>
                    <p className="text-sm text-muted-foreground">Your billing history will appear here once invoices are generated.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((inv) => (
                          <TableRow key={inv.id}>
                            <TableCell className="font-mono text-xs font-semibold">
                              #{inv.id.slice(0, 8).toUpperCase()}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">{inv.description}</TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {formatDate(inv.period_start)} – {formatDate(inv.period_end)}
                            </TableCell>
                            <TableCell className="font-semibold whitespace-nowrap">
                              {formatCurrency(inv.amount, inv.currency)}
                            </TableCell>
                            <TableCell>
                              <Badge className={STATUS_STYLES[inv.status] || STATUS_STYLES.pending}>
                                {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {formatDate(inv.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadInvoice(inv)}
                                className="gap-1.5"
                              >
                                <Download className="h-3.5 w-3.5" />
                                Download
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>

      {/* Upgrade / Plan Change Dialog */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Request Plan Change
            </DialogTitle>
            <DialogDescription>
              {selectedTier && (
                <>
                  You're requesting to switch to the <strong>{selectedTier.name}</strong> plan.
                  Your administrator will be notified and will reach out to process the change.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedTier && (
            <div className={`rounded-lg border p-4 bg-gradient-to-b ${(TIER_STYLES[selectedTier.slug] || TIER_STYLES.free).gradient}`}>
              <p className="font-semibold mb-2">{selectedTier.name} plan includes:</p>
              <ul className="space-y-1.5">
                {(selectedTier.highlights || []).map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeOpen(false)}>Cancel</Button>
            <Button onClick={handleUpgradeRequest}>
              <Mail className="h-4 w-4 mr-2" />
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Subscription;
