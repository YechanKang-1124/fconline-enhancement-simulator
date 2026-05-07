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
