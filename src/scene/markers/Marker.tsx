import { useMemo, useRef } from "react";
import { Html } from "@react-three/drei";
import { type ThreeEvent, useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  Vector3,
} from "three";
import type { LunarSite } from "@/data/schema";
import { cameraBus } from "@/engine/camera";
import { CATEGORY_META } from "@/lib/constants";
import { angularDistanceDeg, latLonToVector3, normalizeLon } from "@/lib/geo";
import { useAppStore } from "@/store/useAppStore";
import { surfaceNormal, surfaceRadius } from "../moon/heightSampler";

interface MarkerProps {
  site: LunarSite;
  heightReady: boolean;
}

const UP = new Vector3(0, 1, 0);
const _toCam = new Vector3();

export default function Marker({ site, heightReady }: MarkerProps) {
  const groupRef = useRef<Group>(null);
  const pulseRingRef = useRef<Mesh>(null);
  const reticleRef = useRef<Mesh>(null);
  const downPosRef = useRef<{ x: number; y: number } | null>(null);

  const selectedSiteId = useAppStore((s) => s.selectedSiteId);
  const hoveredSiteId = useAppStore((s) => s.hoveredSiteId);
  const categoryFilter = useAppStore((s) => s.categoryFilter);
  const heroOnly = useAppStore((s) => s.heroOnly);
  const reduceMotion = useAppStore((s) => s.settings.reduceMotion);

  const isSelected = selectedSiteId === site.id;
  const isHovered = hoveredSiteId === site.id;
  const isHero = site.tier === "hero";

  const matchesFilter = useMemo(() => {
    if (heroOnly && site.tier !== "hero") return false;
    if (categoryFilter === "all") return true;
    return site.categories.includes(categoryFilter);
  }, [categoryFilter, heroOnly, site.categories, site.tier]);

  const { position, quaternion, normal } = useMemo(() => {
    void heightReady;
    const r = surfaceRadius(site.lat, site.lon) + 0.0026;
    const pos = latLonToVector3(site.lat, site.lon, r);
    const nrm = surfaceNormal(site.lat, site.lon);
    const quat = new Quaternion().setFromUnitVectors(UP, nrm);
    return { position: pos, quaternion: quat, normal: nrm };
  }, [site.lat, site.lon, heightReady]);

  const colorHex = CATEGORY_META[site.primaryCategory].color;

  const coreMatRef = useRef<MeshBasicMaterial>(null);
  const stemMatRef = useRef<MeshBasicMaterial>(null);
  const ringMatRef = useRef<MeshBasicMaterial>(null);
  const reticleMatRef = useRef<MeshBasicMaterial>(null);

  const clickableRef = useRef(true);

  useFrame(({ camera, clock }) => {
    const g = groupRef.current;
    if (!g) return;

    const camDist = camera.position.distanceTo(position);

    // Hide close sub-markers until the user zooms near their parent landing site
    const tuckedBehindParent =
      Boolean(site.parentHeroId) && camDist > 0.42 && !isSelected && !isHovered;

    _toCam.copy(camera.position).sub(position).normalize();
    const horizonDot = normal.dot(_toCam);
    const horizonVis = Math.max(0, Math.min(1, (horizonDot + 0.02) / 0.11));

    const filterVis = matchesFilter ? 1 : 0.08;
    const finalVis = tuckedBehindParent ? 0 : horizonVis * filterVis;

    clickableRef.current = matchesFilter && !tuckedBehindParent && horizonDot > 0;
    g.visible = finalVis > 0.01;
    if (!g.visible) return;

    const baseAngular = Math.max(0.0018, Math.min(0.06, camDist * 0.017));
    const tierMult = isHero ? 1.32 : 0.78;
    const hoverMult = isSelected ? 1.35 : isHovered ? 1.2 : 1.0;
    g.scale.setScalar(baseAngular * tierMult * hoverMult);

    if (coreMatRef.current) coreMatRef.current.opacity = finalVis;
    if (stemMatRef.current) stemMatRef.current.opacity = finalVis;

    if (pulseRingRef.current && ringMatRef.current) {
      if (!reduceMotion && (isHero || isHovered || isSelected)) {
        const t = (clock.getElapsedTime() * 0.75 + (site.lat + 90) * 0.03) % 1;
        const s = 1 + t * (site.primaryCategory === "future" ? 2.1 : 1.45);
        pulseRingRef.current.scale.setScalar(s);
        ringMatRef.current.opacity = (1 - t) * 0.65 * finalVis;
      } else {
        pulseRingRef.current.scale.setScalar(1.25);
        ringMatRef.current.opacity = (isHero ? 0.38 : 0.2) * finalVis;
      }
    }

    if (reticleRef.current && reticleMatRef.current && isSelected) {
      if (!reduceMotion) {
        reticleRef.current.rotation.y = clock.getElapsedTime() * 1.2;
      }
      reticleMatRef.current.opacity = 0.9 * horizonVis;
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (!clickableRef.current) return;
    e.stopPropagation();
    document.body.style.cursor = "pointer";
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
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
      >
        <sphereGeometry args={[1.15, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Surface disc core */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, isHero ? 24 : 6]} />
        <meshBasicMaterial
          ref={coreMatRef}
          color={colorHex}
          transparent
          opacity={1}
          toneMapped={false}
        />
      </mesh>

      {/* Vertical beacon pin stem for hero sites */}
      {isHero && (
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
          <meshBasicMaterial
            ref={stemMatRef}
            color={colorHex}
            transparent
            opacity={1}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* Expanding pulse halo */}
      <mesh
        ref={pulseRingRef}
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.52, 0.72, 32]} />
        <meshBasicMaterial
          ref={ringMatRef}
          color={colorHex}
          transparent
          opacity={0.55}
          side={DoubleSide}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Active selection reticle */}
      {isSelected && (
        <mesh
          ref={reticleRef}
          position={[0, 0.04, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.88, 1.06, 6]} />
          <meshBasicMaterial
            ref={reticleMatRef}
            color="#5ce1ff"
            transparent
            opacity={0.9}
            side={DoubleSide}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* Mount max 2 DOM labels across the entire Moon (hovered + selected only) */}
      {(isHovered || isSelected) && matchesFilter && (
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
