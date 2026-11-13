import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BufferGeometry,
  Mesh,
  MeshStandardMaterial,
  Vector2,
} from "three";
import { detectDefaultQualityTier, QUALITY_SPECS } from "@/lib/quality";
import { useAppStore } from "@/store/useAppStore";
import {
  applyTileDisplacement,
  createTileGeometry,
  TILE_COLS,
  TILE_ROWS,
} from "./createTileGeometry";
import {
  isHeightLoaded,
  loadPlanetaryHeightGrid,
} from "./heightSampler";
import { getTileManagerForBody } from "./tileManager";

const NORMAL_SCALE = new Vector2(1.9, 1.9);
const NOOP_RAYCAST = () => {};

interface MoonTileMeshProps {
  row: number;
  col: number;
  segments: number;
  heightReady: boolean;
  body: "moon" | "mars";
}

function MoonTileMesh({
  row,
  col,
  segments,
  heightReady,
  body,
}: MoonTileMeshProps) {
  const meshRef = useRef<Mesh>(null);
  const tileManager = getTileManagerForBody(body);

  const geometry = useMemo<BufferGeometry>(
    () => createTileGeometry(row, col, segments, body),
    [row, col, segments, body],
  );

  // When the 16-bit LOLA/MOLA DEM finishes streaming, displace existing tile vertices in-place
  useEffect(() => {
    if (heightReady && isHeightLoaded(body)) {
      applyTileDisplacement(geometry, row, col, segments, body);
    }
  }, [heightReady, geometry, row, col, segments, body]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: body === "mars" ? "#d98c6c" : "#e8ecf2",
        roughness: body === "mars" ? 0.91 : 0.94,
        metalness: 0.0,
        normalScale: NORMAL_SCALE.clone(),
      }),
    [body],
  );

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useEffect(() => {
    return tileManager.subscribe(row, col, (state) => {
      let changed = false;
      if (material.map !== state.colorTex) {
        material.map = state.colorTex;
        material.color.set(
          state.colorTex ? "#ffffff" : body === "mars" ? "#c26b4a" : "#b8b0a0",
        );
        changed = true;
      }
      if (material.normalMap !== state.normalTex) {
        material.normalMap = state.normalTex;
        changed = true;
      }
      if (changed) {
        material.needsUpdate = true;
      }
    });
  }, [row, col, material, tileManager, body]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      raycast={NOOP_RAYCAST}
    />
  );
}

export default function MoonGlobe() {
  const { camera, size, gl } = useThree();
  const celestialBody = useAppStore((s) => s.celestialBody);
  const body: "moon" | "mars" = celestialBody === "mars" ? "mars" : "moon";
  const qualitySetting = useAppStore((s) => s.settings.qualityTier);
  const heightReady = useAppStore((s) => s.heightReady);
  const setHeightReady = useAppStore((s) => s.setHeightReady);

  const defaultTierRef = useRef(detectDefaultQualityTier());
  const effectiveTier =
    qualitySetting === "auto" ? defaultTierRef.current : qualitySetting;
  const qualitySpec = QUALITY_SPECS[effectiveTier];

  useEffect(() => {
    const activeManager = getTileManagerForBody(body);
    activeManager.setMaxAnisotropy(gl.capabilities.getMaxAnisotropy());
    void activeManager.init();

    setHeightReady(isHeightLoaded(body));
    void loadPlanetaryHeightGrid(body).then((ok) => {
      if (ok) {
        setHeightReady(true);
      }
    });
  }, [gl, body, setHeightReady]);

  const tileCoords = useMemo(() => {
    const list: Array<{ row: number; col: number }> = [];
    for (let r = 0; r < TILE_ROWS; r++) {
      for (let c = 0; c < TILE_COLS; c++) {
        list.push({ row: r, col: c });
      }
    }
    return list;
  }, []);

  useFrame(() => {
    getTileManagerForBody(body).evaluateLod(camera, size.height, qualitySpec);
  });

  return (
    <group name={body === "mars" ? "mars-globe" : "moon-globe"}>
      {tileCoords.map(({ row, col }) => (
        <MoonTileMesh
          key={`${body}_${row}_${col}`}
          row={row}
          col={col}
          segments={qualitySpec.tileSegments}
          heightReady={heightReady}
          body={body}
        />
      ))}
    </group>
  );
}
