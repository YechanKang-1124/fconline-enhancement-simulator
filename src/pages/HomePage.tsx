import { useEffect, useMemo, useRef, useState } from "react";

import { IconArrowDown } from "@/assets/icons";
import {
  EnhancementBadge,
  EnhancementSelectButton,
} from "@/components/features";
import { Button, Checkbox, HStack, Input, VStack } from "@/components/ui";
import {
  DEFAULT_PERCENTILES,
  ENHANCEMENT_RESULT_PROBAIBILITIES,
} from "@/constants";
import { useDisclosure } from "@/hooks";
import { SIMULATION_COUNT } from "@/simulation-settings";
import {
  CalculationResult,
  CostSimulationWorkerResponse,
  EnhancementLevel,
  EnhancementProbabilityKey,
  Percentiles,
} from "@/types";
import { range } from "@/utils/array";
import { formatBP, formatFixedNumber, formatNumber } from "@/utils/formatters";
import { getZeroSquareMatrix, invertMatrix } from "@/utils/matrix";

const PERCENTILE_LABELS_BY_PERCENTILE: {
  percentile: string;
  key: keyof Percentiles;
}[] = [
  { percentile: "상위 1%", key: "p1" },
  { percentile: "상위 5%", key: "p5" },
  { percentile: "상위 10%", key: "p10" },
  { percentile: "상위 25%", key: "p25" },
  { percentile: "중앙값", key: "p50" },
  { percentile: "하위 25%", key: "p75" },
  { percentile: "하위 10%", key: "p90" },
  { percentile: "하위 5%", key: "p95" },
  { percentile: "하위 1%", key: "p99" },
];

const DEFAULT_CALCULATION_RESULT: CalculationResult = {
  avgAttemptsPerLevel: [],
  totalAvgAttempts: 0,
  attemptsPercentiles: {
    ...DEFAULT_PERCENTILES,
  },
  avgCostsPerLevel: [],
  totalAvgCost: 0,
};

const getPercentileValue = (sortedValues: Float64Array, percentile: number) => {
  if (sortedValues.length === 0) {
    return 0;
  }

  const idx = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil(sortedValues.length * percentile) - 1),
  );

  return sortedValues[idx];
};

const getPercentiles = (sortedValues: Float64Array): Percentiles => ({
  p1: getPercentileValue(sortedValues, 0.01),
  p5: getPercentileValue(sortedValues, 0.05),
  p10: getPercentileValue(sortedValues, 0.1),
  p25: getPercentileValue(sortedValues, 0.25),
  p50: getPercentileValue(sortedValues, 0.5),
  p75: getPercentileValue(sortedValues, 0.75),
  p90: getPercentileValue(sortedValues, 0.9),
  p95: getPercentileValue(sortedValues, 0.95),
  p99: getPercentileValue(sortedValues, 0.99),
});

const getSimulationWorkerCount = () => {
  const hardwareConcurrency = navigator.hardwareConcurrency ?? 4;
  const availableWorkerCount = Math.max(1, hardwareConcurrency - 1);

  return Math.min(SIMULATION_COUNT, availableWorkerCount, 8);
};

const calculate = (
  currentLevel: EnhancementLevel,
  targetLevel: EnhancementLevel,
  costsPerLevel: number[],
): CalculationResult => {
  if (currentLevel >= targetLevel) {
    return DEFAULT_CALCULATION_RESULT;
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

  const avgCostsPerLevel = avgAttemptsPerLevel.map(
    (attempts, idx) => attempts * costsPerLevel[idx],
  );
  const totalAvgCost = avgCostsPerLevel.reduce((sum, val) => sum + val, 0);

  let currentVector = Array(size).fill(0);
  currentVector[startIdx] = 1;

  let k = 0;
  let cdf = 0;
  const attemptsPercentiles = {
    ...DEFAULT_PERCENTILES,
  };

  const cdfTargets = [
    { key: "p1", val: 0.01 },
    { key: "p5", val: 0.05 },
    { key: "p10", val: 0.1 },
    { key: "p25", val: 0.25 },
    { key: "p50", val: 0.5 },
    { key: "p75", val: 0.75 },
    { key: "p90", val: 0.9 },
    { key: "p95", val: 0.95 },
    { key: "p99", val: 0.99 },
  ] satisfies { key: keyof Percentiles; val: number }[];
  let targetIdx = 0;

  while (cdf < 0.9999 && k < 100_000 && targetIdx < cdfTargets.length) {
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
      attemptsPercentiles[cdfTargets[targetIdx].key] = k;
      targetIdx++;
    }
  }

  return {
    avgAttemptsPerLevel,
    totalAvgAttempts,
    attemptsPercentiles,
    avgCostsPerLevel,
    totalAvgCost,
  };
};

const HomePage = () => {
  const [currentLevel, setCurrentLevel] = useState<EnhancementLevel>(1);
  const [targetLevel, setTargetLevel] = useState<EnhancementLevel>(8);
  const [encludeCost, setEncludeCost] = useState(false);
  const [costsPerLevel, setCostsPerLevel] = useState<number[]>(() =>
    range(12).map(() => 0),
  );
  const [simulationStatus, setSimulationStatus] = useState<
    "idle" | "running" | "completed"
  >("idle");
  const [totalCostPercentiles, setTotalCostPercentiles] = useState<Percentiles>(
    { ...DEFAULT_PERCENTILES },
  );
  const simulationWorkersRef = useRef<Worker[]>([]);
  const simulationRunIdRef = useRef(0);

  const {
    avgAttemptsPerLevel,
    totalAvgAttempts,
    attemptsPercentiles,
    avgCostsPerLevel,
    totalAvgCost,
  } = useMemo(
    () => calculate(currentLevel, targetLevel, costsPerLevel),
    [currentLevel, targetLevel, costsPerLevel],
  );

  useEffect(() => {
    simulationWorkersRef.current.forEach((worker) => worker.terminate());
    simulationWorkersRef.current = [];
    simulationRunIdRef.current++;
    setSimulationStatus("idle");
    setTotalCostPercentiles({ ...DEFAULT_PERCENTILES });
  }, [currentLevel, targetLevel, encludeCost, costsPerLevel]);

  useEffect(() => {
    return () => {
      simulationWorkersRef.current.forEach((worker) => worker.terminate());
    };
  }, []);

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

  const handleSimulate = () => {
    simulationWorkersRef.current.forEach((worker) => worker.terminate());
    simulationWorkersRef.current = [];

    const runId = simulationRunIdRef.current + 1;
    simulationRunIdRef.current = runId;
    setSimulationStatus("running");

    const workerCount = getSimulationWorkerCount();
    const baseSimulationCount = Math.floor(SIMULATION_COUNT / workerCount);
    const remainingSimulationCount = SIMULATION_COUNT % workerCount;
    const costResultChunks: Float64Array[] = [];
    let completedWorkerCount = 0;

    const handleWorkerError = () => {
      if (simulationRunIdRef.current !== runId) {
        return;
      }

      simulationWorkersRef.current.forEach((worker) => worker.terminate());
      simulationWorkersRef.current = [];
      setSimulationStatus("idle");
    };

    for (let i = 0; i < workerCount; i++) {
      const workerSimulationCount =
        baseSimulationCount + (i < remainingSimulationCount ? 1 : 0);

      const worker = new Worker(
        new URL("../workers/cost-simulation.worker.ts", import.meta.url),
        { type: "module" },
      );

      simulationWorkersRef.current.push(worker);

      worker.onmessage = (
        event: MessageEvent<CostSimulationWorkerResponse>,
      ) => {
        if (simulationRunIdRef.current !== runId) {
          worker.terminate();
          return;
        }

        costResultChunks.push(new Float64Array(event.data.costResultsBuffer));
        completedWorkerCount++;
        worker.terminate();

        if (completedWorkerCount !== workerCount) {
          return;
        }

        const costResults = new Float64Array(SIMULATION_COUNT);
        let offset = 0;

        for (const chunk of costResultChunks) {
          costResults.set(chunk, offset);
          offset += chunk.length;
        }

        costResults.sort();
        setTotalCostPercentiles(getPercentiles(costResults));
        setSimulationStatus("completed");
        simulationWorkersRef.current = [];
      };

      worker.onerror = handleWorkerError;

      worker.postMessage({
        currentLevel,
        targetLevel,
        costsPerLevel: [...costsPerLevel],
        simulationCount: workerSimulationCount,
      });
    }
  };

  return (
    <VStack className="min-h-screen w-full gap-8 px-4 py-4">
      <VStack className="gap-2">
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
        <label>
          <HStack className="cursor-pointer gap-1">
            <Checkbox
              checked={encludeCost}
              onChange={(event) => setEncludeCost(event.target.checked)}
            />
            <span>강화 비용 계산</span>
          </HStack>
        </label>
        {encludeCost && (
          <table>
            <thead>
              <tr>
                <th className="w-1/2 border px-4 py-3 text-left">강화 등급</th>
                <th className="w-1/2 border px-4 py-3 text-right">강화 비용</th>
              </tr>
            </thead>
            <tbody>
              {range(targetLevel - 1).map((_, idx) => {
                const level = (idx + 1) as EnhancementLevel;

                return (
                  <tr key={level}>
                    <td className="border px-4 py-2.5">
                      <HStack className="justify-start gap-2">
                        <EnhancementBadge level={level} />
                        <IconArrowDown className="size-5 -rotate-90 text-gray-600" />
                        <EnhancementBadge
                          level={(level + 1) as EnhancementLevel}
                        />
                      </HStack>
                    </td>
                    <td className="border px-4 py-2.5">
                      <HStack className="gap-1">
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={formatNumber(costsPerLevel[idx])}
                          onChange={(event) => {
                            const valueWithoutCommas =
                              event.target.value.replaceAll(",", "");
                            if (!/^\d*$/.test(valueWithoutCommas)) {
                              return;
                            }
                            setCostsPerLevel((prev) => {
                              const next = [...prev];
                              next[idx] = Number(valueWithoutCommas);
                              return next;
                            });
                          }}
                        />
                        <span>BP</span>
                      </HStack>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </VStack>
      <VStack className="w-full items-stretch gap-3">
        <h2 className="text-xl font-semibold">
          각 강화 등급별 평균 강화 시도 횟수
        </h2>
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-80 table-fixed border-collapse border text-sm sm:text-base">
            <thead>
              <tr>
                <th className="w-1/2 border px-4 py-3 text-left font-semibold">
                  강화 등급
                </th>
                <th className="w-1/2 border px-4 py-3 text-right font-semibold">
                  평균 강화 시도 횟수
                </th>
              </tr>
            </thead>
            <tbody>
              {avgAttemptsPerLevel.map((attempts, idx) => (
                <tr key={idx}>
                  <td className="border px-4 py-2.5 align-middle">
                    <HStack key={idx} className="justify-start gap-2">
                      <EnhancementBadge level={(idx + 1) as EnhancementLevel} />
                      <IconArrowDown className="size-5 -rotate-90 text-gray-600" />
                      <EnhancementBadge level={(idx + 2) as EnhancementLevel} />
                    </HStack>
                  </td>
                  <td className="border px-4 py-2.5 text-right align-middle font-medium tabular-nums">
                    <p>{formatFixedNumber(attempts, 2)}회</p>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th className="border px-4 py-3 text-left font-semibold">
                  합계
                </th>
                <th className="border px-4 py-3 text-right font-semibold tabular-nums">
                  {formatFixedNumber(totalAvgAttempts, 2)}회
                </th>
              </tr>
            </tfoot>
          </table>
        </div>
      </VStack>
      <VStack className="w-full items-stretch gap-3">
        <h2 className="text-xl font-semibold">총 강화 시도 횟수 백분위수</h2>
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-72 table-fixed border-collapse border text-sm sm:text-base">
            <thead>
              <tr>
                <th className="w-1/2 border px-4 py-3 text-left font-semibold">
                  백분위
                </th>
                <th className="w-1/2 border px-4 py-3 text-right font-semibold">
                  총 강화 시도 횟수
                </th>
              </tr>
            </thead>
            <tbody>
              {PERCENTILE_LABELS_BY_PERCENTILE.map(({ percentile, key }) => (
                <tr key={percentile}>
                  <td className="border px-4 py-2.5 align-middle">
                    <div className="flex w-full items-center justify-start">
                      <p className="font-semibold">{percentile}</p>
                    </div>
                  </td>
                  <td className="border px-4 py-2.5 text-right align-middle font-medium tabular-nums">
                    <div className="flex w-full items-center justify-end">
                      {attemptsPercentiles[key] > 0
                        ? `${formatNumber(attemptsPercentiles[key])}회`
                        : "100,000회 이상"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </VStack>
      {encludeCost && (
        <>
          <VStack className="w-full items-stretch gap-3">
            <h2 className="text-xl font-semibold">
              각 강화 등급별 평균 강화 시도 비용
            </h2>
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-80 table-fixed border-collapse border text-sm sm:text-base">
                <thead>
                  <tr>
                    <th className="w-1/2 border px-4 py-3 text-left font-semibold">
                      강화 등급
                    </th>
                    <th className="w-1/2 border px-4 py-3 text-right font-semibold">
                      평균 강화 시도 비용
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {avgCostsPerLevel.map((cost, idx) => (
                    <tr key={idx}>
                      <td className="border px-4 py-2.5 align-middle">
                        <HStack key={idx} className="justify-start gap-2">
                          <EnhancementBadge
                            level={(idx + 1) as EnhancementLevel}
                          />
                          <IconArrowDown className="size-5 -rotate-90 text-gray-600" />
                          <EnhancementBadge
                            level={(idx + 2) as EnhancementLevel}
                          />
                        </HStack>
                      </td>
                      <td className="border px-4 py-2.5 text-right align-middle font-medium tabular-nums">
                        <p>{formatBP(cost)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th className="border px-4 py-3 text-left font-semibold">
                      합계
                    </th>
                    <th className="border px-4 py-3 text-right font-semibold tabular-nums">
                      {formatBP(totalAvgCost)}
                    </th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </VStack>
          <VStack className="w-full items-stretch gap-3">
            <HStack className="w-full justify-between">
              <h2 className="text-xl font-semibold">
                총 강화 시도 비용 백분위수
              </h2>
              <Button
                color="blue"
                size="sm"
                loading={simulationStatus === "running"}
                onClick={handleSimulate}
              >
                계산하기
              </Button>
            </HStack>
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-72 table-fixed border-collapse border text-sm sm:text-base">
                <thead>
                  <tr>
                    <th className="w-1/2 border px-4 py-3 text-left font-semibold">
                      백분위
                    </th>
                    <th className="w-1/2 border px-4 py-3 text-right font-semibold">
                      총 강화 시도 비용
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PERCENTILE_LABELS_BY_PERCENTILE.map(
                    ({ percentile, key }) => (
                      <tr key={percentile}>
                        <td className="border px-4 py-2.5 align-middle">
                          <div className="flex w-full items-center justify-start">
                            <p className="font-semibold">{percentile}</p>
                          </div>
                        </td>
                        <td className="border px-4 py-2.5 text-right align-middle font-medium tabular-nums">
                          <div className="flex w-full items-center justify-end">
                            {simulationStatus === "idle"
                              ? "계산 전"
                              : simulationStatus === "running"
                                ? "계산 중..."
                                : formatBP(totalCostPercentiles[key] ?? 0)}
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </VStack>
        </>
      )}
    </VStack>
  );
};

export default HomePage;
