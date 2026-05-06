"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Truck, Plus, Minus, Star } from "lucide-react";
import api from "@/lib/api";

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  contact_person: string;
  payment_terms: string;
}

interface POItem {
  product_name: string;
  qty: number;
  unit_price: number;
  total: number;
}

interface PurchaseOrder {
  id: string;
  vendor_id: string;
  expected_delivery: string;
  notes: string;
  items: POItem[];
  status: string;
}

interface VendorForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  contact_person: string;
  payment_terms: string;
  notes: string;
}

interface POForm {
  vendor_id: string;
  expected_delivery: string;
  notes: string;
  items: POItem[];
}

interface ItemForm {
  product_name: string;
  qty: number;
  unit_price: number;
}

export default function ProcurementPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorDialog, setVendorDialog] = useState(false);
  const [poDialog, setPoDialog] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [activeTab, setActiveTab] = useState("vendors");
  const [vendorForm, setVendorForm] = useState<VendorForm>({ name: "", email: "", phone: "", address: "", contact_person: "", payment_terms: "", notes: "" });
  const [poForm, setPoForm] = useState<POForm>({ vendor_id: "", expected_delivery: "", notes: "", items: [] });
  const [itemForm, setItemForm] = useState<ItemForm>({ product_name: "", qty: 1, unit_price: 0 });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [vendorsData, poData] = await Promise.all([
        api.procurement.getVendors(),
        api.procurement.getPurchaseOrders(),
      ]);
      setVendors(vendorsData as Vendor[]);
      setPurchaseOrders(poData as PurchaseOrder[]);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function createVendor() {
    setError(null);
    try {
      await api.procurement.createVendor(vendorForm);
      setSuccess("Vendor created");
      setVendorDialog(false);
      setVendorForm({ name: "", email: "", phone: "", address: "", contact_person: "", payment_terms: "", notes: "" });
      loadData();
    } catch {
      setError("Failed to create vendor");
    }
  }

  function addItem() {
    if (!itemForm.product_name || itemForm.qty <= 0 || itemForm.unit_price <= 0) return;
    setPoForm({ ...poForm, items: [...poForm.items, { ...itemForm, total: itemForm.qty * itemForm.unit_price }] });
    setItemForm({ product_name: "", qty: 1, unit_price: 0 });
  }

  function removeItem(index: number) {
    setPoForm({ ...poForm, items: poForm.items.filter((_, i) => i !== index) });
  }

  async function createPO() {
    if (poForm.items.length === 0) { setError("Add at least one item"); return; }
    setError(null);
    try {
      await api.procurement.createPurchaseOrder(poForm);
      setSuccess("Purchase order created");
      setPoDialog(false);
      setPoForm({ vendor_id: "", expected_delivery: "", notes: "", items: [] });
      loadData();
    } catch {
      setError("Failed to create purchase order");
    }
  }

  async function updatePOStatus(po: PurchaseOrder, status: string) {
    try {
      await api.procurement.updatePurchaseOrder(po.id, { status });
      loadData();
    } catch {
      setError("Failed to update purchase order");
    }
  }

  async function viewPO(po: PurchaseOrder) {
    setSelectedPO(po);
    setDetailOpen(true);
    try {
      const data = await api.procurement.getPurchaseOrder(po.id);
      setSelectedPO(data as PurchaseOrder);
    } catch {}
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = { draft: "bg-gray-100 text-gray-800", pending: "bg-yellow-100 text-yellow-800", approved: "bg-blue-100 text-blue-800", delivered: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800" };
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[status] || "bg-gray-100"}`}>{status}</span>;
  }

  const poTotal = poForm.items.reduce((sum, item) => sum + item.total, 0);
  const poTax = poTotal * 0.16;
  const poGrandTotal = poTotal + poTax;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Procurement</h1>
        <p className="text-muted-foreground mt-1">Manage vendors, purchase orders, and track spending.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Truck className="h-4 w-4" />Vendors</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{vendors.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Package className="h-4 w-4" />Total POs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{purchaseOrders.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{purchaseOrders.filter(p => p.status === "pending").length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Spent</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">KES {purchaseOrders.reduce((s, p) => s + parseFloat(p.total || 0), 0).toLocaleString()}</div></CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          </TabsList>
          <Button onClick={() => activeTab === "vendors" ? setVendorDialog(true) : setPoDialog(true)}>
            {activeTab === "vendors" ? <><Plus className="h-4 w-4 mr-2" />Add Vendor</> : <><Package className="h-4 w-4 mr-2" />New PO</>}
          </Button>
        </div>

        <TabsContent value="vendors">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Name</TableHead><TableHead>Contact</TableHead><TableHead>Email</TableHead><TableHead>Payment Terms</TableHead><TableHead>Orders</TableHead><TableHead>Total Spent</TableHead><TableHead>Rating</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> :
                   vendors.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No vendors yet</TableCell></TableRow> :
                   vendors.map(vendor => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell className="text-sm">{vendor.contact_person || "—"}</TableCell>
                      <TableCell className="text-sm">{vendor.email || "—"}</TableCell>
                      <TableCell className="text-sm">{vendor.payment_terms || "—"}</TableCell>
                      <TableCell className="text-sm">{vendor.total_orders || 0}</TableCell>
                      <TableCell>KES {parseFloat(vendor.total_spent || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm">{vendor.rating ? parseFloat(vendor.rating).toFixed(1) : "—"}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>PO #</TableHead><TableHead>Vendor</TableHead><TableHead>Status</TableHead><TableHead>Items</TableHead><TableHead>Total</TableHead><TableHead>Expected</TableHead><TableHead>Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> :
                   purchaseOrders.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No purchase orders yet</TableCell></TableRow> :
                   purchaseOrders.map(po => (
                    <TableRow key={po.id}>
                      <TableCell className="font-mono text-sm">{po.po_number}</TableCell>
                      <TableCell className="font-medium">{po.vendor_name || "—"}</TableCell>
                      <TableCell>{getStatusBadge(po.status)}</TableCell>
                      <TableCell className="text-sm">KES {parseFloat(po.subtotal || 0).toLocaleString()}</TableCell>
                      <TableCell className="font-semibold">KES {parseFloat(po.total || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{po.expected_delivery ? new Date(po.expected_delivery).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => viewPO(po)}>View</Button>
                          <Select defaultValue={po.status} onValueChange={v => updatePOStatus(po, v)}>
                            <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={vendorDialog} onOpenChange={setVendorDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Vendor</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Vendor name *" value={vendorForm.name} onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Email" value={vendorForm.email} onChange={e => setVendorForm({ ...vendorForm, email: e.target.value })} />
              <Input placeholder="Phone" value={vendorForm.phone} onChange={e => setVendorForm({ ...vendorForm, phone: e.target.value })} />
              <Input placeholder="Contact person" value={vendorForm.contact_person} onChange={e => setVendorForm({ ...vendorForm, contact_person: e.target.value })} />
              <Input placeholder="Payment terms (e.g. Net 30)" value={vendorForm.payment_terms} onChange={e => setVendorForm({ ...vendorForm, payment_terms: e.target.value })} />
            </div>
            <Input placeholder="Address" value={vendorForm.address} onChange={e => setVendorForm({ ...vendorForm, address: e.target.value })} />
            <Input placeholder="Notes" value={vendorForm.notes} onChange={e => setVendorForm({ ...vendorForm, notes: e.target.value })} />
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setVendorDialog(false)}>Cancel</Button><Button onClick={createVendor}>Create Vendor</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={poDialog} onOpenChange={setPoDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={poForm.vendor_id} onValueChange={v => setPoForm({ ...poForm, vendor_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select vendor *" /></SelectTrigger>
              <SelectContent>
                {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" placeholder="Expected delivery" value={poForm.expected_delivery} onChange={e => setPoForm({ ...poForm, expected_delivery: e.target.value })} />

            <div className="border rounded-md p-3">
              <h4 className="text-sm font-medium mb-2">Line Items</h4>
              <div className="flex gap-2 mb-2">
                <Input placeholder="Product name" value={itemForm.product_name} onChange={e => setItemForm({ ...itemForm, product_name: e.target.value })} className="flex-1" />
                <Input type="number" placeholder="Qty" value={itemForm.qty} onChange={e => setItemForm({ ...itemForm, qty: parseInt(e.target.value) || 1 })} className="w-20" />
                <Input type="number" placeholder="Unit price" value={itemForm.unit_price || ""} onChange={e => setItemForm({ ...itemForm, unit_price: parseFloat(e.target.value) || 0 })} className="w-28" />
                <Button onClick={addItem} size="sm"><Plus className="h-4 w-4" /></Button>
              </div>
              {poForm.items.length > 0 && (
                <Table>
                  <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Qty</TableHead><TableHead>Unit Price</TableHead><TableHead>Total</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {poForm.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm">{item.product_name}</TableCell>
                        <TableCell className="text-sm">{item.qty}</TableCell>
                        <TableCell className="text-sm">KES {item.unit_price.toLocaleString()}</TableCell>
                        <TableCell className="text-sm font-medium">KES {item.total.toLocaleString()}</TableCell>
                        <TableCell><Button variant="ghost" size="sm" onClick={() => removeItem(idx)}><Minus className="h-3 w-3" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {poForm.items.length > 0 && (
                <div className="mt-2 text-right space-y-1">
                  <div className="text-sm">Subtotal: KES {poTotal.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Tax (16%): KES {poTax.toLocaleString()}</div>
                  <div className="text-lg font-bold">Total: KES {poGrandTotal.toLocaleString()}</div>
                </div>
              )}
            </div>

            <Input placeholder="Notes" value={poForm.notes} onChange={e => setPoForm({ ...poForm, notes: e.target.value })} />
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setPoDialog(false)}>Cancel</Button><Button onClick={createPO}>Create PO</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>PO {selectedPO?.po_number}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Vendor:</span> {selectedPO?.vendor_name}</div>
              <div><span className="text-muted-foreground">Status:</span> {selectedPO?.status}</div>
              <div><span className="text-muted-foreground">Created:</span> {selectedPO?.created_at ? new Date(selectedPO.created_at).toLocaleDateString() : "—"}</div>
              <div><span className="text-muted-foreground">Expected:</span> {selectedPO?.expected_delivery ? new Date(selectedPO.expected_delivery).toLocaleDateString() : "—"}</div>
            </div>
            {(selectedPO as PurchaseOrder)?.items && (selectedPO as PurchaseOrder).items.length > 0 && (
              <Table>
                <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Qty</TableHead><TableHead>Unit Price</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(selectedPO as PurchaseOrder).items.map((item: PurchaseOrderItem, idx: number) => (
                    <TableRow key={idx}><TableCell className="text-sm">{item.product_name}</TableCell><TableCell className="text-sm">{item.qty}</TableCell><TableCell className="text-sm">KES {parseFloat(item.unit_price).toLocaleString()}</TableCell><TableCell className="text-sm font-medium">KES {parseFloat(item.total).toLocaleString()}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="text-right space-y-1">
              <div className="text-sm">Subtotal: KES {parseFloat(selectedPO?.subtotal || 0).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Tax: KES {parseFloat(selectedPO?.tax_amount || 0).toLocaleString()}</div>
              <div className="text-lg font-bold">Total: KES {parseFloat(selectedPO?.total || 0).toLocaleString()}</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
