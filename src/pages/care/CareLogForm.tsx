import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { useFirebaseCareActivities } from "@/hooks/useFirebaseCareActivities";
import {
  varietyService,
  VarietyRecord,
  CareActivityDetails,
} from "@/types/database";
import { calculateCurrentStageWithVariety } from "@/utils/growthStage";
import { GrowthStage } from "@/types";
import {
  Droplets,
  Beaker,
  Eye,
  Camera,
  FileText,
  Calendar,
  Info,
  Clock,
} from "lucide-react";
import { getMethodDisplay } from "@/utils/fertilizationUtils";
import { ApplicationMethod } from "@/types";
import { FertilizationScheduleItem } from "@/types";
import { format, subDays } from "date-fns";
import toast from "react-hot-toast";

const careFormSchema = z.object({
  plantId: z.string().min(1, "Please select a plant"),
  type: z.enum(["water", "fertilize", "observe", "photo", "note"]),
  date: z
    .string()
    .min(1, "Date is required")
    .refine((date) => new Date(date) <= new Date(), {
      message: "Date cannot be in the future.",
    }),
  notes: z.string().optional(),
  waterValue: z.number().optional(),
  waterUnit: z.enum(["oz", "ml", "cups", "L"]).optional(),
  fertilizeType: z.string().optional(),
  fertilizeDilution: z.string().optional(),
  fertilizeAmount: z.string().optional(),
  moistureBefore: z.number().min(1).max(10).optional(),
  moistureAfter: z.number().min(1).max(10).optional(),
});

type CareFormData = z.infer<typeof careFormSchema>;

interface CareLogFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  preselectedPlantId?: string;
  preselectedActivityType?: "water" | "fertilize" | "observe";
}

interface FertilizerProduct {
  name: string;
  dilution?: string;
  amount?: string;
  frequency?: string;
  method?: ApplicationMethod;
}

// Fixed TypeScript types for getProtocolForStage function
interface ProtocolStageData {
  // Common properties that might exist across different protocol types
  trigger?: {
    moistureLevel?: string | number;
    description?: string;
  };
  target?: {
    moistureLevel?: string | number;
    description?: string;
  };
  volume?: {
    amount?: string | number;
    frequency?: string;
    perPlant?: boolean;
  };
  schedule?: FertilizationScheduleItem[];
  notes?: string[];
  timing?: string;
  [key: string]: unknown; // Allow for additional properties
}

type ProtocolCollection = Record<string, ProtocolStageData> | undefined | null;

const getProtocolForStage = (
  protocols: ProtocolCollection,
  stage: GrowthStage
): ProtocolStageData | null => {
  if (!protocols) return null;
  if (protocols[stage]) return protocols[stage];
  const stageMappings: { [key in GrowthStage]?: string[] } = {
    vegetative: ["vegetativeGrowth", "vegetativeVining"],
    flowering: ["flowerBudFormation"],
    harvest: ["fruitingHarvesting", "podSetMaturation"],
    "ongoing-production": ["ongoingProduction"],
    germination: ["germinationEmergence", "slipProduction"],
    seedling: ["establishment"],
  };
  const possibleKeys = stageMappings[stage] || [];
  for (const key of possibleKeys) {
    if (protocols[key]) {
      return protocols[key];
    }
  }
  return null;
};

const formatAmountText = (amount: string) => {
  return amount.split(",").map((part, index, array) => (
    <span key={index}>
      {part.trim()}
      {index < array.length - 1 && <br />}
    </span>
  ));
};

export function CareLogForm({
  onSuccess,
  onCancel,
  preselectedPlantId,
  preselectedActivityType,
}: CareLogFormProps) {
  const { plants, loading: plantsLoading } = useFirebasePlants();
  const { logActivity } = useFirebaseCareActivities();
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDetailedTracking, setShowDetailedTracking] = useState(false);
  const [plantVariety, setPlantVariety] = useState<VarietyRecord | null>(null);
  const [currentStage, setCurrentStage] = useState<GrowthStage>("germination");
  const [availableFertilizers, setAvailableFertilizers] = useState<
    FertilizerProduct[]
  >([]);
  const [selectedFertilizer, setSelectedFertilizer] =
    useState<FertilizerProduct | null>(null);
  const [isBackfillMode, setIsBackfillMode] = useState(false);
  const [backfillReason, setBackfillReason] = useState("");
  const [searchParams] = useSearchParams();

  const plantIdFromParams =
    preselectedPlantId || searchParams.get("plantId") || "";
  const activityTypeFromParams =
    preselectedActivityType ||
    (searchParams.get("type") as "water" | "fertilize" | "observe") ||
    "water";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, isSubmitting },
    reset,
    setValue,
    setError,
  } = useForm<CareFormData>({
    resolver: zodResolver(careFormSchema),
    mode: "onChange",
    defaultValues: {
      plantId: "",
      type: activityTypeFromParams,
      date: new Date().toISOString().split("T")[0],
      waterValue: undefined,
      waterUnit: "oz",
    },
  });

  const activityType = watch("type");
  const selectedPlantId = watch("plantId");
  const selectedFertilizerType = watch("fertilizeType");

  useEffect(() => {
    if (!plantsLoading && plants.length > 0 && plantIdFromParams) {
      const plantExists = plants.some(
        (plant) => plant.id === plantIdFromParams
      );
      if (plantExists) {
        setValue("plantId", plantIdFromParams, { shouldValidate: true });
      }
    }
  }, [plantsLoading, plants, plantIdFromParams, setValue]);

  useEffect(() => {
    const loadPlantData = async () => {
      if (!selectedPlantId) {
        setPlantVariety(null);
        setCurrentStage("germination");
        setAvailableFertilizers([]);
        return;
      }
      const plant = plants.find((p) => p.id === selectedPlantId);
      if (!plant) return;
      try {
        const variety = await varietyService.getVariety(plant.varietyId);
        setPlantVariety(variety || null);
        if (variety) {
          const stage = calculateCurrentStageWithVariety(
            plant.plantedDate,
            variety
          );
          setCurrentStage(stage);
          if (
            activityType === "fertilize" &&
            variety.protocols?.fertilization
          ) {
            const fertilizingProtocol = getProtocolForStage(
              variety.protocols.fertilization,
              stage
            );
            if (
              fertilizingProtocol?.schedule &&
              Array.isArray(fertilizingProtocol.schedule)
            ) {
              const products: FertilizerProduct[] =
                fertilizingProtocol.schedule.map(
                  (item: FertilizationScheduleItem) => ({
                    name: item.details.product,
                    dilution: item.details.dilution,
                    amount: item.details.amount,
                    method: item.details.method,
                  })
                );
              setAvailableFertilizers(products);
              if (products.length === 1) {
                const firstProduct = products[0];
                setValue("fertilizeType", firstProduct.name);
                setSelectedFertilizer(firstProduct);
              }
            } else {
              setAvailableFertilizers([]);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load plant variety:", error);
        setPlantVariety(null);
      }
    };
    loadPlantData();
  }, [selectedPlantId, plants, activityType, setValue]);

  useEffect(() => {
    if (selectedFertilizerType) {
      const fertilizer = availableFertilizers.find(
        (f) => f.name === selectedFertilizerType
      );
      setSelectedFertilizer(fertilizer || null);
      if (fertilizer) {
        if (fertilizer.dilution) {
          setValue("fertilizeDilution", fertilizer.dilution);
        }
        if (fertilizer.amount) {
          setValue("fertilizeAmount", fertilizer.amount);
        }
      }
    } else {
      setSelectedFertilizer(null);
    }
  }, [selectedFertilizerType, availableFertilizers, setValue]);

  useEffect(() => {
    const backfillParam = searchParams.get("backfill");
    const dateParam = searchParams.get("date");

    if (backfillParam === "true" && dateParam) {
      setIsBackfillMode(true);
      setValue("date", dateParam);
      setBackfillReason("Catching up on missed care activity");
    }
  }, [searchParams, setValue]);
  // src/pages/care/CareLogForm.tsx

  const onSubmit = async (data: CareFormData) => {
    // Manual validation for water activities
    if (data.type === "water" && (!data.waterValue || data.waterValue <= 0)) {
      setError("waterValue", {
        type: "manual",
        message: "Water amount is required for watering activities.",
      });
      return;
    }

    setIsLoading(true);
    setSubmitError(null);
    try {
      const details: Partial<CareActivityDetails> = {
        type: data.type,
        notes: data.notes,
      };

      if (data.type === "water") {
        details.amount = {
          value: data.waterValue!,
          unit: data.waterUnit!,
        };
        if (showDetailedTracking && data.moistureBefore && data.moistureAfter) {
          details.moistureLevel = {
            before: data.moistureBefore,
            after: data.moistureAfter,
            scale: "1-10",
          };
        }
      } else if (data.type === "fertilize") {
        details.product = data.fertilizeType;
        details.dilution = data.fertilizeDilution;
        details.amount = data.fertilizeAmount;
        details.applicationMethod = selectedFertilizer?.method;
      }

      await logActivity({
        plantId: data.plantId,
        type: data.type,
        date: new Date(data.date),
        details: details as CareActivityDetails,
      });

      toast.success("Care activity logged!");
      reset();
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      console.error("Failed to log care activity:", error);
      setSubmitError(`Failed to log care activity: ${errorMessage}`);
      toast.error("Failed to log activity.");
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "water":
        return <Droplets className="h-4 w-4" />;
      case "fertilize":
        return <Beaker className="h-4 w-4" />;
      case "observe":
        return <Eye className="h-4 w-4" />;
      case "photo":
        return <Camera className="h-4 w-4" />;
      case "note":
        return <FileText className="h-4 w-4" />;
      default:
        return <Droplets className="h-4 w-4" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case "water":
        return "Watering";
      case "fertilize":
        return "Fertilizing";
      case "observe":
        return "Health Check";
      case "photo":
        return "Photo Log";
      case "note":
        return "General Note";
      default:
        return "Activity";
    }
  };

  const renderWateringProtocol = () => {
    if (!plantVariety?.protocols?.watering) return null;
    const wateringProtocol = getProtocolForStage(
      plantVariety.protocols.watering,
      currentStage
    );
    if (!wateringProtocol) return null;
    return (
      <div className="mt-4 p-3 bg-muted/50 dark:bg-muted/30 border border-border rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            Protocol for {currentStage} stage:
          </span>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          {wateringProtocol.trigger && (
            <div>
              <span className="font-medium text-foreground">
                When to water:
              </span>{" "}
              {wateringProtocol.trigger.moistureLevel}
            </div>
          )}
          {wateringProtocol.target && (
            <div>
              <span className="font-medium text-foreground">
                Target moisture:
              </span>{" "}
              {wateringProtocol.target.moistureLevel}
            </div>
          )}
          {wateringProtocol.volume && (
            <div>
              <span className="font-medium text-foreground">Amount:</span>{" "}
              {formatAmountText(wateringProtocol.volume.amount as string)}
              {wateringProtocol.volume.frequency && (
                <span className="block mt-1">
                  <span className="font-medium text-foreground">
                    Frequency:
                  </span>{" "}
                  {wateringProtocol.volume.frequency}
                </span>
              )}
            </div>
          )}
          {wateringProtocol.notes && wateringProtocol.notes.length > 0 && (
            <div>
              <span className="font-medium text-foreground">Notes:</span>
              <ul className="list-disc list-inside ml-2 space-y-1 mt-1">
                {wateringProtocol.notes.map((note: string, index: number) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWateringFields = () => {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Droplets className="h-4 w-4" />
            Watering Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {renderWateringProtocol()}
          <div className="grid grid-cols-2 gap-3">
            <div>
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
                placeholder="Amount"
                {...register("waterValue", { valueAsNumber: true })}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
              />
              {errors.waterValue && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.waterValue.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Unit
              </label>
              <select
                {...register("waterUnit")}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
              >
                <option value="oz">oz</option>
                <option value="ml">ml</option>
                <option value="cups">cups</option>
                <option value="L">L</option>
              </select>
            </div>
          </div>
          {showDetailedTracking && (
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Moisture Before (1-10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  placeholder="1-10"
                  {...register("moistureBefore", { valueAsNumber: true })}
                  className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Moisture After (1-10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  placeholder="1-10"
                  {...register("moistureAfter", { valueAsNumber: true })}
                  className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="detailed-tracking"
              checked={showDetailedTracking}
              onChange={(e) => setShowDetailedTracking(e.target.checked)}
              className="rounded border-border"
            />
            <label
              htmlFor="detailed-tracking"
              className="text-sm text-foreground"
            >
              Track moisture levels
            </label>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderFertilizationProtocol = () => {
    if (!plantVariety?.protocols?.fertilization) return null;
    const fertilizingProtocol = getProtocolForStage(
      plantVariety.protocols.fertilization,
      currentStage
    );
    if (!fertilizingProtocol) return null;
    return (
      <div className="mt-4 p-3 bg-muted/50 dark:bg-muted/30 border border-border rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            Protocol for {currentStage} stage:
          </span>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          {fertilizingProtocol.timing && (
            <div>
              <span className="font-medium text-foreground">Timing:</span>{" "}
              {fertilizingProtocol.timing}
            </div>
          )}
          {selectedFertilizer && (
            <div className="space-y-1">
              {selectedFertilizer.frequency && (
                <div>
                  <span className="font-medium text-foreground">
                    Frequency:
                  </span>{" "}
                  {selectedFertilizer.frequency}
                </div>
              )}
              {selectedFertilizer.method && (
                <div>
                  <span className="font-medium text-foreground">Method:</span>{" "}
                  {getMethodDisplay(selectedFertilizer.method)}
                </div>
              )}
            </div>
          )}
          {fertilizingProtocol.notes &&
            fertilizingProtocol.notes.length > 0 && (
              <div>
                <span className="font-medium text-foreground">Notes:</span>
                <ul className="list-disc list-inside ml-2 space-y-1 mt-1">
                  {fertilizingProtocol.notes.map(
                    (note: string, index: number) => (
                      <li key={index}>{note}</li>
                    )
                  )}
                </ul>
              </div>
            )}
        </div>
      </div>
    );
  };

  const renderFertilizingFields = () => {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Beaker className="h-4 w-4" />
            Fertilizer Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {renderFertilizationProtocol()}
          <div>
            <label
              htmlFor="fertilizeType"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Fertilizer Product *
            </label>
            <select
              {...register("fertilizeType")}
              id="fertilizeType"
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="">Choose a fertilizer...</option>
              {availableFertilizers.map((fertilizer, index) => (
                <option key={index} value={fertilizer.name}>
                  {fertilizer.name}
                  {fertilizer.method &&
                    ` (${getMethodDisplay(fertilizer.method)})`}
                </option>
              ))}
              <option value="custom">Custom/Other</option>
            </select>
            {errors.fertilizeType && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.fertilizeType.message}
              </p>
            )}
          </div>
          {selectedFertilizerType === "custom" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Custom Fertilizer Name *
              </label>
              <input
                type="text"
                placeholder="e.g., General Purpose, Bloom Booster"
                {...register("fertilizeType")}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="dilution"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Dilution
              </label>
              <input
                id="dilution"
                type="text"
                placeholder="e.g., 2 Tbsp/gal"
                {...register("fertilizeDilution")}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
              />
            </div>
            <div>
              <label
                htmlFor="fertilizeAmount"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Amount *
              </label>
              <input
                id="fertilizeAmount"
                type="text"
                placeholder="e.g., light application"
                {...register("fertilizeAmount")}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
              />
              {errors.fertilizeAmount && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.fertilizeAmount.message}
                </p>
              )}
            </div>
          </div>
          {selectedFertilizer && (
            <div className="p-3 bg-muted/50 dark:bg-muted/30 border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Recommended Settings
                </span>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                {selectedFertilizer.frequency && (
                  <div>
                    <span className="font-medium text-foreground">
                      Frequency:
                    </span>{" "}
                    {selectedFertilizer.frequency}
                  </div>
                )}
                {selectedFertilizer.method && (
                  <div>
                    <span className="font-medium text-foreground">Method:</span>{" "}
                    {getMethodDisplay(selectedFertilizer.method)}
                  </div>
                )}
                {selectedFertilizer.amount && (
                  <div>
                    <span className="font-medium text-foreground">Amount:</span>{" "}
                    {selectedFertilizer.amount}
                  </div>
                )}
                {selectedFertilizer.dilution && (
                  <div>
                    <span className="font-medium text-foreground">
                      Dilution:
                    </span>{" "}
                    {selectedFertilizer.dilution}
                  </div>
                )}
              </div>
            </div>
          )}
          {selectedFertilizer?.method === "soil-drench" && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Droplets className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Water Required
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    This application method requires water. Consider combining
                    with regular watering if due soon to prevent overwatering.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderActivitySpecificFields = () => {
    switch (activityType) {
      case "water":
        return renderWateringFields();
      case "fertilize":
        return renderFertilizingFields();
      default:
        return null;
    }
  };

  if (plantsLoading) {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
            <span className="ml-2">Loading plants...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  const sortedPlants = [...plants].sort((a, b) => {
    const nameA = a.name || a.varietyName;
    const nameB = b.name || b.varietyName;
    return nameA.localeCompare(nameB);
  });
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {getActivityIcon(activityType)}
          {getActivityLabel(activityType)} Log
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {submitError && (
            <div
              className="p-3 bg-red-50 border border-red-200 rounded-lg"
              role="alert"
            >
              <p className="text-sm text-red-600 font-medium">{submitError}</p>
            </div>
          )}

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label
                    htmlFor="plant-select"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Plant *
                  </label>
                  <select
                    id="plant-select"
                    {...register("plantId")}
                    className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                  >
                    <option value="">Choose a plant...</option>
                    {sortedPlants.map((plant) => (
                      <option key={plant.id} value={plant.id}>
                        {plant.name
                          ? `${plant.name} (${plant.varietyName})`
                          : plant.varietyName}
                        {plant.location && ` - ${plant.location}`}
                      </option>
                    ))}
                  </select>
                  {errors.plantId && (
                    <p className="mt-1 text-sm text-red-600" role="alert">
                      {errors.plantId.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Activity Type *
                  </label>
                  <select
                    {...register("type")}
                    id="type"
                    className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                  >
                    <option value="water">💧 Watering</option>
                    <option value="fertilize">🌱 Fertilizing</option>
                    <option value="observe">👁️ Health Check</option>
                    <option value="photo">📸 Photo Log</option>
                    <option value="note">📝 General Note</option>
                  </select>
                  {errors.type && (
                    <p className="mt-1 text-sm text-red-600" role="alert">
                      {errors.type.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="date">
                    Date *
                    <span className="text-muted-foreground ml-1">
                      (can select past dates for catch-up logging)
                    </span>
                  </label>
                  <input
                    id="date"
                    type="date"
                    {...register("date")}
                    className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                    max={format(new Date(), "yyyy-MM-dd")}
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600" role="alert">
                      {errors.date.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setValue(
                        "date",
                        format(subDays(new Date(), 1), "yyyy-MM-dd")
                      )
                    }
                  >
                    Yesterday
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setValue(
                        "date",
                        format(subDays(new Date(), 7), "yyyy-MM-dd")
                      )
                    }
                  >
                    Last Week
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          {isBackfillMode && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Backfill Mode
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    You're logging a past activity. Please add a note about why
                    you're logging this retroactively.
                  </p>
                  <textarea
                    value={backfillReason}
                    onChange={(e) => setBackfillReason(e.target.value)}
                    placeholder="e.g., 'I fertilized on this date but forgot to log it'"
                    className="mt-2 w-full p-2 text-xs border border-blue-200 rounded bg-white dark:bg-gray-800"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}

          {renderActivitySpecificFields()}

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Additional Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  {...register("notes")}
                  rows={3}
                  placeholder="Add any additional observations or notes about this care activity..."
                  className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 pt-6 border-t border-border">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                disabled={isLoading || isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={!isValid || isLoading || isSubmitting}
              className="flex-1"
              size="lg"
            >
              {isLoading || isSubmitting ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Logging...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>🌿</span>
                  <span>Log Activity</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
