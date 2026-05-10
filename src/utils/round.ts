export function round(x: number, d: number = 0) {
  const y = 10 ** d;
  return Math.round(x * y) / y;
}

export function roundFixed(x: number, d: number = 0) {
  return round(x, d).toFixed(d);
}
