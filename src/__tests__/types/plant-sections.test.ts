import { PlantRecord } from "@/types/database";
import { subDays } from "date-fns";

describe("Plant Section Support", () => {
  const createMockPlant = (overrides: Partial<PlantRecord> = {}): PlantRecord => ({
    id: "test-plant-id",
    varietyId: "lettuce-variety",
    varietyName: "Butterhead Lettuce",
    name: "Test Lettuce",
    plantedDate: subDays(new Date(), 7),
    location: "Main Garden Bed",
    container: "Raised Bed A",
    isActive: true,
    createdAt: new Date(),
    ...overrides,
  });

  describe("PlantRecord with section field", () => {
    it("should create a plant without a section", () => {
      const plant = createMockPlant();
      
      expect(plant.section).toBeUndefined();
      expect(plant.location).toBe("Main Garden Bed");
      expect(plant.container).toBe("Raised Bed A");
    });

    it("should create a plant with a section", () => {
      const plant = createMockPlant({
        section: "Row 1 - 6\" section at 0\"",
      });
      
      expect(plant.section).toBe("Row 1 - 6\" section at 0\"");
      expect(plant.location).toBe("Main Garden Bed");
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
        const plant = createMockPlant({ section: sectionName });
        expect(plant.section).toBe(sectionName);
      });
    });
  });

  describe("Plant grouping by section", () => {
    const plants: PlantRecord[] = [
      createMockPlant({
        id: "plant-1",
        section: "Row 1 - 6\" section at 0\"",
        plantedDate: subDays(new Date(), 14),
      }),
      createMockPlant({
        id: "plant-2",
        section: "Row 1 - 6\" section at 0\"",
        plantedDate: subDays(new Date(), 14),
      }),
      createMockPlant({
        id: "plant-3",
        section: "Row 1 - 6\" section at 6\"",
        plantedDate: subDays(new Date(), 7),
      }),
      createMockPlant({
        id: "plant-4",
        section: "Row 1 - 6\" section at 6\"",
        plantedDate: subDays(new Date(), 7),
      }),
      createMockPlant({
        id: "plant-5",
        // No section
      }),
    ];

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
      
      expect(grouped).toHaveLength(3); // Two sections + no-section
      
      const section0 = grouped.find(g => g.section === "Row 1 - 6\" section at 0\"");
      expect(section0?.plants).toHaveLength(2);
      expect(section0?.count).toBe(2);
      
      const section6 = grouped.find(g => g.section === "Row 1 - 6\" section at 6\"");
      expect(section6?.plants).toHaveLength(2);
      expect(section6?.count).toBe(2);
      
      const noSection = grouped.find(g => g.section === undefined);
      expect(noSection?.plants).toHaveLength(1);
      expect(noSection?.count).toBe(1);
    });

    it("should identify succession waves by different sections", () => {
      const successionPlants = plants.filter(p => p.section?.includes("Row 1"));
      const wave1 = successionPlants.filter(p => p.section?.includes("at 0\""));
      const wave2 = successionPlants.filter(p => p.section?.includes("at 6\""));
      
      expect(wave1).toHaveLength(2);
      expect(wave2).toHaveLength(2);
      
      // Wave 1 should be older (planted 14 days ago)
      expect(wave1[0].plantedDate.getTime()).toBeLessThan(wave2[0].plantedDate.getTime());
    });
  });

  describe("Section-based plant identification", () => {
    it("should find all plants in a specific section", () => {
      const plants = [
        createMockPlant({ id: "1", section: "Row 1 - Section A" }),
        createMockPlant({ id: "2", section: "Row 1 - Section A" }),
        createMockPlant({ id: "3", section: "Row 1 - Section B" }),
        createMockPlant({ id: "4" }), // No section
      ];

      const findPlantsInSection = (plants: PlantRecord[], sectionName: string) => {
        return plants.filter(plant => plant.section === sectionName);
      };

      const sectionAPlants = findPlantsInSection(plants, "Row 1 - Section A");
      expect(sectionAPlants).toHaveLength(2);
      expect(sectionAPlants.map(p => p.id)).toEqual(["1", "2"]);

      const sectionBPlants = findPlantsInSection(plants, "Row 1 - Section B");
      expect(sectionBPlants).toHaveLength(1);
      expect(sectionBPlants[0].id).toBe("3");

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

      const plant1 = createMockPlant({
        location: "Main Garden",
        container: "Raised Bed A",
        section: "Row 1 - 6\" section at 0\"",
      });

      const plant2 = createMockPlant({
        location: "Main Garden",
        container: "Main Garden", // Same as location
        section: "North End",
      });

      const plant3 = createMockPlant({
        location: "Greenhouse",
        container: "Table 1",
      });

      expect(getFullLocation(plant1)).toBe("Main Garden > Raised Bed A > Row 1 - 6\" section at 0\"");
      expect(getFullLocation(plant2)).toBe("Main Garden > North End");
      expect(getFullLocation(plant3)).toBe("Greenhouse > Table 1");
    });
  });
});