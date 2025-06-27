/* eslint-disable @typescript-eslint/no-explicit-any */
// // src/db/seedData.ts
// import { db } from "@/types/database";
// import { seedVarieties, SeedVariety } from "@/data/seedVarieties";
// import {
//   GrowthTimeline,
//   VarietyProtocols,
//   FertilizationScheduleItem,
// } from "@/types/protocols";
// import { GrowthStage } from "@/types/core";

// // Type for the watering protocol structure from seedVarieties
// interface StageSpecificWateringProtocol {
//   [key: string]: {
//     trigger?: { moistureLevel?: string | number };
//     target?: { moistureLevel?: string | number };
//     volume?: { amount?: string | number; frequency?: string };
//   };
// }

// // Type for the fertilization protocol structure from seedVarieties
// interface StageSpecificFertilizationProtocol {
//   [key: string]: {
//     schedule?: FertilizationScheduleItem[];
//     notes?: string[];
//   };
// }

// // Type for the lighting protocol structure from seedVarieties
// interface StageSpecificLightingProtocol {
//   [key: string]: {
//     ppfd?: { min: number; max: number; unit: string };
//     photoperiod?: { hours: number };
//     dli?: { min: number; max: number; unit: string };
//   };
// }

// const convertSeedVarietyToVarietyRecord = (variety: SeedVariety) => {
//   const timelineData = variety.growthTimeline;

//   const growthTimeline: GrowthTimeline = {
//     germination:
//       timelineData.germination ||
//       timelineData.germinationEmergence ||
//       timelineData.slipProduction ||
//       0,
//     seedling: timelineData.seedling || timelineData.establishment || 7,
//     vegetative:
//       timelineData.vegetative ||
//       timelineData.vegetativeGrowth ||
//       timelineData.vegetativeVining ||
//       21,
//     // FIX: Check for all possible maturation-related keys from the seed data
//     maturation:
//       timelineData.maturation ||
//       timelineData.fruiting ||
//       timelineData.fruitingHarvesting ||
//       timelineData.podSetMaturation ||
//       60,
//     rootDevelopment: timelineData.rootDevelopment || 14,
//   };

//   // [Rest of the function is unchanged]...
//   let protocols: VarietyProtocols | undefined;
//   if (variety.protocols) {
//     protocols = {
//       watering: variety.protocols.watering
//         ? convertWateringProtocol(variety.protocols.watering)
//         : undefined,
//       fertilization: variety.protocols.fertilization
//         ? convertFertilizationProtocol(variety.protocols.fertilization)
//         : undefined,
//       lighting: variety.protocols.lighting
//         ? convertLightingProtocol(variety.protocols.lighting)
//         : undefined,

//       environment: variety.protocols.environment,
//       soilMixture: variety.protocols.soilMixture,
//       container: variety.protocols.container,
//       succession: variety.protocols.succession,
//       specialRequirements: variety.protocols.specialRequirements,
//     };
//   }

//   return {
//     name: variety.name,
//     normalizedName: variety.name.toLowerCase(),
//     category: variety.category,
//     growthTimeline,
//     protocols,
//     isEverbearing: variety.isEverbearing,
//     productiveLifespan: variety.productiveLifespan,
//     isCustom: false,
//   };
// };

// const stageNameMapping: { [key: string]: GrowthStage } = {
//   germination: "germination",
//   germinationEmergence: "germination",
//   slipProduction: "germination",
//   seedling: "seedling",
//   establishment: "seedling",
//   vegetative: "vegetative",
//   vegetativeGrowth: "vegetative",
//   vegetativeVining: "vegetative",
//   rootDevelopment: "vegetative",
//   flowering: "flowering",
//   flowerBudFormation: "flowering",
//   fruiting: "fruiting",
//   fruitingHarvesting: "fruiting",
//   podSetMaturation: "fruiting",
//   maturation: "maturation",
//   "ongoing-production": "ongoing-production",
//   ongoingProduction: "ongoing-production",
//   harvest: "harvest",
// };

// // 1. Corrected and strongly-typed watering protocol converter
// const convertWateringProtocol = (
//   wateringProtocol: StageSpecificWateringProtocol
// ): Record<
//   GrowthStage,
//   {
//     trigger?: { moistureLevel?: string | number };
//     target?: { moistureLevel?: string | number };
//     volume?: { amount?: string | number; frequency?: string };
//   }
// > => {
//   const result: Partial<
//     Record<
//       GrowthStage,
//       {
//         trigger?: { moistureLevel?: string | number };
//         target?: { moistureLevel?: string | number };
//         volume?: { amount?: string | number; frequency?: string };
//       }
//     >
//   > = {};

//   for (const [stage, stageData] of Object.entries(wateringProtocol)) {
//     const canonicalStage = stageNameMapping[stage];
//     if (canonicalStage) {
//       result[canonicalStage] = {
//         trigger: stageData.trigger
//           ? { moistureLevel: stageData.trigger.moistureLevel }
//           : undefined,
//         target: stageData.target
//           ? { moistureLevel: stageData.target.moistureLevel }
//           : undefined,
//         volume: stageData.volume
//           ? {
//               amount: stageData.volume.amount,
//               frequency: stageData.volume.frequency,
//             }
//           : undefined,
//       };
//     }
//   }
//   return result as ReturnType<typeof convertWateringProtocol>;
// };

// // 2. Corrected fertilization protocol converter
// const convertFertilizationProtocol = (
//   fertilizationProtocol: StageSpecificFertilizationProtocol
// ): Record<
//   GrowthStage,
//   {
//     schedule?: FertilizationScheduleItem[];
//     notes?: string[];
//   }
// > => {
//   const result: Partial<
//     Record<
//       GrowthStage,
//       {
//         schedule?: FertilizationScheduleItem[];
//         notes?: string[];
//       }
//     >
//   > = {};

//   for (const [stage, stageData] of Object.entries(fertilizationProtocol)) {
//     const canonicalStage = stageNameMapping[stage];
//     if (canonicalStage) {
//       result[canonicalStage] = {
//         schedule: stageData.schedule || [],
//         notes: stageData.notes || [],
//       };
//     }
//   }
//   return result as ReturnType<typeof convertFertilizationProtocol>;
// };

// // 3. Corrected lighting protocol converter
// const convertLightingProtocol = (
//   lightingProtocol: StageSpecificLightingProtocol
// ): Record<
//   GrowthStage,
//   {
//     ppfd?: { min: number; max: number; unit: string };
//     photoperiod?: { hours: number };
//     dli?: { min: number; max: number; unit: string };
//   }
// > => {
//   const result: Partial<
//     Record<
//       GrowthStage,
//       {
//         ppfd?: { min: number; max: number; unit: string };
//         photoperiod?: { hours: number };
//         dli?: { min: number; max: number; unit: string };
//       }
//     >
//   > = {};

//   for (const [stage, stageData] of Object.entries(lightingProtocol)) {
//     const canonicalStage = stageNameMapping[stage];
//     if (canonicalStage) {
//       result[canonicalStage] = {
//         ppfd: stageData.ppfd,
//         photoperiod: stageData.photoperiod,
//         dli: stageData.dli,
//       };
//     }
//   }
//   return result as ReturnType<typeof convertLightingProtocol>;
// };

// export const initializeDatabase = async (): Promise<void> => {
//   try {
//     console.log("🌱 Initializing database with seed data...");

//     await db.varieties.clear();

//     // Use a Set to track names and prevent duplicates during seeding
//     const existingNames = new Set<string>();

//     for (const variety of seedVarieties) {
//       //
//       if (!existingNames.has(variety.name)) {
//         const convertedVariety = convertSeedVarietyToVarietyRecord(variety);

//         await db.varieties.add({
//           id: crypto.randomUUID(),
//           ...convertedVariety,
//           createdAt: new Date(),
//           updatedAt: new Date(),
//         });
//         existingNames.add(variety.name);
//       }
//     }

//     console.log(
//       `✅ Successfully seeded ${existingNames.size} unique varieties`
//     ); // Updated log message
//   } catch (error) {
//     // [cite: 1741]
//     console.error("❌ Error initializing database:", error); // [cite: 1741]
//     throw error; // [cite: 1741]
//   }
// };

// // Export initializeDatabase as default
// export default initializeDatabase;

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

// This mapping helps standardize different stage names used in the seed data.
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
  "ongoing-production": "ongoing-production",
  ongoingProduction: "ongoing-production",
  ongoing: "ongoing-production", // Added alias
  harvest: "harvest",
};

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
  const result: Partial<Record<GrowthStage, any>> = {};
  for (const [stage, stageData] of Object.entries(wateringProtocol)) {
    const canonicalStage = stageNameMapping[stage];
    if (canonicalStage && stageData) {
      result[canonicalStage] = stageData;
    }
  }
  return result as Record<GrowthStage, any>;
};

const convertFertilizationProtocol = (
  fertilizationProtocol: StageSpecificFertilizationProtocol
): Record<GrowthStage, any> => {
  const result: Partial<Record<GrowthStage, any>> = {};
  for (const [stage, stageData] of Object.entries(fertilizationProtocol)) {
    const canonicalStage = stageNameMapping[stage];
    if (canonicalStage && stageData) {
      result[canonicalStage] = stageData;
    }
  }
  return result as Record<GrowthStage, any>;
};

const convertLightingProtocol = (
  lightingProtocol: StageSpecificLightingProtocol
): Record<GrowthStage, any> => {
  const result: Partial<Record<GrowthStage, any>> = {};
  for (const [stage, stageData] of Object.entries(lightingProtocol)) {
    const canonicalStage = stageNameMapping[stage];
    if (canonicalStage && stageData) {
      result[canonicalStage] = stageData;
    }
  }
  return result as Record<GrowthStage, any>;
};

const convertSeedVarietyToVarietyRecord = (variety: SeedVariety) => {
  const timelineData = variety.growthTimeline;

  // This logic is now corrected to handle all aliases from the seed data.
  const growthTimeline: GrowthTimeline = {
    germination:
      timelineData.germination ||
      timelineData.germinationEmergence ||
      timelineData.slipProduction ||
      timelineData.caneEstablishment ||
      0,
    seedling: timelineData.seedling || timelineData.establishment || 7,
    vegetative:
      timelineData.vegetative ||
      timelineData.vegetativeGrowth ||
      timelineData.vegetativeVining ||
      21,
    maturation:
      timelineData.maturation ||
      timelineData.fruiting ||
      timelineData.fruitingHarvesting ||
      timelineData.podSetMaturation ||
      timelineData.floweringFruiting ||
      timelineData.ongoing ||
      timelineData.tuberDevelopment ||
      60,
    rootDevelopment: timelineData.rootDevelopment || 14,
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
  try {
    const existingCount = await db.varieties.count();
    // Only seed if the database is empty
    if (existingCount > 0) {
      console.log("✅ Database already seeded.");
      return;
    }

    console.log("🌱 Initializing database with seed data...");

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
    console.error("❌ Error initializing database:", error);
    throw error;
  }
};
