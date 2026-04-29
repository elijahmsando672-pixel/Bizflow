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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Timer, Play, Square, BarChart3 } from "lucide-react";
import api from "@/lib/api";

export default function TimeTrackingPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerInterval, setTimerInterval] = useState<any>(null);
  const [form, setForm] = useState({ project_id: "", task_id: "", description: "", date: new Date().toISOString().split("T")[0], duration_minutes: 0, is_billable: true });
  const [projects, setProjects] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => { loadData(); loadProjects(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [entriesData, summaryData] = await Promise.all([
        api.timetracking.getEntries(),
        api.timetracking.getSummary(),
      ]);
      setEntries(entriesData as any[]);
      setSummary(summaryData as any);
    } catch (e) {
      setError("Failed to load time entries");
    } finally {
      setLoading(false);
    }
  }

  async function loadProjects() {
    try {
      const data = await api.projects.getProjects();
      setProjects(data as any[]);
    } catch (e) {}
  }

  function startTimer() {
    setTimerRunning(true);
    setTimerSeconds(0);
    const interval = setInterval(() => {
      setTimerSeconds(s => s + 1);
    }, 1000);
    setTimerInterval(interval);
  }

  function stopTimer() {
    setTimerRunning(false);
    if (timerInterval) clearInterval(timerInterval);
    const minutes = Math.round(timerSeconds / 60);
    setForm({ ...form, duration_minutes: minutes || 1 });
  }

  function formatTime(totalSeconds: number) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  async function submitEntry() {
    setError(null);
    try {
      await api.timetracking.createEntry(form);
      setSuccess("Time entry saved");
      setDialogOpen(false);
      setForm({ project_id: "", task_id: "", description: "", date: new Date().toISOString().split("T")[0], duration_minutes: 0, is_billable: true });
      loadData();
    } catch (e) {
      setError("Failed to save time entry");
    }
  }

  async function deleteEntry(id: string) {
    try {
      await api.timetracking.deleteEntry(id);
      loadData();
    } catch (e) {
      setError("Failed to delete entry");
    }
  }

  const totalHours = parseFloat(summary.summary?.total_hours || 0).toFixed(1);
  const billableHours = parseFloat(summary.summary?.billable_hours || 0).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Time Tracking</h1>
        <p className="text-muted-foreground mt-1">Track billable hours across projects and team members.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Clock className="h-4 w-4" />Total Hours</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalHours}h</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Timer className="h-4 w-4 text-green-500" />Billable</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{billableHours}h</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Entries</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.summary?.total_entries || 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Non-Billable</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{parseFloat(summary.summary?.non_billable_hours || 0).toFixed(1)}h</div></CardContent></Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {timerRunning ? (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-md px-3 py-1.5">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="font-mono text-lg">{formatTime(timerSeconds)}</span>
              <Button size="sm" variant="destructive" onClick={stopTimer}><Square className="h-3 w-3 mr-1" />Stop</Button>
            </div>
          ) : (
            <Button variant="outline" onClick={startTimer}><Play className="h-4 w-4 mr-2" />Start Timer</Button>
          )}
        </div>
        <Button onClick={() => setDialogOpen(true)}><Clock className="h-4 w-4 mr-2" />Add Entry</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Date</TableHead><TableHead>Project</TableHead><TableHead>Description</TableHead><TableHead>Duration</TableHead><TableHead>Billable</TableHead><TableHead>User</TableHead><TableHead>Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> :
               entries.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No time entries yet</TableCell></TableRow> :
               entries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="text-sm">{entry.date ? new Date(entry.date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className="font-medium">{entry.project_name || "—"}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">{entry.description || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{Math.round(entry.duration_minutes || 0)} min ({(entry.duration_minutes / 60).toFixed(1)}h)</Badge>
                  </TableCell>
                  <TableCell>{entry.is_billable ? <span className="text-green-600 text-sm">Yes</span> : <span className="text-orange-600 text-sm">No</span>}</TableCell>
                  <TableCell className="text-sm">{entry.user_name || "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-red-600" onClick={() => deleteEntry(entry.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {summary.by_project && summary.by_project.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" />Hours by Project</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.by_project.map((p: any) => (
                <div key={p.project_name} className="flex items-center gap-3">
                  <span className="text-sm w-40 truncate">{p.project_name || "Unassigned"}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min((parseFloat(p.hours) / parseFloat(totalHours || "1")) * 100, 100)}%` }} />
                  </div>
                  <span className="text-sm font-medium w-16 text-right">{parseFloat(p.hours).toFixed(1)}h</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Time Entry</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={form.project_id} onValueChange={v => setForm({ ...form, project_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              <Input type="number" placeholder="Minutes" value={form.duration_minutes || ""} onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 0 })} />
            </div>
            <Select value={form.is_billable ? "true" : "false"} onValueChange={v => setForm({ ...form, is_billable: v === "true" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Billable</SelectItem>
                <SelectItem value="false">Non-Billable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={submitEntry}>Save Entry</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
