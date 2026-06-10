import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { cachedGet } from '../lib/cache';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Laptop, Eye, Plus, Trash2, Search, Download, CheckSquare, Square, Pencil, Printer, FileSpreadsheet, AlertTriangle, Upload, RefreshCw, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Assets = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [products, setProducts] = useState({});
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assignUserId, setAssignUserId] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [addAssetDialogOpen, setAddAssetDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [demoFilter, setDemoFilter] = useState('');
  const [assetForm, setAssetForm] = useState({
    asset_tag: '', product_id: '', serial_number: '', tenant_id: '', location: '',
    purchase_price: 0, purchase_date: '', depreciation_method: 'straight_line', depreciation_rate: 20,
    expiry_date: '', is_demo: false,
    is_leased: false, lessor_name: '', lease_start_date: '', lease_end_date: '', monthly_lease_payment: 0
  });
  const [serialExists, setSerialExists] = useState(null); // null | {exists, asset_tag}

  // Edit Asset state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [departments, setDepartments] = useState([]);

  // Department filter
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    fetchData();
    fetchDepartments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, demoFilter, departmentFilter]);

  const fetchData = async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (demoFilter === 'demo') params.is_demo = true;
      if (demoFilter === 'regular') params.is_demo = false;
      if (departmentFilter) params.department_id = departmentFilter;
      const [assetsRes, productsRes] = await Promise.all([
        axios.get(`${API}/assets`, { params }),
        axios.get(`${API}/products`)
      ]);

      setAssets(assetsRes.data);

      const productsMap = {};
      productsRes.data.forEach(p => productsMap[p.id] = p);
      setProducts(productsMap);

      if (user.role !== 'employee') {
        try {
          const usersRes = await axios.get(`${API}/users`);
          setUsers(usersRes.data);
        } catch {
          // Users endpoint may not be accessible for all roles
        }
      }

      if (user.role === 'super_admin') {
        try {
          const tenantsRes = await axios.get(`${API}/tenants`);
          const tenantsMap = {};
          tenantsRes.data.forEach(t => { tenantsMap[t.id] = t; });
          setTenants(tenantsMap);
        } catch {
          // Tenants endpoint only accessible to super_admin
        }
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignUserId) {
      toast.error('Please select a user');
      return;
    }
    
    try {
      await axios.patch(`${API}/assets/${selectedAsset.id}/assign`, {
        assigned_to: assignUserId
      });
      toast.success('Asset assigned successfully');
      setDialogOpen(false);
      setAssignUserId('');
      fetchData();
    } catch (error) {
      toast.error('Failed to assign asset');
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdate) {
      toast.error('Please select a status');
      return;
    }
    
    try {
      await axios.patch(`${API}/assets/${selectedAsset.id}`, {
        status: statusUpdate
      });
      toast.success('Asset status updated');
      setStatusDialogOpen(false);
      setStatusUpdate('');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/assets/${assetToDelete.id}`);
      toast.success('Asset deleted successfully');
      setDeleteDialogOpen(false);
      setAssetToDelete(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete asset');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await axios.get(`${API}/assets/export/csv`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url; a.download = 'assets_export.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await axios.get(`${API}/assets/export/xlsx`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }));
      const a = document.createElement('a');
      a.href = url; a.download = 'assets_export.xlsx'; a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel file downloaded');
    } catch (error) {
      toast.error('Failed to export Excel');
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await cachedGet(axios, `${API}/departments`, {}, 120000);
      setDepartments(res.data);
    } catch { /* silently fail */ }
  };

  const openEditDialog = (asset) => {
    setEditingAsset(asset);
    setEditForm({
      asset_tag: asset.asset_tag || '',
      serial_number: asset.serial_number || '',
      status: asset.status || 'available',
      location: asset.location || '',
      department_id: asset.department_id || '',
      purchase_date: asset.purchase_date ? asset.purchase_date.slice(0, 10) : '',
      warranty_start_date: asset.warranty_start_date ? asset.warranty_start_date.slice(0, 10) : '',
      warranty_end_date: asset.warranty_end_date ? asset.warranty_end_date.slice(0, 10) : '',
      warranty_provider: asset.warranty_provider || '',
      purchase_price: asset.purchase_price || 0,
      depreciation_method: asset.depreciation_method || 'straight_line',
      depreciation_rate: asset.depreciation_rate ?? 20,
      salvage_value: asset.salvage_value || 0,
      expiry_date: asset.expiry_date ? asset.expiry_date.slice(0, 10) : '',
      is_leased: asset.is_leased || false,
      lessor_name: asset.lessor_name || '',
      lease_start_date: asset.lease_start_date ? asset.lease_start_date.slice(0, 10) : '',
      lease_end_date: asset.lease_end_date ? asset.lease_end_date.slice(0, 10) : '',
      monthly_lease_payment: asset.monthly_lease_payment || 0,
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    try {
      const payload = {};
      Object.entries(editForm).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) payload[k] = v;
      });
      await axios.patch(`${API}/assets/${editingAsset.id}`, payload);
      toast.success('Asset updated successfully');
      setEditDialogOpen(false);
      setEditingAsset(null);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update asset');
    }
  };

  const handleImport = async () => {
    if (!importFile) { toast.error('Please select a file'); return; }
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const res = await axios.post(`${API}/assets/import`, formData);
      const { created, skipped, errors } = res.data;
      setImportResult({ created, skipped, errors });
      toast.success(`${created} asset(s) imported`);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await axios.get(`${API}/assets/import/template`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url; a.download = 'asset_import_template.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download template'); }
  };

  // Feature 10: Batch Label Printing
  const handlePrintLabels = () => {
    const selectedAssets = assets.filter(a => selectedIds.includes(a.id));
    if (selectedAssets.length === 0) return;
    const printWindow = window.open('', '_blank');
    const labelsHtml = selectedAssets.map(a => {
      const productName = products[a.product_id]?.name || 'Unknown';
      const qrValue = `${window.location.origin}/assets/${a.id}`;
      return `
        <div class="label">
          <div class="header">IT Asset Management</div>
          <div class="body">
            <div class="qr-placeholder" data-value="${qrValue}" data-tag="${a.asset_tag}">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(qrValue)}" width="80" height="80" />
            </div>
            <div class="info">
              <div class="asset-tag">${a.asset_tag}</div>
              <div class="product-name">${productName}</div>
              <hr />
              ${a.location ? `<div class="row"><span class="lbl">Location</span><span>${a.location}</span></div>` : ''}
              <div class="serial">S/N: ${a.serial_number}</div>
            </div>
          </div>
        </div>`;
    }).join('');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Asset Labels</title>
      <style>
        @page { margin: 0.5cm; }
        body { font-family: Arial, sans-serif; display: flex; flex-wrap: wrap; gap: 8px; padding: 8px; }
        .label { width: 3.5in; height: 2in; border: 2px solid #000; border-radius: 6px; overflow: hidden; display: flex; flex-direction: column; padding: 6px 8px; box-sizing: border-box; page-break-inside: avoid; }
        .header { background: #1e293b; color: #fff; text-align: center; font-size: 9px; font-weight: bold; letter-spacing: 1.5px; padding: 3px 0; margin: -6px -8px 6px -8px; text-transform: uppercase; }
        .body { display: flex; flex: 1; gap: 8px; align-items: center; }
        .info { flex: 1; min-width: 0; }
        .asset-tag { font-size: 17px; font-weight: 900; letter-spacing: 1px; }
        .product-name { font-size: 9px; color: #555; }
        hr { border: none; border-top: 1px solid #ddd; margin: 3px 0; }
        .row { display: flex; justify-content: space-between; font-size: 8px; color: #666; }
        .lbl { font-weight: bold; color: #333; }
        .serial { font-family: monospace; font-size: 8px; color: #555; margin-top: 2px; }
      </style></head><body>${labelsHtml}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  // Feature 13: Serial number duplicate check
  const checkSerialNumber = async (sn) => {
    if (!sn || sn.length < 3) { setSerialExists(null); return; }
    try {
      const tid = user.tenant_id || 'default';
      const res = await axios.get(`${API}/assets/check-serial`, { params: { serial_number: sn, tenant_id: tid } });
      setSerialExists(res.data);
    } catch { setSerialExists(null); }
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/assets`, {
        ...assetForm,
        tenant_id: user.tenant_id || assetForm.tenant_id || 'default'
      });
      toast.success('Asset added successfully');
      setAddAssetDialogOpen(false);
      setAssetForm({ asset_tag: '', product_id: '', serial_number: '', tenant_id: '', location: '', purchase_price: 0, purchase_date: '', depreciation_method: 'straight_line', depreciation_rate: 20, expiry_date: '', is_demo: false, is_leased: false, lessor_name: '', lease_start_date: '', lease_end_date: '', monthly_lease_payment: 0 });
      setSerialExists(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add asset');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: { className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15', label: 'Available' },
      assigned: { className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/15', label: 'Assigned' },
      in_use: { className: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20 hover:bg-violet-500/15', label: 'In Use' },
      under_maintenance: { className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/15', label: 'Maintenance' },
      retired: { className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 hover:bg-slate-500/15', label: 'Retired' },
      disposed: { className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 hover:bg-slate-500/15', label: 'Disposed' }
    };

    const config = statusConfig[status] || statusConfig.available;
    return (
      <Badge variant="outline" className={`gap-1.5 font-medium ${config.className}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {config.label}
      </Badge>
    );
  };

  const canManage = ['super_admin', 'tenant_admin', 'asset_manager'].includes(user?.role);

  // ── Bulk Edit State ──────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkLocation, setBulkLocation] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelectedIds(prev => prev.length === assets.length ? [] : assets.map(a => a.id));

  const handleBulkUpdate = async () => {
    if (!bulkStatus && !bulkLocation) { toast.error('Select at least one field to update'); return; }
    setBulkSaving(true);
    try {
      const payload = { ids: selectedIds };
      if (bulkStatus) payload.status = bulkStatus;
      if (bulkLocation) payload.location = bulkLocation;
      const res = await axios.put(`${API}/assets/bulk-update`, payload);
      toast.success(`${res.data.updated} assets updated`);
      setSelectedIds([]);
      setBulkEditOpen(false);
      setBulkStatus('');
      setBulkLocation('');
      fetchData();
    } catch (e) { toast.error(e.response?.data?.detail || 'Bulk update failed'); }
    finally { setBulkSaving(false); }
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in" data-testid="assets-page">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-1">
              Assets
            </h1>
            <p className="text-sm text-muted-foreground">
              Track and manage your IT asset lifecycle
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {canManage && (
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            )}
            {canManage && (
              <Button variant="outline" onClick={handleExportExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
            )}
            {canManage && (
              <Button variant="outline" onClick={() => { setImportResult(null); setImportFile(null); setImportDialogOpen(true); }}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            )}
            {canManage && (
              <Button onClick={() => setAddAssetDialogOpen(true)} data-testid="add-asset-btn">
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
            )}
          </div>
        </div>

        <Card className="border-border shadow-card">
          {/* Bulk Action Bar */}
          {canManage && selectedIds.length > 0 && (
            <div className="mx-6 mt-4 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-3 flex-wrap animate-fade-in">
              <span className="text-sm font-semibold text-primary">{selectedIds.length} selected</span>
              <div className="h-4 w-px bg-border" />
              <button onClick={() => setBulkEditOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover transition-colors">
                <Pencil className="h-3.5 w-3.5" /> Bulk Edit
              </button>
              <button onClick={handlePrintLabels}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border text-sm font-medium rounded-md hover:bg-accent transition-colors">
                <Printer className="h-3.5 w-3.5" /> Print Labels
              </button>
              <button onClick={() => setSelectedIds([])}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto">
                Clear selection
              </button>
            </div>
          )}
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <CardTitle>All Assets</CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    className="pl-8 h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm
                               placeholder:text-muted-foreground
                               focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
                    placeholder="Search assets…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter || "all"} onValueChange={v => setStatusFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-36 h-9">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_use">In Use</SelectItem>
                    <SelectItem value="under_maintenance">Maintenance</SelectItem>
                    <SelectItem value="disposed">Disposed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={demoFilter || "all"} onValueChange={v => setDemoFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-36 h-9">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="demo">Demo Assets</SelectItem>
                    <SelectItem value="regular">Regular Assets</SelectItem>
                  </SelectContent>
                </Select>
                {departments.length > 0 && (
                  <Select value={departmentFilter || "all"} onValueChange={v => setDepartmentFilter(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-44 h-9">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 bg-muted rounded-md animate-pulse"></div>
                ))}
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Laptop className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">No assets found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm || statusFilter || departmentFilter ? 'Try adjusting your search or filters.' : 'Add your first asset to get started.'}
                </p>
                {canManage && !searchTerm && !statusFilter && !departmentFilter && (
                  <Button size="sm" onClick={() => setAddAssetDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Asset
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {canManage && (
                        <TableHead className="w-10">
                          <button onClick={toggleAll} className="text-slate-400 hover:text-primary">
                            {selectedIds.length === assets.length ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                          </button>
                        </TableHead>
                      )}
                      <TableHead>Asset Tag</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Status</TableHead>
                      {user?.role === 'super_admin' && <TableHead>Tenant</TableHead>}
                      {canManage && <TableHead>Assigned To</TableHead>}
                      <TableHead>Location</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      {canManage && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map((asset) => (
                      <TableRow key={asset.id} data-testid={`asset-row-${asset.id}`}
                        className={`group transition-colors ${selectedIds.includes(asset.id) ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-accent/50'}`}>
                        {canManage && (
                          <TableCell>
                            <button onClick={() => toggleSelect(asset.id)} className="text-muted-foreground hover:text-primary transition-colors">
                              {selectedIds.includes(asset.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                            </button>
                          </TableCell>
                        )}
                        <TableCell className="font-mono text-[13px] font-semibold text-primary">
                          <div className="flex items-center gap-1.5">
                            {asset.asset_tag}
                            {asset.is_demo && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">DEMO</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {products[asset.product_id]?.name || 'Unknown Product'}
                        </TableCell>
                        <TableCell className="font-mono text-[13px] text-muted-foreground">{asset.serial_number}</TableCell>
                        <TableCell>{getStatusBadge(asset.status)}</TableCell>
                        {user?.role === 'super_admin' && (
                          <TableCell className="text-sm">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
                              {tenants[asset.tenant_id]?.name || 'Unknown'}
                            </span>
                          </TableCell>
                        )}
                        {canManage && (
                          <TableCell>
                            {asset.assigned_to ? (
                              <span>{users.find(u => u.id === asset.assigned_to)?.name || 'Unknown'}</span>
                            ) : (
                              <span className="text-muted-foreground">Unassigned</span>
                            )}
                          </TableCell>
                        )}
                        <TableCell>{asset.location || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {asset.expiry_date ? new Date(asset.expiry_date).toLocaleDateString() : '-'}
                        </TableCell>
                        {canManage && (
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {asset.status === 'available' && (
                                <Button
                                  size="sm"
                                  className="h-8 px-2.5"
                                  onClick={() => {
                                    setSelectedAsset(asset);
                                    setDialogOpen(true);
                                  }}
                                  data-testid={`assign-btn-${asset.id}`}
                                >
                                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                                  Assign
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => navigate(`/assets/${asset.id}`)}
                                title="View details"
                                data-testid={`view-details-btn-${asset.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedAsset(asset);
                                  setStatusDialogOpen(true);
                                }}
                                title="Update status"
                                data-testid={`status-btn-${asset.id}`}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => openEditDialog(asset)}
                                title="Edit asset"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setAssetToDelete(asset);
                                  setDeleteDialogOpen(true);
                                }}
                                title="Delete asset"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assign Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="assign-dialog">
          <DialogHeader>
            <DialogTitle>Assign Asset</DialogTitle>
            <DialogDescription>
              Assign {selectedAsset?.asset_tag} to an employee
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={assignUserId} onValueChange={setAssignUserId}>
              <SelectTrigger data-testid="assign-user-select">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} data-testid="confirm-assign-btn">Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent data-testid="status-dialog">
          <DialogHeader>
            <DialogTitle>Update Asset Status</DialogTitle>
            <DialogDescription>
              Change status for {selectedAsset?.asset_tag}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={statusUpdate} onValueChange={setStatusUpdate}>
              <SelectTrigger data-testid="status-select">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="in_use">In Use</SelectItem>
                <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                <SelectItem value="disposed">Disposed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleStatusUpdate} data-testid="confirm-status-btn">Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Add Asset Dialog */}
      <Dialog open={addAssetDialogOpen} onOpenChange={setAddAssetDialogOpen}>
        <DialogContent className="max-w-lg" data-testid="add-asset-dialog">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
            <DialogDescription>Manually onboard an IT asset into the system</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAsset} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="asset-tag">Asset Tag *</Label>
                <Input id="asset-tag" value={assetForm.asset_tag} onChange={(e) => setAssetForm({ ...assetForm, asset_tag: e.target.value })} placeholder="ASSET-001" required maxLength={100} data-testid="asset-tag-input" />
              </div>
              <div>
                <Label htmlFor="serial-number">Serial Number *</Label>
                <Input id="serial-number" value={assetForm.serial_number} onChange={(e) => { setAssetForm({ ...assetForm, serial_number: e.target.value }); checkSerialNumber(e.target.value); }} placeholder="SN-ABC123" required maxLength={100} data-testid="asset-serial-input" className={serialExists?.exists ? 'border-orange-400' : ''} />
                {serialExists?.exists && (
                  <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3" /> Duplicate: already used by <strong>{serialExists.asset_tag}</strong>
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="asset-product">Product *</Label>
              <Select value={assetForm.product_id} onValueChange={(val) => setAssetForm({ ...assetForm, product_id: val })}>
                <SelectTrigger data-testid="asset-product-select">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(products).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="asset-location">Location</Label>
                <Input id="asset-location" value={assetForm.location} onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })} placeholder="Office A, Floor 2" maxLength={200} data-testid="asset-location-input" />
              </div>
              <div>
                <Label htmlFor="asset-price">Purchase Price</Label>
                <Input id="asset-price" type="number" step="0.01" min="0" value={assetForm.purchase_price} onChange={(e) => setAssetForm({ ...assetForm, purchase_price: parseFloat(e.target.value) || 0 })} data-testid="asset-price-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="asset-purchase-date">Purchase Date</Label>
                <Input id="asset-purchase-date" type="date" value={assetForm.purchase_date} onChange={(e) => setAssetForm({ ...assetForm, purchase_date: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="asset-expiry-date">Expiry Date</Label>
                <Input id="asset-expiry-date" type="date" value={assetForm.expiry_date} onChange={(e) => setAssetForm({ ...assetForm, expiry_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label htmlFor="asset-dep-rate">Depreciation Rate (%/year)</Label>
              <Input id="asset-dep-rate" type="number" min="0" max="100" value={assetForm.depreciation_rate} onChange={(e) => setAssetForm({ ...assetForm, depreciation_rate: parseFloat(e.target.value) || 20 })} />
            </div>
            <div>
              <Label>Depreciation Method</Label>
              <Select value={assetForm.depreciation_method} onValueChange={(val) => setAssetForm({ ...assetForm, depreciation_method: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="straight_line">Straight Line</SelectItem>
                  <SelectItem value="declining_balance">Declining Balance</SelectItem>
                  <SelectItem value="none">No Depreciation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Asset Category</Label>
              <Select value={assetForm.is_demo ? 'demo' : 'regular'} onValueChange={(val) => setAssetForm({ ...assetForm, is_demo: val === 'demo' })}>
                <SelectTrigger data-testid="asset-category-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular Asset</SelectItem>
                  <SelectItem value="demo">Demo Asset</SelectItem>
                </SelectContent>
              </Select>
              {assetForm.is_demo && (
                <p className="text-xs text-amber-600 mt-1">This asset will be marked as a demo and visible in the Demo Assets filter.</p>
              )}
            </div>
            <div>
              <Label>Ownership Type</Label>
              <Select value={assetForm.is_leased ? 'leased' : 'owned'} onValueChange={(val) => setAssetForm({ ...assetForm, is_leased: val === 'leased' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owned">Owned</SelectItem>
                  <SelectItem value="leased">Leased</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {assetForm.is_leased && (
              <div className="space-y-3 p-3 border border-primary/20 rounded-lg bg-primary/5">
                <p className="text-xs font-semibold text-primary">Lease Details</p>
                <div>
                  <Label>Lessor Name</Label>
                  <Input value={assetForm.lessor_name} onChange={e => setAssetForm({ ...assetForm, lessor_name: e.target.value })} placeholder="e.g. ABC Leasing Pvt Ltd" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Lease Start Date</Label>
                    <Input type="date" value={assetForm.lease_start_date} onChange={e => setAssetForm({ ...assetForm, lease_start_date: e.target.value })} />
                  </div>
                  <div>
                    <Label>Lease End Date</Label>
                    <Input type="date" value={assetForm.lease_end_date} onChange={e => setAssetForm({ ...assetForm, lease_end_date: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Monthly Payment (₹)</Label>
                  <Input type="number" min="0" value={assetForm.monthly_lease_payment} onChange={e => setAssetForm({ ...assetForm, monthly_lease_payment: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddAssetDialogOpen(false)}>Cancel</Button>
              <Button type="submit" data-testid="submit-asset-btn">Add Asset</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{assetToDelete?.asset_tag}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Edit {selectedIds.length} Assets</DialogTitle>
            <DialogDescription>Update status or location for all selected assets</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Update Status (optional)</Label>
              <Select value={bulkStatus || "no_change"} onValueChange={v => setBulkStatus(v === "no_change" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Keep current status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_change">No change</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_use">In Use</SelectItem>
                  <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="disposed">Disposed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Update Location (optional)</Label>
              <Input value={bulkLocation} onChange={e => setBulkLocation(e.target.value)} placeholder="e.g. Building A, Floor 2" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEditOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkUpdate} disabled={bulkSaving}>
              {bulkSaving ? 'Saving...' : 'Apply to All Selected'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Asset Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Asset — {editingAsset?.asset_tag}</DialogTitle>
            <DialogDescription>Update any field for this asset</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Asset Tag</Label>
                <Input value={editForm.asset_tag || ''} onChange={e => setEditForm({ ...editForm, asset_tag: e.target.value })} />
              </div>
              <div>
                <Label>Serial Number</Label>
                <Input value={editForm.serial_number || ''} onChange={e => setEditForm({ ...editForm, serial_number: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={editForm.status || 'available'} onValueChange={v => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="disposed">Disposed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location</Label>
                <Input value={editForm.location || ''} onChange={e => setEditForm({ ...editForm, location: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Department</Label>
              <Select value={editForm.department_id || 'none'} onValueChange={v => setEditForm({ ...editForm, department_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="No department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No department</SelectItem>
                  {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Purchase Date</Label>
                <Input type="date" value={editForm.purchase_date || ''} onChange={e => setEditForm({ ...editForm, purchase_date: e.target.value })} />
              </div>
              <div>
                <Label>Warranty Start</Label>
                <Input type="date" value={editForm.warranty_start_date || ''} onChange={e => setEditForm({ ...editForm, warranty_start_date: e.target.value })} />
              </div>
              <div>
                <Label>Warranty End</Label>
                <Input type="date" value={editForm.warranty_end_date || ''} onChange={e => setEditForm({ ...editForm, warranty_end_date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Warranty Provider</Label>
                <Input value={editForm.warranty_provider || ''} onChange={e => setEditForm({ ...editForm, warranty_provider: e.target.value })} />
              </div>
              <div>
                <Label>Purchase Price (₹)</Label>
                <Input type="number" min="0" value={editForm.purchase_price || 0} onChange={e => setEditForm({ ...editForm, purchase_price: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Depreciation Method</Label>
                <Select value={editForm.depreciation_method || 'straight_line'} onValueChange={v => setEditForm({ ...editForm, depreciation_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="straight_line">Straight Line</SelectItem>
                    <SelectItem value="declining_balance">Declining Balance</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Depreciation Rate (%)</Label>
                <Input type="number" min="0" max="100" value={editForm.depreciation_rate ?? 20} onChange={e => setEditForm({ ...editForm, depreciation_rate: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Salvage Value (₹)</Label>
                <Input type="number" min="0" value={editForm.salvage_value || 0} onChange={e => setEditForm({ ...editForm, salvage_value: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input type="date" value={editForm.expiry_date || ''} onChange={e => setEditForm({ ...editForm, expiry_date: e.target.value })} className="w-48" />
            </div>
            <div>
              <Label>Ownership Type</Label>
              <Select value={editForm.is_leased ? 'leased' : 'owned'} onValueChange={v => setEditForm({ ...editForm, is_leased: v === 'leased' })}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owned">Owned</SelectItem>
                  <SelectItem value="leased">Leased</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editForm.is_leased && (
              <div className="space-y-3 p-3 border border-primary/20 rounded-lg bg-primary/5">
                <p className="text-xs font-semibold text-primary">Lease Details</p>
                <div>
                  <Label>Lessor Name</Label>
                  <Input value={editForm.lessor_name || ''} onChange={e => setEditForm({ ...editForm, lessor_name: e.target.value })} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Lease Start</Label>
                    <Input type="date" value={editForm.lease_start_date || ''} onChange={e => setEditForm({ ...editForm, lease_start_date: e.target.value })} />
                  </div>
                  <div>
                    <Label>Lease End</Label>
                    <Input type="date" value={editForm.lease_end_date || ''} onChange={e => setEditForm({ ...editForm, lease_end_date: e.target.value })} />
                  </div>
                  <div>
                    <Label>Monthly Payment (₹)</Label>
                    <Input type="number" min="0" value={editForm.monthly_lease_payment || 0} onChange={e => setEditForm({ ...editForm, monthly_lease_payment: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Assets Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Assets</DialogTitle>
            <DialogDescription>Upload a CSV or Excel file to bulk-import assets</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <button onClick={downloadTemplate} className="text-sm text-primary underline hover:no-underline">
              Download CSV Template
            </button>
            <div>
              <Label>Select File (.csv or .xlsx)</Label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90"
                onChange={e => { setImportFile(e.target.files[0] || null); setImportResult(null); }}
              />
            </div>
            {importResult && (
              <div className={`p-3 rounded-lg text-sm ${importResult.created > 0 ? 'bg-green-50 border border-green-200' : 'bg-slate-50 border border-slate-200'}`}>
                <p className="font-semibold text-green-700">{importResult.created} asset(s) imported successfully</p>
                {importResult.skipped > 0 && (
                  <p className="text-slate-600 mt-1">{importResult.skipped} row(s) skipped</p>
                )}
                {importResult.errors?.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {importResult.errors.slice(0, 5).map((e, i) => (
                      <li key={i} className="text-xs text-red-600">{e}</li>
                    ))}
                    {importResult.errors.length > 5 && <li className="text-xs text-slate-500">...and {importResult.errors.length - 5} more</li>}
                  </ul>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Close</Button>
            <Button onClick={handleImport} disabled={importing || !importFile}>
              {importing ? 'Importing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Assets;