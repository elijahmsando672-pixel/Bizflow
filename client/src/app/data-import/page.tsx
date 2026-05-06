"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, FileSpreadsheet, Database, CheckCircle, AlertCircle, FileJson } from "lucide-react";
import api from "@/lib/api";

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; error: string }[];
}

interface TemplateRecord {
  [key: string]: string | number | boolean | null;
}

export default function DataImportPage() {
  const [selectedResource, setSelectedResource] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const RESOURCES = [
    { value: "customers", label: "Customers" },
    { value: "products", label: "Products" },
    { value: "leads", label: "Leads" },
    { value: "vendors", label: "Vendors" },
    { value: "employees", label: "Employees" },
    { value: "invoices", label: "Invoices" },
    { value: "expenses", label: "Expenses" },
    { value: "deals", label: "Deals" },
    { value: "tickets", label: "Tickets" },
  ];

  const fileExt = file?.name?.split('.').pop()?.toLowerCase();

  async function handleImport() {
    if (!file || !selectedResource) return;
    setImporting(true);
    setImportResult(null);
    setError(null);

    try {
      const text = await file.text();

      if (fileExt === 'csv') {
        const result = await api.importExport.importCsv(selectedResource, text) as ImportResult;
        setImportResult(result);
        if (result.success > 0) setSuccess(`Imported ${result.success} records`);
        if (result.failed > 0) setError(`${result.failed} records failed`);
      } else {
        const data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error("File must contain a JSON array");
        const result = await api.importExport.importData(selectedResource, data) as ImportResult;
        setImportResult(result);
        if (result.success > 0) setSuccess(`Imported ${result.success} records`);
        if (result.failed > 0) setError(`${result.failed} records failed`);
      }
    } catch (e: Error) {
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
      const data = await api.importExport.exportData(selectedResource, 'json') as TemplateRecord[];
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedResource}_export_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess(`Exported ${data.length} records`);
    } catch (e: Error) {
      setError(e.message || "Failed to export data");
    } finally {
      setExporting(false);
    }
  }

  function downloadTemplate(format: 'json' | 'csv') {
    if (!selectedResource) return;
    api.importExport.getTemplate(selectedResource).then((template: TemplateRecord[]) => {
      if (format === 'csv') {
        const headers = Object.keys(template[0] || {}).join(',');
        const csvRows = template.map((row: TemplateRecord) =>
          Object.values(row).map(v => {
            const str = String(v ?? '');
            return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
          }).join(',')
        );
        const content = [headers, ...csvRows].join('\n');
        const blob = new Blob([content], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedResource}_template.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedResource}_template.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Data Import / Export</h1>
        <p className="text-muted-foreground mt-1">Bulk import and export data in JSON or CSV format.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md flex items-center gap-2"><CheckCircle className="h-4 w-4" />{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Import Data</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <select
              value={selectedResource}
              onChange={e => setSelectedResource(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select data type</option>
              {RESOURCES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <FileSpreadsheet className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <Input type="file" accept=".json,.csv" onChange={e => setFile(e.target.files?.[0] || null)} className="max-w-xs mx-auto" />
              <p className="text-xs text-muted-foreground mt-2">JSON array or CSV format</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => downloadTemplate('json')} variant="outline" disabled={!selectedResource} className="flex-1"><FileJson className="h-4 w-4 mr-2" />JSON Template</Button>
              <Button onClick={() => downloadTemplate('csv')} variant="outline" disabled={!selectedResource} className="flex-1"><FileSpreadsheet className="h-4 w-4 mr-2" />CSV Template</Button>
            </div>
            <Button onClick={handleImport} disabled={!file || !selectedResource || importing} className="w-full">{importing ? "Importing..." : "Import"}</Button>
            {importResult && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">{importResult.success} imported</Badge>
                  {importResult.failed > 0 && <Badge variant="destructive">{importResult.failed} failed</Badge>}
                </div>
                {importResult.errors.length > 0 && (
                  <div className="max-h-32 overflow-y-auto text-xs text-red-600 space-y-1">
                    {importResult.errors.slice(0, 5).map((e, i) => <div key={i}>Row {e.row}: {e.error}</div>)}
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
            <select
              value={selectedResource}
              onChange={e => setSelectedResource(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select data type</option>
              {RESOURCES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
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
