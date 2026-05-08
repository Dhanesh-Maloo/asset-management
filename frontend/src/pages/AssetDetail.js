import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Separator } from '../components/ui/separator';
import {
  ArrowLeft, DollarSign, Shield, Wrench,
  LogOut as ReturnIcon, LogIn as CheckoutIcon, TrendingDown,
  Plus, AlertCircle, CheckCircle, QrCode, Printer, Clock,
  Camera, Trash2, ArrowRightLeft, Settings2, FileText, Upload,
  Download, XCircle, Wrench as AMCIcon, RefreshCw
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AssetDetail = () => {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [asset, setAsset] = useState(null);
  const [product, setProduct] = useState(null);
  const [assignedUser, setAssignedUser] = useState(null);
  const [depreciation, setDepreciation] = useState(null);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState([]);
  const [assetHistory, setAssetHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  
  const [checkoutData, setCheckoutData] = useState({
    checked_out_to: '',
    expected_return_date: ''
  });
  
  const [returnNotes, setReturnNotes] = useState('');
  
  const [maintenanceData, setMaintenanceData] = useState({
    title: '',
    description: '',
    scheduled_date: '',
    maintenance_type: 'preventive',
    assigned_to: ''
  });

  useEffect(() => {
    if (assetId) {
      fetchAssetDetails();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId]);

  const fetchAssetDetails = async () => {
    try {
      const [assetsRes, productsRes] = await Promise.all([
        axios.get(`${API}/assets`, { params: { limit: 500 } }),
        axios.get(`${API}/products`)
      ]);
      let maintenanceData = [];
      try {
        const maintenanceRes = await axios.get(`${API}/maintenance`, { params: { asset_id: assetId } });
        maintenanceData = maintenanceRes.data;
      } catch {
        // maintenance data not critical
      }
      const maintenanceRes = { data: maintenanceData };
      
      const assetData = assetsRes.data.find(a => a.id === assetId);
      if (!assetData) {
        toast.error('Asset not found');
        navigate('/assets');
        return;
      }
      
      setAsset(assetData);
      setProduct(productsRes.data.find(p => p.id === assetData.product_id));
      setMaintenanceSchedules(maintenanceRes.data);
      
      // Fetch users separately - may fail for some roles
      try {
        const usersRes = await axios.get(`${API}/users`);
        setUsers(usersRes.data);
        if (assetData.assigned_to || assetData.checked_out_to) {
          const userId = assetData.assigned_to || assetData.checked_out_to;
          setAssignedUser(usersRes.data.find(u => u.id === userId));
        }
      } catch {
        // Users endpoint may not be accessible for all roles
      }
      
      // Fetch depreciation
      try {
        const depRes = await axios.get(`${API}/assets/${assetId}/depreciation`);
        setDepreciation(depRes.data);
      } catch {
        // Depreciation may not be available for all assets
      }

      // Fetch asset history
      try {
        const histRes = await axios.get(`${API}/assets/${assetId}/history`);
        setAssetHistory(histRes.data);
      } catch {
        // History may not be available
      }
      
    } catch (error) {
      console.error('Failed to fetch asset details', error);
      toast.error('Failed to load asset details');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!checkoutData.checked_out_to || !checkoutData.expected_return_date) {
      toast.error('Please fill all fields');
      return;
    }
    
    try {
      await axios.post(`${API}/assets/${assetId}/checkout`, checkoutData);
      toast.success('Asset checked out successfully');
      setCheckoutDialogOpen(false);
      setCheckoutData({ checked_out_to: '', expected_return_date: '' });
      fetchAssetDetails();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to checkout asset');
    }
  };

  const handleReturn = async () => {
    try {
      await axios.post(`${API}/assets/${assetId}/return`, {
        condition_notes: returnNotes
      });
      toast.success('Asset returned successfully');
      setReturnDialogOpen(false);
      setReturnNotes('');
      fetchAssetDetails();
    } catch (error) {
      toast.error('Failed to return asset');
    }
  };

  const handleScheduleMaintenance = async () => {
    if (!maintenanceData.title || !maintenanceData.scheduled_date) {
      toast.error('Please fill required fields');
      return;
    }
    
    try {
      await axios.post(`${API}/maintenance`, {
        ...maintenanceData,
        asset_id: assetId
      });
      toast.success('Maintenance scheduled successfully');
      setMaintenanceDialogOpen(false);
      setMaintenanceData({
        title: '',
        description: '',
        scheduled_date: '',
        maintenance_type: 'preventive',
        assigned_to: ''
      });
      fetchAssetDetails();
    } catch (error) {
      toast.error('Failed to schedule maintenance');
    }
  };

  const getMaintenanceStatusBadge = (status) => {
    const config = {
      scheduled: { className: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Scheduled' },
      in_progress: { className: 'bg-orange-100 text-orange-800 border-orange-300', label: 'In Progress' },
      completed: { className: 'bg-green-100 text-green-800 border-green-300', label: 'Completed' },
      overdue: { className: 'bg-red-100 text-red-800 border-red-300', label: 'Overdue' }
    };
    const conf = config[status] || config.scheduled;
    return <Badge className={conf.className}>{conf.label}</Badge>;
  };

  const getWarrantyStatus = () => {
    if (!asset?.warranty_end_date) return null;
    
    const endDate = new Date(asset.warranty_end_date);
    const now = new Date();
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) {
      return { status: 'expired', color: 'bg-red-100 text-red-800 border-red-300', label: 'Expired' };
    } else if (daysRemaining <= 30) {
      return { status: 'expiring', color: 'bg-orange-100 text-orange-800 border-orange-300', label: `Expires in ${daysRemaining} days` };
    } else {
      return { status: 'active', color: 'bg-green-100 text-green-800 border-green-300', label: 'Active' };
    }
  };

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    const qrSvg = document.getElementById('asset-qr-code')?.outerHTML || '';
    const dept = asset?.department_name || '';
    const location = asset?.location || '';
    const assignedName = assignedUser?.name || '';
    const purchaseDate = asset?.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '';
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Asset Label — ${asset?.asset_tag}</title>
  <style>
    @page { size: 3.5in 2in; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; width: 3.5in; height: 2in; display: flex; align-items: stretch; background: #fff; }
    .label { width: 100%; border: 2px solid #000; border-radius: 6px; overflow: hidden; display: flex; flex-direction: column; padding: 6px 8px; }
    .header { background: #1e293b; color: #fff; text-align: center; font-size: 9px; font-weight: bold; letter-spacing: 1.5px; padding: 3px 0; margin: -6px -8px 6px -8px; text-transform: uppercase; }
    .body { display: flex; flex: 1; gap: 8px; align-items: center; }
    .qr-wrap svg { width: 80px !important; height: 80px !important; }
    .info { flex: 1; min-width: 0; }
    .asset-tag { font-size: 17px; font-weight: 900; letter-spacing: 1px; line-height: 1.2; }
    .product-name { font-size: 9px; color: #555; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    hr { border: none; border-top: 1px solid #ddd; margin: 4px 0; }
    .row { display: flex; justify-content: space-between; font-size: 8px; color: #666; margin-top: 2px; }
    .row .lbl { font-weight: bold; color: #333; }
    .serial { font-family: 'Courier New', monospace; font-size: 8px; color: #555; margin-top: 3px; }
    .footer { font-size: 7px; color: #aaa; text-align: center; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="label">
    <div class="header">IT Asset Management</div>
    <div class="body">
      <div class="qr-wrap">${qrSvg}</div>
      <div class="info">
        <div class="asset-tag">${asset?.asset_tag || ''}</div>
        <div class="product-name">${product?.name || ''}</div>
        <hr />
        ${dept ? `<div class="row"><span class="lbl">Dept</span><span>${dept}</span></div>` : ''}
        ${location ? `<div class="row"><span class="lbl">Location</span><span>${location}</span></div>` : ''}
        ${assignedName ? `<div class="row"><span class="lbl">Assigned</span><span>${assignedName}</span></div>` : ''}
        ${purchaseDate ? `<div class="row"><span class="lbl">Purchased</span><span>${purchaseDate}</span></div>` : ''}
        <div class="serial">S/N: ${asset?.serial_number || 'N/A'}</div>
      </div>
    </div>
    <div class="footer">Scan QR code to view full asset details</div>
  </div>
</body>
</html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  const canManage = ['super_admin', 'tenant_admin', 'asset_manager'].includes(user?.role);

  // ── Photo Upload ─────────────────────────────────────────────────────────
  const [photoUploading, setPhotoUploading] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setPhotoUploading(true);
    try {
      await axios.post(`${API}/assets/${assetId}/photo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Photo uploaded');
      fetchAssetDetails();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally { setPhotoUploading(false); }
  };

  const handleDeletePhoto = async () => {
    try {
      await axios.delete(`${API}/assets/${assetId}/photo`);
      toast.success('Photo removed');
      fetchAssetDetails();
    } catch { toast.error('Failed to remove photo'); }
  };

  // ── Custom Fields ─────────────────────────────────────────────────────────
  const [customFields, setCustomFields] = useState([]);
  const [customValues, setCustomValues] = useState({});
  const [customSaving, setCustomSaving] = useState(false);

  useEffect(() => {
    if (assetId) fetchCustomFields();
  }, [assetId]);

  const fetchCustomFields = async () => {
    try {
      const res = await axios.get(`${API}/custom-fields`);
      setCustomFields(res.data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (asset?.custom_values) setCustomValues(asset.custom_values);
  }, [asset]);

  const saveCustomValues = async () => {
    setCustomSaving(true);
    try {
      await axios.put(`${API}/assets/${assetId}/custom-values`, customValues);
      toast.success('Custom fields saved');
    } catch { toast.error('Failed to save custom fields'); }
    finally { setCustomSaving(false); }
  };

  // ── Documents (Feature 2) ─────────────────────────────────────────────────
  const [documents, setDocuments] = useState([]);
  const [docUploading, setDocUploading] = useState(false);
  const [docType, setDocType] = useState('other');
  const [docNotes, setDocNotes] = useState('');

  useEffect(() => { if (assetId) fetchDocuments(); }, [assetId]); // eslint-disable-line

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API}/assets/${assetId}/documents`);
      setDocuments(res.data);
    } catch { /* ignore */ }
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setDocUploading(true);
    try {
      await axios.post(`${API}/assets/${assetId}/documents?document_type=${docType}&notes=${encodeURIComponent(docNotes)}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document uploaded');
      setDocNotes('');
      fetchDocuments();
    } catch (err) { toast.error(err.response?.data?.detail || 'Upload failed'); }
    finally { setDocUploading(false); }
  };

  const handleDocDelete = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await axios.delete(`${API}/assets/${assetId}/documents/${docId}`);
      toast.success('Document deleted');
      fetchDocuments();
    } catch { toast.error('Failed to delete document'); }
  };

  const handleDocDownload = (docId, filename) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const link = document.createElement('a');
    link.href = `${API}/assets/${assetId}/documents/${docId}/download`;
    link.setAttribute('download', filename);
    // Use fetch with auth header
    fetch(`${API}/assets/${assetId}/documents/${docId}/download`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob()).then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
      }).catch(() => toast.error('Download failed'));
  };

  // ── AMC Contracts (Feature 8) ─────────────────────────────────────────────
  const [amcContracts, setAmcContracts] = useState([]);
  const [amcDialogOpen, setAmcDialogOpen] = useState(false);
  const [amcForm, setAmcForm] = useState({ vendor_name: '', contract_number: '', start_date: '', end_date: '', annual_cost: 0, renewal_reminder_days: 30, notes: '' });
  const [amcSaving, setAmcSaving] = useState(false);

  useEffect(() => { if (assetId) fetchAMC(); }, [assetId]); // eslint-disable-line

  const fetchAMC = async () => {
    try {
      const res = await axios.get(`${API}/assets/${assetId}/amc`);
      setAmcContracts(res.data);
    } catch { /* ignore */ }
  };

  const handleAddAMC = async () => {
    if (!amcForm.vendor_name || !amcForm.start_date || !amcForm.end_date) { toast.error('Fill required fields'); return; }
    setAmcSaving(true);
    try {
      await axios.post(`${API}/assets/${assetId}/amc`, amcForm);
      toast.success('AMC contract added');
      setAmcDialogOpen(false);
      setAmcForm({ vendor_name: '', contract_number: '', start_date: '', end_date: '', annual_cost: 0, renewal_reminder_days: 30, notes: '' });
      fetchAMC();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to add AMC contract'); }
    finally { setAmcSaving(false); }
  };

  const handleDeleteAMC = async (contractId) => {
    if (!window.confirm('Delete this AMC contract?')) return;
    try {
      await axios.delete(`${API}/amc/${contractId}`);
      toast.success('AMC contract deleted');
      fetchAMC();
    } catch { toast.error('Failed to delete AMC contract'); }
  };

  // ── Asset Disposal (Feature 3) ────────────────────────────────────────────
  const [disposeDialogOpen, setDisposeDialogOpen] = useState(false);
  const [disposeForm, setDisposeForm] = useState({ disposal_method: 'scrapped', disposal_date: '', disposal_notes: '', sale_proceeds: 0 });
  const [disposeSaving, setDisposeSaving] = useState(false);

  const handleDispose = async () => {
    if (!disposeForm.disposal_date) { toast.error('Please enter disposal date'); return; }
    setDisposeSaving(true);
    try {
      await axios.post(`${API}/assets/${assetId}/dispose`, disposeForm);
      toast.success('Asset marked as disposed');
      setDisposeDialogOpen(false);
      fetchAssetDetails();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to dispose asset'); }
    finally { setDisposeSaving(false); }
  };

  // ── Transfer Request ──────────────────────────────────────────────────────
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferUserId, setTransferUserId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferSaving, setTransferSaving] = useState(false);

  const handleTransfer = async () => {
    if (!transferUserId) { toast.error('Select a user'); return; }
    setTransferSaving(true);
    try {
      await axios.post(`${API}/transfers`, { asset_id: assetId, to_user_id: transferUserId, reason: transferReason });
      toast.success('Transfer request submitted');
      setTransferOpen(false);
      setTransferUserId('');
      setTransferReason('');
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to submit transfer'); }
    finally { setTransferSaving(false); }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!asset) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p>Asset not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const warrantyStatus = getWarrantyStatus();

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto" data-testid="asset-detail-page">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/assets')} size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold font-heading tracking-tight">
                {asset.asset_tag}
              </h1>
              <p className="text-base text-muted-foreground">{product?.name || 'Unknown Product'}</p>
            </div>
          </div>
          {canManage && (
            <div className="flex gap-2">
              {asset.status === 'checked_out' ? (
                <Button onClick={() => setReturnDialogOpen(true)} data-testid="return-asset-btn">
                  <ReturnIcon className="h-4 w-4 mr-2" />
                  Return Asset
                </Button>
              ) : asset.status === 'available' && (
                <Button onClick={() => setCheckoutDialogOpen(true)} data-testid="checkout-asset-btn">
                  <CheckoutIcon className="h-4 w-4 mr-2" />
                  Checkout
                </Button>
              )}
              <Button onClick={() => setMaintenanceDialogOpen(true)} variant="outline" data-testid="schedule-maintenance-btn">
                <Plus className="h-4 w-4 mr-2" />
                Schedule Maintenance
              </Button>
              {asset.status !== 'disposed' && (
                <Button variant="destructive" onClick={() => setDisposeDialogOpen(true)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Dispose
                </Button>
              )}
            </div>
          )}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="warranty">Warranty</TabsTrigger>
            <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
            <TabsTrigger value="documents">
              Documents {documents.length > 0 && <span className="ml-1 bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">{documents.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="amc">
              AMC {amcContracts.length > 0 && <span className="ml-1 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded-full">{amcContracts.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="qrcode">QR Code</TabsTrigger>
            <TabsTrigger value="photo">Photo</TabsTrigger>
            {customFields.length > 0 && <TabsTrigger value="custom">Custom Fields</TabsTrigger>}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Asset Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Serial Number</p>
                    <p className="font-mono font-semibold">{asset.serial_number}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className="mt-1 capitalize">{(asset.status || 'unknown').replace('_', ' ')}</Badge>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p>{asset.location || 'Not specified'}</p>
                  </div>
                  {asset.is_leased && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground">Ownership</p>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300 mt-1">Leased</Badge>
                      </div>
                      {asset.lessor_name && <div><p className="text-sm text-muted-foreground">Lessor</p><p className="font-medium">{asset.lessor_name}</p></div>}
                      {asset.lease_end_date && <div><p className="text-sm text-muted-foreground">Lease Ends</p><p>{new Date(asset.lease_end_date).toLocaleDateString()}</p></div>}
                      {asset.monthly_lease_payment > 0 && <div><p className="text-sm text-muted-foreground">Monthly Payment</p><p>₹{asset.monthly_lease_payment.toLocaleString()}</p></div>}
                    </>
                  )}
                  {(asset.assigned_to || asset.checked_out_to) && assignedUser && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {asset.status === 'checked_out' ? 'Checked Out To' : 'Assigned To'}
                        </p>
                        <p className="font-medium">{assignedUser.name}</p>
                        <p className="text-sm text-muted-foreground">{assignedUser.email}</p>
                      </div>
                    </>
                  )}
                  {asset.checkout_date && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground">Checkout Date</p>
                        <p>{new Date(asset.checkout_date).toLocaleDateString()}</p>
                      </div>
                      {asset.expected_return_date && (
                        <div>
                          <p className="text-sm text-muted-foreground">Expected Return</p>
                          <p>{new Date(asset.expected_return_date).toLocaleDateString()}</p>
                        </div>
                      )}
                    </>
                  )}
                  {asset.status === 'disposed' && asset.disposal_date && (
                    <>
                      <Separator />
                      <div className="p-3 bg-slate-100 rounded-lg">
                        <p className="text-sm font-semibold text-slate-600 mb-2">Disposal Information</p>
                        <div className="space-y-1 text-sm">
                          <div><span className="text-muted-foreground">Date: </span>{new Date(asset.disposal_date).toLocaleDateString()}</div>
                          <div><span className="text-muted-foreground">Method: </span><span className="capitalize">{asset.disposal_method || '—'}</span></div>
                          {asset.sale_proceeds > 0 && <div><span className="text-muted-foreground">Sale Proceeds: </span>₹{asset.sale_proceeds.toLocaleString()}</div>}
                          {asset.disposal_notes && <div><span className="text-muted-foreground">Notes: </span>{asset.disposal_notes}</div>}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {asset.purchase_date && (
                    <div>
                      <p className="text-sm text-muted-foreground">Purchase Date</p>
                      <p>{new Date(asset.purchase_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {asset.purchase_price > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground">Purchase Price</p>
                        <p className="text-xl font-bold font-heading">${(asset.purchase_price || 0).toFixed(2)}</p>
                      </div>
                      {depreciation && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm text-muted-foreground">Current Value</p>
                            <p className="text-xl font-bold font-heading text-primary">${depreciation.current_value}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Depreciation</p>
                            <p className="text-red-600 font-semibold">-${depreciation.total_depreciation}</p>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Maintenance Schedule</CardTitle>
                    <CardDescription>View and manage maintenance activities</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {maintenanceSchedules.length === 0 ? (
                  <div className="text-center py-12">
                    <Wrench className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No maintenance scheduled</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Scheduled Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenanceSchedules.map(schedule => (
                        <TableRow key={schedule.id}>
                          <TableCell className="font-medium">{schedule.title}</TableCell>
                          <TableCell className="capitalize">{schedule.maintenance_type}</TableCell>
                          <TableCell>{new Date(schedule.scheduled_date).toLocaleDateString()}</TableCell>
                          <TableCell>{getMaintenanceStatusBadge(schedule.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {schedule.description || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Warranty Tab */}
          <TabsContent value="warranty">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Warranty Information</CardTitle>
                    <CardDescription>Track warranty coverage and expiration</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!asset.warranty_end_date ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No warranty information available</p>
                  </div>
                ) : (
                  <>
                    {warrantyStatus && (
                      <div className="flex items-center gap-3 p-4 border rounded-lg bg-slate-50">
                        {warrantyStatus.status === 'active' ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <AlertCircle className="h-6 w-6 text-orange-600" />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold">Warranty Status</p>
                          <Badge className={`${warrantyStatus.color} mt-1`}>{warrantyStatus.label}</Badge>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Start Date</p>
                        <p className="font-medium">
                          {asset.warranty_start_date ? new Date(asset.warranty_start_date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">End Date</p>
                        <p className="font-medium">
                          {new Date(asset.warranty_end_date).toLocaleDateString()}
                        </p>
                      </div>
                      {asset.warranty_provider && (
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground">Warranty Provider</p>
                          <p className="font-medium">{asset.warranty_provider}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Depreciation Tab */}
          <TabsContent value="depreciation">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <TrendingDown className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Asset Depreciation</CardTitle>
                    <CardDescription>Track asset value over time</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!depreciation || asset.purchase_price === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No depreciation data available</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground mb-2">Purchase Price</p>
                          <p className="text-2xl font-bold font-heading">${depreciation.purchase_price}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground mb-2">Current Value</p>
                          <p className="text-2xl font-bold font-heading text-primary">${depreciation.current_value}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground mb-2">Depreciation</p>
                          <p className="text-2xl font-bold font-heading text-red-600">-${depreciation.total_depreciation}</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-slate-50">
                      <div>
                        <p className="text-sm text-muted-foreground">Depreciation Method</p>
                        <p className="font-medium capitalize">{(depreciation.depreciation_method || 'none').replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Annual Rate</p>
                        <p className="font-medium">{depreciation.annual_depreciation_rate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Years Owned</p>
                        <p className="font-medium">{depreciation.years_owned} years</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Salvage Value</p>
                        <p className="font-medium">${asset.salvage_value}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <Clock className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle>Asset History</CardTitle>
                    <CardDescription>Full activity log for this asset</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {assetHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No history found</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
                    <div className="space-y-4 ml-10">
                      {assetHistory.map((h, i) => (
                        <div key={h.id || i} className="relative">
                          <div className="absolute -left-6 top-1 h-4 w-4 rounded-full bg-primary border-2 border-white shadow" />
                          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-sm capitalize text-primary">
                                {(h.action || '').replace(/_/g, ' ')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(h.date).toLocaleString()}
                              </span>
                            </div>
                            {h.notes && <p className="text-sm text-slate-600">{h.notes}</p>}
                            <p className="text-xs text-muted-foreground mt-1">
                              By: {h.performed_by_name || 'System'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* QR Code Tab */}
          <TabsContent value="qrcode">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <QrCode className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>QR Code</CardTitle>
                    <CardDescription>Scan to quickly access this asset's details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-6 py-4">
                  <div className="p-6 bg-white border-2 border-slate-200 rounded-2xl shadow-sm">
                    <QRCodeSVG
                      id="asset-qr-code"
                      value={`${window.location.origin}/assets/${asset.id}`}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg">{asset.asset_tag}</p>
                    <p className="text-sm text-muted-foreground">{product?.name}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-1">{asset.serial_number}</p>
                  </div>
                  <button
                    onClick={handlePrintQR}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Printer className="h-4 w-4" />
                    Print QR Code
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photo Tab */}
          <TabsContent value="photo">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-3 rounded-lg"><Camera className="h-6 w-6 text-purple-600" /></div>
                  <div><CardTitle>Asset Photo</CardTitle><CardDescription>Upload a photo for physical identification</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent>
                {asset.photo_url ? (
                  <div className="flex flex-col items-center gap-4">
                    <img src={asset.photo_url} alt={asset.asset_tag} className="max-w-sm max-h-64 rounded-xl border border-slate-200 object-contain shadow" />
                    {canManage && (
                      <div className="flex gap-3">
                        <label className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary/90 text-sm font-medium">
                          <Camera className="h-4 w-4" />
                          Replace Photo
                          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={photoUploading} />
                        </label>
                        <button onClick={handleDeletePhoto} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100">
                          <Trash2 className="h-4 w-4" /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-12 gap-4">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                      <Camera className="h-10 w-10 text-slate-300" />
                    </div>
                    <p className="text-slate-500 text-sm">No photo uploaded yet</p>
                    {canManage && (
                      <label className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary/90 text-sm font-medium">
                        {photoUploading ? 'Uploading...' : <><Camera className="h-4 w-4" /> Upload Photo</>}
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={photoUploading} />
                      </label>
                    )}
                    <p className="text-xs text-slate-400">Supported: JPG, PNG, WEBP. Max 5MB.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab (Feature 2) */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-lg"><FileText className="h-6 w-6 text-blue-600" /></div>
                    <div><CardTitle>Documents</CardTitle><CardDescription>Invoices, warranties, AMC contracts, insurance certificates</CardDescription></div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-2">
                      <select value={docType} onChange={e => setDocType(e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm">
                        <option value="invoice">Invoice</option>
                        <option value="warranty">Warranty Card</option>
                        <option value="amc">AMC Contract</option>
                        <option value="insurance">Insurance</option>
                        <option value="other">Other</option>
                      </select>
                      <label className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary/90 text-sm font-medium">
                        <Upload className="h-4 w-4" />
                        {docUploading ? 'Uploading...' : 'Upload'}
                        <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={handleDocUpload} className="hidden" disabled={docUploading} />
                      </label>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No documents attached yet</p>
                    <p className="text-sm text-slate-400 mt-1">Upload invoices, warranty cards, contracts, or insurance documents</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-blue-500 shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{doc.filename}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs capitalize px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">{doc.document_type}</span>
                              <span className="text-xs text-slate-400">{(doc.file_size / 1024).toFixed(1)} KB</span>
                              <span className="text-xs text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</span>
                            </div>
                            {doc.notes && <p className="text-xs text-slate-500 mt-0.5">{doc.notes}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleDocDownload(doc.id, doc.filename)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Download className="h-4 w-4" />
                          </button>
                          {canManage && (
                            <button onClick={() => handleDocDelete(doc.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AMC Contracts Tab (Feature 8) */}
          <TabsContent value="amc">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-3 rounded-lg"><RefreshCw className="h-6 w-6 text-green-600" /></div>
                    <div><CardTitle>AMC Contracts</CardTitle><CardDescription>Annual Maintenance Contract tracking</CardDescription></div>
                  </div>
                  {canManage && (
                    <Button onClick={() => setAmcDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Add Contract
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {amcContracts.length === 0 ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No AMC contracts yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {amcContracts.map(c => {
                      const endDate = new Date(c.end_date);
                      const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
                      const isExpired = daysLeft < 0;
                      const isExpiring = daysLeft >= 0 && daysLeft <= c.renewal_reminder_days;
                      return (
                        <div key={c.id} className={`p-4 border rounded-lg ${isExpired ? 'border-red-200 bg-red-50' : isExpiring ? 'border-orange-200 bg-orange-50' : 'border-slate-200'}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold">{c.vendor_name}</p>
                                {isExpired && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Expired</span>}
                                {isExpiring && !isExpired && <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">Expiring in {daysLeft} days</span>}
                                {!isExpired && !isExpiring && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Active</span>}
                              </div>
                              {c.contract_number && <p className="text-sm text-slate-500">Contract #: {c.contract_number}</p>}
                              <div className="grid grid-cols-3 gap-3 mt-2 text-sm">
                                <div><span className="text-slate-400 text-xs">Start</span><p>{new Date(c.start_date).toLocaleDateString()}</p></div>
                                <div><span className="text-slate-400 text-xs">End</span><p>{new Date(c.end_date).toLocaleDateString()}</p></div>
                                <div><span className="text-slate-400 text-xs">Annual Cost</span><p>₹{c.annual_cost.toLocaleString()}</p></div>
                              </div>
                              {c.notes && <p className="text-xs text-slate-500 mt-2">{c.notes}</p>}
                            </div>
                            {canManage && (
                              <button onClick={() => handleDeleteAMC(c.id)} className="ml-3 p-2 text-red-500 hover:bg-red-100 rounded-lg">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Custom Fields Tab */}
          {customFields.length > 0 && (
            <TabsContent value="custom">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-3 rounded-lg"><Settings2 className="h-6 w-6 text-orange-600" /></div>
                    <div><CardTitle>Custom Fields</CardTitle><CardDescription>Additional asset attributes defined by your admin</CardDescription></div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {customFields.map(field => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {field.field_label}{field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.field_type === 'select' ? (
                        <select value={customValues[field.field_name] || ''} onChange={e => setCustomValues({ ...customValues, [field.field_name]: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" disabled={!canManage}>
                          <option value="">Select...</option>
                          {field.options.map(o => <option key={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                          value={customValues[field.field_name] || ''}
                          onChange={e => setCustomValues({ ...customValues, [field.field_name]: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                          readOnly={!canManage} />
                      )}
                    </div>
                  ))}
                  {canManage && (
                    <button onClick={saveCustomValues} disabled={customSaving}
                      className="mt-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50">
                      {customSaving ? 'Saving...' : 'Save Custom Fields'}
                    </button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Transfer Request Button (floating, if asset is assigned) */}
        {canManage && asset.assigned_to && (
          <div className="mt-6">
            <button onClick={() => setTransferOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium transition-colors">
              <ArrowRightLeft className="h-4 w-4" /> Request Asset Transfer
            </button>
          </div>
        )}
      </div>

      {/* Checkout Dialog */}
      <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
        <DialogContent data-testid="checkout-dialog">
          <DialogHeader>
            <DialogTitle>Checkout Asset</DialogTitle>
            <DialogDescription>Assign this asset to a user temporarily</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="checkout_user">Checkout To</Label>
              <Select value={checkoutData.checked_out_to} onValueChange={(val) => setCheckoutData({...checkoutData, checked_out_to: val})}>
                <SelectTrigger data-testid="checkout-user-select">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="return_date">Expected Return Date</Label>
              <Input
                id="return_date"
                type="date"
                value={checkoutData.expected_return_date}
                onChange={(e) => setCheckoutData({...checkoutData, expected_return_date: e.target.value})}
                data-testid="checkout-return-date-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCheckout} data-testid="confirm-checkout-btn">Checkout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent data-testid="return-dialog">
          <DialogHeader>
            <DialogTitle>Return Asset</DialogTitle>
            <DialogDescription>Mark this asset as returned</DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="return_notes">Condition Notes</Label>
            <Textarea
              id="return_notes"
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="Note any damage or issues..."
              rows={4}
              data-testid="return-notes-input"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleReturn} data-testid="confirm-return-btn">Return Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Maintenance Dialog */}
      <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
        <DialogContent data-testid="maintenance-dialog">
          <DialogHeader>
            <DialogTitle>Schedule Maintenance</DialogTitle>
            <DialogDescription>Create a new maintenance schedule for this asset</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={maintenanceData.title}
                onChange={(e) => setMaintenanceData({...maintenanceData, title: e.target.value})}
                placeholder="e.g., Quarterly inspection"
                data-testid="maintenance-title-input"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={maintenanceData.description}
                onChange={(e) => setMaintenanceData({...maintenanceData, description: e.target.value})}
                rows={3}
                data-testid="maintenance-description-input"
              />
            </div>
            <div>
              <Label htmlFor="scheduled_date">Scheduled Date *</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={maintenanceData.scheduled_date}
                onChange={(e) => setMaintenanceData({...maintenanceData, scheduled_date: e.target.value})}
                data-testid="maintenance-date-input"
              />
            </div>
            <div>
              <Label htmlFor="maintenance_type">Type</Label>
              <Select value={maintenanceData.maintenance_type} onValueChange={(val) => setMaintenanceData({...maintenanceData, maintenance_type: val})}>
                <SelectTrigger data-testid="maintenance-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventive">Preventive</SelectItem>
                  <SelectItem value="corrective">Corrective</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaintenanceDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleScheduleMaintenance} data-testid="confirm-maintenance-btn">Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add AMC Contract Dialog (Feature 8) */}
      <Dialog open={amcDialogOpen} onOpenChange={setAmcDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add AMC Contract</DialogTitle>
            <DialogDescription>Track an Annual Maintenance Contract for this asset</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Vendor Name *</Label>
              <input value={amcForm.vendor_name} onChange={e => setAmcForm({...amcForm, vendor_name: e.target.value})} placeholder="e.g. TechCare Services" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <Label>Contract Number</Label>
              <input value={amcForm.contract_number} onChange={e => setAmcForm({...amcForm, contract_number: e.target.value})} placeholder="e.g. AMC/2024/001" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date *</Label>
                <input type="date" value={amcForm.start_date} onChange={e => setAmcForm({...amcForm, start_date: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <Label>End Date *</Label>
                <input type="date" value={amcForm.end_date} onChange={e => setAmcForm({...amcForm, end_date: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Annual Cost (₹)</Label>
                <input type="number" min="0" value={amcForm.annual_cost} onChange={e => setAmcForm({...amcForm, annual_cost: parseFloat(e.target.value) || 0})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <Label>Renewal Reminder (days before)</Label>
                <input type="number" min="1" max="180" value={amcForm.renewal_reminder_days} onChange={e => setAmcForm({...amcForm, renewal_reminder_days: parseInt(e.target.value) || 30})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <textarea value={amcForm.notes} onChange={e => setAmcForm({...amcForm, notes: e.target.value})} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAmcDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddAMC} disabled={amcSaving}>{amcSaving ? 'Saving...' : 'Add Contract'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispose Asset Dialog (Feature 3) */}
      <Dialog open={disposeDialogOpen} onOpenChange={setDisposeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dispose / Write-off Asset</DialogTitle>
            <DialogDescription>Mark <strong>{asset?.asset_tag}</strong> as disposed. The record is preserved for audit purposes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Disposal Method *</Label>
              <select value={disposeForm.disposal_method} onChange={e => setDisposeForm({...disposeForm, disposal_method: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="sold">Sold</option>
                <option value="scrapped">Scrapped</option>
                <option value="donated">Donated</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label>Disposal Date *</Label>
              <input type="date" value={disposeForm.disposal_date} onChange={e => setDisposeForm({...disposeForm, disposal_date: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            {disposeForm.disposal_method === 'sold' && (
              <div>
                <Label>Sale Proceeds (₹)</Label>
                <input type="number" min="0" value={disposeForm.sale_proceeds} onChange={e => setDisposeForm({...disposeForm, sale_proceeds: parseFloat(e.target.value) || 0})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            )}
            <div>
              <Label>Notes / Reason</Label>
              <textarea value={disposeForm.disposal_notes} onChange={e => setDisposeForm({...disposeForm, disposal_notes: e.target.value})} rows={3} placeholder="Reason for disposal..." className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              This asset will be marked as <strong>Disposed</strong>. The record will be kept for compliance and audit. This is different from deleting.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisposeDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDispose} disabled={disposeSaving}>{disposeSaving ? 'Processing...' : 'Confirm Disposal'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Request Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Asset Transfer</DialogTitle>
            <DialogDescription>Transfer {asset?.asset_tag} to another user</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Transfer To</Label>
              <Select value={transferUserId} onValueChange={setTransferUserId}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>
                  {users.filter(u => u.id !== asset?.assigned_to).map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Input value={transferReason} onChange={e => setTransferReason(e.target.value)} placeholder="e.g. Employee transfer to another department" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferOpen(false)}>Cancel</Button>
            <Button onClick={handleTransfer} disabled={transferSaving}>
              {transferSaving ? 'Submitting...' : 'Submit Transfer Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AssetDetail;