import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import type { SiteVideo } from "@/data/schema";
import { useAppStore } from "@/store/useAppStore";

interface SiteVideoEmbedProps {
  video: SiteVideo;
}

/**
 * NASA film attached to a site's cited source page.
 * The YouTube player is only mounted after a click so opening a dossier never
 * pulls a third-party iframe (or its ~1 MB of player JS) unprompted.
 */
export default function SiteVideoEmbed({ video }: SiteVideoEmbedProps) {
  const [playing, setPlaying] = useState(false);
  const openSources = useAppStore((s) => s.openSources);

  const watchUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`;
  const posterUrl = `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;

  return (
    <figure className="border border-white/15 bg-space-950 p-1.5">
      <div className="relative aspect-video w-full overflow-hidden border border-white/10 bg-space-900">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 flex cursor-pointer items-center justify-center bg-space-900 focus-visible:ring-2 focus-visible:ring-loro focus-visible:outline-none"
            aria-label={`Play film: ${video.title}`}
          >
            <img
              src={posterUrl}
              alt=""
              loading="lazy"
              decoding="async"
              onError={(event) => {
                event.currentTarget.style.visibility = "hidden";
              }}
              className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity group-hover:opacity-90"
            />
            <span className="relative flex h-11 w-11 items-center justify-center rounded-full border border-sunlit/70 bg-space-950/85 text-sunlit backdrop-blur-md transition group-hover:scale-105 group-hover:border-sunlit group-hover:text-white">
              <Play className="ml-0.5 h-5 w-5 fill-current" />
            </span>
            <span className="pointer-events-none absolute bottom-2 left-2 border border-sunlit/50 bg-space-950/90 px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.14em] text-sunlit uppercase backdrop-blur-md">
              NASA FILM
            </span>
          </button>
        )}
      </div>

      <figcaption className="space-y-1 px-1 pt-2 pb-0.5">
        <p className="font-display text-[12.5px] leading-snug font-bold tracking-tight text-regolith-bright">
          {video.title}
        </p>
        {video.description && (
          <p className="text-[11.5px] leading-relaxed text-regolith/65">
            {video.description}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="font-mono text-[9px] tracking-[0.14em] text-regolith/45 uppercase">
            {video.credit}
          </span>
          <span className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => openSources(video.sourceId)}
              className="inline-flex cursor-pointer items-center gap-1 border border-white/15 bg-white/[0.03] px-2 py-0.5 font-mono text-[9px] tracking-wider text-loro transition hover:border-loro hover:bg-loro/15 hover:text-white"
              title={`Verify against NASA source ${video.sourceId}`}
            >
              {video.sourceId}
            </button>
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 border border-white/15 bg-white/[0.03] px-2 py-0.5 font-mono text-[9px] tracking-wider text-regolith/70 transition hover:border-regolith-bright hover:text-white"
            >
              YOUTUBE
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </span>
        </div>
      </figcaption>
    </figure>
  );
}
