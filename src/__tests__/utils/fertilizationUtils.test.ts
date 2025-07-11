// src/utils/__tests__/fertilizationUtils.test.ts
import { describe, it, expect } from "@jest/globals";
import { ApplicationMethod } from "@/types";
import {
  getMethodDescription,
  getMethodDisplay,
  getMethodIcon,
  requiresWater,
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
    it("should return true only for soil-drench method", () => {
      expect(requiresWater("soil-drench")).toBe(true);
    });

    it("should return false for all other known methods", () => {
      expect(requiresWater("foliar-spray")).toBe(false);
      expect(requiresWater("top-dress")).toBe(false);
      expect(requiresWater("side-dress")).toBe(false);
      expect(requiresWater("mix-in-soil")).toBe(false);
    });

    it("should return false for unknown methods", () => {
      expect(requiresWater("unknown-method")).toBe(false);
      expect(requiresWater("")).toBe(false);
      expect(requiresWater("custom-method")).toBe(false);
    });

    it("should handle ApplicationMethod type correctly", () => {
      const soilDrenchMethod: ApplicationMethod = "soil-drench";
      const foliarMethod: ApplicationMethod = "foliar-spray";

      expect(requiresWater(soilDrenchMethod)).toBe(true);
      expect(requiresWater(foliarMethod)).toBe(false);
    });

    it("should be case-sensitive", () => {
      expect(requiresWater("Soil-Drench")).toBe(false);
      expect(requiresWater("SOIL-DRENCH")).toBe(false);
      expect(requiresWater("soil-DRENCH")).toBe(false);
    });
  });

  describe("edge cases and type safety", () => {
    it("should handle all functions consistently with empty strings", () => {
      expect(getMethodIcon("")).toBe("🌱");
      expect(getMethodDisplay("")).toBe("");
      expect(getMethodDescription("")).toBe(
        "Follow fertilizer package instructions"
      );
      expect(requiresWater("")).toBe(false);
    });

    it("should handle all functions consistently with special characters", () => {
      const specialInput = "special@#$%method";
      expect(getMethodIcon(specialInput)).toBe("🌱");
      expect(getMethodDisplay(specialInput)).toBe(specialInput);
      expect(getMethodDescription(specialInput)).toBe(
        "Follow fertilizer package instructions"
      );
      expect(requiresWater(specialInput)).toBe(false);
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
      expect(requiresWater("side-dress")).toBe(false);
    });
  });
});
