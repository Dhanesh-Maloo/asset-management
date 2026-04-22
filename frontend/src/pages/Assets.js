import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
import { Laptop, Eye, Plus, Trash2, Search, Download, CheckSquare, Square, Pencil } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Assets = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [products, setProducts] = useState({});
  const [users, setUsers] = useState([]);
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
  const [assetForm, setAssetForm] = useState({
    asset_tag: '', product_id: '', serial_number: '', tenant_id: '', location: '',
    purchase_price: 0, purchase_date: '', depreciation_method: 'straight_line', depreciation_rate: 20
  });

  useEffect(() => {
    fetchData();
  }, [searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
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
      const response = await axios.get(`${API}/assets/export/csv`, {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'assets_export.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to export CSV');
    }
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
      setAssetForm({ asset_tag: '', product_id: '', serial_number: '', tenant_id: '', location: '', purchase_price: 0, purchase_date: '', depreciation_method: 'straight_line', depreciation_rate: 20 });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add asset');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: { className: 'bg-green-100 text-green-800 border-green-300', label: 'Available' },
      assigned: { className: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Assigned' },
      in_use: { className: 'bg-purple-100 text-purple-800 border-purple-300', label: 'In Use' },
      under_maintenance: { className: 'bg-orange-100 text-orange-800 border-orange-300', label: 'Maintenance' },
      disposed: { className: 'bg-slate-100 text-slate-800 border-slate-300', label: 'Disposed' }
    };
    
    const config = statusConfig[status] || statusConfig.available;
    return <Badge className={config.className}>{config.label}</Badge>;
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
      <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto" data-testid="assets-page">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-heading tracking-tight mb-2">
              Asset Management
            </h1>
            <p className="text-base text-muted-foreground">
              Track and manage IT assets lifecycle
            </p>
          </div>
          <div className="flex gap-2">
            {canManage && (
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
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

        <Card>
          {/* Bulk Action Bar */}
          {canManage && selectedIds.length > 0 && (
            <div className="mx-6 mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-primary">{selectedIds.length} selected</span>
              <button onClick={() => setBulkEditOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90">
                <Pencil className="h-3.5 w-3.5" /> Bulk Edit
              </button>
              <button onClick={() => setSelectedIds([])}
                className="text-sm text-slate-500 hover:text-slate-700 underline">
                Clear selection
              </button>
            </div>
          )}
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <CardTitle>All Assets</CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    className="pl-8 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    placeholder="Search assets..."
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
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-12">
                <Laptop className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No assets found</p>
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
                      {canManage && <TableHead>Assigned To</TableHead>}
                      <TableHead>Location</TableHead>
                      {canManage && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map((asset) => (
                      <TableRow key={asset.id} data-testid={`asset-row-${asset.id}`}
                        className={selectedIds.includes(asset.id) ? 'bg-primary/5' : ''}>
                        {canManage && (
                          <TableCell>
                            <button onClick={() => toggleSelect(asset.id)} className="text-slate-400 hover:text-primary">
                              {selectedIds.includes(asset.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                            </button>
                          </TableCell>
                        )}
                        <TableCell className="font-mono font-semibold text-primary">
                          {asset.asset_tag}
                        </TableCell>
                        <TableCell className="font-medium">
                          {products[asset.product_id]?.name || 'Unknown Product'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{asset.serial_number}</TableCell>
                        <TableCell>{getStatusBadge(asset.status)}</TableCell>
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
                        {canManage && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate(`/assets/${asset.id}`)}
                                data-testid={`view-details-btn-${asset.id}`}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                              {asset.status === 'available' && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAsset(asset);
                                    setDialogOpen(true);
                                  }}
                                  data-testid={`assign-btn-${asset.id}`}
                                >
                                  Assign
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedAsset(asset);
                                  setStatusDialogOpen(true);
                                }}
                                data-testid={`status-btn-${asset.id}`}
                              >
                                Update Status
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setAssetToDelete(asset);
                                  setDeleteDialogOpen(true);
                                }}
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
                <Input id="asset-tag" value={assetForm.asset_tag} onChange={(e) => setAssetForm({ ...assetForm, asset_tag: e.target.value })} placeholder="ASSET-001" required data-testid="asset-tag-input" />
              </div>
              <div>
                <Label htmlFor="serial-number">Serial Number *</Label>
                <Input id="serial-number" value={assetForm.serial_number} onChange={(e) => setAssetForm({ ...assetForm, serial_number: e.target.value })} placeholder="SN-ABC123" required data-testid="asset-serial-input" />
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
                <Input id="asset-location" value={assetForm.location} onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })} placeholder="Office A, Floor 2" data-testid="asset-location-input" />
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
                <Label htmlFor="asset-dep-rate">Depreciation Rate (%/year)</Label>
                <Input id="asset-dep-rate" type="number" min="0" max="100" value={assetForm.depreciation_rate} onChange={(e) => setAssetForm({ ...assetForm, depreciation_rate: parseFloat(e.target.value) || 20 })} />
              </div>
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
    </DashboardLayout>
  );
};

export default Assets;