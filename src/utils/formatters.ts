export function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function formatBP(value: number) {
  return `${formatNumber(Math.round(value))} BP`;
}

export function formatFixedNumber(x: number, d: number = 0) {
  const y = 10 ** d;
  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(Math.round(x * y) / y);
}
