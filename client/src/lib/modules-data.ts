import type { LucideIcon } from "lucide-react";
import { Building2, Users, Rocket } from "lucide-react";

export const ONBOARDING_STORAGE_KEY = "bizflow.onboarding.complete";

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export interface Kpi {
  id: string;
  label: string;
  value: string;
  delta: number;
  trend: "up" | "down";
  spark: number[];
}

export const kpis: Kpi[] = [
  {
    id: "revenue",
    label: "Total Revenue",
    value: "KES 2,845,900",
    delta: 12.4,
    trend: "up",
    spark: [210, 240, 232, 260, 255, 285, 300, 315, 330, 348, 362, 380],
  },
  {
    id: "invoices",
    label: "Paid Invoices",
    value: "KES 1,204,600",
    delta: 8.2,
    trend: "up",
    spark: [120, 138, 132, 150, 158, 164, 172, 168, 182, 194, 200, 214],
  },
  {
    id: "projects",
    label: "Active Projects",
    value: "24",
    delta: 4.1,
    trend: "up",
    spark: [12, 13, 13, 14, 16, 17, 17, 18, 20, 21, 23, 24],
  },
  {
    id: "clients",
    label: "New Clients",
    value: "8",
    delta: 2.6,
    trend: "down",
    spark: [14, 12, 13, 11, 12, 10, 9, 10, 9, 8, 8, 8],
  },
];

export const revenueSeries = [
  { label: "Jan", value: 210 },
  { label: "Feb", value: 240 },
  { label: "Mar", value: 232 },
  { label: "Apr", value: 260 },
  { label: "May", value: 255 },
  { label: "Jun", value: 285 },
  { label: "Jul", value: 300 },
  { label: "Aug", value: 315 },
  { label: "Sep", value: 330 },
  { label: "Oct", value: 348 },
  { label: "Nov", value: 362 },
  { label: "Dec", value: 380 },
];

export const clientsSeries = [
  { label: "Jan", value: 14 },
  { label: "Feb", value: 12 },
  { label: "Mar", value: 13 },
  { label: "Apr", value: 11 },
  { label: "May", value: 12 },
  { label: "Jun", value: 10 },
  { label: "Jul", value: 9 },
  { label: "Aug", value: 10 },
  { label: "Sep", value: 9 },
  { label: "Oct", value: 8 },
  { label: "Nov", value: 9 },
  { label: "Dec", value: 8 },
];

export const taskCompletionSeries = [
  { label: "Jan", value: 34, target: 30 },
  { label: "Feb", value: 40, target: 32 },
  { label: "Mar", value: 36, target: 34 },
  { label: "Apr", value: 48, target: 36 },
  { label: "May", value: 44, target: 38 },
  { label: "Jun", value: 52, target: 40 },
  { label: "Jul", value: 58, target: 42 },
  { label: "Aug", value: 54, target: 44 },
  { label: "Sep", value: 62, target: 46 },
  { label: "Oct", value: 66, target: 48 },
  { label: "Nov", value: 70, target: 50 },
  { label: "Dec", value: 74, target: 52 },
];

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
}

export const recentActivity: ActivityItem[] = [
  { id: "a1", actor: "Elijah", action: "marked", target: "Homepage redesign wireframes", time: "12m ago" },
  { id: "a2", actor: "Diana Kiarie", action: "created an invoice for", target: "Skylink Logistics (KES 84,000)", time: "1h ago" },
  { id: "a3", actor: "Brian Otieno", action: "commented on", target: "CRM migration", time: "3h ago" },
  { id: "a4", actor: "You", action: "paid", target: "Invoice #INV-2039", time: "Yesterday" },
  { id: "a5", actor: "System", action: "backed up", target: "All business data", time: "Yesterday" },
];

export type ProjectStatus = "On Track" | "At Risk" | "Delayed" | "Complete";

export interface Project {
  id: string;
  name: string;
  client: string;
  progress: number;
  due: string;
  status: ProjectStatus;
}

export const projects: Project[] = [
  { id: "prj1", name: "Homepage Redesign", client: "EmohTech Corp", progress: 72, due: "Oct 12, 2026", status: "On Track" },
  { id: "prj2", name: "CRM Migration", client: "Skylink Logistics", progress: 45, due: "Oct 30, 2026", status: "At Risk" },
  { id: "prj3", name: "Mobile App MVP", client: "Vertex Health", progress: 18, due: "Nov 22, 2026", status: "On Track" },
  { id: "prj4", name: "Brand Identity Refresh", client: "Nairobi Roasters", progress: 91, due: "Sep 28, 2026", status: "Delayed" },
  { id: "prj5", name: "Website SEO Audit", client: "Palm Savings", progress: 100, due: "Sep 20, 2026", status: "Complete" },
  { id: "prj6", name: "Payments Integration", client: "EmohTech Corp", progress: 34, due: "Nov 05, 2026", status: "On Track" },
  { id: "prj7", name: "Support Portal Revamp", client: "Vertex Health", progress: 60, due: "Oct 19, 2026", status: "At Risk" },
];

export type TaskStatus = "To Do" | "In Progress" | "Done";
export type TaskPriority = "High" | "Medium" | "Low";

export interface TaskItem {
  id: string;
  title: string;
  project: string;
  assignee: string;
  priority: TaskPriority;
  due: string;
  status: TaskStatus;
}

export const tasks: TaskItem[] = [
  { id: "t1", title: "Finalize hero section copy", project: "Homepage Redesign", assignee: "Elijah", priority: "High", due: "Sep 25, 2026", status: "In Progress" },
  { id: "t2", title: "Map legacy customer records", project: "CRM Migration", assignee: "Diana Kiarie", priority: "High", due: "Sep 27, 2026", status: "To Do" },
  { id: "t3", title: "Review onboarding flow", project: "Mobile App MVP", assignee: "Brian Otieno", priority: "Medium", due: "Oct 02, 2026", status: "To Do" },
  { id: "t4", title: "Hand over logo concepts", project: "Brand Identity Refresh", assignee: "Grace Wambui", priority: "High", due: "Sep 24, 2026", status: "Done" },
  { id: "t5", title: "Draft SEO report", project: "Website SEO Audit", assignee: "Diana Kiarie", priority: "Low", due: "Sep 22, 2026", status: "Done" },
  { id: "t6", title: "Wire up M-Pesa test keys", project: "Payments Integration", assignee: "Elijah", priority: "Medium", due: "Sep 29, 2026", status: "In Progress" },
  { id: "t7", title: "Define support ticket SLAs", project: "Support Portal Revamp", assignee: "Grace Wambui", priority: "High", due: "Oct 01, 2026", status: "To Do" },
];

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  projects: number;
  total: number;
  status: "Active" | "Inactive";
}

export const clients: Client[] = [
  { id: "c1", name: "Diana Kiarie", company: "Skylink Logistics", email: "diana@skylink.co.ke", phone: "+254 712 340 188", projects: 3, total: 420000, status: "Active" },
  { id: "c2", name: "Brian Otieno", company: "Vertex Health", email: "brian@vertexhealth.co", phone: "+254 721 881 204", projects: 2, total: 315000, status: "Active" },
  { id: "c3", name: "Grace Wambui", company: "Nairobi Roasters", email: "grace@nroasters.co.ke", phone: "+254 733 502 991", projects: 1, total: 128000, status: "Active" },
  { id: "c4", name: "Samuel Kiptoo", company: "Palm Savings", email: "samuel@palm.co.ke", phone: "+254 701 665 410", projects: 2, total: 96000, status: "Inactive" },
  { id: "c5", name: "Hellen Mwangi", company: "EmohTech Corp", email: "hellen@emohtech.com", phone: "+254 786 221 007", projects: 2, total: 540000, status: "Active" },
];

export type InvoiceStatus = "Paid" | "Pending" | "Overdue" | "Draft";

export interface Invoice {
  id: string;
  number: string;
  client: string;
  amount: number;
  issued: string;
  due: string;
  status: InvoiceStatus;
}

export const invoices: Invoice[] = [
  { id: "inv1", number: "INV-2041", client: "Skylink Logistics", amount: 84000, issued: "Aug 14, 2026", due: "Sep 14, 2026", status: "Overdue" },
  { id: "inv2", number: "INV-2040", client: "Vertex Health", amount: 120000, issued: "Sep 01, 2026", due: "Oct 01, 2026", status: "Pending" },
  { id: "inv3", number: "INV-2039", client: "EmohTech Corp", amount: 260000, issued: "Aug 02, 2026", due: "Sep 02, 2026", status: "Paid" },
  { id: "inv4", number: "INV-2038", client: "Nairobi Roasters", amount: 48000, issued: "Jul 20, 2026", due: "Aug 20, 2026", status: "Paid" },
  { id: "inv5", number: "INV-2037", client: "Palm Savings", amount: 96000, issued: "Sep 10, 2026", due: "Oct 10, 2026", status: "Draft" },
  { id: "inv6", number: "INV-2036", client: "Vertex Health", amount: 75000, issued: "Jul 05, 2026", due: "Aug 05, 2026", status: "Paid" },
];

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  projects: number;
  load: number;
  status: "Active" | "Invited";
}

export const team: TeamMember[] = [
  { id: "m1", name: "Elijah", role: "Owner · Admin", email: "elijah@bizflow.com", projects: 6, load: 82, status: "Active" },
  { id: "m2", name: "Diana Kiarie", role: "Project Manager", email: "diana@emohtech.com", projects: 4, load: 64, status: "Active" },
  { id: "m3", name: "Brian Otieno", role: "Senior Developer", email: "brian@emohtech.com", projects: 3, load: 58, status: "Active" },
  { id: "m4", name: "Grace Wambui", role: "Designer", email: "grace@emohtech.com", projects: 2, load: 41, status: "Active" },
  { id: "m5", name: "Peter Njoroge", role: "Accountant", email: "peter@emohtech.com", projects: 1, load: 26, status: "Active" },
  { id: "m6", name: "Sarah Achieng", role: "Support Analyst", email: "sarah@emohtech.com", projects: 0, load: 0, status: "Invited" },
];

export interface ReportSummary {
  id: string;
  label: string;
  value: string;
  delta: number;
  trend: "up" | "down";
  series: number[];
}

export const reportSummaries: ReportSummary[] = [
  { id: "r1", label: "Revenue", value: "KES 2,845,900", delta: 12.4, trend: "up", series: [210, 240, 232, 260, 255, 285] },
  { id: "r2", label: "Expenses", value: "KES 986,300", delta: 3.1, trend: "up", series: [120, 128, 122, 136, 131, 142] },
  { id: "r3", label: "Profit Margin", value: "65.3%", delta: 4.8, trend: "up", series: [58, 60, 59, 62, 63, 65] },
  { id: "r4", label: "Overdue Amount", value: "KES 84,000", delta: 21.4, trend: "down", series: [42, 38, 41, 30, 28, 21] },
];

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  time: string;
  unread: boolean;
}

export const notifications: NotificationItem[] = [
  { id: "n1", title: "Invoice #INV-2041 is overdue", detail: "Skylink Logistics · KES 84,000", time: "2h ago", unread: true },
  { id: "n2", title: "New task assigned to you", detail: "Map legacy customer records", time: "5h ago", unread: true },
  { id: "n3", title: "Payment received", detail: "EmohTech Corp · KES 260,000", time: "1d ago", unread: true },
  { id: "n4", title: "Invite accepted", detail: "Sarah Achieng joined your workspace", time: "2d ago", unread: false },
];

export interface WelcomeStep {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
}

export const welcomeSteps: WelcomeStep[] = [
  {
    icon: Building2,
    eyebrow: "Step 1 of 3",
    title: "Set up your workspace",
    description: "Add your business name, logo, contact information, currency, and preferences.",
    cta: "Set Up Workspace",
  },
  {
    icon: Users,
    eyebrow: "Step 2 of 3",
    title: "Invite your team",
    description: "Bring your team into BizFlow and assign the right roles and permissions.",
    cta: "Invite Team",
  },
  {
    icon: Rocket,
    eyebrow: "Step 3 of 3",
    title: "Create your first project",
    description: "Set up a first project, add milestones, and start collaborating on real work.",
    cta: "Create First Project",
  },
];