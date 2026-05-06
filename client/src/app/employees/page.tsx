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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Clock, DollarSign, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hire_date: string;
  salary: number;
  salary_type: string;
  status: string;
}

interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  clock_in: string;
  clock_out: string;
}

interface Payroll {
  id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  gross_salary: number;
  deductions: number;
  bonuses: number;
  tax_amount: number;
}

interface EmployeeForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hire_date: string;
  salary: number;
  salary_type: string;
  status: string;
}

interface PayrollForm {
  employee_id: string;
  period_start: string;
  period_end: string;
  gross_salary: number;
  deductions: number;
  bonuses: number;
  tax_amount: number;
  notes: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeDialog, setEmployeeDialog] = useState(false);
  const [payrollDialog, setPayrollDialog] = useState(false);
  const [form, setForm] = useState<EmployeeForm>({
    first_name: "", last_name: "", email: "", phone: "",
    position: "", department: "", hire_date: new Date().toISOString().split("T")[0],
    salary: 0, salary_type: "monthly", status: "active",
  });
  const [payrollForm, setPayrollForm] = useState<PayrollForm>({
    employee_id: "", period_start: "", period_end: "",
    gross_salary: 0, deductions: 0, bonuses: 0, tax_amount: 0, notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [empRes, attRes, payRes] = await Promise.all([
        api.employees.getAll(),
        api.employees.getAttendance(`date=${new Date().toISOString().split("T")[0]}`),
        api.employees.getPayroll(),
      ]);
      setEmployees(empRes as Employee[]);
      setAttendance(attRes as Attendance[]);
      setPayroll(payRes as Payroll[]);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateEmployee() {
    try {
      await api.employees.create(form);
      setSuccess("Employee created");
      setEmployeeDialog(false);
      setForm({ first_name: "", last_name: "", email: "", phone: "", position: "", department: "", hire_date: new Date().toISOString().split("T")[0], salary: 0, salary_type: "monthly", status: "active" });
      loadData();
    } catch (err: Error) {
      setError(err.message);
    }
  }

  async function handleDeleteEmployee(id: string) {
    try {
      await api.employees.delete(id);
      loadData();
    } catch (err: Error) {
      setError(err.message);
    }
  }

  async function handleClockIn(id: string) {
    try {
      await api.employees.clockIn(id);
      loadData();
    } catch (err: Error) {
      setError(err.message);
    }
  }

  async function handleClockOut(id: string) {
    try {
      await api.employees.clockOut(id);
      loadData();
    } catch (err: Error) {
      setError(err.message);
    }
  }

  async function handleCreatePayroll() {
    try {
      await api.employees.createPayroll(payrollForm);
      setSuccess("Payroll created");
      setPayrollDialog(false);
      loadData();
    } catch (err: Error) {
      setError(err.message);
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Employees & Payroll</h2>
          <p className="text-gray-500">Manage employees, attendance, and payroll</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setPayrollDialog(true)}>
            <DollarSign className="mr-2 h-4 w-4" /> Create Payroll
          </Button>
          <Button onClick={() => setEmployeeDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Add Employee
          </Button>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 p-4 text-green-600">{success}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <UserPlus className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-gray-500">
              {employees.filter((e) => e.status === "active").length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <Clock className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{attendance.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {payroll.reduce((sum, p) => sum + parseFloat(p.net_salary || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">
                        {emp.first_name} {emp.last_name}
                      </TableCell>
                      <TableCell>{emp.position || "-"}</TableCell>
                      <TableCell>{emp.department || "-"}</TableCell>
                      <TableCell>{parseFloat(emp.salary || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            emp.status === "active"
                              ? "bg-green-100 text-green-700"
                              : emp.status === "terminated"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }
                        >
                          {emp.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleClockIn(emp.id)}
                          >
                            Clock In
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleClockOut(emp.id)}
                          >
                            Clock Out
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteEmployee(emp.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500">
                        No attendance records today
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendance.map((att) => (
                      <TableRow key={att.id}>
                        <TableCell className="font-medium">
                          {att.first_name} {att.last_name}
                        </TableCell>
                        <TableCell>{att.date}</TableCell>
                        <TableCell>
                          {att.clock_in
                            ? new Date(att.clock_in).toLocaleTimeString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {att.clock_out
                            ? new Date(att.clock_out).toLocaleTimeString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-700">{att.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Gross</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payroll.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500">
                        No payroll records
                      </TableCell>
                    </TableRow>
                  ) : (
                    payroll.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.first_name} {p.last_name}
                        </TableCell>
                        <TableCell>
                          {p.period_start} to {p.period_end}
                        </TableCell>
                        <TableCell>{parseFloat(p.gross_salary || 0).toLocaleString()}</TableCell>
                        <TableCell>{parseFloat(p.deductions || 0).toLocaleString()}</TableCell>
                        <TableCell className="font-bold">
                          {parseFloat(p.net_salary || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              p.status === "paid"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }
                          >
                            {p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={employeeDialog} onOpenChange={setEmployeeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
            <DialogDescription>Enter employee details</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="First Name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            />
            <Input
              placeholder="Last Name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            />
            <Input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              placeholder="Position"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            />
            <Input
              placeholder="Department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Salary"
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: parseFloat(e.target.value) || 0 })}
            />
            <Input
              type="date"
              value={form.hire_date}
              onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmployeeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEmployee}>Add Employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payrollDialog} onOpenChange={setPayrollDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Payroll</DialogTitle>
            <DialogDescription>Process payroll for an employee</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <select
              className="col-span-2 rounded border p-2"
              value={payrollForm.employee_id}
              onChange={(e) =>
                setPayrollForm({ ...payrollForm, employee_id: e.target.value })
              }
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
            <Input
              type="date"
              placeholder="Period Start"
              value={payrollForm.period_start}
              onChange={(e) =>
                setPayrollForm({ ...payrollForm, period_start: e.target.value })
              }
            />
            <Input
              type="date"
              placeholder="Period End"
              value={payrollForm.period_end}
              onChange={(e) =>
                setPayrollForm({ ...payrollForm, period_end: e.target.value })
              }
            />
            <Input
              type="number"
              placeholder="Gross Salary"
              value={payrollForm.gross_salary}
              onChange={(e) =>
                setPayrollForm({ ...payrollForm, gross_salary: parseFloat(e.target.value) || 0 })
              }
            />
            <Input
              type="number"
              placeholder="Deductions"
              value={payrollForm.deductions}
              onChange={(e) =>
                setPayrollForm({ ...payrollForm, deductions: parseFloat(e.target.value) || 0 })
              }
            />
            <Input
              type="number"
              placeholder="Bonuses"
              value={payrollForm.bonuses}
              onChange={(e) =>
                setPayrollForm({ ...payrollForm, bonuses: parseFloat(e.target.value) || 0 })
              }
            />
            <Input
              type="number"
              placeholder="Tax"
              value={payrollForm.tax_amount}
              onChange={(e) =>
                setPayrollForm({ ...payrollForm, tax_amount: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayrollDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePayroll}>Create Payroll</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
