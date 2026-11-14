// Downloads NASA imagery for the Deep Space archive cards and writes WebP crops.
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const IMAGES = [
  ["dawn-1", "PIA12031"],
  ["dawn-2", "PIA19376"],
  ["dawn-3", "PIA20309"],
  ["near-1", "PIA18177"],
  ["near-2", "PIA02957"],
  ["near-3", "PIA02900"],
  ["pioneer-1", "ARC-1972-AC72-2135"],
  ["pioneer-2", "ARC-1973-AC73-4247"],
  ["pioneer-3", "ARC-1969-AC72-1353"],
  ["kepler-1", "PIA11733"],
  ["kepler-2", "PIA11188"],
  ["kepler-3", "PIA11824"],
];

await mkdir("public/images/deep-space", { recursive: true });

for (const [name, nasaId] of IMAGES) {
  let input;
  for (const size of ["orig", "large", "medium", "small", "thumb"]) {
    const url = `https://images-assets.nasa.gov/image/${nasaId}/${nasaId}~${size}.jpg`;
    const res = await fetch(url);
    if (res.ok) {
      input = Buffer.from(await res.arrayBuffer());
      break;
    }
  }
  if (!input) throw new Error(`${nasaId}: no downloadable image`);
  const out = await sharp(input)
    .resize(960, 560, { fit: "cover", position: "attention" })
    .webp({ quality: 82 })
    .toBuffer();
  await writeFile(`public/images/deep-space/${name}.webp`, out);
  console.log(`${name} <- ${nasaId} (${Math.round(out.length / 1024)} KB)`);
}
