// src/data/index.ts
import { seedVarieties, SeedVariety } from "./seedVarieties";
import { VarietyRecord } from "@/types/database";
import {
  GrowthTimeline,
  VarietyProtocols,
  StageSpecificWateringProtocol,
  StageSpecificFertilizationProtocol,
  StageSpecificLightingProtocol,
  GrowthStage
} from "@/types";
import { generateUUID } from "@/utils/cn";

// Stage name mapping (moved from seedData.ts)
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
  tuberDevelopment: "maturation",
  ongoing: "ongoing-production",
  ongoingProduction: "ongoing-production",
  harvest: "harvest",
};

// Protocol conversion functions (moved from seedData.ts)
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

// Convert SeedVariety to VarietyRecord format
const convertSeedVarietyToVarietyRecord = (
  variety: SeedVariety
): VarietyRecord => {
  const timelineData = variety.growthTimeline;

  const growthTimeline: GrowthTimeline = {
    germination:
      timelineData.germination ??
      timelineData.germinationEmergence ??
      timelineData.slipProduction ??
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

  // Generate stable IDs based on name
  const id = variety.name.toLowerCase().replace(/['\s]+/g, "-");
  const createdAt = new Date("2024-01-01"); // Stable date for consistency

  return {
    id,
    name: variety.name,
    normalizedName: variety.name.toLowerCase(),
    category: variety.category,
    growthTimeline,
    protocols,
    isEverbearing: variety.isEverbearing,
    productiveLifespan: variety.productiveLifespan,
    isCustom: false,
    createdAt,
    updatedAt: createdAt,
  };
};

// Transform all varieties once at module load
export const varieties: VarietyRecord[] = seedVarieties.map((variety) =>
  convertSeedVarietyToVarietyRecord(variety)
);

// Create lookup maps for performance
const varietyById = new Map(varieties.map((v) => [v.id, v]));
const varietyByName = new Map(varieties.map((v) => [v.name.toLowerCase(), v]));

// Export lookup functions
export const getVariety = (nameOrId: string): VarietyRecord | undefined => {
  const searchKey = nameOrId.toLowerCase();
  return (
    varietyById.get(searchKey) ||
    varietyByName.get(searchKey) ||
    varieties.find((v) => v.normalizedName === searchKey)
  );
};

export const getVarietyById = (id: string): VarietyRecord | undefined =>
  varietyById.get(id);

export const getVarietyByName = (name: string): VarietyRecord | undefined =>
  varietyByName.get(name.toLowerCase());

export const getVarietiesByCategory = (category: string): VarietyRecord[] =>
  varieties.filter((v) => v.category === category);

// For database seeding, export a function that adds timestamps
export const getVarietiesForDatabase = (): VarietyRecord[] => {
  const now = new Date();
  return varieties.map((v) => ({
    ...v,
    id: generateUUID(), // Generate real UUIDs for database
    createdAt: now,
    updatedAt: now,
  }));
};

// Export the raw seed varieties if needed
export { seedVarieties };
