// src/__tests__/utils/plantFactory.ts
import {
  PlantRecord,
  CareRecord,
  VarietyRecord,
  WateringDetails,
  FertilizingDetails,
  ObservationDetails,
  HarvestDetails,
  TransplantDetails,
  CareActivityDetails,
} from "@/types/database";
import { GrowthStage, CareActivityType } from "@/types/core";
import { UpcomingTask, TaskGroup } from "@/types/scheduling";

// Helper function to generate unique IDs
const generateId = (prefix: string = ""): string =>
  `${prefix}${prefix ? "-" : ""}${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;

// Core Plant Factory
export const createMockPlant = (
  overrides: Partial<PlantRecord> = {}
): PlantRecord => {
  const now = new Date();
  const defaultPlantedDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

  return {
    id: generateId("plant"),
    varietyId: "default-variety-id",
    varietyName: "Test Variety",
    name: "Test Plant",
    plantedDate: defaultPlantedDate,
    currentStage: "vegetative",
    location: "Indoor",
    container: "5 gallon pot",
    soilMix: "Standard potting mix",
    isActive: true,
    notes: ["Initial planting notes"],
    reminderPreferences: {
      watering: true,
      fertilizing: true,
      observation: true,
      lighting: true,
      pruning: true,
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

// Variety Factory
export const createMockVariety = (
  overrides: Partial<VarietyRecord> = {}
): VarietyRecord => {
  const now = new Date();

  return {
    id: generateId("variety"),
    name: "Test Variety",
    category: "leafy-greens",
    growthTimeline: {
      germination: 7,
      seedling: 14,
      vegetative: 21,
      maturation: 45,
    },
    protocols: {
      watering: {
        vegetative: {
          trigger: { moistureLevel: 3 },
          target: { moistureLevel: 7 },
          volume: { amount: "16", frequency: "2-3 days" },
        },
      },
      fertilization: {
        vegetative: {
          products: [
            {
              name: "General Purpose 10-10-10",
              dilution: "1:4",
              amount: "2 tbsp",
              frequency: "bi-weekly",
              method: "soil-drench",
            },
          ],
          timing: "Apply every 2 weeks during vegetative growth",
          notes: ["Apply after watering to prevent root burn"],
        },
      },
    },
    moistureProtocols: {
      vegetative: {
        trigger: { min: 2, max: 4 },
        target: { min: 6, max: 8 },
      },
    },
    isCustom: false,
    isEverbearing: false,
    createdAt: now,
    ...overrides,
  };
};

// Care Activity Detail Factories
export const createWateringDetails = (
  overrides: Partial<WateringDetails> = {}
): WateringDetails => ({
  type: "water",
  amount: { value: 16, unit: "oz" },
  moistureReading: {
    before: 3,
    after: 7,
    scale: "1-10",
  },
  method: "top-watering",
  runoffObserved: false,
  notes: "Regular watering",
  ...overrides,
});

export const createFertilizingDetails = (
  overrides: Partial<FertilizingDetails> = {}
): FertilizingDetails => ({
  type: "fertilize",
  product: "General Purpose 10-10-10",
  dilution: "1:4",
  amount: "2 tbsp",
  method: "soil-drench",
  notes: "Bi-weekly fertilizing",
  ...overrides,
});

export const createObservationDetails = (
  overrides: Partial<ObservationDetails> = {}
): ObservationDetails => ({
  type: "observe",
  healthAssessment: "good",
  observations: "Plant looks healthy with good growth",
  photos: [],
  notes: "Weekly health check",
  ...overrides,
});

export const createHarvestDetails = (
  overrides: Partial<HarvestDetails> = {}
): HarvestDetails => ({
  type: "harvest",
  amount: "2 cups",
  quality: "excellent",
  method: "cut and come again",
  notes: "First harvest of the season",
  ...overrides,
});

export const createTransplantDetails = (
  overrides: Partial<TransplantDetails> = {}
): TransplantDetails => ({
  type: "transplant",
  fromContainer: "4 inch pot",
  toContainer: "gallon pot",
  reason: "Plant outgrew container",
  notes: "Transplanted to larger container for better root growth",
  ...overrides,
});

// Main Care Record Factory
export const createMockCareRecord = (
  plantId: string,
  activityType: CareActivityType = "water",
  overrides: Partial<CareRecord> = {}
): CareRecord => {
  const now = new Date();

  let details: CareActivityDetails;

  switch (activityType) {
    case "water":
      details = createWateringDetails();
      break;
    case "fertilize":
      details = createFertilizingDetails();
      break;
    case "observe":
      details = createObservationDetails();
      break;
    case "harvest":
      details = createHarvestDetails();
      break;
    case "transplant":
      details = createTransplantDetails();
      break;
    default:
      details = createWateringDetails();
  }

  return {
    id: generateId("care"),
    plantId,
    type: activityType,
    date: now,
    details,
    createdAt: now,
    ...overrides,
  };
};

// Task Factory
export const createMockTask = (
  overrides: Partial<UpcomingTask> = {}
): UpcomingTask => ({
  id: generateId("task"),
  plantId: generateId("plant"),
  name: "Test Plant",
  task: "Check water level",
  dueIn: "Due in 2 days",
  plantStage: "vegetative",
  dueDate: new Date(),
  priority: "medium",
  canBypass: true,
  ...overrides,
});

// Task Group Factory
export const createMockTaskGroup = (
  type: "watering" | "fertilizing" | "observation" | "maintenance" = "watering",
  overrides: Partial<TaskGroup> = {}
): TaskGroup => {
  const configs = {
    watering: { title: "Watering", emoji: "💧" },
    fertilizing: { title: "Fertilizing", emoji: "🌱" },
    observation: { title: "Health Checks", emoji: "👁" },
    maintenance: { title: "Maintenance", emoji: "✂️" },
  };

  const config = configs[type];

  return {
    type,
    title: config.title,
    emoji: config.emoji,
    tasks: [createMockTask({ task: `${config.title} task` })],
    isExpanded: true,
    ...overrides,
  };
};

// Specialized Plant Factories
export const createMockArugula = (
  overrides: Partial<PlantRecord> = {}
): PlantRecord =>
  createMockPlant({
    varietyName: "Arugula",
    name: "My Arugula",
    currentStage: "vegetative",
    container: "4 inch pot",
    ...overrides,
  });

export const createMockTomato = (
  overrides: Partial<PlantRecord> = {}
): PlantRecord =>
  createMockPlant({
    varietyName: "Roma Tomato",
    name: "Roma Tomato Plant",
    currentStage: "flowering",
    container: "5 gallon pot",
    ...overrides,
  });

export const createMockBasil = (
  overrides: Partial<PlantRecord> = {}
): PlantRecord =>
  createMockPlant({
    varietyName: "Genovese Basil",
    name: "Kitchen Basil",
    currentStage: "vegetative",
    container: "6 inch pot",
    ...overrides,
  });

// Specialized Variety Factories
export const createFastGrowingVariety = (
  overrides: Partial<VarietyRecord> = {}
): VarietyRecord =>
  createMockVariety({
    name: "Fast Growing Lettuce",
    category: "leafy-greens",
    growthTimeline: {
      germination: 3,
      seedling: 7,
      vegetative: 14,
      maturation: 30,
    },
    ...overrides,
  });

export const createSlowGrowingVariety = (
  overrides: Partial<VarietyRecord> = {}
): VarietyRecord =>
  createMockVariety({
    name: "Slow Growing Kale",
    category: "leafy-greens",
    growthTimeline: {
      germination: 10,
      seedling: 21,
      vegetative: 45,
      maturation: 90,
    },
    ...overrides,
  });

export const createEverbearingVariety = (
  overrides: Partial<VarietyRecord> = {}
): VarietyRecord =>
  createMockVariety({
    name: "Everbearing Strawberry",
    category: "berries",
    isEverbearing: true,
    productiveLifespan: 365,
    growthTimeline: {
      germination: 14,
      seedling: 28,
      vegetative: 60,
      maturation: 120,
    },
    ...overrides,
  });

// Utility Functions for Tests
export const createPlantWithHistory = (
  plantOverrides: Partial<PlantRecord> = {},
  careHistoryCount: number = 3
): { plant: PlantRecord; careHistory: CareRecord[] } => {
  const plant = createMockPlant(plantOverrides);
  const careHistory: CareRecord[] = [];

  const activities: CareActivityType[] = ["water", "fertilize", "observe"];
  const now = new Date();

  // Create care records in reverse chronological order (most recent first)
  for (let i = 0; i < careHistoryCount; i++) {
    const activityType = activities[i % activities.length];
    const daysAgo = i; // Start with 0 (today), then 1 day ago, 2 days ago, etc.
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    careHistory.push(createMockCareRecord(plant.id, activityType, { date }));
  }

  return { plant, careHistory }; // Already in most recent first order
};

export const createMultiplePlantsWithTasks = (
  count: number = 3
): {
  plants: PlantRecord[];
  tasks: UpcomingTask[];
} => {
  const plants: PlantRecord[] = [];
  const tasks: UpcomingTask[] = [];

  for (let i = 0; i < count; i++) {
    const plant = createMockPlant({
      name: `Test Plant ${i + 1}`,
      varietyName: `Variety ${i + 1}`,
    });
    plants.push(plant);

    // Create 2-3 tasks per plant
    const taskCount = 2 + (i % 2);
    for (let j = 0; j < taskCount; j++) {
      tasks.push(
        createMockTask({
          plantId: plant.id,
          name: plant.name || plant.varietyName,
          task:
            j === 0
              ? "Check water level"
              : j === 1
              ? "Fertilize"
              : "Health check",
          priority: j === 0 ? "high" : "medium",
        })
      );
    }
  }

  return { plants, tasks };
};

// Date utility factories for testing different growth stages
export const createPlantAtStage = (
  stage: GrowthStage,
  varietyTimeline = {
    germination: 7,
    seedling: 14,
    vegetative: 21,
    maturation: 45,
  },
  overrides: Partial<PlantRecord> = {}
): PlantRecord => {
  const now = new Date();
  let daysAgo: number;

  switch (stage) {
    case "germination":
      daysAgo = 3; // In middle of germination
      break;
    case "seedling":
      daysAgo = varietyTimeline.germination + 3; // In middle of seedling
      break;
    case "vegetative":
      daysAgo = varietyTimeline.germination + varietyTimeline.seedling + 5;
      break;
    case "maturation":
      daysAgo =
        varietyTimeline.germination +
        varietyTimeline.seedling +
        varietyTimeline.vegetative +
        5;
      break;
    default:
      daysAgo = 7;
  }

  const plantedDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  return createMockPlant({
    plantedDate,
    currentStage: stage,
    ...overrides,
  });
};
