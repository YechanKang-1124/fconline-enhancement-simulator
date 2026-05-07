import { range } from "./array";

export function getZeroSquareMatrix(size: number): number[][] {
  return range(size).map(() => range(size).map(() => 0));
}

export function invertMatrix(matrix: number[][]): number[][] {
  const n = matrix.length;
  const a = matrix.map((row) => [...row]);
  const inv = range(n).map((_, i) => range(n).map((_, j) => (i === j ? 1 : 0)));

  for (let i = 0; i < n; i++) {
    let diag = a[i][i];
    if (Math.abs(diag) < 1e-10) {
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(a[j][i]) > 1e-10) {
          [a[i], a[j]] = [a[j], a[i]];
          [inv[i], inv[j]] = [inv[j], inv[i]];
          diag = a[i][i];
          break;
        }
      }
    }
    for (let j = 0; j < n; j++) {
      a[i][j] /= diag;
      inv[i][j] /= diag;
    }
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = a[k][i];
        for (let j = 0; j < n; j++) {
          a[k][j] -= factor * a[i][j];
          inv[k][j] -= factor * inv[i][j];
        }
      }
    }
  }
  return inv;
}
