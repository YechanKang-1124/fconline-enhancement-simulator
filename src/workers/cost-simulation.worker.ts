import { ENHANCEMENT_RESULT_PROBAIBILITIES } from "../constants";

import type {
  CostSimulationWorkerRequest,
  CostSimulationWorkerResponse,
  EnhancementLevel,
  EnhancementProbabilityKey,
} from "../types";

type Transition = {
  level: EnhancementLevel;
  cumulativeProb: number;
};

const getTransitions = (targetLevel: EnhancementLevel) => {
  const transitions: Partial<Record<EnhancementProbabilityKey, Transition[]>> =
    {};

  for (const [levelStr, resultProbs] of Object.entries(
    ENHANCEMENT_RESULT_PROBAIBILITIES,
  )) {
    const level = Number(levelStr) as EnhancementProbabilityKey;

    if (level >= targetLevel) {
      continue;
    }

    let cumulativeProb = 0;
    transitions[level] = Object.entries(resultProbs).map(
      ([resultLevelStr, prob]) => {
        cumulativeProb += prob as number;

        return {
          level: Number(resultLevelStr) as EnhancementLevel,
          cumulativeProb,
        };
      },
    );
  }

  return transitions;
};

self.onmessage = (event: MessageEvent<CostSimulationWorkerRequest>) => {
  const { currentLevel, targetLevel, costsPerLevel, simulationCount } =
    event.data;

  const transitions = getTransitions(targetLevel);
  const costResults = new Float64Array(simulationCount);

  for (let i = 0; i < simulationCount; i++) {
    let level = currentLevel;
    let runCost = 0;

    while (level < targetLevel) {
      runCost += costsPerLevel[level - 1];
      const levelTransitions = transitions[level as EnhancementProbabilityKey];
      const randomValue = Math.random();

      if (levelTransitions == null) {
        break;
      }

      for (let j = 0; j < levelTransitions.length; j++) {
        const transition = levelTransitions[j];
        if (
          randomValue < transition.cumulativeProb ||
          j === levelTransitions.length - 1
        ) {
          level = transition.level;
          break;
        }
      }
    }

    costResults[i] = runCost;
  }

  const costResultsBuffer = costResults.buffer as ArrayBuffer;

  self.postMessage(
    {
      costResultsBuffer,
    } satisfies CostSimulationWorkerResponse,
    { transfer: [costResultsBuffer] },
  );
};

export {};
