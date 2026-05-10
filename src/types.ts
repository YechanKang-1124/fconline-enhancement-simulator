export type EnhancementLevel =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13;

export type EnhancementTier =
  | "iron"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum";

export type EnhancementProbabilityKey = Exclude<EnhancementLevel, 13>;

export type EnhancementResultProbabilities = Partial<
  Record<EnhancementLevel, number>
>;

export type SuccessProbabilities = Record<EnhancementProbabilityKey, number>;

export type RestorationProbabilities = Record<
  EnhancementProbabilityKey,
  EnhancementResultProbabilities
>;

export type ResultProbabilities = Record<
  EnhancementProbabilityKey,
  EnhancementResultProbabilities
>;

export type Percentiles = {
  p1: number;
  p5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
};

export type CalculationResult = {
  avgAttemptsPerLevel: number[];
  totalAvgAttempts: number;
  attemptsPercentiles: Percentiles;
  avgCostsPerLevel: number[];
  totalAvgCost: number;
};

export type CostSimulationWorkerRequest = {
  currentLevel: EnhancementLevel;
  targetLevel: EnhancementLevel;
  costsPerLevel: number[];
  simulationCount: number;
};

export type CostSimulationWorkerResponse = {
  costResultsBuffer: ArrayBuffer;
};
