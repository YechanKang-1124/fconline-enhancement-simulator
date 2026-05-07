import { EnhancementLevel, EnhancementTier } from "@/types";

export const getEnhancementTier = (
  level: EnhancementLevel,
): EnhancementTier => {
  if (level <= 1) {
    return "iron";
  }
  if (level <= 4) {
    return "bronze";
  }
  if (level <= 7) {
    return "silver";
  }
  if (level <= 10) {
    return "gold";
  }
  return "platinum";
};
