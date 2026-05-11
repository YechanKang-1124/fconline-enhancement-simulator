import { IconArrowDown } from "@/assets/icons";
import { EnhancementLevel } from "@/types";

import { HStack } from "../ui";
import EnhancementBadge from "./EnhancementBadge";

interface EnhancementStepIndicatorProps {
  level: EnhancementLevel;
}

const EnhancementStepIndicator = ({ level }: EnhancementStepIndicatorProps) => {
  return (
    <HStack className="justify-center gap-2">
      <EnhancementBadge level={level} />
      <IconArrowDown className="size-5 -rotate-90 text-gray-600" />
      <EnhancementBadge level={(level + 1) as EnhancementLevel} />
    </HStack>
  );
};

export default EnhancementStepIndicator;
