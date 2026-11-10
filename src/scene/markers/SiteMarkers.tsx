import { getSitesForBody } from "@/data";
import { useAppStore } from "@/store/useAppStore";
import Marker from "./Marker";

export default function SiteMarkers() {
  const activeBody = useAppStore((s) => s.activeBody);
  const heightReady = useAppStore((s) => s.heightReady);
  const sites = getSitesForBody(activeBody);

  return (
    <group name={`${activeBody}-site-markers`}>
      {sites.map((site) => (
        <Marker key={site.id} site={site} heightReady={heightReady} />
      ))}
    </group>
  );
}
