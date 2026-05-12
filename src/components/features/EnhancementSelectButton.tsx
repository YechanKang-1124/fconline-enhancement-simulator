import { ButtonHTMLAttributes, useEffect, useRef } from "react";

import { IconChevronDown } from "@/assets/icons";
import { enhanceTierVariants } from "@/styles/variants/enhancement-tier-variants";
import { EnhancementLevel } from "@/types";
import { range } from "@/utils/array";
import { getEnhancementTier } from "@/utils/enhancement-tier";

import { HStack, VStack } from "../ui";

interface EnhancementSelectButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  level: EnhancementLevel;
  minLevel?: number;
  maxLevel?: number;
  onChangeLevel: (value: EnhancementLevel) => void;
  isLevelSelectorOpen: boolean;
  onToggleLevelSelector: () => void;
  onCloseLevelSelector: () => void;
}

const EnhancementSelectButton = ({
  level,
  minLevel = 1,
  maxLevel = 13,
  onChangeLevel,
  isLevelSelectorOpen,
  onToggleLevelSelector,
  onCloseLevelSelector,
  ...props
}: EnhancementSelectButtonProps) => {
  const tier = getEnhancementTier(level);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeLevelSelector = (event: Event) => {
      if (
        containerRef.current == null ||
        containerRef.current.contains(event.target as Node)
      ) {
        return;
      }
      onCloseLevelSelector();
    };

    document.addEventListener("pointerdown", closeLevelSelector);

    return () => {
      document.removeEventListener("pointerdown", closeLevelSelector);
    };
  }, [containerRef, onCloseLevelSelector]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={onToggleLevelSelector}
        className={enhanceTierVariants({
          size: "lg",
          tier,
          className: "cursor-pointer",
        })}
        {...props}
      >
        <HStack className="gap-2.5">
          <span>{level}</span>
          <IconChevronDown className="h-5" />
        </HStack>
      </button>

      {isLevelSelectorOpen && (
        <HStack className="absolute top-full left-0 z-10 mt-1 -translate-x-2 items-start gap-1 rounded-sm border border-gray-400 bg-white p-2 shadow-lg">
          {minLevel < 8 && (
            <VStack className="h-full gap-1">
              {(
                range(minLevel, Math.min(7, maxLevel) + 1) as EnhancementLevel[]
              ).map((level) => (
                <button
                  key={level}
                  onClick={() => onChangeLevel(level)}
                  className={enhanceTierVariants({
                    size: "lg",
                    tier: getEnhancementTier(level),
                    className: "cursor-pointer",
                  })}
                >
                  {level}
                </button>
              ))}
            </VStack>
          )}
          {maxLevel >= 8 && (
            <VStack className="h-full gap-1">
              {(
                range(Math.max(8, minLevel), maxLevel + 1) as EnhancementLevel[]
              ).map((level) => (
                <button
                  key={level}
                  onClick={() => onChangeLevel(level)}
                  className={enhanceTierVariants({
                    size: "lg",
                    tier: getEnhancementTier(level),
                    className: "cursor-pointer",
                  })}
                >
                  {level}
                </button>
              ))}
            </VStack>
          )}
        </HStack>
      )}
    </div>
  );
};

export default EnhancementSelectButton;
