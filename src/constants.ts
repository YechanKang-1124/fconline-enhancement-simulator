import {
  RestorationProbabilities,
  ResultProbabilities,
  SuccessProbabilities,
} from "./types";
import { getEnhancementResultProbabilities } from "./utils/enhancement-probabilities";

export const SUCCESS_PROBABILITIES: SuccessProbabilities = {
  1: 1.0,
  2: 0.81,
  3: 0.64,
  4: 0.5,
  5: 0.26,
  6: 0.15,
  7: 0.07,
  8: 0.05,
  9: 0.04,
  10: 0.03,
  11: 0.02,
  12: 0.01,
};

export const RESTORATION_PROBABILITIES: RestorationProbabilities = {
  1: { 1: 1.0 },
  2: { 1: 1.0 },
  3: { 1: 0.65, 2: 0.35 },
  4: { 1: 0.55, 2: 0.45 },
  5: { 1: 0.35, 2: 0.4, 3: 0.25 },
  6: { 1: 0.1, 2: 0.32, 3: 0.36, 4: 0.22 },
  7: { 1: 0.04, 2: 0.1, 3: 0.3, 4: 0.35, 5: 0.21 },
  8: { 1: 0.02, 2: 0.04, 3: 0.1, 4: 0.28, 5: 0.35, 6: 0.21 },
  9: { 1: 0.01, 2: 0.02, 3: 0.04, 4: 0.1, 5: 0.28, 6: 0.34, 7: 0.21 },
  10: { 1: 0.01, 2: 0.01, 3: 0.02, 4: 0.04, 5: 0.1, 6: 0.28, 7: 0.34, 8: 0.2 },
  11: {
    1: 0.01,
    2: 0.01,
    3: 0.01,
    4: 0.02,
    5: 0.04,
    6: 0.09,
    7: 0.28,
    8: 0.34,
    9: 0.2,
  },
  12: {
    1: 0.01,
    2: 0.01,
    3: 0.01,
    4: 0.01,
    5: 0.02,
    6: 0.03,
    7: 0.09,
    8: 0.28,
    9: 0.34,
    10: 0.2,
  },
};

export const ENHANCEMENT_RESULT_PROBAIBILITIES: ResultProbabilities =
  getEnhancementResultProbabilities(
    SUCCESS_PROBABILITIES,
    RESTORATION_PROBABILITIES,
  );
