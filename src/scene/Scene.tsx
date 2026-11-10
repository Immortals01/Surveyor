import CameraRig from "./CameraRig";
import Earth from "./Earth";
import SiteMarkers from "./markers/SiteMarkers";
import MoonGlobe from "./moon/MoonGlobe";
import Starfield from "./Starfield";
import Sun from "./Sun";

export default function Scene() {
  return (
    <>
      <Sun />
      <Starfield />
      <Earth />
      <MoonGlobe />
      <SiteMarkers />
      <CameraRig />
    </>
  );
}
