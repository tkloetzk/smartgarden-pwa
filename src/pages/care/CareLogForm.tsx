// src/components/care/CareLogForm.tsx
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  careService,
  plantService,
  varietyService,
  PlantRecord,
  VarietyRecord,
} from "@/types/database";
import { PhotoCapture } from "./PhotoCapture";
import { calculateCurrentStage } from "@/utils/growthStage";
import {
  CategoryMoistureDefaults,
  GrowthStage,
  MoistureProtocolInfo,
} from "@/types";
import toast from "react-hot-toast";

interface MoistureValidationMessage {
  type: "success" | "warning" | "info" | "error";
  field: "before" | "after" | "source";
  message: string;
  color: string; // Tailwind classes - definitely UI-specific
}

interface MoistureValidationResult {
  validations: MoistureValidationMessage[];
  protocol: MoistureProtocolInfo; // Imported from types/care.ts
}

// These validation functions belong HERE in CareLogForm since they're for care logging
function extractMoistureRangesForStage(
  variety: VarietyRecord,
  stage: GrowthStage
): MoistureProtocolInfo {
  // Add explicit return type
  // 1. First try: Custom moisture protocols stored in variety
  if (variety.moistureProtocols?.[stage]) {
    const protocol = variety.moistureProtocols[stage]!;
    return {
      trigger: [protocol.trigger.min, protocol.trigger.max] as [number, number],
      target: [protocol.target.min, protocol.target.max] as [number, number],
      varietyName: variety.name,
      currentStage: stage,
      isDefault: false,
      source: "custom" as const, // Type assertion here
    };
  }

  // 2. Second try: Category-based defaults
  const categoryDefaults = getCategoryBasedDefaults(variety.category, stage);
  if (categoryDefaults) {
    return {
      ...categoryDefaults,
      varietyName: variety.name,
      currentStage: stage,
      isDefault: false,
      source: "category" as const, // Type assertion here
    };
  }

  // 3. Fallback: Universal defaults
  return {
    trigger: [3, 4] as [number, number],
    target: [6, 7] as [number, number],
    varietyName: variety.name,
    currentStage: stage,
    isDefault: true,
    source: "universal" as const, // Type assertion here
  };
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

  return categoryProtocols[category]?.[stage];
}

// Schema definitions remain the same...
const baseCareSchema = z.object({
  plantId: z.string().min(1, "Please select a plant"),
  type: z.enum(["water", "fertilize", "observe", "harvest", "transplant"]),
  date: z.string(),
  notes: z.string().optional(),
});

const wateringSchema = baseCareSchema.extend({
  type: z.literal("water"),
  amount: z.string().min(1, "Water amount is required"),
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
}

export function CareLogForm({
  onSuccess,
  onCancel,
  preselectedPlantId,
}: CareLogFormProps) {
  const [plants, setPlants] = useState<PlantRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [showDetailedTracking, setShowDetailedTracking] = useState(false);

  // State for moisture validation
  const [moistureValidation, setMoistureValidation] =
    useState<MoistureValidationResult | null>(null);

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
      plantId: preselectedPlantId || "",
      type: "water",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const activityType = watch("type");

  // Watch values for moisture validation
  const selectedPlantId = watch("plantId");
  const moistureBefore = watch("moistureBefore");
  const moistureAfter = watch("moistureAfter");

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
      if (!plantId || !moistureBefore) return null;

      const protocol = await getPlantMoistureProtocol(plantId);
      if (!protocol) return null;

      const [triggerMin, triggerMax] = protocol.trigger;
      const [targetMin, targetMax] = protocol.target;

      const validations: MoistureValidationMessage[] = []; // Explicitly type the array

      // Add source context so users understand where the protocol comes from
      let sourceMessage = "";
      switch (protocol.source) {
        case "custom":
          sourceMessage = "✨ Using your custom protocol";
          break;
        case "category":
          sourceMessage = `📂 Using ${protocol.varietyName} category defaults`;
          break;
        case "universal":
          sourceMessage = "🔧 Using universal defaults - consider customizing";
          break;
      }

      // Validate before watering reading - using type assertions
      if (moistureBefore <= triggerMin - 1) {
        validations.push({
          type: "warning" as const, // Type assertion ensures literal type
          field: "before" as const,
          message: `🚨 Very dry for ${protocol.varietyName}! Water at ${triggerMin}-${triggerMax}.`,
          color: "text-red-600",
        });
      } else if (moistureBefore > triggerMax + 1) {
        validations.push({
          type: "info" as const,
          field: "before" as const,
          message: `💡 ${protocol.varietyName} may not need water yet. Usually water at ${triggerMin}-${triggerMax}.`,
          color: "text-orange-600",
        });
      } else if (moistureBefore >= triggerMin && moistureBefore <= triggerMax) {
        validations.push({
          type: "success" as const,
          field: "before" as const,
          message: `✅ Perfect timing for ${protocol.varietyName}!`,
          color: "text-green-600",
        });
      }

      // Validate after watering reading if provided
      if (moistureAfter) {
        if (moistureAfter > targetMax + 1) {
          validations.push({
            type: "warning" as const,
            field: "after" as const,
            message: `⚠️ Very wet for ${protocol.varietyName}. Target: ${targetMin}-${targetMax}. Check drainage.`,
            color: "text-orange-600",
          });
        } else if (moistureAfter < targetMin) {
          validations.push({
            type: "info" as const,
            field: "after" as const,
            message: `💧 Could use more water. Target: ${targetMin}-${targetMax}.`,
            color: "text-blue-600",
          });
        } else if (moistureAfter >= targetMin && moistureAfter <= targetMax) {
          validations.push({
            type: "success" as const,
            field: "after" as const,
            message: `🎯 Perfect moisture level achieved!`,
            color: "text-green-600",
          });
        }
      }

      // Add source information
      validations.push({
        type: "info" as const,
        field: "source" as const,
        message: sourceMessage,
        color: "text-gray-600",
      });

      return {
        validations,
        protocol,
      };
    },
    [getPlantMoistureProtocol]
  );

  // Load plants when component mounts
  useEffect(() => {
    loadPlants();
  }, []);

  // Update photos in form when captured
  useEffect(() => {
    if (activityType === "observe") {
      setValue("photos", capturedPhotos);
    }
  }, [capturedPhotos, activityType, setValue]);

  // Moisture validation effect - this runs when moisture readings change
  useEffect(() => {
    if (selectedPlantId && moistureBefore) {
      getMoistureValidationForPlant(
        selectedPlantId,
        moistureBefore,
        moistureAfter
      ).then((result) => setMoistureValidation(result));
    } else {
      setMoistureValidation(null);
    }
  }, [
    selectedPlantId,
    moistureBefore,
    moistureAfter,
    getMoistureValidationForPlant,
  ]);

  async function loadPlants() {
    try {
      const activePlants = await plantService.getActivePlants();
      setPlants(activePlants);
    } catch (error) {
      console.error("Failed to load plants:", error);
      toast.error("Failed to load plants. Please refresh the page.");
    }
  }

  async function onSubmit(data: CareFormData) {
    setIsLoading(true);
    setSubmitError(null);

    try {
      let activityDetails;

      switch (data.type) {
        case "water":
          activityDetails = {
            type: "water" as const,
            amount: data.amount,
            moistureReading:
              data.moistureBefore && data.moistureAfter
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
          break;

        case "fertilize":
          activityDetails = {
            type: "fertilize" as const,
            product: data.product,
            dilution: data.dilution,
            amount: data.amount,
            notes: data.notes,
          };
          break;

        case "observe":
          activityDetails = {
            type: "observe" as const,
            healthAssessment: data.healthAssessment,
            observations: data.observations,
            photos: data.photos,
            notes: data.notes,
          };
          break;
      }

      await careService.addCareActivity({
        plantId: data.plantId,
        type: data.type,
        date: new Date(data.date),
        details: activityDetails,
      });

      toast.success("Care activity logged successfully!");
      reset();
      setCapturedPhotos([]);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to log care activity:", error);
      setSubmitError("Failed to log care activity. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function renderWateringFields() {
    return (
      <>
        {/* Plant-specific protocol information banner */}
        {moistureValidation?.protocol && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <h4 className="font-medium text-green-900 text-sm">
              🌱 {moistureValidation.protocol.varietyName} Protocol
            </h4>
            <div className="text-xs text-green-700 mt-1 grid grid-cols-2 gap-2">
              <div>
                Water when: {moistureValidation.protocol.trigger[0]}-
                {moistureValidation.protocol.trigger[1]}
              </div>
              <div>
                Target level: {moistureValidation.protocol.target[0]}-
                {moistureValidation.protocol.target[1]}
              </div>
            </div>
            <div className="text-xs text-green-600 mt-1">
              Current stage: {moistureValidation.protocol.currentStage}
            </div>
          </div>
        )}

        {/* Core watering information */}
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Water Amount *
          </label>
          <input
            id="amount"
            type="text"
            {...register("amount")}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-garden-500 focus:border-transparent"
            placeholder="e.g., 32 oz, 1 gallon, 500ml"
          />
          <p className="mt-1 text-xs text-gray-500">
            Record the total amount of water given to this plant
          </p>
        </div>

        {/* Progressive disclosure toggle for detailed tracking */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 flex items-center">
              📊 Detailed Moisture Tracking
              {showDetailedTracking && (
                <span className="ml-2 text-green-600">✓ Enabled</span>
              )}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              Record moisture meter readings to learn your plants' water
              consumption patterns and optimize timing
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDetailedTracking(!showDetailedTracking)}
            className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-garden-500 focus:ring-offset-2 ${
              showDetailedTracking ? "bg-garden-600" : "bg-gray-300"
            }`}
            aria-label={
              showDetailedTracking
                ? "Disable detailed tracking"
                : "Enable detailed tracking"
            }
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showDetailedTracking ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Detailed moisture tracking fields */}
        {showDetailedTracking && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
            <div className="flex items-start">
              <div className="text-blue-600 mr-2 mt-1">💡</div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  Understanding Moisture Tracking
                </h4>
                <p className="text-sm text-blue-700">
                  Recording moisture levels before and after watering helps you
                  understand how quickly your plants consume water. This data
                  enables you to predict when they'll need water next and avoid
                  both under and over-watering.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="moistureBefore"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Before Watering (1-10)
                </label>
                <input
                  id="moistureBefore"
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  {...register("moistureBefore", { valueAsNumber: true })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-garden-500"
                  placeholder="e.g., 3"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Most plants need water when meter reads 3-4
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

                {"moistureBefore" in errors && errors?.moistureBefore && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors?.moistureBefore.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="moistureAfter"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  After Watering (1-10)
                </label>
                <input
                  id="moistureAfter"
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  {...register("moistureAfter", { valueAsNumber: true })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-garden-500"
                  placeholder="e.g., 7"
                />
                <p className="mt-1 text-xs text-gray-500">
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

            {/* Application method and runoff fields remain the same... */}
            <div>
              <label
                htmlFor="applicationMethod"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Application Method
              </label>
              <select
                id="applicationMethod"
                {...register("applicationMethod")}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-garden-500"
              >
                <option value="">Select method...</option>
                <option value="top-watering">
                  💧 Top Watering (most common)
                </option>
                <option value="bottom-watering">
                  ⬆️ Bottom Watering (for sensitive plants)
                </option>
                <option value="drip">🩸 Drip System</option>
                <option value="misting">💨 Misting (seedlings/humidity)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Different methods affect how plants absorb water
              </p>
            </div>

            <div className="flex items-start">
              <input
                id="runoffObserved"
                type="checkbox"
                {...register("runoffObserved")}
                className="mt-1 h-4 w-4 text-garden-600 border-gray-300 rounded focus:ring-garden-500"
              />
              <div className="ml-3">
                <label
                  htmlFor="runoffObserved"
                  className="text-sm font-medium text-gray-700"
                >
                  Observed water runoff from drainage holes
                </label>
                <p className="text-xs text-gray-500 mt-1">
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
                  className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded-md"
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

  // Rest of the component methods remain the same...
  function renderActivitySpecificFields() {
    switch (activityType) {
      case "water":
        return renderWateringFields();

      case "fertilize":
        return (
          <>
            <div>
              <label
                htmlFor="product"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Fertilizer Product *
              </label>
              <input
                id="product"
                type="text"
                {...register("product")}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-garden-500 focus:border-transparent"
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
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Dilution Ratio *
                </label>
                <input
                  id="dilution"
                  type="text"
                  {...register("dilution")}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-garden-500 focus:border-transparent"
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
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Application Amount *
                </label>
                <input
                  id="amount"
                  type="text"
                  {...register("amount")}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-garden-500 focus:border-transparent"
                  placeholder="e.g., 4 oz per plant"
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

      case "observe":
        return (
          <>
            <div>
              <label
                htmlFor="healthAssessment"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Health Assessment *
              </label>
              <select
                id="healthAssessment"
                {...register("healthAssessment")}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-garden-500 focus:border-transparent"
              >
                <option value="">Select health status...</option>
                <option value="excellent">🌟 Excellent</option>
                <option value="good">✅ Good</option>
                <option value="fair">⚠️ Fair</option>
                <option value="concerning">🔶 Concerning</option>
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
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Detailed Observations *
              </label>
              <textarea
                id="observations"
                {...register("observations")}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-garden-500 focus:border-transparent"
                placeholder="Describe what you observe: leaf color, growth patterns, any issues, etc."
              />
              {"observations" in errors && errors.observations && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.observations.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos (Optional)
              </label>
              <PhotoCapture
                photos={capturedPhotos}
                onPhotosChange={setCapturedPhotos}
                maxPhotos={5}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Log Care Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {submitError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          {/* Plant selection */}
          <div>
            <label
              htmlFor="plantId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Plant *
            </label>
            <select
              id="plantId"
              {...register("plantId")}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-garden-500 focus:border-transparent"
            >
              <option value="">Select a plant...</option>
              {plants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.name || plant.varietyId} - {plant.location}
                </option>
              ))}
            </select>
            {errors.plantId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.plantId.message}
              </p>
            )}
          </div>

          {/* Activity type selection */}
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Activity Type *
            </label>
            <select
              id="type"
              {...register("type")}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-garden-500 focus:border-transparent"
            >
              <option value="water">💧 Watering</option>
              <option value="fertilize">🌱 Fertilizing</option>
              <option value="observe">👁️ Observation</option>
              <option value="harvest">🌾 Harvest</option>
              <option value="transplant">🪴 Transplant</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {/* Date selection */}
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Date *
            </label>
            <input
              id="date"
              type="date"
              {...register("date")}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-garden-500 focus:border-transparent"
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          {/* Activity-specific fields */}
          {renderActivitySpecificFields()}

          {/* General notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Additional Notes
            </label>
            <textarea
              id="notes"
              {...register("notes")}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-garden-500 focus:border-transparent"
              placeholder="Any additional observations or notes..."
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">
                {errors.notes.message}
              </p>
            )}
          </div>

          {/* Form actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Logging Activity..." : "Log Activity"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
