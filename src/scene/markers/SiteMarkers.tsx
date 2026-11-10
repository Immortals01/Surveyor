import { useEffect } from "react";
import { getSitesForBody } from "@/data";
import { preloadBodySiteImages } from "@/lib/siteImagePreloader";
import { useAppStore } from "@/store/useAppStore";
import Marker from "./Marker";

export default function SiteMarkers() {
  const celestialBody = useAppStore((s) => s.celestialBody);
  const heightReady = useAppStore((s) => s.heightReady);
  const sites = getSitesForBody(celestialBody);

  useEffect(() => {
    preloadBodySiteImages(celestialBody);
  }, [celestialBody]);

  return (
    <group name={`${celestialBody}-site-markers`}>
      {sites.map((site) => (
        <Marker key={site.id} site={site} heightReady={heightReady} />
      ))}
    </group>
  );
}
