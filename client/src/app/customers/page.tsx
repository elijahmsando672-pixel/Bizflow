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
import { Plus, Search, Users, UserCheck, UserX, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
}

interface CustomerForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState<CustomerForm>({ name: "", email: "", phone: "", address: "", status: "active" });
  const toast = useToast();

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.customers.getAll();
      setCustomers(data as Customer[]);
    } catch (err: Error) {
      toast.error(err?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await api.customers.delete(id);
      toast.success("Customer deleted");
      loadCustomers();
    } catch (err: Error) {
      toast.error(err?.message || "Failed to delete customer");
    }
  };

  const handleCreateCustomer = async () => {
    if (!customerForm.name) {
      toast.error("Name is required");
      return;
    }
    try {
      await api.customers.create({
        name: customerForm.name,
        email: customerForm.email || undefined,
        phone: customerForm.phone || undefined,
        address: customerForm.address || undefined,
        status: customerForm.status,
      });
      toast.success("Customer created");
      setDialogOpen(false);
      setCustomerForm({ name: "", email: "", phone: "", address: "", status: "active" });
      loadCustomers();
    } catch (err: Error) {
      toast.error(err?.message || "Failed to create customer");
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setViewDialogOpen(true);
  };

  const filteredCustomers = customers.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCustomers = customers.filter((c) => c.status === "active");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Customers</h2>
          <p className="text-gray-500">Manage your customer relationships</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { setCustomerForm({ name: "", email: "", phone: "", address: "", status: "active" }); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search customers..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Customers</CardDescription>
            <CardTitle className="text-3xl">{customers.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="h-4 w-4" />
              Registered
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Customers</CardDescription>
            <CardTitle className="text-3xl text-green-600">{activeCustomers.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <UserCheck className="h-4 w-4" />
              This month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Inactive</CardDescription>
            <CardTitle className="text-3xl text-gray-600">
              {customers.length - activeCustomers.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <UserX className="h-4 w-4" />
              No recent orders
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>View and manage your customer database</CardDescription>
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
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-gray-500">{customer.email}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>${customer.total_spent || 0}</TableCell>
                    <TableCell>{customer.order_count || 0}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          customer.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {customer.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleViewCustomer(customer)}>
                          View
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(customer.id)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCustomers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No customers found
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
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>Create a new customer</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} placeholder="Customer name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input type="email" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} placeholder="+254..." />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Input value={customerForm.address} onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })} placeholder="Address" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={customerForm.status} onValueChange={(v) => setCustomerForm({ ...customerForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateCustomer}>Add Customer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{selectedCustomer.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedCustomer.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{selectedCustomer.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="font-medium">KSh {parseFloat(selectedCustomer.total_spent || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Orders</p>
                  <p className="font-medium">{selectedCustomer.order_count || 0}</p>
                </div>
              </div>
              {selectedCustomer.address && (
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{selectedCustomer.address}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}