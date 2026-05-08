import { useState } from "react";

import { EnhancementSelectButton } from "@/components/features";
import { HStack, VStack } from "@/components/ui";
import { ENHANCEMENT_RESULT_PROBAIBILITIES } from "@/constants";
import { useDisclosure } from "@/hooks";
import { EnhancementLevel, EnhancementProbabilityKey } from "@/types";
import { range } from "@/utils/array";
import { getZeroSquareMatrix, invertMatrix } from "@/utils/matrix";
import { round } from "@/utils/round";

const HomePage = () => {
  const [currentLevel, setCurrentLevel] = useState<EnhancementLevel>(1);
  const [targetLevel, setTargetLevel] = useState<EnhancementLevel>(8);
  const [encludeCost, setEncludeCost] = useState(false);

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

  const simulateCount = () => {
    if (currentLevel >= targetLevel) {
      return;
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
    const avgAttemptsPerStage = N[startIdx];
    const totalAvgAttempts = avgAttemptsPerStage.reduce(
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
      p99L: 0,
      p95L: 0,
      p90L: 0,
      p75L: 0,
      median: 0,
      p75U: 0,
      p90U: 0,
      p95U: 0,
      p99U: 0,
    };

    const cdfTargets = [
      { key: "p99L", val: 0.005 },
      { key: "p95L", val: 0.025 },
      { key: "p90L", val: 0.05 },
      { key: "p75L", val: 0.25 },
      { key: "median", val: 0.5 },
      { key: "p75U", val: 0.75 },
      { key: "p90U", val: 0.95 },
      { key: "p95U", val: 0.975 },
      { key: "p99U", val: 0.995 },
    ];
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

      while (
        targetIdx < cdfTargets.length &&
        cdf >= cdfTargets[targetIdx].val
      ) {
        attemptsCI[cdfTargets[targetIdx].key as keyof typeof attemptsCI] = k;
        targetIdx++;
      }
    }

    console.log("avgAttempsPerState:", avgAttemptsPerStage);
    console.log("totalAvgAttempts:", totalAvgAttempts);
    console.log("attemptsCI", attemptsCI);
  };

  return (
    <VStack className="min-h-screen w-full py-4">
      <VStack className="gap-2">
        <label className="block w-full">
          <HStack className="gap-4">
            <span className="block text-2xl font-semibold">현재 강화 등급</span>
            <EnhancementSelectButton
              level={currentLevel}
              onChangeLevel={handleChangeCurrentLevel}
              isLevelSelectorOpen={isCurrentLevelSelectorOpen}
              onToggleLevelSelector={handleToggleCurrentLevelSelector}
              onCloseLevelSelector={onCloseCurrentLevelSelector}
            />
          </HStack>
        </label>
        <label className="block w-full">
          <HStack className="gap-4">
            <span className="block text-2xl font-semibold">목표 강화 등급</span>
            <EnhancementSelectButton
              level={targetLevel}
              onChangeLevel={handleChangeTargetLevel}
              isLevelSelectorOpen={isTargetLevelSelectorOpen}
              onToggleLevelSelector={handleToggleTargetLevelSelector}
              onCloseLevelSelector={onCloseTargetLevelSelector}
            />
          </HStack>
        </label>
      </VStack>
      <button onClick={simulateCount}>계산하기</button>
    </VStack>
  );
};

export default HomePage;
