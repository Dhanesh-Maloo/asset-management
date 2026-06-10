import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, ResponsiveContainer, Legend, LabelList
} from 'recharts';
import {
  Laptop,
  Package,
  ShoppingCart,
  Ticket,
  Users,
  Building2,
  CheckCircle,
  Key,
  Settings,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CHART_COLORS = ['#4F46E5', '#818CF8', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];
const TICKET_COLORS = ['#F59E0B', '#4F46E5', '#10B981', '#94A3B8'];

const ALL_STAT_CARDS = [
  'Total Assets', 'Assigned Assets', 'Available Assets', 'Open Tickets', 'Pending Orders',
  'Total Tenants', 'Total Users'
];

const chartTooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '13px',
  color: 'hsl(var(--popover-foreground))',
  boxShadow: '0 8px 24px 0 rgb(0 0 0 / 0.12)',
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoStatus, setDemoStatus] = useState(null);
  const [clearingDemo, setClearingDemo] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [hiddenWidgets, setHiddenWidgets] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dashboard_hidden_widgets') || '[]'); }
    catch { return []; }
  });

  const toggleWidget = (label) => {
    setHiddenWidgets(prev => {
      const next = prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label];
      localStorage.setItem('dashboard_hidden_widgets', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    fetchStats();
    fetchCharts();
    fetchDemoStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCharts = async () => {
    try {
      const res = await axios.get(`${API}/dashboard/charts`);
      setCharts(res.data);
    } catch {
      // silently fail
    }
  };

  const fetchDemoStatus = async () => {
    if (!user?.tenant_id) return;
    try {
      const res = await axios.get(`${API}/demo-data/status`);
      setDemoStatus(res.data);
    } catch {
      // silently fail
    }
  };

  const handleClearDemo = async () => {
    if (!window.confirm(
      'This will permanently delete all demo data (assets, tickets, products, licenses, orders, vendors, departments, locations).\n\nThis cannot be undone. Continue?'
    )) return;
    setClearingDemo(true);
    try {
      const res = await axios.delete(`${API}/demo-data`);
      toast.success(res.data.message || 'Demo data cleared successfully');
      setDemoStatus({ has_demo_data: false, count: 0 });
      fetchStats();
      fetchCharts();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to clear demo data');
    } finally {
      setClearingDemo(false);
    }
  };

  const statCards = [
    { label: 'Total Assets', value: stats.total_assets || 0, icon: Laptop, tint: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', link: '/assets' },
    { label: 'Assigned Assets', value: stats.assigned_assets || 0, icon: CheckCircle, tint: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', link: '/assets' },
    { label: 'Available Assets', value: stats.available_assets || 0, icon: Package, tint: 'bg-violet-500/10 text-violet-600 dark:text-violet-400', link: '/assets' },
    { label: 'Open Tickets', value: stats.open_tickets || 0, icon: Ticket, tint: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', link: '/tickets' },
    { label: 'Pending Orders', value: stats.pending_orders || 0, icon: ShoppingCart, tint: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', link: '/orders' },
  ];

  if (user?.role === 'super_admin') {
    statCards.push(
      { label: 'Total Tenants', value: stats.total_tenants || 0, icon: Building2, tint: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', link: '/tenants' },
      { label: 'Total Users', value: stats.total_users || 0, icon: Users, tint: 'bg-teal-500/10 text-teal-600 dark:text-teal-400', link: '/users' }
    );
  }

  const quickActions = [
    { title: 'Browse Catalog', desc: 'Explore available IT products and equipment', icon: Package, tint: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', link: '/products' },
    { title: 'Create Ticket', desc: 'Get help with IT issues and requests', icon: Ticket, tint: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', link: '/tickets' },
    { title: 'View Assets', desc: 'Manage and track IT asset inventory', icon: Laptop, tint: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', link: '/assets' },
  ];

  return (
    <DashboardLayout>
      {/* Demo Data Banner */}
      {demoStatus?.has_demo_data && (
        <div className="bg-warning/10 border-b border-warning/20 px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2.5 text-sm">
            <Sparkles className="h-4 w-4 text-warning shrink-0" />
            <span className="text-foreground">
              <strong>You're viewing demo data.</strong>
              {' '}This is sample data to help you explore the application. Delete it when you're ready to add your real data.
            </span>
          </div>
          <button
            onClick={handleClearDemo}
            disabled={clearingDemo}
            className="px-4 py-1.5 bg-warning hover:bg-warning/90 text-white text-sm font-medium rounded-md disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {clearingDemo ? 'Clearing…' : 'Clear Demo Data'}
          </button>
        </div>
      )}

      <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in" data-testid="dashboard-page">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-1">
              Welcome back, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-sm text-muted-foreground">
              Here's an overview of your IT asset management system
            </p>
          </div>
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowCustomize(p => !p)}
              className="flex items-center gap-2 h-9 px-3 text-sm font-medium text-muted-foreground bg-card border border-border rounded-md hover:border-ring hover:text-foreground transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Customize</span>
            </button>
            {showCustomize && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowCustomize(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-dropdown p-3 z-20 animate-fade-in">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Show / Hide Widgets</p>
                  {ALL_STAT_CARDS.map(label => (
                    <label key={label} className="flex items-center gap-2 px-1.5 py-1.5 rounded-md hover:bg-accent cursor-pointer text-sm transition-colors">
                      <input
                        type="checkbox"
                        checked={!hiddenWidgets.includes(label)}
                        onChange={() => toggleWidget(label)}
                        className="accent-[#4F46E5]"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse border-border shadow-card">
                <CardContent className="p-5">
                  <div className="h-16 bg-muted rounded-md"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {statCards.filter(s => !hiddenWidgets.includes(s.label)).map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  className="group border-border shadow-card hover:shadow-card-hover hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(stat.link)}
                  data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`${stat.tint} h-9 w-9 rounded-md flex items-center justify-center`}>
                        <Icon className="h-[18px] w-[18px]" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground -translate-x-1 group-hover:translate-x-0 transition-all duration-200" />
                    </div>
                    <p className="text-2xl font-bold font-heading tracking-tight leading-none mb-1.5">
                      {stat.value.toLocaleString()}
                    </p>
                    <p className="text-[13px] text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Charts Section */}
        {charts && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold font-heading tracking-tight mb-4">Analytics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Asset Status Donut */}
              {charts.asset_status?.length > 0 && (
                <Card className="border-border shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Asset Status Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={charts.asset_status}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={62}
                          outerRadius={90}
                          paddingAngle={3}
                          cornerRadius={4}
                          stroke="none"
                        >
                          {charts.asset_status.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Ticket Status Donut */}
              {charts.ticket_status?.length > 0 && (
                <Card className="border-border shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Ticket Status Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={charts.ticket_status}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={62}
                          outerRadius={90}
                          paddingAngle={3}
                          cornerRadius={4}
                          stroke="none"
                        >
                          {charts.ticket_status.map((_, i) => <Cell key={i} fill={TICKET_COLORS[i % TICKET_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Monthly Orders Bar */}
              {charts.monthly_orders?.length > 0 && (
                <Card className="border-border shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Monthly Orders <span className="text-muted-foreground font-normal">· last 6 months</span></CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={charts.monthly_orders}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }} />
                        <Bar dataKey="orders" fill="#4F46E5" radius={[5, 5, 0, 0]} maxBarSize={36} name="Orders" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Ticket Trends Line */}
              {charts.ticket_trends?.length > 0 && (
                <Card className="border-border shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Ticket Trends <span className="text-muted-foreground font-normal">· last 6 months</span></CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={charts.ticket_trends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Line type="monotone" dataKey="tickets" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 5 }} name="Tickets" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* License Seat Utilization */}
              {charts.license_utilization?.length > 0 && (
                <Card className="lg:col-span-2 border-border shadow-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Key className="h-4 w-4 text-primary" />
                        Software License Utilization
                      </CardTitle>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#4F46E5]"></span> Used</span>
                        <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-slate-200 dark:bg-slate-600"></span> Available</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={Math.max(220, charts.license_utilization.length * 52)}>
                      <BarChart
                        data={charts.license_utilization}
                        layout="vertical"
                        margin={{ left: 16, right: 48, top: 4, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} width={130} axisLine={false} tickLine={false} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const used = payload[0]?.value || 0;
                            const available = payload[1]?.value || 0;
                            const total = used + available;
                            const pct = total > 0 ? Math.round((used / total) * 100) : 0;
                            return (
                              <div className="bg-popover border border-border rounded-lg p-3 shadow-dropdown text-sm">
                                <p className="font-semibold mb-1">{label}</p>
                                <p className="text-primary">Used: {used} seats</p>
                                <p className="text-muted-foreground">Available: {available} seats</p>
                                <p className="font-medium mt-1">Total: {total} seats ({pct}% used)</p>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="used" stackId="seats" fill="#4F46E5" name="Used" radius={[4, 0, 0, 4]}>
                          <LabelList dataKey="used" position="insideRight" style={{ fill: '#fff', fontSize: 11, fontWeight: 600 }} formatter={(v) => v > 0 ? v : ''} />
                        </Bar>
                        <Bar dataKey="available" stackId="seats" fill="#E2E8F0" name="Available" radius={[0, 4, 4, 0]}>
                          <LabelList dataKey="total" position="right" style={{ fill: '#64748b', fontSize: 11 }} formatter={(v) => `${v} total`} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold font-heading tracking-tight mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card
                  key={action.title}
                  className="group border-border shadow-card hover:shadow-card-hover hover:border-primary/30 transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(action.link)}
                >
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className={`${action.tint} h-10 w-10 rounded-md flex items-center justify-center shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold mb-0.5 flex items-center gap-1.5">
                        {action.title}
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-primary -translate-x-1 group-hover:translate-x-0 transition-all duration-200" />
                      </p>
                      <p className="text-[13px] text-muted-foreground leading-snug">{action.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
