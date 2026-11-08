import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import {
  detectDefaultQualityTier,
  QUALITY_SPECS,
  type QualitySpec,
} from "@/lib/quality";
import { useAppStore } from "@/store/useAppStore";
import { TILE_COLS, TILE_ROWS } from "./createTileGeometry";
import { loadLunarHeightGrid } from "./heightSampler";
import MoonTile from "./MoonTile";
import { moonTileManager } from "./tileManager";

export default function MoonGlobe() {
  const { camera, gl, size } = useThree();
  const qualitySetting = useAppStore((s) => s.settings.qualityTier);
  const heightReady = useAppStore((s) => s.heightReady);
  const setHeightReady = useAppStore((s) => s.setHeightReady);

  const qualitySpec: QualitySpec = useMemo(() => {
    const tier =
      qualitySetting === "auto" ? detectDefaultQualityTier() : qualitySetting;
    return QUALITY_SPECS[tier];
  }, [qualitySetting]);

  const debugTiles = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("debug") === "tiles";
  }, []);

  useEffect(() => {
    moonTileManager.setMaxAnisotropy(gl.capabilities.getMaxAnisotropy());
    void moonTileManager.init();
    void loadLunarHeightGrid().then((ok) => {
      if (ok) setHeightReady(true);
    });
  }, [gl, setHeightReady]);

  // Evaluate camera-driven tile LOD every 250 ms
  useEffect(() => {
    const run = () => {
      moonTileManager.evaluateLod(
        camera,
        size.height * gl.getPixelRatio(),
        qualitySpec,
      );
    };
    run();
    const id = window.setInterval(run, 250);
    return () => window.clearInterval(id);
  }, [camera, gl, size.height, qualitySpec]);

  const tileCoords = useMemo(() => {
    const list: Array<{ row: number; col: number }> = [];
    for (let row = 0; row < TILE_ROWS; row++) {
      for (let col = 0; col < TILE_COLS; col++) {
        list.push({ row, col });
      }
    }
    return list;
  }, []);

  return (
    <group name="lunar-globe">
      {tileCoords.map(({ row, col }) => (
        <MoonTile
          key={`${row}_${col}`}
          row={row}
          col={col}
          segments={qualitySpec.tileSegments}
          heightReady={heightReady}
          debugTiles={debugTiles}
        />
      ))}
    </group>
  );
}
