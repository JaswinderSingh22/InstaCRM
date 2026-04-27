import Link from "next/link";
import { UserPlus, FileText, Megaphone, User } from "lucide-react";

const actions = [
  { label: "Track a campaign", href: "/campaigns", icon: Megaphone },
  { label: "Add new lead", href: "/leads", icon: UserPlus },
  { label: "Create invoice", href: "/payments", icon: FileText },
  { label: "Public profile", href: "/settings", icon: User },
] as const;

export function QuickActionsCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-[#4F46E5] to-indigo-600 p-1 shadow-lg shadow-indigo-500/25">
      <div className="rounded-[14px] bg-gradient-to-br from-[#4F46E5] to-indigo-600 p-4">
        <h3 className="text-sm font-semibold text-white/95">Quick actions</h3>
        <ul className="mt-3 space-y-1.5">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <li key={a.href}>
                <Link
                  href={a.href}
                  className="flex items-center gap-2.5 rounded-lg bg-white/10 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
                >
                  <Icon className="size-4 opacity-90" />
                  {a.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
