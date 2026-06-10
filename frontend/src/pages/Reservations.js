import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { CalendarDays, Plus, Check, X, Clock, Laptop } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MANAGER_ROLES = ['super_admin', 'tenant_admin', 'asset_manager'];

const STATUS_BADGE = {
  pending:   'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  approved:  'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  rejected:  'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  cancelled: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  completed: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
};

const StatusBadge = ({ status }) => (
  <Badge className={STATUS_BADGE[status] || 'bg-muted text-slate-800'}>
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </Badge>
);

const Reservations = () => {
  const { user } = useAuth();
  const isManager = MANAGER_ROLES.includes(user?.role);

  const [reservations, setReservations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    asset_id: '',
    start_date: '',
    end_date: '',
    purpose: '',
  });

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/reservations`);
      setReservations(res.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAssets = async () => {
    try {
      const res = await axios.get(`${API}/assets`, { params: { status: 'available' } });
      setAssets(res.data);
    } catch (error) {
      toast.error('Failed to load available assets');
    }
  };

  const openCreateDialog = () => {
    fetchAvailableAssets();
    setFormData({ asset_id: '', start_date: '', end_date: '', purpose: '' });
    setCreateDialogOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.asset_id) { toast.error('Please select an asset'); return; }
    if (!formData.start_date) { toast.error('Please enter a start date'); return; }
    if (!formData.end_date) { toast.error('Please enter an end date'); return; }
    if (formData.end_date < formData.start_date) {
      toast.error('End date must be on or after start date');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/reservations`, formData);
      toast.success('Reservation created successfully');
      setCreateDialogOpen(false);
      fetchReservations();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create reservation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.put(`${API}/reservations/${id}?status=${status}`);
      toast.success(`Reservation ${status}`);
      fetchReservations();
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${status} reservation`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reservation?')) return;
    try {
      await axios.delete(`${API}/reservations/${id}`);
      toast.success('Reservation deleted');
      fetchReservations();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete reservation');
    }
  };

  const canCancel = (reservation) => {
    return (
      reservation.reserved_by === user?.id &&
      (reservation.status === 'pending' || reservation.status === 'approved')
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-1">
              Asset Reservations
            </h1>
            <p className="text-sm text-muted-foreground">
              Reserve assets for upcoming needs and track their status
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Reservation
          </Button>
        </div>

        {/* Reservations Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              {isManager ? 'All Reservations' : 'My Reservations'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 shimmer rounded-md" />
                ))}
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-16">
                <CalendarDays className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg font-medium mb-1">No reservations found</p>
                <p className="text-sm text-muted-foreground">
                  Click "New Reservation" to reserve an asset.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      {isManager && <TableHead>Reserved By</TableHead>}
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Laptop className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium">
                              {reservation.asset_name || reservation.asset_id}
                            </span>
                          </div>
                        </TableCell>
                        {isManager && (
                          <TableCell className="text-sm">
                            {reservation.reserved_by_name || reservation.reserved_by}
                          </TableCell>
                        )}
                        <TableCell className="text-sm">
                          {formatDate(reservation.start_date)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(reservation.end_date)}
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate" title={reservation.purpose}>
                          {reservation.purpose || <span className="text-muted-foreground italic">—</span>}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={reservation.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {/* Manager: Approve / Reject on pending */}
                            {isManager && reservation.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                                  onClick={() => handleStatusUpdate(reservation.id, 'approved')}
                                  title="Approve"
                                >
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-700 dark:text-red-400 border-red-500/30 hover:bg-red-500/10"
                                  onClick={() => handleStatusUpdate(reservation.id, 'rejected')}
                                  title="Reject"
                                >
                                  <X className="h-3.5 w-3.5 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}

                            {/* All users: Cancel their own pending/approved */}
                            {canCancel(reservation) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-slate-700 border-slate-300 hover:bg-muted/50"
                                onClick={() => handleStatusUpdate(reservation.id, 'cancelled')}
                                title="Cancel reservation"
                              >
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                Cancel
                              </Button>
                            )}

                            {/* Manager: Delete any reservation */}
                            {isManager && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(reservation.id)}
                                title="Delete reservation"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Reservation Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              New Reservation
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-2">
            {/* Asset Dropdown */}
            <div className="space-y-1.5">
              <Label htmlFor="asset_id">Asset <span className="text-red-500">*</span></Label>
              <Select
                value={formData.asset_id}
                onValueChange={(val) => setFormData({ ...formData, asset_id: val })}
              >
                <SelectTrigger id="asset_id">
                  <SelectValue placeholder="Select an available asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      No available assets
                    </SelectItem>
                  ) : (
                    assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        <span className="flex items-center gap-2">
                          <Laptop className="h-3.5 w-3.5 text-muted-foreground" />
                          {asset.asset_tag || asset.serial_number || 'Asset'}
                          {asset.serial_number && asset.asset_tag && (
                            <span className="text-xs text-muted-foreground">({asset.serial_number})</span>
                          )}
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <Label htmlFor="start_date">Start Date <span className="text-red-500">*</span></Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <Label htmlFor="end_date">End Date <span className="text-red-500">*</span></Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                min={formData.start_date || undefined}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>

            {/* Purpose */}
            <div className="space-y-1.5">
              <Label htmlFor="purpose">Purpose <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                id="purpose"
                placeholder="Briefly describe why you need this asset..."
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Create Reservation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Reservations;
