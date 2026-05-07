import {
  EnhancementProbabilityKey,
  EnhancementResultProbabilities,
  RestorationProbabilities,
  ResultProbabilities,
  SuccessProbabilities,
} from "@/types";

export function getEnhancementResultProbabilities(
  successProbs: SuccessProbabilities,
  restorationProbs: RestorationProbabilities,
): ResultProbabilities {
  const resultProbs: Partial<ResultProbabilities> = {};

  const levels = Object.keys(successProbs).map(
    Number,
  ) as EnhancementProbabilityKey[];

  for (const level of levels) {
    const successProb = successProbs[level];
    const failureProb = Number((1 - successProb).toFixed(4));

    const levelResult: Record<number, number> = {};

    levelResult[level + 1] = successProb;

    if (level >= 8) {
      levelResult[level] = failureProb;
    } else {
      const restores = restorationProbs[level];
      if (restores == null) {
        continue;
      }
      for (const [restoreLevelStr, restoreProb] of Object.entries(restores)) {
        const restoreLevel = Number(restoreLevelStr);

        const resultProb = Number(
          (failureProb * (restoreProb as number)).toFixed(4),
        );

        levelResult[restoreLevel] = resultProb;
      }
    }

    resultProbs[level] = levelResult as EnhancementResultProbabilities;
  }

  return resultProbs as ResultProbabilities;
}
