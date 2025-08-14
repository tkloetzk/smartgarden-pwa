import { PlantCategory } from "@/types";

import {
  StageSpecificWateringProtocol,
  StageSpecificLightingProtocol,
  StageSpecificFertilizationProtocol,
  EnvironmentalProtocol,
  SoilMixture,
  ContainerRequirements,
  SuccessionProtocol,
} from "@/types";

export interface ComprehensivePlantProtocols {
  lighting?: StageSpecificLightingProtocol;
  watering?: StageSpecificWateringProtocol;
  fertilization?: StageSpecificFertilizationProtocol;
  environment?: EnvironmentalProtocol;
  soilMixture?: SoilMixture;
  container?: ContainerRequirements;
  succession?: SuccessionProtocol;
  specialRequirements?: string[];
}

export interface SeedVariety {
  name: string;
  category: PlantCategory;
  growthTimeline: {
    [stageName: string]: number; // ← Allow any stage names
  };
  protocols?: ComprehensivePlantProtocols;
  isEverbearing?: boolean;
  productiveLifespan?: number; // Days before replacement recommended
}

/**
 * Greek Oregano (730 days - 2 years): Not specified in document
English Thyme (1095 days - 3 years): Not specified in document
Rosemary (1825 days - 5 years): Document only mentions "6-12 months to fully mature"
Strawberries (730 days - 2 years): Document mentions day-neutral varieties but not specific lifespan
Caroline Raspberries (1095 days - 3 years): Not specified in document
 */
export const seedVarieties: SeedVariety[] = [
  {
    name: "Astro Arugula",
    category: "leafy-greens",
    isEverbearing: true,
    productiveLifespan: 56, // Approx. 8-week lifecycle [cite: 346]
    growthTimeline: {
      germination: 7, // [cite: 167]
      seedling: 14, // [cite: 168]
      vegetative: 14, // [cite: 168]
      maturation: 37, // [cite: 345]
    },
    protocols: {
      lighting: {
        vegetative: {
          ppfd: { min: 200, max: 300, unit: "µmol/m²/s" },
          photoperiod: { hours: 12, maxHours: 16 },
          dli: { min: 8.6, max: 17.3, unit: "mol/m²/day" },
          notes: ["Increased PPFD for better leaf development and flavor"],
        },
        maturation: {
          ppfd: { min: 200, max: 300, unit: "µmol/m²/s" },
          photoperiod: { hours: 12, maxHours: 14 },
          dli: { min: 8.6, max: 15.1, unit: "mol/m²/day" },
          notes: ["Maintain consistent lighting for continued harvest"],
        },
      },
      watering: {
        germination: {
          trigger: { moistureLevel: "3-4" }, // [cite: 167]
          target: { moistureLevel: "6-7" }, // [cite: 167]
          volume: { amount: "2-4 fl oz", frequency: "2-3x/week" }, // [cite: 167]
        },
        seedling: {
          trigger: { moistureLevel: "3-4" }, // [cite: 168]
          target: { moistureLevel: "6-7" }, // [cite: 168]
          volume: { amount: "2-4 fl oz", frequency: "2-3x/week" }, // [cite: 168]
        },
        vegetative: {
          trigger: { moistureLevel: "3-4" }, // [cite: 168]
          target: { moistureLevel: "6-7" }, // [cite: 168]
          volume: { amount: "8-12 fl oz", frequency: "2-3x/week" }, // [cite: 168]
        },
      },
      fertilization: {
        seedling: {
          schedule: [
            {
              taskName: "Light Fish Emulsion",
              details: { 
                product: "Fish Emulsion", 
                dilution: "1-2 Tbsp/gal",
                method: "soil-drench"
              }, // [cite: 168]
              startDays: 14, // After true leaves appear [cite: 168]
              frequencyDays: 14,
              repeatCount: 1,
            },
          ],
        },
        vegetative: {
          schedule: [
            {
              taskName: "Regular Fish Emulsion",
              details: { 
                product: "Fish Emulsion", 
                dilution: "1-2 Tbsp/gal",
                method: "soil-drench"
              }, // [cite: 168]
              startDays: 28,
              frequencyDays: 14,
              repeatCount: 2,
            },
          ],
        },
      },
    },
  },
  {
    name: "Baby's Leaf Spinach",
    category: "leafy-greens",
    isEverbearing: true, // For cut-and-come-again harvesting
    productiveLifespan: 60, // From plan notes [cite: 269, 270]
    growthTimeline: {
      germination: 7, // [cite: 169]
      seedling: 14, // "Week 1-3" [cite: 169]
      vegetative: 9, // "Week 4-6" [cite: 169]
      maturation: 30, // [cite: 269]
    },
    protocols: {
      watering: {
        germination: {
          trigger: { moistureLevel: "<4" }, // [cite: 169]
          target: { moistureLevel: "6" }, // [cite: 169]
          volume: { amount: "Mist as needed", frequency: "Daily" }, // [cite: 169]
        },
        seedling: {
          trigger: { moistureLevel: "<4" }, // [cite: 169]
          target: { moistureLevel: "6" }, // [cite: 169]
          volume: { amount: "Mist as needed", frequency: "As needed" }, // [cite: 169]
        },
        vegetative: {
          trigger: { moistureLevel: "<4" }, // [cite: 169]
          target: { moistureLevel: "6" }, // [cite: 169]
          volume: { amount: "8-12 oz per container", frequency: "every 2-3 days" }, // Updated frequency
        },
      },
      fertilization: {
        seedling: {
          schedule: [
            {
              taskName: "Light Fish Emulsion",
              details: { 
                product: "Fish emulsion", 
                dilution: "2 Tbsp/gal",
                method: "soil-drench"
              }, // [cite: 169]
              startDays: 14,
              frequencyDays: 14,
              repeatCount: 1,
            },
          ],
        },
        vegetative: {
          schedule: [
            {
              taskName: "Regular Fish Emulsion",
              details: { 
                product: "Fish emulsion", 
                dilution: "2 Tbsp/gal",
                method: "soil-drench"
              }, // [cite: 169]
              startDays: 28,
              frequencyDays: 14,
              repeatCount: 2,
            },
          ],
        },
      },
    },
  },
  {
    name: "May Queen Lettuce",
    category: "leafy-greens",
    isEverbearing: true,
    productiveLifespan: 60, // [cite: 173]
    growthTimeline: {
      germination: 10, // [cite: 172]
      seedling: 20, // "Days 10-25/30" [cite: 172]
      vegetative: 20, // "Days 25/30 - 40/45" [cite: 172]
      maturation: 60, // "full heads 45-60 days" [cite: 173]
    },
    protocols: {
      watering: {
        germination: {
          trigger: { moistureLevel: "Keep surface moist" }, // [cite: 172]
          target: { moistureLevel: "7-8" }, // [cite: 172]
          volume: { amount: "16-32 oz", frequency: "Daily/as needed" }, // [cite: 172]
        },
        seedling: {
          trigger: { moistureLevel: "3-4" }, // [cite: 172]
          target: { moistureLevel: "8-10" }, // [cite: 172]
          volume: { amount: "0.5-1 gal", frequency: "Every 1-3 days" }, // [cite: 172]
        },
        vegetative: {
          trigger: { moistureLevel: "3-4" }, // [cite: 172]
          target: { moistureLevel: "8-10" }, // [cite: 172]
          volume: { amount: "0.75-1.5 gal", frequency: "Every 2-3 days" }, // [cite: 172]
        },
      },
      fertilization: {
        seedling: {
          schedule: [
            {
              taskName: "Diluted Fish Emulsion",
              details: {
                product: "Fish emulsion/fish+kelp blend",
                dilution: "0.5-1 Tbsp/gal",
                method: "soil-drench"
              }, // [cite: 172]
              startDays: 25,
              frequencyDays: 14,
              repeatCount: 2,
            },
          ],
        },
      },
    },
  },
  {
    name: "Rasmus Broccoli",
    category: "fruiting-plants", // Broccoli is botanically a flowering vegetable
    productiveLifespan: 95, // [cite: 198]
    growthTimeline: {
      germination: 7, // [cite: 194]
      seedling: 17, // "Days 7-24" [cite: 194]
      vegetative: 31, // "Days 25-55" [cite: 195]
      maturation: 90, // "Main head 90-110 days" [cite: 197]
    },
    protocols: {
      fertilization: {
        seedling: {
          schedule: [
            {
              taskName: "Fish + Seaweed Blend",
              details: {
                product: "Fish + Seaweed blend",
                dilution: "½ strength",
              }, // [cite: 194]
              startDays: 7,
              frequencyDays: 7,
              repeatCount: 3,
            },
          ],
        },
        vegetative: {
          schedule: [
            {
              taskName: "Fish + Seaweed Blend",
              details: {
                product: "Fish + Seaweed blend",
                dilution: "full strength",
              }, // [cite: 195]
              startDays: 28,
              frequencyDays: 7,
              repeatCount: 4,
            },
            {
              taskName: "Calcium Supplementation (Crown Initiation)",
              details: {
                product: "Calcium chloride or calcium sulfate",
                dilution: "1 tsp/gal",
                method: "foliar-spray",
              },
              startDays: 35, // During early crown formation
              frequencyDays: 7,
              repeatCount: 2,
            },
          ],
        },
        maturation: {
          schedule: [
            {
              taskName: "Reduced Fertilization (Final 3-4 weeks)",
              details: {
                product: "Fish + Seaweed blend",
                dilution: "¼ strength",
              },
              startDays: 67, // 3-4 weeks before 90-day harvest
              frequencyDays: 14,
              repeatCount: 2,
            },
          ],
        },
      },
    },
  },
  {
    name: "Stuttgarter Onions",
    category: "root-vegetables",
    productiveLifespan: 120, // [cite: 257]
    growthTimeline: {
      germination: 14, // [cite: 256]
      seedling: 42, // ~8 weeks from seed [cite: 256]
      vegetative: 42, // [cite: 154]
      maturation: 120, // [cite: 257]
    },
    protocols: {
      fertilization: {
        seedling: {
          schedule: [
            {
              taskName: "Light Nitrogen Feed",
              details: {
                product: "Fish Emulsion",
                dilution: "1 tbsp/gal",
                amount: "1-2 fl oz",
                method: "soil-drench",
              },
              startDays: 21,
              frequencyDays: 14,
              repeatCount: 2,
            },
          ],
          notes: ["Light feeding to establish strong roots and foliage."],
        },
        vegetative: {
          schedule: [
            {
              taskName: "Balanced Growth Feed",
              details: {
                product: "Balanced Liquid Fertilizer",
                dilution: "1 tsp/gal",
                amount: "2-4 fl oz",
                method: "soil-drench",
              },
              startDays: 7,
              frequencyDays: 14,
              repeatCount: 3,
            },
            {
              taskName: "Potassium Boost (Pre-Bulbing)",
              details: {
                product: "Wood ash or potassium sulfate",
                amount: "1-2 tsp/container",
                method: "top-dress",
              },
              startDays: 92, // 2 weeks before typical 106-day bulbing trigger
              frequencyDays: 0,
              repeatCount: 1,
            },
          ],
          notes: [
            "Regular balanced feeding during active growth.",
            "Light potassium boost 2 weeks before bulbing triggers helps with bulb development.",
          ],
        },
        maturation: {
          schedule: [
            {
              taskName: "Low-Nitrogen Bulb Development",
              details: {
                product: "Bone Meal",
                amount: "1 tsp/container",
                method: "top-dress",
              },
              startDays: 7,
              frequencyDays: 21,
              repeatCount: 2,
            },
          ],
          notes: ["Reduce nitrogen to encourage bulb development and storage quality."],
        },
      },
    },
  },
  {
    name: "White Sweet Spanish Onions",
    category: "root-vegetables",
    productiveLifespan: 120, // [cite: 257]
    growthTimeline: {
      germination: 14, // [cite: 256]
      seedling: 42, // ~8 weeks from seed [cite: 256]
      vegetative: 42, // [cite: 154]
      maturation: 120, // [cite: 257]
    },
    protocols: {
      fertilization: {
        seedling: {
          schedule: [
            {
              taskName: "Light Nitrogen Feed",
              details: {
                product: "Fish Emulsion",
                dilution: "1 tbsp/gal",
                amount: "1-2 fl oz",
                method: "soil-drench",
              },
              startDays: 21,
              frequencyDays: 14,
              repeatCount: 2,
            },
          ],
          notes: ["Light feeding to establish strong roots and foliage."],
        },
        vegetative: {
          schedule: [
            {
              taskName: "Balanced Growth Feed",
              details: {
                product: "Balanced Liquid Fertilizer",
                dilution: "1 tsp/gal",
                amount: "2-4 fl oz",
                method: "soil-drench",
              },
              startDays: 7,
              frequencyDays: 14,
              repeatCount: 3,
            },
            {
              taskName: "Potassium Boost (Pre-Bulbing)",
              details: {
                product: "Wood ash or potassium sulfate",
                amount: "1-2 tsp/container",
                method: "top-dress",
              },
              startDays: 92, // 2 weeks before typical 106-day bulbing trigger
              frequencyDays: 0,
              repeatCount: 1,
            },
          ],
          notes: [
            "Regular balanced feeding during active growth.",
            "Light potassium boost 2 weeks before bulbing triggers helps with bulb development.",
          ],
        },
        maturation: {
          schedule: [
            {
              taskName: "Low-Nitrogen Bulb Development",
              details: {
                product: "Bone Meal",
                amount: "1 tsp/container",
                method: "top-dress",
              },
              startDays: 7,
              frequencyDays: 21,
              repeatCount: 2,
            },
          ],
          notes: ["Reduce nitrogen to encourage bulb development and storage quality."],
        },
      },
    },
  },
  {
    name: "Garlic",
    category: "root-vegetables",
    productiveLifespan: 270, // ~9 months [cite: 248]
    growthTimeline: {
      germination: 30, // Fall planting assumes a dormant period
      seedling: 120, // "Early Growth/Seedling"
      vegetative: 90, // "Bulb Development/Vegetative" [cite: 243]
      maturation: 270, // [cite: 248]
    },
    protocols: {},
  },
  {
    name: "Rosemary",
    category: "herbs",
    productiveLifespan: 730, // Perennial [cite: 375]
    growthTimeline: {
      germination: 21, // [cite: 233]
      seedling: 40, //
      vegetative: 180, // "6-12 months to mature" [cite: 233]
      maturation: 365,
    },
    protocols: {},
  },
  {
    name: "Greek Oregano",
    category: "herbs",
    productiveLifespan: 730, // Perennial [cite: 375]
    growthTimeline: {
      germination: 14, // [cite: 201]
      seedling: 28, // 4-6 weeks to transplant [cite: 294]
      vegetative: 48, //
      maturation: 90, // [cite: 203]
    },
    protocols: {},
  },
  {
    name: "Italian Flat Leaf Parsley",
    category: "herbs",
    isEverbearing: true,
    productiveLifespan: 90,
    growthTimeline: {
      germination: 28, // [cite: 301]
      seedling: 21, //
      vegetative: 41, //
      maturation: 90, // [cite: 302]
    },
    protocols: {},
  },
  {
    name: "Greek Dwarf Basil",
    category: "herbs",
    isEverbearing: true,
    productiveLifespan: 60,
    growthTimeline: {
      germination: 10, // [cite: 221]
      seedling: 28, // 2-4 weeks [cite: 221]
      vegetative: 42, // 4-6 weeks [cite: 221]
      maturation: 60, //
    },
    protocols: {},
  },
  {
    name: "English Thyme",
    category: "herbs",
    productiveLifespan: 730, // Perennial [cite: 375]
    growthTimeline: {
      germination: 14, // [cite: 211]
      seedling: 21, // 2-3 weeks [cite: 211]
      vegetative: 84, // 6-12 weeks [cite: 212]
      maturation: 120,
    },
    protocols: {},
  },
  {
    name: "Boston Pickling Cucumber",
    category: "fruiting-plants",
    isEverbearing: false,
    productiveLifespan: 70,
    growthTimeline: {
      germination: 7,
      seedling: 14,
      vegetative: 21,
      flowering: 42,
      fruitingHarvesting: 50,
    },
    protocols: {
      lighting: {
        seedling: {
          ppfd: {
            min: 200,
            max: 400,
            unit: "µmol/m²/s",
          },
          photoperiod: {
            hours: 12,
            maxHours: 16,
          },
          dli: {
            min: 8.6,
            max: 23,
            unit: "mol/m²/day",
          },
          notes: [
            "Start feeding 2-3 weeks post-germination with balanced liquid fertilizer",
            "Half strength during establishment to avoid nutrient burn",
          ],
        },
        vegetativeGrowth: {
          ppfd: {
            min: 400,
            max: 600,
            unit: "µmol/m²/s",
          },
          photoperiod: {
            hours: 14,
            maxHours: 16,
          },
          dli: {
            min: 20.2,
            max: 34.6,
            unit: "mol/m²/day",
          },
          notes: [
            "Vigorous vine growth requires high light intensity",
            "Higher nitrogen during this phase supports leaf and vine development",
          ],
        },
        flowering: {
          ppfd: {
            min: 500,
            max: 700,
            unit: "µmol/m²/s",
          },
          photoperiod: {
            hours: 14,
            maxHours: 16,
          },
          dli: {
            min: 28.8,
            max: 40.3,
            unit: "mol/m²/day",
          },
          notes: [
            "Critical phase - flower production determines fruit yield",
            "Hand pollination required daily during flowering period",
          ],
        },
        fruitingHarvesting: {
          ppfd: {
            min: 500,
            max: 700,
            unit: "µmol/m²/s",
          },
          photoperiod: {
            hours: 14,
            maxHours: 16,
          },
          dli: {
            min: 28.8,
            max: 40.3,
            unit: "mol/m²/day",
          },
          notes: [
            "Harvest 8-10 days after fruit set",
            "Regular picking encourages continued production",
          ],
        },
      },
      watering: {
        seedling: {
          trigger: {
            moistureLevel: "consistent moisture",
          },
          target: {
            moistureLevel: "adequate but not waterlogged",
          },
          volume: {
            amount: "as needed for establishment",
            frequency: "daily monitoring",
          },
          notes: ["Heavy feeders require consistent moisture from start"],
        },
        vegetativeGrowth: {
          trigger: {
            moistureLevel: "when top inch dry",
          },
          target: {
            moistureLevel: "thoroughly moist",
          },
          volume: {
            amount: "heavy watering",
            frequency: "as soil indicates",
          },
          notes: [
            "Consistent moisture critical - never allow drought stress",
            "Container growing requires more frequent attention than ground cultivation",
          ],
        },
        flowering: {
          trigger: {
            moistureLevel: "when top inch dry",
          },
          target: {
            moistureLevel: "thoroughly moist",
          },
          volume: {
            amount: "heavy watering",
            frequency: "consistent schedule",
          },
          notes: [
            "Water stress during flowering dramatically reduces fruit set",
            "Morning watering preferred to allow leaves to dry before evening",
          ],
        },
        fruitingHarvesting: {
          trigger: {
            moistureLevel: "when top inch dry",
          },
          target: {
            moistureLevel: "thoroughly moist",
          },
          volume: {
            amount: "heavy watering",
            frequency: "daily during peak production",
          },
          notes: [
            "Fruit development requires enormous water uptake",
            "Inconsistent watering causes bitter or malformed fruit",
          ],
        },
      },
      fertilization: {
        seedling: {
          schedule: [
            {
              taskName: "Initial balanced liquid feed",
              details: {
                product: "Balanced liquid fertilizer",
                dilution: "half strength",
              },
              startDays: 14,
              frequencyDays: 0,
              repeatCount: 1,
            },
          ],
        },
        vegetative: {
          schedule: [
            {
              taskName: "Balanced liquid feed",
              details: {
                product: "Balanced liquid fertilizer",
                dilution: "full strength",
              },
              startDays: 21,
              frequencyDays: 10,
              repeatCount: 2,
            },
          ],
        },
        flowering: {
          schedule: [
            {
              taskName: "Apply bloom booster fertilizer",
              details: {
                product: "Higher P-K fertilizer (bloom booster)",
              },
              startDays: 42,
              frequencyDays: 10,
              repeatCount: 2,
            },
          ],
        },
        fruitingHarvesting: {
          schedule: [
            {
              taskName: "Continue bloom booster fertilizer",
              details: {
                product: "Higher P-K fertilizer",
              },
              startDays: 56,
              frequencyDays: 10,
              repeatCount: 2,
            },
          ],
        },
      },
      environment: {
        pH: {
          min: 5.8,
          max: 6.5,
          optimal: 6.2,
        },
      },
      soilMixture: {
        components: {
          "coco coir": 30,
          perlite: 25,
          vermiculite: 25,
          compost: 20,
        },
        amendments: {
          "well-rotted manure": "3 tbsp per gallon",
          "bone meal": "1 tbsp per gallon",
        },
      },
      container: {
        minSize: "≥2-3 gallons",
        depth: "18-24 inches minimum",
        staging: {
          seedling: "4 inch pot or cell tray with deeper cells",
          final: "Large container or main bed section",
        },
      },
      succession: {
        interval: 21,
        method: "continuous",
        harvestMethod: "selective",
        productiveWeeks: 8,
        notes: [
          "Succession every 3-4 weeks for overlapping production",
          "Each plant produces for 6-8 weeks once fruiting begins",
        ],
      },
      specialRequirements: [
        "A-frame trellis essential for vine support and light exposure",
        "Hand pollination critical - transfer pollen from male to female flowers daily",
        "Female flowers identifiable by tiny cucumber at base",
        "Harvest regularly to encourage continued production",
        "Heavy feeders requiring rich, well-draining soil",
      ],
    },
  },
  {
    name: "Sugar Snap Peas",
    category: "fruiting-plants",
    isEverbearing: true,
    productiveLifespan: 56,
    growthTimeline: {
      germinationEmergence: 10,
      seedling: 14,
      vegetativeVining: 21,
      flowerBudFormation: 50,
      podSetMaturation: 60,
    },
    protocols: {
      lighting: {
        germinationEmergence: {
          ppfd: {
            min: 100,
            max: 250,
            unit: "µmol/m²/s",
          },
          photoperiod: {
            hours: 14,
            maxHours: 16,
          },
          dli: {
            min: 5,
            max: 14.4,
            unit: "mol/m²/day",
          },
          notes: ["Keep soil consistently moist during germination period"],
        },
        seedling: {
          ppfd: {
            min: 200,
            max: 400,
            unit: "µmol/m²/s",
          },
          photoperiod: {
            hours: 14,
            maxHours: 16,
          },
          dli: {
            min: 11.5,
            max: 23,
            unit: "mol/m²/day",
          },
          notes: [
            "First true leaves and tendrils developing - watch for climbing behavior",
          ],
        },
        vegetativeVining: {
          ppfd: {
            min: 400,
            max: 600,
            unit: "µmol/m²/s",
          },
          photoperiod: {
            hours: 14,
            maxHours: 16,
          },
          dli: {
            min: 23,
            max: 34.6,
            unit: "mol/m²/day",
          },
          notes: ["Rapid vine growth - ensure trellis support is adequate"],
        },
        flowerBudFormation: {
          ppfd: {
            min: 500,
            max: 700,
            unit: "µmol/m²/s",
          },
          photoperiod: {
            hours: 12,
            maxHours: 14,
          },
          dli: {
            min: 21.6,
            max: 35.3,
            unit: "mol/m²/day",
          },
          notes: [
            "Slight photoperiod reduction can encourage flowering",
            "Monitor for first flower buds around days 40-50",
          ],
        },
        podSetMaturation: {
          ppfd: {
            min: 500,
            max: 700,
            unit: "µmol/m²/s",
          },
          photoperiod: {
            hours: 12,
          },
          dli: {
            min: 21.6,
            max: 30.2,
            unit: "mol/m²/day",
          },
          notes: [
            "Harvest pods when plump but before peas become starchy",
            "Regular harvesting encourages continued pod production",
          ],
        },
      },
      watering: {
        germinationEmergence: {
          trigger: {
            moistureLevel: "3-4",
          },
          target: {
            moistureLevel: "7-8",
          },
          volume: {
            amount: "16-24 oz (470-710 mL)",
            frequency: "3x/week",
          },
          notes: [
            "Keep consistently moist but not waterlogged during germination",
          ],
        },
        seedling: {
          trigger: {
            moistureLevel: "3-4",
          },
          target: {
            moistureLevel: "7-8",
          },
          volume: {
            amount: "20-32 oz (590-945 mL)",
            frequency: "3x/week",
          },
          notes: ["Establishing root system requires consistent moisture"],
        },
        vegetativeVining: {
          trigger: {
            moistureLevel: "3-4",
          },
          target: {
            moistureLevel: "7-8",
          },
          volume: {
            amount: "32-42 oz (945-1240 mL)",
            frequency: "3-4x/week",
          },
          notes: ["Rapid vine growth increases water demands significantly"],
        },
        flowerBudFormation: {
          trigger: {
            moistureLevel: "3-4",
          },
          target: {
            moistureLevel: "7-8",
          },
          volume: {
            amount: "40-48 oz (1180-1419 mL)",
            frequency: "4x/week",
          },
          notes: [
            "Critical period - water stress reduces flower and pod formation",
          ],
        },
        podSetMaturation: {
          trigger: {
            moistureLevel: "3-4",
          },
          target: {
            moistureLevel: "7-8",
          },
          volume: {
            amount: "40-54 oz (1180-1600 mL)",
            frequency: "3-4x/week",
          },
          notes: ["Pod filling requires substantial water uptake"],
        },
      },
      fertilization: {
        germinationEmergence: {
          schedule: [
            {
              taskName: "Apply Rhizobium inoculant",
              details: {
                product: "Rhizobium leguminosarum inoculant",
                method: "soil-drench",
              },
              startDays: 0,
              frequencyDays: 0,
              repeatCount: 1,
            },
          ],
          notes: [
            "Inoculant enables nitrogen fixation - critical for pea nutrition.",
            "Soil pre-amended with gypsum, bone meal, and kelp meal.",
          ],
        },
        seedling: {
          schedule: [
            {
              taskName: "Light container feed",
              details: {
                product: "5-10-10 fertilizer (light dose)",
              },
              startDays: 14,
              frequencyDays: 0,
              repeatCount: 1,
            },
          ],
          notes: ["Minimal nitrogen needed - peas fix their own nitrogen."],
        },
        vegetativeVining: {
          schedule: [
            {
              taskName: "Optional light feeding",
              details: {
                product: "Fish emulsion/fish+kelp (optional)",
              },
              startDays: 21,
              frequencyDays: 10,
              repeatCount: 2,
            },
            {
              taskName: "Worm casting top-dress",
              details: {
                product: "Worm casting",
                method: "top-dress",
              },
              startDays: 30,
              frequencyDays: 30,
              repeatCount: 1,
            },
          ],
        },
        flowerBudFormation: {
          schedule: [
            {
              taskName: "Boost phosphorus with Bone Meal",
              details: {
                product: "Bone meal",
                method: "top-dress",
              },
              startDays: 42,
              frequencyDays: 0,
              repeatCount: 1,
            },
            {
              taskName: "Apply Kelp/sea-mineral",
              details: {
                product: "Kelp/sea-mineral (if continuing liquid feed)",
              },
              startDays: 49,
              frequencyDays: 0,
              repeatCount: 1,
            },
          ],
          notes: [
            "Reduce nitrogen completely.",
            "Boost phosphorus and potassium for flower and pod development.",
          ],
        },
        podSetMaturation: {
          schedule: [
            {
              taskName: "Weekly Kelp Foliar Spray",
              details: {
                product: "Liquid kelp",
                dilution: "1 tsp/quart",
                method: "foliar-spray",
              },
              startDays: 50,
              frequencyDays: 7,
              repeatCount: 4,
            },
          ],
          notes: [
            "Weekly kelp foliar spray during pod development for enhanced nutrient uptake.",
            "Focus on consistent watering for pod filling.",
          ],
        },
      },
      environment: {
        pH: {
          min: 6.2,
          max: 6.8,
          optimal: 6.5,
        },
      },
      soilMixture: {
        components: {
          "coco coir": 35,
          perlite: 20,
          vermiculite: 20,
          compost: 15,
          "worm castings": 5,
          biochar: 5,
        },
        amendments: {
          gypsum: "½ cup per 15-gal bag",
          "bone meal": "2-3 Tbsp forked into top 4-6 inches",
          "kelp meal": "2 Tbsp into top 4-6 inches",
          "basalt rock dust (optional)": "¼ cup for additional micronutrients",
        },
      },
      container: {
        minSize: "≥2-3 gallons (15-gallon preferred)",
        depth: "12 inches minimum",
      },
      succession: {
        interval: 14,
        method: "continuous",
        harvestMethod: "selective",
        productiveWeeks: 6,
        notes: [
          "Succession every 2-3 weeks for continuous harvest",
          "Each planting productive for 6-8 weeks once podding begins",
        ],
      },
      specialRequirements: [
        "Rhizobium inoculant essential for nitrogen fixation",
        "A-frame trellis or netting required for climbing support",
        "Self-pollinating but benefits from gentle daily shaking of flowers",
        "Harvest pods when full but before peas become starchy",
        "Cool-season crop - performs best in moderate temperatures",
        "Succession planting every 2-3 weeks extends harvest window",
      ],
    },
  },
  {
    name: "Albion Strawberries",
    category: "berries",
    isEverbearing: true,
    productiveLifespan: 730,
    growthTimeline: {
      germination: 14,
      establishment: 14,
      vegetative: 28,
      flowering: 56,
      fruiting: 91,
      ongoingProduction: 98,
    },
    protocols: {
      lighting: {
        establishment: {
          ppfd: {
            min: 200,
            max: 200,
            optimal: 200,
            unit: "µmol/m²/s",
          },
          photoperiod: {
            hours: 14,
            maxHours: 16,
            constraint: "day-neutral varieties require consistent photoperiod",
          },
          dli: {
            min: 10.1,
            max: 11.5,
            unit: "mol/m²/day",
          },
          notes: [
            "Remove flowers for the first 4-6 weeks to encourage strong plant establishment",
            "Focus energy on root and crown development",
          ],
        },
        vegetative: {
          ppfd: {
            min: 300,
            max: 400,
            unit: "µmol/m²/s",
          },
          photoperiod: {
            hours: 16,
            constraint:
              "consistent 16h photoperiod is critical for continuous production",
          },
          dli: {
            min: 17.3,
            max: 23,
            unit: "mol/m²/day",
          },
          notes: [
            "Remove ALL runners as soon as they are spotted - check weekly",
            "Energy must go to fruit production, not vegetative reproduction",
          ],
        },
        flowering: {
          ppfd: {
            min: 350,
            max: 400,
            unit: "µmol/m²/s",
          },
          photoperiod: {
            hours: 16,
            constraint:
              "critical for continuous flowering in day-neutral types",
          },
          dli: {
            min: 20.2,
            max: 23,
            unit: "mol/m²/day",
          },
          notes: [
            "Hand pollination is critical indoors",
            "Use a small brush to transfer pollen every 1-2 days",
          ],
        },
        fruiting: {
          ppfd: {
            min: 450,
            max: 500,
            unit: "µmol/m²/s",
          },
          photoperiod: {
            hours: 16,
          },
          dli: {
            min: 25.9,
            max: 28.8,
            unit: "mol/m²/day",
          },
          notes: [
            "Higher light intensity supports fruit development and sugar accumulation",
          ],
        },
        ongoingProduction: {
          ppfd: {
            min: 350,
            max: 400,
            unit: "µmol/m²/s",
          },
          photoperiod: {
            hours: 16,
          },
          dli: {
            min: 20.2,
            max: 23,
            unit: "mol/m²/day",
          },
          notes: [
            "Monthly flush with pH-adjusted plain water until 20-30% runoff",
            "Prevents salt buildup from intensive feeding",
          ],
        },
      },
      watering: {
        establishment: {
          trigger: {
            moistureLevel: "3-4",
          },
          target: {
            moistureLevel: "6-7",
          },
          volume: {
            amount:
              "5-gal: 10-15 oz (295-445 mL), 2-gal hanging: 6-8 oz (180-235 mL)",
            frequency: "every 3-4 days",
            perPlant: true,
          },
          notes: [
            "Remove flowers for first 4-6 weeks to encourage establishment",
          ],
        },
        vegetative: {
          trigger: {
            moistureLevel: "3-4",
          },
          target: {
            moistureLevel: "6-7",
          },
          volume: {
            amount:
              "5-gal: 10-15 oz (295-445 mL), 2-gal hanging: 6-8 oz (180-235 mL)",
            frequency: "every 3-4 days",
            perPlant: true,
          },
          notes: [
            "Remove ALL runners as soon as spotted - weekly checks essential",
          ],
        },
        flowering: {
          trigger: {
            moistureLevel: "3-4",
          },
          target: {
            moistureLevel: "6-7",
          },
          volume: {
            amount:
              "5-gal: 10-15 oz (295-445 mL), 2-gal hanging: 6-8 oz (180-235 mL)",
            frequency: "every 3-4 days",
            perPlant: true,
          },
          notes: [
            "Consistent moisture critical during flower and early fruit development",
          ],
        },
        fruiting: {
          trigger: {
            moistureLevel: "3-4",
          },
          target: {
            moistureLevel: "6-7",
          },
          volume: {
            amount:
              "5-gal: 10-15 oz (295-445 mL), 2-gal hanging: 6-8 oz (180-235 mL)",
            frequency: "every 3-4 days",
            perPlant: true,
          },
        },
        ongoingProduction: {
          trigger: {
            moistureLevel: "3-4",
          },
          target: {
            moistureLevel: "6-7",
          },
          volume: {
            amount:
              "5-gal: 10-15 oz (295-445 mL), 2-gal hanging: 6-8 oz (180-235 mL)",
            frequency: "every 3-4 days",
            perPlant: true,
          },
          notes: [
            "Monthly flush: irrigate with pH-adjusted plain water until 20-30% runoff",
          ],
        },
      },
      fertilization: {
        establishment: {
          schedule: [
            {
              taskName: "Mix in Bone Meal at planting",
              details: {
                product: "Bone meal",
                amount: "1 Tbsp/5gal",
                method: "mix-in-soil",
              },
              startDays: 0,
              frequencyDays: 0,
              repeatCount: 1,
            },
            {
              taskName: "Apply Fish + Seaweed",
              details: {
                product: "Neptune's Harvest Fish + Seaweed",
                dilution: "½ strength, 0.5 Tbsp/gal",
              },
              startDays: 14,
              frequencyDays: 0,
              repeatCount: 1,
            },
          ],
        },
        vegetative: {
          schedule: [
            {
              taskName: "Apply Neptune's Harvest (½ strength)",
              details: {
                product: "Neptune's Harvest",
                dilution: "½ strength",
              },
              startDays: 28,
              frequencyDays: 14,
              repeatCount: 1,
            },
            {
              taskName: "Apply Neptune's Harvest (full strength)",
              details: {
                product: "Neptune's Harvest",
                dilution: "full strength, 1 Tbsp/gal",
              },
              startDays: 35,
              frequencyDays: 14,
              repeatCount: 1,
            },
          ],
        },
        flowering: {
          schedule: [
            {
              taskName: "Top-dress with Espoma Berry-Tone",
              details: {
                product: "Espoma Berry-Tone",
                amount: "2 Tbsp/bag",
                method: "top-dress",
              },
              startDays: 56,
              frequencyDays: 0,
              repeatCount: 1,
            },
            {
              taskName: "Apply Kelp/Sea-Mineral",
              details: {
                product: "Kelp/sea-mineral",
                dilution: "1 Tbsp/gal",
              },
              startDays: 63,
              frequencyDays: 14,
              repeatCount: 2,
            },
            {
              taskName: "Top-dress with Bone Meal",
              details: {
                product: "Bone meal",
                amount: "½ Tbsp/bag",
                method: "top-dress",
              },
              startDays: 70,
              frequencyDays: 0,
              repeatCount: 1,
            },
          ],
        },
        fruiting: {
          schedule: [
            {
              taskName: "Apply Kelp/Sea-Mineral",
              details: {
                product: "Kelp/sea-mineral",
                dilution: "1 Tbsp/gal",
              },
              startDays: 91,
              frequencyDays: 14,
              repeatCount: 2,
            },
            {
              taskName: "Apply High-K Supplement",
              details: {
                product: "Fish & Seaweed + high-K supplement",
              },
              startDays: 98,
              frequencyDays: 14,
              repeatCount: 3,
            },
          ],
        },
        ongoingProduction: {
          schedule: [
            {
              taskName: "Apply Kelp",
              details: {
                product: "Kelp",
                dilution: "1 Tbsp/gal",
              },
              startDays: 98,
              frequencyDays: 28,
              repeatCount: 26,
            },
            {
              taskName: "Top-dress with Berry-Tone",
              details: {
                product: "Berry-Tone",
                amount: "1 Tbsp/bag",
                method: "top-dress",
              },
              startDays: 112,
              frequencyDays: 28,
              repeatCount: 25,
            },
          ],
        },
      },
      environment: {
        pH: {
          min: 5.8,
          max: 6.5,
          optimal: 6.2,
        },
      },
      soilMixture: {
        components: {
          "coco coir": 35,
          perlite: 25,
          compost: 20,
          "worm castings": 15,
          vermiculite: 5,
        },
        amendments: {
          "bone meal": "1 Tbsp per gallon of mix at planting",
          "rock dust": "¼ cup per 5-gal bag",
        },
      },
      specialRequirements: [
        "Day-neutral varieties require consistent 16-hour photoperiod for continuous production",
        "Hand pollination essential indoors - use small brush every 1-2 days during flowering",
        "Remove ALL runners immediately to focus energy on fruit production",
        "Remove flowers for first 4-6 weeks to establish strong root system",
        "Monthly salt flush prevents nutrient lockout from intensive feeding",
        "Replace plants every 2 years when productivity declines",
      ],
    },
  },
  {
    name: "Caroline Raspberries",
    category: "berries",
    isEverbearing: true,
    productiveLifespan: 1095,
    growthTimeline: {
      caneEstablishment: 0,
      vegetative: 21,
      floweringFruiting: 63,
      ongoing: 120,
    },
    protocols: {
      lighting: {
        caneEstablishment: {
          ppfd: {
            min: 200,
            max: 300,
            unit: "µmol/m²/s",
          },
          photoperiod: {
            hours: 16,
            maxHours: 18,
          },
          dli: {
            min: 11.5,
            max: 19.4,
            unit: "mol/m²/day",
          },
          notes: [
            "Focus on establishing strong root system and cane structure",
          ],
        },
        vegetative: {
          ppfd: {
            min: 300,
            max: 400,
            unit: "µmol/m²/s",
          },
          photoperiod: {
            hours: 16,
          },
          dli: {
            min: 17.3,
            max: 23,
            unit: "mol/m²/day",
          },
        },
        floweringFruiting: {
          ppfd: {
            min: 400,
            max: 600,
            unit: "µmol/m²/s",
          },
          photoperiod: {
            hours: 14,
            maxHours: 16,
          },
          dli: {
            min: 22.7,
            max: 34.6,
            unit: "mol/m²/day",
          },
          notes: [
            "Higher light intensity supports fruit development and sugar content",
          ],
        },
        ongoing: {
          ppfd: {
            min: 350,
            max: 500,
            unit: "µmol/m²/s",
          },
          photoperiod: {
            hours: 16,
          },
          dli: {
            min: 20.2,
            max: 28.8,
            unit: "mol/m²/day",
          },
        },
      },
      watering: {
        caneEstablishment: {
          trigger: {
            moistureLevel: "3-4",
          },
          target: {
            moistureLevel: "6-7",
          },
          volume: {
            amount: "monitor with soil moisture meter",
            frequency: "as needed",
          },
          notes: ["Always water until slight drainage occurs"],
        },
        vegetative: {
          trigger: {
            moistureLevel: "3-4",
          },
          target: {
            moistureLevel: "6-7",
          },
          volume: {
            amount: "monitor with soil moisture meter",
            frequency: "as needed",
          },
        },
        floweringFruiting: {
          trigger: {
            moistureLevel: "3-4",
          },
          target: {
            moistureLevel: "7-8",
          },
          volume: {
            amount: "monitor with soil moisture meter",
            frequency: "as needed",
          },
          notes: ["Higher moisture during fruit development"],
        },
        ongoing: {
          trigger: {
            moistureLevel: "3-4",
          },
          target: {
            moistureLevel: "6-7",
          },
          volume: {
            amount: "monitor with soil moisture meter",
            frequency: "as needed",
          },
        },
      },
      fertilization: {
        caneEstablishment: {
          schedule: [
            {
              taskName: "Top-dress with Compost",
              details: {
                product: "Compost",
                amount: "1-2 inches",
                method: "top-dress",
              },
              startDays: 0,
              frequencyDays: 0,
              repeatCount: 1,
            },
            {
              taskName: "Apply 4-4-4 Granular",
              details: { product: "4-4-4 granular fertilizer" },
              startDays: 14,
              frequencyDays: 0,
              repeatCount: 1,
            },
          ],
        },
        vegetative: {
          schedule: [
            {
              taskName: "Apply Fish Emulsion",
              details: {
                product: "Fish Emulsion",
                dilution: "1-2 tbsp/gallon",
              },
              startDays: 21,
              frequencyDays: 21,
              repeatCount: 2,
            },
          ],
        },
        floweringFruiting: {
          schedule: [
            {
              taskName: "Apply Liquid Kelp & Balanced Fertilizer",
              details: {
                product: "Liquid Kelp + balanced organic fertilizer",
              },
              startDays: 63,
              frequencyDays: 21,
              repeatCount: 2,
            },
            {
              taskName: "Apply K-Rich Formula",
              details: {
                product: "Kelp Extract + K-rich formula",
              },
              startDays: 70,
              frequencyDays: 10,
              repeatCount: 5,
            },
          ],
        },
        ongoing: {
          schedule: [
            {
              taskName: "Apply Compost Tea",
              details: {
                product: "Aerobically brewed compost tea",
              },
              startDays: 120,
              frequencyDays: 30,
              repeatCount: 12,
            },
          ],
        },
      },
      environment: {
        pH: {
          min: 5.8,
          max: 6.5,
          optimal: 6,
        },
      },
      soilMixture: {
        components: {
          "compost (equal parts worm castings and composted manure)": 50,
          "peat moss": 20,
          perlite: 20,
          "pine bark fines": 10,
        },
        amendments: {
          "bone meal": "2.7 tbsp per 10-gallon container",
          "dried blood meal": "1.3 tbsp per 10-gallon container",
        },
      },
      container: {
        minSize: "2 × 10-gallon containers per plant",
        depth: "12 inches minimum",
      },
      specialRequirements: [
        "Primocane-fruiting variety produces on current year's canes",
        "Requires strong trellis system for support",
        "Prune spent canes after harvest to encourage new growth",
        "Benefits from good air circulation to prevent fungal issues",
        "Hand pollination by gently shaking plants during flowering",
      ],
    },
  },
  {
    name: "Little Finger Carrots",
    category: "root-vegetables",
    isEverbearing: false,
    growthTimeline: {
      germination: 14, // 0-2 weeks (0-14 days)
      seedling: 14, // 2-4 weeks (15-28 days)
      vegetative: 14, // 4-6 weeks (29-42 days) ← CHANGED from 28 to 14
      rootDevelopment: 28, // 6-10+ weeks (43-70 days) ← CHANGED from 42 to 28
    },
    protocols: {
      lighting: {
        germination: {
          ppfd: {
            min: 100,
            max: 150,
            unit: "µmol/m²/s",
          },
          photoperiod: {
            hours: 12,
            maxHours: 12,
            constraint: "strict maximum to prevent bolting",
          },
          dli: {
            min: 4.3,
            max: 6.5,
            unit: "mol/m²/day",
          },
          notes: [
            "Maintain consistent moisture",
            "Critical photoperiod control",
          ],
        },
        seedling: {
          ppfd: {
            min: 150,
            max: 300,
            unit: "µmol/m²/s",
          },
          photoperiod: {
            hours: 12,
            maxHours: 12,
            constraint: "photoperiods >12h may trigger premature bolting",
          },
          dli: {
            min: 6.5,
            max: 13,
            unit: "mol/m²/day",
          },
          notes: ["Critical photoperiod - max 12 hours"],
        },
        vegetative: {
          ppfd: {
            min: 200,
            max: 200,
            optimal: 200,
            unit: "µmol/m²/s",
          },
          photoperiod: {
            hours: 12,
            maxHours: 12,
            constraint:
              "photoperiods >12h may trigger premature bolting, especially if warm",
          },
          dli: {
            min: 8.6,
            max: 8.6,
            unit: "mol/m²/day",
          },
          notes: ["Strict 12-hour maximum", "Especially critical if warm"],
        },
        rootDevelopment: {
          ppfd: {
            min: 300,
            max: 600,
            unit: "µmol/m²/s",
          },
          photoperiod: {
            hours: 12,
            maxHours: 12,
            constraint: "maintain strict limit",
          },
          dli: {
            min: 13,
            max: 25.9,
            unit: "mol/m²/day",
          },
          notes: [
            "Consistent moisture prevents splitting",
            "21-day succession",
          ],
        },
      },
      watering: {
        germination: {
          trigger: {
            moistureLevel: "surface dry",
            description: "Keep surface moist",
          },
          target: {
            moistureLevel: "6-7",
            description: "top inch",
          },
          volume: {
            amount: "8-12 oz",
            frequency: "daily",
          },
          notes: ["Maintain consistent moisture"],
        },
        seedling: {
          trigger: {
            moistureLevel: "4-5",
          },
          target: {
            moistureLevel: "6-7",
          },
          volume: {
            amount: "16-24 oz",
            frequency: "every 2-3 days",
          },
        },
        vegetative: {
          trigger: {
            moistureLevel: "3-4",
          },
          target: {
            moistureLevel: "6-7",
          },
          volume: {
            amount: "24-32 oz",
            frequency: "every 2-4 days",
          },
          notes: [
            "Photoperiods >12h may trigger premature bolting, especially if warm",
          ],
        },
        rootDevelopment: {
          trigger: {
            moistureLevel: "3-4",
          },
          target: {
            moistureLevel: "6-7",
          },
          volume: {
            amount: "32-40 oz",
            frequency: "every 3-4 days",
          },
          notes: [
            "Consistent moisture prevents splitting",
            "21-day succession",
          ],
        },
      },
      fertilization: {
        seedling: {
          schedule: [
            {
              taskName: "Apply Worm Casting Tea",
              details: {
                product: "Worm Casting Tea",
                dilution: "1 part castings:10 parts water",
              },
              startDays: 21, // Week 3
              frequencyDays: 10, // Every 1-2 weeks
              repeatCount: 2,
            },
            {
              taskName: "Apply Diluted Fish Emulsion",
              details: {
                product: "Fish Emulsion",
                dilution: "0.5-1 Tbsp/gal",
              },
              startDays: 21, // Week 3
              frequencyDays: 18, // Every 2-3 weeks
              repeatCount: 1,
            },
          ],
        },
        vegetative: {
          schedule: [
            {
              taskName: "Apply Lower-N Fish Emulsion",
              details: {
                product: "Lower-N Fish Emulsion",
                dilution: "1 Tbsp/gal",
              },
              startDays: 35, // Week 5/6
              frequencyDays: 18, // Every 2-3 weeks
              repeatCount: 3,
            },
            {
              taskName: "Apply Worm Casting Tea",
              details: {
                product: "Worm Casting Tea",
                dilution: "1 part castings:10 parts water",
              },
              startDays: 35, // Week 5/6
              frequencyDays: 10, // Every 1-2 weeks
              repeatCount: 4,
            },
            {
              taskName: "Apply Liquid Kelp/Seaweed Extract",
              details: {
                product: "Liquid Kelp/Seaweed Extract",
                dilution: "1-2 Tbsp/gal",
              },
              startDays: 42, // Week 6
              frequencyDays: 18, // Every 2-3 weeks
              repeatCount: 2,
            },
          ],
        },
        rootDevelopment: {
          schedule: [
            {
              taskName: "Continue Lower-N Fish Emulsion",
              details: {
                product: "Lower-N Fish Emulsion",
                dilution: "1 Tbsp/gal",
              },
              startDays: 56, // Week 8
              frequencyDays: 18,
              repeatCount: 2,
            },
            {
              taskName: "Continue Worm Casting Tea",
              details: {
                product: "Worm Casting Tea",
                dilution: "1 part castings:10 parts water",
              },
              startDays: 56,
              frequencyDays: 10,
              repeatCount: 2,
            },
            {
              taskName: "Continue Liquid Kelp/Seaweed Extract",
              details: {
                product: "Liquid Kelp/Seaweed Extract",
                dilution: "1-2 Tbsp/gal",
              },
              startDays: 56,
              frequencyDays: 18,
              repeatCount: 2,
            },
          ],
        },
      },
      environment: {
        pH: {
          min: 6,
          max: 6.8,
          optimal: 6.5,
        },
      },
      soilMixture: {
        components: {
          "coco coir": 40,
          perlite: 30,
          vermiculite: 25,
          "coarse sand (2-4mm)": 5,
        },
      },
      container: {
        depth: "12 inches minimum",
        staging: {
          final:
            "Direct sow only - avoid transplanting to prevent root deformities",
        },
      },
      succession: {
        interval: 21,
        method: "zoned",
        harvestMethod: "single-harvest",
        notes: ["Divide bed into zones", "Sow new zone every 3 weeks"],
      },
      specialRequirements: [
        "Strict 12-hour photoperiod maximum",
        "Direct sow only - no transplanting",
        "Stone-free soil essential for straight roots",
        "Fresh manure causes forking - avoid",
      ],
    },
  },
  {
    name: "Detroit Dark Red Beets",
    category: "root-vegetables",
    isEverbearing: false,
    growthTimeline: {
      germination: 7,
      seedling: 14,
      vegetative: 21,
      rootDevelopment: 42,
      maturation: 60,
    },
    protocols: {
      lighting: {
        germination: {
          ppfd: { min: 100, max: 200, unit: "µmol/m²/s" },
          photoperiod: { hours: 12, maxHours: 14 },
          dli: { min: 4.3, max: 10.1, unit: "mol/m²/day" },
          notes: ["Ideal temp: 70-85°F for germination"],
        },
        vegetative: {
          ppfd: { min: 250, max: 400, unit: "µmol/m²/s" },
          photoperiod: { hours: 12, maxHours: 14 },
          dli: { min: 10.8, max: 20.2, unit: "mol/m²/day" },
          notes: ["Temperatures >75°F can cause bolting"],
        },
        rootDevelopment: {
          ppfd: { min: 400, max: 600, unit: "µmol/m²/s" },
          photoperiod: { hours: 12, maxHours: 14 },
          dli: { min: 17.3, max: 30.2, unit: "mol/m²/day" },
          notes: ["Maintain consistent moisture"],
        },
        maturation: {
          ppfd: { min: 300, max: 450, unit: "µmol/m²/s" },
          photoperiod: { hours: 12, maxHours: 14 },
          dli: { min: 13, max: 22.7, unit: "mol/m²/day" },
          notes: ["21-day succession"],
        },
      },
      watering: {
        germination: {
          trigger: { moistureLevel: "surface dry" },
          target: { moistureLevel: "7-8" },
          volume: { amount: "8-12 oz per session", frequency: "daily misting" },
          notes: ["Ideal temp: 70-85°F (21-29°C) for germination"],
        },
        vegetative: {
          trigger: { moistureLevel: "4-5 (weeks 1-3), 3-4 (weeks 3-6)" },
          target: { moistureLevel: "7-8 (weeks 1-3), 6-7 (weeks 3-6)" },
          volume: {
            amount: "16-20 oz (weeks 1-3), 20-24 oz (weeks 3-6)",
            frequency: "every 2-3 days (weeks 1-3), every 3-4 days (weeks 3-6)",
          },
          notes: ["Temperatures >75°F (24°C) can cause bolting"],
        },
        rootDevelopment: {
          trigger: { moistureLevel: "3-4" },
          target: { moistureLevel: "6-7" },
          volume: { amount: "24-28 oz", frequency: "every 2-3 days" },
          notes: ["Maintain consistent moisture"],
        },
        maturation: {
          trigger: { moistureLevel: "2-3" },
          target: { moistureLevel: "5-6" },
          volume: { amount: "20-24 oz", frequency: "every 4-5 days" },
          notes: ["21-day succession"],
        },
      },
      fertilization: {
        seedling: {
          schedule: [
            {
              taskName: "Light Fish Emulsion Feed",
              details: {
                product: "Fish Emulsion",
                dilution: "1 tsp/gal",
                amount: "2-3 fl oz",
                method: "soil-drench",
              },
              startDays: 7,
              frequencyDays: 0,
              repeatCount: 1,
            },
          ],
          notes: ["Light feeding to establish healthy seedlings before root development."],
        },
        vegetative: {
          schedule: [
            {
              taskName: "Apply diluted Fish/Kelp Tea",
              details: { product: "Fish/Kelp Tea", dilution: "¼ strength" },
              startDays: 14,
              frequencyDays: 0,
              repeatCount: 1,
            },
            {
              taskName: "Top-dress with Worm Castings & Bone Meal",
              details: {
                product: "Worm Castings & Bone Meal",
                amount: "1 tbsp each",
                method: "top-dress",
              },
              startDays: 21,
              frequencyDays: 0,
              repeatCount: 1,
            },
          ],
        },
        rootDevelopment: {
          schedule: [
            {
              taskName: "Apply Liquid Kelp",
              details: {
                product: "Liquid kelp or fish + seaweed",
                dilution: "1 tbsp/gal",
                amount: "3-4 fl oz",
                method: "soil-drench",
              },
              startDays: 42,
              frequencyDays: 14,
              repeatCount: 2,
            },
          ],
        },
        maturation: {
          schedule: [
            {
              taskName: "Final Kelp Feed",
              details: {
                product: "Liquid Kelp",
                dilution: "1 tsp/gal",
                amount: "2-3 fl oz",
                method: "soil-drench",
              },
              startDays: 7,
              frequencyDays: 0,
              repeatCount: 1,
            },
          ],
          notes: ["Light feeding to support final root development and storage quality."],
        },
      },
      environment: {
        temperature: { min: 65, max: 75, optimal: 70, unit: "F" },
        pH: { min: 6.5, max: 7, optimal: 6.8 },
      },
      soilMixture: {
        components: {
          "coco coir": 40,
          perlite: 30,
          vermiculite: 25,
          "compost (or worm castings)": 5,
        },
        amendments: {
          "compost or worm castings": "2 tbsp per gallon",
          "Epsom salts": "1 tsp per gallon",
          "bone meal": "1 tbsp per gallon",
        },
      },
      container: { depth: "10 inches minimum" },
      succession: {
        interval: 21,
        method: "zoned",
        harvestMethod: "selective",
        notes: ["Can harvest greens at 30-40 days", "Roots ready 50-70 days"],
      },
      specialRequirements: [
        "Sensitive to boron deficiency",
        "Avoid high nitrogen after seedling stage",
        "Can be direct sown or carefully transplanted",
      ],
    },
  },
  {
    name: "Beauregard Sweet Potatoes",
    category: "root-vegetables",
    isEverbearing: false,
    growthTimeline: {
      slipProduction: 14,
      vegetativeGrowth: 21,
      tuberDevelopment: 56,
      maturation: 100,
    },
    protocols: {
      lighting: {
        slipProduction: {
          ppfd: { min: 200, max: 200, optimal: 200, unit: "µmol/m²/s" },
          photoperiod: { hours: 14, maxHours: 16 },
          dli: { min: 10.1, max: 11.5, unit: "mol/m²/day" },
          notes: ["High humidity 85-90%", "Temp: 75-80°F"],
        },
        vegetativeGrowth: {
          ppfd: { min: 350, max: 600, unit: "µmol/m²/s" },
          photoperiod: { hours: 14, maxHours: 16 },
          dli: { min: 17.6, max: 34.6, unit: "mol/m²/day" },
          notes: ["Vigorous vine growth phase"],
        },
        tuberDevelopment: {
          ppfd: { min: 600, max: 800, unit: "µmol/m²/s" },
          photoperiod: {
            hours: 10,
            maxHours: 12,
            constraint: "reduce photoperiod to trigger tuber formation",
          },
          dli: { min: 21.6, max: 34.6, unit: "mol/m²/day" },
          notes: ["Critical photoperiod reduction for tuberization"],
        },
        maturation: {
          ppfd: { min: 500, max: 600, unit: "µmol/m²/s" },
          photoperiod: { hours: 8, maxHours: 10 },
          dli: { min: 14.4, max: 21.6, unit: "mol/m²/day" },
          notes: ["Further photoperiod reduction"],
        },
      },
      watering: {
        slipProduction: {
          trigger: { moistureLevel: "top 1 inch dry (~4-5)" },
          target: { moistureLevel: "adequate moisture" },
          volume: {
            amount: "16-20 oz (470-590 mL)/plant",
            frequency: "daily for first week, then every 1-2 days",
          },
          notes: ["High humidity (85-90%)", "Temp: 75-80°F (24-27°C)"],
        },
        vegetativeGrowth: {
          trigger: { moistureLevel: "top 1-2 inches dry (~4)" },
          target: { moistureLevel: "adequate moisture" },
          volume: {
            amount: "30-40 oz (890-1200 mL)/plant",
            frequency: "2x per week",
          },
          notes: ["Vigorous vine growth phase"],
        },
        tuberDevelopment: {
          trigger: { moistureLevel: "top 2 inches dry (~3-4)" },
          target: { moistureLevel: "adequate moisture" },
          volume: { amount: "40-48 oz (1200-1400 mL)", frequency: "2x/week" },
          notes: ["Reduce photoperiod to trigger tuber formation"],
        },
        maturation: {
          trigger: { moistureLevel: "top 2-3 inches dry (~3)" },
          target: { moistureLevel: "minimal" },
          volume: {
            amount: "12-20 oz (350-590 mL)/plant",
            frequency: "1x/week then stop completely 7-10 days pre-harvest",
          },
          notes: ["Extended final dry-down period for improved storage quality"],
        },
      },
      fertilization: {
        slipProduction: { schedule: [] },
        vegetativeGrowth: {
          schedule: [
            {
              taskName: "Apply Blood Meal",
              details: {
                product: "Blood Meal",
                amount: "0.5c bed / 5 Tbsp bag",
              },
              startDays: 28,
              frequencyDays: 0,
              repeatCount: 1,
            },
          ],
        },
        tuberDevelopment: {
          schedule: [
            {
              taskName: "Apply Kelp Meal",
              details: {
                product: "Kelp Meal",
                amount: "0.75c bed / 7.5 Tbsp bag",
              },
              startDays: 56,
              frequencyDays: 28,
              repeatCount: 2,
            },
            {
              taskName: "Foliar spray with K₂SO₄",
              details: {
                product: "K₂SO₄",
                dilution: "1-2 Tbsp/gal",
                method: "foliar-spray",
              },
              startDays: 70,
              frequencyDays: 0,
              repeatCount: 1,
            },
          ],
        },
        maturation: {
          schedule: [
            {
              taskName: "Apply K₂SO₄/KNO₃ for skin set",
              details: { product: "K₂SO₄/KNO₃" },
              startDays: 80,
              frequencyDays: 0,
              repeatCount: 1,
            },
          ],
          notes: ["Cease all feeding 3-4 wks pre-harvest"],
        },
      },
      environment: {
        temperature: {
          min: 75,
          max: 85,
          optimal: 80,
          unit: "F",
          stage: "tuber development",
        },
        humidity: { min: 85, max: 90, optimal: 87 },
        pH: { min: 5.8, max: 6.2, optimal: 6 },
      },
      soilMixture: {
        components: {
          "coco coir": 40,
          perlite: 30,
          vermiculite: 25,
          "sandy loam": 5,
        },
        amendments: { "well-rotted manure": "3 tbsp per gallon" },
      },
      container: {
        depth: "18-24 inches",
        staging: { final: "Large containers for extensive root system" },
      },
      succession: {
        interval: 0,
        method: "single",
        harvestMethod: "single-harvest",
        notes: ["Long cycle (90-120 days) best for single large harvest"],
      },
      specialRequirements: [
        "Post-harvest curing at 80-85°F with high humidity for 5-10 days",
        "Critical photoperiod reduction for tuberization",
        "Soil temperature 75-85°F optimal for tuber development",
      ],
    },
  },
  
  // FLOWERS
  {
    name: "Red Rose",
    category: "flowers",
    isEverbearing: false,
    productiveLifespan: 1825, // 5 years
    growthTimeline: {
      germination: 14, // 2 weeks from seed
      seedling: 28, // 4 weeks seedling phase
      vegetative: 84, // 12 weeks vegetative growth
      budding: 21, // 3 weeks bud formation
      flowering: 56, // 8 weeks flowering period
      dormancy: 120, // 4-month dormancy (winter)
      maturation: 365, // Full cycle including dormancy
    },
    protocols: {
      watering: {
        germination: {
          trigger: { moistureLevel: "6/10" },
          target: { moistureLevel: "8/10" },
          volume: { amount: "2-3 oz", frequency: "every 2-3 days", perPlant: true },
        },
        seedling: {
          trigger: { moistureLevel: "5/10" },
          target: { moistureLevel: "7/10" },
          volume: { amount: "4-6 oz", frequency: "every 2-3 days", perPlant: true },
        },
        vegetative: {
          trigger: { moistureLevel: "4/10" },
          target: { moistureLevel: "6/10" },
          volume: { amount: "8-12 oz", frequency: "every 2-3 days", perPlant: true },
        },
        budding: {
          trigger: { moistureLevel: "4/10" },
          target: { moistureLevel: "7/10" },
          volume: { amount: "12-16 oz", frequency: "every 2 days", perPlant: true },
        },
        flowering: {
          trigger: { moistureLevel: "4/10" },
          target: { moistureLevel: "6/10" },
          volume: { amount: "12-16 oz", frequency: "every 2-3 days", perPlant: true },
        },
        dormancy: {
          trigger: { moistureLevel: "3/10" },
          target: { moistureLevel: "5/10" },
          volume: { amount: "4-6 oz", frequency: "weekly", perPlant: true },
        },
      },
      environment: {
        temperature: { min: 60, max: 75, optimal: 68, unit: "F" },
        humidity: { min: 40, max: 60, optimal: 50 },
        pH: { min: 6.0, max: 7.0, optimal: 6.5 },
      },
      container: {
        depth: "18-24 inches",
        staging: { final: "Large container for extensive root system" },
      },
      specialRequirements: [
        "Requires winter dormancy period for proper flowering",
        "Prefers morning sunlight with afternoon shade",
        "Regular deadheading to encourage continued blooming",
      ],
    },
  },
  {
    name: "Tulip",
    category: "flowers",
    isEverbearing: false,
    productiveLifespan: 1095, // 3 years
    growthTimeline: {
      germination: 90, // 12-14 weeks cold stratification + germination
      seedling: 28, // 4 weeks seedling phase
      vegetative: 56, // 8 weeks vegetative growth
      budding: 14, // 2 weeks bud formation
      flowering: 21, // 3 weeks flowering period
      dormancy: 182, // 6-month dormancy
      maturation: 365, // Full cycle
    },
    protocols: {
      watering: {
        germination: {
          trigger: { moistureLevel: "6/10" },
          target: { moistureLevel: "7/10" },
          volume: { amount: "1-2 oz", frequency: "every 3-4 days", perPlant: true },
        },
        seedling: {
          trigger: { moistureLevel: "5/10" },
          target: { moistureLevel: "7/10" },
          volume: { amount: "2-4 oz", frequency: "every 2-3 days", perPlant: true },
        },
        vegetative: {
          trigger: { moistureLevel: "4/10" },
          target: { moistureLevel: "6/10" },
          volume: { amount: "4-6 oz", frequency: "every 2-3 days", perPlant: true },
        },
        budding: {
          trigger: { moistureLevel: "5/10" },
          target: { moistureLevel: "7/10" },
          volume: { amount: "6-8 oz", frequency: "every 2 days", perPlant: true },
        },
        flowering: {
          trigger: { moistureLevel: "5/10" },
          target: { moistureLevel: "7/10" },
          volume: { amount: "6-8 oz", frequency: "every 2-3 days", perPlant: true },
        },
        dormancy: {
          trigger: { moistureLevel: "2/10" },
          target: { moistureLevel: "4/10" },
          volume: { amount: "2-3 oz", frequency: "weekly", perPlant: true },
        },
      },
      environment: {
        temperature: { min: 35, max: 65, optimal: 50, unit: "F" },
        humidity: { min: 30, max: 50, optimal: 40 },
        pH: { min: 6.0, max: 7.5, optimal: 6.8 },
      },
      container: {
        depth: "8-12 inches",
        staging: { final: "Medium container with good drainage" },
      },
      specialRequirements: [
        "Requires 12-16 weeks cold treatment before planting",
        "Plant bulbs in fall for spring blooming",
        "Allow foliage to die back naturally after flowering",
      ],
    },
  },
  {
    name: "Sunflower",
    category: "flowers",
    isEverbearing: false,
    productiveLifespan: 120, // Single season annual
    growthTimeline: {
      germination: 7, // 1 week
      seedling: 14, // 2 weeks
      vegetative: 42, // 6 weeks
      budding: 14, // 2 weeks
      flowering: 21, // 3 weeks
      maturation: 120, // Full cycle
    },
    protocols: {
      watering: {
        germination: {
          trigger: { moistureLevel: "6/10" },
          target: { moistureLevel: "8/10" },
          volume: { amount: "2-3 oz", frequency: "daily", perPlant: true },
        },
        seedling: {
          trigger: { moistureLevel: "5/10" },
          target: { moistureLevel: "7/10" },
          volume: { amount: "4-6 oz", frequency: "daily", perPlant: true },
        },
        vegetative: {
          trigger: { moistureLevel: "4/10" },
          target: { moistureLevel: "7/10" },
          volume: { amount: "12-16 oz", frequency: "daily", perPlant: true },
        },
        budding: {
          trigger: { moistureLevel: "4/10" },
          target: { moistureLevel: "7/10" },
          volume: { amount: "16-24 oz", frequency: "daily", perPlant: true },
        },
        flowering: {
          trigger: { moistureLevel: "4/10" },
          target: { moistureLevel: "6/10" },
          volume: { amount: "16-24 oz", frequency: "daily", perPlant: true },
        },
      },
      environment: {
        temperature: { min: 65, max: 85, optimal: 75, unit: "F" },
        humidity: { min: 40, max: 70, optimal: 55 },
        pH: { min: 6.0, max: 7.5, optimal: 6.8 },
      },
      container: {
        depth: "24-36 inches",
        staging: { final: "Very large container for tall growth" },
      },
      specialRequirements: [
        "Requires full sun exposure (6+ hours daily)",
        "May need staking for support as it grows tall",
        "Heavy feeder - benefits from rich, well-draining soil",
      ],
    },
  },
];
