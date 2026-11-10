import { lazy, Suspense } from "react";
import { useAppStore } from "@/store/useAppStore";
import CameraRig from "./CameraRig";
import Earth from "./Earth";
import LunarHorizonGlow from "./LunarHorizonGlow";
import SiteMarkers from "./markers/SiteMarkers";
import MoonGlobe from "./moon/MoonGlobe";
import Starfield from "./Starfield";
import Sun from "./Sun";

const BackgroundMoon = lazy(() => import("./earth/BackgroundMoon"));
const EarthGlobe = lazy(() => import("./earth/EarthGlobe"));
const IssOrbit = lazy(() => import("./earth/IssOrbit"));

export default function Scene() {
  const celestialBody = useAppStore((s) => s.celestialBody);

  return (
    <>
      <Sun />
      <Starfield />
      {celestialBody === "earth" ? (
        <Suspense fallback={null}>
          <BackgroundMoon />
          <EarthGlobe />
          <IssOrbit />
        </Suspense>
      ) : (
        <>
          {celestialBody === "moon" && <Earth />}
          <MoonGlobe />
          <LunarHorizonGlow />
        </>
      )}
      <SiteMarkers />
      <CameraRig />
    </>
  );
}
