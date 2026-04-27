// const links = [
//   { href: "#", label: "Privacy" },
//   { href: "#", label: "Terms" },
//   { href: "#", label: "API" },
// ] as const;

export function DashboardFooterBar() {
  return (
    <div className="relative mt-10 border-t border-neutral-200/80 bg-white/50 py-4">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-1 sm:flex-row">
        <p className="text-sm font-semibold text-neutral-800">
          InstaCRM{" "}
          <span className="font-normal text-neutral-500">
            © {new Date().getFullYear()} InstaCRM. Built for Creators.
          </span>
        </p>
        {/* <nav className="flex items-center gap-6 text-xs text-neutral-500">
          {links.map((l) => (
            <Link key={l.label} href={l.href} className="hover:text-[#4F46E5]">
              {l.label}
            </Link>
          ))}
        </nav> */}
      </div>
      {/* Floating add lead FAB removed on dashboard — use Creators nav to add leads. */}
    </div>
  );
}
