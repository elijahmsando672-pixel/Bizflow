"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Check, X, Save } from "lucide-react";
import api from "@/lib/api";

interface Permission {
  role_name: string;
  resource: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

const RESOURCES = ["customers", "products", "sales", "expenses", "invoices", "leads", "deals", "tickets", "projects", "vendors", "purchase_orders", "employees", "team", "reports"];

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState("admin");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, Partial<Permission>>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [permsData, rolesData] = await Promise.all([
        api.permissions.getPermissions(),
        api.permissions.getRoles(),
      ]);
      setPermissions(permsData as Permission[]);
      setRoles(rolesData as string[]);
      if (rolesData && (rolesData as string[]).length > 0) {
        setSelectedRole((rolesData as string[])[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load permissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function togglePerm(resource: string, field: string) {
    const key = `${selectedRole}-${resource}`;
    const current = editing[key] || permissions.find(p => p.role_name === selectedRole && p.resource === resource) || {} as Partial<Permission>;
    setEditing({
      ...editing,
      [key]: { ...current, resource, [field]: !current[field as keyof Permission] },
    });
  }

  function getPermValue(resource: string, field: string): boolean {
    const key = `${selectedRole}-${resource}`;
    if (editing[key] && editing[key][field as keyof Permission] !== undefined) return !!editing[key][field as keyof Permission];
    const perm = permissions.find(p => p.role_name === selectedRole && p.resource === resource);
    return perm ? !!perm[field as keyof Permission] : false;
  }

  async function saveRole() {
    const rolePermissions = RESOURCES.map(resource => {
      const key = `${selectedRole}-${resource}`;
      const perm = editing[key] || permissions.find(p => p.role_name === selectedRole && p.resource === resource) || {};
      return { resource, can_create: !!perm.can_create, can_read: !!perm.can_read, can_update: !!perm.can_update, can_delete: !!perm.can_delete };
    });
    setError(null);
    try {
      await api.permissions.updateBulkPermissions(selectedRole, rolePermissions);
      setSuccess(`Permissions saved for ${selectedRole}`);
      setEditing({});
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save permissions");
    }
  }

  function CheckIcon({ checked }: { checked: boolean }) {
    return checked ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-400" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Permissions — RBAC</h1>
        <p className="text-muted-foreground mt-1">Manage role-based access control for your team. Configure what each role can do.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md">{success}</div>}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Role Permissions</CardTitle>
          <div className="flex items-center gap-3">
            <Select value={selectedRole} onValueChange={v => { setSelectedRole(v); setEditing({}); }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {roles.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={saveRole} disabled={Object.keys(editing).length === 0}><Save className="h-4 w-4 mr-2" />Save Changes</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead className="w-48">Resource</TableHead><TableHead className="text-center">Create</TableHead><TableHead className="text-center">Read</TableHead><TableHead className="text-center">Update</TableHead><TableHead className="text-center">Delete</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow> :
               RESOURCES.map(resource => (
                <TableRow key={resource}>
                  <TableCell className="font-medium capitalize">{resource.replace(/_/g, " ")}</TableCell>
                  {["can_create", "can_read", "can_update", "can_delete"].map(field => (
                    <TableCell key={field} className="text-center cursor-pointer" onClick={() => field !== "can_read" && togglePerm(resource, field)}>
                      <div className="flex justify-center">
                        <CheckIcon checked={getPermValue(resource, field)} />
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Quick Role Templates</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { role: "admin", desc: "Full access to all resources" },
              { role: "manager", desc: "Can create, read, update but not delete" },
              { role: "staff", desc: "Can create and read only" },
              { role: "viewer", desc: "Read-only access" },
            ].map(t => (
              <div key={t.role} className={`p-3 rounded-lg border ${t.role === selectedRole ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                <div className="font-medium capitalize">{t.role}</div>
                <div className="text-xs text-muted-foreground">{t.desc}</div>
                <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs" onClick={() => { setSelectedRole(t.role); setEditing({}); }}>Select</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
