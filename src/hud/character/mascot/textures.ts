import {
  CanvasTexture,
  EquirectangularReflectionMapping,
  MathUtils,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";

/**
 * Procedural textures shared by every mascot host:
 * LED dot-matrix eyes, NASA meatball emblem, 3x5 solar grid, crinkled gold foil
 * bump, studio reflection map, and soft radial floor shadow.
 */

export interface MascotTextures {
  ledTex: CanvasTexture;
  nasaTex: CanvasTexture;
  solarTex: CanvasTexture;
  foilBump: CanvasTexture;
  envTex: CanvasTexture;
  shadowTex: CanvasTexture;
}

let cachedMascotTextures: MascotTextures | null = null;

export function getMascotTextures(): MascotTextures {
  if (cachedMascotTextures) return cachedMascotTextures;

  // 1. Digital LED pixel-matrix texture for the glowing eyes
  const ledCanvas = document.createElement("canvas");
  ledCanvas.width = 128;
  ledCanvas.height = 160;
  const lctx = ledCanvas.getContext("2d")!;
  lctx.clearRect(0, 0, 128, 160);
  const cols = 13;
  const rows = 17;
  const cx = 64;
  const cy = 80;
  const rx = 56;
  const ry = 72;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = 12 + (c / (cols - 1)) * 104;
      const py = 12 + (r / (rows - 1)) * 136;
      const norm = Math.hypot((px - cx) / rx, (py - cy) / ry);
      if (norm <= 1.0) {
        const edgeFade = MathUtils.smoothstep(1.0 - norm, 0, 0.28);
        lctx.fillStyle = `rgba(255, 255, 255, ${(0.55 + 0.45 * edgeFade).toFixed(3)})`;
        lctx.beginPath();
        lctx.arc(px, py, 3.3, 0, Math.PI * 2);
        lctx.fill();
      }
    }
  }
  const ledTex = new CanvasTexture(ledCanvas);
  ledTex.colorSpace = SRGBColorSpace;

  // 2. Iconic NASA Meatball Insignia texture for the center chest badge
  const nasaCanvas = document.createElement("canvas");
  nasaCanvas.width = 256;
  nasaCanvas.height = 256;
  const nctx = nasaCanvas.getContext("2d")!;
  nctx.clearRect(0, 0, 256, 256);
  nctx.fillStyle = "#0b3d91";
  nctx.beginPath();
  nctx.arc(128, 128, 116, 0, Math.PI * 2);
  nctx.fill();
  nctx.strokeStyle = "#1e56b8";
  nctx.lineWidth = 4;
  nctx.stroke();
  nctx.fillStyle = "#ffffff";
  const stars: [number, number, number][] = [
    [62, 68, 2.5],
    [88, 52, 2],
    [172, 64, 2.8],
    [194, 86, 2],
    [74, 178, 2.5],
    [104, 194, 2],
    [168, 182, 2.5],
    [145, 75, 1.8],
    [54, 146, 2],
  ];
  for (const [sx, sy, sr] of stars) {
    nctx.beginPath();
    nctx.arc(sx, sy, sr, 0, Math.PI * 2);
    nctx.fill();
  }
  nctx.save();
  nctx.translate(128, 128);
  nctx.rotate(-0.42);
  nctx.strokeStyle = "#ffffff";
  nctx.lineWidth = 5;
  nctx.beginPath();
  nctx.ellipse(0, 0, 96, 36, 0, 0, Math.PI * 2);
  nctx.stroke();
  nctx.restore();
  nctx.strokeStyle = "#fc3d21";
  nctx.lineWidth = 14;
  nctx.lineCap = "round";
  nctx.lineJoin = "round";
  nctx.beginPath();
  nctx.moveTo(46, 172);
  nctx.lineTo(132, 66);
  nctx.lineTo(208, 152);
  nctx.stroke();
  nctx.fillStyle = "#ffffff";
  nctx.font = "900 54px system-ui, -apple-system, sans-serif";
  nctx.textAlign = "center";
  nctx.textBaseline = "middle";
  nctx.fillText("NASA", 128, 132);
  const nasaTex = new CanvasTexture(nasaCanvas);
  nasaTex.colorSpace = SRGBColorSpace;

  // 3. Blue 3x5 Photovoltaic Solar Cell Grid texture
  const solarCanvas = document.createElement("canvas");
  solarCanvas.width = 256;
  solarCanvas.height = 160;
  const sctx = solarCanvas.getContext("2d")!;
  const grad = sctx.createLinearGradient(0, 0, 256, 160);
  grad.addColorStop(0, "#2563eb");
  grad.addColorStop(0.5, "#1d4ed8");
  grad.addColorStop(1, "#1e3a8a");
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 256, 160);
  sctx.strokeStyle = "#bfdbfe";
  sctx.lineWidth = 4;
  sctx.strokeRect(4, 4, 248, 152);
  sctx.lineWidth = 2.5;
  for (let c = 1; c < 5; c++) {
    const x = (c * 256) / 5;
    sctx.beginPath();
    sctx.moveTo(x, 4);
    sctx.lineTo(x, 156);
    sctx.stroke();
  }
  for (let r = 1; r < 3; r++) {
    const y = (r * 160) / 3;
    sctx.beginPath();
    sctx.moveTo(4, y);
    sctx.lineTo(252, y);
    sctx.stroke();
  }
  const solarTex = new CanvasTexture(solarCanvas);
  solarTex.colorSpace = SRGBColorSpace;

  // 4. Crinkled metallic bump map for the gold foil panels
  const foilCanvas = document.createElement("canvas");
  foilCanvas.width = 128;
  foilCanvas.height = 128;
  const fctx = foilCanvas.getContext("2d")!;
  fctx.fillStyle = "#808080";
  fctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 90; i++) {
    const x = (Math.sin(i * 12.9898) * 0.5 + 0.5) * 128;
    const y = (Math.cos(i * 78.233) * 0.5 + 0.5) * 128;
    const r = 8 + (i % 14);
    const g = fctx.createLinearGradient(x - r, y - r, x + r, y + r);
    g.addColorStop(0, i % 2 === 0 ? "#e5e5e5" : "#303030");
    g.addColorStop(1, i % 2 === 0 ? "#252525" : "#d8d8d8");
    fctx.fillStyle = g;
    fctx.beginPath();
    fctx.moveTo(x, y - r);
    fctx.lineTo(x + r, y);
    fctx.lineTo(x, y + r * 0.8);
    fctx.lineTo(x - r * 0.9, y + r * 0.2);
    fctx.closePath();
    fctx.fill();
  }
  const foilBump = new CanvasTexture(foilCanvas);
  foilBump.wrapS = RepeatWrapping;
  foilBump.wrapT = RepeatWrapping;

  // 5. Equirectangular studio reflection map
  const envCanvas = document.createElement("canvas");
  envCanvas.width = 128;
  envCanvas.height = 64;
  const ectx = envCanvas.getContext("2d")!;
  const envBg = ectx.createLinearGradient(0, 0, 0, 64);
  envBg.addColorStop(0, "#1e293b");
  envBg.addColorStop(0.5, "#0f172a");
  envBg.addColorStop(1, "#05070d");
  ectx.fillStyle = envBg;
  ectx.fillRect(0, 0, 128, 64);
  ectx.fillStyle = "#ffffff";
  ectx.fillRect(36, 6, 56, 12);
  ectx.fillStyle = "#5ce1ff";
  ectx.fillRect(8, 18, 22, 18);
  ectx.fillStyle = "#ffcf70";
  ectx.beginPath();
  ectx.arc(104, 24, 10, 0, Math.PI * 2);
  ectx.fill();
  const envTex = new CanvasTexture(envCanvas);
  envTex.mapping = EquirectangularReflectionMapping;
  envTex.colorSpace = SRGBColorSpace;

  // 6. Soft radial contact shadow texture
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const shctx = shadowCanvas.getContext("2d")!;
  const shGrad = shctx.createRadialGradient(64, 64, 6, 64, 64, 58);
  shGrad.addColorStop(0, "rgba(0, 0, 0, 0.72)");
  shGrad.addColorStop(0.45, "rgba(0, 0, 0, 0.36)");
  shGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  shctx.fillStyle = shGrad;
  shctx.fillRect(0, 0, 128, 128);
  const shadowTex = new CanvasTexture(shadowCanvas);

  cachedMascotTextures = {
    ledTex,
    nasaTex,
    solarTex,
    foilBump,
    envTex,
    shadowTex,
  };
  return cachedMascotTextures;
}

/** Name plate texture for the lunar module mascots (EAGLE / INTREPID / ANTARES). */
const plateCache = new Map<string, CanvasTexture>();

export function getNamePlateTexture(name: string, accent: string): CanvasTexture {
  const key = `${name}|${accent}`;
  const cached = plateCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#0a0f18";
  ctx.fillRect(0, 0, 512, 160);

  const grad = ctx.createLinearGradient(0, 0, 512, 160);
  grad.addColorStop(0, "rgba(255,255,255,0.10)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 160);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 506, 154);

  ctx.fillStyle = accent;
  ctx.font = "700 26px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LUNAR MODULE · DESCENT STAGE", 256, 44);

  ctx.fillStyle = "#f6f1e7";
  ctx.font = "900 62px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(name.toUpperCase(), 256, 106);

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  plateCache.set(key, tex);
  return tex;
}
