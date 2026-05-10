import { enhanceTierVariants } from "@/styles/variants/enhancement-tier-variants";
import { EnhancementLevel } from "@/types";
import { getEnhancementTier } from "@/utils/enhancement-tier";

interface EnhancementBadgeProps {
  level: EnhancementLevel;
}

const EnhancementBadge = ({ level }: EnhancementBadgeProps) => {
  const tier = getEnhancementTier(level);

  return (
    <div className={enhanceTierVariants({ size: "md", tier })}>{level}</div>
  );
};

export default EnhancementBadge;
