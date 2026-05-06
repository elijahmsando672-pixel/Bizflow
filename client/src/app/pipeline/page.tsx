"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, User } from "lucide-react";
import api from "@/lib/api";

interface Stage {
  id: string;
  name: string;
  color: string;
  win_probability?: number;
}

interface Deal {
  id: string;
  name: string;
  customer_id: string;
  customer_name?: string;
  value: number;
  priority: string;
  stage_id: string;
  expected_close_date: string;
  assigned_to: string;
  outcome?: string;
}

interface Summary {
  won_deals: number;
  won_value: number;
  lost_deals: number;
  lost_value: number;
}

interface FormData {
  name: string;
  customer_id: string;
  value: number;
  priority: string;
  expected_close_date: string;
  assigned_to: string;
  notes: string;
}

export default function PipelinePage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [summary, setSummary] = useState<Summary>({ won_deals: 0, won_value: 0, lost_deals: 0, lost_value: 0 });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ name: "", customer_id: "", value: 0, priority: "medium", expected_close_date: "", assigned_to: "", notes: "" });
  const [customers, setCustomers] = useState<{ id: string; name: string; first_name: string; last_name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadPipeline = useCallback(async () => {
    setLoading(true);
    try {
      const [stagesData, dealsData, summaryData] = await Promise.all([
        api.pipeline.getStages(),
        api.pipeline.getDeals(),
        api.pipeline.getSummary(),
      ]);
      setStages(stagesData as Stage[]);
      setDeals(dealsData as Deal[]);
      setSummary((summaryData as { summary: Summary }).summary || {});
    } catch {
      setError("Failed to load pipeline");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const data = await api.customers.getAll();
      setCustomers(data as any);
    } catch {
      console.error("Failed to load customers");
    }
  }, []);

  useEffect(() => { loadPipeline(); loadCustomers(); }, [loadPipeline, loadCustomers]);

  async function handleSubmit() {
    setError(null);
    try {
      const payload = { ...form, stage_id: selectedStage, customer_id: form.customer_id || null };
      await api.pipeline.createDeal(payload);
      setSuccess("Deal created");
      setDialogOpen(false);
      setForm({ name: "", customer_id: "", value: 0, priority: "medium", expected_close_date: "", assigned_to: "", notes: "" });
      loadPipeline();
    } catch {
      setError("Failed to create deal");
    }
  }

  async function updateDealStage(deal: Deal, newStageId: string) {
    try {
      const stage = stages.find(s => s.id === newStageId);
      const outcome = stage?.name.includes("Won") ? "won" : stage?.name.includes("Lost") ? "lost" : undefined;
      await api.pipeline.updateDeal(deal.id, { stage_id: newStageId, outcome });
      loadPipeline();
    } catch {
      setError("Failed to update deal");
    }
  }

  const getDealsByStage = (stageId: string) => deals.filter(d => d.stage_id === stageId);

  function getPriorityBadge(priority: string) {
    const colors: Record<string, string> = { critical: "bg-red-100 text-red-800", high: "bg-orange-100 text-orange-800", medium: "bg-yellow-100 text-yellow-800", low: "bg-green-100 text-green-800" };
    return <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${colors[priority] || "bg-gray-100"}`}>{priority}</span>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Sales Pipeline</h1>
        <p className="text-muted-foreground mt-1">Track deals through your sales stages with win probabilities and forecasting.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Won Deals</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{summary.won_deals || 0}</div><p className="text-xs text-muted-foreground">KES {(summary.won_value || 0).toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Lost Deals</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{summary.lost_deals || 0}</div><p className="text-xs text-muted-foreground">KES {(summary.lost_value || 0).toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Open Pipeline</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{deals.filter(d => !d.outcome).length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Win Rate</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-purple-600">{summary.won_deals + summary.lost_deals > 0 ? Math.round((summary.won_deals / (summary.won_deals + summary.lost_deals)) * 100) : 0}%</div></CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => { setSelectedStage(null); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />New Deal</Button>
      </div>

      {loading ? <div className="text-center py-12 text-muted-foreground">Loading pipeline...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {stages.map(stage => {
            const stageDeals = getDealsByStage(stage.id);
            const stageValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
            return (
              <Card key={stage.id} className="min-h-[400px]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: stage.color }} />
                    {stage.name}
                    <Badge variant="secondary" className="ml-auto text-xs">{stageDeals.length}</Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">KES {stageValue.toLocaleString()} {stage.win_probability ? `(${stage.win_probability}% win)` : ""}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {stageDeals.map(deal => (
                    <Card key={deal.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm">{deal.name}</h4>
                          {getPriorityBadge(deal.priority)}
                        </div>
                        <div className="text-sm font-semibold text-green-600">KES {(deal.value || 0).toLocaleString()}</div>
                        {deal.customer_name && <div className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />{deal.customer_name}</div>}
                        {deal.expected_close_date && <div className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(deal.expected_close_date).toLocaleDateString()}</div>}
                        <Select defaultValue={deal.stage_id || ""} onValueChange={v => updateDealStage(deal, v)}>
                          <SelectTrigger className="h-6 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {stages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </Card>
                  ))}
                  <Button variant="ghost" className="w-full text-sm h-8 border border-dashed" onClick={() => { setSelectedStage(stage.id); setDialogOpen(true); }}>
                    <Plus className="h-3 w-3 mr-1" />Add deal
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selectedStage ? "Add Deal to Stage" : "Create New Deal"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Deal name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Select value={form.customer_id} onValueChange={v => setForm({ ...form, customer_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select customer (optional)" /></SelectTrigger>
              <SelectContent>
                {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Value" value={form.value || ""} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} />
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" placeholder="Expected close" value={form.expected_close_date} onChange={e => setForm({ ...form, expected_close_date: e.target.value })} />
            </div>
            <Input placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Create Deal</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
