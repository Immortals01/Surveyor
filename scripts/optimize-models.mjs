#!/usr/bin/env node
import { existsSync, mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { Document, NodeIO } from "@gltf-transform/core";
import {
  BoxGeometry,
  CylinderGeometry,
  OctahedronGeometry,
  SphereGeometry,
  TorusGeometry,
} from "three";

const ROOT = path.resolve(import.meta.dirname, "..");
const MODELS_DIR = path.join(ROOT, "public/models");
mkdirSync(MODELS_DIR, { recursive: true });

// Official NASA 3D Resources GitHub raw URLs (tried first; falls back to crisp engineered PBR GLB if GitHub LFS pointer or offline)
const NASA_GLB_CANDIDATES = {
  "apollo-lm.glb":
    "https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/Apollo%20Lunar%20Module/Apollo%20Lunar%20Module.glb",
  "apollo-lrv.glb":
    "https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/Apollo%20Lunar%20Rover/Apollo%20Lunar%20Rover.glb",
  "surveyor.glb":
    "https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/Surveyor%201/Surveyor%201.glb",
};

function addThreePart(doc, buffer, scene, threeGeo, material, opts = {}) {
  const posAttr = threeGeo.getAttribute("position");
  const nrmAttr = threeGeo.getAttribute("normal");
  const idxAttr = threeGeo.getIndex();

  const posAcc = doc
    .createAccessor()
    .setType("VEC3")
    .setArray(new Float32Array(posAttr.array))
    .setBuffer(buffer);
  const nrmAcc = doc
    .createAccessor()
    .setType("VEC3")
    .setArray(new Float32Array(nrmAttr.array))
    .setBuffer(buffer);

  const prim = doc
    .createPrimitive()
    .setAttribute("POSITION", posAcc)
    .setAttribute("NORMAL", nrmAcc)
    .setMaterial(material);

  if (idxAttr) {
    const idxArray =
      idxAttr.array instanceof Uint32Array
        ? new Uint32Array(idxAttr.array)
        : new Uint16Array(idxAttr.array);
    const idxAcc = doc
      .createAccessor()
      .setType("SCALAR")
      .setArray(idxArray)
      .setBuffer(buffer);
    prim.setIndices(idxAcc);
  }

  const mesh = doc.createMesh().addPrimitive(prim);
  const node = doc.createNode().setMesh(mesh);
  if (opts.translation) node.setTranslation(opts.translation);
  if (opts.rotation) node.setRotation(opts.rotation);
  if (opts.scale) node.setScale(opts.scale);
  scene.addChild(node);
  threeGeo.dispose();
}

function quatFromAxisAngle(ax, ay, az, angleRad) {
  const half = angleRad * 0.5;
  const s = Math.sin(half);
  return [ax * s, ay * s, az * s, Math.cos(half)];
}

async function buildApolloLmGlb(outPath) {
  const doc = new Document();
  const buf = doc.createBuffer();
  const scene = doc.createScene("ApolloLunarModule");

  const goldFoil = doc
    .createMaterial("KaptonGold")
    .setBaseColorFactor([0.88, 0.66, 0.18, 1])
    .setMetallicFactor(0.82)
    .setRoughnessFactor(0.32);

  const darkAlloy = doc
    .createMaterial("DarkStrut")
    .setBaseColorFactor([0.18, 0.2, 0.23, 1])
    .setMetallicFactor(0.7)
    .setRoughnessFactor(0.45);

  const nozzleMat = doc
    .createMaterial("DescentEngineBell")
    .setBaseColorFactor([0.12, 0.13, 0.16, 1])
    .setMetallicFactor(0.85)
    .setRoughnessFactor(0.35);

  // Octagonal Kapton-foil Descent Stage body
  addThreePart(doc, buf, scene, new CylinderGeometry(0.95, 0.95, 0.68, 8), goldFoil, {
    translation: [0, 0.62, 0],
  });

  // Top deck launch ring
  addThreePart(doc, buf, scene, new CylinderGeometry(0.72, 0.78, 0.1, 8), darkAlloy, {
    translation: [0, 1.0, 0],
  });

  // Descent Propulsion System engine bell underneath
  addThreePart(doc, buf, scene, new CylinderGeometry(0.22, 0.42, 0.42, 20), nozzleMat, {
    translation: [0, 0.22, 0],
  });

  // 4 Landing Gear Struts + Circular Honeycomb Footpads + Boarding Ladder
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);

    // Primary angled leg strut
    addThreePart(doc, buf, scene, new CylinderGeometry(0.035, 0.035, 1.15, 10), goldFoil, {
      translation: [ca * 1.18, 0.48, sa * 1.18],
      rotation: quatFromAxisAngle(-sa, 0, ca, -0.52),
    });

    // Dish-shaped crushable footpad
    addThreePart(doc, buf, scene, new CylinderGeometry(0.23, 0.18, 0.06, 18), goldFoil, {
      translation: [ca * 1.46, 0.03, sa * 1.46],
    });
  }

  // Front boarding porch & 9-rung ladder strut
  addThreePart(doc, buf, scene, new BoxGeometry(0.24, 0.78, 0.05), darkAlloy, {
    translation: [0.95, 0.48, 0.95],
    rotation: quatFromAxisAngle(-0.707, 0, 0.707, -0.35),
  });

  const io = new NodeIO();
  const glb = await io.writeBinary(doc);
  await writeFile(outPath, Buffer.from(glb));
}

async function buildApolloLrvGlb(outPath) {
  const doc = new Document();
  const buf = doc.createBuffer();
  const scene = doc.createScene("ApolloLunarRover");

  const silverFrame = doc
    .createMaterial("AluminumChassis")
    .setBaseColorFactor([0.82, 0.84, 0.88, 1])
    .setMetallicFactor(0.75)
    .setRoughnessFactor(0.32);

  const wireMesh = doc
    .createMaterial("PianoWireWheel")
    .setBaseColorFactor([0.52, 0.55, 0.6, 1])
    .setMetallicFactor(0.65)
    .setRoughnessFactor(0.5);

  const fenderMat = doc
    .createMaterial("DustFender")
    .setBaseColorFactor([0.76, 0.52, 0.24, 1])
    .setMetallicFactor(0.35)
    .setRoughnessFactor(0.55);

  const goldCam = doc
    .createMaterial("GoldTVAssembly")
    .setBaseColorFactor([0.9, 0.68, 0.2, 1])
    .setMetallicFactor(0.85)
    .setRoughnessFactor(0.28);

  const seatMat = doc
    .createMaterial("NylonSeat")
    .setBaseColorFactor([0.2, 0.22, 0.26, 1])
    .setMetallicFactor(0.1)
    .setRoughnessFactor(0.85);

  // Flat foldable aluminum chassis deck
  addThreePart(doc, buf, scene, new BoxGeometry(1.55, 0.08, 0.96), silverFrame, {
    translation: [0, 0.34, 0],
  });

  // Two side-by-side lawn-chair astronaut seats + hand controller T-stick
  for (const zOff of [-0.24, 0.24]) {
    addThreePart(doc, buf, scene, new BoxGeometry(0.36, 0.05, 0.36), seatMat, {
      translation: [-0.08, 0.4, zOff],
    });
    addThreePart(doc, buf, scene, new BoxGeometry(0.05, 0.42, 0.36), seatMat, {
      translation: [-0.26, 0.6, zOff],
    });
  }

  // Forward battery & LRV navigation console
  addThreePart(doc, buf, scene, new BoxGeometry(0.42, 0.24, 0.72), silverFrame, {
    translation: [0.56, 0.48, 0],
  });

  // High-gain umbrella S-band mesh dish on mast
  addThreePart(doc, buf, scene, new CylinderGeometry(0.025, 0.025, 0.85, 10), silverFrame, {
    translation: [0.46, 0.92, -0.28],
  });
  addThreePart(doc, buf, scene, new CylinderGeometry(0.38, 0.06, 0.16, 16), goldCam, {
    translation: [0.46, 1.36, -0.28],
  });

  // Remote-controlled RCA Color TV Camera on front gimbal!
  addThreePart(doc, buf, scene, new CylinderGeometry(0.022, 0.022, 0.42, 10), silverFrame, {
    translation: [0.68, 0.74, 0.28],
  });
  addThreePart(doc, buf, scene, new BoxGeometry(0.24, 0.14, 0.14), goldCam, {
    translation: [0.72, 0.96, 0.28],
  });

  // 4 Woven Piano-Wire Wheels + Chevron Hubs + Orange Dust Fenders
  const wheelCoords = [
    [0.72, 0.28, 0.62],
    [0.72, 0.28, -0.62],
    [-0.72, 0.28, 0.62],
    [-0.72, 0.28, -0.62],
  ];
  for (const [wx, wy, wz] of wheelCoords) {
    addThreePart(doc, buf, scene, new TorusGeometry(0.24, 0.075, 12, 24), wireMesh, {
      translation: [wx, wy, wz],
    });
    addThreePart(doc, buf, scene, new CylinderGeometry(0.11, 0.11, 0.12, 12), goldCam, {
      translation: [wx, wy, wz],
      rotation: quatFromAxisAngle(1, 0, 0, Math.PI / 2),
    });
    addThreePart(doc, buf, scene, new BoxGeometry(0.42, 0.04, 0.22), fenderMat, {
      translation: [wx, wy + 0.29, wz],
    });
  }

  const io = new NodeIO();
  const glb = await io.writeBinary(doc);
  await writeFile(outPath, Buffer.from(glb));
}

async function buildSurveyorGlb(outPath) {
  const doc = new Document();
  const buf = doc.createBuffer();
  const scene = doc.createScene("SurveyorLander");

  const whiteStrut = doc
    .createMaterial("WhiteThermalPaint")
    .setBaseColorFactor([0.92, 0.91, 0.87, 1])
    .setMetallicFactor(0.25)
    .setRoughnessFactor(0.48);

  const solarBlue = doc
    .createMaterial("SolarPanel")
    .setBaseColorFactor([0.12, 0.3, 0.58, 1])
    .setMetallicFactor(0.6)
    .setRoughnessFactor(0.25);

  const chromeBox = doc
    .createMaterial("ThermalCompartment")
    .setBaseColorFactor([0.82, 0.75, 0.58, 1])
    .setMetallicFactor(0.8)
    .setRoughnessFactor(0.25);

  // Central triangular spaceframe core & vernier propellant spheres
  addThreePart(doc, buf, scene, new CylinderGeometry(0.36, 0.52, 0.65, 3), whiteStrut, {
    translation: [0, 0.62, 0],
  });
  addThreePart(doc, buf, scene, new BoxGeometry(0.42, 0.32, 0.32), chromeBox, {
    translation: [0.22, 0.58, 0.15],
  });
  addThreePart(doc, buf, scene, new SphereGeometry(0.18, 16, 16), chromeBox, {
    translation: [-0.22, 0.64, -0.15],
  });

  // Tall central mast + planar high-gain antenna + solar panel
  addThreePart(doc, buf, scene, new CylinderGeometry(0.035, 0.045, 1.15, 12), whiteStrut, {
    translation: [0, 1.32, 0],
  });
  addThreePart(doc, buf, scene, new BoxGeometry(0.68, 0.04, 0.52), solarBlue, {
    translation: [0.1, 1.88, 0],
    rotation: quatFromAxisAngle(0, 0, 1, 0.35),
  });
  addThreePart(doc, buf, scene, new BoxGeometry(0.48, 0.48, 0.04), whiteStrut, {
    translation: [-0.15, 1.72, 0.16],
    rotation: quatFromAxisAngle(1, 0, 0, -0.4),
  });

  // Rotating mirror survey TV camera tower
  addThreePart(doc, buf, scene, new CylinderGeometry(0.07, 0.08, 0.44, 14), whiteStrut, {
    translation: [0.28, 1.02, -0.18],
  });
  addThreePart(doc, buf, scene, new OctahedronGeometry(0.1), chromeBox, {
    translation: [0.28, 1.28, -0.18],
  });

  // 3 Hinged Tripod Landing Legs + Crushable White Footpads
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    addThreePart(doc, buf, scene, new CylinderGeometry(0.032, 0.032, 1.18, 10), whiteStrut, {
      translation: [ca * 0.85, 0.42, sa * 0.85],
      rotation: quatFromAxisAngle(-sa, 0, ca, -0.68),
    });
    addThreePart(doc, buf, scene, new CylinderGeometry(0.2, 0.15, 0.07, 16), whiteStrut, {
      translation: [ca * 1.22, 0.035, sa * 1.22],
    });
  }

  const io = new NodeIO();
  const glb = await io.writeBinary(doc);
  await writeFile(outPath, Buffer.from(glb));
}

async function tryFetchValidGlb(url, outPath) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    // GLB magic header is "glTF" (0x46546C67) and keep <= 2 MB
    if (buf.length > 512 && buf.length <= 2 * 1024 * 1024 && buf.toString("utf8", 0, 4) === "glTF") {
      await writeFile(outPath, buf);
      return true;
    }
  } catch {
    // fallback to procedural PBR GLB
  }
  return false;
}

const builders = {
  "apollo-lm.glb": buildApolloLmGlb,
  "apollo-lrv.glb": buildApolloLrvGlb,
  "surveyor.glb": buildSurveyorGlb,
};

for (const [name, builder] of Object.entries(builders)) {
  const outPath = path.join(MODELS_DIR, name);
  if (existsSync(outPath)) {
    console.log(`[models] Exists: ${name}`);
    continue;
  }
  const fetched = await tryFetchValidGlb(NASA_GLB_CANDIDATES[name], outPath);
  if (fetched) {
    console.log(`[models] Downloaded NASA 3D GLB: ${name}`);
  } else {
    await builder(outPath);
    console.log(`[models] Built lightweight PBR hardware GLB: ${name}`);
  }
}
