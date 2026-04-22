import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Building2, Plus, Trash2, Pencil, Users, Laptop, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Departments = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  const emptyForm = { name: '', description: '', budget: 0 };
  const [form, setForm] = useState(emptyForm);

  const canManage = ['super_admin', 'tenant_admin'].includes(user?.role);

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API}/departments`);
      setDepartments(res.data);
      // Fetch stats for each department
      const statsMap = {};
      await Promise.all(res.data.map(async (d) => {
        try {
          const s = await axios.get(`${API}/departments/${d.id}/stats`);
          statsMap[d.id] = s.data;
        } catch { statsMap[d.id] = {}; }
      }));
      setStats(statsMap);
    } catch {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/departments`, {
        ...form,
        tenant_id: user.tenant_id || 'default',
        budget: parseFloat(form.budget) || 0,
      });
      toast.success('Department created');
      setCreateOpen(false);
      setForm(emptyForm);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create department');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`${API}/departments/${selectedDept.id}`, {
        name: form.name,
        description: form.description,
        budget: parseFloat(form.budget) || 0,
      });
      toast.success('Department updated');
      setEditOpen(false);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update department');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/departments/${selectedDept.id}`);
      toast.success('Department deleted');
      setDeleteOpen(false);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete department');
    }
  };

  const openEdit = (dept) => {
    setSelectedDept(dept);
    setForm({ name: dept.name, description: dept.description, budget: dept.budget });
    setEditOpen(true);
  };

  const openDelete = (dept) => {
    setSelectedDept(dept);
    setDeleteOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-heading tracking-tight mb-2">Departments</h1>
            <p className="text-base text-muted-foreground">Manage cost centers and group assets by department</p>
          </div>
          {canManage && (
            <Button onClick={() => { setForm(emptyForm); setCreateOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Department
            </Button>
          )}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="bg-indigo-100 p-3 rounded-lg"><Building2 className="h-6 w-6 text-indigo-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Departments</p>
                <p className="text-2xl font-bold">{departments.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg"><Laptop className="h-6 w-6 text-blue-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Assets Assigned</p>
                <p className="text-2xl font-bold">{Object.values(stats).reduce((s, v) => s + (v.asset_count || 0), 0)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg"><DollarSign className="h-6 w-6 text-green-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Asset Value</p>
                <p className="text-2xl font-bold">${Object.values(stats).reduce((s, v) => s + (v.total_asset_value || 0), 0).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>All Departments</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded animate-pulse" />)}
              </div>
            ) : departments.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No departments yet. Create your first one.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Assets</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Asset Value</TableHead>
                      {canManage && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((d) => {
                      const s = stats[d.id] || {};
                      return (
                        <TableRow key={d.id}>
                          <TableCell className="font-semibold">{d.name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{d.description || '—'}</TableCell>
                          <TableCell>${(d.budget || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              <Laptop className="h-3.5 w-3.5 text-muted-foreground" />
                              {s.asset_count ?? 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              {s.user_count ?? 0}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-green-700">
                            ${(s.total_asset_value || 0).toLocaleString()}
                          </TableCell>
                          {canManage && (
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => openEdit(d)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => openDelete(d)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Department</DialogTitle>
            <DialogDescription>Create a new cost center or department</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Finance, IT, HR" required />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
            </div>
            <div>
              <Label>Annual Budget ($)</Label>
              <Input type="number" min="0" step="0.01" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label>Annual Budget ($)</Label>
              <Input type="number" min="0" step="0.01" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedDept?.name}</strong>? Assets and users assigned to this department will not be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Departments;
