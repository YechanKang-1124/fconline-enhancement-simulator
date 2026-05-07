export function sortNumbers(numbers: number[]): number[] {
  return [...numbers].sort((a, b) => a - b);
}

export function sortStrings(strings: string[], locale?: string): string[] {
  return [...strings].sort((a, b) => a.localeCompare(b, locale));
}

export function range(start: number, end?: number): number[] {
  if (end == null) {
    return range(0, start);
  }
  if (!Number.isInteger(start) || !Number.isInteger(end) || start > end) {
    return [];
  }
  return Array.from({ length: end - start }, (_, i) => start + i);
}

export function chunkArray<T>(arr: T[], by: number): T[][] {
  if (!Number.isInteger(by) || by <= 0) {
    return [];
  }
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += by) {
    result.push(arr.slice(i, i + by));
  }
  return result;
}
