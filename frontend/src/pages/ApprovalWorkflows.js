import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { GitBranch, Plus, CheckCircle2, UserCheck, UserCog } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ApprovalWorkflows = () => {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState([]);
  const [groups, setGroups] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    tenant_id: '',
    entity_type: 'order',
    requires_checker: true,
    requires_approver: true,
    min_value_threshold: 0,
    checker_group_id: '',
    approver_group_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [workflowsRes, groupsRes] = await Promise.all([
        axios.get(`${API}/approval-workflows`),
        axios.get(`${API}/groups`)
      ]);
      
      setWorkflows(workflowsRes.data);
      setGroups(groupsRes.data);
      
      if (user.role === 'super_admin') {
        const tenantsRes = await axios.get(`${API}/tenants`);
        setTenants(tenantsRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to load workflows');
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
      await axios.post(`${API}/approval-workflows`, payload);
      toast.success('Workflow created successfully');
      setDialogOpen(false);
      setFormData({
        tenant_id: '',
        entity_type: 'order',
        requires_checker: true,
        requires_approver: true,
        min_value_threshold: 0,
        checker_group_id: '',
        approver_group_id: ''
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to create workflow');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto" data-testid="workflows-page">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-heading tracking-tight mb-2">
              Approval Workflows
            </h1>
            <p className="text-base text-muted-foreground">
              Configure maker-checker-approver workflows for orders and assets
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} data-testid="create-workflow-btn">
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </div>

        {/* Workflow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <UserCog className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Maker</CardTitle>
                  <CardDescription className="text-xs">Creates request</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Employee initiates order or asset request</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <UserCheck className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Checker</CardTitle>
                  <CardDescription className="text-xs">Reviews request</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Asset Manager validates details and requirements</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Approver</CardTitle>
                  <CardDescription className="text-xs">Final approval</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Admin gives final authorization</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configured Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : workflows.length === 0 ? (
              <div className="text-center py-12">
                <GitBranch className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No workflows configured</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entity Type</TableHead>
                      {user.role === 'super_admin' && <TableHead>Tenant</TableHead>}
                      <TableHead>Requires Checker</TableHead>
                      <TableHead>Requires Approver</TableHead>
                      <TableHead>Min Value</TableHead>
                      <TableHead>Checker Group</TableHead>
                      <TableHead>Approver Group</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workflows.map((workflow) => (
                      <TableRow key={workflow.id} data-testid={`workflow-row-${workflow.id}`}>
                        <TableCell className="font-medium capitalize">{workflow.entity_type}</TableCell>
                        {user.role === 'super_admin' && (
                          <TableCell>
                            {tenants.find(t => t.id === workflow.tenant_id)?.name || 'N/A'}
                          </TableCell>
                        )}
                        <TableCell>
                          {workflow.requires_checker ? (
                            <Badge className="bg-green-100 text-green-800 border-green-300">Yes</Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {workflow.requires_approver ? (
                            <Badge className="bg-green-100 text-green-800 border-green-300">Yes</Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono">${workflow.min_value_threshold}</TableCell>
                        <TableCell>
                          {groups.find(g => g.id === workflow.checker_group_id)?.name || '-'}
                        </TableCell>
                        <TableCell>
                          {groups.find(g => g.id === workflow.approver_group_id)?.name || '-'}
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

      {/* Create Workflow Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="create-workflow-dialog" className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Approval Workflow</DialogTitle>
            <DialogDescription>Configure a new maker-checker-approver workflow</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="entity_type">Entity Type</Label>
                <Select value={formData.entity_type} onValueChange={(val) => setFormData({ ...formData, entity_type: val })}>
                  <SelectTrigger data-testid="workflow-entity-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">Order</SelectItem>
                    <SelectItem value="asset">Asset</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {user.role === 'super_admin' && (
                <div>
                  <Label htmlFor="tenant">Tenant</Label>
                  <Select value={formData.tenant_id} onValueChange={(val) => setFormData({ ...formData, tenant_id: val })}>
                    <SelectTrigger data-testid="workflow-tenant-select">
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
            </div>
            
            <div>
              <Label htmlFor="min_value">Minimum Value Threshold ($)</Label>
              <Input
                id="min_value"
                type="number"
                step="0.01"
                value={formData.min_value_threshold}
                onChange={(e) => setFormData({ ...formData, min_value_threshold: parseFloat(e.target.value) })}
                data-testid="workflow-min-value-input"
              />
              <p className="text-xs text-muted-foreground mt-1">Workflow applies to transactions above this value</p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="requires_checker">Requires Checker Approval</Label>
                <p className="text-xs text-muted-foreground">Asset Manager reviews request</p>
              </div>
              <Switch
                id="requires_checker"
                checked={formData.requires_checker}
                onCheckedChange={(val) => setFormData({ ...formData, requires_checker: val })}
                data-testid="workflow-requires-checker-switch"
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="requires_approver">Requires Approver Approval</Label>
                <p className="text-xs text-muted-foreground">Admin gives final approval</p>
              </div>
              <Switch
                id="requires_approver"
                checked={formData.requires_approver}
                onCheckedChange={(val) => setFormData({ ...formData, requires_approver: val })}
                data-testid="workflow-requires-approver-switch"
              />
            </div>

            {formData.requires_checker && (
              <div>
                <Label htmlFor="checker_group">Checker Group</Label>
                <Select value={formData.checker_group_id} onValueChange={(val) => setFormData({ ...formData, checker_group_id: val })}>
                  <SelectTrigger data-testid="workflow-checker-group-select">
                    <SelectValue placeholder="Select checker group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.filter(g => g.tenant_id === (user.role === 'super_admin' ? formData.tenant_id : user.tenant_id)).map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.requires_approver && (
              <div>
                <Label htmlFor="approver_group">Approver Group</Label>
                <Select value={formData.approver_group_id} onValueChange={(val) => setFormData({ ...formData, approver_group_id: val })}>
                  <SelectTrigger data-testid="workflow-approver-group-select">
                    <SelectValue placeholder="Select approver group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.filter(g => g.tenant_id === (user.role === 'super_admin' ? formData.tenant_id : user.tenant_id) && g.group_type === 'admin_group').map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" data-testid="submit-workflow-btn">Create Workflow</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ApprovalWorkflows;