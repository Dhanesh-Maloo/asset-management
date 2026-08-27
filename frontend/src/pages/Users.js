import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Users as UsersIcon, Plus, Trash2, Mail, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [groups, setGroups] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'employee' });
  const [inviteResult, setInviteResult] = useState(null);
  const [inviteSending, setInviteSending] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    employee_id: '',
    role: 'employee',
    tenant_id: '',
    group_id: ''
  });

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const usersRes = await axios.get(`${API}/users`);
      setUsers(usersRes.data);

      const groupsRes = await axios.get(`${API}/groups`);
      setGroups(groupsRes.data);

      if (user.role === 'super_admin') {
        const tenantsRes = await axios.get(`${API}/tenants`);
        setTenants(tenantsRes.data);
      }

      try {
        const invitesRes = await axios.get(`${API}/auth/invites`);
        setPendingInvites(invitesRes.data);
      } catch {
        // silently fail if endpoint not accessible
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/auth/register`, formData);
      toast.success('Employee added successfully');
      setDialogOpen(false);
      setFormData({ email: '', password: '', first_name: '', last_name: '', employee_id: '', role: 'employee', tenant_id: '', group_id: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add employee');
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteSending(true);
    try {
      const res = await axios.post(`${API}/auth/invite`, inviteForm);
      setInviteResult(res.data);
      if (res.data.email_sent === false) {
        toast.warning('Invitation created, but the email could not be sent. Share the link manually.');
      } else {
        toast.success('Invitation created!');
      }
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send invitation');
    } finally {
      setInviteSending(false);
    }
  };

  const copyInviteLink = () => {
    if (!inviteResult?.invite_link) return;
    navigator.clipboard.writeText(inviteResult.invite_link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success('Link copied to clipboard');
  };

  const openDeleteUser = (u) => {
    setUserToDelete(u);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    try {
      await axios.delete(`${API}/users/${userToDelete.id}`);
      toast.success(`Employee "${userToDelete.name}" deleted`);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete employee');
    }
  };

  const canDeleteUser = (u) => {
    if (user.id === u.id) return false;
    if (user.role === 'super_admin') return true;
    if (user.role === 'tenant_admin' && u.role !== 'tenant_admin' && u.role !== 'super_admin') return true;
    return false;
  };

  const getRoleBadge = (role) => {
    const config = {
      super_admin: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20',
      tenant_admin: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
      asset_manager: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
      helpdesk_agent: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
      employee: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
    };
    return <Badge className={config[role]}>{role.replace('_', ' ').toUpperCase()}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in" data-testid="users-page">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-1">
              Employee Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage employee records and permissions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setInviteForm({ email: '', role: 'employee' }); setInviteResult(null); setInviteDialogOpen(true); }}>
              <Mail className="h-4 w-4 mr-2" />
              Invite Employee
            </Button>
            <Button onClick={() => setDialogOpen(true)} data-testid="create-user-btn">
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Employees</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 shimmer rounded-md"></div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No employees found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      {user.role === 'super_admin' && <TableHead>Tenant</TableHead>}
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} data-testid={`user-row-${u.id}`}>
                        <TableCell className="text-sm text-muted-foreground">{u.employee_id || '-'}</TableCell>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                        {user.role === 'super_admin' && (
                          <TableCell>
                            {tenants.find(t => t.id === u.tenant_id)?.name || 'N/A'}
                          </TableCell>
                        )}
                        <TableCell>
                          <Badge variant="outline" className="gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {u.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {canDeleteUser(u) && (
                            <Button size="sm" variant="ghost" className="h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => openDeleteUser(u)} data-testid={`delete-user-btn-${u.id}`}>
                              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                              Delete
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        {pendingInvites.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" />
                Pending Invitations ({pendingInvites.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Expires At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvites.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell>{inv.email}</TableCell>
                        <TableCell>{getRoleBadge(inv.role)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(inv.expires_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={(open) => { setInviteDialogOpen(open); if (!open) { setInviteResult(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Employee</DialogTitle>
            <DialogDescription>Send an email invitation to join the system</DialogDescription>
          </DialogHeader>
          {inviteResult ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 text-sm font-medium">
                <Check className="h-4 w-4 flex-shrink-0" />
                Invitation created successfully!
              </div>
              <div>
                <Label className="mb-1 block text-sm">Invite Link (share this with the user)</Label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={inviteResult.invite_link}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs bg-muted/50 font-mono truncate"
                  />
                  <Button size="sm" variant="outline" onClick={copyInviteLink}>
                    {copiedLink ? <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-1">Link expires in 7 days</p>
              </div>
              <DialogFooter>
                <Button onClick={() => { setInviteDialogOpen(false); setInviteResult(null); }}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="invite-role">Role</Label>
                <Select value={inviteForm.role} onValueChange={(val) => setInviteForm({ ...inviteForm, role: val })}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="helpdesk_agent">Helpdesk Agent</SelectItem>
                    <SelectItem value="asset_manager">Asset Manager</SelectItem>
                    <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={inviteSending}>
                  <Mail className="h-4 w-4 mr-2" />
                  {inviteSending ? 'Sending...' : 'Send Invite'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="create-user-dialog">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>Add a new employee to the system</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                  maxLength={100}
                  data-testid="user-first-name-input"
                />
              </div>
              <div>
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                  maxLength={100}
                  data-testid="user-last-name-input"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="employee-id">Employee ID</Label>
              <Input
                id="employee-id"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                placeholder="EMP-001"
                maxLength={50}
                data-testid="user-employee-id-input"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="user-email-input"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                data-testid="user-password-input"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                <SelectTrigger data-testid="user-role-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {user.role === 'super_admin' && <SelectItem value="super_admin">Super Admin</SelectItem>}
                  <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                  <SelectItem value="asset_manager">Asset Manager</SelectItem>
                  <SelectItem value="helpdesk_agent">Helpdesk Agent</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {user.role === 'super_admin' && (
              <div>
                <Label htmlFor="tenant">Tenant</Label>
                <Select value={formData.tenant_id} onValueChange={(val) => setFormData({ ...formData, tenant_id: val })}>
                  <SelectTrigger data-testid="user-tenant-select">
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="group">Group (Optional)</Label>
              <Select value={formData.group_id || "none"} onValueChange={(val) => setFormData({ ...formData, group_id: val === "none" ? "" : val })}>
                <SelectTrigger data-testid="user-group-select">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {groups.filter(g => g.tenant_id === (user.role === 'super_admin' ? formData.tenant_id : user.tenant_id)).map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" data-testid="submit-user-btn">Add Employee</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent data-testid="delete-user-dialog">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Employee</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{userToDelete?.name}</span> ({userToDelete?.email})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser} data-testid="confirm-delete-user-btn">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Users;
