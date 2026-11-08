import { Sun } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function SunControl() {
  const sunLongitude = useAppStore((s) => s.sunLongitude);
  const setSunDirection = useAppStore((s) => s.setSunDirection);

  return (
    <div className="pointer-events-auto hidden items-center gap-2.5 rounded-full border border-white/15 bg-space-950/82 px-3.5 py-1.5 shadow-lg backdrop-blur-xl md:flex">
      <Sun className="h-3.5 w-3.5 text-sunlit" />
      <label
        htmlFor="lunar-sun-slider"
        className="font-mono text-[11px] text-regolith/85"
      >
        Lunar Day
      </label>
      <input
        id="lunar-sun-slider"
        type="range"
        min={-180}
        max={180}
        step={2}
        value={Math.round(sunLongitude)}
        onChange={(e) => setSunDirection(Number(e.target.value))}
        className="h-1.5 w-24 cursor-pointer accent-sunlit"
        aria-label="Adjust solar illumination longitude across the Moon"
      />
    </div>
  );
}
