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
  }, []);

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
        <Button className="bg-blue-600 hover:bg-blue-700">
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
        <Button variant="outline">
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
                        <Button variant="ghost" size="sm">
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
    </div>
  );
}
