import {
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  ListTodo,
  Settings,
  Sparkles,
  Users,
  SquareKanban,
} from "lucide-react";

export const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/deals", label: "Deals", icon: SquareKanban },
  { href: "/brands", label: "Brands", icon: Building2 },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/templates", label: "Templates", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/billing", label: "Billing", icon: Sparkles },
] as const;
