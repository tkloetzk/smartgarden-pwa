// src/pages/care/CareLogForm.tsx
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  plantService,
  careService,
  varietyService,
  PlantRecord,
  VarietyRecord,
  CareActivityDetails,
  WateringDetails,
  FertilizingDetails,
  ObservationDetails,
} from "@/types/database";
import { Button } from "@/components/ui/Button";
import { PhotoCapture } from "./PhotoCapture";
import { calculateCurrentStage } from "@/utils/growthStage";
import { GrowthStage } from "@/types/core";
import toast from "react-hot-toast";
import {
  SmartDefaultsService,
  SmartDefaults,
  QuickCompletionValues,
} from "@/services/smartDefaultsService";
import QuickCompletionButtons from "@/pages/care/QuickCompletionButtons";

// Enhanced moisture validation types
interface MoistureValidationMessage {
  field: "before" | "after" | "source";
  message: string;
  color: string;
}

interface MoistureValidationResult {
  validations: MoistureValidationMessage[];
  isValid: boolean;
}

interface CategoryMoistureDefaults {
  trigger: [number, number];
  target: [number, number];
}

interface PlantMoistureProtocol {
  trigger: [number, number];
  target: [number, number];
  varietyName: string;
  currentStage: GrowthStage;
  isDefault: boolean;
  source: "protocol" | "category" | "universal";
}

// Extract moisture ranges for a specific stage from variety protocols
function extractMoistureRangesForStage(
  variety: VarietyRecord,
  stage: GrowthStage
): PlantMoistureProtocol | null {
  // 1. First try: Stage-specific protocol
  const stageProtocol = variety.protocols?.watering?.[stage] as {
    trigger?: { moistureLevel?: string | number };
    target?: { moistureLevel?: string | number };
  };

  if (
    stageProtocol?.trigger?.moistureLevel &&
    stageProtocol?.target?.moistureLevel
  ) {
    const triggerRange = parseMoistureRange(
      stageProtocol.trigger.moistureLevel
    );
    const targetRange = parseMoistureRange(stageProtocol.target.moistureLevel);

    if (triggerRange && targetRange) {
      return {
        trigger: triggerRange,
        target: targetRange,
        varietyName: variety.name || "Unknown",
        currentStage: stage,
        isDefault: false,
        source: "protocol",
      };
    }
  }

  // 2. Second try: Category-based defaults
  const categoryDefaults = getCategoryBasedDefaults(variety.category, stage);
  if (categoryDefaults) {
    return {
      ...categoryDefaults,
      varietyName: variety.name || "Unknown",
      currentStage: stage,
      isDefault: false,
      source: "category",
    };
  }

  // 3. Fallback: Universal defaults
  return {
    trigger: [3, 4] as [number, number],
    target: [6, 7] as [number, number],
    varietyName: variety.name || "Unknown",
    currentStage: stage,
    isDefault: true,
    source: "universal",
  };
}

function parseMoistureRange(value: string | number): [number, number] | null {
  if (typeof value === "number") {
    return [value, value];
  }

  if (typeof value === "string") {
    // Handle ranges like "3-4" or "6-7"
    const rangeMatch = value.match(/(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)/);
    if (rangeMatch) {
      return [parseFloat(rangeMatch[1]), parseFloat(rangeMatch[2])];
    }

    // Handle single values like "3" or "6"
    const singleMatch = value.match(/(\d+(?:\.\d+)?)/);
    if (singleMatch) {
      const num = parseFloat(singleMatch[1]);
      return [num, num];
    }
  }

  return null;
}

function getCategoryBasedDefaults(
  category: string,
  stage: GrowthStage
): CategoryMoistureDefaults | null {
  // Category-based protocols provide reasonable defaults for plant types
  const categoryProtocols: Record<
    string,
    Record<GrowthStage, CategoryMoistureDefaults>
  > = {
    "root-vegetables": {
      germination: { trigger: [4, 5], target: [6, 7] },
      seedling: { trigger: [4, 5], target: [6, 7] },
      vegetative: { trigger: [3, 4], target: [6, 7] },
      flowering: { trigger: [3, 4], target: [6, 7] },
      fruiting: { trigger: [3, 4], target: [6, 7] },
      maturation: { trigger: [3, 4], target: [6, 7] },
      harvest: { trigger: [3, 4], target: [6, 7] },
      "ongoing-production": { trigger: [3, 4], target: [6, 7] },
    },
    "leafy-greens": {
      germination: { trigger: [3, 4], target: [6, 7] },
      seedling: { trigger: [3, 4], target: [6, 7] },
      vegetative: { trigger: [3, 4], target: [6, 7] },
      flowering: { trigger: [3, 4], target: [6, 7] },
      fruiting: { trigger: [3, 4], target: [6, 7] },
      maturation: { trigger: [3, 4], target: [6, 7] },
      harvest: { trigger: [3, 4], target: [6, 7] },
      "ongoing-production": { trigger: [3, 4], target: [6, 7] },
    },
    "fruiting-plants": {
      germination: { trigger: [4, 5], target: [7, 8] },
      seedling: { trigger: [4, 5], target: [7, 8] },
      vegetative: { trigger: [3, 4], target: [6, 7] },
      flowering: { trigger: [3, 4], target: [6, 7] },
      fruiting: { trigger: [3, 4], target: [6, 8] },
      maturation: { trigger: [3, 4], target: [6, 8] },
      harvest: { trigger: [3, 4], target: [6, 8] },
      "ongoing-production": { trigger: [3, 4], target: [6, 8] },
    },
    herbs: {
      germination: { trigger: [3, 4], target: [6, 7] },
      seedling: { trigger: [3, 4], target: [6, 7] },
      vegetative: { trigger: [3, 4], target: [6, 7] },
      flowering: { trigger: [3, 4], target: [6, 7] },
      fruiting: { trigger: [3, 4], target: [6, 7] },
      maturation: { trigger: [3, 4], target: [6, 7] },
      harvest: { trigger: [3, 4], target: [6, 7] },
      "ongoing-production": { trigger: [3, 4], target: [6, 7] },
    },
    berries: {
      germination: { trigger: [3, 4], target: [6, 7] },
      seedling: { trigger: [3, 4], target: [6, 7] },
      vegetative: { trigger: [3, 4], target: [6, 7] },
      flowering: { trigger: [3, 4], target: [6, 7] },
      fruiting: { trigger: [3, 4], target: [6, 7] },
      maturation: { trigger: [3, 4], target: [6, 7] },
      harvest: { trigger: [3, 4], target: [6, 7] },
      "ongoing-production": { trigger: [3, 4], target: [6, 7] },
    },
  };

  return categoryProtocols[category]?.[stage] || null;
}

// Schema definitions
const baseCareSchema = z.object({
  plantId: z.string().min(1, "Please select a plant"),
  type: z.enum(["water", "fertilize", "observe", "harvest", "transplant"]),
  date: z.string(),
  notes: z.string().optional(),
});

const wateringSchema = baseCareSchema.extend({
  type: z.literal("water"),
  waterValue: z.number().min(0.1, "Water amount must be greater than 0"),
  waterUnit: z.enum(["oz", "ml", "cups", "liters", "gallons"]),
  moistureBefore: z.number().min(1).max(10).optional(),
  moistureAfter: z.number().min(1).max(10).optional(),
  applicationMethod: z
    .enum(["top-watering", "bottom-watering", "drip", "misting"])
    .optional(),
  runoffObserved: z.boolean().optional(),
});

const fertilizingSchema = baseCareSchema.extend({
  type: z.literal("fertilize"),
  product: z.string().min(1, "Fertilizer product is required"),
  dilution: z.string().min(1, "Dilution ratio is required"),
  amount: z.string().min(1, "Application amount is required"),
});

const observationSchema = baseCareSchema.extend({
  type: z.literal("observe"),
  healthAssessment: z.enum([
    "excellent",
    "good",
    "fair",
    "concerning",
    "critical",
  ]),
  observations: z.string().min(1, "Observations are required"),
  photos: z.array(z.string()).optional(),
});

const careFormSchema = z.discriminatedUnion("type", [
  wateringSchema,
  fertilizingSchema,
  observationSchema,
]);

type CareFormData = z.infer<typeof careFormSchema>;

interface CareLogFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  preselectedPlantId?: string;
  preselectedActivityType?:
    | "water"
    | "fertilize"
    | "observe"
    | "harvest"
    | "transplant";
}

export function CareLogForm({
  onSuccess,
  onCancel,
  preselectedPlantId,
  preselectedActivityType,
}: CareLogFormProps) {
  const [plants, setPlants] = useState<PlantRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [showDetailedTracking, setShowDetailedTracking] = useState(false);
  const [searchParams] = useSearchParams();

  const initialPlantId =
    preselectedPlantId || searchParams.get("plantId") || "";
  const initialActivityType =
    preselectedActivityType || searchParams.get("type") || "water";

  // State for moisture validation
  const [moistureValidation, setMoistureValidation] =
    useState<MoistureValidationResult | null>(null);

  // State for smart defaults
  const [smartDefaults, setSmartDefaults] = useState<SmartDefaults | null>(
    null
  );
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CareFormData>({
    resolver: zodResolver(careFormSchema),
    defaultValues: {
      plantId: preselectedPlantId || searchParams.get("plantId") || "",
      type:
        (searchParams.get("type") as "water" | "fertilize" | "observe") ||
        "water",
      date: new Date().toISOString().split("T")[0],
      waterValue: undefined,
      waterUnit: "oz",
    },
  });

  const activityType = watch("type");
  const selectedPlantId = watch("plantId");
  const moistureBefore = watch("moistureBefore");
  const moistureAfter = watch("moistureAfter");

  // Load plants on component mount
  useEffect(() => {
    const loadPlants = async () => {
      try {
        const plantList = await plantService.getActivePlants();
        setPlants(plantList);
      } catch (error) {
        console.error("Failed to load plants:", error);
        toast.error("Failed to load plants");
      }
    };

    loadPlants();
  }, []);

  useEffect(() => {
    const plantIdToSet = preselectedPlantId || searchParams.get("plantId");
    if (plantIdToSet && plants.length > 0) {
      const plant = plants.find((p) => p.id === plantIdToSet);
      if (plant) {
        setValue("plantId", plantIdToSet);
      }
    }
  }, [plants, preselectedPlantId, searchParams, setValue]);

  useEffect(() => {
    const activityTypeToSet = searchParams.get("type");
    if (activityTypeToSet) {
      setValue("type", activityTypeToSet as any);
    }
  }, [searchParams, setValue]);

  // Load smart defaults when plant is selected
  useEffect(() => {
    const loadSmartDefaults = async () => {
      if (!selectedPlantId || !plants.length) {
        setSmartDefaults(null);
        return;
      }

      const plant = plants.find((p) => p.id === selectedPlantId);
      if (!plant) return;

      try {
        setIsLoadingDefaults(true);
        const defaults = await SmartDefaultsService.getDefaultsForPlant(plant);
        setSmartDefaults(defaults);

        // Auto-apply watering defaults when watering is selected
        if (activityType === "water" && defaults?.watering) {
          setValue("waterValue", defaults.watering.suggestedAmount);
          setValue("waterUnit", defaults.watering.unit);
        }
      } catch (error) {
        console.error("Error loading smart defaults:", error);
      } finally {
        setIsLoadingDefaults(false);
      }
    };

    loadSmartDefaults();
  }, [selectedPlantId, plants, activityType, setValue]);

  // Helper function to apply quick completion values
  const handleQuickComplete = (values: QuickCompletionValues) => {
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined) {
        setValue(key as keyof CareFormData, value);
      }
    });
  };

  // This function gets the moisture protocol for a specific plant
  const getPlantMoistureProtocol = useCallback(
    async (plantId: string) => {
      const plant = plants.find((p) => p.id === plantId);
      if (!plant) return null;

      try {
        const variety = await varietyService.getVariety(plant.varietyId);
        if (!variety) return null;

        // Calculate current growth stage for stage-specific protocols
        const currentStage = calculateCurrentStage(
          plant.plantedDate,
          variety.growthTimeline
        );

        // Extract moisture ranges for current stage
        return extractMoistureRangesForStage(variety, currentStage);
      } catch (error) {
        console.error("Error fetching plant moisture protocol:", error);
        return null;
      }
    },
    [plants]
  );

  // This function validates moisture readings against plant-specific protocols
  const getMoistureValidationForPlant = useCallback(
    async (
      plantId: string,
      moistureBefore?: number,
      moistureAfter?: number
    ): Promise<MoistureValidationResult | null> => {
      const protocol = await getPlantMoistureProtocol(plantId);
      if (!protocol) return null;

      const validations: MoistureValidationMessage[] = [];

      // Validate "before" reading against trigger range
      if (moistureBefore !== undefined) {
        const [triggerMin, triggerMax] = protocol.trigger;
        if (moistureBefore >= triggerMin && moistureBefore <= triggerMax) {
          validations.push({
            field: "before",
            message: `✓ Perfect timing! ${triggerMin}-${triggerMax} is ideal for watering.`,
            color: "text-green-600",
          });
        } else if (moistureBefore > triggerMax) {
          validations.push({
            field: "before",
            message: `ℹ️ Plant still moist (${triggerMin}-${triggerMax} recommended for watering).`,
            color: "text-blue-600",
          });
        } else {
          validations.push({
            field: "before",
            message: `⚠️ Very dry! Watering at ${triggerMin}-${triggerMax} prevents stress.`,
            color: "text-orange-600",
          });
        }
      }

      // Validate "after" reading against target range
      if (moistureAfter !== undefined) {
        const [targetMin, targetMax] = protocol.target;
        if (moistureAfter >= targetMin && moistureAfter <= targetMax) {
          validations.push({
            field: "after",
            message: `✓ Perfect! Target range ${targetMin}-${targetMax} achieved.`,
            color: "text-green-600",
          });
        } else if (moistureAfter > targetMax) {
          validations.push({
            field: "after",
            message: `⚠️ Over-watered. Target is ${targetMin}-${targetMax}. Allow drying time.`,
            color: "text-orange-600",
          });
        } else {
          validations.push({
            field: "after",
            message: `ℹ️ Could use more water. Target: ${targetMin}-${targetMax}.`,
            color: "text-blue-600",
          });
        }
      }

      // Add source information
      const sourceMessages = {
        protocol: `Using ${protocol.varietyName} ${protocol.currentStage} stage protocol`,
        category: `Using category-based guidance for ${protocol.currentStage} stage`,
        universal: `Using universal defaults (variety protocol incomplete)`,
      };

      validations.push({
        field: "source",
        message: sourceMessages[protocol.source],
        color: protocol.isDefault ? "text-muted-foreground" : "text-foreground",
      });

      return {
        validations,
        isValid: true, // We're just providing guidance, not blocking
      };
    },
    [getPlantMoistureProtocol]
  );

  // Update moisture validation when readings change
  useEffect(() => {
    if (selectedPlantId && (moistureBefore || moistureAfter)) {
      getMoistureValidationForPlant(
        selectedPlantId,
        moistureBefore,
        moistureAfter
      ).then(setMoistureValidation);
    } else {
      setMoistureValidation(null);
    }
  }, [
    selectedPlantId,
    moistureBefore,
    moistureAfter,
    getMoistureValidationForPlant,
  ]);

  useEffect(() => {
    const loadPlants = async () => {
      try {
        const activePlants = await plantService.getActivePlants();
        setPlants(activePlants);
      } catch (error) {
        console.error("Failed to load plants:", error);
        toast.error("Failed to load plants");
      }
    };

    loadPlants();
  }, []);

  const onSubmit = async (data: CareFormData) => {
    try {
      setIsLoading(true);
      setSubmitError(null);

      // Build the care record with proper structure
      let careDetails: CareActivityDetails;

      switch (data.type) {
        case "water": {
          const wateringDetails: WateringDetails = {
            type: "water" as const,
            amount: {
              value: data.waterValue,
              unit: data.waterUnit,
            },
            moistureReading:
              showDetailedTracking && data.moistureBefore && data.moistureAfter
                ? {
                    before: data.moistureBefore,
                    after: data.moistureAfter,
                    scale: "1-10" as const,
                  }
                : undefined,
            method: data.applicationMethod,
            runoffObserved: data.runoffObserved,
            notes: data.notes,
          };
          careDetails = wateringDetails;
          break;
        }

        case "fertilize": {
          const fertilizingDetails: FertilizingDetails = {
            type: "fertilize" as const,
            product: data.product,
            dilution: data.dilution,
            amount: data.amount,
            notes: data.notes,
          };
          careDetails = fertilizingDetails;
          break;
        }

        case "observe": {
          const observationDetails: ObservationDetails = {
            type: "observe" as const,
            healthAssessment: data.healthAssessment,
            observations: data.observations,
            photos: capturedPhotos,
            notes: data.notes,
          };
          careDetails = observationDetails;
          break;
        }

        default:
          throw new Error(`Unsupported activity type: ${data.type as string}`);
      }

      await careService.addCareActivity({
        plantId: data.plantId,
        type: data.type,
        date: new Date(data.date),
        details: careDetails,
      });

      toast.success("Care activity logged successfully!");
      reset();
      setCapturedPhotos([]);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to log care activity:", error);
      setSubmitError("Failed to log care activity. Please try again.");
      toast.error("Failed to log care activity");
    } finally {
      setIsLoading(false);
    }
  };

  function renderWateringFields() {
    const selectedPlant = plants.find((p) => p.id === selectedPlantId);

    return (
      <>
        {/* Smart Defaults Section */}
        {smartDefaults?.watering && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  💡 Smart Suggestion
                </h4>
                <p className="text-sm text-blue-700">
                  {smartDefaults.watering.reasoning}
                </p>
                <div className="flex items-center mt-2 text-xs text-blue-600">
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-1 ${
                      smartDefaults.watering.confidence === "high"
                        ? "bg-green-500"
                        : smartDefaults.watering.confidence === "medium"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  />
                  {smartDefaults.watering.confidence} confidence
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-blue-900">
                  {smartDefaults.watering.suggestedAmount}{" "}
                  {smartDefaults.watering.unit}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleQuickComplete({
                      waterValue: smartDefaults.watering!.suggestedAmount,
                      waterUnit: smartDefaults.watering!.unit,
                    })
                  }
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Use this amount
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Action Buttons */}
        {selectedPlant && (
          <QuickCompletionButtons
            plant={selectedPlant}
            activityType="water"
            onQuickComplete={handleQuickComplete}
            className="mb-4"
          />
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label
              htmlFor="waterValue"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Water Amount *
            </label>
            <input
              id="waterValue"
              type="number"
              step="0.1"
              min="0.1"
              {...register("waterValue", { valueAsNumber: true })}
              className="w-full p-3 bg-card text-card-foreground border border-border rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
              placeholder="Amount"
            />
            {"waterValue" in errors && errors.waterValue && (
              <p className="mt-1 text-sm text-red-600">
                {errors.waterValue.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="waterUnit"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Unit *
            </label>
            <select
              id="waterUnit"
              {...register("waterUnit")}
              className="w-full p-3 bg-card text-card-foreground border border-border rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="oz">oz</option>
              <option value="ml">ml</option>
              <option value="cups">cups</option>
              <option value="liters">liters</option>
              <option value="gallons">gallons</option>
            </select>
          </div>
        </div>

        {/* Show detailed tracking checkbox */}
        <div className="flex items-center">
          <input
            id="showDetailedTracking"
            type="checkbox"
            checked={showDetailedTracking}
            onChange={(e) => setShowDetailedTracking(e.target.checked)}
            className="h-4 w-4 text-garden-600 border-border rounded focus:ring-garden-500"
          />
          <label
            htmlFor="showDetailedTracking"
            className="ml-2 text-sm text-foreground"
          >
            📊 Track moisture readings & method
          </label>
        </div>

        {/* Additional detailed tracking fields */}
        {showDetailedTracking && (
          <div className="space-y-4 p-4 bg-background rounded-lg border border-border">
            <h4 className="text-sm font-medium text-foreground">
              Detailed Tracking
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="moistureBefore"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Moisture Before (1-10 scale)
                </label>
                <input
                  id="moistureBefore"
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  {...register("moistureBefore", { valueAsNumber: true })}
                  className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-garden-500"
                  placeholder="e.g., 3"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  1 = bone dry, 10 = waterlogged
                </p>

                {/* Plant-specific validation feedback for before reading */}
                {moistureValidation?.validations
                  ?.filter((v) => v.field === "before")
                  .map((validation, idx) => (
                    <p
                      key={idx}
                      className={`mt-1 text-xs ${validation.color} flex items-start`}
                    >
                      <span className="flex-shrink-0 mr-1">
                        {validation.message.split(" ")[0]}
                      </span>
                      <span>
                        {validation.message.substring(
                          validation.message.indexOf(" ") + 1
                        )}
                      </span>
                    </p>
                  ))}

                {"moistureBefore" in errors && errors.moistureBefore && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.moistureBefore.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="moistureAfter"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Moisture After (1-10 scale)
                </label>
                <input
                  id="moistureAfter"
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  {...register("moistureAfter", { valueAsNumber: true })}
                  className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-garden-500"
                  placeholder="e.g., 7"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Target range varies by plant - see protocol above
                </p>

                {/* Plant-specific validation feedback for after reading */}
                {moistureValidation?.validations
                  ?.filter((v) => v.field === "after")
                  .map((validation, idx) => (
                    <p
                      key={idx}
                      className={`mt-1 text-xs ${validation.color} flex items-start`}
                    >
                      <span className="flex-shrink-0 mr-1">
                        {validation.message.split(" ")[0]}
                      </span>
                      <span>
                        {validation.message.substring(
                          validation.message.indexOf(" ") + 1
                        )}
                      </span>
                    </p>
                  ))}

                {"moistureAfter" in errors && errors.moistureAfter && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.moistureAfter.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start">
              <input
                id="runoffObserved"
                type="checkbox"
                {...register("runoffObserved")}
                className="mt-1 h-4 w-4 text-garden-600 border-border rounded focus:ring-garden-500"
              />
              <div className="ml-3">
                <label
                  htmlFor="runoffObserved"
                  className="text-sm font-medium text-foreground"
                >
                  Observed water runoff from drainage holes
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Runoff indicates thorough watering and good drainage
                </p>
              </div>
            </div>

            {/* Protocol source information */}
            {moistureValidation?.validations
              ?.filter((v) => v.field === "source")
              .map((validation, idx) => (
                <div
                  key={idx}
                  className="mt-3 p-2 bg-background border border-border rounded-md"
                >
                  <p className={`text-xs ${validation.color}`}>
                    {validation.message}
                  </p>
                </div>
              ))}
          </div>
        )}
      </>
    );
  }

  function renderFertilizingFields() {
    const selectedPlant = plants.find((p) => p.id === selectedPlantId);

    return (
      <>
        {/* Smart Fertilizer Suggestions */}
        {smartDefaults?.fertilizer && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-green-900 mb-2">
              💡 Smart Suggestion
            </h4>
            <p className="text-sm text-green-700 mb-3">
              {smartDefaults.fertilizer.reasoning}
            </p>
            <div className="space-y-2">
              {smartDefaults.fertilizer.products.map((product, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() =>
                    handleQuickComplete({
                      product: product.name,
                      dilution: product.dilution,
                      amount: product.amount,
                    })
                  }
                  className="block w-full text-left p-2 bg-card border border-green-200 rounded hover:bg-green-50 transition-colors"
                >
                  <div className="font-medium text-green-900">
                    {product.name}
                  </div>
                  <div className="text-xs text-green-600">
                    {product.dilution} • {product.amount}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Action Buttons */}
        {selectedPlant && (
          <QuickCompletionButtons
            plant={selectedPlant}
            activityType="fertilize"
            onQuickComplete={handleQuickComplete}
            className="mb-4"
          />
        )}

        <div>
          <label
            htmlFor="product"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Fertilizer Product *
          </label>
          <input
            id="product"
            type="text"
            {...register("product")}
            className="w-full p-3 bg-card text-card-foreground border border-border rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
            placeholder="e.g., Neptune's Harvest Fish & Seaweed"
          />
          {"product" in errors && errors.product && (
            <p className="mt-1 text-sm text-red-600">
              {errors.product.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="dilution"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Dilution Ratio *
            </label>
            <input
              id="dilution"
              type="text"
              {...register("dilution")}
              className="w-full p-3 bg-card text-card-foreground border border-border rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
              placeholder="e.g., 1 tbsp/gal, half strength"
            />
            {"dilution" in errors && errors.dilution && (
              <p className="mt-1 text-sm text-red-600">
                {errors.dilution.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Application Amount *
            </label>
            <input
              id="amount"
              type="text"
              {...register("amount")}
              className="w-full p-3 bg-card text-card-foreground border border-border rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
              placeholder="e.g., 16 oz, apply until runoff"
            />
            {"amount" in errors && errors.amount && (
              <p className="mt-1 text-sm text-red-600">
                {errors.amount.message}
              </p>
            )}
          </div>
        </div>
      </>
    );
  }

  function renderObservationFields() {
    return (
      <>
        <div>
          <label
            htmlFor="healthAssessment"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Health Assessment *
          </label>
          <select
            id="healthAssessment"
            {...register("healthAssessment")}
            className="w-full p-3 bg-card text-card-foreground border border-border rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
          >
            <option value="">Select assessment...</option>
            <option value="excellent">🌟 Excellent</option>
            <option value="good">😊 Good</option>
            <option value="fair">😐 Fair</option>
            <option value="concerning">😟 Concerning</option>
            <option value="critical">🚨 Critical</option>
          </select>
          {"healthAssessment" in errors && errors.healthAssessment && (
            <p className="mt-1 text-sm text-red-600">
              {errors.healthAssessment.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="observations"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Observations *
          </label>
          <textarea
            id="observations"
            rows={4}
            {...register("observations")}
            className="w-full p-3 bg-card text-card-foreground border border-border rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
            placeholder="Describe what you observed (growth, color, pests, diseases, etc.)"
          />
          {"observations" in errors && errors.observations && (
            <p className="mt-1 text-sm text-red-600">
              {errors.observations.message}
            </p>
          )}
        </div>

        <PhotoCapture
          photos={capturedPhotos}
          onPhotosChange={setCapturedPhotos}
          maxPhotos={5}
        />
      </>
    );
  }

  function renderActivitySpecificFields() {
    switch (activityType) {
      case "water":
        return renderWateringFields();
      case "fertilize":
        return renderFertilizingFields();
      case "observe":
        return renderObservationFields();
      default:
        return null;
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Log Care Activity
        </h2>
        <p className="text-muted-foreground">
          Record care activities to track your plants' progress and optimize
          their health.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}

        {/* Plant Selection */}
        <div>
          <label
            htmlFor="plantId"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Plant *
          </label>
          <select
            id="plantId"
            {...register("plantId")}
            className="w-full p-3 bg-card text-card-foreground border border-border rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
          >
            <option value="">Select a plant...</option>
            {plants.map((plant) => (
              <option key={plant.id} value={plant.id}>
                {plant.name || plant.varietyName} - {plant.location}
              </option>
            ))}
          </select>
          {errors.plantId && (
            <p className="mt-1 text-sm text-red-600">
              {errors.plantId.message}
            </p>
          )}
        </div>

        {/* Activity Type */}
        <div>
          <label
            htmlFor="type"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Activity Type *
          </label>
          <select
            id="type"
            {...register("type")}
            className="w-full p-3 bg-card text-card-foreground border border-border rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
          >
            <option value="water">💧 Watering</option>
            <option value="fertilize">🌱 Fertilizing</option>
            <option value="observe">👁️ Observation</option>
            <option value="harvest">🌾 Harvest</option>
            <option value="transplant">🪴 Transplant</option>
          </select>
        </div>

        {/* Date */}
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Date *
          </label>
          <input
            id="date"
            type="date"
            {...register("date")}
            className="w-full p-3 bg-card text-card-foreground border border-border rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
          )}
        </div>

        {/* Activity-specific fields */}
        {renderActivitySpecificFields()}

        {/* Notes */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Notes (optional)
          </label>
          <textarea
            id="notes"
            rows={3}
            {...register("notes")}
            className="w-full p-3 bg-card text-card-foreground border border-border rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
            placeholder="Any additional observations or notes..."
          />
        </div>

        {/* Submit buttons */}
        <div className="flex gap-4">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || isLoadingDefaults}
            className="flex-1"
          >
            {isLoading ? "Logging..." : "Log Activity"}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
