import type { ReactNode } from "react";

export default function OnboardingGroupLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-[#F4F5FA] text-neutral-900 antialiased">{children}</div>;
}
