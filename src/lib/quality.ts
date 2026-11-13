export type QualityTier = "low" | "medium" | "high";

export interface QualitySpec {
  tier: QualityTier;
  maxColorLevel: number; // L1=1 (4K), L2=2 (8K), L3=3 (16K)
  tileSegments: number;
  maxDpr: number;
  l2BudgetTiles: number;
  l3BudgetTiles: number;
}

export const QUALITY_SPECS: Record<QualityTier, QualitySpec> = {
  low: {
    tier: "low",
    maxColorLevel: 2,
    tileSegments: 48,
    maxDpr: 1.25,
    l2BudgetTiles: 6,
    l3BudgetTiles: 0,
  },
  medium: {
    tier: "medium",
    maxColorLevel: 3,
    tileSegments: 64,
    maxDpr: 1.75,
    l2BudgetTiles: 16,
    l3BudgetTiles: 8,
  },
  high: {
    tier: "high",
    maxColorLevel: 3,
    tileSegments: 80,
    maxDpr: 2,
    l2BudgetTiles: 24,
    l3BudgetTiles: 14,
  },
};

export function detectDefaultQualityTier(): QualityTier {
  if (typeof window === "undefined") return "medium";

  const isCoarsePointer =
    window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const mem = nav.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 4;

  if (isCoarsePointer && (mem <= 4 || cores <= 2)) {
    return "low";
  }
  if (!isCoarsePointer && mem >= 4 && cores >= 4) {
    return "high";
  }
  return "medium";
}
