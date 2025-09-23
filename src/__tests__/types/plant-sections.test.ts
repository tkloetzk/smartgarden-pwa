import { PlantRecord } from "@/types/database";
import { PlantFactory, TestDataBuilder } from "@/test/utils";

describe("Plant Section Support", () => {
  beforeEach(() => {
    // Reset factory counters for predictable test data
    PlantFactory.resetCounter();
  });

  describe("PlantRecord with section field", () => {
    it("should create a plant without a section", () => {
      const plant = PlantFactory.lettuce();

      expect(plant.section).toBeUndefined();
      expect(plant.location).toBe("Main Garden");
      expect(plant.container).toBe("Raised Bed A");
    });

    it("should create a plant with a section", () => {
      const plant = PlantFactory.withSection("Row 1 - 6\" section at 0\"");

      expect(plant.section).toBe("Row 1 - 6\" section at 0\"");
      expect(plant.location).toBe("Main Garden");
    });

    it("should support various section naming conventions", () => {
      const testCases = [
        "Row 1 - 6\" section at 0\"",
        "Section A",
        "North End - 12\" strip",
        "Wave 1 Area",
        "Left Half",
      ];

      testCases.forEach((sectionName) => {
        const plant = PlantFactory.withSection(sectionName);
        expect(plant.section).toBe(sectionName);
      });
    });
  });

  describe("Plant grouping by section", () => {
    // Use factory to create succession planting scenario
    const successionPlants = PlantFactory.succession(2, 7); // 2 waves, 7 days apart
    const plantWithoutSection = PlantFactory.lettuce({ section: undefined });
    const plants: PlantRecord[] = [...successionPlants, plantWithoutSection];

    const groupBySection = (plants: PlantRecord[]) => {
      const grouped = plants.reduce((acc, plant) => {
        const key = plant.section || "no-section";
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(plant);
        return acc;
      }, {} as Record<string, PlantRecord[]>);

      return Object.entries(grouped).map(([section, plants]) => ({
        section: section === "no-section" ? undefined : section,
        plants,
        count: plants.length,
      }));
    };

    it("should group plants by section correctly", () => {
      const grouped = groupBySection(plants);

      expect(grouped).toHaveLength(3); // Two succession sections + no-section

      const section0 = grouped.find(g => g.section === "Row 1 - 6\" section at 0\"");
      expect(section0?.plants).toHaveLength(1);
      expect(section0?.count).toBe(1);

      const section6 = grouped.find(g => g.section === "Row 1 - 6\" section at 6\"");
      expect(section6?.plants).toHaveLength(1);
      expect(section6?.count).toBe(1);

      const noSection = grouped.find(g => g.section === undefined);
      expect(noSection?.plants).toHaveLength(1);
      expect(noSection?.count).toBe(1);
    });

    it("should identify succession waves by different sections", () => {
      const successionPlants = plants.filter(p => p.section?.includes("Row 1"));
      const wave1 = successionPlants.filter(p => p.section?.includes("at 0\""));
      const wave2 = successionPlants.filter(p => p.section?.includes("at 6\""));

      expect(wave1).toHaveLength(1);
      expect(wave2).toHaveLength(1);

      // Wave 1 should be older (planted earlier)
      expect(wave1[0].plantedDate.getTime()).toBeLessThan(wave2[0].plantedDate.getTime());
    });
  });

  describe("Section-based plant identification", () => {
    it("should find all plants in a specific section", () => {
      const plants = [
        PlantFactory.withSection("Row 1 - Section A"),
        PlantFactory.withSection("Row 1 - Section A"),
        PlantFactory.withSection("Row 1 - Section B"),
        PlantFactory.lettuce(), // No section
      ];

      const findPlantsInSection = (plants: PlantRecord[], sectionName: string) => {
        return plants.filter(plant => plant.section === sectionName);
      };

      const sectionAPlants = findPlantsInSection(plants, "Row 1 - Section A");
      expect(sectionAPlants).toHaveLength(2);
      expect(sectionAPlants.every(p => p.section === "Row 1 - Section A")).toBe(true);

      const sectionBPlants = findPlantsInSection(plants, "Row 1 - Section B");
      expect(sectionBPlants).toHaveLength(1);
      expect(sectionBPlants[0].section).toBe("Row 1 - Section B");

      const nonExistentSection = findPlantsInSection(plants, "Row 2");
      expect(nonExistentSection).toHaveLength(0);
    });
  });

  describe("Full location description", () => {
    it("should generate comprehensive location strings", () => {
      const getFullLocation = (plant: PlantRecord) => {
        const parts = [plant.location];
        if (plant.container && plant.container !== plant.location) {
          parts.push(plant.container);
        }
        if (plant.section) {
          parts.push(plant.section);
        }
        return parts.join(" > ");
      };

      const plant1 = PlantFactory.lettuce({
        location: "Main Garden",
        container: "Raised Bed A",
        section: "Row 1 - 6\" section at 0\"",
      });

      const plant2 = PlantFactory.lettuce({
        location: "Main Garden",
        container: "Main Garden", // Same as location
        section: "North End",
      });

      const plant3 = PlantFactory.lettuce({
        location: "Greenhouse",
        container: "Table 1",
        section: undefined,
      });

      expect(getFullLocation(plant1)).toBe("Main Garden > Raised Bed A > Row 1 - 6\" section at 0\"");
      expect(getFullLocation(plant2)).toBe("Main Garden > North End");
      expect(getFullLocation(plant3)).toBe("Greenhouse > Table 1");
    });
  });
});