import { useMemo, useRef } from "react";
import { Html } from "@react-three/drei";
import { type ThreeEvent, useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  RingGeometry,
  SphereGeometry,
  Vector3,
} from "three";
import type { LunarSite } from "@/data/schema";
import { cameraBus } from "@/engine/camera";
import { CATEGORY_META } from "@/lib/constants";
import { preloadSiteImage } from "@/lib/siteImagePreloader";
import { angularDistanceDeg, latLonToVector3, normalizeLon } from "@/lib/geo";
import { useAppStore } from "@/store/useAppStore";
import { surfaceNormal, surfaceRadius } from "../moon/heightSampler";

interface MarkerProps {
  site: LunarSite;
  heightReady: boolean;
}

const UP = new Vector3(0, 1, 0);
const _toCam = new Vector3();
const NOOP_RAYCAST = () => {};

// Shared singleton geometries & hit-sphere material reused across all 29 markers
const HIT_SPHERE_GEO = new SphereGeometry(1.15, 10, 10);
const HIT_SPHERE_MAT = new MeshBasicMaterial({
  colorWrite: false,
  depthWrite: false,
});
// Marker glyphs: plain round beacons. Tier is conveyed by size and ring
// brightness rather than by an angular outline.
/**
 * Soft-edged beacon painted once into a canvas and shared by every marker, so
 * the dot has no hard silhouette or polygonal rim at small screen sizes.
 */
function createGlowTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const r = size / 2;
  const grad = ctx.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.95)");
  grad.addColorStop(0.6, "rgba(255,255,255,0.4)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new CanvasTexture(canvas);
  return tex;
}

const GLOW_TEX = createGlowTexture();
const HERO_CORE_GEO = new PlaneGeometry(1.3, 1.3);
const SECONDARY_CORE_GEO = new PlaneGeometry(1.02, 1.02);
const STEM_GEO = new CylinderGeometry(0.04, 0.04, 0.7, 8);
const PULSE_RING_GEO = new RingGeometry(0.62, 0.76, 48);
const RETICLE_GEO = new RingGeometry(0.92, 1.06, 48);

export default function Marker({ site, heightReady }: MarkerProps) {
  const groupRef = useRef<Group>(null);
  const pulseRingRef = useRef<Mesh>(null);
  const reticleRef = useRef<Mesh>(null);
  const downPosRef = useRef<{ x: number; y: number } | null>(null);

  // Granular boolean selectors so only the affected 1-2 markers re-render on hover/select
  const isSelected = useAppStore((s) => s.selectedSiteId === site.id);
  const isHovered = useAppStore((s) => s.hoveredSiteId === site.id);
  // The site drawer already titles the selected site, so suppress its floating marker label
  const isDrawerOpen = useAppStore((s) => s.selectedSiteId != null);
  const celestialBody = useAppStore((s) => s.celestialBody);
  const categoryFilter = useAppStore((s) => s.categoryFilter);
  const heroOnly = useAppStore((s) => s.heroOnly);

  const isHero = site.tier === "hero";

  const matchesFilter = useMemo(() => {
    if (heroOnly && site.tier !== "hero") return false;
    if (categoryFilter === "all") return true;
    return site.categories.includes(categoryFilter);
  }, [categoryFilter, heroOnly, site.categories, site.tier]);

  const { position, quaternion, normal } = useMemo(() => {
    void heightReady;
    const r = surfaceRadius(site.lat, site.lon, celestialBody) + 0.0026;
    const pos = latLonToVector3(site.lat, site.lon, r);
    const nrm = surfaceNormal(site.lat, site.lon, undefined, celestialBody);
    const quat = new Quaternion().setFromUnitVectors(UP, nrm);
    return { position: pos, quaternion: quat, normal: nrm };
  }, [celestialBody, site.lat, site.lon, heightReady]);

  const colorHex = CATEGORY_META[site.primaryCategory].color;

  const coreMatRef = useRef<MeshBasicMaterial>(null);
  const stemMatRef = useRef<MeshBasicMaterial>(null);
  const ringMatRef = useRef<MeshBasicMaterial>(null);
  const reticleMatRef = useRef<MeshBasicMaterial>(null);

  const clickableRef = useRef(true);
  const lastCamPosRef = useRef(new Vector3(Infinity, Infinity, Infinity));
  const lastStateKeyRef = useRef("");

  useFrame(({ camera }) => {
    const g = groupRef.current;
    if (!g) return;

    const stateKey = `${isSelected ? 1 : 0}_${isHovered ? 1 : 0}_${matchesFilter ? 1 : 0}_${position.x.toFixed(4)}`;
    if (
      lastStateKeyRef.current === stateKey &&
      lastCamPosRef.current.distanceToSquared(camera.position) < 1e-8
    ) {
      return;
    }
    lastStateKeyRef.current = stateKey;
    lastCamPosRef.current.copy(camera.position);

    const camDist = camera.position.distanceTo(position);

    // Hide close sub-markers until the user zooms near their parent landing site
    const tuckedBehindParent =
      Boolean(site.parentHeroId) && camDist > 0.58 && !isSelected && !isHovered;

    _toCam.copy(camera.position).sub(position).normalize();
    const horizonDot = normal.dot(_toCam);
    const horizonVis = Math.max(0, Math.min(1, (horizonDot + 0.02) / 0.11));

    const filterVis = matchesFilter ? 1 : 0.08;
    const finalVis = tuckedBehindParent ? 0 : horizonVis * filterVis;

    clickableRef.current = matchesFilter && !tuckedBehindParent && horizonDot > 0;
    g.visible = finalVis > 0.01;
    if (!g.visible) return;

    const baseAngular = Math.max(0.0016, Math.min(0.048, camDist * 0.0145));
    const tierMult = isHero ? 1.18 : 0.76;
    const hoverMult = isSelected ? 1.25 : isHovered ? 1.14 : 1.0;
    g.scale.setScalar(baseAngular * tierMult * hoverMult);

    if (coreMatRef.current) coreMatRef.current.opacity = finalVis * 0.92;
    if (stemMatRef.current) stemMatRef.current.opacity = finalVis * 0.75;

    if (pulseRingRef.current && ringMatRef.current) {
      pulseRingRef.current.scale.setScalar(isSelected || isHovered ? 1.15 : 1.0);
      const ringOpacity = isSelected
        ? 0.5
        : isHovered
          ? 0.42
          : isHero
            ? 0.24
            : 0.14;
      ringMatRef.current.opacity = ringOpacity * finalVis;
    }

    if (reticleRef.current && reticleMatRef.current && isSelected) {
      reticleMatRef.current.opacity = 0.75 * horizonVis;
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (!clickableRef.current) return;
    e.stopPropagation();
    document.body.style.cursor = "pointer";
    preloadSiteImage(site);
    useAppStore.getState().setHoveredSite(site.id);
  };

  const handlePointerOut = () => {
    document.body.style.cursor = "auto";
    if (useAppStore.getState().hoveredSiteId === site.id) {
      useAppStore.getState().setHoveredSite(null);
    }
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!clickableRef.current) return;
    preloadSiteImage(site);
    downPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!clickableRef.current) return;
    e.stopPropagation();

    if (downPosRef.current) {
      const dx = e.clientX - downPosRef.current.x;
      const dy = e.clientY - downPosRef.current.y;
      if (Math.hypot(dx, dy) > 6) return;
    }

    (document.activeElement as HTMLElement | null)?.blur?.();

    const store = useAppStore.getState();
    if (store.mode === "intro") {
      store.enterExplore(true);
    } else if (store.mode === "tour") {
      store.setTourPaused(true);
    }
    if (
      angularDistanceDeg(
        site.lat,
        site.lon,
        store.sunLatitude,
        store.sunLongitude,
      ) > 75
    ) {
      store.setSunDirection(normalizeLon(site.lon - 18), 1.5);
    }
    store.selectSite(site.id);
    void cameraBus.flyToLatLon(site.lat, site.lon);
  };

  return (
    <group ref={groupRef} position={position} quaternion={quaternion}>
      {/* Generous invisible hit sphere for effortless mouse/touch picking */}
      <mesh
        geometry={HIT_SPHERE_GEO}
        material={HIT_SPHERE_MAT}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
      />

      {/* Surface glow core */}
      <mesh
        geometry={isHero ? HERO_CORE_GEO : SECONDARY_CORE_GEO}
        rotation={[-Math.PI / 2, 0, 0]}
        raycast={NOOP_RAYCAST}
      >
        <meshBasicMaterial
          ref={coreMatRef}
          map={GLOW_TEX}
          color={colorHex}
          transparent
          opacity={1}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Vertical beacon pin stem for hero sites */}
      {isHero && (
        <mesh
          geometry={STEM_GEO}
          position={[0, 0.35, 0]}
          raycast={NOOP_RAYCAST}
        >
          <meshBasicMaterial
            ref={stemMatRef}
            color={colorHex}
            transparent
            opacity={1}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* Subtle static perimeter ring */}
      <mesh
        ref={pulseRingRef}
        geometry={PULSE_RING_GEO}
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        raycast={NOOP_RAYCAST}
      >
        <meshBasicMaterial
          ref={ringMatRef}
          color={colorHex}
          transparent
          opacity={0.24}
          side={DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Active selection reticle */}
      {isSelected && (
        <mesh
          ref={reticleRef}
          geometry={RETICLE_GEO}
          position={[0, 0.04, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          raycast={NOOP_RAYCAST}
        >
          <meshBasicMaterial
            ref={reticleMatRef}
            color="#5ce1ff"
            transparent
            opacity={0.75}
            side={DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* Mount max 2 DOM labels across the entire Moon (hovered + selected only) */}
      {(isHovered || isSelected) &&
        matchesFilter &&
        !(isSelected && isDrawerOpen) && (
        <Html
          position={[0, isHero ? 1.05 : 0.75, 0]}
          center
          style={{ pointerEvents: "none" }}
          zIndexRange={[15, 0]}
        >
          <div className="whitespace-nowrap rounded-full border border-loro/45 bg-space-950/90 px-2.5 py-1 text-xs font-medium text-regolith-bright shadow-lg backdrop-blur-md">
            <span
              className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
              style={{ backgroundColor: colorHex }}
            />
            <span>{site.name}</span>
            <span className="ml-1.5 font-mono text-[10px] text-regolith/75">
              {site.year}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}
