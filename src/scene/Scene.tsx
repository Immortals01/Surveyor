import { useAppStore } from "@/store/useAppStore";
import CameraRig from "./CameraRig";
import Earth from "./Earth";
import LunarHorizonGlow from "./LunarHorizonGlow";
import BackgroundMoon from "./earth/BackgroundMoon";
import EarthGlobe from "./earth/EarthGlobe";
import IssOrbit from "./earth/IssOrbit";
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
      {celestialBody === "earth" ? (
        <>
          <BackgroundMoon />
          <EarthGlobe />
          <IssOrbit />
        </>
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
