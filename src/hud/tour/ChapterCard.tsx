import { getTourChaptersForBody } from "@/data";
import { useAppStore } from "@/store/useAppStore";

export default function ChapterCard() {
  const activeBody = useAppStore((s) => s.activeBody);
  const mode = useAppStore((s) => s.mode);
  const chapterIndex = useAppStore((s) => s.tourChapterIndex);
  const visible = useAppStore((s) => s.chapterBannerVisible);
  const chapters = getTourChaptersForBody(activeBody);
  const chapter = chapters[chapterIndex];

  if (mode !== "tour" || !visible || !chapter) return null;

  return (
    <div
      key={chapter.id}
      className="animate-hud-fade-down pointer-events-none mx-auto mt-2 max-w-md border border-white/20 bg-space-950/90 px-5 py-3 text-center shadow-2xl backdrop-blur-xl"
    >
      <p className="font-mono text-[10.5px] font-semibold tracking-[0.18em] text-loro uppercase">
        EXPEDITION CHAPTER 0{chapter.number} OF 05
      </p>
      <h2 className="mt-0.5 font-display text-lg font-bold text-regolith-bright">
        {chapter.title}
      </h2>
      <p className="mt-0.5 text-xs text-regolith/80">{chapter.subtitle}</p>
    </div>
  );
}
