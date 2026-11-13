import type { StatItem } from "@/data/schema";
import { useAppStore } from "@/store/useAppStore";

interface StatsGridProps {
  stats: StatItem[];
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const openSources = useAppStore((s) => s.openSources);

  return (
    <div className="border-t border-l border-white/15 bg-space-950/90">
      <div className="grid grid-cols-2">
        {stats.map((item, idx) => (
          <div
            key={item.label}
            className="group relative flex flex-col justify-between border-r border-b border-white/15 p-3.5 transition-colors hover:bg-white/[0.03]"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-[10px] tracking-[0.14em] text-regolith/60 uppercase">
                <span className="text-regolith/35">
                  {String(idx + 1).padStart(2, "0")}{" "}
                </span>
                {item.label}
              </span>
              {item.sourceIds[0] && (
                <button
                  type="button"
                  onClick={() => openSources(item.sourceIds[0])}
                  className="shrink-0 cursor-pointer border border-white/15 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-loro/85 uppercase transition hover:border-loro hover:bg-loro/15 hover:text-white"
                  title={`Verify against NASA source ${item.sourceIds[0]}`}
                >
                  REF
                </button>
              )}
            </div>
            <p className="mt-2 font-display text-[15px] leading-snug font-bold tracking-tight text-regolith-bright">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
