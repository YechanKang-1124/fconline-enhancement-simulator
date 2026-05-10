import {
  DEFAULT_PERCENTILES,
  ENHANCEMENT_RESULT_PROBAIBILITIES,
} from "../constants";
import { SIMULATION_COUNT } from "../simulation-settings";

import type {
  EnhancementLevel,
  EnhancementProbabilityKey,
  Percentiles,
  SimulationResult,
} from "../types";

type SimulationRequest = {
  currentLevel: EnhancementLevel;
  targetLevel: EnhancementLevel;
  costsPerLevel: number[];
};

self.onmessage = (event: MessageEvent<SimulationRequest>) => {
  const { currentLevel, targetLevel, costsPerLevel } = event.data;

  if (currentLevel >= targetLevel) {
    self.postMessage({
      totalCostPercentiles: DEFAULT_PERCENTILES,
    } satisfies SimulationResult);
    return;
  }

  const costResults = new Float64Array(SIMULATION_COUNT);

  for (let i = 0; i < SIMULATION_COUNT; i++) {
    let level = currentLevel;
    let runCost = 0;

    while (level < targetLevel) {
      runCost += costsPerLevel[level - 1];
      const resultProbs =
        ENHANCEMENT_RESULT_PROBAIBILITIES[level as EnhancementProbabilityKey];
      const { [(level + 1) as EnhancementLevel]: success, ...rest } =
        resultProbs;
      const successProb = success ?? 0;
      const restorationProbs = rest;
      const randomValue = Math.random();

      if (randomValue < successProb) {
        level++;
      } else {
        let cumulativeProb = successProb;
        let fell = false;

        for (const [fallbackLevel, prob] of Object.entries(restorationProbs)) {
          cumulativeProb += prob as number;
          if (randomValue < cumulativeProb) {
            level = Number(fallbackLevel) as EnhancementLevel;
            fell = true;
            break;
          }
        }

        if (!fell) {
          level = Number(
            Object.keys(restorationProbs)[0] || level,
          ) as EnhancementLevel;
        }
      }
    }

    costResults[i] = runCost;
  }

  costResults.sort();

  const totalCostPercentiles: Percentiles = {
    p1: costResults[Math.ceil(SIMULATION_COUNT * 0.01) - 1],
    p5: costResults[Math.ceil(SIMULATION_COUNT * 0.05) - 1],
    p10: costResults[Math.ceil(SIMULATION_COUNT * 0.1) - 1],
    p25: costResults[Math.ceil(SIMULATION_COUNT * 0.25) - 1],
    p50: costResults[Math.ceil(SIMULATION_COUNT * 0.5) - 1],
    p75: costResults[Math.ceil(SIMULATION_COUNT * 0.75) - 1],
    p90: costResults[Math.ceil(SIMULATION_COUNT * 0.9) - 1],
    p95: costResults[Math.ceil(SIMULATION_COUNT * 0.95) - 1],
    p99: costResults[Math.ceil(SIMULATION_COUNT * 0.99) - 1],
  };

  self.postMessage({
    totalCostPercentiles,
  } satisfies SimulationResult);
};

export {};
