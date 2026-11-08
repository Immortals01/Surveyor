import { ALL_SITES } from "@/data";
import { useAppStore } from "@/store/useAppStore";
import Marker from "./Marker";

export default function SiteMarkers() {
  const heightReady = useAppStore((s) => s.heightReady);

  return (
    <group name="lunar-site-markers">
      {ALL_SITES.map((site) => (
        <Marker key={site.id} site={site} heightReady={heightReady} />
      ))}
    </group>
  );
}
