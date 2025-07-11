// Add to utils/fertilizationUtils.ts
import { ApplicationMethod } from "@/types";

export const getMethodIcon = (method: ApplicationMethod | string) => {
  switch (method) {
    case "soil-drench":
      return "💧";
    case "foliar-spray":
      return "🌿";
    case "top-dress":
      return "🥄";
    case "side-dress":
      return "🔄";
    default:
      return "🌱";
  }
};

export const getMethodDisplay = (method: ApplicationMethod | string) => {
  switch (method) {
    case "soil-drench":
      return "Soil Drench";
    case "foliar-spray":
      return "Foliar Spray";
    case "top-dress":
      return "Top Dress";
    case "side-dress":
      return "Side Dress";
    default:
      return method;
  }
};

export const getMethodDescription = (method: ApplicationMethod | string) => {
  switch (method) {
    case "soil-drench":
      return "Apply diluted fertilizer solution directly to soil, watering thoroughly";
    case "foliar-spray":
      return "Spray diluted fertilizer directly onto leaves and stems";
    case "top-dress":
      return "Sprinkle dry fertilizer on soil surface and work in lightly";
    case "side-dress":
      return "Apply fertilizer around the base of the plant, avoiding direct contact with stems";
    default:
      return "Follow fertilizer package instructions";
  }
};

export const requiresWater = (method: ApplicationMethod | string): boolean => {
  return method === "soil-drench";
};
