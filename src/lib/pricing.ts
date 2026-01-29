const PRICE_TIERS = [40000, 35000, 30000] as const;

export function calcTotalCLP(childrenCount: number): number {
  const n = Math.max(0, Math.min(3, Math.trunc(childrenCount)));
  let total = 0;

  for (let i = 0; i < n; i++) total += PRICE_TIERS[i];
  return total;
}

// opcional: por si quieres mostrar desglose en UI
export function calcBreakdownCLP(childrenCount: number) {
  const n = Math.max(0, Math.min(3, Math.trunc(childrenCount)));
  const tiers = PRICE_TIERS.slice(0, n);
  const total = tiers.reduce((a, b) => a + b, 0);
  return { tiers, total };
}

