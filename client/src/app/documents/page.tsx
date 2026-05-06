"use client";

import { useState } from "react";
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
import { Search, FileText, Download, Eye, Trash2, Upload } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Document {
  id: number;
  name: string;
  type: string;
  size: string;
  date: string;
  status: string;
  content: string;
}

const documents: Document[] = [
  { id: 1, name: "Invoice_2024_001.pdf", type: "Invoice", size: "45 KB", date: "2024-01-15", status: "Generated", content: "Sample invoice content" },
  { id: 2, name: "Invoice_2024_000.pdf", type: "Invoice", size: "42 KB", date: "2024-01-14", status: "Generated", content: "Sample invoice content" },
  { id: 3, name: "Contract_JohnDoe.pdf", type: "Contract", size: "128 KB", date: "2024-01-10", status: "Signed", content: "Sample contract content" },
  { id: 4, name: "Receipt_Jan2024.pdf", type: "Receipt", size: "35 KB", date: "2024-01-05", status: "Generated", content: "Sample receipt content" },
  { id: 5, name: "Report_Dec2023.pdf", type: "Report", size: "256 KB", date: "2024-01-01", status: "Generated", content: "Sample report content" },
];

interface UploadForm {
  name: string;
  type: string;
  file: File | null;
}

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [uploadForm, setUploadForm] = useState<UploadForm>({ name: "", type: "", file: null });
  const [docs, setDocs] = useState<Document[]>(documents);
  const toast = useToast();

  const filteredDocs = docs.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.type.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpload = () => {
    if (!uploadForm.name || !uploadForm.type) {
      toast.error("Name and type are required");
      return;
    }
    const newDoc = {
      id: Date.now(),
      name: uploadForm.name,
      type: uploadForm.type,
      size: uploadForm.file ? `${(uploadForm.file.size / 1024).toFixed(0)} KB` : "0 KB",
      date: new Date().toISOString().split("T")[0],
      status: "Uploaded",
      content: uploadForm.file ? `Uploaded file: ${uploadForm.file.name}` : "No file attached",
    };
    setDocs([newDoc, ...docs]);
    toast.success("Document uploaded");
    setUploadDialogOpen(false);
    setUploadForm({ name: "", type: "", file: null });
  };

  const handleViewDoc = (doc: Document) => {
    setSelectedDoc(doc);
    setViewDialogOpen(true);
  };

  const handleDownloadDoc = (doc: Document) => {
    const blob = new Blob([doc.content || "Sample document content"], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloading ${doc.name}`);
  };

  const handleDeleteDoc = (id: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    setDocs(docs.filter((d) => d.id !== id));
    toast.success("Document deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Documents</h2>
          <p className="text-gray-500">Manage your business documents</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setUploadDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search documents..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Documents</CardDescription>
            <CardTitle className="text-3xl">156</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FileText className="h-4 w-4" />
              Uploaded
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Invoices</CardDescription>
            <CardTitle className="text-3xl">89</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FileText className="h-4 w-4" />
              This month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Contracts</CardDescription>
            <CardTitle className="text-3xl">24</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FileText className="h-4 w-4" />
              Active
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
          <CardDescription>View and manage your documents</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.name}</TableCell>
                  <TableCell>{doc.type}</TableCell>
                  <TableCell className="text-gray-500">{doc.size}</TableCell>
                  <TableCell className="text-gray-500">{doc.date}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        doc.status === "Signed"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleViewDoc(doc)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDownloadDoc(doc)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteDoc(doc.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredDocs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No documents found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Add a new document</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Document Name</Label>
              <Input value={uploadForm.name} onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })} placeholder="Document name" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={uploadForm.type} onValueChange={(v) => setUploadForm({ ...uploadForm, type: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Invoice">Invoice</SelectItem>
                  <SelectItem value="Receipt">Receipt</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Report">Report</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>File (optional)</Label>
              <Input type="file" onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleUpload}>Upload</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDoc?.name}</DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{selectedDoc.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Size</p>
                  <p className="font-medium">{selectedDoc.size}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{selectedDoc.date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                    selectedDoc.status === "Signed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                  }`}>{selectedDoc.status}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Content</p>
                <p className="text-sm bg-gray-50 p-3 rounded-md">{selectedDoc.content}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleDownloadDoc(selectedDoc)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}