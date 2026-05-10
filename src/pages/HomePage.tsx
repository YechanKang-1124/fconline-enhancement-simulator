import { cva } from "class-variance-authority";
import { useMemo, useState } from "react";

import { IconArrowDown } from "@/assets/icons";
import {
  EnhancementBadge,
  EnhancementSelectButton,
} from "@/components/features";
import { HStack, VStack } from "@/components/ui";
import { ENHANCEMENT_RESULT_PROBAIBILITIES } from "@/constants";
import { useDisclosure } from "@/hooks";
import { EnhancementLevel, EnhancementProbabilityKey } from "@/types";
import { range } from "@/utils/array";
import { formatFixedNumber, formatNumber } from "@/utils/formatters";
import { getZeroSquareMatrix, invertMatrix } from "@/utils/matrix";

type AttemptsCI = {
  p99L: number;
  p98L: number;
  p95L: number;
  p90L: number;
  p80L: number;
  p50L: number;
  median: number;
  p50U: number;
  p80U: number;
  p90U: number;
  p95U: number;
  p98U: number;
  p99U: number;
};

type SimulationResult = {
  avgAttemptsPerLevel: number[];
  totalAvgAttempts: number;
  attemptsCI: AttemptsCI;
};

const DEFAULT_ATTEMPTS_CI: AttemptsCI = {
  p99L: 0,
  p98L: 0,
  p95L: 0,
  p90L: 0,
  p80L: 0,
  p50L: 0,
  median: 0,
  p50U: 0,
  p80U: 0,
  p90U: 0,
  p95U: 0,
  p98U: 0,
  p99U: 0,
};

const ATTEMPTS_CI_KEY_BY_PERCENTILE: {
  percentile: string;
  key: keyof AttemptsCI;
}[] = [
  { percentile: "상위 1%", key: "p98L" },
  { percentile: "상위 5%", key: "p90L" },
  { percentile: "상위 10%", key: "p80L" },
  { percentile: "상위 25%", key: "p50L" },
  { percentile: "중앙값", key: "median" },
  { percentile: "하위 25%", key: "p50U" },
  { percentile: "하위 10%", key: "p80U" },
  { percentile: "하위 5%", key: "p90U" },
  { percentile: "하위 1%", key: "p98U" },
];

const DEFAULT_SIMULATION_RESULT: SimulationResult = {
  avgAttemptsPerLevel: [],
  totalAvgAttempts: 0,
  attemptsCI: {
    ...DEFAULT_ATTEMPTS_CI,
  },
};

const simulateCount = (
  currentLevel: EnhancementLevel,
  targetLevel: EnhancementLevel,
): SimulationResult => {
  if (currentLevel >= targetLevel) {
    return DEFAULT_SIMULATION_RESULT;
  }

  const size = targetLevel - 1;

  const Q = getZeroSquareMatrix(size);
  for (let level = 1; level <= size; level++) {
    const i = level - 1;
    const result_probs =
      ENHANCEMENT_RESULT_PROBAIBILITIES[level as EnhancementProbabilityKey];
    for (const [resultLevelStr, prob] of Object.entries(result_probs)) {
      const resultLevel = Number(resultLevelStr);
      const j = resultLevel - 1;
      if (resultLevel < targetLevel) {
        Q[i][j] = prob;
      }
    }
  }

  const I_minus_Q = range(size).map((_, i) =>
    range(size).map((_, j) => (i === j ? 1 : 0) - Q[i][j]),
  );
  const N = invertMatrix(I_minus_Q);

  const startIdx = currentLevel - 1;
  const avgAttemptsPerLevel = N[startIdx];
  const totalAvgAttempts = avgAttemptsPerLevel.reduce(
    (sum, val) => sum + val,
    0,
  );

  // let totalAvgCost = 0;
  // avgAttemptsPerStage.forEach((attempts, idx) => {
  //   totalAvgCost += attempts * costs[idx + 1];
  // });
  let currentVector = Array(size).fill(0);
  currentVector[startIdx] = 1;

  let k = 0;
  let cdf = 0;
  const attemptsCI = {
    ...DEFAULT_ATTEMPTS_CI,
  };

  const cdfTargets = [
    { key: "p99L", val: 0.005 },
    { key: "p98L", val: 0.01 },
    { key: "p95L", val: 0.025 },
    { key: "p90L", val: 0.05 },
    { key: "p80L", val: 0.1 },
    { key: "p50L", val: 0.25 },
    { key: "median", val: 0.5 },
    { key: "p50U", val: 0.75 },
    { key: "p80U", val: 0.9 },
    { key: "p90U", val: 0.95 },
    { key: "p95U", val: 0.975 },
    { key: "p98U", val: 0.99 },
    { key: "p99U", val: 0.995 },
  ] satisfies { key: keyof AttemptsCI; val: number }[];
  let targetIdx = 0;

  while (cdf < 0.9999 && k < 100000 && targetIdx < cdfTargets.length) {
    k++;
    const nextVector = Array(size).fill(0);
    for (let i = 0; i < size; i++) {
      if (currentVector[i] > 0) {
        for (let j = 0; j < size; j++) {
          nextVector[j] += currentVector[i] * Q[i][j];
        }
      }
    }
    currentVector = nextVector;
    const pStillTransient = currentVector.reduce((a, b) => a + b, 0);
    cdf = 1 - pStillTransient;

    while (targetIdx < cdfTargets.length && cdf >= cdfTargets[targetIdx].val) {
      attemptsCI[cdfTargets[targetIdx].key] = k;
      targetIdx++;
    }
  }

  return {
    avgAttemptsPerLevel,
    totalAvgAttempts,
    attemptsCI,
  };
};

const HomePage = () => {
  const [currentLevel, setCurrentLevel] = useState<EnhancementLevel>(1);
  const [targetLevel, setTargetLevel] = useState<EnhancementLevel>(8);
  const [encludeCost, setEncludeCost] = useState(false);

  const { avgAttemptsPerLevel, totalAvgAttempts, attemptsCI } = useMemo(
    () => simulateCount(currentLevel, targetLevel),
    [currentLevel, targetLevel],
  );

  const {
    isOpen: isCurrentLevelSelectorOpen,
    onToggle: onToggleCurrentLevelSelector,
    onClose: onCloseCurrentLevelSelector,
  } = useDisclosure();
  const {
    isOpen: isTargetLevelSelectorOpen,
    onToggle: onToggleTargetLevelSelector,
    onClose: onCloseTargetLevelSelector,
  } = useDisclosure();

  const handleChangeCurrentLevel = (level: EnhancementLevel) => {
    setCurrentLevel(level);
    onCloseCurrentLevelSelector();
  };
  const handleChangeTargetLevel = (level: EnhancementLevel) => {
    setTargetLevel(level);
    onCloseTargetLevelSelector();
  };

  const handleToggleCurrentLevelSelector = () => {
    onCloseTargetLevelSelector();
    onToggleCurrentLevelSelector();
  };
  const handleToggleTargetLevelSelector = () => {
    onCloseCurrentLevelSelector();
    onToggleTargetLevelSelector();
  };

  return (
    <VStack className="min-h-screen w-full py-4 gap-8">
      <VStack className="gap-2">
        <HStack className="gap-4 w-full">
          <span className="block text-2xl font-semibold">현재 강화 등급</span>
          <EnhancementSelectButton
            level={currentLevel}
            onChangeLevel={handleChangeCurrentLevel}
            isLevelSelectorOpen={isCurrentLevelSelectorOpen}
            onToggleLevelSelector={handleToggleCurrentLevelSelector}
            onCloseLevelSelector={onCloseCurrentLevelSelector}
          />
        </HStack>
        <HStack className="gap-4 w-full">
          <span className="block text-2xl font-semibold">목표 강화 등급</span>
          <EnhancementSelectButton
            level={targetLevel}
            onChangeLevel={handleChangeTargetLevel}
            isLevelSelectorOpen={isTargetLevelSelectorOpen}
            onToggleLevelSelector={handleToggleTargetLevelSelector}
            onCloseLevelSelector={onCloseTargetLevelSelector}
          />
        </HStack>
      </VStack>
      <VStack className="w-full gap-2">
        <h2 className="text-xl font-semibold">
          각 강화 등급별 평균 강화 시도 횟수
        </h2>
        <table>
          <thead>
            <tr>
              <th>강화 등급</th>
              <th>평균 강화 시도 횟수</th>
            </tr>
          </thead>
          <tbody>
            {avgAttemptsPerLevel.map((attempts, idx) => (
              <tr key={idx}>
                <td>
                  <HStack key={idx} className="gap-2">
                    <EnhancementBadge level={(idx + 1) as EnhancementLevel} />
                    <IconArrowDown className="size-5 -rotate-90 text-gray-600" />
                    <EnhancementBadge level={(idx + 2) as EnhancementLevel} />
                  </HStack>
                </td>
                <td>
                  <p>{formatFixedNumber(attempts, 2)}회</p>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th>합계</th>
              <th>{formatFixedNumber(totalAvgAttempts)}회</th>
            </tr>
          </tfoot>
        </table>
      </VStack>
      <VStack className="w-full gap-2">
        <p className="text-xl font-semibold">총 강화 시도 횟수 백분위수</p>
        <table>
          <thead>
            <tr>
              <th>백분위수</th>
              <th>횟수</th>
            </tr>
          </thead>
          <tbody>
            {ATTEMPTS_CI_KEY_BY_PERCENTILE.map(({ percentile, key }) => (
              <tr key={percentile}>
                <td>
                  <div className="w-full flex items-center py-1 px-2 justify-start">
                    <p className="font-semibold">{percentile}</p>
                  </div>
                </td>
                <td>
                  <div className="w-full flex items-center py-1 px-2 justify-end">
                    {formatNumber(attemptsCI[key])}회
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </VStack>
    </VStack>
  );
};

const textBoxVariants = cva("w-full flex items-center h-9", {
  variants: {
    justify: {
      center: "justify-center",
      end: "justify-end",
    },
  },
  defaultVariants: {
    justify: "end",
  },
});

export default HomePage;
