"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, AlertTriangle, Package, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Product {
  id: string;
  name: string;
  sku: string;
  category_name: string;
  category_id: string;
  selling_price: number;
  cost_price: number;
  stock_qty: number;
  reorder_level: number;
  description: string;
}

interface Category {
  id: string;
  name: string;
}

interface ProductForm {
  name: string;
  sku: string;
  category_id: string;
  selling_price: string;
  stock_qty: string;
  reorder_level: string;
  description: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>({ name: "", sku: "", category_id: "", selling_price: "", stock_qty: "", reorder_level: "", description: "" });
  const [categories, setCategories] = useState<Category[]>([]);
  const toast = useToast();

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.products.getAll();
      setProducts(data as Product[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load products";
      toast.error(message);
    }
  }, [toast]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await api.products.getCategories();
      setCategories(data as Category[]);
    } catch (err: unknown) {
      console.error("Failed to load categories:", err);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  const handleCreateProduct = async () => {
    if (!productForm.name || !productForm.selling_price) {
      toast.error("Name and selling price are required");
      return;
    }
    try {
      await api.products.create({
        name: productForm.name,
        sku: productForm.sku || undefined,
        category_id: productForm.category_id || undefined,
        selling_price: parseFloat(productForm.selling_price),
        stock_qty: parseInt(productForm.stock_qty) || 0,
        reorder_level: parseInt(productForm.reorder_level) || 0,
        description: productForm.description || undefined,
      });
      toast.success("Product created");
      setDialogOpen(false);
      setProductForm({ name: "", sku: "", category_id: "", selling_price: "", stock_qty: "", reorder_level: "", description: "" });
      loadProducts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create product";
      toast.error(message);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || "",
      sku: product.sku || "",
      category_id: product.category_id || "",
      selling_price: product.selling_price?.toString() || "",
      stock_qty: product.stock_qty?.toString() || "",
      reorder_level: product.reorder_level?.toString() || "",
      description: product.description || "",
    });
    setEditDialogOpen(true);
  };

  const handleUpdateProduct = async () => {
    if (!productForm.name || !productForm.selling_price) {
      toast.error("Name and selling price are required");
      return;
    }
    if (!editingProduct) return;
    try {
      await api.products.update(editingProduct.id, {
        name: productForm.name,
        sku: productForm.sku || undefined,
        category_id: productForm.category_id || undefined,
        selling_price: parseFloat(productForm.selling_price),
        stock_qty: parseInt(productForm.stock_qty) || 0,
        reorder_level: parseInt(productForm.reorder_level) || 0,
        description: productForm.description || undefined,
      });
      toast.success("Product updated");
      setEditDialogOpen(false);
      setEditingProduct(null);
      loadProducts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update product";
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await api.products.delete(id);
      toast.success("Product deleted");
      loadProducts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete product";
      toast.error(message);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockProducts = products.filter((p) => p.stock_qty <= p.reorder_level);
  const outOfStock = products.filter((p) => p.stock_qty === 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Products</h2>
          <p className="text-gray-500">Manage your product inventory</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { setProductForm({ name: "", sku: "", category_id: "", selling_price: "", stock_qty: "", reorder_level: "", description: "" }); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Products</CardDescription>
            <CardTitle className="text-3xl">{products.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Package className="h-4 w-4" />
              In stock
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Low Stock Items</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{lowStockProducts.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              Need restocking
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Out of Stock</CardDescription>
            <CardTitle className="text-3xl text-red-600">{outOfStock.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4" />
              Urgent attention
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>View and manage your product inventory</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-gray-500">{product.sku}</TableCell>
                    <TableCell>{product.category_name || "—"}</TableCell>
                    <TableCell>KSh {product.selling_price?.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            product.stock_qty <= product.reorder_level
                              ? "text-yellow-600"
                              : "text-gray-900"
                          }`}
                        >
                          {product.stock_qty}
                        </span>
                        {product.stock_qty <= product.reorder_level && (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No products found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>Create a new product</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product Name</Label>
              <Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="Product name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>SKU</Label>
                <Input value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} placeholder="SKU" />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={productForm.category_id} onValueChange={(v) => setProductForm({ ...productForm, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: Category) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Selling Price</Label>
                <Input type="number" value={productForm.selling_price} onChange={(e) => setProductForm({ ...productForm, selling_price: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <Label>Stock Qty</Label>
                <Input type="number" value={productForm.stock_qty} onChange={(e) => setProductForm({ ...productForm, stock_qty: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div>
              <Label>Reorder Level</Label>
              <Input type="number" value={productForm.reorder_level} onChange={(e) => setProductForm({ ...productForm, reorder_level: e.target.value })} placeholder="0" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} placeholder="Optional description" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateProduct}>Create Product</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product Name</Label>
              <Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>SKU</Label>
                <Input value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={productForm.category_id} onValueChange={(v) => setProductForm({ ...productForm, category_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: Category) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Selling Price</Label>
                <Input type="number" value={productForm.selling_price} onChange={(e) => setProductForm({ ...productForm, selling_price: e.target.value })} />
              </div>
              <div>
                <Label>Stock Qty</Label>
                <Input type="number" value={productForm.stock_qty} onChange={(e) => setProductForm({ ...productForm, stock_qty: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Reorder Level</Label>
              <Input type="number" value={productForm.reorder_level} onChange={(e) => setProductForm({ ...productForm, reorder_level: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleUpdateProduct}>Update Product</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}