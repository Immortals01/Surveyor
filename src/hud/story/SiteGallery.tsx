import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { getSiteGallery } from "@/data/siteGalleries";
import type { LunarSite } from "@/data/schema";

export default function SiteGallery({ site }: { site: LunarSite }) {
  const items = getSiteGallery(site);
  const [index, setIndex] = useState(0);
  const item = items[index];
  if (!item) return null;

  const step = (direction: number) => {
    audioEngine.playUiTick(1100);
    setIndex((current) => (current + direction + items.length) % items.length);
  };

  return (
    <figure className="border border-white/15 bg-space-950 p-1.5">
      <div className="relative aspect-[16/10] w-full overflow-hidden border border-white/10 bg-space-900">
        {item.kind === "video" ? (
          <video
            key={item.src}
            src={item.src}
            poster={item.poster}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full bg-black object-contain"
          >
            Your browser cannot play this NASA video.
          </video>
        ) : (
          <img
            key={item.src}
            src={item.src}
            alt={item.caption}
            decoding="async"
            loading={index === 0 ? "eager" : "lazy"}
            className="h-full w-full object-cover"
          />
        )}

        <span className="pointer-events-none absolute top-2 left-2 border border-sunlit/50 bg-space-950/90 px-2 py-0.5 font-mono text-[9.5px] font-bold tracking-[0.14em] text-sunlit uppercase backdrop-blur-md">
          {site.year}
        </span>

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              className="absolute top-1/2 left-2 -translate-y-1/2 cursor-pointer border border-white/20 bg-space-950/85 p-1.5 text-regolith-bright backdrop-blur-sm transition hover:border-loro hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
              aria-label="Previous image"
              title="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer border border-white/20 bg-space-950/85 p-1.5 text-regolith-bright backdrop-blur-sm transition hover:border-loro hover:text-white focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
              aria-label="Next image"
              title="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="pointer-events-none absolute top-2 right-2 border border-white/15 bg-space-950/85 px-1.5 py-0.5 font-mono text-[9px] text-regolith/80 backdrop-blur-sm">
              {index + 1} / {items.length}
            </span>
          </>
        )}
      </div>

      <figcaption className="border-t border-white/10 px-1 pt-1.5 pb-0.5">
        <span className="line-clamp-2 block text-[11.5px] leading-snug text-regolith-bright/90">
          {item.caption}
        </span>
        {item.credit ? (
          <span className="mt-0.5 block font-mono text-[8px] tracking-[0.08em] text-regolith/45 uppercase">
            {item.credit}
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}
