import fs from "node:fs";
import path from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

/**
 * Rewrites barrel imports of `lucide-react`, `@react-three/drei`, and `three-stdlib`
 * directly to their underlying submodule files so Vite only transforms the modules
 * actually used (~200 modules instead of ~3,085).
 */
function optimizeBarrels(): Plugin {
  const rootDir = import.meta.dirname;
  // Absolute paths are injected into import specifiers, so keep them POSIX-style;
  // raw Windows backslashes would be consumed as escape sequences.
  const toSpec = (p: string) => p.replaceAll("\\", "/");
  const lucideMap = new Map<string, string>();
  const dreiMap = new Map<string, { target: string; isDefault: boolean }>();
  const stdlibMap = new Map<string, string>();

  const lucideEntry = path.resolve(rootDir, "node_modules/lucide-react/dist/esm/lucide-react.mjs");
  if (fs.existsSync(lucideEntry)) {
    const content = fs.readFileSync(lucideEntry, "utf8");
    for (const match of content.matchAll(/export\s+\{([^}]+)\}\s+from\s+["']\.\/(icons\/[^"']+)["']/g)) {
      const specifiers = match[1]!;
      const relPath = match[2]!;
      for (const part of specifiers.split(",")) {
        const asMatch = part.trim().match(/^default\s+as\s+(\w+)$/);
        if (asMatch?.[1]) {
          lucideMap.set(asMatch[1], toSpec(path.resolve(rootDir, "node_modules/lucide-react/dist/esm", relPath)));
        }
      }
    }
  }

  const dreiEntry = path.resolve(rootDir, "node_modules/@react-three/drei/index.js");
  if (fs.existsSync(dreiEntry)) {
    const content = fs.readFileSync(dreiEntry, "utf8");
    for (const match of content.matchAll(/export\s+\{([^}]+)\}\s+from\s+["']\.\/([^"']+)["']/g)) {
      const specifiers = match[1]!;
      const relPath = match[2]!;
      for (const part of specifiers.split(",")) {
        const trimmed = part.trim();
        const defaultAs = trimmed.match(/^default\s+as\s+(\w+)$/);
        const absTarget = toSpec(path.resolve(rootDir, "node_modules/@react-three/drei", relPath));
        if (defaultAs?.[1]) {
          dreiMap.set(defaultAs[1], { target: absTarget, isDefault: true });
        } else if (/^\w+$/.test(trimmed)) {
          dreiMap.set(trimmed, { target: absTarget, isDefault: false });
        }
      }
    }
  }

  const stdlibEntry = path.resolve(rootDir, "node_modules/three-stdlib/index.js");
  if (fs.existsSync(stdlibEntry)) {
    const content = fs.readFileSync(stdlibEntry, "utf8");
    for (const match of content.matchAll(/import\s+\{([^}]+)\}\s+from\s+["']\.\/([^"']+)["']/g)) {
      const specifiers = match[1]!;
      const relPath = match[2]!;
      const absTarget = toSpec(path.resolve(rootDir, "node_modules/three-stdlib", relPath));
      for (const part of specifiers.split(",")) {
        const trimmed = part.trim();
        const aliasMatch = trimmed.match(/^(\w+)\s+as\s+(\w+)$/);
        const exportedName = aliasMatch ? aliasMatch[2]! : trimmed;
        if (/^\w+$/.test(exportedName)) {
          stdlibMap.set(exportedName, absTarget);
        }
      }
    }
  }

  return {
    name: "optimize-barrels",
    enforce: "pre",
    transform(code, id) {
      const isSrc = id.includes("/src/");
      const isDrei = id.includes("@react-three/drei");
      if (!isSrc && !isDrei) return null;

      let mutated = false;
      const out = code.replace(
        /import\s+\{([^}]+)\}\s+from\s+["'](lucide-react|@react-three\/drei|three-stdlib)["'];?/g,
        (full, specBlock: string, pkg: string) => {
          const specs = specBlock
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

          const lines: string[] = [];
          for (const spec of specs) {
            if (spec.startsWith("type ")) {
              lines.push(`import { ${spec} } from "${pkg}";`);
              continue;
            }
            const aliasMatch = spec.match(/^(\w+)\s+as\s+(\w+)$/);
            const imported = aliasMatch ? aliasMatch[1]! : spec;
            const local = aliasMatch ? aliasMatch[2]! : spec;

            if (pkg === "lucide-react") {
              const target = lucideMap.get(imported);
              if (!target) return full;
              lines.push(`import ${local} from "${target}";`);
            } else if (pkg === "@react-three/drei") {
              const entry = dreiMap.get(imported);
              if (!entry) return full;
              if (entry.isDefault) {
                lines.push(`import ${local} from "${entry.target}";`);
              } else {
                lines.push(
                  imported === local
                    ? `import { ${imported} } from "${entry.target}";`
                    : `import { ${imported} as ${local} } from "${entry.target}";`,
                );
              }
            } else if (pkg === "three-stdlib") {
              const target = stdlibMap.get(imported);
              if (!target) return full;
              lines.push(
                imported === local
                  ? `import { ${imported} } from "${target}";`
                  : `import { ${imported} as ${local} } from "${target}";`,
              );
            }
          }
          mutated = true;
          return lines.join("\n");
        },
      );

      return mutated ? { code: out, map: null } : null;
    },
  };
}

export default defineConfig({
  plugins: [optimizeBarrels(), react(), tailwindcss(), cloudflare()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1400,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three/") || id.includes("node_modules/three-stdlib/")) {
            return "three";
          }
          if (id.includes("node_modules/@react-three/")) {
            return "r3f";
          }
          if (id.includes("node_modules/motion") || id.includes("node_modules/framer-motion")) {
            return "motion";
          }
          if (id.includes("/src/data/")) {
            return "planetary-data";
          }
        },
      },
    },
  },
});
