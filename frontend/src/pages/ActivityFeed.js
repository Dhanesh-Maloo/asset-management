import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Activity, RefreshCw, ChevronDown } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ACTION_ICONS = {
  login: '🔑', logout: '👋', create: '✨', update: '✏️', delete: '🗑️',
  assign: '👤', checkout: '📤', return: '📥', approve: '✅', reject: '❌',
  bulk_delete: '🗑️', bulk_update: '✏️', transfer_complete: '🔄',
  trigger_alerts: '🔔', change_password: '🔒',
};

const ACTION_COLORS = {
  login: 'bg-blue-100 text-blue-700', delete: 'bg-red-100 text-red-700',
  bulk_delete: 'bg-red-100 text-red-700', create: 'bg-green-100 text-green-700',
  approve: 'bg-green-100 text-green-700', reject: 'bg-red-100 text-red-700',
  update: 'bg-yellow-100 text-yellow-700', assign: 'bg-purple-100 text-purple-700',
  checkout: 'bg-indigo-100 text-indigo-700', return: 'bg-teal-100 text-teal-700',
};

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => { fetchActivities(1, true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchActivities = async (p = 1, reset = false) => {
    if (reset) setLoading(true); else setRefreshing(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 30 });
      if (filterAction) params.set('action_type', filterAction);
      if (filterResource) params.set('resource_type', filterResource);
      if (filterDateFrom) params.set('date_from', new Date(filterDateFrom).toISOString());
      if (filterDateTo) {
        const to = new Date(filterDateTo);
        to.setHours(23, 59, 59, 999);
        params.set('date_to', to.toISOString());
      }
      const res = await axios.get(`${API}/activity-feed?${params.toString()}`);
      if (reset) {
        setActivities(res.data);
      } else {
        setActivities(prev => [...prev, ...res.data]);
      }
      setHasMore(res.data.length === 30);
      setPage(p);
    } catch {
      toast.error('Failed to load activity feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilter = (newAction, newResource, newFrom, newTo) => {
    setFilterAction(newAction);
    setFilterResource(newResource);
    setFilterDateFrom(newFrom);
    setFilterDateTo(newTo);
    // Fetch with new values directly since setState is async
    const params = new URLSearchParams({ page: 1, limit: 30 });
    if (newAction) params.set('action_type', newAction);
    if (newResource) params.set('resource_type', newResource);
    if (newFrom) params.set('date_from', new Date(newFrom).toISOString());
    if (newTo) {
      const to = new Date(newTo); to.setHours(23, 59, 59, 999);
      params.set('date_to', to.toISOString());
    }
    setLoading(true);
    axios.get(`${API}/activity-feed?${params.toString()}`)
      .then(res => { setActivities(res.data); setHasMore(res.data.length === 30); setPage(1); })
      .catch(() => toast.error('Failed to load activity feed'))
      .finally(() => setLoading(false));
  };

  const clearFilters = () => applyFilter('', '', '', '');

  const loadMore = () => { fetchActivities(page + 1, false); };

  const refresh = () => { fetchActivities(1, true); };

  const hasActiveFilters = filterAction || filterResource || filterDateFrom || filterDateTo;

  // Group activities by date
  const grouped = activities.reduce((acc, act) => {
    const date = new Date(act.timestamp).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(act);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
              <Activity className="h-8 w-8 text-primary" /> Activity Feed
            </h1>
            <p className="text-slate-500 mt-1">Recent actions and changes across the system</p>
          </div>
          <button onClick={refresh} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:border-primary hover:text-primary transition-colors disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Action Type</label>
            <select
              value={filterAction}
              onChange={e => applyFilter(e.target.value, filterResource, filterDateFrom, filterDateTo)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">All Actions</option>
              {['login','create','update','delete','assign','checkout','return','approve','reject','bulk_delete','bulk_update','change_password'].map(a => (
                <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Resource Type</label>
            <select
              value={filterResource}
              onChange={e => applyFilter(filterAction, e.target.value, filterDateFrom, filterDateTo)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">All Resources</option>
              {['asset','ticket','order','user','product','license','vendor'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">From Date</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={e => applyFilter(filterAction, filterResource, e.target.value, filterDateTo)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">To Date</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={e => applyFilter(filterAction, filterResource, filterDateFrom, e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <Card><CardContent className="py-20 text-center">
            <Activity className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No activity yet</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date}>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <div className="h-px flex-1 bg-slate-200"></div>
                  {date}
                  <div className="h-px flex-1 bg-slate-200"></div>
                </h2>
                <div className="space-y-2">
                  {items.map((act, i) => {
                    const icon = ACTION_ICONS[act.action] || '📋';
                    const colorClass = ACTION_COLORS[act.action] || 'bg-slate-100 text-slate-600';
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-shadow">
                        <div className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-lg flex-shrink-0">
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${colorClass}`}>
                              {act.action?.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs text-slate-400 capitalize">{act.resource}</span>
                          </div>
                          {act.details && (
                            <p className="text-sm text-slate-600 mt-1 truncate">{act.details}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">{timeAgo(act.timestamp)}</p>
                        </div>
                        <div className="text-xs text-slate-400 flex-shrink-0 mt-1">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="text-center pt-2">
                <button onClick={loadMore} disabled={refreshing}
                  className="flex items-center gap-2 mx-auto px-6 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:border-primary hover:text-primary transition-colors disabled:opacity-50">
                  <ChevronDown className="h-4 w-4" />
                  {refreshing ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ActivityFeed;
