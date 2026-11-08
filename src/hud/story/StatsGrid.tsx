import type { StatItem } from "@/data/schema";
import { useAppStore } from "@/store/useAppStore";

interface StatsGridProps {
  stats: StatItem[];
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const openSources = useAppStore((s) => s.openSources);

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {stats.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-white/10 bg-space-900/75 p-3"
        >
          <div className="flex items-start justify-between gap-1">
            <span className="font-mono text-[10.5px] tracking-wide text-regolith/65 uppercase">
              {item.label}
            </span>
            {item.sourceIds[0] && (
              <button
                type="button"
                onClick={() => openSources(item.sourceIds[0])}
                className="cursor-pointer rounded bg-loro/10 px-1 font-mono text-[9.5px] text-loro hover:bg-loro/25"
                title={`View NASA citation ${item.sourceIds[0]}`}
              >
                src
              </button>
            )}
          </div>
          <p className="mt-1 font-display text-sm font-bold text-regolith-bright">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
