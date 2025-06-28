import { db } from "@/types/database";
import { seedVarieties, SeedVariety } from "@/data/seedVarieties";
import {
  GrowthTimeline,
  VarietyProtocols,
  StageSpecificWateringProtocol,
  StageSpecificFertilizationProtocol,
  StageSpecificLightingProtocol,
} from "@/types/protocols";
import { GrowthStage } from "@/types/core";

export let isDatabaseInitialized = false;
export const resetDatabaseInitializationFlag = () => {
  isDatabaseInitialized = false;
};
// --- END NEW CODE ---

const stageNameMapping: { [key: string]: GrowthStage } = {
  germination: "germination",
  germinationEmergence: "germination",
  slipProduction: "germination",
  seedling: "seedling",
  establishment: "seedling",
  vegetative: "vegetative",
  vegetativeGrowth: "vegetative",
  vegetativeVining: "vegetative",
  rootDevelopment: "vegetative", // Mapping root development to vegetative for protocol purposes
  flowering: "flowering",
  flowerBudFormation: "flowering",
  fruiting: "fruiting",
  fruitingHarvesting: "fruiting",
  podSetMaturation: "fruiting",
  maturation: "maturation",
  tuberDevelopment: "maturation", // Tuber development is a form of maturation
  ongoing: "ongoing-production",
  ongoingProduction: "ongoing-production",
  harvest: "harvest",
};

const convertWateringProtocol = (
  wateringProtocol: StageSpecificWateringProtocol
): VarietyProtocols["watering"] => {
  const result: Partial<VarietyProtocols["watering"]> = {};
  for (const [stage, stageData] of Object.entries(wateringProtocol)) {
    const canonicalStage = stageNameMapping[stage];
    if (canonicalStage && stageData) {
      result[canonicalStage] = stageData;
    }
  }
  return result as VarietyProtocols["watering"];
};

const convertFertilizationProtocol = (
  fertilizationProtocol: StageSpecificFertilizationProtocol
): VarietyProtocols["fertilization"] => {
  const result: Partial<VarietyProtocols["fertilization"]> = {};
  for (const [stage, stageData] of Object.entries(fertilizationProtocol)) {
    const canonicalStage = stageNameMapping[stage];
    if (canonicalStage && stageData) {
      result[canonicalStage] = stageData;
    }
  }
  return result as VarietyProtocols["fertilization"];
};

const convertLightingProtocol = (
  lightingProtocol: StageSpecificLightingProtocol
): VarietyProtocols["lighting"] => {
  const result: Partial<VarietyProtocols["lighting"]> = {};
  for (const [stage, stageData] of Object.entries(lightingProtocol)) {
    const canonicalStage = stageNameMapping[stage];
    if (canonicalStage && stageData) {
      result[canonicalStage] = stageData;
    }
  }
  return result as VarietyProtocols["lighting"];
};

const convertSeedVarietyToVarietyRecord = (variety: SeedVariety) => {
  const timelineData = variety.growthTimeline;

  const growthTimeline: GrowthTimeline = {
    germination:
      timelineData.germination ??
      timelineData.germinationEmergence ??
      timelineData.slipProduction ??
      timelineData.caneEstablishment ??
      0,
    seedling: timelineData.seedling ?? timelineData.establishment ?? 7,
    vegetative:
      timelineData.vegetative ??
      timelineData.vegetativeGrowth ??
      timelineData.vegetativeVining ??
      21,
    maturation:
      timelineData.maturation ??
      timelineData.fruiting ??
      timelineData.fruitingHarvesting ??
      timelineData.podSetMaturation ??
      timelineData.floweringFruiting ??
      timelineData.ongoing ??
      timelineData.tuberDevelopment ??
      60,
    rootDevelopment: timelineData.rootDevelopment ?? 14,
  };

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
      environment: variety.protocols.environment,
      soilMixture: variety.protocols.soilMixture,
      container: variety.protocols.container,
      succession: variety.protocols.succession,
      specialRequirements: variety.protocols.specialRequirements,
    };
  }

  return {
    name: variety.name,
    normalizedName: variety.name.toLowerCase(),
    category: variety.category,
    growthTimeline,
    protocols,
    isEverbearing: variety.isEverbearing,
    productiveLifespan: variety.productiveLifespan,
    isCustom: false,
  };
};

export const initializeDatabase = async (): Promise<void> => {
  if (isDatabaseInitialized) {
    return;
  }

  try {
    const existingCount = await db.varieties.count();
    if (existingCount > 0) {
      console.log("✅ Database already seeded.");
      isDatabaseInitialized = true;
      return;
    }

    console.log("🌱 Initializing database with seed data...");
    isDatabaseInitialized = true;

    const uniqueVarieties = new Map<string, SeedVariety>();
    for (const variety of seedVarieties) {
      if (!uniqueVarieties.has(variety.name.toLowerCase())) {
        uniqueVarieties.set(variety.name.toLowerCase(), variety);
      }
    }

    for (const variety of uniqueVarieties.values()) {
      const convertedVariety = convertSeedVarietyToVarietyRecord(variety);
      await db.varieties.add({
        id: crypto.randomUUID(),
        ...convertedVariety,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    console.log(
      `✅ Successfully seeded ${uniqueVarieties.size} unique varieties`
    );
  } catch (error) {
    isDatabaseInitialized = false;
    console.error("❌ Error initializing database:", error);

    // --- START: Type Correction for Catch Block ---
    if (error instanceof Error && error.name === "ConstraintError") {
      console.warn(
        "Seeding aborted, likely due to a race condition. The database should be correctly seeded by another process."
      );
      isDatabaseInitialized = true; // We can safely assume the other process will succeed or has succeeded.
    } else {
      throw error;
    }
  }
};
