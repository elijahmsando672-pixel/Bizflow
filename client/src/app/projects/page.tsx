"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderPlus, CheckSquare, Calendar, User, Clock } from "lucide-react";
import api from "@/lib/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectDialog, setProjectDialog] = useState(false);
  const [taskDialog, setTaskDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [projectForm, setProjectForm] = useState({ name: "", description: "", start_date: "", end_date: "", budget: 0, customer_id: "" });
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", assignee_id: "", due_date: "", estimated_hours: 0 });
  const [customers, setCustomers] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => { loadProjects(); loadCustomers(); loadTeam(); }, [filterStatus]);

  async function loadProjects() {
    setLoading(true);
    try {
      const params = filterStatus !== "all" ? `?status=${filterStatus}` : "";
      const data = await api.projects.getProjects(params);
      setProjects(data as any[]);
    } catch (e) {
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomers() {
    try {
      const data = await api.customers.getAll();
      setCustomers(data as any[]);
    } catch (e) {}
  }

  async function loadTeam() {
    try {
      const data = await api.team.getMembers();
      setTeam(data as any[]);
    } catch (e) {}
  }

  async function loadTasks(project: any) {
    setSelectedProject(project);
    setTaskDialog(true);
    try {
      const data = await api.projects.getTasks(project.id);
      setTasks(data as any[]);
    } catch (e) {
      setError("Failed to load tasks");
    }
  }

  async function createProject() {
    setError(null);
    try {
      await api.projects.createProject(projectForm);
      setSuccess("Project created");
      setProjectDialog(false);
      setProjectForm({ name: "", description: "", start_date: "", end_date: "", budget: 0, customer_id: "" });
      loadProjects();
    } catch (e) {
      setError("Failed to create project");
    }
  }

  async function createTask() {
    if (!selectedProject) return;
    setError(null);
    try {
      await api.projects.createTask(selectedProject.id, taskForm);
      setSuccess("Task created");
      setTaskForm({ title: "", description: "", priority: "medium", assignee_id: "", due_date: "", estimated_hours: 0 });
      loadTasks(selectedProject);
    } catch (e) {
      setError("Failed to create task");
    }
  }

  async function updateTaskStatus(task: any, status: string) {
    try {
      await api.projects.updateTask(task.id, { status });
      if (selectedProject) loadTasks(selectedProject);
    } catch (e) {
      setError("Failed to update task");
    }
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = { todo: "bg-gray-100 text-gray-800", in_progress: "bg-blue-100 text-blue-800", completed: "bg-green-100 text-green-800", blocked: "bg-red-100 text-red-800" };
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[status] || "bg-gray-100"}`}>{status.replace("_", " ")}</span>;
  }

  function getPriorityBadge(priority: string) {
    const colors: Record<string, string> = { critical: "bg-red-100 text-red-800", high: "bg-orange-100 text-orange-800", medium: "bg-yellow-100 text-yellow-800", low: "bg-green-100 text-green-800" };
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[priority] || "bg-gray-100"}`}>{priority}</span>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Projects</h1>
        <p className="text-muted-foreground mt-1">Manage projects, track tasks, and monitor team productivity.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Projects</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{projects.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{projects.filter(p => p.status === "active").length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Completed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{projects.filter(p => p.status === "completed").length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Budget</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-purple-600">KES {projects.reduce((s, p) => s + parseFloat(p.budget || 0), 0).toLocaleString()}</div></CardContent></Card>
      </div>

      <div className="flex items-center justify-between">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded-md px-2 py-1 text-sm">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
        </select>
        <Button onClick={() => setProjectDialog(true)}><FolderPlus className="h-4 w-4 mr-2" />New Project</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow> :
               projects.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No projects yet</TableCell></TableRow> :
               projects.map(project => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>{getStatusBadge(project.status)}</TableCell>
                  <TableCell>{project.customer_name || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs">
                      <CheckSquare className="h-3 w-3" />
                      {project.tasks_done || 0}/{(project.tasks_todo || 0) + (project.tasks_in_progress || 0) + (project.tasks_done || 0)}
                    </div>
                  </TableCell>
                  <TableCell><span className="text-xs">{parseFloat(project.total_hours || 0).toFixed(1)}h</span></TableCell>
                  <TableCell>{project.budget ? `KES ${parseFloat(project.budget).toLocaleString()}` : "—"}</TableCell>
                  <TableCell><span className="text-xs">{project.start_date ? new Date(project.start_date).toLocaleDateString() : "—"} → {project.end_date ? new Date(project.end_date).toLocaleDateString() : "—"}</span></TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => loadTasks(project)}>Tasks</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={projectDialog} onOpenChange={setProjectDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Project name *" value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} />
            <textarea className="w-full border rounded-md p-2 text-sm min-h-[60px]" placeholder="Description" value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" value={projectForm.start_date} onChange={e => setProjectForm({ ...projectForm, start_date: e.target.value })} />
              <Input type="date" value={projectForm.end_date} onChange={e => setProjectForm({ ...projectForm, end_date: e.target.value })} />
              <Input type="number" placeholder="Budget" value={projectForm.budget || ""} onChange={e => setProjectForm({ ...projectForm, budget: parseFloat(e.target.value) || 0 })} />
              <Select value={projectForm.customer_id} onValueChange={v => setProjectForm({ ...projectForm, customer_id: v })}>
                <SelectTrigger><SelectValue placeholder="Customer (optional)" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setProjectDialog(false)}>Cancel</Button><Button onClick={createProject}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={taskDialog} onOpenChange={setTaskDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{selectedProject?.name} — Tasks</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Task title" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
              <Select value={taskForm.priority} onValueChange={v => setTaskForm({ ...taskForm, priority: v })}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={createTask}>Add</Button>
            </div>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="todo">To Do</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              {["all", "todo", "in_progress", "completed"].map(tab => (
                <TabsContent key={tab} value={tab}>
                  <Table>
                    <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Priority</TableHead><TableHead>Assignee</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {(tab === "all" ? tasks : tasks.filter(t => t.status === tab)).map(task => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                          <TableCell className="text-sm">{task.assignee_name || "Unassigned"}</TableCell>
                          <TableCell className="text-sm">{task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}</TableCell>
                          <TableCell>
                            <Select defaultValue={task.status} onValueChange={v => updateTaskStatus(task, v)}>
                              <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="todo">To Do</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="blocked">Blocked</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(tab === "all" ? tasks : tasks.filter(t => t.status === tab)).length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No tasks</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
