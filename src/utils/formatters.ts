export function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function formatBP(value: number) {
  return `${formatNumber(Math.round(value))} BP`;
}
