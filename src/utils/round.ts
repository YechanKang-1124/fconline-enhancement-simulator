export function round(x: number, d: number = 0) {
  const y = 10 ** d;
  return Math.round(x * y) / y;
}
