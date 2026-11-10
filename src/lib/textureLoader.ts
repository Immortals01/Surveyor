import {
  ClampToEdgeWrapping,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  type ColorSpace,
  type MagnificationTextureFilter,
  type MinificationTextureFilter,
  type Wrapping,
} from "three";

export interface AsyncTextureOptions {
  colorSpace?: ColorSpace;
  wrapS?: Wrapping;
  wrapT?: Wrapping;
  minFilter?: MinificationTextureFilter;
  magFilter?: MagnificationTextureFilter;
  anisotropy?: number;
  generateMipmaps?: boolean;
  signal?: AbortSignal;
}

const fallbackLoader = new TextureLoader();

const canUseImageBitmap =
  typeof window !== "undefined" &&
  typeof window.createImageBitmap === "function" &&
  typeof window.fetch === "function";

function applyTextureOptions(
  tex: Texture,
  options: AsyncTextureOptions,
  flippedInBitmap: boolean,
): Texture {
  tex.colorSpace = options.colorSpace ?? SRGBColorSpace;
  tex.wrapS = options.wrapS ?? ClampToEdgeWrapping;
  tex.wrapT = options.wrapT ?? ClampToEdgeWrapping;
  tex.minFilter = options.minFilter ?? LinearMipmapLinearFilter;
  tex.magFilter = options.magFilter ?? LinearFilter;
  tex.anisotropy = options.anisotropy ?? 1;
  tex.generateMipmaps = options.generateMipmaps ?? true;
  if (flippedInBitmap) {
    tex.flipY = false;
  }
  tex.needsUpdate = true;
  return tex;
}

/**
 * Decodes a texture off the main thread via `fetch` + `createImageBitmap`
 * (including off-thread Y-flip so WebGL `texImage2D` never blocks on CPU row flipping).
 * Automatically falls back to `THREE.TextureLoader` if `createImageBitmap` is unavailable.
 */
export async function loadTextureAsync(
  url: string,
  options: AsyncTextureOptions = {},
): Promise<Texture> {
  if (options.signal?.aborted) {
    throw new DOMException("Texture load aborted", "AbortError");
  }

  if (canUseImageBitmap) {
    const res = await fetch(url, {
      signal: options.signal,
      credentials: "same-origin",
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    const blob = await res.blob();
    if (options.signal?.aborted) {
      throw new DOMException("Texture load aborted", "AbortError");
    }

    let bitmap: ImageBitmap;
    let flippedInBitmap = false;
    try {
      bitmap = await createImageBitmap(blob, {
        imageOrientation: "flipY",
        premultiplyAlpha: "none",
        colorSpaceConversion:
          options.colorSpace === NoColorSpace ? "none" : "default",
      });
      flippedInBitmap = true;
    } catch {
      bitmap = await createImageBitmap(blob);
    }

    if (options.signal?.aborted) {
      bitmap.close?.();
      throw new DOMException("Texture load aborted", "AbortError");
    }

    const tex = new Texture(bitmap);
    return applyTextureOptions(tex, options, flippedInBitmap);
  }

  return new Promise<Texture>((resolve, reject) => {
    fallbackLoader.load(
      url,
      (tex) => {
        if (options.signal?.aborted) {
          tex.dispose();
          reject(new DOMException("Texture load aborted", "AbortError"));
          return;
        }
        resolve(applyTextureOptions(tex, options, false));
      },
      undefined,
      (err) => reject(err),
    );
  });
}

/**
 * Disposes a Three.js Texture and immediately closes any underlying `ImageBitmap`
 * so GPU and native C++ bitmap memory are freed without waiting for GC.
 */
export function disposeTexture(tex: Texture | null | undefined): void {
  if (!tex) return;
  const img = tex.image as { close?: () => void } | null | undefined;
  if (img && typeof img.close === "function") {
    try {
      img.close();
    } catch {
      // ignore if already closed
    }
  }
  tex.dispose();
}
