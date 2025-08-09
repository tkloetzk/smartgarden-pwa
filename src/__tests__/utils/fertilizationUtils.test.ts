// src/utils/__tests__/fertilizationUtils.test.ts
import { describe, it, expect } from "@jest/globals";
import { ApplicationMethod } from "@/types";
import {
  getMethodDescription,
  getMethodDisplay,
  getMethodIcon,
  requiresWater,
  getWaterAmountForMethod,
} from "@/utils/fertilizationUtils";

describe("fertilizationUtils", () => {
  describe("getMethodIcon", () => {
    it("should return correct icons for all valid application methods", () => {
      expect(getMethodIcon("soil-drench")).toBe("💧");
      expect(getMethodIcon("foliar-spray")).toBe("🌿");
      expect(getMethodIcon("top-dress")).toBe("🥄");
      expect(getMethodIcon("side-dress")).toBe("🔄");
    });

    it("should return default icon for unknown methods", () => {
      expect(getMethodIcon("unknown-method")).toBe("🌱");
      expect(getMethodIcon("")).toBe("🌱");
      expect(getMethodIcon("random-string")).toBe("🌱");
    });

    it("should handle ApplicationMethod type correctly", () => {
      const validMethod: ApplicationMethod = "soil-drench";
      expect(getMethodIcon(validMethod)).toBe("💧");
    });

    it("should handle mix-in-soil method with default icon", () => {
      expect(getMethodIcon("mix-in-soil")).toBe("🌱");
    });
  });

  describe("getMethodDisplay", () => {
    it("should return proper display names for all methods", () => {
      expect(getMethodDisplay("soil-drench")).toBe("Soil Drench");
      expect(getMethodDisplay("foliar-spray")).toBe("Foliar Spray");
      expect(getMethodDisplay("top-dress")).toBe("Top Dress");
      expect(getMethodDisplay("side-dress")).toBe("Side Dress");
    });

    it("should handle unknown methods gracefully", () => {
      expect(getMethodDisplay("unknown-method")).toBe("unknown-method");
      expect(getMethodDisplay("")).toBe("");
      expect(getMethodDisplay("custom-method-name")).toBe("custom-method-name");
    });

    it("should return input string for mix-in-soil method", () => {
      expect(getMethodDisplay("mix-in-soil")).toBe("mix-in-soil");
    });

    it("should handle ApplicationMethod type correctly", () => {
      const validMethod: ApplicationMethod = "foliar-spray";
      expect(getMethodDisplay(validMethod)).toBe("Foliar Spray");
    });

    it("should preserve casing for unknown methods", () => {
      expect(getMethodDisplay("Custom-Method")).toBe("Custom-Method");
      expect(getMethodDisplay("UPPERCASE")).toBe("UPPERCASE");
    });
  });

  describe("getMethodDescription", () => {
    it("should return detailed descriptions for all known methods", () => {
      expect(getMethodDescription("soil-drench")).toBe(
        "Apply diluted fertilizer solution directly to soil, watering thoroughly"
      );
      expect(getMethodDescription("foliar-spray")).toBe(
        "Spray diluted fertilizer directly onto leaves and stems"
      );
      expect(getMethodDescription("top-dress")).toBe(
        "Sprinkle dry fertilizer on soil surface and work in lightly"
      );
      expect(getMethodDescription("side-dress")).toBe(
        "Apply fertilizer around the base of the plant, avoiding direct contact with stems"
      );
    });

    it("should return default description for unknown methods", () => {
      const defaultDescription = "Follow fertilizer package instructions";
      expect(getMethodDescription("unknown-method")).toBe(defaultDescription);
      expect(getMethodDescription("")).toBe(defaultDescription);
      expect(getMethodDescription("custom-method")).toBe(defaultDescription);
    });

    it("should handle ApplicationMethod type correctly", () => {
      const validMethod: ApplicationMethod = "top-dress";
      expect(getMethodDescription(validMethod)).toBe(
        "Sprinkle dry fertilizer on soil surface and work in lightly"
      );
    });

    it("should return default description for mix-in-soil method", () => {
      expect(getMethodDescription("mix-in-soil")).toBe(
        "Follow fertilizer package instructions"
      );
    });
  });

  describe("requiresWater", () => {
    it("should return true for all known fertilizer application methods", () => {
      expect(requiresWater("soil-drench")).toBe(true);
      expect(requiresWater("foliar-spray")).toBe(true);
      expect(requiresWater("top-dress")).toBe(true);
      expect(requiresWater("side-dress")).toBe(true);
    });

    it("should return true for unknown methods (all fertilizers need water)", () => {
      expect(requiresWater("unknown-method")).toBe(true);
      expect(requiresWater("")).toBe(true);
      expect(requiresWater("custom-method")).toBe(true);
    });

    it("should handle ApplicationMethod type correctly", () => {
      const soilDrenchMethod: ApplicationMethod = "soil-drench";
      const foliarMethod: ApplicationMethod = "foliar-spray";
      const topDressMethod: ApplicationMethod = "top-dress";
      const sideDressMethod: ApplicationMethod = "side-dress";

      expect(requiresWater(soilDrenchMethod)).toBe(true);
      expect(requiresWater(foliarMethod)).toBe(true);
      expect(requiresWater(topDressMethod)).toBe(true);
      expect(requiresWater(sideDressMethod)).toBe(true);
    });

    it("should return true regardless of case (all methods need water)", () => {
      expect(requiresWater("Soil-Drench")).toBe(true);
      expect(requiresWater("SOIL-DRENCH")).toBe(true);
      expect(requiresWater("soil-DRENCH")).toBe(true);
    });
  });

  describe("getWaterAmountForMethod", () => {
    it("should return appropriate water amounts for different methods", () => {
      expect(getWaterAmountForMethod("soil-drench")).toEqual({ amount: 250, unit: "ml" });
      expect(getWaterAmountForMethod("foliar-spray")).toEqual({ amount: 100, unit: "ml" });
      expect(getWaterAmountForMethod("top-dress")).toEqual({ amount: 200, unit: "ml" });
      expect(getWaterAmountForMethod("side-dress")).toEqual({ amount: 200, unit: "ml" });
    });

    it("should use provided fertilizer amount when available", () => {
      expect(getWaterAmountForMethod("soil-drench", 500)).toEqual({ amount: 500, unit: "ml" });
      expect(getWaterAmountForMethod("foliar-spray", 50)).toEqual({ amount: 50, unit: "ml" });
      expect(getWaterAmountForMethod("top-dress", 300)).toEqual({ amount: 300, unit: "ml" });
    });

    it("should handle unknown methods with default amount", () => {
      expect(getWaterAmountForMethod("unknown-method")).toEqual({ amount: 150, unit: "ml" });
      expect(getWaterAmountForMethod("")).toEqual({ amount: 150, unit: "ml" });
    });

    it("should use provided amount for unknown methods too", () => {
      expect(getWaterAmountForMethod("unknown-method", 400)).toEqual({ amount: 400, unit: "ml" });
    });
  });

  describe("edge cases and type safety", () => {
    it("should handle all functions consistently with empty strings", () => {
      expect(getMethodIcon("")).toBe("🌱");
      expect(getMethodDisplay("")).toBe("");
      expect(getMethodDescription("")).toBe(
        "Follow fertilizer package instructions"
      );
      expect(requiresWater("")).toBe(true);
    });

    it("should handle all functions consistently with special characters", () => {
      const specialInput = "special@#$%method";
      expect(getMethodIcon(specialInput)).toBe("🌱");
      expect(getMethodDisplay(specialInput)).toBe(specialInput);
      expect(getMethodDescription(specialInput)).toBe(
        "Follow fertilizer package instructions"
      );
      expect(requiresWater(specialInput)).toBe(true);
    });

    it("should handle all ApplicationMethod values consistently", () => {
      const allMethods: ApplicationMethod[] = [
        "soil-drench",
        "foliar-spray",
        "top-dress",
        "mix-in-soil",
      ];

      allMethods.forEach((method) => {
        expect(typeof getMethodIcon(method)).toBe("string");
        expect(typeof getMethodDisplay(method)).toBe("string");
        expect(typeof getMethodDescription(method)).toBe("string");
        expect(typeof requiresWater(method)).toBe("boolean");
      });
    });

    it("should handle side-dress method consistently across all functions", () => {
      expect(getMethodIcon("side-dress")).toBe("🔄");
      expect(getMethodDisplay("side-dress")).toBe("Side Dress");
      expect(getMethodDescription("side-dress")).toBe(
        "Apply fertilizer around the base of the plant, avoiding direct contact with stems"
      );
      expect(requiresWater("side-dress")).toBe(true);
    });
  });
});
