import { useAppStore } from "@/store/useAppStore";
import CameraRig from "./CameraRig";
import Earth from "./Earth";
import LunarHorizonGlow from "./LunarHorizonGlow";
import MachineCastMarkers from "./markers/MachineCastMarkers";
import SiteMarkers from "./markers/SiteMarkers";
import MoonGlobe from "./moon/MoonGlobe";
import Starfield from "./Starfield";
import Sun from "./Sun";

export default function Scene() {
  const celestialBody = useAppStore((s) => s.celestialBody);

  return (
    <>
      <Sun />
      <Starfield />
      {celestialBody === "moon" && <Earth />}
      <MoonGlobe />
      <LunarHorizonGlow />
      <SiteMarkers />
      <MachineCastMarkers />
      <CameraRig />
    </>
  );
}
