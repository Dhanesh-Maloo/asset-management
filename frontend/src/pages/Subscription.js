import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { Crown, Check, AlertTriangle, Users, Laptop, ShoppingCart, Ticket, Zap } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TIER_STYLES = {
  free: { border: 'border-slate-300', badge: 'bg-slate-100 text-slate-700', icon: 'text-slate-500', gradient: 'from-slate-50 to-slate-100' },
  pro: { border: 'border-blue-400', badge: 'bg-blue-100 text-blue-700', icon: 'text-blue-500', gradient: 'from-blue-50 to-indigo-50' },
  enterprise: { border: 'border-amber-400', badge: 'bg-amber-100 text-amber-700', icon: 'text-amber-500', gradient: 'from-amber-50 to-orange-50' },
};

const Subscription = () => {
  const { user } = useAuth();
  const [tiers, setTiers] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const [tiersRes, usageRes] = await Promise.all([
        axios.get(`${API}/subscription-tiers`),
        user.tenant_id ? axios.get(`${API}/tenants/${user.tenant_id}/usage`) : Promise.resolve({ data: null }),
      ]);
      setTiers(tiersRes.data);
      setUsage(usageRes.data);
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
      <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto" data-testid="subscription-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-heading tracking-tight mb-2">
            Subscription & Usage
          </h1>
          <p className="text-base text-muted-foreground">
            Monitor your plan, usage, and explore available tiers
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-40 bg-slate-200 rounded" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <>
            {/* Current Plan + Usage Dashboard */}
            {usage && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-5">
                  <Crown className={`h-5 w-5 ${style(currentTierSlug).icon}`} />
                  <h2 className="text-xl font-semibold font-heading">Current Plan</h2>
                  <Badge className={style(currentTierSlug).badge} data-testid="current-tier-badge">
                    {usage.tier?.name}
                  </Badge>
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
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Zap className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold font-heading">Available Plans</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tiers.map((tier) => {
                  const isCurrent = tier.id === usage?.tier?.id;
                  const s = style(tier.slug);
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
                          <Button variant="outline" className="w-full" data-testid={`plan-btn-${tier.slug}`} onClick={() => toast.info('Contact your administrator to change plans')}>
                            {tier.sort_order > (usage?.tier?.sort_order || 0) ? 'Upgrade' : 'Switch'} to {tier.name}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Subscription;
