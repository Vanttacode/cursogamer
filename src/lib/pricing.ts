export function calcTotalCLP(childrenCount: number): number {
  if (childrenCount <= 1) return 40000;
  if (childrenCount === 2) return 80000;
  return 100000; // 3
}
