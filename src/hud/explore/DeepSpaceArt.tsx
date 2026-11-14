const ART: Record<string, string> = {
  dawn: "/images/deep-space/dawn-3d.webp",
  "near-shoemaker": "/images/deep-space/near-3d.webp",
  pioneer: "/images/deep-space/pioneer-3d.webp",
  kepler: "/images/deep-space/kepler-3d.webp",
};

/** Pre-rendered NASA 3D Resources models, lit and composited offline. */
export default function DeepSpaceArt({ id }: { id: string }) {
  const src = ART[id] ?? ART.dawn;
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`h-full w-full object-contain select-none ${
        id === "pioneer" ? "scale-110" : ""
      }`}
    />
  );
}
