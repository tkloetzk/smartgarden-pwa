// src/db/seedData.ts
import { db } from "@/types/database";
import { seedVarieties, SeedVariety } from "@/data/seedVarieties";
import {
  GrowthTimeline,
  VarietyProtocols,
  FertilizationScheduleItem,
} from "@/types/protocols";
import { GrowthStage } from "@/types/core";

// Type for the watering protocol structure from seedVarieties
interface StageSpecificWateringProtocol {
  [key: string]: {
    trigger?: { moistureLevel?: string | number };
    target?: { moistureLevel?: string | number };
    volume?: { amount?: string | number; frequency?: string };
  };
}

// Type for the fertilization protocol structure from seedVarieties
interface StageSpecificFertilizationProtocol {
  [key: string]: {
    schedule?: FertilizationScheduleItem[];
    notes?: string[];
  };
}

// Type for the lighting protocol structure from seedVarieties
interface StageSpecificLightingProtocol {
  [key: string]: {
    ppfd?: { min: number; max: number; unit: string };
    photoperiod?: { hours: number };
    dli?: { min: number; max: number; unit: string };
  };
}

const convertSeedVarietyToVarietyRecord = (variety: SeedVariety) => {
  const timelineData = variety.growthTimeline;

  const growthTimeline: GrowthTimeline = {
    germination:
      timelineData.germination ||
      timelineData.germinationEmergence ||
      timelineData.slipProduction ||
      0,
    seedling: timelineData.seedling || 7,
    vegetative:
      timelineData.vegetative ||
      timelineData.vegetativeGrowth ||
      timelineData.vegetativeVining ||
      21,
    maturation: timelineData.maturation || 60,
    rootDevelopment: timelineData.rootDevelopment || 14,
  };

  // CRITICAL FIX: Ensure all protocols are copied, not just a subset.
  let protocols: VarietyProtocols | undefined;
  if (variety.protocols) {
    protocols = {
      watering: variety.protocols.watering
        ? convertWateringProtocol(variety.protocols.watering)
        : undefined,
      fertilization: variety.protocols.fertilization
        ? convertFertilizationProtocol(variety.protocols.fertilization)
        : undefined,
      lighting: variety.protocols.lighting
        ? convertLightingProtocol(variety.protocols.lighting)
        : undefined,
      // Add the missing protocols here:
      environment: variety.protocols.environment,
      soilMixture: variety.protocols.soilMixture,
      container: variety.protocols.container,
      succession: variety.protocols.succession,
      specialRequirements: variety.protocols.specialRequirements,
    };
  }

  return {
    name: variety.name,
    category: variety.category,
    growthTimeline,
    protocols, // This will now contain the complete protocol data
    isEverbearing: variety.isEverbearing,
    productiveLifespan: variety.productiveLifespan,
    isCustom: false,
  };
};

const stageNameMapping: { [key: string]: GrowthStage } = {
  germination: "germination",
  germinationEmergence: "germination",
  slipProduction: "germination",
  seedling: "seedling",
  establishment: "seedling",
  vegetative: "vegetative",
  vegetativeGrowth: "vegetative",
  vegetativeVining: "vegetative",
  rootDevelopment: "vegetative",
  flowering: "flowering",
  flowerBudFormation: "flowering",
  fruiting: "fruiting",
  fruitingHarvesting: "fruiting",
  podSetMaturation: "fruiting",
  maturation: "maturation",
  "ongoing-production": "ongoing-production",
  ongoingProduction: "ongoing-production",
  harvest: "harvest",
};

// 1. Corrected and strongly-typed watering protocol converter
const convertWateringProtocol = (
  wateringProtocol: StageSpecificWateringProtocol
): Record<
  GrowthStage,
  {
    trigger?: { moistureLevel?: string | number };
    target?: { moistureLevel?: string | number };
    volume?: { amount?: string | number; frequency?: string };
  }
> => {
  const result: Partial<
    Record<
      GrowthStage,
      {
        trigger?: { moistureLevel?: string | number };
        target?: { moistureLevel?: string | number };
        volume?: { amount?: string | number; frequency?: string };
      }
    >
  > = {};

  for (const [stage, stageData] of Object.entries(wateringProtocol)) {
    const canonicalStage = stageNameMapping[stage];
    if (canonicalStage) {
      result[canonicalStage] = {
        trigger: stageData.trigger
          ? { moistureLevel: stageData.trigger.moistureLevel }
          : undefined,
        target: stageData.target
          ? { moistureLevel: stageData.target.moistureLevel }
          : undefined,
        volume: stageData.volume
          ? {
              amount: stageData.volume.amount,
              frequency: stageData.volume.frequency,
            }
          : undefined,
      };
    }
  }
  return result as ReturnType<typeof convertWateringProtocol>;
};

// 2. Corrected fertilization protocol converter
const convertFertilizationProtocol = (
  fertilizationProtocol: StageSpecificFertilizationProtocol
): Record<
  GrowthStage,
  {
    schedule?: FertilizationScheduleItem[];
    notes?: string[];
  }
> => {
  const result: Partial<
    Record<
      GrowthStage,
      {
        schedule?: FertilizationScheduleItem[];
        notes?: string[];
      }
    >
  > = {};

  for (const [stage, stageData] of Object.entries(fertilizationProtocol)) {
    const canonicalStage = stageNameMapping[stage];
    if (canonicalStage) {
      result[canonicalStage] = {
        schedule: stageData.schedule || [],
        notes: stageData.notes || [],
      };
    }
  }
  return result as ReturnType<typeof convertFertilizationProtocol>;
};

// 3. Corrected lighting protocol converter
const convertLightingProtocol = (
  lightingProtocol: StageSpecificLightingProtocol
): Record<
  GrowthStage,
  {
    ppfd?: { min: number; max: number; unit: string };
    photoperiod?: { hours: number };
    dli?: { min: number; max: number; unit: string };
  }
> => {
  const result: Partial<
    Record<
      GrowthStage,
      {
        ppfd?: { min: number; max: number; unit: string };
        photoperiod?: { hours: number };
        dli?: { min: number; max: number; unit: string };
      }
    >
  > = {};

  for (const [stage, stageData] of Object.entries(lightingProtocol)) {
    const canonicalStage = stageNameMapping[stage];
    if (canonicalStage) {
      result[canonicalStage] = {
        ppfd: stageData.ppfd,
        photoperiod: stageData.photoperiod,
        dli: stageData.dli,
      };
    }
  }
  return result as ReturnType<typeof convertLightingProtocol>;
};

export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log("🌱 Initializing database with seed data...");

    // Clear existing data
    await db.varieties.clear();

    // Add varieties from seed data
    for (const variety of seedVarieties) {
      const convertedVariety = convertSeedVarietyToVarietyRecord(variety);

      await db.varieties.add({
        id: crypto.randomUUID(),
        ...convertedVariety,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    console.log(`✅ Successfully seeded ${seedVarieties.length} varieties`);
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
};

// Export initializeDatabase as default
export default initializeDatabase;
