import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { CalendarClock, AlertTriangle, Shield, Key, Wrench, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const KIND_META = {
  warranty: { label: 'Warranty', icon: Shield },
  license: { label: 'Licence', icon: Key },
  amc: { label: 'AMC', icon: Wrench },
};

const SEVERITY_STYLE = {
  expired: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  critical: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  notice: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
};

const DAY_WINDOWS = [30, 60, 90];

export const ExpiringSoon = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(60);
  const [kind, setKind] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/expiring`, { params: { days } });
      setData(res.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to load expiring items');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const items = (data?.items || []).filter(i => kind === 'all' || i.kind === kind);
  const summary = data?.summary;
  const overUsed = data?.over_used_licenses || [];

  const whenText = (daysLeft) => {
    if (daysLeft < 0) return `Expired ${-daysLeft} day${daysLeft === -1 ? '' : 's'} ago`;
    if (daysLeft === 0) return 'Expires today';
    return `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
  };

  const tiles = summary ? [
    { label: 'Expired', value: summary.expired, tone: 'text-red-600' },
    { label: 'Within 7 days', value: summary.within_7, tone: 'text-red-600' },
    { label: 'Within 30 days', value: summary.within_30, tone: 'text-amber-600' },
    { label: `Within ${days} days`, value: summary.within_60, tone: 'text-blue-600' },
  ] : [];

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto animate-fade-in" data-testid="expiring-page">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-1 flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-primary" />
            Expiring Soon
          </h1>
          <p className="text-sm text-muted-foreground">
            Warranties, software licences and AMC contracts that need renewing. Admins are also emailed once at 60, 30 and 7 days.
          </p>
        </div>

        {overUsed.length > 0 && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400" data-testid="overuse-banner">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <strong>{overUsed.length} licence{overUsed.length === 1 ? '' : 's'} over-used:</strong>{' '}
              {overUsed.map(l => `${l.name} (${l.seats_used}/${l.seats_total})`).join(', ')}
              <button className="ml-2 underline" onClick={() => navigate('/licenses')}>Open licences</button>
            </div>
          </div>
        )}

        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {tiles.map(t => (
              <Card key={t.label} className="p-4 text-center">
                <div className={`text-2xl font-bold ${t.value > 0 ? t.tone : 'text-muted-foreground'}`}>{t.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{t.label}</div>
              </Card>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {[['all', 'All'], ['warranty', 'Warranties'], ['license', 'Licences'], ['amc', 'AMC']].map(([id, label]) => (
            <Button key={id} size="sm" variant={kind === id ? 'default' : 'outline'} onClick={() => setKind(id)} data-testid={`expiring-filter-${id}`}>
              {label}
            </Button>
          ))}
          <span className="mx-1 text-muted-foreground">|</span>
          {DAY_WINDOWS.map(d => (
            <Button key={d} size="sm" variant={days === d ? 'default' : 'outline'} onClick={() => setDays(d)}>
              {d} days
            </Button>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 shimmer rounded-md" />)}</div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
                <p className="font-medium">Nothing expiring in the next {days} days</p>
                <p className="text-sm text-muted-foreground">Recently expired items (last 30 days) also appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {items.map(item => {
                  const Icon = KIND_META[item.kind].icon;
                  return (
                    <button key={`${item.kind}-${item.id}`} onClick={() => navigate(item.link)}
                      className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                      data-testid={`expiring-row-${item.kind}-${item.id}`}>
                      <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {KIND_META[item.kind].label}{item.subtitle ? ` · ${item.subtitle}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge className={SEVERITY_STYLE[item.severity]}>{whenText(item.days_left)}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(item.expires_on).toLocaleDateString()}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ExpiringSoon;
