import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Separator } from '../components/ui/separator';
import { Building2, Plus, Crown, User, Globe } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TIER_BADGE = {
  free: 'bg-slate-100 text-slate-700 border-slate-300',
  pro: 'bg-blue-100 text-blue-700 border-blue-300',
  enterprise: 'bg-amber-100 text-amber-700 border-amber-300',
};

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [selectedTierId, setSelectedTierId] = useState('');

  const [formData, setFormData] = useState({
    company_name: '',
    domain: '',
    subdomain: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    currency: 'INR',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tenantsRes, tiersRes] = await Promise.all([
        axios.get(`${API}/tenants`),
        axios.get(`${API}/subscription-tiers`),
      ]);
      setTenants(tenantsRes.data);
      setTiers(tiersRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/auth/signup`, null, {
        params: {
          company_name: formData.company_name,
          admin_name: formData.admin_name,
          admin_email: formData.admin_email,
          admin_password: formData.admin_password,
          domain: formData.domain,
          subdomain: formData.subdomain.toLowerCase(),
          currency: formData.currency,
        },
      });
      toast.success(`Tenant "${formData.company_name}" created with admin user!`);
      setDialogOpen(false);
      setFormData({ company_name: '', domain: '', subdomain: '', admin_name: '', admin_email: '', admin_password: '', currency: 'INR' });
      fetchData();
    } catch (error) {
      const detail = error.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((e) => e.msg || JSON.stringify(e)).join(', ')
        : typeof detail === 'string'
        ? detail
        : 'Failed to create tenant';
      toast.error(msg);
    }
  };

  const openTierDialog = (tenant) => {
    setSelectedTenant(tenant);
    setSelectedTierId(tenant.subscription_tier_id || '');
    setTierDialogOpen(true);
  };

  const handleTierChange = async () => {
    if (!selectedTierId) {
      toast.error('Please select a tier');
      return;
    }
    try {
      await axios.patch(`${API}/tenants/${selectedTenant.id}/subscription?tier_id=${selectedTierId}`);
      toast.success('Subscription updated');
      setTierDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update subscription');
    }
  };

  const getTierName = (tierId) => {
    const tier = tiers.find((t) => t.id === tierId);
    return tier?.name || 'Free';
  };

  const getTierSlug = (tierId) => {
    const tier = tiers.find((t) => t.id === tierId);
    return tier?.slug || 'free';
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto" data-testid="tenants-page">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-heading tracking-tight mb-2">
              Tenant Management
            </h1>
            <p className="text-base text-muted-foreground">
              Manage customer organizations and subscriptions
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} data-testid="create-tenant-btn">
            <Plus className="h-4 w-4 mr-2" />
            Add Tenant
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : tenants.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No tenants found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.map((tenant) => {
                      const slug = getTierSlug(tenant.subscription_tier_id);
                      return (
                        <TableRow key={tenant.id} data-testid={`tenant-row-${tenant.id}`}>
                          <TableCell className="font-medium">{tenant.name}</TableCell>
                          <TableCell className="font-mono text-sm">{tenant.domain}</TableCell>
                          <TableCell>
                            <Badge className={TIER_BADGE[slug] || TIER_BADGE.free} data-testid={`tenant-tier-${tenant.id}`}>
                              <Crown className="h-3 w-3 mr-1" />
                              {getTierName(tenant.subscription_tier_id)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {tenant.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(tenant.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => openTierDialog(tenant)} data-testid={`change-tier-btn-${tenant.id}`}>
                              <Crown className="h-3.5 w-3.5 mr-1.5" />
                              Change Tier
                            </Button>
                          </TableCell>
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

      {/* Create Tenant Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="create-tenant-dialog">
          <DialogHeader>
            <DialogTitle>Add New Tenant</DialogTitle>
            <DialogDescription>Create a new organization and their admin account in one step</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-5">

            {/* Section 1: Organization */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <Globe className="h-4 w-4" />
                Organization Details
              </div>
              <div>
                <Label htmlFor="company_name">Organization Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="e.g. Bhumika Pvt Ltd"
                  required
                  data-testid="tenant-name-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="domain">Domain *</Label>
                  <Input
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    placeholder="bhumika.com"
                    required
                    data-testid="tenant-domain-input"
                  />
                </div>
                <div>
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <Input
                    id="subdomain"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="bhumika"
                    data-testid="tenant-subdomain-input"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="currency">Base Currency</Label>
                <Select value={formData.currency} onValueChange={(val) => setFormData({ ...formData, currency: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR — Indian Rupee</SelectItem>
                    <SelectItem value="USD">USD — US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR — Euro</SelectItem>
                    <SelectItem value="GBP">GBP — British Pound</SelectItem>
                    <SelectItem value="AED">AED — UAE Dirham</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Section 2: Admin User */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <User className="h-4 w-4" />
                Tenant Admin Account
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="admin_name">Admin Name *</Label>
                  <Input
                    id="admin_name"
                    value={formData.admin_name}
                    onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                    placeholder="Bhumika"
                    required
                    data-testid="tenant-admin-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="admin_email">Admin Email *</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    value={formData.admin_email}
                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                    placeholder="admin@bhumika.com"
                    required
                    data-testid="tenant-admin-email-input"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="admin_password">Admin Password *</Label>
                <Input
                  id="admin_password"
                  type="password"
                  value={formData.admin_password}
                  onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  data-testid="tenant-admin-password-input"
                />
                <p className="text-xs text-muted-foreground mt-1">The admin can change this password after first login</p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" data-testid="submit-tenant-btn">
                <Building2 className="h-4 w-4 mr-2" />
                Create Tenant
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Tier Dialog */}
      <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
        <DialogContent data-testid="change-tier-dialog">
          <DialogHeader>
            <DialogTitle>Change Subscription Tier</DialogTitle>
            <DialogDescription>
              Update the subscription for <span className="font-semibold">{selectedTenant?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Select Tier</Label>
            <Select value={selectedTierId} onValueChange={setSelectedTierId}>
              <SelectTrigger data-testid="tier-select">
                <SelectValue placeholder="Select a tier" />
              </SelectTrigger>
              <SelectContent>
                {tiers.map((tier) => (
                  <SelectItem key={tier.id} value={tier.id}>
                    {tier.name} — Users: {tier.limits?.max_users === -1 ? 'Unlimited' : tier.limits?.max_users}, Assets: {tier.limits?.max_assets === -1 ? 'Unlimited' : tier.limits?.max_assets}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTierDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleTierChange} data-testid="confirm-tier-change-btn">Update Subscription</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Tenants;
