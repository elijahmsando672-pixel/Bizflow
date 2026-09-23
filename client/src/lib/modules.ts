import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  ReceiptText,
  BarChart3,
  UserRoundCog,
  Settings,
  CircleHelp,
} from "lucide-react";

export interface ModuleNavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  keyword: string;
}

export interface Workspace {
  id: string;
  name: string;
  initials: string;
}

export const navMain: ModuleNavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/modules", icon: LayoutDashboard, keyword: "home overview dashboard" },
  { id: "projects", label: "Projects", href: "/modules/projects", icon: FolderKanban, keyword: "projects portfolio milestones deliverables" },
  { id: "tasks", label: "Tasks", href: "/modules/tasks", icon: CheckSquare, keyword: "tasks to-dos checklists priorities" },
  { id: "clients", label: "Clients", href: "/modules/clients", icon: Users, keyword: "clients customers contacts companies" },
  { id: "invoices", label: "Invoices", href: "/modules/invoices", icon: ReceiptText, keyword: "invoices billing payments receipts" },
  { id: "reports", label: "Reports", href: "/modules/reports", icon: BarChart3, keyword: "reports analytics insights charts" },
  { id: "team", label: "Team", href: "/modules/team", icon: UserRoundCog, keyword: "team members staff roles permissions" },
];

export const navSecondary: ModuleNavItem[] = [
  { id: "settings", label: "Settings", href: "/modules/settings", icon: Settings, keyword: "settings preferences profile workspace" },
  { id: "help", label: "Help & Support", href: "/modules/help", icon: CircleHelp, keyword: "help support faq contact documentation" },
];

export const allModules: ModuleNavItem[] = [...navMain, ...navSecondary];

export const workspaces: Workspace[] = [
  { id: "emohtech", name: "EmohTech Solutions", initials: "ET" },
  { id: "emoh-design", name: "EmohTech Design Studio", initials: "ED" },
];