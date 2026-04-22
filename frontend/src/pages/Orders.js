import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { CheckCircle, XCircle, Package as PackageIcon, UserCheck, UserCog, ArrowRight, Trash2, Download, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState({});
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        axios.get(`${API}/orders`),
        axios.get(`${API}/products`)
      ]);
      
      setOrders(ordersRes.data);
      
      const productsMap = {};
      productsRes.data.forEach(p => productsMap[p.id] = p);
      setProducts(productsMap);
      
      if (user.role !== 'employee') {
        const usersRes = await axios.get(`${API}/users`);
        const usersMap = {};
        usersRes.data.forEach(u => usersMap[u.id] = u);
        setUsers(usersMap);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckerApprove = async (orderId) => {
    try {
      await axios.post(`${API}/orders/${orderId}/checker-approve`, null, {
        params: { comments: 'Checked and verified' }
      });
      toast.success('Order approved by checker');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve order');
    }
  };

  const handleApproverApprove = async (orderId) => {
    try {
      await axios.post(`${API}/orders/${orderId}/approver-approve`, null, {
        params: { comments: 'Final approval granted' }
      });
      toast.success('Order approved - Ready for fulfillment');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve order');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      await axios.post(`${API}/orders/${selectedOrder.id}/reject`, null, {
        params: { rejection_reason: rejectionReason }
      });
      toast.success('Order rejected');
      setRejectDialogOpen(false);
      setRejectionReason('');
      fetchData();
    } catch (error) {
      toast.error('Failed to reject order');
    }
  };

  const handleFulfill = async (orderId) => {
    try {
      await axios.patch(`${API}/orders/${orderId}`, { status: 'fulfilled' });
      toast.success('Order marked as fulfilled');
      fetchData();
    } catch (error) {
      toast.error('Failed to fulfill order');
    }
  };

  const handleDeleteOrder = async () => {
    try {
      await axios.delete(`${API}/orders/${orderToDelete.id}`);
      toast.success('Order deleted successfully');
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete order');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await axios.get(`${API}/orders/export/csv`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'orders_export.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  const openRejectDialog = (order) => {
    setSelectedOrder(order);
    setRejectDialogOpen(true);
  };

  const getApprovalStageBadge = (order) => {
    if (order.status === 'rejected') {
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
    }
    if (order.status === 'fulfilled') {
      return <Badge className="bg-purple-100 text-purple-800 border-purple-300 gap-1"><PackageIcon className="h-3 w-3" />Fulfilled</Badge>;
    }
    if (order.status === 'approved') {
      return <Badge className="bg-green-100 text-green-800 border-green-300 gap-1"><CheckCircle className="h-3 w-3" />Approved</Badge>;
    }

    // Pending - show approval stage
    if (!order.approval_stage || order.approval_stage === 'maker') {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <UserCog className="h-3 w-3" />Pending Review
          </Badge>
        </div>
      );
    }
    
    if (order.approval_stage === 'checker') {
      return (
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 gap-1">
            <UserCheck className="h-3 w-3" />Checker Approved
          </Badge>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline">Awaiting Approver</Badge>
        </div>
      );
    }

    return null;
  };

  const getActionButtons = (order) => {
    const isChecker = ['super_admin', 'tenant_admin', 'asset_manager'].includes(user?.role);
    const isApprover = ['super_admin', 'tenant_admin'].includes(user?.role);

    if (order.status === 'rejected' || order.status === 'fulfilled') {
      return null;
    }

    // Approved order - can fulfill
    if (order.status === 'approved' && isApprover) {
      return (
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => handleFulfill(order.id)}
          data-testid={`fulfill-btn-${order.id}`}
        >
          Mark Fulfilled
        </Button>
      );
    }

    // Pending order - needs checker approval
    if (order.status === 'pending' && (!order.approval_stage || order.approval_stage === 'maker')) {
      if (isChecker) {
        return (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => handleCheckerApprove(order.id)}
              data-testid={`checker-approve-btn-${order.id}`}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <UserCheck className="h-4 w-4 mr-1" />
              Checker Approve
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => openRejectDialog(order)}
              data-testid={`reject-btn-${order.id}`}
            >
              Reject
            </Button>
          </div>
        );
      }
      return <Badge variant="outline">Awaiting Checker</Badge>;
    }

    // Checker approved - needs approver
    if (order.approval_stage === 'checker' && isApprover) {
      return (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={() => handleApproverApprove(order.id)}
            data-testid={`approver-approve-btn-${order.id}`}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Final Approve
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => openRejectDialog(order)}
            data-testid={`reject-btn-${order.id}`}
          >
            Reject
          </Button>
        </div>
      );
    }

    if (order.approval_stage === 'checker' && !isApprover) {
      return <Badge variant="outline">Awaiting Approver</Badge>;
    }

    return null;
  };

  const canManage = ['super_admin', 'tenant_admin', 'asset_manager'].includes(user?.role);

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto" data-testid="orders-page">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-heading tracking-tight mb-2">
              Orders
            </h1>
            <p className="text-base text-muted-foreground">
              Manage asset orders with maker-checker-approver workflow
            </p>
          </div>
          {canManage && (
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>

        {/* Workflow Explanation */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="bg-slate-100 p-2 rounded">
                  <UserCog className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Maker</p>
                  <p className="text-xs text-muted-foreground">Creates order</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400" />
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Checker</p>
                  <p className="text-xs text-muted-foreground">Reviews & verifies</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400" />
              <div className="flex items-center gap-2">
                <div className="bg-green-100 p-2 rounded">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Approver</p>
                  <p className="text-xs text-muted-foreground">Final authorization</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <PackageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-medium mb-2">No orders found</p>
                {user?.role === 'employee' && (
                  <p className="text-sm text-muted-foreground mb-4">
                    To place a new order, go to the Product Catalog and click <strong>Order Now</strong> on any product.
                  </p>
                )}
                {user?.role === 'employee' && (
                  <button
                    onClick={() => navigate('/products')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Go to Product Catalog
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      {user.role !== 'employee' && <TableHead>Ordered By</TableHead>}
                      <TableHead>Approval Stage</TableHead>
                      <TableHead>Date</TableHead>
                      {canManage && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id} data-testid={`order-row-${order.id}`}>
                        <TableCell className="font-medium">
                          {products[order.product_id]?.name || 'Unknown Product'}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono font-semibold">{order.quantity}</span>
                        </TableCell>
                        {user.role !== 'employee' && (
                          <TableCell>{users[order.user_id]?.name || 'Unknown User'}</TableCell>
                        )}
                        <TableCell>{getApprovalStageBadge(order)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                        {canManage && (
                          <TableCell>
                            <div className="flex gap-2 items-center">
                              {getActionButtons(order)}
                              {order.status !== 'fulfilled' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => { setOrderToDelete(order); setDeleteDialogOpen(true); }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
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

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent data-testid="reject-order-dialog">
          <DialogHeader>
            <DialogTitle>Reject Order</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rejection_reason">Rejection Reason</Label>
              <Textarea
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Budget constraints, duplicate order, specifications unclear..."
                rows={4}
                data-testid="rejection-reason-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} data-testid="confirm-reject-btn">
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Order Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this order for <strong>{products[orderToDelete?.product_id]?.name}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteOrder}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Orders;
