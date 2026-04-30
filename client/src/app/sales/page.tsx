"use client";

import { useState, useEffect, useRef } from "react";
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
import { Plus, Search, Filter, Download, Loader2, Receipt, Eye, X, Printer } from "lucide-react";
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

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptHtml: string | null;
  receiptNumber: string | null;
  loading: boolean;
}

function ReceiptModal({ isOpen, onClose, receiptHtml, receiptNumber, loading }: ReceiptModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Receipt {receiptNumber || ""}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} disabled={!receiptHtml}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading receipt...</span>
            </div>
          ) : receiptHtml ? (
            <iframe
              ref={iframeRef}
              srcDoc={receiptHtml}
              className="w-full h-full min-h-[600px] border-0"
              title="Receipt"
              sandbox="allow-scripts"
            />
          ) : (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-500">No receipt available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [receiptModal, setReceiptModal] = useState({ isOpen: false, receiptHtml: null as string | null, receiptNumber: null as string | null, loading: false });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [newSale, setNewSale] = useState({ customer_id: "", sale_date: "", due_date: "", notes: "", discount_amount: 0, status: "draft" });
  const [saleItems, setSaleItems] = useState([{ product_id: "", product_name: "", qty: 1, unit_price: 0, discount: 0 }]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const toast = useToast();

  const loadSales = async () => {
    try {
      setLoading(true);
      const data = await api.sales.getAll(statusFilter);
      setSales(data as any[]);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
    loadProducts();
    loadCustomers();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.products.getAll();
      setProducts(data as any[]);
    } catch (err: any) {
      console.error("Failed to load products:", err);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await api.customers.getAll();
      setCustomers(data as any[]);
    } catch (err: any) {
      console.error("Failed to load customers:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await api.sales.delete(id);
      toast.success("Sale deleted");
      loadSales();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete sale");
    }
  };

  const handleViewReceipt = async (saleId: string) => {
    setReceiptModal({ isOpen: true, receiptHtml: null, receiptNumber: null, loading: true });
    try {
      const receipt = await api.sales.getReceipt(saleId);
      const receiptAny = receipt as any;
      const htmlResponse = await api.sales.getReceiptHtml(saleId);
      setReceiptModal({
        isOpen: true,
        receiptHtml: htmlResponse as string,
        receiptNumber: receiptAny?.receipt_number || null,
        loading: false,
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to load receipt");
      setReceiptModal({ isOpen: true, receiptHtml: null, receiptNumber: null, loading: false });
    }
  };

  const handleMarkPaid = async (saleId: string) => {
    try {
      await api.sales.update(saleId, { status: "paid" } as any);
      toast.success("Sale marked as paid");
      loadSales();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update sale");
    }
  };

  const handleViewSale = async (saleId: string) => {
    try {
      const data = await api.sales.getById(saleId);
      setSelectedSale(data as any);
      setViewDialogOpen(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load sale details");
    }
  };

  const addItemRow = () => {
    setSaleItems([...saleItems, { product_id: "", product_name: "", qty: 1, unit_price: 0, discount: 0 }]);
  };

  const removeItemRow = (idx: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const updated = [...saleItems];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === "product_id" && value) {
      const product = products.find((p) => p.id === value);
      if (product) {
        updated[idx].product_name = product.name;
        updated[idx].unit_price = parseFloat(product.price || 0);
      }
    }
    setSaleItems(updated);
  };

  const handleCreateSale = async () => {
    try {
      const items = saleItems
        .filter((item) => item.product_name && item.qty > 0 && item.unit_price > 0)
        .map((item) => ({
          product_id: item.product_id || undefined,
          product_name: item.product_name,
          qty: item.qty,
          unit_price: item.unit_price,
          discount: item.discount || 0,
        }));
      if (items.length === 0) {
        toast.error("Add at least one valid item");
        return;
      }
      await api.sales.create({
        customer_id: newSale.customer_id || undefined,
        sale_date: newSale.sale_date || new Date().toISOString().split("T")[0],
        due_date: newSale.due_date || undefined,
        notes: newSale.notes,
        discount_amount: newSale.discount_amount,
        status: newSale.status,
        items,
      } as any);
      toast.success("Sale created");
      setCreateDialogOpen(false);
      setNewSale({ customer_id: "", sale_date: "", due_date: "", notes: "", discount_amount: 0, status: "draft" });
      setSaleItems([{ product_id: "", product_name: "", qty: 1, unit_price: 0, discount: 0 }]);
      loadSales();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create sale");
    }
  };

  const handleExportSales = async () => {
    try {
      const data = await api.importExport.exportData("sales", "json");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Sales exported");
    } catch (err: any) {
      toast.error(err?.message || "Failed to export sales");
    }
  };

  const filteredSales = sales.filter((sale) =>
    sale.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Sales</h2>
          <p className="text-gray-500">Manage your sales and transactions</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Sale
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search sales..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => { setStatusFilter(""); loadSales(); }}>
          <Filter className="mr-2 h-4 w-4" />
          {statusFilter || "All"}
        </Button>
        <Button variant="outline" onClick={handleExportSales}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Sales</CardTitle>
          <CardDescription>View and manage all sales transactions</CardDescription>
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
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.invoice_number}</TableCell>
                    <TableCell>{sale.customer_name || "Walk-in"}</TableCell>
                    <TableCell>KSh {parseFloat(sale.total || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          sale.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : sale.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {sale.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {sale.status === "paid" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewReceipt(sale.id)}
                          >
                            <Receipt className="mr-1 h-4 w-4" />
                            Receipt
                          </Button>
                        )}
                        {sale.status !== "paid" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkPaid(sale.id)}
                          >
                            Mark Paid
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleViewSale(sale.id)}>
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No sales found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ReceiptModal
        isOpen={receiptModal.isOpen}
        onClose={() => setReceiptModal({ isOpen: false, receiptHtml: null, receiptNumber: null, loading: false })}
        receiptHtml={receiptModal.receiptHtml}
        receiptNumber={receiptModal.receiptNumber}
        loading={receiptModal.loading}
      />

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Sale</DialogTitle>
            <DialogDescription>Add a new sale with items</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Customer</Label>
                <Select value={newSale.customer_id} onValueChange={(v) => setNewSale({ ...newSale, customer_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Walk-in Customer</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={newSale.status} onValueChange={(v) => setNewSale({ ...newSale, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sale Date</Label>
                <Input type="date" value={newSale.sale_date} onChange={(e) => setNewSale({ ...newSale, sale_date: e.target.value })} />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={newSale.due_date} onChange={(e) => setNewSale({ ...newSale, due_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Items</Label>
              {saleItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 mt-2 items-start">
                  <Select value={item.product_id} onValueChange={(v) => updateItem(idx, "product_id", v)}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Product" /></SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name} (KSh {p.price})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="number" placeholder="Qty" className="w-20" value={item.qty} onChange={(e) => updateItem(idx, "qty", parseInt(e.target.value) || 0)} />
                  <Input type="number" placeholder="Price" className="w-28" value={item.unit_price} onChange={(e) => updateItem(idx, "unit_price", parseFloat(e.target.value) || 0)} />
                  <Input type="number" placeholder="Discount" className="w-24" value={item.discount} onChange={(e) => updateItem(idx, "discount", parseFloat(e.target.value) || 0)} />
                  {saleItems.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeItemRow(idx)}>X</Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" className="mt-2" onClick={addItemRow}>+ Add Item</Button>
            </div>
            <div>
              <Label>Discount Amount</Label>
              <Input type="number" value={newSale.discount_amount} onChange={(e) => setNewSale({ ...newSale, discount_amount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={newSale.notes} onChange={(e) => setNewSale({ ...newSale, notes: e.target.value })} placeholder="Optional notes" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateSale}>Create Sale</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSale?.invoice_number || "Sale Details"}</DialogTitle>
            <DialogDescription>Sale information and line items</DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{selectedSale.customer_name || "Walk-in"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                    selectedSale.status === "paid" ? "bg-green-100 text-green-700" :
                    selectedSale.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                  }`}>{selectedSale.status}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{new Date(selectedSale.sale_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-medium text-lg">KSh {parseFloat(selectedSale.total || 0).toLocaleString()}</p>
                </div>
              </div>
              {selectedSale.items && selectedSale.items.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Items</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSale.items.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell>{item.qty}</TableCell>
                          <TableCell>KSh {parseFloat(item.unit_price || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">KSh {parseFloat(item.total || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {selectedSale.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-sm">{selectedSale.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
