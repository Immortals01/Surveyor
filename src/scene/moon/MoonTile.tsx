import { useEffect, useMemo, useRef } from "react";
import { Color, MeshStandardMaterial, Vector2 } from "three";
import {
  applyTileDisplacement,
  createTileGeometry,
} from "./createTileGeometry";
import { moonTileManager } from "./tileManager";

interface MoonTileProps {
  row: number;
  col: number;
  segments: number;
  heightReady: boolean;
  debugTiles: boolean;
}

const DEBUG_COLORS: Record<number, string> = {
  0: "#64748b",
  1: "#38bdf8",
  2: "#4ade80",
  3: "#facc15",
};

export default function MoonTile({
  row,
  col,
  segments,
  heightReady,
  debugTiles,
}: MoonTileProps) {
  const geometry = useMemo(
    () => createTileGeometry(row, col, segments),
    [row, col, segments],
  );

  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color("#c8c2b6"),
        roughness: 0.97,
        metalness: 0.0,
        normalScale: new Vector2(1.15, 1.15),
      }),
    [],
  );

  const currentLevelRef = useRef<number>(0);

  // Dispose geometry & material on unmount / segment change
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  // Staggered vertex displacement once LOLA height buffer arrives
  useEffect(() => {
    if (!heightReady) return;
    const delayMs = (row * 8 + col) * 6;
    const timer = window.setTimeout(() => {
      applyTileDisplacement(geometry, row, col, segments);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [heightReady, geometry, row, col, segments]);

  // Subscribe to progressive color & normal textures
  useEffect(() => {
    return moonTileManager.subscribe(row, col, (state) => {
      currentLevelRef.current = Math.max(0, state.colorLevel);
      if (state.colorTex && material.map !== state.colorTex) {
        material.map = state.colorTex;
        material.color.set(
          debugTiles
            ? (DEBUG_COLORS[currentLevelRef.current] ?? "#ffffff")
            : "#ffffff",
        );
        material.needsUpdate = true;
      }
      if (state.normalTex && material.normalMap !== state.normalTex) {
        material.normalMap = state.normalTex;
        material.needsUpdate = true;
      }
    });
  }, [row, col, material, debugTiles]);

  useEffect(() => {
    if (!material.map) return;
    material.color.set(
      debugTiles
        ? (DEBUG_COLORS[currentLevelRef.current] ?? "#ffffff")
        : "#ffffff",
    );
  }, [debugTiles, material]);

  return <mesh geometry={geometry} material={material} receiveShadow={false} />;
}
