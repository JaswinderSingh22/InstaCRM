import {
  BarChart3,
  Briefcase,
  LayoutDashboard,
  LineChart,
  Sparkles,
  Users,
} from "lucide-react";

/** Static series for the hero SVG (normalized 0–100). */
const SERIES = [32, 48, 42, 58, 52, 68, 61, 74, 69, 78, 72, 82];
const LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function HeroAnalyticsChart() {
  const w = 520;
  const h = 200;
  const padL = 8;
  const padR = 8;
  const padT = 16;
  const padB = 36;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const n = SERIES.length;
  const step = innerW / (n - 1);

  const yFor = (v: number) => padT + innerH - (v / 100) * innerH;

  const linePath = SERIES.map((v, i) => {
    const x = padL + i * step;
    const y = yFor(v);
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");

  const areaPath = `${linePath} L ${padL + (n - 1) * step} ${padT + innerH} L ${padL} ${padT + innerH} Z`;

  const barW = Math.max(6, step * 0.38);
  const barMaxH = innerH * 0.35;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-full w-full max-h-50 min-h-35 text-teal-600 sm:max-h-55"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <defs>
        <linearGradient id="heroAreaTeal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0.02} />
        </linearGradient>
        <linearGradient id="heroBarTeal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5eead4" stopOpacity={0.95} />
          <stop offset="100%" stopColor="#0d9488" stopOpacity={0.85} />
        </linearGradient>
      </defs>

      <path d={areaPath} fill="url(#heroAreaTeal)" />
      <path
        d={linePath}
        fill="none"
        stroke="#0f766e"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {SERIES.map((v, i) => {
        const cx = padL + i * step;
        const barH = (v / 100) * barMaxH;
        const x = cx - barW / 2;
        const y = padT + innerH - barH;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={barH}
            rx={3}
            fill="url(#heroBarTeal)"
            opacity={0.9}
          />
        );
      })}

      {LABELS.map((label, i) => {
        if (i % 2 === 1) return null;
        const x = padL + i * step;
        return (
          <text
            key={label}
            x={x}
            y={h - 10}
            textAnchor="middle"
            fill="#a3a3a3"
            style={{ fontSize: 9, fontWeight: 500 }}
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

export function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-5xl px-1 sm:px-0">
      <div
        className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-2xl shadow-indigo-500/10 ring-1 ring-black/5"
        style={{ aspectRatio: "16/10" }}
      >
        <div className="flex h-full min-h-65 text-[11px] sm:min-h-75 sm:text-xs">
          {/* Sidebar — dark teal like reference */}
          <aside className="flex w-13 shrink-0 flex-col border-r border-teal-950/20 bg-[#0f766e] py-3 sm:w-37 sm:px-2.5 sm:py-4">
            <div className="flex items-center justify-center gap-1.5 px-1 sm:justify-start sm:px-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
                <Sparkles className="size-4" strokeWidth={2} />
              </div>
              <span className="hidden font-semibold tracking-tight text-white sm:inline">InstaCRM</span>
            </div>
            <nav className="mt-5 flex flex-col gap-1 sm:mt-6">
              <div className="flex items-center justify-center gap-2 rounded-lg bg-white/15 py-2 text-white sm:justify-start sm:px-2.5">
                <LayoutDashboard className="size-4 shrink-0 opacity-95" />
                <span className="hidden font-medium sm:inline">Overview</span>
              </div>
              <div className="flex items-center justify-center gap-2 py-2 text-teal-100/70 sm:justify-start sm:px-2.5">
                <Users className="size-4 shrink-0" />
                <span className="hidden sm:inline">Leads</span>
              </div>
              <div className="flex items-center justify-center gap-2 py-2 text-teal-100/70 sm:justify-start sm:px-2.5">
                <Briefcase className="size-4 shrink-0" />
                <span className="hidden sm:inline">Deals</span>
              </div>
              <div className="flex items-center justify-center gap-2 py-2 text-teal-100/70 sm:justify-start sm:px-2.5">
                <BarChart3 className="size-4 shrink-0" />
                <span className="hidden sm:inline">Analytics</span>
              </div>
            </nav>
          </aside>

          {/* Main workspace */}
          <div className="relative flex min-w-0 flex-1 flex-col bg-[#f8fafb]">
            <div className="min-h-0 flex-1 p-2.5 sm:p-4">
              <div className="relative mb-2 flex flex-col gap-3 sm:mb-3 sm:min-h-[5.5rem] sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 max-w-[min(100%,20rem)] pt-0.5 pr-0 sm:pr-44">
                  <h2 className="text-sm font-bold tracking-tight text-neutral-900 sm:text-base">
                    Revenue &amp; pipeline
                  </h2>
                  <p className="mt-0.5 text-[10px] text-neutral-500 sm:text-xs">
                    Paid volume and active deal flow
                  </p>
                </div>

                {/* Floating revenue card — reference */}
                <div className="relative shrink-0 rounded-xl border border-neutral-200/90 bg-white p-3 shadow-lg shadow-neutral-900/5 sm:absolute sm:right-0 sm:top-0 sm:z-10 sm:w-[200px] sm:p-3.5">
                  <div className="absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-lg bg-[#4F46E5]/10 text-[#4F46E5]">
                    <LineChart className="size-3.5" strokeWidth={2.2} />
                  </div>
                  <p className="pr-9 text-[9px] font-semibold uppercase tracking-wider text-neutral-500 sm:text-[10px]">
                    Recent revenue
                  </p>
                  <p className="mt-1 font-serif text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
                    $12,450.00
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold text-emerald-600 sm:text-xs">
                    +14% from last month
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200/80 bg-white p-2 shadow-sm sm:p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 sm:text-xs">
                    Performance
                  </span>
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:text-xs">
                    +12.4%
                  </span>
                </div>
                <HeroAnalyticsChart />
              </div>

              {/* Status pills — reference footer */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 sm:mt-3 sm:gap-2">
                {(
                  [
                    { label: "Creators", active: true },
                    { label: "Brand deals", active: false },
                    { label: "Invoices", active: false },
                  ] as const
                ).map(({ label, active }) => (
                  <span
                    key={label}
                    className={
                      active
                        ? "rounded-full bg-[#4F46E5] px-2.5 py-1 text-[9px] font-semibold text-white shadow-sm sm:px-3 sm:text-[10px]"
                        : "rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[9px] font-medium text-neutral-600 sm:px-3 sm:text-[10px]"
                    }
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
