import { PlantCategory } from "@/types";

interface StageSpecificWateringProtocol {
  [stageName: string]: {
    trigger: {
      moistureLevel: string | number; // e.g., "3-4", 4, "surface dry"
      description?: string;
    };
    target: {
      moistureLevel: string | number; // e.g., "6-7", 7, "8-10"
      description?: string;
    };
    volume: {
      amount: string; // e.g., "16-24 oz", "32-40 oz per plant"
      frequency: string; // e.g., "every 2-3 days", "3-4x/week"
      perPlant?: boolean;
    };
    notes?: string[];
  };
}

interface StageSpecificLightingProtocol {
  [stageName: string]: {
    ppfd: {
      min: number;
      max: number;
      optimal?: number;
      unit: "µmol/m²/s";
    };
    photoperiod: {
      hours: number;
      maxHours?: number; // Critical for preventing bolting
      minHours?: number;
      constraint?: string; // e.g., "strict maximum to prevent bolting"
    };
    dli: {
      min: number;
      max: number;
      unit: "mol/m²/day";
    };
    notes?: string[];
  };
}

interface StageSpecificFertilizationProtocol {
  [stageName: string]: {
    products?: {
      name: string;
      dilution: string;
      amount: string;
      frequency: string;
      method?: "soil-drench" | "foliar-spray" | "top-dress" | "mix-in-soil";
    }[];
    timing?: string;
    specialInstructions?: string[];
    notes?: string[];
  };
}

// Enhanced environmental protocol
interface EnvironmentalProtocol {
  temperature?: {
    min?: number;
    max?: number;
    optimal?: number;
    unit: "F" | "C";
    criticalMax?: number; // e.g., ">75°F can cause bolting"
    criticalMin?: number;
    stage?: string;
  };
  humidity?: {
    min?: number;
    max?: number;
    optimal?: number;
    criticalForStage?: string;
  };
  pH: {
    min: number;
    max: number;
    optimal: number;
  };
  specialConditions?: string[];
  constraints?: {
    description: string;
    parameter: "temperature" | "humidity" | "light" | "other";
    threshold: number;
    consequence: string;
  }[];
}

interface SoilMixture {
  components: {
    [component: string]: number; // percentage
  };
  amendments?: {
    [amendment: string]: string; // amount per gallon/container
  };
}

interface ContainerRequirements {
  minSize?: string;
  depth: string;
  drainage?: string;
  staging?: {
    seedling?: string;
    intermediate?: string;
    final: string;
  };
}

interface SuccessionProtocol {
  interval: number; // days between plantings
  method: "continuous" | "zoned" | "single";
  harvestMethod: "cut-and-come-again" | "single-harvest" | "selective";
  productiveWeeks?: number;
  notes?: string[];
}

interface ComprehensivePlantProtocols {
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
    germination: number;
    seedling: number;
    vegetative: number;
    maturation: number;
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
    name: "Boston Pickling Cucumber",
    category: "fruiting-plants",
    isEverbearing: false,
    productiveLifespan: 70, // 8-10 weeks continuous harvest
    growthTimeline: {
      germination: 7, // 3-10 days typical
      seedling: 14, // 10-14 days post-germination
      vegetative: 21, // vine development
      maturation: 50, // first fruit harvest at 50-70 days
    },
    protocols: {
      lighting: {
        seedling: {
          ppfd: { min: 200, max: 400, unit: "µmol/m²/s" },
          photoperiod: { hours: 12, maxHours: 16 },
          dli: { min: 8.6, max: 23.0, unit: "mol/m²/day" },
          notes: [
            "Start feeding 2-3 weeks post-germination with balanced liquid fertilizer",
            "Half strength during establishment to avoid nutrient burn",
          ],
        },
        vegetativeGrowth: {
          ppfd: { min: 400, max: 600, unit: "µmol/m²/s" },
          photoperiod: { hours: 14, maxHours: 16 },
          dli: { min: 20.2, max: 34.6, unit: "mol/m²/day" },
          notes: [
            "Vigorous vine growth requires high light intensity",
            "Higher nitrogen during this phase supports leaf and vine development",
          ],
        },
        flowering: {
          ppfd: { min: 500, max: 700, unit: "µmol/m²/s" },
          photoperiod: { hours: 14, maxHours: 16 },
          dli: { min: 28.8, max: 40.3, unit: "mol/m²/day" },
          notes: [
            "Critical phase - flower production determines fruit yield",
            "Hand pollination required daily during flowering period",
          ],
        },
        fruitingHarvesting: {
          ppfd: { min: 500, max: 700, unit: "µmol/m²/s" },
          photoperiod: { hours: 14, maxHours: 16 },
          dli: { min: 28.8, max: 40.3, unit: "mol/m²/day" },
          notes: [
            "Harvest 8-10 days after fruit set",
            "Regular picking encourages continued production",
          ],
        },
      },
      watering: {
        seedling: {
          trigger: { moistureLevel: "consistent moisture" },
          target: { moistureLevel: "adequate but not waterlogged" },
          volume: {
            amount: "as needed for establishment",
            frequency: "daily monitoring",
          },
          notes: ["Heavy feeders require consistent moisture from start"],
        },
        vegetativeGrowth: {
          trigger: { moistureLevel: "when top inch dry" },
          target: { moistureLevel: "thoroughly moist" },
          volume: { amount: "heavy watering", frequency: "as soil indicates" },
          notes: [
            "Consistent moisture critical - never allow drought stress",
            "Container growing requires more frequent attention than ground cultivation",
          ],
        },
        flowering: {
          trigger: { moistureLevel: "when top inch dry" },
          target: { moistureLevel: "thoroughly moist" },
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
          trigger: { moistureLevel: "when top inch dry" },
          target: { moistureLevel: "thoroughly moist" },
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
          products: [
            {
              name: "Balanced liquid fertilizer",
              dilution: "half strength",
              amount: "light application",
              frequency: "start 2-3 weeks post-germination",
            },
          ],
          timing: "Weeks 2-4",
          notes: ["Gentle introduction to feeding - young roots are sensitive"],
        },
        vegetativeGrowth: {
          products: [
            {
              name: "Balanced liquid fertilizer",
              dilution: "full strength",
              amount: "regular application",
              frequency: "every 1-2 weeks",
            },
          ],
          timing: "Weeks 4-8",
          notes: ["Higher nitrogen during vine development phase"],
        },
        flowering: {
          products: [
            {
              name: "Higher P-K fertilizer (tomato/bloom booster)",
              dilution: "as directed",
              amount: "regular application",
              frequency: "every 1-2 weeks",
            },
          ],
          timing: "When first flowers appear",
          notes: [
            "Switch from nitrogen-heavy to phosphorus-potassium emphasis",
            "Supports flower production and fruit development",
          ],
        },
        fruitingHarvesting: {
          products: [
            {
              name: "Higher P-K fertilizer",
              dilution: "as directed",
              amount: "consistent application",
              frequency: "every 1-2 weeks",
            },
          ],
          timing: "Throughout harvest period",
          notes: ["Continuous fruiting demands consistent nutrition"],
        },
      },
      environment: {
        pH: { min: 5.8, max: 6.5, optimal: 6.2 },
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
        interval: 21, // 3-4 week intervals
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
    productiveLifespan: 56, // 6-8 weeks harvest window
    growthTimeline: {
      germination: 10, // 7-14 days typical
      seedling: 14, // first true leaves and tendrils
      vegetative: 21, // vining growth weeks 3-6
      maturation: 60, // pod harvest 50-70 days from sowing
    },
    protocols: {
      lighting: {
        germinationEmergence: {
          ppfd: { min: 100, max: 250, unit: "µmol/m²/s" },
          photoperiod: { hours: 14, maxHours: 16 },
          dli: { min: 5.0, max: 14.4, unit: "mol/m²/day" },
          notes: ["Keep soil consistently moist during germination period"],
        },
        seedling: {
          ppfd: { min: 200, max: 400, unit: "µmol/m²/s" },
          photoperiod: { hours: 14, maxHours: 16 },
          dli: { min: 11.5, max: 23.0, unit: "mol/m²/day" },
          notes: [
            "First true leaves and tendrils developing - watch for climbing behavior",
          ],
        },
        vegetativeVining: {
          ppfd: { min: 400, max: 600, unit: "µmol/m²/s" },
          photoperiod: { hours: 14, maxHours: 16 },
          dli: { min: 23.0, max: 34.6, unit: "mol/m²/day" },
          notes: ["Rapid vine growth - ensure trellis support is adequate"],
        },
        flowerBudFormation: {
          ppfd: { min: 500, max: 700, unit: "µmol/m²/s" },
          photoperiod: { hours: 12, maxHours: 14 },
          dli: { min: 21.6, max: 35.3, unit: "mol/m²/day" },
          notes: [
            "Slight photoperiod reduction can encourage flowering",
            "Monitor for first flower buds around days 40-50",
          ],
        },
        podSetMaturation: {
          ppfd: { min: 500, max: 700, unit: "µmol/m²/s" },
          photoperiod: { hours: 12 },
          dli: { min: 21.6, max: 30.2, unit: "mol/m²/day" },
          notes: [
            "Harvest pods when plump but before peas become starchy",
            "Regular harvesting encourages continued pod production",
          ],
        },
      },
      watering: {
        germinationEmergence: {
          trigger: { moistureLevel: "3-4" },
          target: { moistureLevel: "7-8" },
          volume: { amount: "16-24 oz (470-710 mL)", frequency: "3x/week" },
          notes: [
            "Keep consistently moist but not waterlogged during germination",
          ],
        },
        seedling: {
          trigger: { moistureLevel: "3-4" },
          target: { moistureLevel: "7-8" },
          volume: { amount: "20-32 oz (590-945 mL)", frequency: "3x/week" },
          notes: ["Establishing root system requires consistent moisture"],
        },
        vegetativeVining: {
          trigger: { moistureLevel: "3-4" },
          target: { moistureLevel: "7-8" },
          volume: { amount: "32-42 oz (945-1240 mL)", frequency: "3-4x/week" },
          notes: ["Rapid vine growth increases water demands significantly"],
        },
        flowerBudFormation: {
          trigger: { moistureLevel: "3-4" },
          target: { moistureLevel: "7-8" },
          volume: { amount: "40-48 oz (1180-1419 mL)", frequency: "4x/week" },
          notes: [
            "Critical period - water stress reduces flower and pod formation",
          ],
        },
        podSetMaturation: {
          trigger: { moistureLevel: "3-4" },
          target: { moistureLevel: "7-8" },
          volume: { amount: "40-54 oz (1180-1600 mL)", frequency: "3-4x/week" },
          notes: ["Pod filling requires substantial water uptake"],
        },
      },
      fertilization: {
        germinationEmergence: {
          products: [
            {
              name: "Rhizobium leguminosarum inoculant",
              dilution: "as directed",
              amount: "apply to seed or planting hole",
              frequency: "at sowing",
              method: "soil-drench",
            },
          ],
          timing: "At sowing",
          notes: [
            "Inoculant enables nitrogen fixation - critical for pea nutrition",
            "Soil pre-amended with gypsum, bone meal, and kelp meal",
          ],
        },
        seedling: {
          products: [
            {
              name: "5-10-10 fertilizer (light dose)",
              dilution: "as directed for containers",
              amount: "light application",
              frequency: "early in containers if needed",
            },
          ],
          timing: "Days 14-20",
          notes: ["Minimal nitrogen needed - peas fix their own nitrogen"],
        },
        vegetativeVining: {
          products: [
            {
              name: "Fish emulsion/fish+kelp (optional)",
              dilution: "as directed",
              amount: "light application",
              frequency: "weekly/biweekly if desired",
            },
            {
              name: "Worm casting top-dress",
              dilution: "N/A",
              amount: "light sprinkle around base",
              frequency: "monthly",
              method: "top-dress",
            },
          ],
          timing: "Weeks 3-6",
          notes: [
            "Light feeding only - excessive nitrogen reduces pod production",
          ],
        },
        flowerBudFormation: {
          products: [
            {
              name: "Bone meal side-dress",
              dilution: "N/A",
              amount: "light application around base",
              frequency: "one-time",
              method: "top-dress",
            },
            {
              name: "Kelp/sea-mineral (if continuing liquid feed)",
              dilution: "as directed",
              amount: "dilute application",
              frequency: "if needed",
            },
          ],
          timing: "Weeks 6-8",
          notes: [
            "Reduce nitrogen completely",
            "Boost phosphorus and potassium for flower and pod development",
          ],
        },
        podSetMaturation: {
          products: [
            {
              name: "Light feeding only if needed",
              dilution: "very dilute",
              amount: "minimal",
              frequency: "rarely",
            },
          ],
          timing: "Days 60-70+",
          notes: [
            "Minimal feeding during harvest - focus on consistent watering",
          ],
        },
      },
      environment: {
        pH: { min: 6.2, max: 6.8, optimal: 6.5 },
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
        interval: 14, // 2-3 week intervals
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
    name: "Greek Dwarf Basil",
    category: "herbs",
    isEverbearing: true,
    productiveLifespan: 84, // 12 weeks typical for annual herb
    growthTimeline: {
      germination: 7, // 5-10 days when kept warm
      seedling: 21, // 2-4 weeks seedling stage
      vegetative: 28, // 4-6 weeks rapid growth
      maturation: 56, // 6-8 weeks to flowering (if allowed)
    },
    protocols: {
      lighting: {
        seedling: {
          ppfd: { min: 100, max: 400, unit: "µmol/m²/s" },
          photoperiod: { hours: 12, maxHours: 16 },
          dli: { min: 4.3, max: 23.0, unit: "mol/m²/day" },
          notes: [
            "Basil loves warmth - keep soil consistently warm during germination",
            "Small plants emerge with initial characteristic basil leaves",
          ],
        },
        vegetative: {
          ppfd: { min: 400, max: 600, unit: "µmol/m²/s" },
          photoperiod: { hours: 14, maxHours: 16 },
          dli: { min: 23.0, max: 34.6, unit: "mol/m²/day" },
          notes: [
            "Pinching off growing tips encourages bushier growth",
            "Higher light intensity produces more essential oils and stronger flavor",
          ],
        },
        flowering: {
          ppfd: { min: 600, max: 1000, unit: "µmol/m²/s" },
          photoperiod: { hours: 14, maxHours: 16 },
          dli: { min: 34.6, max: 57.6, unit: "mol/m²/day" },
          notes: [
            "Flowering usually occurs around 6-8 weeks after planting",
            "Pinch flower buds immediately to extend leaf harvest period",
          ],
        },
      },
      watering: {
        seedling: {
          trigger: { moistureLevel: "when surface begins to dry" },
          target: { moistureLevel: "evenly moist but not waterlogged" },
          volume: {
            amount: "light applications",
            frequency: "daily monitoring",
          },
          notes: [
            "Consistent moisture during establishment phase",
            "Avoid overwatering which can cause damping-off disease",
          ],
        },
        vegetative: {
          trigger: { moistureLevel: "when top inch becomes dry" },
          target: { moistureLevel: "thoroughly moist" },
          volume: {
            amount: "moderate watering",
            frequency: "every 2-3 days typically",
          },
          notes: [
            "Allow slight drying between waterings once established",
            "Deep, less frequent watering encourages strong root development",
          ],
        },
        flowering: {
          trigger: { moistureLevel: "when top inch becomes dry" },
          target: { moistureLevel: "adequately moist" },
          volume: {
            amount: "consistent applications",
            frequency: "as soil indicates",
          },
          notes: [
            "Maintain consistent moisture during active harvest period",
            "Avoid getting water on leaves to prevent fungal issues",
          ],
        },
      },
      fertilization: {
        seedling: {
          products: [
            {
              name: "Bio-Tone starter fertilizer",
              dilution: "0.5 teaspoon per container",
              amount: "light application at transplanting",
              frequency: "one-time at transplant",
              method: "mix-in-soil",
            },
          ],
          timing: "At transplant to larger container",
          notes: [
            "Gentle introduction to feeding - basil responds well to organic fertilizers",
          ],
        },
        vegetative: {
          products: [
            {
              name: "Balanced organic fertilizer or compost tea",
              dilution: "half strength initially",
              amount: "light but regular feeding",
              frequency: "every 2-3 weeks",
            },
          ],
          timing: "Active growth phase",
          notes: [
            "Avoid excessive nitrogen which reduces essential oil concentration",
            "Organic fertilizers produce better flavor than synthetic",
          ],
        },
        flowering: {
          products: [
            {
              name: "Reduced feeding if flowers are pinched",
              dilution: "very light",
              amount: "minimal applications",
              frequency: "monthly if needed",
            },
          ],
          timing: "If flowering occurs",
          notes: [
            "Reduce feeding to maintain leaf quality",
            "Focus on preventing flowering rather than supporting it",
          ],
        },
      },
      environment: {
        temperature: { min: 65, max: 80, optimal: 75, unit: "F" },
        pH: { min: 6.0, max: 7.0, optimal: 6.5 },
      },
      soilMixture: {
        components: {
          "coco coir": 40,
          perlite: 30,
          vermiculite: 20,
          compost: 10,
        },
        amendments: {
          "worm castings": "1 tbsp per gallon",
          "Bio-Tone": "0.5 teaspoon per container",
        },
      },
      container: {
        minSize: "2-gallon container (8 inch diameter)",
        depth: "6-8 inches adequate for compact variety",
      },
      succession: {
        interval: 14, // 2-3 week intervals
        method: "continuous",
        harvestMethod: "cut-and-come-again",
        productiveWeeks: 8,
        notes: [
          "Succession every 2-3 weeks ensures continuous fresh leaves",
          "Pinch flowers immediately to extend productive harvest period",
        ],
      },
      specialRequirements: [
        "Warmth-loving plant - keep soil temperature above 65°F",
        "Pinch growing tips regularly to encourage bushy growth",
        "Remove flower buds immediately to maintain leaf production",
        "Harvest frequently to encourage new growth",
        "Prefers well-draining soil - avoid waterlogged conditions",
      ],
    },
  },

  {
    name: "English Thyme",
    category: "herbs",
    isEverbearing: true,
    productiveLifespan: 1095, // 3 years before replacement typically needed
    growthTimeline: {
      germination: 14, // 7-14 days with proper soil temperature
      seedling: 21, // 2-3 weeks early development
      vegetative: 84, // 6-12 weeks to establish
      maturation: 365, // Full maturity takes nearly a year
    },
    protocols: {
      lighting: {
        seedling: {
          ppfd: { min: 100, max: 300, unit: "µmol/m²/s" },
          photoperiod: { hours: 10, maxHours: 14 },
          dli: { min: 3.6, max: 15.1, unit: "mol/m²/day" },
          notes: [
            "Tiny seedlings emerge slowly - patience required",
            "Soil temperature between 68-77°F critical for germination",
          ],
        },
        vegetative: {
          ppfd: { min: 300, max: 600, unit: "µmol/m²/s" },
          photoperiod: { hours: 12, maxHours: 16 },
          dli: { min: 13.0, max: 34.6, unit: "mol/m²/day" },
          notes: [
            "Leaves grow to about 1 inch long, becoming dark green and aromatic",
            "Plant develops characteristic low, spreading growth habit",
          ],
        },
        flowering: {
          ppfd: { min: 600, max: 900, unit: "µmol/m²/s" },
          photoperiod: { hours: 14, maxHours: 16 },
          dli: { min: 30.2, max: 51.8, unit: "mol/m²/day" },
          notes: [
            "Small flowers appear in late spring to early summer",
            "Flowers can be pink, lavender, or white depending on variety",
          ],
        },
      },
      watering: {
        seedling: {
          trigger: { moistureLevel: "when surface begins to dry" },
          target: { moistureLevel: "barely moist" },
          volume: {
            amount: "very light applications",
            frequency: "careful monitoring",
          },
          notes: [
            "Critical period - overwatering kills more thyme seedlings than drought",
            "Use spray bottle for gentle moisture application",
          ],
        },
        vegetative: {
          trigger: { moistureLevel: "when soil is dry 1-2 inches down" },
          target: { moistureLevel: "lightly moist throughout" },
          volume: {
            amount: "moderate watering",
            frequency: "infrequent but thorough",
          },
          notes: [
            "Allow significant drying between waterings",
            "Thyme tolerates drought better than excess moisture",
          ],
        },
        flowering: {
          trigger: { moistureLevel: "when soil is quite dry" },
          target: { moistureLevel: "lightly moist" },
          volume: {
            amount: "minimal watering",
            frequency: "only when necessary",
          },
          notes: [
            "Established thyme is extremely drought tolerant",
            "Excess water dilutes essential oils and reduces flavor intensity",
          ],
        },
      },
      fertilization: {
        seedling: {
          products: [
            {
              name: "Crushed oyster shell",
              dilution: "0.5 teaspoon per container",
              amount: "mixed into soil at planting",
              frequency: "one-time soil amendment",
              method: "mix-in-soil",
            },
          ],
          timing: "At transplanting",
          notes: [
            "Provides slow-release calcium and helps with drainage",
            "Mediterranean herbs prefer slightly alkaline conditions",
          ],
        },
        vegetative: {
          products: [
            {
              name: "Very dilute compost tea (optional)",
              dilution: "quarter strength or less",
              amount: "minimal application",
              frequency: "monthly if at all",
            },
          ],
          timing: "Growing season only",
          notes: [
            "Thyme actually performs better in lean soils",
            "Too much fertility produces weak, less flavorful growth",
          ],
        },
        flowering: {
          notes: [
            "No fertilization needed during flowering period",
            "Plant has adapted to survive on minimal nutrients",
          ],
        },
      },
      environment: {
        temperature: { min: 60, max: 80, optimal: 70, unit: "F" },
        humidity: { min: 30, max: 50, optimal: 40 },
        pH: { min: 6.0, max: 8.0, optimal: 6.5 },
      },
      soilMixture: {
        components: {
          "coco coir": 40,
          perlite: 30,
          "coarse sand": 20,
          vermiculite: 10,
        },
        amendments: {
          compost: "0.5 tablespoon per container (minimal)",
          "crushed oyster shell": "0.5 teaspoon per container",
        },
      },
      container: {
        minSize: "2-gallon pot (8 inch diameter)",
        depth: "6-8 inches adequate",
        drainage: "Excellent drainage absolutely essential",
      },
      specialRequirements: [
        "Excellent drainage absolutely critical - will not tolerate wet feet",
        "Prefers lean, mineral soils over rich organic matter",
        "Drought tolerant once established - err on side of underwatering",
        "Benefits from good air circulation to prevent fungal issues",
        "Harvest by cutting stems above woody growth to encourage branching",
        "Extremely long-lived perennial if drainage requirements are met",
      ],
    },
  },

  {
    name: "Greek Oregano",
    category: "herbs",
    isEverbearing: true,
    productiveLifespan: 730, // 2 years typical productive life
    growthTimeline: {
      germination: 14, // 7-14 days at proper temperature
      seedling: 28, // 4-6 weeks to establish
      vegetative: 56, // 6-8 weeks to harvestable size
      maturation: 90, // 80-90 days to full maturity
    },
    protocols: {
      lighting: {
        seedling: {
          ppfd: { min: 100, max: 300, unit: "µmol/m²/s" },
          photoperiod: { hours: 10, maxHours: 14 },
          dli: { min: 3.6, max: 15.1, unit: "mol/m²/day" },
          notes: [
            "Seeds germinate at 65-70°F soil temperature",
            "Transplant when seedlings have four true leaves",
          ],
        },
        vegetative: {
          ppfd: { min: 300, max: 600, unit: "µmol/m²/s" },
          photoperiod: { hours: 12, maxHours: 16 },
          dli: { min: 13.0, max: 34.6, unit: "mol/m²/day" },
          notes: [
            "Plant develops more leaves and branches during this phase",
            "Pinching and pruning encourage bushy growth habit",
          ],
        },
        flowering: {
          ppfd: { min: 500, max: 750, unit: "µmol/m²/s" },
          photoperiod: { hours: 14, maxHours: 16 },
          dli: { min: 25.2, max: 43.2, unit: "mol/m²/day" },
          notes: [
            "Small white flowers appear as plant reaches maturity",
            "Harvest often best when plant is beginning to flower",
          ],
        },
      },
      watering: {
        seedling: {
          trigger: { moistureLevel: "when surface starts to dry" },
          target: { moistureLevel: "evenly moist but not saturated" },
          volume: {
            amount: "light, frequent applications",
            frequency: "daily monitoring",
          },
          notes: [
            "Keep soil consistently moist during establishment",
            "Avoid waterlogging which can cause root rot",
          ],
        },
        vegetative: {
          trigger: { moistureLevel: "when top inch is dry" },
          target: { moistureLevel: "moderately moist throughout" },
          volume: {
            amount: "thorough but infrequent watering",
            frequency: "every 2-4 days",
          },
          notes: [
            "Allow some drying between waterings to encourage strong roots",
            "Deep watering less frequently better than frequent shallow watering",
          ],
        },
        flowering: {
          trigger: { moistureLevel: "when soil is quite dry" },
          target: { moistureLevel: "lightly moist" },
          volume: { amount: "minimal watering", frequency: "only as needed" },
          notes: [
            "Mature oregano is quite drought tolerant",
            "Reduce watering to concentrate essential oils for better flavor",
          ],
        },
      },
      fertilization: {
        seedling: {
          products: [
            {
              name: "Light compost incorporation",
              dilution: "0.5 tablespoon per container",
              amount: "mixed into soil at planting",
              frequency: "one-time soil preparation",
              method: "mix-in-soil",
            },
          ],
          timing: "At container preparation",
          notes: [
            "Light organic matter supports establishment without overfeeding",
          ],
        },
        vegetative: {
          products: [
            {
              name: "Dilute compost tea or fish emulsion",
              dilution: "quarter to half strength",
              amount: "light application",
              frequency: "monthly during active growth",
            },
          ],
          timing: "Growing season",
          notes: [
            "Light feeding only - oregano prefers lean conditions",
            "Overfertilization reduces essential oil concentration",
          ],
        },
        flowering: {
          notes: [
            "Cease fertilization when flowering begins",
            "Lean conditions during flowering concentrate flavor compounds",
          ],
        },
      },
      environment: {
        temperature: { min: 65, max: 85, optimal: 75, unit: "F" },
        humidity: { min: 30, max: 60, optimal: 45 },
        pH: { min: 6.0, max: 8.0, optimal: 6.8 },
      },
      soilMixture: {
        components: {
          "coco coir": 40,
          perlite: 30,
          "coarse sand": 20,
          vermiculite: 10,
        },
        amendments: {
          compost: "0.5 tablespoon per container",
          "crushed oyster shell": "0.5 teaspoon per container",
        },
      },
      container: {
        minSize: "12 inch diameter pot",
        depth: "6-8 inches adequate for root system",
      },
      succession: {
        interval: 0, // Perennial - no succession needed
        method: "single",
        harvestMethod: "cut-and-come-again",
        notes: [
          "Harvest by cutting top third of stems above a node",
          "Regular harvesting encourages new branching and continued production",
        ],
      },
      specialRequirements: [
        "Requires excellent drainage - will not tolerate waterlogged soil",
        "Benefits from slightly alkaline soil conditions",
        "Regular harvesting by cutting stems encourages bushier growth",
        "Can be somewhat invasive if allowed to spread naturally",
        "Winter protection may be needed in very cold climates",
      ],
    },
  },

  {
    name: "Albion Strawberries",
    category: "berries",
    isEverbearing: true,
    productiveLifespan: 730, // 2 years before replacement recommended
    growthTimeline: {
      germination: 14, // if starting from seed (rare)
      seedling: 28, // establishment from bare root
      vegetative: 42, // active growth before flowering
      maturation: 90, // to full production
    },
    protocols: {
      lighting: {
        establishment: {
          ppfd: { min: 200, max: 200, optimal: 200, unit: "µmol/m²/s" },
          photoperiod: {
            hours: 14,
            maxHours: 16,
            constraint: "day-neutral varieties require consistent photoperiod",
          },
          dli: { min: 10.1, max: 11.5, unit: "mol/m²/day" },
          notes: [
            "Remove flowers for the first 4-6 weeks to encourage strong plant establishment",
            "Focus energy on root and crown development",
          ],
        },
        vegetative: {
          ppfd: { min: 300, max: 400, unit: "µmol/m²/s" },
          photoperiod: {
            hours: 16,
            constraint:
              "consistent 16h photoperiod is critical for continuous production",
          },
          dli: { min: 17.3, max: 23.0, unit: "mol/m²/day" },
          notes: [
            "Remove ALL runners as soon as they are spotted - check weekly",
            "Energy must go to fruit production, not vegetative reproduction",
          ],
        },
        flowering: {
          ppfd: { min: 350, max: 400, unit: "µmol/m²/s" },
          photoperiod: {
            hours: 16,
            constraint:
              "critical for continuous flowering in day-neutral types",
          },
          dli: { min: 20.2, max: 23.0, unit: "mol/m²/day" },
          notes: [
            "Hand pollination is critical indoors",
            "Use a small brush to transfer pollen every 1-2 days",
          ],
        },
        fruiting: {
          ppfd: { min: 450, max: 500, unit: "µmol/m²/s" },
          photoperiod: { hours: 16 },
          dli: { min: 25.9, max: 28.8, unit: "mol/m²/day" },
          notes: [
            "Higher light intensity supports fruit development and sugar accumulation",
          ],
        },
        ongoingProduction: {
          ppfd: { min: 350, max: 400, unit: "µmol/m²/s" },
          photoperiod: { hours: 16 },
          dli: { min: 20.2, max: 23.0, unit: "mol/m²/day" },
          notes: [
            "Monthly flush with pH-adjusted plain water until 20-30% runoff",
            "Prevents salt buildup from intensive feeding",
          ],
        },
      },
      watering: {
        establishment: {
          trigger: { moistureLevel: "3-4" },
          target: { moistureLevel: "6-7" },
          volume: {
            amount:
              "5-gal: 20-30 oz (590-890 mL), 2-gal hanging: 8-10 oz (235-300 mL)",
            frequency: "3-4x/week",
            perPlant: true,
          },
          notes: [
            "Remove flowers for first 4-6 weeks to encourage establishment",
          ],
        },
        vegetative: {
          trigger: { moistureLevel: "3-4" },
          target: { moistureLevel: "6-7" },
          volume: {
            amount:
              "5-gal: 25-35 oz (740-1030 mL), 2-gal hanging: 10-13 oz (300-385 mL)",
            frequency: "3-5x/week",
            perPlant: true,
          },
          notes: [
            "Remove ALL runners as soon as spotted - weekly checks essential",
          ],
        },
        flowering: {
          trigger: { moistureLevel: "3-4" },
          target: { moistureLevel: "6-7" },
          volume: {
            amount:
              "5-gal: 30-35 oz (890-1030 mL), 2-gal hanging: 10-13 oz (300-385 mL)",
            frequency: "4-5x/week",
            perPlant: true,
          },
          notes: [
            "Consistent moisture critical during flower and early fruit development",
          ],
        },
        fruiting: {
          trigger: { moistureLevel: "3-4" },
          target: { moistureLevel: "6-7" },
          volume: {
            amount:
              "5-gal: 30-35 oz (890-1030 mL), 2-gal hanging: 10-13 oz (300-385 mL)",
            frequency: "4-5x/week",
            perPlant: true,
          },
        },
        ongoingProduction: {
          trigger: { moistureLevel: "3-4" },
          target: { moistureLevel: "6-7" },
          volume: {
            amount:
              "5-gal: 25-35 oz (740-1030 mL), 2-gal hanging: 10-13 oz (300-385 mL)",
            frequency: "3-5x/week",
            perPlant: true,
          },
          notes: [
            "Monthly flush: irrigate with pH-adjusted plain water until 20-30% runoff",
          ],
        },
      },
      fertilization: {
        establishment: {
          products: [
            {
              name: "Neptune's Harvest Fish + Seaweed",
              dilution: "½ strength, 0.5 Tbsp/gal",
              amount: "Week 2 application",
              frequency: "one-time during establishment",
            },
            {
              name: "Bone meal",
              dilution: "1 Tbsp/5gal",
              amount: "mixed at planting",
              frequency: "at planting",
              method: "mix-in-soil",
            },
          ],
          timing: "Weeks 0-3",
          notes: ["Remove flowers for first 4-6 weeks"],
        },
        vegetative: {
          products: [
            {
              name: "Neptune's Harvest",
              dilution: "½ strength",
              amount: "Week 4, 6 applications",
              frequency: "bi-weekly",
            },
            {
              name: "Neptune's Harvest",
              dilution: "full strength, 1 Tbsp/gal",
              amount: "Week 5, 7 applications",
              frequency: "bi-weekly",
            },
          ],
          timing: "Weeks 4-6",
          notes: [
            "Remove flowers for first 4-6 weeks",
            "Remove ALL runners weekly",
          ],
        },
        flowering: {
          products: [
            {
              name: "Espoma Berry-Tone",
              dilution: "2 Tbsp/bag",
              amount: "Week 8 application",
              frequency: "one-time",
              method: "top-dress",
            },
            {
              name: "Kelp/sea-mineral",
              dilution: "1 Tbsp/gal",
              amount: "Week 9, 11 applications",
              frequency: "bi-weekly",
            },
            {
              name: "Bone meal",
              dilution: "½ Tbsp/bag",
              amount: "Week 10 application",
              frequency: "one-time",
              method: "top-dress",
            },
          ],
          timing: "Weeks 7-8",
          notes: ["Hand pollinate every 1-2 days during flowering"],
        },
        fruiting: {
          products: [
            {
              name: "Kelp/sea-mineral",
              dilution: "1 Tbsp/gal",
              amount: "Week 13, 15 applications",
              frequency: "bi-weekly",
            },
            {
              name: "Fish & Seaweed + high-K supplement",
              dilution: "as directed",
              amount: "bi-weekly applications",
              frequency: "every 2 weeks",
            },
          ],
          timing: "Weeks 9-13",
          notes: ["Harvest begins 4-5 weeks after flowering"],
        },
        ongoingProduction: {
          products: [
            {
              name: "Kelp",
              dilution: "1 Tbsp/gal",
              amount: "Week 1 of cycle",
              frequency: "alternating 2-week cycle",
            },
            {
              name: "Berry-Tone",
              dilution: "1 Tbsp/bag",
              amount: "Week 3 of cycle",
              frequency: "alternating 2-week cycle",
              method: "top-dress",
            },
          ],
          timing: "Week 14+",
          notes: [
            "Monthly flush with pH-adjusted water to prevent salt buildup",
          ],
        },
      },
      environment: {
        pH: { min: 5.8, max: 6.5, optimal: 6.2 },
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
    productiveLifespan: 1095, // 3 years productive life
    growthTimeline: {
      germination: 0, // typically grown from canes, not seed
      seedling: 21, // cane establishment
      vegetative: 42, // active growth
      maturation: 120, // to fruit production
    },
    protocols: {
      lighting: {
        caneEstablishment: {
          ppfd: { min: 200, max: 300, unit: "µmol/m²/s" },
          photoperiod: { hours: 16, maxHours: 18 },
          dli: { min: 11.5, max: 19.4, unit: "mol/m²/day" },
          notes: [
            "Focus on establishing strong root system and cane structure",
          ],
        },
        vegetative: {
          ppfd: { min: 300, max: 400, unit: "µmol/m²/s" },
          photoperiod: { hours: 16 },
          dli: { min: 17.3, max: 23.0, unit: "mol/m²/day" },
        },
        floweringFruiting: {
          ppfd: { min: 400, max: 600, unit: "µmol/m²/s" },
          photoperiod: { hours: 14, maxHours: 16 },
          dli: { min: 22.7, max: 34.6, unit: "mol/m²/day" },
          notes: [
            "Higher light intensity supports fruit development and sugar content",
          ],
        },
        ongoing: {
          ppfd: { min: 350, max: 500, unit: "µmol/m²/s" },
          photoperiod: { hours: 16 },
          dli: { min: 20.2, max: 28.8, unit: "mol/m²/day" },
        },
      },
      watering: {
        caneEstablishment: {
          trigger: { moistureLevel: "3-4" },
          target: { moistureLevel: "6-7" },
          volume: {
            amount: "monitor with soil moisture meter",
            frequency: "as needed",
          },
          notes: ["Always water until slight drainage occurs"],
        },
        vegetative: {
          trigger: { moistureLevel: "3-4" },
          target: { moistureLevel: "6-7" },
          volume: {
            amount: "monitor with soil moisture meter",
            frequency: "as needed",
          },
        },
        floweringFruiting: {
          trigger: { moistureLevel: "3-4" },
          target: { moistureLevel: "7-8" },
          volume: {
            amount: "monitor with soil moisture meter",
            frequency: "as needed",
          },
          notes: ["Higher moisture during fruit development"],
        },
        ongoing: {
          trigger: { moistureLevel: "3-4" },
          target: { moistureLevel: "6-7" },
          volume: {
            amount: "monitor with soil moisture meter",
            frequency: "as needed",
          },
        },
      },
      fertilization: {
        caneEstablishment: {
          products: [
            {
              name: "Compost top-dress",
              dilution: "1-2 inches",
              amount: "at planting",
              frequency: "at planting",
              method: "top-dress",
            },
          ],
        },
        vegetative: {
          products: [
            {
              name: "Fish Emulsion",
              dilution: "1-2 tbsp/gallon",
              amount: "as needed",
              frequency: "every 2-4 weeks",
            },
          ],
        },
        floweringFruiting: {
          products: [
            {
              name: "Liquid Kelp + balanced organic fertilizer",
              dilution: "as directed",
              amount: "as needed",
              frequency: "every 2-3 weeks",
            },
            {
              name: "Kelp Extract + K-rich formula",
              dilution: "as directed",
              amount: "as needed",
              frequency: "every 1-2 weeks",
            },
          ],
          notes: ["Higher potassium supports fruit development and flavor"],
        },
        ongoing: {
          products: [
            {
              name: "Aerobically brewed compost tea",
              dilution: "as brewed",
              amount: "monthly applications",
              frequency: "monthly",
            },
          ],
        },
      },
      environment: {
        pH: { min: 5.8, max: 6.5, optimal: 6.0 },
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
      germination: 14,
      seedling: 14,
      vegetative: 28, // 14 days vegetative + 14 days root development
      maturation: 70,
    },
    protocols: {
      lighting: {
        germination: {
          ppfd: { min: 100, max: 150, unit: "µmol/m²/s" },
          photoperiod: {
            hours: 12,
            maxHours: 12,
            constraint: "strict maximum to prevent bolting",
          },
          dli: { min: 4.3, max: 6.5, unit: "mol/m²/day" },
          notes: [
            "Maintain consistent moisture",
            "Critical photoperiod control",
          ],
        },
        seedling: {
          ppfd: { min: 150, max: 300, unit: "µmol/m²/s" },
          photoperiod: {
            hours: 12,
            maxHours: 12,
            constraint: "photoperiods >12h may trigger premature bolting",
          },
          dli: { min: 6.5, max: 13.0, unit: "mol/m²/day" },
          notes: ["Critical photoperiod - max 12 hours"],
        },
        vegetative: {
          ppfd: { min: 200, max: 200, optimal: 200, unit: "µmol/m²/s" },
          photoperiod: {
            hours: 12,
            maxHours: 12,
            constraint:
              "photoperiods >12h may trigger premature bolting, especially if warm",
          },
          dli: { min: 8.6, max: 8.6, unit: "mol/m²/day" },
          notes: ["Strict 12-hour maximum", "Especially critical if warm"],
        },
        rootDevelopment: {
          ppfd: { min: 300, max: 600, unit: "µmol/m²/s" },
          photoperiod: {
            hours: 12,
            maxHours: 12,
            constraint: "maintain strict limit",
          },
          dli: { min: 13.0, max: 25.9, unit: "mol/m²/day" },
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
          target: { moistureLevel: "6-7", description: "top inch" },
          volume: { amount: "8-12 oz", frequency: "daily" },
          notes: ["Maintain consistent moisture"],
        },
        seedling: {
          trigger: { moistureLevel: "4-5" },
          target: { moistureLevel: "6-7" },
          volume: { amount: "16-24 oz", frequency: "every 2-3 days" },
        },
        vegetative: {
          trigger: { moistureLevel: "3-4" },
          target: { moistureLevel: "6-7" },
          volume: { amount: "24-32 oz", frequency: "every 2-4 days" },
          notes: [
            "Photoperiods >12h may trigger premature bolting, especially if warm",
          ],
        },
        rootDevelopment: {
          trigger: { moistureLevel: "3-4" },
          target: { moistureLevel: "6-7" },
          volume: { amount: "32-40 oz", frequency: "every 3-4 days" },
          notes: [
            "Consistent moisture prevents splitting",
            "21-day succession",
          ],
        },
      },
      fertilization: {
        germination: {
          notes: ["None until true leaves appear"],
        },
        seedling: {
          products: [
            {
              name: "Worm Casting Tea",
              dilution: "1 part castings:10 parts water, steep 12-24h",
              amount: "apply as needed",
              frequency: "every 1-2 weeks",
            },
            {
              name: "Fish Emulsion (alternative)",
              dilution: "0.5-1 Tbsp/gal",
              amount: "apply as needed",
              frequency: "every 2-3 weeks",
            },
          ],
          timing: "Weeks 3-5",
        },
        vegetative: {
          products: [
            {
              name: "Lower-N Fish Emulsion",
              dilution: "1 Tbsp/gal",
              amount: "apply as needed",
              frequency: "every 2-3 weeks",
            },
            {
              name: "Worm Casting Tea",
              dilution: "1 part castings:10 parts water",
              amount: "apply as needed",
              frequency: "every 1-2 weeks",
            },
            {
              name: "Liquid Kelp/Seaweed Extract",
              dilution: "1-2 Tbsp/gal",
              amount: "apply as needed",
              frequency: "every 2-3 weeks",
            },
          ],
          timing: "Weeks 5/6 to Harvest",
        },
        rootDevelopment: {
          products: [
            {
              name: "Continue same as vegetative",
              dilution: "as above",
              amount: "as above",
              frequency: "as above",
            },
          ],
        },
      },
      environment: {
        pH: { min: 6.0, max: 6.8, optimal: 6.5 },
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
    name: "Astro Arugula",
    category: "leafy-greens",
    isEverbearing: true,
    productiveLifespan: 56, // 6-8 weeks productive per plant
    growthTimeline: {
      germination: 5,
      seedling: 14,
      vegetative: 14,
      maturation: 37,
    },
    protocols: {
      lighting: {
        germination: {
          ppfd: { min: 70, max: 150, unit: "µmol/m²/s" },
          photoperiod: { hours: 12, maxHours: 12 },
          dli: { min: 3.0, max: 6.5, unit: "mol/m²/day" },
          notes: ["Keep soil warm 60-70°F", "Even moisture"],
        },
        seedling: {
          ppfd: { min: 150, max: 250, unit: "µmol/m²/s" },
          photoperiod: { hours: 10, maxHours: 12 },
          dli: { min: 5.4, max: 10.8, unit: "mol/m²/day" },
          notes: ["Keep soil warm 60-70°F", "Even moisture"],
        },
        vegetative: {
          ppfd: { min: 200, max: 250, unit: "µmol/m²/s" },
          photoperiod: { hours: 10, maxHours: 12 },
          dli: { min: 7.2, max: 10.8, unit: "mol/m²/day" },
        },
        postHarvestRegrowth: {
          ppfd: { min: 200, max: 250, unit: "µmol/m²/s" },
          photoperiod: { hours: 10, maxHours: 12 },
          dli: { min: 7.2, max: 10.8, unit: "mol/m²/day" },
          notes: ["14-day succession interval", "Cut-and-come-again"],
        },
      },
      watering: {
        germination: {
          trigger: { moistureLevel: "3-4" },
          target: { moistureLevel: "6-7" },
          volume: { amount: "2-4 fl oz (60-120 mL)", frequency: "2-3x/week" },
          notes: ["Keep soil warm (60-70°F)", "Even moisture"],
        },
        seedling: {
          trigger: { moistureLevel: "3-4" },
          target: { moistureLevel: "6-7" },
          volume: { amount: "2-4 fl oz (60-120 mL)", frequency: "2-3x/week" },
          notes: ["Keep soil warm (60-70°F)", "Even moisture"],
        },
        vegetative: {
          trigger: { moistureLevel: "3-4" },
          target: { moistureLevel: "6-7" },
          volume: { amount: "8-12 fl oz (240-350 mL)", frequency: "2-3x/week" },
        },
        postHarvestRegrowth: {
          trigger: { moistureLevel: "3-4" },
          target: { moistureLevel: "6-7" },
          volume: {
            amount: "12-16 fl oz (350-470 mL)",
            frequency: "2-3x/week",
          },
          notes: ["14-day succession interval"],
        },
      },
      fertilization: {
        germination: {
          notes: ["None until true leaves appear"],
        },
        seedling: {
          products: [
            {
              name: "Fish Emulsion",
              dilution: "1-2 Tbsp/gal",
              amount: "apply as needed",
              frequency: "every 2 weeks",
            },
          ],
        },
        vegetative: {
          products: [
            {
              name: "Fish Emulsion",
              dilution: "1-2 Tbsp/gal",
              amount: "apply as needed",
              frequency: "every 2 weeks",
            },
          ],
        },
        postHarvestRegrowth: {
          products: [
            {
              name: "Fish Emulsion",
              dilution: "1-2 Tbsp/gal",
              amount: "apply as needed",
              frequency: "every 2 weeks",
            },
          ],
        },
      },
      environment: {
        temperature: { min: 60, max: 70, optimal: 65, unit: "F" },
        pH: { min: 6.0, max: 7.0, optimal: 6.5 },
      },
      soilMixture: {
        components: {
          "coco coir": 40,
          perlite: 25,
          vermiculite: 25,
          "worm castings": 10,
        },
        amendments: {
          "additional compost or organic 4-4-4 granular fertilizer":
            "½–1 cup per cubic foot",
        },
      },
      container: {
        depth: "4-6 inches",
        staging: {
          seedling: "Cell tray",
          intermediate: "4 inch pot",
          final: "4-6 inch pot or bed section",
        },
      },
      succession: {
        interval: 14,
        method: "continuous",
        harvestMethod: "cut-and-come-again",
        productiveWeeks: 8,
        notes: [
          "Baby leaves ~21 days",
          "Full flavor ~37-40 days",
          "6-8 weeks productive per plant",
        ],
      },
      specialRequirements: [
        "Strict photoperiod control prevents bolting",
        "Cut outer leaves only, leave center intact",
        "Temperature control critical in warm conditions",
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
          dli: { min: 13.0, max: 22.7, unit: "mol/m²/day" },
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
          volume: { amount: "24-28 oz", frequency: "every 3-4 days" },
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
        germination: {
          notes: ["None during germination"],
        },
        vegetative: {
          products: [
            {
              name: "Diluted fish/kelp tea",
              dilution: "¼ strength",
              amount: "apply after 2nd true leaf",
              frequency: "weeks 1-3",
            },
            {
              name: "Worm castings + bone meal",
              dilution: "1 tbsp worm castings + 1 tbsp bone meal per container",
              amount: "at transplant",
              frequency: "weeks 3-6",
            },
          ],
        },
        rootDevelopment: {
          products: [
            {
              name: "Liquid kelp or fish + seaweed",
              dilution: "1 tbsp/gal",
              amount: "apply as needed",
              frequency: "every 2 weeks",
            },
            {
              name: "Kelp meal for boron",
              dilution: "as directed",
              amount: "supplement",
              frequency: "as needed",
            },
          ],
        },
        maturation: {
          notes: ["Stop feeding 10–14 days before harvest"],
        },
      },
      environment: {
        temperature: { min: 65, max: 75, optimal: 70, unit: "F" },
        pH: { min: 6.5, max: 7.0, optimal: 6.8 },
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
      container: {
        depth: "10 inches minimum",
      },
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
      germination: 14, // slip production
      seedling: 21, // establishment
      vegetative: 42, // vine growth
      maturation: 100, // tuber development to harvest
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
            frequency: "1x/week then stop completely 3-7 days pre-harvest",
          },
          notes: ["Final phase preparation"],
        },
      },
      fertilization: {
        slipProduction: {
          products: [
            {
              name: "Beauregard: Soil amendments at planting",
              dilution: "N/A",
              amount: "soil prep",
              frequency: "at planting",
            },
            {
              name: "Jewel: Neptune's Harvest (likely ½ strength)",
              dilution: "½ strength",
              amount: "Wk 1 & 2",
              frequency: "weekly",
            },
            {
              name: "Tomato & Veg Formula (2-4-2)",
              dilution: "as directed",
              amount: "for establishment",
              frequency: "Wk 1 & 2",
            },
          ],
        },
        vegetativeGrowth: {
          products: [
            {
              name: "Beauregard: Blood Meal",
              dilution: "0.5c bed / 5 Tbsp bag",
              amount: "at Wk 4-5",
              frequency: "once",
            },
            {
              name: "Jewel: Blood Meal + Fish & Seaweed Blend",
              dilution: "as directed",
              amount: "Wk 4-5",
              frequency: "as directed",
            },
          ],
        },
        tuberDevelopment: {
          products: [
            {
              name: "Beauregard: Kelp Meal",
              dilution: "0.75c bed / 7.5 Tbsp bag",
              amount: "Wk 8-9",
              frequency: "once",
            },
            {
              name: "Foliar K₂SO₄",
              dilution: "1-2 Tbsp/gal",
              amount: "foliar spray",
              frequency: "Wk 10-11",
              method: "foliar-spray",
            },
            {
              name: "2nd Kelp Meal",
              dilution: "as above",
              amount: "Wk 12-13",
              frequency: "once",
            },
          ],
        },
        maturation: {
          products: [
            {
              name: "Final K₂SO₄/KNO₃",
              dilution: "as directed",
              amount: "for skin set",
              frequency: "2-3 wks pre-harvest",
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
        pH: { min: 5.8, max: 6.2, optimal: 6.0 },
      },
      soilMixture: {
        components: {
          "coco coir": 40,
          perlite: 30,
          vermiculite: 25,
          "sandy loam": 5,
        },
        amendments: {
          "well-rotted manure": "3 tbsp per gallon",
        },
      },
      container: {
        depth: "18-24 inches",
        staging: {
          final: "Large containers for extensive root system",
        },
      },
      succession: {
        interval: 0, // Single harvest crop
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

  {
    name: "Baby's Leaf Spinach",
    category: "leafy-greens",
    isEverbearing: true,
    productiveLifespan: 42, // 6-10 weeks harvest window
    growthTimeline: {
      germination: 7,
      seedling: 14,
      vegetative: 14,
      maturation: 45,
    },
    protocols: {
      lighting: {
        germination: {
          ppfd: { min: 100, max: 150, unit: "µmol/m²/s" },
          photoperiod: { hours: 12, maxHours: 14 },
          dli: { min: 4.3, max: 7.6, unit: "mol/m²/day" },
          notes: ["Keep consistent temperature"],
        },
        seedling: {
          ppfd: { min: 150, max: 200, unit: "µmol/m²/s" },
          photoperiod: { hours: 12, maxHours: 14 },
          dli: { min: 6.5, max: 10.1, unit: "mol/m²/day" },
        },
        transplant: {
          ppfd: { min: 200, max: 250, unit: "µmol/m²/s" },
          photoperiod: { hours: 12, maxHours: 14 },
          dli: { min: 8.6, max: 12.6, unit: "mol/m²/day" },
        },
        vegetativeHarvest: {
          ppfd: { min: 250, max: 250, optimal: 250, unit: "µmol/m²/s" },
          photoperiod: { hours: 12, maxHours: 14 },
          dli: { min: 10.8, max: 12.6, unit: "mol/m²/day" },
          notes: ["14-day succession interval"],
        },
      },
      watering: {
        germination: {
          trigger: { moistureLevel: "less than 4" },
          target: { moistureLevel: 6 },
          volume: { amount: "mist as needed", frequency: "daily" },
        },
        seedling: {
          trigger: { moistureLevel: "less than 4" },
          target: { moistureLevel: 6 },
          volume: { amount: "mist as needed", frequency: "as needed" },
        },
        transplant: {
          trigger: { moistureLevel: "less than 4" },
          target: { moistureLevel: 6 },
          volume: {
            amount: "water thoroughly to settle then as needed",
            frequency: "as needed",
          },
        },
        vegetativeHarvest: {
          trigger: { moistureLevel: "less than 4" },
          target: { moistureLevel: 6 },
          volume: { amount: "~1 gal/week for bed", frequency: "as needed" },
          notes: ["14-day succession interval"],
        },
      },
      fertilization: {
        germination: {
          notes: ["None during germination"],
        },
        seedling: {
          products: [
            {
              name: "Fish emulsion",
              dilution: "2 Tbsp/gal",
              amount: "around Wk 2 (1-2 true leaves)",
              frequency: "every 2 weeks",
            },
          ],
        },
        transplant: {
          products: [
            {
              name: "Fish emulsion",
              dilution: "2 Tbsp/gal",
              amount: "continue regimen",
              frequency: "every 2 weeks",
            },
          ],
        },
        vegetativeHarvest: {
          products: [
            {
              name: "Fish emulsion",
              dilution: "2 Tbsp/gal",
              amount: "continue regimen",
              frequency: "every 2 weeks",
            },
          ],
          notes: ["14-day succession interval"],
        },
      },
      environment: {
        pH: { min: 6.0, max: 7.5, optimal: 6.7 },
      },
      soilMixture: {
        components: {
          "coco coir": 35,
          perlite: 25,
          vermiculite: 15,
          compost: 25,
        },
        amendments: {
          "worm castings": "1 tbsp per gallon",
        },
      },
      succession: {
        interval: 14,
        method: "continuous",
        harvestMethod: "cut-and-come-again",
        notes: ["Baby leaves ready 30-45 days", "Multiple harvests per plant"],
      },
      specialRequirements: [
        "Highly sensitive to bolting - strict photoperiod control",
        "Cool season crop - avoid temperatures above 75°F",
        "Cut outer leaves only for continuous harvest",
      ],
    },
  },
  {
    name: "Rosemary",
    category: "herbs",
    isEverbearing: true,
    productiveLifespan: 1095, // 3 years
    growthTimeline: {
      germination: 21, // 14-21 days - notoriously slow and difficult
      seedling: 84, // 2-3 months to establish
      vegetative: 365, // 6-12 months to reach harvestable size
      maturation: 730, // 2+ years to full maturity
    },
    protocols: {
      lighting: {
        seedling: {
          ppfd: { min: 100, max: 300, unit: "µmol/m²/s" },
          photoperiod: { hours: 12, maxHours: 16 },
          dli: { min: 4.3, max: 17.3, unit: "mol/m²/day" },
          notes: [
            "Starting from seed extremely challenging - low germination rates",
            "Growth initially very slow - patience absolutely essential",
            "Consider starting from cuttings for more reliable establishment",
          ],
        },
        vegetative: {
          ppfd: { min: 300, max: 600, unit: "µmol/m²/s" },
          photoperiod: { hours: 14, maxHours: 16 },
          dli: { min: 17.3, max: 34.6, unit: "mol/m²/day" },
          notes: [
            "Plant slowly develops into bush with woody stems and needle-like leaves",
            "Growth accelerates significantly in second year",
          ],
        },
        flowering: {
          ppfd: { min: 200, max: 400, unit: "µmol/m²/s" },
          photoperiod: { hours: 12, maxHours: 16 },
          dli: { min: 8.6, max: 23.0, unit: "mol/m²/day" },
          notes: [
            "Small blue flowers appear along stems when mature",
            "Pruning after flowering helps maintain compact shape",
          ],
        },
      },
      watering: {
        seedling: {
          trigger: { moistureLevel: "when surface becomes dry" },
          target: { moistureLevel: "barely moist" },
          volume: {
            amount: "minimal applications",
            frequency: "infrequent but careful",
          },
          notes: [
            "Most critical phase - overwatering kills more rosemary than drought",
            "Use spray bottle or very gentle watering to avoid disturbing tiny roots",
          ],
        },
        vegetative: {
          trigger: { moistureLevel: "when soil is dry 2-3 inches down" },
          target: { moistureLevel: "lightly moist in root zone only" },
          volume: {
            amount: "deep but infrequent watering",
            frequency: "weekly or less",
          },
          notes: [
            "Allow substantial drying between waterings",
            "Established rosemary can survive weeks without water",
          ],
        },
        flowering: {
          trigger: { moistureLevel: "when soil is quite dry throughout" },
          target: { moistureLevel: "minimal moisture" },
          volume: {
            amount: "very light watering",
            frequency: "only when absolutely necessary",
          },
          notes: [
            "Mature rosemary is extremely drought tolerant",
            "Excess water during flowering reduces essential oil concentration",
          ],
        },
      },
      fertilization: {
        seedling: {
          products: [
            {
              name: "Limestone",
              dilution: "0.5 tbsp per gallon of soil mix",
              amount: "incorporated during soil preparation",
              frequency: "one-time soil amendment",
              method: "mix-in-soil",
            },
          ],
          timing: "Soil preparation",
          notes: [
            "Limestone provides calcium and raises pH to preferred alkaline range",
            "No other fertilization needed during establishment",
          ],
        },
        vegetative: {
          products: [
            {
              name: "Very dilute compost tea (optional)",
              dilution: "quarter strength maximum",
              amount: "minimal application",
              frequency: "2-3 times per growing season maximum",
            },
          ],
          timing: "Spring growing season only",
          notes: [
            "Rosemary actually performs better with minimal nutrition",
            "Rich soil produces weak growth susceptible to fungal problems",
          ],
        },
        flowering: {
          notes: [
            "No fertilization during flowering or dormant periods",
            "Plant has evolved to thrive in nutrient-poor Mediterranean soils",
          ],
        },
      },
      environment: {
        temperature: { min: 55, max: 80, optimal: 68, unit: "F" },
        humidity: { min: 20, max: 50, optimal: 35 },
        pH: { min: 6.0, max: 7.0, optimal: 6.5 },
      },
      soilMixture: {
        components: {
          "coco coir": 40,
          perlite: 30,
          "coarse sand": 25,
          compost: 5,
        },
        amendments: {
          limestone: "0.5 tbsp per gallon of mix",
        },
      },
      container: {
        minSize: "2-gallon pot minimum (12 inch diameter preferred)",
        depth: "8-10 inches minimum for mature root system",
        drainage: "Exceptional drainage absolutely critical",
      },
      specialRequirements: [
        "Requires exceptional drainage - will die in waterlogged soil",
        "Extremely sensitive to overwatering at all growth stages",
        "Benefits from good air circulation to prevent fungal issues",
        "Harvest by cutting stems, never pull or damage woody structure",
        "May require winter protection or reduced watering in cold periods",
        "Can live for many years if drainage and watering requirements are met",
        "Consider propagation from cuttings rather than seed for better success",
      ],
    },
  },

  {
    name: "Italian Flat Leaf Parsley",
    category: "herbs",
    isEverbearing: true,
    productiveLifespan: 365, // Annual, but can be harvested for full growing season
    growthTimeline: {
      germination: 21, // 2-4 weeks - notoriously slow germination
      seedling: 42, // 5-7 weeks to transplant size
      vegetative: 63, // active growth and harvest period
      maturation: 90, // 70-90 days to full size
    },
    protocols: {
      lighting: {
        seedling: {
          ppfd: { min: 100, max: 300, unit: "µmol/m²/s" },
          photoperiod: { hours: 12, maxHours: 16 },
          dli: { min: 4.3, max: 17.3, unit: "mol/m²/day" },
          notes: [
            "Germination can take 2-4 weeks - be patient",
            "Soak seeds 12-24 hours before planting to improve germination",
          ],
        },
        vegetativeHarvest: {
          ppfd: { min: 300, max: 600, unit: "µmol/m²/s" },
          photoperiod: { hours: 14, maxHours: 16 },
          dli: { min: 17.3, max: 34.6, unit: "mol/m²/day" },
          notes: [
            "Plant develops abundant, flavorful leaves with characteristic flat shape",
            "Higher light produces more robust growth and stronger flavor",
          ],
        },
        flowering: {
          ppfd: { min: 200, max: 400, unit: "µmol/m²/s" },
          photoperiod: { hours: 12, maxHours: 16 },
          dli: { min: 8.6, max: 23.0, unit: "mol/m²/day" },
          notes: [
            "Bolting produces tall flower stalk with yellow-green flowers",
            "Flowering makes leaves bitter - harvest before bolting occurs",
          ],
        },
      },
      watering: {
        seedling: {
          trigger: { moistureLevel: "when surface begins to dry" },
          target: { moistureLevel: "consistently moist" },
          volume: {
            amount: "gentle, frequent applications",
            frequency: "daily monitoring",
          },
          notes: [
            "Consistent moisture critical during long germination period",
            "Use fine spray to avoid disturbing seeds or tiny seedlings",
          ],
        },
        vegetativeHarvest: {
          trigger: { moistureLevel: "when top inch becomes dry" },
          target: { moistureLevel: "evenly moist throughout" },
          volume: {
            amount: "thorough watering",
            frequency: "every 2-3 days typically",
          },
          notes: [
            "Unlike Mediterranean herbs, parsley prefers consistent moisture",
            "Deeper root system benefits from thorough watering",
          ],
        },
        flowering: {
          trigger: { moistureLevel: "as vegetative stage" },
          target: { moistureLevel: "consistently moist" },
          volume: {
            amount: "maintain regular watering",
            frequency: "as needed",
          },
          notes: [
            "Continue consistent watering even if plant begins to bolt",
            "Consistent moisture may delay onset of flowering",
          ],
        },
      },
      fertilization: {
        seedling: {
          products: [
            {
              name: "Worm castings",
              dilution: "1 tbsp per gallon of soil mix",
              amount: "incorporated during soil preparation",
              frequency: "one-time soil amendment",
              method: "mix-in-soil",
            },
          ],
          timing: "Soil preparation",
          notes: [
            "Gentle organic matter supports establishment without burning tender roots",
          ],
        },
        vegetativeHarvest: {
          products: [
            {
              name: "Balanced organic fertilizer or compost tea",
              dilution: "half to full strength",
              amount: "regular applications",
              frequency: "every 2-3 weeks during active harvest",
            },
          ],
          timing: "Throughout growing season",
          notes: [
            "Parsley is a moderate feeder requiring regular nutrition",
            "Benefits from nitrogen for leaf production unlike Mediterranean herbs",
          ],
        },
        flowering: {
          products: [
            {
              name: "Reduce feeding if bolting occurs",
              dilution: "light applications only",
              amount: "minimal",
              frequency: "monthly if needed",
            },
          ],
          notes: [
            "Focus on preventing bolting rather than supporting flower production",
          ],
        },
      },
      environment: {
        temperature: { min: 60, max: 75, optimal: 68, unit: "F" },
        humidity: { min: 40, max: 70, optimal: 55 },
        pH: { min: 6.0, max: 7.0, optimal: 6.5 },
      },
      soilMixture: {
        components: {
          "coco coir": 35,
          perlite: 25,
          vermiculite: 25,
          compost: 15,
        },
        amendments: {
          "worm castings": "1 tbsp per gallon",
        },
      },
      container: {
        minSize: "2-gallon container minimum",
        depth: "8-12 inches - deeper than most herbs due to taproot",
        drainage:
          "Good drainage but retains more moisture than Mediterranean herbs",
      },
      succession: {
        interval: 21, // 3-week intervals for continuous harvest
        method: "continuous",
        harvestMethod: "cut-and-come-again",
        notes: [
          "Cut outer stems at base, leave center growing point intact",
          "Succession planting every 3 weeks provides continuous fresh harvest",
        ],
      },
      specialRequirements: [
        "Unlike Mediterranean herbs, parsley needs consistent moisture and feeding",
        "Deeper containers required to accommodate taproot development",
        "Harvest outer stems regularly to encourage continued production",
        "Cool-season crop that may bolt in hot weather",
        "Biennial but typically grown as annual for best leaf quality",
      ],
    },
  },

  {
    name: "Garlic",
    category: "herbs", // Often used as herb though technically allium
    isEverbearing: false,
    productiveLifespan: 240, // 8-10 months from planting to harvest
    growthTimeline: {
      germination: 14, // sprouting from cloves
      seedling: 28, // early shoot development
      vegetative: 120, // bulb development phase
      maturation: 240, // full cycle to harvest
    },
    protocols: {
      lighting: {
        earlyGrowth: {
          ppfd: { min: 100, max: 300, unit: "µmol/m²/s" },
          photoperiod: { hours: 10, maxHours: 14 },
          dli: { min: 3.6, max: 15.1, unit: "mol/m²/day" },
          notes: [
            "Green shoots emerge from planted cloves",
            "Plant establishes root system during this phase",
          ],
        },
        bulbDevelopment: {
          ppfd: { min: 400, max: 600, unit: "µmol/m²/s" },
          photoperiod: { hours: 12, maxHours: 16 },
          dli: { min: 17.3, max: 34.6, unit: "mol/m²/day" },
          notes: [
            "Occurs as daylight hours increase and soil temperatures rise above 60°F",
            "Plant focuses energy on growing the bulb underground",
          ],
        },
        maturation: {
          ppfd: { min: 200, max: 400, unit: "µmol/m²/s" },
          photoperiod: { hours: 8, maxHours: 12 },
          dli: { min: 5.8, max: 17.3, unit: "mol/m²/day" },
          notes: [
            "Lower leaves begin to yellow and die back",
            "Reduced light needs as plant approaches harvest",
          ],
        },
      },
      watering: {
        earlyGrowth: {
          trigger: { moistureLevel: "when top inch becomes dry" },
          target: { moistureLevel: "evenly moist" },
          volume: {
            amount: "moderate applications",
            frequency: "weekly typically",
          },
          notes: [
            "Consistent moisture supports root development",
            "Avoid waterlogging which can cause clove rot",
          ],
        },
        bulbDevelopment: {
          trigger: { moistureLevel: "when top 2 inches become dry" },
          target: { moistureLevel: "adequately moist" },
          volume: { amount: "regular watering", frequency: "every 5-7 days" },
          notes: [
            "Critical period for bulb formation requires consistent moisture",
            "Monitor soil moisture more carefully during active bulbing",
          ],
        },
        maturation: {
          trigger: { moistureLevel: "allow significant drying" },
          target: { moistureLevel: "minimal moisture" },
          volume: {
            amount: "reduce watering significantly",
            frequency: "infrequent",
          },
          notes: [
            "Reduce watering as harvest approaches to firm up bulbs",
            "Stop watering completely 2-3 weeks before harvest",
          ],
        },
      },
      fertilization: {
        earlyGrowth: {
          products: [
            {
              name: "Well-rotted compost",
              dilution: "2 tbsp per gallon of soil",
              amount: "incorporated during soil preparation",
              frequency: "one-time soil amendment",
              method: "mix-in-soil",
            },
            {
              name: "Bone meal",
              dilution: "1 tsp per gallon",
              amount: "mixed into soil at planting",
              frequency: "one-time amendment",
              method: "mix-in-soil",
            },
          ],
          timing: "At planting",
          notes: ["Slow-release nutrients support long growing cycle"],
        },
        bulbDevelopment: {
          products: [
            {
              name: "Balanced liquid fertilizer (low nitrogen)",
              dilution: "half strength",
              amount: "light application",
              frequency: "monthly during active bulbing",
            },
          ],
          timing: "Spring growing season",
          notes: [
            "Moderate feeding during bulb development",
            "Avoid high nitrogen which produces more leaves than bulb",
          ],
        },
        maturation: {
          notes: [
            "Cease all fertilization 6-8 weeks before harvest",
            "Allow plant to focus energy on bulb maturation",
          ],
        },
      },
      environment: {
        temperature: { min: 50, max: 80, optimal: 65, unit: "F" },
        pH: { min: 6.0, max: 7.0, optimal: 6.5 },
      },
      soilMixture: {
        components: {
          "coco coir": 40,
          perlite: 30,
          vermiculite: 20,
          compost: 10,
        },
        amendments: {
          "well-rotted compost": "2 tbsp per gallon",
          "bone meal": "1 tsp per gallon",
        },
      },
      container: {
        minSize: "2-gallon pot (8 inch diameter)",
        depth: "6-8 inches adequate for bulb development",
      },
      succession: {
        interval: 0, // Single harvest crop
        method: "single",
        harvestMethod: "single-harvest",
        notes: [
          "Plant cloves in fall for summer harvest",
          "Harvest when lower leaves begin to brown but upper leaves still green",
        ],
      },
      specialRequirements: [
        "Requires cold period for proper bulb formation - may need refrigeration",
        "Plant individual cloves pointed end up, 2 inches deep",
        "Harvest timing critical - too early gives small bulbs, too late causes splitting",
        "Cure harvested bulbs in warm, dry, well-ventilated area for storage",
        "Remove flower stalks (scapes) to encourage bulb development",
      ],
    },
  },
  {
    name: "May Queen Lettuce",
    category: "leafy-greens",
    isEverbearing: true,
    productiveLifespan: 63, // Can harvest baby leaves at 30-35 days, full heads at 45-60 days
    growthTimeline: {
      germination: 7, // 5-10 days from your plan
      seedling: 20, // Days 10-25/30 post-emergence
      vegetative: 35, // Rosette stage, days 25/30 - 40/45
      maturation: 56, // 49-63 days total per your plan, using 56 as middle
    },
    protocols: {
      lighting: {
        germination: {
          ppfd: { min: 100, max: 150, unit: "µmol/m²/s" },
          photoperiod: { hours: 10, maxHours: 12 },
          dli: { min: 3.6, max: 6.5, unit: "mol/m²/day" },
          notes: [
            "Keep surface moist during germination",
            "Pre-soak seed 2h in 0.2% kelp solution",
          ],
        },
        seedling: {
          ppfd: { min: 200, max: 300, unit: "µmol/m²/s" },
          photoperiod: { hours: 10, maxHours: 12 },
          dli: { min: 7.2, max: 13.0, unit: "mol/m²/day" },
          notes: [
            "Once 3-4 true leaves appear, begin light fertilization",
            "Strict photoperiod control to prevent bolting",
          ],
        },
        vegetativeRosette: {
          ppfd: { min: 300, max: 350, unit: "µmol/m²/s" },
          photoperiod: { hours: 10, maxHours: 12 },
          dli: { min: 10.8, max: 15.1, unit: "mol/m²/day" },
          notes: [
            "Critical phase for leaf and rosette development",
            "Maintain strict 10-12 hour maximum photoperiod",
          ],
        },
        headFormation: {
          ppfd: { min: 300, max: 350, unit: "µmol/m²/s" },
          photoperiod: { hours: 10, maxHours: 12 },
          dli: { min: 10.8, max: 15.1, unit: "mol/m²/day" },
          notes: [
            "Outer leaves curl inward to form head",
            "Monitor for tip burn (calcium deficiency)",
          ],
        },
      },
      watering: {
        germination: {
          trigger: { moistureLevel: "surface moist" },
          target: { moistureLevel: "7-8" },
          volume: {
            amount: "16-32 oz (0.5-1 L)",
            frequency: "daily/as needed",
          },
          notes: [
            "Keep surface consistently moist",
            "Use mist or light watering",
          ],
        },
        seedling: {
          trigger: { moistureLevel: "3-4" },
          target: { moistureLevel: "8-10" },
          volume: {
            amount: "0.5-1 gal (1.9-3.8 L)",
            frequency: "every 1-3 days",
          },
          notes: ["Water thoroughly until drainage occurs"],
        },
        vegetativeRosette: {
          trigger: { moistureLevel: "3-4" },
          target: { moistureLevel: "8-10" },
          volume: {
            amount: "0.75-1.5 gal (2.8-5.7 L)",
            frequency: "every 2-3 days",
          },
          notes: ["Consistent moisture critical for leaf development"],
        },
        headFormation: {
          trigger: { moistureLevel: "3-4" },
          target: { moistureLevel: "8-10" },
          volume: {
            amount: "0.75-1.5 gal (2.8-5.7 L)",
            frequency: "every 2-3 days",
          },
          notes: ["Stop fertilization 1-2 weeks before final head harvest"],
        },
      },
      fertilization: {
        seedling: {
          products: [
            {
              name: "Diluted fish emulsion",
              dilution: "0.5-1 Tbsp/gal",
              amount: "as needed",
              frequency: "every 2-3 weeks",
            },
            {
              name: "Fish+kelp blend",
              dilution: "0.5-1 Tbsp/gal",
              amount: "as needed",
              frequency: "every 2-3 weeks",
            },
          ],
          timing: "Once 3-4 true leaves appear",
        },
        vegetativeRosette: {
          products: [
            {
              name: "Fish emulsion/fish+kelp",
              dilution: "1-2 Tbsp/gal",
              amount: "as needed",
              frequency: "every 2-3 weeks",
            },
          ],
        },
        headFormation: {
          products: [
            {
              name: "Continue as vegetative",
              dilution: "1-2 Tbsp/gal",
              amount: "as needed",
              frequency: "every 2-3 weeks",
            },
          ],
          notes: ["Stop 1-2 weeks before final head harvest"],
        },
      },
      environment: {
        temperature: { min: 60, max: 75, optimal: 68, unit: "F" },
        humidity: { min: 40, max: 70, optimal: 55 },
        pH: { min: 6.0, max: 7.0, optimal: 6.5 },
        constraints: [
          {
            description:
              "Prone to bolting in warm conditions with extended daylight",
            parameter: "light",
            threshold: 12,
            consequence: "premature bolting reduces head quality",
          },
        ],
      },
      soilMixture: {
        components: {
          "coco coir": 40,
          perlite: 30,
          vermiculite: 20,
          compost: 10,
        },
        amendments: {
          compost: "2 tbsp per gallon",
          "worm castings": "1 tbsp per gallon",
        },
      },
      container: {
        minSize: "bed section 24 inch width",
        depth: "4-6 inches soil depth",
      },
      succession: {
        interval: 14, // 1-2 weeks per your plan
        method: "continuous",
        harvestMethod: "cut-and-come-again",
        notes: [
          "Baby leaves ready 30-35 days",
          "Full heads ready 45-60 days",
          "Can harvest outer leaves for extended yield",
        ],
      },
      specialRequirements: [
        "Strict 10-12 hour photoperiod maximum to prevent bolting",
        "Monitor for tip burn (calcium deficiency) - add gypsum if needed",
        "Butterhead lettuce variety - forms loose heads",
        "Cut-and-come-again harvesting extends yield",
        "Succession plant every 1-2 weeks for continuous harvest",
      ],
    },
  },

  // Future expansion crops mentioned in your document
  // These represent the next phase of your indoor garden development

  /*
{
  name: "Bell Peppers", // Future crop from your document
  category: "fruiting-plants",
  isEverbearing: true,
  productiveLifespan: 120,
  growthTimeline: {
    germination: 14,
    seedling: 28,
    vegetative: 42,
    maturation: 90
  },
  // Basic framework from your document notes:
  // Container: 2 × 10-gallon containers
  // Soil: 30% coco coir, 25% perlite, 20% vermiculite, 25% compost
  // Amendments: 2 tbsp well-rotted manure per gallon, 1 tbsp bone meal per gallon, 1 tsp Epsom salts per gallon
  // pH: 6.0-6.8 (ideal: 6.5)
  // Notes: Moderate-heavy feeders requiring well-draining soil, benefits from magnesium and calcium supplements
},

{
  name: "Indeterminate Tomatoes", // Future crop from your document  
  category: "fruiting-plants",
  isEverbearing: true,
  productiveLifespan: 150,
  growthTimeline: {
    germination: 10,
    seedling: 21,
    vegetative: 35,
    maturation: 80
  },
  // Basic framework from your document notes:
  // Container: 2 × 10-gallon containers
  // Soil: 30% coco coir, 20% perlite, 20% vermiculite, 30% compost
  // Amendments: 3 tbsp well-rotted manure per gallon, 1 tbsp bone meal per gallon, 1 tsp Epsom salts per gallon
  // pH: 6.0-6.8 (ideal: 6.5)
  // Notes: Very heavy feeders requiring rich soil, benefits from calcium supplementation to prevent blossom end rot
}
*/
];
