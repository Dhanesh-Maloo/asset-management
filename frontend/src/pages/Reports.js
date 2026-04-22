import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { FileBarChart, Download, AlertTriangle, Laptop, Wrench, TrendingDown } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const Reports = () => {
  const { user } = useAuth();
  const [activeReport, setActiveReport] = useState('assets-dept');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [warrantyDays, setWarrantyDays] = useState(90);

  const reports = [
    { id: 'assets-dept', label: 'Assets by Department', icon: Laptop },
    { id: 'maintenance-costs', label: 'Maintenance Costs', icon: Wrench },
    { id: 'expiring-warranties', label: 'Expiring Warranties', icon: AlertTriangle },
    { id: 'depreciation', label: 'Asset Depreciation', icon: TrendingDown },
  ];

  useEffect(() => { fetchReport(activeReport); }, [activeReport]);

  const fetchReport = async (id) => {
    setLoading(true);
    setData(null);
    try {
      let url = '';
      if (id === 'assets-dept') url = `${API}/reports/assets-by-department`;
      else if (id === 'maintenance-costs') url = `${API}/reports/maintenance-costs`;
      else if (id === 'expiring-warranties') url = `${API}/reports/expiring-warranties?days=${warrantyDays}`;
      else if (id === 'depreciation') url = `${API}/reports/asset-depreciation`;
      const res = await axios.get(url);
      setData(res.data);
    } catch (e) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!data || data.length === 0) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(row => keys.map(k => `"${row[k] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${activeReport}-report.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
              <FileBarChart className="h-8 w-8 text-primary" /> Reports
            </h1>
            <p className="text-slate-500 mt-1">Advanced analytics and insights</p>
          </div>
          {data && data.length > 0 && (
            <button onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          )}
        </div>

        {/* Report Tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {reports.map(r => {
            const Icon = r.icon;
            return (
              <button key={r.id} onClick={() => setActiveReport(r.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeReport === r.id ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-primary hover:text-primary'}`}>
                <Icon className="h-4 w-4" /> {r.label}
              </button>
            );
          })}
        </div>

        {/* Warranty filter */}
        {activeReport === 'expiring-warranties' && (
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm font-medium text-slate-700">Show warranties expiring within:</label>
            {[30, 60, 90, 180].map(d => (
              <button key={d} onClick={() => { setWarrantyDays(d); fetchReport('expiring-warranties'); }}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${warrantyDays === d ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {d} days
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <Card><CardContent className="py-20 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-slate-500 mt-4">Loading report...</p>
          </CardContent></Card>
        ) : !data || data.length === 0 ? (
          <Card><CardContent className="py-20 text-center">
            <FileBarChart className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No data available for this report</p>
          </CardContent></Card>
        ) : (
          <>
            {/* Assets by Department */}
            {activeReport === 'assets-dept' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle>Assets by Department</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data} margin={{ top: 5, right: 20, bottom: 60, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="department" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="asset_count" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Assets" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Asset Value by Department</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={data.filter(d => d.total_value > 0)} dataKey="total_value" nameKey="department" cx="50%" cy="50%" outerRadius={100} label={({ department, percent }) => `${department} (${(percent * 100).toFixed(0)}%)`}>
                          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={v => `₹${v.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                  <CardHeader><CardTitle>Department Summary</CardTitle></CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b">
                          <th className="text-left py-2 font-semibold text-slate-600">Department</th>
                          <th className="text-right py-2 font-semibold text-slate-600">Assets</th>
                          <th className="text-right py-2 font-semibold text-slate-600">Total Value</th>
                        </tr></thead>
                        <tbody>{data.map((d, i) => (
                          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="py-2">{d.department}</td>
                            <td className="py-2 text-right font-medium">{d.asset_count}</td>
                            <td className="py-2 text-right">₹{d.total_value.toLocaleString()}</td>
                          </tr>
                        ))}</tbody>
                        <tfoot><tr className="font-bold border-t-2">
                          <td className="py-2">Total</td>
                          <td className="py-2 text-right">{data.reduce((s, d) => s + d.asset_count, 0)}</td>
                          <td className="py-2 text-right">₹{data.reduce((s, d) => s + d.total_value, 0).toLocaleString()}</td>
                        </tr></tfoot>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Maintenance Costs */}
            {activeReport === 'maintenance-costs' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader><CardTitle>Monthly Maintenance Costs</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${v}`} />
                        <Tooltip formatter={v => `₹${v.toLocaleString()}`} />
                        <Bar dataKey="cost" fill="#10B981" radius={[4, 4, 0, 0]} name="Cost" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Cost Summary</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.map((d, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                          <span className="text-sm text-slate-600">{d.month}</span>
                          <span className="font-semibold">₹{(d.cost || 0).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between py-2 font-bold border-t-2">
                        <span>Total</span>
                        <span className="text-green-700">₹{data.reduce((s, d) => s + (d.cost || 0), 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Expiring Warranties */}
            {activeReport === 'expiring-warranties' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Warranties Expiring in {warrantyDays} Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b bg-slate-50">
                        {['Asset Tag', 'Serial Number', 'Warranty Provider', 'Expiry Date', 'Days Left'].map(h => (
                          <th key={h} className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.map((a, i) => {
                          const daysLeft = Math.ceil((new Date(a.warranty_end_date) - new Date()) / (1000 * 60 * 60 * 24));
                          return (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-medium">{a.asset_tag}</td>
                              <td className="px-4 py-3 text-slate-600">{a.serial_number}</td>
                              <td className="px-4 py-3 text-slate-600">{a.warranty_provider || '—'}</td>
                              <td className="px-4 py-3">{new Date(a.warranty_end_date).toLocaleDateString()}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${daysLeft <= 7 ? 'bg-red-100 text-red-700' : daysLeft <= 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                  {daysLeft} days
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Depreciation */}
            {activeReport === 'depreciation' && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-red-500" /> Asset Depreciation Report</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b bg-slate-50">
                        {['Asset Tag', 'S/N', 'Purchase Price', 'Current Value', 'Depreciation', 'Age (Years)'].map(h => (
                          <th key={h} className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.map((a, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium">{a.asset_tag}</td>
                            <td className="px-4 py-3 text-slate-600">{a.serial_number}</td>
                            <td className="px-4 py-3">₹{(a.purchase_price || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 font-medium text-green-700">₹{(a.current_value || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-red-600">₹{(a.depreciation || 0).toLocaleString()}</td>
                            <td className="px-4 py-3">{a.years_old}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot><tr className="font-bold border-t-2">
                        <td className="px-4 py-2" colSpan={2}>Total</td>
                        <td className="px-4 py-2">₹{data.reduce((s, a) => s + (a.purchase_price || 0), 0).toLocaleString()}</td>
                        <td className="px-4 py-2 text-green-700">₹{data.reduce((s, a) => s + (a.current_value || 0), 0).toLocaleString()}</td>
                        <td className="px-4 py-2 text-red-600">₹{data.reduce((s, a) => s + (a.depreciation || 0), 0).toLocaleString()}</td>
                        <td></td>
                      </tr></tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Reports;
