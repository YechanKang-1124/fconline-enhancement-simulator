import { cva } from "class-variance-authority";
import { useEffect, useMemo, useRef, useState } from "react";

import { IconChevronDown } from "@/assets/icons";
import {
  EnhancementSelectButton,
  EnhancementStepIndicator,
} from "@/components/features";
import {
  Button,
  Collapse,
  HStack,
  Input,
  Spinner,
  VStack,
} from "@/components/ui";
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

const TABS = ["attempts", "cost"] as const;

type Tab = (typeof TABS)[number];

const PERCENTILE_KEYS_BY_PERCENTILE: {
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
  const [costsPerLevel, setCostsPerLevel] = useState<number[]>(() =>
    range(12).map(() => 0),
  );
  const [simulationStatus, setSimulationStatus] = useState<
    "idle" | "running" | "completed"
  >("idle");
  const [totalCostPercentiles, setTotalCostPercentiles] = useState<Percentiles>(
    { ...DEFAULT_PERCENTILES },
  );
  const [selectedTab, setSelectedTab] = useState<Tab>("attempts");

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
  }, [currentLevel, targetLevel, costsPerLevel]);

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
    if (level < 13 && level >= targetLevel) {
      setTargetLevel((level + 1) as EnhancementLevel);
    }
    onCloseCurrentLevelSelector();
  };
  const handleChangeTargetLevel = (level: EnhancementLevel) => {
    setTargetLevel(level);
    if (level >= 2 && level <= currentLevel) {
      setCurrentLevel((level - 1) as EnhancementLevel);
    }
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

  const { isOpen: isCostInputTableOpen, onToggle: onToggleCostInputTable } =
    useDisclosure(true);

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
    <VStack className="min-h-screen w-full gap-4 pt-4 pb-16">
      <VStack className="gap-3 py-4">
        <HStack className="gap-4">
          <span className={levelSelectorLabelVariants()}>현재 강화 등급</span>
          <EnhancementSelectButton
            level={currentLevel}
            maxLevel={12}
            onChangeLevel={handleChangeCurrentLevel}
            isLevelSelectorOpen={isCurrentLevelSelectorOpen}
            onToggleLevelSelector={handleToggleCurrentLevelSelector}
            onCloseLevelSelector={onCloseCurrentLevelSelector}
          />
        </HStack>
        <HStack className="gap-4">
          <span className={levelSelectorLabelVariants()}>목표 강화 등급</span>
          <EnhancementSelectButton
            level={targetLevel}
            minLevel={2}
            onChangeLevel={handleChangeTargetLevel}
            isLevelSelectorOpen={isTargetLevelSelectorOpen}
            onToggleLevelSelector={handleToggleTargetLevelSelector}
            onCloseLevelSelector={onCloseTargetLevelSelector}
          />
        </HStack>
      </VStack>
      <HStack className="w-full">
        {TABS.map((tab) => (
          <a
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={tabVariants({ selected: tab === selectedTab })}
          >
            <span>{tab === "attempts" ? "강화 시도 횟수" : "강화 비용"}</span>
          </a>
        ))}
      </HStack>
      <VStack className="gap-8 px-6 pt-2">
        {selectedTab === "attempts" && (
          <>
            <VStack className={tableContainerVariants()}>
              <TableTitle>강화 등급별 평균 강화 시도 횟수</TableTitle>
              <Table
                headers={["강화 등급", "평균 강화 시도 횟수"]}
                labels={getEnhacementStepIndicators(targetLevel)}
                values={avgAttemptsPerLevel.map(
                  (attempts) => `${formatFixedNumber(attempts, 2)} 회`,
                )}
                total={`${formatFixedNumber(totalAvgAttempts, 2)} 회`}
              />
            </VStack>
            <VStack className={tableContainerVariants()}>
              <TableTitle>총 강화 시도 횟수 백분위수</TableTitle>
              <Table
                headers={["백분위", "총 강화 시도 횟수"]}
                labels={PERCENTILE_KEYS_BY_PERCENTILE.map(
                  ({ percentile }) => percentile,
                )}
                values={PERCENTILE_KEYS_BY_PERCENTILE.map(({ key }) => {
                  const attempts = attemptsPercentiles[key];
                  return attempts > 0
                    ? `${formatNumber(attempts)} 회`
                    : "100,000 회 이상";
                })}
              />
            </VStack>
          </>
        )}
        {selectedTab === "cost" && (
          <>
            <VStack className={tableContainerVariants()}>
              <a
                onClick={onToggleCostInputTable}
                className="w-fit cursor-pointer"
              >
                <HStack className="gap-2.5">
                  <TableTitle>강화 비용 입력</TableTitle>
                  <IconChevronDown
                    className={chevronVariants({
                      isOpen: isCostInputTableOpen,
                    })}
                  />
                </HStack>
              </a>
              <Collapse isOpen={isCostInputTableOpen}>
                <Table
                  headers={["강화 등급", "강화 비용"]}
                  labels={getEnhacementStepIndicators(targetLevel)}
                  values={costsPerLevel.map((cost, idx) => (
                    <HStack key={idx} className="w-full gap-1">
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formatNumber(cost)}
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
                        className="text-end font-light"
                      />
                      <span className="font-normal">BP</span>
                    </HStack>
                  ))}
                />
              </Collapse>
            </VStack>
            <VStack className={tableContainerVariants()}>
              <TableTitle>강화 등급별 평균 강화 비용</TableTitle>
              <Table
                headers={["강화 등급", "평균 강화 비용"]}
                labels={getEnhacementStepIndicators(targetLevel)}
                values={avgCostsPerLevel.map((cost) => formatBP(cost))}
                total={formatBP(totalAvgCost)}
              />
            </VStack>
            <VStack className={tableContainerVariants()}>
              <HStack className="w-full justify-between">
                <TableTitle>총 강화 비용 백분위수</TableTitle>
                <Button
                  color="fc"
                  size="sm"
                  loading={simulationStatus === "running"}
                  onClick={handleSimulate}
                >
                  계산하기
                </Button>
              </HStack>
              <Table
                headers={["백분위", "총 강화 비용"]}
                labels={PERCENTILE_KEYS_BY_PERCENTILE.map(
                  ({ percentile }) => percentile,
                )}
                values={PERCENTILE_KEYS_BY_PERCENTILE.map(({ key }) =>
                  simulationStatus === "idle" ? (
                    "-"
                  ) : simulationStatus === "running" ? (
                    <div className="flex w-full justify-end pe-2">
                      <Spinner size="md" />
                    </div>
                  ) : (
                    formatBP(totalCostPercentiles[key] ?? 0)
                  ),
                )}
              />
            </VStack>
          </>
        )}
      </VStack>
    </VStack>
  );
};

interface TableTitleProps {
  children: React.ReactNode;
}

const TableTitle = ({ children }: TableTitleProps) => (
  <h2 className="text-xl font-semibold">{children}</h2>
);

interface TableProps {
  headers: string[];
  labels: React.ReactNode[];
  values: React.ReactNode[];
  total?: number | string;
}

const Table = ({ headers, labels, values, total }: TableProps) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full table-fixed divide-y border">
        <thead className="bg-gray-200">
          <tr className="divide-x">
            {headers.map((header, idx) => (
              <th key={idx} className="w-1/2 py-2.5 text-center font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y text-sm">
          {labels.map((label, idx) => (
            <tr key={idx} className="h-11 divide-x">
              <td className="px-4 text-center align-middle font-semibold">
                {label}
              </td>
              <td className="px-4 text-right align-middle font-light tabular-nums">
                {values[idx] ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
        {total && (
          <tfoot className="bg-gray-200">
            <tr className="divide-x">
              <th className="px-4 py-2 text-center text-base font-semibold">
                합계
              </th>
              <th className="px-4 py-2 text-right text-sm font-semibold tabular-nums">
                {total}
              </th>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

function getEnhacementStepIndicators(targetLevel: number) {
  return range(1, targetLevel).map((level) => (
    <EnhancementStepIndicator key={level} level={level as EnhancementLevel} />
  ));
}

const levelSelectorLabelVariants = cva("block text-2xl font-semibold");

const tabVariants = cva(
  "flex w-1/2 cursor-pointer items-center justify-center border-x-2 border-t-2 py-2 text-lg font-semibold",
  {
    variants: {
      selected: {
        true: "border-gray-100",
        false: "border-gray-200 bg-gray-200 text-gray-600",
      },
    },
  },
);

const tableContainerVariants = cva("w-full items-stretch gap-3");

const chevronVariants = cva("size-5 transition-transform", {
  variants: {
    isOpen: {
      true: "-rotate-180",
      false: null,
    },
  },
});

export default HomePage;
