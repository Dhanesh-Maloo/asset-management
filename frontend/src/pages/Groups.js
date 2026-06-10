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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { Users, Plus, Shield, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PERMISSIONS = [
  { id: 'view_orders', label: 'View Orders', category: 'Orders' },
  { id: 'approve_orders', label: 'Approve Orders', category: 'Orders' },
  { id: 'create_orders', label: 'Create Orders', category: 'Orders' },
  { id: 'view_assets', label: 'View Assets', category: 'Assets' },
  { id: 'assign_assets', label: 'Assign Assets', category: 'Assets' },
  { id: 'manage_assets', label: 'Manage Assets', category: 'Assets' },
  { id: 'view_tickets', label: 'View Tickets', category: 'Helpdesk' },
  { id: 'manage_tickets', label: 'Manage Tickets', category: 'Helpdesk' },
  { id: 'view_users', label: 'View Users', category: 'Users' },
  { id: 'manage_users', label: 'Manage Users', category: 'Users' },
];

const Groups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    group_type: 'user_group',
    tenant_id: '',
    description: '',
    permissions: []
  });
  
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const groupsRes = await axios.get(`${API}/groups`);
      setGroups(groupsRes.data);
      
      if (user.role === 'super_admin') {
        const tenantsRes = await axios.get(`${API}/tenants`);
        setTenants(tenantsRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        tenant_id: user.role === 'super_admin' ? formData.tenant_id : user.tenant_id
      };
      await axios.post(`${API}/groups`, payload);
      toast.success('Group created successfully');
      setDialogOpen(false);
      setFormData({ name: '', group_type: 'user_group', tenant_id: '', description: '', permissions: [] });
      fetchData();
    } catch (error) {
      toast.error('Failed to create group');
    }
  };

  const handleUpdatePermissions = async () => {
    try {
      await axios.patch(`${API}/groups/${selectedGroup.id}`, selectedPermissions, {
        headers: { 'Content-Type': 'application/json' }
      });
      toast.success('Permissions updated successfully');
      setPermissionsDialogOpen(false);
      setSelectedPermissions([]);
      fetchData();
    } catch (error) {
      toast.error('Failed to update permissions');
    }
  };

  const handleDelete = async (group) => {
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!groupToDelete) return;
    try {
      await axios.delete(`${API}/groups/${groupToDelete.id}`);
      toast.success('Group deleted');
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete group');
    }
  };

  const openPermissionsDialog = (group) => {
    setSelectedGroup(group);
    setSelectedPermissions(group.permissions || []);
    setPermissionsDialogOpen(true);
  };

  const togglePermission = (permId) => {
    setSelectedPermissions(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const groupPermissionsByCategory = () => {
    const grouped = {};
    PERMISSIONS.forEach(perm => {
      if (!grouped[perm.category]) grouped[perm.category] = [];
      grouped[perm.category].push(perm);
    });
    return grouped;
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in" data-testid="groups-page">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-1">
              Group Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Organize users into admin and user groups with custom permissions
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} data-testid="create-group-btn">
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Groups</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 shimmer rounded-md"></div>
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No groups found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group Name</TableHead>
                      <TableHead>Type</TableHead>
                      {user.role === 'super_admin' && <TableHead>Tenant</TableHead>}
                      <TableHead>Permissions</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((group) => (
                      <TableRow key={group.id} data-testid={`group-row-${group.id}`}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell>
                          <Badge className={group.group_type === 'admin_group' ? 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20' : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'}>
                            {group.group_type === 'admin_group' ? 'Admin Group' : 'User Group'}
                          </Badge>
                        </TableCell>
                        {user.role === 'super_admin' && (
                          <TableCell>
                            {tenants.find(t => t.id === group.tenant_id)?.name || 'N/A'}
                          </TableCell>
                        )}
                        <TableCell>
                          <span className="font-mono text-sm">{group.permissions?.length || 0} permissions</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {group.description || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPermissionsDialog(group)}
                              data-testid={`edit-permissions-btn-${group.id}`}
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              Edit Permissions
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDelete(group)}
                              data-testid={`delete-group-btn-${group.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

      {/* Create Group Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="create-group-dialog">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>Create a new admin or user group</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="group-name-input"
              />
            </div>
            <div>
              <Label htmlFor="group_type">Group Type</Label>
              <Select value={formData.group_type} onValueChange={(val) => setFormData({ ...formData, group_type: val })}>
                <SelectTrigger data-testid="group-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin_group">Admin Group</SelectItem>
                  <SelectItem value="user_group">User Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {user.role === 'super_admin' && (
              <div>
                <Label htmlFor="tenant">Tenant</Label>
                <Select value={formData.tenant_id} onValueChange={(val) => setFormData({ ...formData, tenant_id: val })}>
                  <SelectTrigger data-testid="group-tenant-select">
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                data-testid="group-description-input"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" data-testid="submit-group-btn">Create Group</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="permissions-dialog">
          <DialogHeader>
            <DialogTitle>Edit Group Permissions</DialogTitle>
            <DialogDescription>
              Configure permissions for {selectedGroup?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 max-h-96 overflow-y-auto py-4">
            {Object.entries(groupPermissionsByCategory()).map(([category, perms]) => (
              <div key={category}>
                <h3 className="font-semibold text-sm mb-3 text-primary">{category}</h3>
                <div className="space-y-2 ml-4">
                  {perms.map(perm => (
                    <div key={perm.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={perm.id}
                        checked={selectedPermissions.includes(perm.id)}
                        onCheckedChange={() => togglePermission(perm.id)}
                        data-testid={`permission-${perm.id}`}
                      />
                      <Label htmlFor={perm.id} className="text-sm cursor-pointer">{perm.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdatePermissions} data-testid="save-permissions-btn">Save Permissions</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent data-testid="delete-group-dialog">
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">"{groupToDelete?.name}"</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setGroupToDelete(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} data-testid="confirm-delete-group-btn">Delete Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Groups;