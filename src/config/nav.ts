import {
  Building2,
  Calendar,
  CreditCard,
  LayoutDashboard,
  Settings,
  Sparkles,
  SquareKanban,
  Users,
} from "lucide-react";

/** Primary — matches new dashboard design */
export const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Creators", icon: Users },
  { href: "/deals", label: "Deals", icon: SquareKanban },
  { href: "/brands", label: "Brands", icon: Building2 },
  { href: "/calendar", label: "Calendar", icon: Calendar },
] as const;

/** Rest of the app, shown below the fold in the sidebar */
export const moreNav = [
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/billing", label: "Billing", icon: Sparkles },
] as const;

export const bottomNav = [
  { href: "/settings", label: "Settings", icon: Settings },
] as const;
