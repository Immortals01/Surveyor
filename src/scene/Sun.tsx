import { useMemo } from "react";
import { latLonToVector3, normalizeLon } from "@/lib/geo";
import { useAppStore } from "@/store/useAppStore";

export default function Sun() {
  const sunLongitude = useAppStore((s) => s.sunLongitude);
  const sunLatitude = useAppStore((s) => s.sunLatitude);

  const { sunPos, backPos, eastFillPos, westFillPos } = useMemo(() => {
    const primary = latLonToVector3(sunLatitude, sunLongitude, 24);
    const back = latLonToVector3(
      -sunLatitude + 8,
      normalizeLon(sunLongitude + 180),
      24,
    );
    const east = latLonToVector3(0, normalizeLon(sunLongitude + 90), 24);
    const west = latLonToVector3(0, normalizeLon(sunLongitude - 90), 24);
    return {
      sunPos: [primary.x, primary.y, primary.z] as [number, number, number],
      backPos: [back.x, back.y, back.z] as [number, number, number],
      eastFillPos: [east.x, east.y, east.z] as [number, number, number],
      westFillPos: [west.x, west.y, west.z] as [number, number, number],
    };
  }, [sunLatitude, sunLongitude]);

  return (
    <>
      {/* Primary solar illumination */}
      <directionalLight
        position={sunPos}
        intensity={2.6}
        color="#fff8ee"
      />

      {/* Back-side lunar illumination so the far/night hemisphere is never dark */}
      <directionalLight
        position={backPos}
        intensity={1.75}
        color="#e8eef8"
      />

      {/* Quadrature limb fill lights so the terminator transitions smoothly with full relief */}
      <directionalLight
        position={eastFillPos}
        intensity={0.85}
        color="#dce6f5"
      />
      <directionalLight
        position={westFillPos}
        intensity={0.85}
        color="#dce6f5"
      />

      {/* Global ambient & hemisphere fill so every crater and farside basin stays clear */}
      <hemisphereLight
        args={["#f1f5f9", "#94a3b8", 0.55]}
      />
      <ambientLight intensity={0.45} color="#cbd5e1" />
    </>
  );
}
