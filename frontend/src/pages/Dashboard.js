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
  Key
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PIE_COLORS = ['#4F46E5', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoStatus, setDemoStatus] = useState(null);
  const [clearingDemo, setClearingDemo] = useState(false);

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
    { label: 'Total Assets', value: stats.total_assets || 0, icon: Laptop, color: 'bg-blue-500', link: '/assets' },
    { label: 'Assigned Assets', value: stats.assigned_assets || 0, icon: CheckCircle, color: 'bg-green-500', link: '/assets' },
    { label: 'Available Assets', value: stats.available_assets || 0, icon: Package, color: 'bg-purple-500', link: '/assets' },
    { label: 'Open Tickets', value: stats.open_tickets || 0, icon: Ticket, color: 'bg-orange-500', link: '/tickets' },
    { label: 'Pending Orders', value: stats.pending_orders || 0, icon: ShoppingCart, color: 'bg-pink-500', link: '/orders' },
  ];

  if (user?.role === 'super_admin') {
    statCards.push(
      { label: 'Total Tenants', value: stats.total_tenants || 0, icon: Building2, color: 'bg-indigo-500', link: '/tenants' },
      { label: 'Total Users', value: stats.total_users || 0, icon: Users, color: 'bg-teal-500', link: '/users' }
    );
  }

  return (
    <DashboardLayout>
      {/* Demo Data Banner */}
      {demoStatus?.has_demo_data && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-amber-800 text-sm">
            <span className="text-lg">🎯</span>
            <span>
              <strong>You're viewing demo data.</strong>
              {' '}This is sample data to help you explore the application. Delete it when you're ready to add your real data.
            </span>
          </div>
          <button
            onClick={handleClearDemo}
            disabled={clearingDemo}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {clearingDemo ? 'Clearing...' : 'Clear Demo Data'}
          </button>
        </div>
      )}

      <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto" data-testid="dashboard-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-heading tracking-tight mb-2">
            Welcome back, {user?.name}
          </h1>
          <p className="text-base text-muted-foreground">
            Here's an overview of your IT asset management system
          </p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-slate-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  className="hover:shadow-lg transition-all cursor-pointer hover:scale-105"
                  onClick={() => navigate(stat.link)}
                  data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold font-heading">{stat.value}</p>
                      </div>
                      <div className={`${stat.color} p-3 rounded-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Charts Section */}
        {charts && (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold font-heading tracking-tight mb-4">Analytics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Asset Status Pie */}
              {charts.asset_status?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Asset Status Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={charts.asset_status} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}>
                          {charts.asset_status.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Ticket Status Pie */}
              {charts.ticket_status?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Ticket Status Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={charts.ticket_status} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}>
                          {charts.ticket_status.map((_, i) => <Cell key={i} fill={['#F59E0B', '#4F46E5', '#10B981', '#6B7280'][i % 4]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Monthly Orders Bar */}
              {charts.monthly_orders?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Monthly Orders (Last 6 Months)</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={charts.monthly_orders}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="orders" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Orders" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Ticket Trends Line */}
              {charts.ticket_trends?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Ticket Trends (Last 6 Months)</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={charts.ticket_trends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="tickets" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} name="Tickets" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* License Seat Utilization */}
              {charts.license_utilization?.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Key className="h-4 w-4 text-indigo-500" />
                        Software License Utilization
                      </CardTitle>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-indigo-500"></span> Used Seats</span>
                        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-slate-200"></span> Available Seats</span>
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={130} />
                        <Tooltip
                          formatter={(value, name) => [value, name === 'used' ? 'Used Seats' : 'Available Seats']}
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const total = (payload[0]?.value || 0) + (payload[1]?.value || 0);
                            const used = payload[0]?.value || 0;
                            const pct = total > 0 ? Math.round((used / total) * 100) : 0;
                            return (
                              <div className="bg-white border border-slate-200 rounded-lg p-3 shadow text-sm">
                                <p className="font-semibold mb-1">{label}</p>
                                <p className="text-indigo-600">Used: {used} seats</p>
                                <p className="text-slate-500">Available: {payload[1]?.value || 0} seats</p>
                                <p className="text-slate-700 font-medium mt-1">Total: {total} seats ({pct}% used)</p>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="used" stackId="seats" fill="#4F46E5" name="Used" radius={[0, 0, 0, 0]}>
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
          <h2 className="text-2xl font-semibold font-heading tracking-tight mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigate('/products')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                    <Package className="h-6 w-6 text-primary group-hover:text-white" />
                  </div>
                  <CardTitle className="text-lg">Browse Catalog</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Explore available IT products and equipment</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigate('/tickets')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500/10 p-3 rounded-lg group-hover:bg-orange-500 transition-colors">
                    <Ticket className="h-6 w-6 text-orange-500 group-hover:text-white" />
                  </div>
                  <CardTitle className="text-lg">Create Ticket</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Get help with IT issues and requests</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigate('/assets')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/10 p-3 rounded-lg group-hover:bg-green-500 transition-colors">
                    <Laptop className="h-6 w-6 text-green-500 group-hover:text-white" />
                  </div>
                  <CardTitle className="text-lg">View Assets</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Manage and track IT asset inventory</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
