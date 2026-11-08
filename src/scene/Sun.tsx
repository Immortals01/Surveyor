import { useMemo } from "react";
import { latLonToVector3 } from "@/lib/geo";
import { useAppStore } from "@/store/useAppStore";

export default function Sun() {
  const sunLongitude = useAppStore((s) => s.sunLongitude);
  const sunLatitude = useAppStore((s) => s.sunLatitude);

  const sunPos = useMemo(() => {
    const v = latLonToVector3(sunLatitude, sunLongitude, 24);
    return [v.x, v.y, v.z] as [number, number, number];
  }, [sunLatitude, sunLongitude]);

  return (
    <>
      {/* Primary harsh solar illumination (lunar space has zero atmospheric scattering) */}
      <directionalLight
        position={sunPos}
        intensity={3.1}
        color="#fff8ee"
      />

      {/* Subtle blue-silver Earthshine reflected onto the lunar nearside (+X) */}
      <directionalLight
        position={[12, 1.5, 0]}
        intensity={0.075}
        color="#8bb8ff"
      />

      {/* Minimal space fill so permanently shadowed craters stay readable */}
      <ambientLight intensity={0.022} color="#cbd5e1" />
    </>
  );
}
