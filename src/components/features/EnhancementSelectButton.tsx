import { ButtonHTMLAttributes, useEffect, useRef } from "react";

import { IconChevronDown } from "@/assets/icons";
import { enhanceTierVariants } from "@/styles/variants/enhancement-tier-variants";
import { EnhancementLevel } from "@/types";
import { range } from "@/utils/array";
import { getEnhancementTier } from "@/utils/enhancement-tier";

import { HStack, VStack } from "../ui";

interface EnhancementSelectButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  level: EnhancementLevel;
  onChangeLevel: (value: EnhancementLevel) => void;
  isLevelSelectorOpen: boolean;
  onToggleLevelSelector: () => void;
  onCloseLevelSelector: () => void;
}

const EnhancementSelectButton = ({
  level,
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
        className={enhanceTierVariants({ type: "button", tier })}
        {...props}
      >
        <HStack className="gap-2.5">
          <span>{level}</span>
          <IconChevronDown className="h-5" />
        </HStack>
      </button>

      {isLevelSelectorOpen && (
        <HStack className="absolute top-full left-0 z-10 items-start gap-1 bg-white pt-1">
          <VStack className="h-full gap-1">
            {(range(1, 8) as EnhancementLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => onChangeLevel(level)}
                className={enhanceTierVariants({
                  type: "button",
                  tier: getEnhancementTier(level),
                })}
              >
                {level}
              </button>
            ))}
          </VStack>
          <VStack className="h-full gap-1">
            {(range(8, 14) as EnhancementLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => onChangeLevel(level)}
                className={enhanceTierVariants({
                  type: "button",
                  tier: getEnhancementTier(level),
                })}
              >
                {level}
              </button>
            ))}
          </VStack>
        </HStack>
      )}
    </div>
  );
};

export default EnhancementSelectButton;
