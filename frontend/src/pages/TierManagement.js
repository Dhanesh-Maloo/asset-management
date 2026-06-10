import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Crown, Plus, Pencil, Trash2, Users, Laptop, ShoppingCart, Ticket, Shield } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ALL_FEATURES = [
  { id: 'products', label: 'Product Catalog' },
  { id: 'orders', label: 'Orders' },
  { id: 'assets', label: 'Assets' },
  { id: 'tickets', label: 'Helpdesk' },
  { id: 'users', label: 'User Management' },
  { id: 'groups', label: 'Groups' },
  { id: 'workflows', label: 'Approval Workflows' },
  { id: 'api_access', label: 'API Access' },
  { id: 'priority_support', label: 'Priority Support' },
];

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  sort_order: 0,
  is_default: false,
  limits: { max_users: 3, max_assets: 10, max_orders_per_month: 5, max_tickets_per_month: 10 },
  allowed_features: ['products', 'orders', 'assets', 'tickets'],
  highlights: [],
};

const TierManagement = () => {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [highlightInput, setHighlightInput] = useState('');

  useEffect(() => { fetchTiers(); }, []);

  const fetchTiers = async () => {
    try {
      const res = await axios.get(`${API}/subscription-tiers`);
      setTiers(res.data);
    } catch (e) {
      toast.error('Failed to load tiers');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingTier(null);
    setFormData({ ...emptyForm });
    setHighlightInput('');
    setDialogOpen(true);
  };

  const openEdit = (tier) => {
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      slug: tier.slug,
      description: tier.description || '',
      sort_order: tier.sort_order || 0,
      is_default: tier.is_default || false,
      limits: { ...emptyForm.limits, ...tier.limits },
      allowed_features: tier.allowed_features || [],
      highlights: tier.highlights || [],
    });
    setHighlightInput('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Name and slug are required');
      return;
    }
    try {
      if (editingTier) {
        await axios.patch(`${API}/subscription-tiers/${editingTier.id}`, {
          name: formData.name,
          description: formData.description,
          sort_order: formData.sort_order,
          is_default: formData.is_default,
          limits: formData.limits,
          allowed_features: formData.allowed_features,
          highlights: formData.highlights,
        });
        toast.success('Tier updated');
      } else {
        await axios.post(`${API}/subscription-tiers`, formData);
        toast.success('Tier created');
      }
      setDialogOpen(false);
      fetchTiers();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to save tier');
    }
  };

  const handleDelete = async (tier) => {
    if (!window.confirm(`Delete "${tier.name}" tier?`)) return;
    try {
      await axios.delete(`${API}/subscription-tiers/${tier.id}`);
      toast.success('Tier deleted');
      fetchTiers();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to delete tier');
    }
  };

  const toggleFeature = (featureId) => {
    setFormData((prev) => ({
      ...prev,
      allowed_features: prev.allowed_features.includes(featureId)
        ? prev.allowed_features.filter((f) => f !== featureId)
        : [...prev.allowed_features, featureId],
    }));
  };

  const addHighlight = () => {
    if (!highlightInput.trim()) return;
    setFormData((prev) => ({ ...prev, highlights: [...prev.highlights, highlightInput.trim()] }));
    setHighlightInput('');
  };

  const removeHighlight = (idx) => {
    setFormData((prev) => ({ ...prev, highlights: prev.highlights.filter((_, i) => i !== idx) }));
  };

  const updateLimit = (key, value) => {
    setFormData((prev) => ({ ...prev, limits: { ...prev.limits, [key]: parseInt(value) || 0 } }));
  };

  const formatLimit = (val) => (val === -1 ? 'Unlimited' : val);

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in" data-testid="tier-management-page">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-1">
              Tier Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Define and manage subscription tiers for tenants
            </p>
          </div>
          <Button onClick={openCreate} data-testid="create-tier-btn">
            <Plus className="h-4 w-4 mr-2" />
            Add Tier
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Subscription Tiers</CardTitle>
            <CardDescription>Manage plan limits, features, and descriptions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-16 shimmer rounded-md" />)}
              </div>
            ) : tiers.length === 0 ? (
              <div className="text-center py-12">
                <Crown className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No tiers defined yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Assets</TableHead>
                      <TableHead>Orders/mo</TableHead>
                      <TableHead>Tickets/mo</TableHead>
                      <TableHead>Features</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tiers.map((tier) => (
                      <TableRow key={tier.id} data-testid={`tier-row-${tier.slug}`}>
                        <TableCell className="font-semibold">{tier.name}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{tier.slug}</TableCell>
                        <TableCell>{formatLimit(tier.limits?.max_users)}</TableCell>
                        <TableCell>{formatLimit(tier.limits?.max_assets)}</TableCell>
                        <TableCell>{formatLimit(tier.limits?.max_orders_per_month)}</TableCell>
                        <TableCell>{formatLimit(tier.limits?.max_tickets_per_month)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(tier.allowed_features || []).slice(0, 3).map((f) => (
                              <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                            ))}
                            {(tier.allowed_features || []).length > 3 && (
                              <Badge variant="outline" className="text-xs">+{tier.allowed_features.length - 3}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {tier.is_default && <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-green-200">Default</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openEdit(tier)} data-testid={`edit-tier-${tier.slug}`}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(tier)} data-testid={`delete-tier-${tier.slug}`}>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="tier-dialog">
          <DialogHeader>
            <DialogTitle>{editingTier ? 'Edit Tier' : 'Create New Tier'}</DialogTitle>
            <DialogDescription>
              {editingTier ? 'Modify tier limits and features' : 'Define a new subscription tier'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tier-name">Name *</Label>
                <Input id="tier-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Pro" data-testid="tier-name-input" />
              </div>
              <div>
                <Label htmlFor="tier-slug">Slug *</Label>
                <Input id="tier-slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} placeholder="pro" disabled={!!editingTier} data-testid="tier-slug-input" />
              </div>
            </div>
            <div>
              <Label htmlFor="tier-desc">Description</Label>
              <Textarea id="tier-desc" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} data-testid="tier-desc-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tier-order">Sort Order</Label>
                <Input id="tier-order" type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} data-testid="tier-order-input" />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={formData.is_default} onCheckedChange={(val) => setFormData({ ...formData, is_default: val })} data-testid="tier-default-switch" />
                <Label>Default tier for new tenants</Label>
              </div>
            </div>

            <Separator />

            {/* Limits */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" /> Resource Limits
              </h3>
              <p className="text-xs text-muted-foreground mb-3">Use -1 for unlimited</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Max Users</Label>
                  <Input type="number" value={formData.limits.max_users} onChange={(e) => updateLimit('max_users', e.target.value)} data-testid="limit-max-users" />
                </div>
                <div>
                  <Label className="flex items-center gap-1.5"><Laptop className="h-3.5 w-3.5" /> Max Assets</Label>
                  <Input type="number" value={formData.limits.max_assets} onChange={(e) => updateLimit('max_assets', e.target.value)} data-testid="limit-max-assets" />
                </div>
                <div>
                  <Label className="flex items-center gap-1.5"><ShoppingCart className="h-3.5 w-3.5" /> Max Orders / Month</Label>
                  <Input type="number" value={formData.limits.max_orders_per_month} onChange={(e) => updateLimit('max_orders_per_month', e.target.value)} data-testid="limit-max-orders" />
                </div>
                <div>
                  <Label className="flex items-center gap-1.5"><Ticket className="h-3.5 w-3.5" /> Max Tickets / Month</Label>
                  <Input type="number" value={formData.limits.max_tickets_per_month} onChange={(e) => updateLimit('max_tickets_per_month', e.target.value)} data-testid="limit-max-tickets" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Features */}
            <div>
              <h3 className="font-semibold mb-3">Allowed Features</h3>
              <div className="grid grid-cols-2 gap-3">
                {ALL_FEATURES.map((f) => (
                  <div key={f.id} className="flex items-center gap-2">
                    <Switch checked={formData.allowed_features.includes(f.id)} onCheckedChange={() => toggleFeature(f.id)} data-testid={`feature-toggle-${f.id}`} />
                    <Label className="cursor-pointer">{f.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Highlights */}
            <div>
              <h3 className="font-semibold mb-3">Plan Highlights</h3>
              <div className="flex gap-2 mb-3">
                <Input value={highlightInput} onChange={(e) => setHighlightInput(e.target.value)} placeholder="e.g. Up to 25 users" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())} data-testid="highlight-input" />
                <Button type="button" variant="outline" onClick={addHighlight} data-testid="add-highlight-btn">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.highlights.map((h, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeHighlight(i)}>
                    {h} <span className="text-xs ml-1">&times;</span>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} data-testid="save-tier-btn">{editingTier ? 'Save Changes' : 'Create Tier'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TierManagement;
