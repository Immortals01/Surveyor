// Downloads two supplementary NASA images per mission group for site carousels.
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const PICKS = {
  "surveyor-1": ["PIA02976", "PIA12910"],
  "surveyor-3": ["AS12-48-7133", "as12-48-7121"],
  "surveyor-5": ["PIA02978", "PIA12977"],
  "surveyor-6": ["PIA12978"],
  "surveyor-7": ["PIA02977"],
  "apollo-11": ["as11-40-5917", "as11-40-5931"],
  "apollo-12": ["AS12-48-7134", "as12-47-6919"],
  "apollo-14": ["as14-68-9414", "as14-67-09361"],
  "apollo-15": ["as15-85-11437", "as15-88-11894"],
  "apollo-16": ["as16-116-18578", "as16-115-18549"],
  "apollo-17": ["as17-145-22162", "PIA12920"],
  "viking-1": ["PIA10738", "PIA00563"],
  "viking-2": ["PIA00396", "PIA04023"],
  "pathfinder": ["PIA01412", "PIA00618"],
  "spirit": ["PIA05137", "PIA05040"],
  "opportunity": ["PIA20285", "PIA16559"],
  "phoenix": ["KSC-07PD-1085", "PIA12853"],
  "insight": ["PIA19811", "PIA22956"],
  "ingenuity": ["PIA24466", "PIA24542"],
};

await mkdir("public/images/sites/gallery", { recursive: true });


async function download(nasaId) {
  for (const size of ["medium", "orig", "large", "small", "thumb"]) {
    const url = `https://images-assets.nasa.gov/image/${nasaId}/${nasaId}~${size}.jpg`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) continue;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 2500) continue;
    return buffer;
  }
  return null;
}

const used = new Set();
const manifest = {};

async function metadata(nasaId) {
  const res = await fetch(`https://images-api.nasa.gov/search?nasa_id=${nasaId}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return null;
  const json = await res.json();
  const item = json?.collection?.items?.[0];
  if (!item) return null;
  return {
    id: nasaId,
    title: item.data?.[0]?.title ?? nasaId,
    creator: item.data?.[0]?.secondary_creator ?? "",
    center: item.data?.[0]?.center ?? "",
  };
}

for (const [group, ids] of Object.entries(PICKS)) {
  const picks = [];
  for (const nasaId of ids) {
    if (used.has(nasaId)) continue;
    const meta = await metadata(nasaId);
    if (!meta) continue;
    const buffer = await download(nasaId);
    if (!buffer) continue;
    used.add(nasaId);
    const out = await sharp(buffer)
      .resize(960, 560, { fit: "cover", position: "attention" })
      .webp({ quality: 82 })
      .toBuffer();
    const filename = `/images/sites/gallery/${group}-${picks.length + 1}.webp`;
    await writeFile(`public/${filename.slice(1)}`, out);
    picks.push({
      src: filename,
      caption: meta.title,
      credit: meta.creator || (meta.center ? `NASA/${meta.center}` : "NASA"),
      nasaId,
    });
    console.log(`${group}-${picks.length} <- ${nasaId} | ${meta.title}`);
  }
  manifest[group] = picks;
}

await writeFile("scripts/site-gallery-manifest.json", JSON.stringify(manifest, null, 2));
console.log(`Wrote ${Object.keys(manifest).length} groups.`);
