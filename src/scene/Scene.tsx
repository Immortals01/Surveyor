import CameraRig from "./CameraRig";
import LroOrbit from "./LroOrbit";
import SiteMarkers from "./markers/SiteMarkers";
import MoonGlobe from "./moon/MoonGlobe";
import Starfield from "./Starfield";
import Sun from "./Sun";

export default function Scene() {
  return (
    <>
      <Sun />
      <Starfield />
      <MoonGlobe />
      <SiteMarkers />
      <LroOrbit />
      <CameraRig />
    </>
  );
}
