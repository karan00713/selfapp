import { useState, useEffect } from 'react';
import api from '@/lib/electronAPI';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Sidebar } from '@/components/Sidebar';
import { Plus, Pencil, Trash2, Package, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

const initialFormState = {
  name: '',
  hsn_sac_code: '',
  price: '',
  description: '',
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hsnCodes, setHsnCodes] = useState([]);
  const [hsnSearchOpen, setHsnSearchOpen] = useState(false);
  const [hsnSearchQuery, setHsnSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchHSNCodes();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (error) {
      toast.error('Failed to load products/services');
    } finally {
      setLoading(false);
    }
  };

  const fetchHSNCodes = async () => {
    try {
      const data = await api.getHSNCodes();
      setHsnCodes(data);
    } catch (error) {
      console.error('Failed to load HSN codes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productData);
        toast.success('Product/Service updated successfully');
      } else {
        await api.createProduct(productData);
        toast.success('Product/Service created successfully');
      }
      
      setDialogOpen(false);
      setFormData(initialFormState);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error(error.message || 'Failed to save product/service');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      hsn_sac_code: product.hsn_sac_code,
      price: product.price.toString(),
      description: product.description || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product/service?')) {
      try {
        await api.deleteProduct(productId);
        toast.success('Product/Service deleted successfully');
        fetchProducts();
      } catch (error) {
        toast.error('Failed to delete product/service');
      }
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    setFormData(initialFormState);
  };

  const selectHsnCode = (code) => {
    setFormData({ ...formData, hsn_sac_code: code.HSN_CD });
    setHsnSearchOpen(false);
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.hsn_sac_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHsnCodes = hsnCodes.filter(code => 
    code.HSN_CD.toLowerCase().includes(hsnSearchQuery.toLowerCase()) ||
    code.HSN_Description.toLowerCase().includes(hsnSearchQuery.toLowerCase())
  ).slice(0, 50);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading font-black text-4xl tracking-tight text-primary">
                Products & Services
              </h1>
              <p className="text-slate-500 mt-2">Manage your pre-defined products and services for quick invoicing</p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="add-product-button" onClick={() => { setEditingProduct(null); setFormData(initialFormState); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product/Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-heading font-bold text-2xl">
                    {editingProduct ? 'Edit Product/Service' : 'Add New Product/Service'}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      data-testid="product-name-input"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Web Development Service"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>HSN/SAC Code *</Label>
                    <div className="flex gap-2">
                      <Input
                        data-testid="product-hsn-input"
                        required
                        value={formData.hsn_sac_code}
                        onChange={(e) => setFormData({ ...formData, hsn_sac_code: e.target.value })}
                        placeholder="e.g., 998314"
                        className="flex-1"
                      />
                      <Dialog open={hsnSearchOpen} onOpenChange={setHsnSearchOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="icon">
                            <Search className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>Search HSN/SAC Codes</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              placeholder="Search by code or description..."
                              value={hsnSearchQuery}
                              onChange={(e) => setHsnSearchQuery(e.target.value)}
                              autoFocus
                            />
                            <div className="max-h-64 overflow-y-auto border rounded">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-28">Code</TableHead>
                                    <TableHead>Description</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {filteredHsnCodes.map((code, idx) => (
                                    <TableRow 
                                      key={idx}
                                      className="cursor-pointer hover:bg-slate-50"
                                      onClick={() => selectHsnCode(code)}
                                    >
                                      <TableCell className="font-mono font-medium">{code.HSN_CD}</TableCell>
                                      <TableCell className="text-sm">{code.HSN_Description}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Price (₹) *</Label>
                    <Input
                      data-testid="product-price-input"
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="e.g., 50000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Textarea
                      data-testid="product-description-input"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Additional details about this product/service"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={handleDialogClose}>
                      Cancel
                    </Button>
                    <Button data-testid="save-product-button" type="submit" disabled={submitting} className="flex-1">
                      {submitting ? 'Saving...' : (editingProduct ? 'Update' : 'Create')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <Input
                data-testid="product-search-input"
                placeholder="Search products/services by name or HSN/SAC code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader className="border-t-4 border-t-primary">
              <CardTitle className="font-heading font-bold text-xl flex items-center gap-2">
                <Package className="w-5 h-5" />
                All Products & Services ({filteredProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No products/services found</p>
                  <p className="text-sm mt-1">Add your first product or service to use in invoices</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>HSN/SAC Code</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id} data-testid={`product-row-${product.id}`}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="font-mono text-sm">{product.hsn_sac_code}</TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatCurrency(product.price)}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 max-w-xs truncate">
                          {product.description || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              data-testid={`edit-product-${product.id}`}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(product)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              data-testid={`delete-product-${product.id}`}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="font-heading font-bold text-lg">Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>• Pre-define your commonly used services and products here</li>
                <li>• When creating invoices, you can quickly select from this list</li>
                <li>• Use SAC codes (starting with 99) for services and HSN codes for products</li>
                <li>• Common IT service code: <span className="font-mono bg-slate-100 px-1">998314</span> (IT design and development)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
