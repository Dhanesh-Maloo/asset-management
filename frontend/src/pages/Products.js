import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { cachedGet, cache } from '../lib/cache';
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
import { Separator } from '../components/ui/separator';
import { Package, Search, ShoppingCart, Plus, ArrowUpDown, Upload, FileSpreadsheet, Trash2, Pencil, ImagePlus, X, Tags, Check, Merge, ArchiveRestore, Download, DatabaseBackup } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const PRODUCTS_PARAMS = { limit: 500 };
const MAX_IMAGE_MB = 2;
const EMPTY_FORM = { name: '', category: '', description: '', specs: {}, image_url: '', stock: 0, price: 0 };

// Mirrors the server's category normalisation (Laptop / Laptops / "laptop " -> "laptop").
// Used only for hints and filtering; the server is the source of truth.
const categoryKey = (name) => {
  let k = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (k.length > 3) {
    if (k.endsWith('ies')) k = `${k.slice(0, -3)}y`;
    else if (/(sses|xes|ches|shes)$/.test(k)) k = k.slice(0, -2);
    else if (k.endsWith('s') && !k.endsWith('ss')) k = k.slice(0, -1);
  }
  return k;
};

// Uploaded images are stored as relative "/api/..." paths; external links are used as-is.
const resolveImg = (url) => (url && url.startsWith('/api/') ? `${BACKEND_URL}${url}` : url);

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'price-asc', label: 'Price (Low to High)' },
  { value: 'price-desc', label: 'Price (High to Low)' },
  { value: 'stock-asc', label: 'Stock (Low to High)' },
  { value: 'stock-desc', label: 'Stock (High to Low)' },
];

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderNotes, setOrderNotes] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [tenantCurrency, setTenantCurrency] = useState('USD');
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [categoryList, setCategoryList] = useState([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [renamingCategory, setRenamingCategory] = useState(null); // { id, name }
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [mergingCategory, setMergingCategory] = useState(null); // { id, name, targetId }

  // Deleted products (restore) + backups
  const [trashDialogOpen, setTrashDialogOpen] = useState(false);
  const [trashItems, setTrashItems] = useState([]);
  const [backups, setBackups] = useState([]);
  const [trashBusy, setTrashBusy] = useState(false);

  const fetchTrash = async () => {
    try {
      const res = await axios.get(`${API}/product-trash`);
      setTrashItems(res.data);
    } catch (error) {
      categoryError(error, 'Failed to load deleted products');
    }
    if (user?.role === 'super_admin') {
      try {
        const res = await axios.get(`${API}/backups/products`);
        setBackups(res.data);
      } catch (error) {
        console.error('Failed to load backups', error);
      }
    }
  };

  const openTrashDialog = () => {
    setTrashDialogOpen(true);
    fetchTrash();
  };

  const handleRestoreProduct = async (item) => {
    setTrashBusy(true);
    try {
      await axios.post(`${API}/product-trash/${item.id}/restore`);
      toast.success(`${item.name} restored`);
      await Promise.all([fetchTrash(), fetchProducts(true), fetchCategories()]);
    } catch (error) {
      categoryError(error, 'Failed to restore product');
    } finally {
      setTrashBusy(false);
    }
  };

  const handleBackupNow = async () => {
    setTrashBusy(true);
    try {
      const res = await axios.post(`${API}/backups/products`);
      toast.success(`Backup created (${res.data.product_count} products)`);
      await fetchTrash();
    } catch (error) {
      categoryError(error, 'Failed to create backup');
    } finally {
      setTrashBusy(false);
    }
  };

  const handleDownloadBackup = async (snap) => {
    try {
      const res = await axios.get(`${API}/backups/products/${snap.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-backup-${snap.created_at.slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      categoryError(error, 'Failed to download backup');
    }
  };

  const handleRestoreMissing = async (snap) => {
    if (!window.confirm('Re-add any products/categories from this backup that no longer exist? Nothing existing is changed or removed.')) return;
    setTrashBusy(true);
    try {
      const res = await axios.post(`${API}/backups/products/${snap.id}/restore-missing`);
      toast.success(`Restored ${res.data.restored_products} product(s), ${res.data.restored_categories} categorie(s)`);
      await Promise.all([fetchProducts(true), fetchCategories()]);
    } catch (error) {
      categoryError(error, 'Failed to restore from backup');
    } finally {
      setTrashBusy(false);
    }
  };

  const handleMergeCategory = async () => {
    if (!mergingCategory?.targetId) return;
    const target = categoryList.find(c => c.id === mergingCategory.targetId);
    if (!window.confirm(`Move all "${mergingCategory.name}" products into "${target?.name}" and remove "${mergingCategory.name}"?`)) return;
    setCategoryBusy(true);
    try {
      const res = await axios.post(`${API}/product-categories/${mergingCategory.id}/merge`, { target_id: mergingCategory.targetId });
      toast.success(`Merged ${res.data.moved} product(s) into ${target?.name}`);
      if (selectedCategory === mergingCategory.name) setSelectedCategory('all');
      setMergingCategory(null);
      await Promise.all([fetchCategories(), fetchProducts(true)]);
    } catch (error) {
      categoryError(error, 'Failed to merge categories');
    } finally {
      setCategoryBusy(false);
    }
  };

  const categoryError = (error, fallback) => {
    const detail = error.response?.data?.detail;
    toast.error(typeof detail === 'string' ? detail : fallback);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCategoryBusy(true);
    try {
      await axios.post(`${API}/product-categories`, { name: newCategoryName.trim() });
      toast.success('Category added');
      setNewCategoryName('');
      await fetchCategories();
    } catch (error) {
      categoryError(error, 'Failed to add category');
    } finally {
      setCategoryBusy(false);
    }
  };

  const handleRenameCategory = async () => {
    if (!renamingCategory?.name.trim()) return;
    setCategoryBusy(true);
    try {
      await axios.put(`${API}/product-categories/${renamingCategory.id}`, { name: renamingCategory.name.trim() });
      toast.success('Category renamed');
      setRenamingCategory(null);
      await Promise.all([fetchCategories(), fetchProducts(true)]);
    } catch (error) {
      categoryError(error, 'Failed to rename category');
    } finally {
      setCategoryBusy(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    setCategoryBusy(true);
    try {
      await axios.delete(`${API}/product-categories/${cat.id}`);
      toast.success('Category deleted');
      if (selectedCategory === cat.name) setSelectedCategory('all');
      await fetchCategories();
    } catch (error) {
      categoryError(error, 'Failed to delete category');
    } finally {
      setCategoryBusy(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/product-categories`);
      setCategoryList(res.data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchTenantCurrency();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTenantCurrency = async () => {
    if (!user?.tenant_id) return;
    try {
      const res = await axios.get(`${API}/tenants/${user.tenant_id}`);
      setTenantCurrency(res.data.settings?.currency || 'USD');
    } catch (error) {
      console.error('Failed to fetch tenant currency', error);
    }
  };

  useEffect(() => {
    filterProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory, products, sortBy]);

  const fetchProducts = async (forceRefresh = false) => {
    try {
      if (forceRefresh) cache.invalidate(`${API}/products${JSON.stringify(PRODUCTS_PARAMS)}`);
      const res = await cachedGet(axios, `${API}/products`, PRODUCTS_PARAMS, 60000);
      setProducts(res.data);
    } catch (error) {
      console.error('Failed to fetch products', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => (p.category_key || categoryKey(p.category)) === categoryKey(selectedCategory));
    }
    // Sort
    const [field, dir] = sortBy.split('-');
    filtered.sort((a, b) => {
      let cmp = 0;
      if (field === 'name') cmp = a.name.localeCompare(b.name);
      else if (field === 'price') cmp = a.price - b.price;
      else if (field === 'stock') cmp = a.stock - b.stock;
      return dir === 'desc' ? -cmp : cmp;
    });
    setFilteredProducts(filtered);
  };

  const openOrderDialog = (product) => {
    setSelectedProduct(product);
    setOrderQuantity(1);
    setOrderNotes('');
    setOrderDialogOpen(true);
  };

  const handleOrder = async () => {
    if (!selectedProduct) return;
    if (orderQuantity < 1 || orderQuantity > selectedProduct.stock) {
      toast.error(`Quantity must be between 1 and ${selectedProduct.stock}`);
      return;
    }
    try {
      await axios.post(`${API}/orders`, {
        product_id: selectedProduct.id,
        quantity: orderQuantity,
        delivery_notes: orderNotes
      });
      toast.success('Order placed successfully!');
      setOrderDialogOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to place order');
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const price = parseFloat(formData.price);
    const stock = parseInt(formData.stock);
    if (!price || price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }
    if (isNaN(stock) || stock < 0) {
      toast.error('Stock quantity cannot be negative');
      return;
    }
    setSaving(true);
    try {
      // Typing "Laptops" when "Laptop" exists reuses "Laptop" instead of creating a duplicate
      const category = existingCategoryMatch ? existingCategoryMatch.name : formData.category.trim();
      if (editingId) {
        const { name, description, image_url } = formData;
        await axios.put(`${API}/products/${editingId}`, { name, category, description, image_url, price, stock });
        toast.success('Product updated successfully!');
      } else {
        await axios.post(`${API}/products`, { ...formData, category, price, stock });
        toast.success('Product created successfully!');
      }
      closeProductDialog();
      fetchProducts(true);
      fetchCategories();
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : `Failed to ${editingId ? 'update' : 'create'} product`);
    } finally {
      setSaving(false);
    }
  };

  const openAddDialog = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      category: product.category,
      description: product.description || '',
      specs: product.specs || {},
      image_url: product.image_url || '',
      stock: product.stock,
      price: product.price,
    });
    setDialogOpen(true);
  };

  const closeProductDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_IMAGE_MB} MB`);
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await axios.post(`${API}/products/upload-image`, body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData((f) => ({ ...f, image_url: res.data.image_url }));
      toast.success('Image uploaded');
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleBulkImport = async () => {
    if (!importFile) {
      toast.error('Please select a file');
      return;
    }
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const res = await axios.post(`${API}/products/bulk-import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const { imported, total_rows, errors } = res.data;
      toast.success(`Imported ${imported} of ${total_rows} products`);
      if (errors && errors.length > 0) {
        toast.warning(`${errors.length} row(s) had issues`);
      }
      setImportDialogOpen(false);
      setImportFile(null);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to import products');
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteProduct = async () => {
    try {
      await axios.delete(`${API}/products/${productToDelete.id}`);
      toast.success('Product deleted successfully');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete product');
    }
  };

  const getCurrencySymbol = (currency) => {
    const symbols = { USD: '$', INR: '\u20B9', AED: 'AED ', SAR: 'SAR ', EUR: '\u20AC', GBP: '\u00A3' };
    return symbols[currency] || '$';
  };

  // Chips come from the global category list (shared by all tenants); fall back to product categories
  const categories = ['all', ...(categoryList.length
    ? categoryList.map(c => c.name)
    : [...new Set(products.map(p => p.category))])];
  const typedCategory = formData.category.trim();
  const existingCategoryMatch = typedCategory
    ? categoryList.find(c => c.key === categoryKey(typedCategory)) || null
    : null;
  const categorySuggestions = typedCategory
    ? categoryList.filter(c => c.name.toLowerCase().includes(typedCategory.toLowerCase()) && c !== existingCategoryMatch).slice(0, 5)
    : categoryList.slice(0, 8);
  const canManageProducts = ['super_admin', 'tenant_admin', 'asset_manager'].includes(user?.role);

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in" data-testid="products-page">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-heading tracking-tight mb-1">Product Catalog</h1>
            <p className="text-sm text-muted-foreground">Browse and order IT equipment and assets</p>
          </div>
          {canManageProducts && (
            <div className="flex gap-2">
              {user?.role === 'super_admin' && (
                <Button variant="outline" onClick={() => setCategoryDialogOpen(true)} data-testid="manage-categories-btn">
                  <Tags className="h-4 w-4 mr-2" />
                  Manage Categories
                </Button>
              )}
              <Button variant="outline" onClick={openTrashDialog} data-testid="deleted-products-btn">
                <ArchiveRestore className="h-4 w-4 mr-2" />
                Deleted
              </Button>
              <Button variant="outline" onClick={() => setImportDialogOpen(true)} data-testid="import-products-btn">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button onClick={openAddDialog} data-testid="add-product-btn">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          )}
        </div>

        {/* Filters + Sort */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="product-search-input"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-52" data-testid="sort-select">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat)}
              className="whitespace-nowrap"
              data-testid={`category-filter-${cat}`}
            >
              {cat === 'all' ? 'All' : cat}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="border-border shadow-card overflow-hidden">
                <div className="h-48 shimmer" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 shimmer rounded" />
                  <div className="h-4 shimmer rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group border-border shadow-card hover:shadow-card-hover hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden" data-testid={`product-card-${product.id}`}>
                <div className="h-48 bg-gradient-to-br from-muted to-secondary flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img src={resolveImg(product.image_url)} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-20 w-20 text-slate-400" />
                  )}
                </div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <Badge variant="outline" className="text-xs">{product.category}</Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold font-heading text-primary">
                      {getCurrencySymbol(product.display_currency || 'USD')}{product.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Stock: <span className="font-mono font-semibold">{product.stock}</span>
                    </span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => openOrderDialog(product)}
                    disabled={product.stock === 0}
                    data-testid={`order-btn-${product.id}`}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {product.stock === 0 ? 'Out of Stock' : 'Order Now'}
                  </Button>
                  {canManageProducts && (
                    <Button
                      className="w-full mt-2"
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(product)}
                      data-testid={`edit-product-btn-${product.id}`}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {canManageProducts && (
                    <Button
                      className="w-full mt-2"
                      variant="destructive"
                      size="sm"
                      onClick={() => { setProductToDelete(product); setDeleteDialogOpen(true); }}
                      data-testid={`delete-product-btn-${product.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Order Confirmation Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-md" data-testid="order-confirmation-dialog">
          <DialogHeader>
            <DialogTitle>Confirm Order</DialogTitle>
            <DialogDescription>Review your order details before placing</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/50 p-4 rounded-lg border">
                <p className="font-semibold text-lg">{selectedProduct.name}</p>
                <p className="text-sm text-muted-foreground">{selectedProduct.category}</p>
                <p className="text-primary font-bold mt-1">
                  {getCurrencySymbol(selectedProduct.display_currency || 'USD')}{selectedProduct.price} per unit
                </p>
              </div>
              <div>
                <Label htmlFor="order-qty">Quantity (max: {selectedProduct.stock})</Label>
                <Input
                  id="order-qty"
                  type="number"
                  min={1}
                  max={selectedProduct.stock}
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(Math.max(1, Math.min(parseInt(e.target.value) || 1, selectedProduct.stock)))}
                  data-testid="order-quantity-input"
                />
              </div>
              <div>
                <Label htmlFor="order-notes">Delivery Notes (optional)</Label>
                <Textarea
                  id="order-notes"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Delivery location, special instructions..."
                  rows={3}
                  data-testid="order-notes-input"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary" data-testid="order-total">
                  {getCurrencySymbol(selectedProduct.display_currency || 'USD')}{(selectedProduct.price * orderQuantity).toFixed(2)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleOrder} data-testid="confirm-order-btn">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Place Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deleted products + backups */}
      <Dialog open={trashDialogOpen} onOpenChange={setTrashDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="deleted-products-dialog">
          <DialogHeader>
            <DialogTitle>Deleted Products</DialogTitle>
            <DialogDescription>Deleted products are kept and can be restored.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {trashItems.length === 0 && <p className="text-sm text-muted-foreground">No deleted products.</p>}
            {trashItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2" data-testid={`trash-row-${item.id}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.category}{item.deleted_at ? ` · deleted ${new Date(item.deleted_at).toLocaleDateString()}` : ''}
                  </p>
                </div>
                <Button size="sm" variant="outline" disabled={trashBusy} onClick={() => handleRestoreProduct(item)}>
                  <ArchiveRestore className="h-4 w-4 mr-1" />Restore
                </Button>
              </div>
            ))}
          </div>
          {user?.role === 'super_admin' && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Backups</h3>
                  <p className="text-xs text-muted-foreground">A snapshot is taken automatically every 24 hours (last 7 kept).</p>
                </div>
                <Button size="sm" disabled={trashBusy} onClick={handleBackupNow} data-testid="backup-now-btn">
                  <DatabaseBackup className="h-4 w-4 mr-1" />Back up now
                </Button>
              </div>
              <div className="space-y-2">
                {backups.length === 0 && <p className="text-sm text-muted-foreground">No backups yet.</p>}
                {backups.map((snap) => (
                  <div key={snap.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                    <div className="flex-1 text-sm">
                      {new Date(snap.created_at).toLocaleString()}
                      <span className="text-xs text-muted-foreground"> · {snap.product_count} products · {snap.reason}</span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleDownloadBackup(snap)} aria-label="Download backup"><Download className="h-4 w-4" /></Button>
                    <Button size="sm" variant="outline" disabled={trashBusy} onClick={() => handleRestoreMissing(snap)}>Restore missing</Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Categories Dialog (super admin) */}
      <Dialog open={categoryDialogOpen} onOpenChange={(o) => { setCategoryDialogOpen(o); if (!o) { setRenamingCategory(null); setMergingCategory(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="manage-categories-dialog">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogDescription>Categories are shared by all organisations. Renaming updates every product in the category; merging moves them into another category. A category with products can't be deleted.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category name" maxLength={100} data-testid="new-category-input" />
            <Button type="submit" disabled={categoryBusy || !newCategoryName.trim()} data-testid="add-category-btn">
              <Plus className="h-4 w-4 mr-1" />Add
            </Button>
          </form>
          <div className="space-y-2">
            {categoryList.length === 0 && <p className="text-sm text-muted-foreground">No categories yet.</p>}
            {categoryList.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2" data-testid={`category-row-${cat.id}`}>
                {mergingCategory?.id === cat.id ? (
                  <>
                    <span className="text-sm whitespace-nowrap">Merge into</span>
                    <select
                      value={mergingCategory.targetId}
                      onChange={(e) => setMergingCategory({ ...mergingCategory, targetId: e.target.value })}
                      className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-sm"
                      data-testid="merge-target-select"
                    >
                      <option value="">Choose category...</option>
                      {categoryList.filter(c => c.id !== cat.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <Button size="icon" variant="ghost" disabled={categoryBusy || !mergingCategory.targetId} onClick={handleMergeCategory} aria-label="Confirm merge"><Check className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setMergingCategory(null)} aria-label="Cancel merge"><X className="h-4 w-4" /></Button>
                  </>
                ) : renamingCategory?.id === cat.id ? (
                  <>
                    <Input
                      autoFocus
                      value={renamingCategory.name}
                      onChange={(e) => setRenamingCategory({ ...renamingCategory, name: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRenameCategory(); if (e.key === 'Escape') setRenamingCategory(null); }}
                      maxLength={100}
                      className="h-8"
                    />
                    <Button size="icon" variant="ghost" disabled={categoryBusy} onClick={handleRenameCategory} aria-label="Save"><Check className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setRenamingCategory(null)} aria-label="Cancel"><X className="h-4 w-4" /></Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{cat.name}</span>
                    <Badge variant="outline" className="text-xs">{cat.product_count ?? 0} product{cat.product_count === 1 ? '' : 's'}</Badge>
                    <Button size="icon" variant="ghost" onClick={() => setRenamingCategory({ id: cat.id, name: cat.name })} aria-label={`Rename ${cat.name}`}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" disabled={categoryList.length < 2} onClick={() => setMergingCategory({ id: cat.id, name: cat.name, targetId: '' })} aria-label={`Merge ${cat.name}`} title="Merge into another category"><Merge className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" disabled={categoryBusy || (cat.product_count ?? 0) > 0} title={(cat.product_count ?? 0) > 0 ? 'Has products' : 'Delete'} onClick={() => handleDeleteCategory(cat)} aria-label={`Delete ${cat.name}`}><Trash2 className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => (o ? setDialogOpen(true) : closeProductDialog())}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="add-product-dialog">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>{editingId ? 'Update this product in the catalog' : 'Add a new product to the catalog'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Dell Latitude 5420" required maxLength={200} data-testid="product-name-input" />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Input id="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="Laptop" required maxLength={100} autoComplete="off" data-testid="product-category-input" />
                {existingCategoryMatch ? (
                  <p className="text-xs text-muted-foreground mt-1" data-testid="category-existing-hint">
                    Category &quot;{existingCategoryMatch.name}&quot; already exists and will be used.
                  </p>
                ) : typedCategory ? (
                  <p className="text-xs text-muted-foreground mt-1" data-testid="category-new-hint">
                    New category &quot;{typedCategory}&quot; will be created and shown to all organisations (your products stay private).
                  </p>
                ) : null}
                {categorySuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {categorySuggestions.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: c.name })}
                        className="text-xs px-2 py-0.5 rounded-full border border-border hover:bg-muted"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="14-inch business laptop..." rows={3} required data-testid="product-description-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price ({tenantCurrency}) *</Label>
                <Input id="price" type="number" step="0.01" min="0.01" value={formData.price || ''} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} placeholder="1299.99" required data-testid="product-price-input" />
                <p className="text-xs text-muted-foreground mt-1">Must be greater than {getCurrencySymbol(tenantCurrency)}0</p>
              </div>
              <div>
                <Label htmlFor="stock">Stock Quantity *</Label>
                <Input id="stock" type="number" min="0" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} placeholder="25" required data-testid="product-stock-input" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Product Image</Label>
              <div className="flex items-start gap-4">
                <div className="h-24 w-24 shrink-0 rounded border overflow-hidden bg-muted flex items-center justify-center">
                  {formData.image_url ? (
                    <img src={resolveImg(formData.image_url)} alt="Preview" className="h-full w-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <Package className="h-8 w-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => document.getElementById('product-image-file').click()} data-testid="upload-image-btn">
                      <ImagePlus className="h-4 w-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload image'}
                    </Button>
                    {formData.image_url && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, image_url: '' })}>
                        <X className="h-4 w-4 mr-1" /> Remove
                      </Button>
                    )}
                  </div>
                  <input id="product-image-file" type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={handleImageUpload} data-testid="product-image-file-input" />
                  <Input value={formData.image_url.startsWith('/api/') ? '' : formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="...or paste an image link (https://...)" data-testid="product-image-input" maxLength={500} />
                  <p className="text-xs text-muted-foreground">JPG, PNG, GIF or WebP, up to {MAX_IMAGE_MB} MB.</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeProductDialog}>Cancel</Button>
              <Button type="submit" disabled={saving || uploading} data-testid="submit-product-btn">{saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Product'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Product Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{productToDelete?.name}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-lg" data-testid="import-products-dialog">
          <DialogHeader>
            <DialogTitle>Import Products</DialogTitle>
            <DialogDescription>
              Bulk import products from a CSV or Excel file
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <Label htmlFor="import-file" className="cursor-pointer">
                <span className="text-primary font-medium hover:underline">Choose file</span>
                <span className="text-muted-foreground"> or drag and drop</span>
              </Label>
              <Input
                id="import-file"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="mt-3"
                onChange={(e) => setImportFile(e.target.files[0])}
                data-testid="import-file-input"
              />
              {importFile && (
                <p className="text-sm text-primary font-medium mt-2">{importFile.name}</p>
              )}
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-semibold mb-2">Required columns:</p>
              <code className="text-xs bg-white px-2 py-1 rounded border block">
                name, category, description, price, stock
              </code>
              <p className="text-muted-foreground mt-2 text-xs">
                Optional: image_url. Price must be &gt; 0. First row must be column headers.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setImportDialogOpen(false); setImportFile(null); }}>Cancel</Button>
            <Button onClick={handleBulkImport} disabled={!importFile || importing} data-testid="confirm-import-btn">
              <Upload className="h-4 w-4 mr-2" />
              {importing ? 'Importing...' : 'Import Products'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Products;
