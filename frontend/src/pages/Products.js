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
import { Package, Search, ShoppingCart, Plus, ArrowUpDown, Upload, FileSpreadsheet, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    specs: {},
    image_url: '',
    stock: 0,
    price: 0
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory, products, sortBy]);

  const fetchProducts = async (forceRefresh = false) => {
    try {
      if (forceRefresh) cache.invalidate(`${API}/products{}`);
      const res = await cachedGet(axios, `${API}/products`, {}, 60000);
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
      filtered = filtered.filter(p => p.category === selectedCategory);
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
    try {
      await axios.post(`${API}/products`, { ...formData, price, stock });
      toast.success('Product created successfully!');
      setDialogOpen(false);
      setFormData({ name: '', category: '', description: '', specs: {}, image_url: '', stock: 0, price: 0 });
      fetchProducts(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create product');
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

  const categories = ['all', ...new Set(products.map(p => p.category))];
  const canManageProducts = ['super_admin', 'tenant_admin', 'asset_manager'].includes(user?.role);

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto" data-testid="products-page">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-heading tracking-tight mb-2">Product Catalog</h1>
            <p className="text-base text-muted-foreground">Browse and order IT equipment and assets</p>
          </div>
          {canManageProducts && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImportDialogOpen(true)} data-testid="import-products-btn">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button onClick={() => setDialogOpen(true)} data-testid="add-product-btn">
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
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-slate-200" />
                <CardContent className="p-4">
                  <div className="h-4 bg-slate-200 rounded mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
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
              <Card key={product.id} className="hover:shadow-lg transition-shadow overflow-hidden" data-testid={`product-card-${product.id}`}>
                <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
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
              <div className="bg-slate-50 p-4 rounded-lg border">
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

      {/* Add Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="add-product-dialog">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Add a new product to the catalog</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Dell Latitude 5420" required maxLength={200} data-testid="product-name-input" />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Input id="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="Laptops" required maxLength={100} data-testid="product-category-input" />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="14-inch business laptop..." rows={3} required data-testid="product-description-input" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Price (USD) *</Label>
                <Input id="price" type="number" step="0.01" min="0.01" value={formData.price || ''} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} placeholder="1299.99" required data-testid="product-price-input" />
                <p className="text-xs text-muted-foreground mt-1">Must be greater than $0</p>
              </div>
              <div>
                <Label htmlFor="stock">Stock Quantity *</Label>
                <Input id="stock" type="number" min="0" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} placeholder="25" required data-testid="product-stock-input" />
              </div>
              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input id="image_url" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://..." data-testid="product-image-input" maxLength={500} />
                {formData.image_url && (
                  <div className="mt-2 h-24 w-24 rounded border overflow-hidden bg-slate-100">
                    <img src={formData.image_url} alt="Preview" className="h-full w-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" data-testid="submit-product-btn">Add Product</Button>
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
            <div className="bg-slate-50 rounded-lg p-4 text-sm">
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
