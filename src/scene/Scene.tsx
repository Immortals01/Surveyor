import { useAppStore } from "@/store/useAppStore";
import CameraRig from "./CameraRig";
import Earth from "./Earth";
import BackgroundMoon from "./earth/BackgroundMoon";
import EarthGlobe from "./earth/EarthGlobe";
import IssOrbit from "./earth/IssOrbit";
import SiteMarkers from "./markers/SiteMarkers";
import MoonGlobe from "./moon/MoonGlobe";
import Starfield from "./Starfield";
import Sun from "./Sun";

export default function Scene() {
  const activeBody = useAppStore((s) => s.activeBody);

  return (
    <>
      <Sun />
      <Starfield />
      {activeBody === "moon" ? (
        <>
          <Earth />
          <MoonGlobe />
        </>
      ) : (
        <>
          <BackgroundMoon />
          <EarthGlobe />
          <IssOrbit />
        </>
      )}
      <SiteMarkers />
      <CameraRig />
    </>
  );
}
