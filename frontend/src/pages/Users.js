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
import { Users as UsersIcon, Plus } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
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
      toast.success('User created successfully');
      setDialogOpen(false);
      setFormData({ email: '', password: '', name: '', role: 'employee', tenant_id: '', group_id: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };

  const getRoleBadge = (role) => {
    const config = {
      super_admin: 'bg-purple-100 text-purple-800 border-purple-300',
      tenant_admin: 'bg-blue-100 text-blue-800 border-blue-300',
      asset_manager: 'bg-green-100 text-green-800 border-green-300',
      helpdesk_agent: 'bg-orange-100 text-orange-800 border-orange-300',
      employee: 'bg-slate-100 text-slate-800 border-slate-300'
    };
    return <Badge className={config[role]}>{role.replace('_', ' ').toUpperCase()}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto" data-testid="users-page">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-heading tracking-tight mb-2">
              User Management
            </h1>
            <p className="text-base text-muted-foreground">
              Manage user accounts and permissions
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} data-testid="create-user-btn">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      {user.role === 'super_admin' && <TableHead>Tenant</TableHead>}
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} data-testid={`user-row-${u.id}`}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                        {user.role === 'super_admin' && (
                          <TableCell>
                            {tenants.find(t => t.id === u.tenant_id)?.name || 'N/A'}
                          </TableCell>
                        )}
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {u.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
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

      {/* Create User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="create-user-dialog">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="user-name-input"
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
              <Button type="submit" data-testid="submit-user-btn">Create User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Users;