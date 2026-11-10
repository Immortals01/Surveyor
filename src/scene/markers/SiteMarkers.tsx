import { getSitesForBody } from "@/data";
import { useAppStore } from "@/store/useAppStore";
import Marker from "./Marker";

export default function SiteMarkers() {
  const heightReady = useAppStore((s) => s.heightReady);
  const body = useAppStore((s) => s.celestialBody);
  const sites = getSitesForBody(body);

  return (
    <group name="planetary-site-markers">
      {sites.map((site) => (
        <Marker key={site.id} site={site} heightReady={heightReady} />
      ))}
    </group>
  );
}
