"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, FileSpreadsheet, Database, CheckCircle, AlertCircle } from "lucide-react";
import api from "@/lib/api";

export default function DataImportPage() {
  const [selectedResource, setSelectedResource] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const RESOURCES = [
    { value: "customers", label: "Customers" },
    { value: "products", label: "Products" },
    { value: "leads", label: "Leads" },
    { value: "vendors", label: "Vendors" },
    { value: "employees", label: "Employees" },
  ];

  async function handleImport() {
    if (!file || !selectedResource) return;
    setImporting(true);
    setImportResult(null);
    setError(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error("File must contain a JSON array");

      let imported = 0;
      let failed = 0;
      const errors: string[] = [];

      const apiMap: Record<string, (d: any) => Promise<any>> = {
        customers: api.customers.create,
        products: api.products.create,
        leads: api.crm.createLead,
        vendors: api.procurement.createVendor,
        employees: api.employees.create,
      };

      const createFn = apiMap[selectedResource];
      if (!createFn) throw new Error(`Import not supported for ${selectedResource}`);

      for (const item of data) {
        try {
          await createFn(item);
          imported++;
        } catch (e: any) {
          failed++;
          errors.push(`Row ${imported + failed}: ${e.message || "Unknown error"}`);
        }
      }

      setImportResult({ success: imported, failed, errors });
      setSuccess(`Imported ${imported} records successfully`);
    } catch (e: any) {
      setError(e.message || "Failed to import data");
    } finally {
      setImporting(false);
    }
  }

  async function handleExport() {
    if (!selectedResource) return;
    setExporting(true);
    setError(null);

    try {
      const apiMap: Record<string, () => Promise<any>> = {
        customers: api.customers.getAll,
        products: api.products.getAll,
        leads: () => api.crm.getLeads(),
        vendors: () => api.procurement.getVendors(),
        employees: () => api.employees.getAll(),
      };

      const fetchFn = apiMap[selectedResource];
      if (!fetchFn) throw new Error(`Export not supported for ${selectedResource}`);

      const data = await fetchFn();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedResource}_export_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess(`Exported ${(data as any[]).length} records`);
    } catch (e: any) {
      setError(e.message || "Failed to export data");
    } finally {
      setExporting(false);
    }
  }

  function downloadTemplate() {
    const templates: Record<string, any[]> = {
      customers: [{ name: "John Doe", email: "john@example.com", phone: "+254700000000", address: "Nairobi" }],
      products: [{ name: "Product A", sku: "PRD-001", category: "Electronics", price: 1000, stock_qty: 50 }],
      leads: [{ first_name: "Jane", last_name: "Smith", email: "jane@corp.com", company: "TechCorp", source: "inbound", estimated_value: 50000 }],
      vendors: [{ name: "Supplier Co", email: "sales@supplier.com", phone: "+254700000001", contact_person: "Bob", payment_terms: "Net 30" }],
      employees: [{ first_name: "Alice", last_name: "Johnson", email: "alice@company.com", phone: "+254700000002", position: "Developer" }],
    };

    const template = templates[selectedResource] || [];
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedResource}_template.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Data Import / Export</h1>
        <p className="text-muted-foreground mt-1">Bulk import and export data in JSON format. Use templates for correct structure.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md flex items-center gap-2"><CheckCircle className="h-4 w-4" />{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Import Data</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedResource} onValueChange={setSelectedResource}>
              <SelectTrigger><SelectValue placeholder="Select data type" /></SelectTrigger>
              <SelectContent>
                {RESOURCES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <FileSpreadsheet className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <Input type="file" accept=".json" onChange={e => setFile(e.target.files?.[0] || null)} className="max-w-xs mx-auto" />
              <p className="text-xs text-muted-foreground mt-2">JSON array format</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={downloadTemplate} variant="outline" disabled={!selectedResource} className="flex-1"><Download className="h-4 w-4 mr-2" />Download Template</Button>
              <Button onClick={handleImport} disabled={!file || !selectedResource || importing} className="flex-1">{importing ? "Importing..." : "Import"}</Button>
            </div>
            {importResult && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">{importResult.success} imported</Badge>
                  {importResult.failed > 0 && <Badge variant="secondary" className="bg-red-100 text-red-800">{importResult.failed} failed</Badge>}
                </div>
                {importResult.errors.length > 0 && (
                  <div className="max-h-32 overflow-y-auto text-xs text-red-600 space-y-1">
                    {importResult.errors.slice(0, 5).map((e, i) => <div key={i}>{e}</div>)}
                    {importResult.errors.length > 5 && <div>...and {importResult.errors.length - 5} more</div>}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" />Export Data</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedResource} onValueChange={setSelectedResource}>
              <SelectTrigger><SelectValue placeholder="Select data type" /></SelectTrigger>
              <SelectContent>
                {RESOURCES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <Database className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Export all records as JSON</p>
            </div>
            <Button onClick={handleExport} disabled={!selectedResource || exporting} className="w-full">{exporting ? "Exporting..." : "Export All"}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
