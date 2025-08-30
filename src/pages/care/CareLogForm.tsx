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
import { groupPlantsByConditions } from "@/utils/plantGrouping";
import { seedVarieties } from "@/data/seedVarieties";
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
import {
  getMethodDisplay,
  requiresWater,
  getWaterAmountForMethod,
} from "@/utils/fertilizationUtils";
import {
  getTodayDateString,
  createLocalDateFromString,
  createDateForCareLogging,
} from "@/utils/dateUtils";
import { ApplicationMethod } from "@/types";
import { FertilizationScheduleItem } from "@/types";
import { format, subDays } from "date-fns";
import toast from "react-hot-toast";
import SectionApplyCard from "@/components/care/SectionApplyCard";
import SupplementalWateringCard from "@/components/care/SupplementalWateringCard";
import {
  BulkCareResult,
  SectionApplyOption,
} from "@/services/sectionBulkService";
import {
  PartialWateringService,
  PartialWateringAnalysis,
} from "@/services/partialWateringService";

const careFormSchema = z.object({
  groupId: z.string().min(1, "Please select a plant section"),
  type: z.enum([
    "water",
    "fertilize",
    "observe",
    "photo",
    "note",
    "pruning",
    "moisture",
  ]),
  date: z
    .string()
    .min(1, "Date is required")
    .refine((date) => createLocalDateFromString(date) <= new Date(), {
      message: "Date cannot be in the future.",
    }),
  notes: z.string().optional(),
  waterValue: z.number().optional().nullable(),
  waterUnit: z.enum(["oz", "ml", "cups", "L"]).optional(),
  fertilizeType: z.string().optional(),
  fertilizeDilution: z.string().optional(),
  fertilizeAmount: z.string().optional(),
  // New structured fertilizer fields
  fertilizerDilutionValue: z.number().optional(),
  fertilizerDilutionUnit: z
    .enum(["tsp", "tbsp", "oz", "ml", "cups"])
    .optional(),
  fertilizerDilutionPerUnit: z
    .enum(["gal", "quart", "liter", "cup"])
    .optional(),
  fertilizerApplicationAmount: z.number().optional(),
  fertilizerApplicationUnit: z
    .enum(["oz", "ml", "cups", "gal", "quart", "liter"])
    .optional(),
  moistureBefore: z.number().min(1).max(10).optional(),
  moistureAfter: z.number().min(1).max(10).optional(),
});

type CareFormData = z.infer<typeof careFormSchema>;

interface CareLogFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  preselectedPlantId?: string;
  preselectedActivityType?:
    | "water"
    | "fertilize"
    | "observe"
    | "pruning"
    | "moisture";
  preselectedProduct?: string;
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
    germination: ["germinationEmergence", "slipProduction"],
    seedling: ["establishment"],
    rootDevelopment: ["rootDevelopment", "tuberDevelopment"],
    fruiting: ["fruiting"],
    maturation: ["maturation", "ongoing-production"], // Map maturation to ongoing production for everbearing plants
    "ongoing-production": ["ongoingProduction"], // Map kebab-case to camelCase
  } as const;
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
  preselectedProduct,
}: CareLogFormProps) {
  const { plants, loading: plantsLoading } = useFirebasePlants();
  const { logActivity } = useFirebaseCareActivities();
  // Group plants by sections/containers
  const plantGroups = plants.length > 0 ? groupPlantsByConditions(plants) : [];
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
  const [showSectionApply, setShowSectionApply] = useState(false);
  const [sectionApplyOption, setSectionApplyOption] =
    useState<SectionApplyOption | null>(null);
  const [lastSubmittedData, setLastSubmittedData] =
    useState<CareFormData | null>(null);
  // Bulk mode state removed - now using groups exclusively
  const [showSupplementalWatering, setShowSupplementalWatering] =
    useState(false);
  const [partialWateringAnalysis, setPartialWateringAnalysis] =
    useState<PartialWateringAnalysis | null>(null);
  const [applyToAllGroupPlants, setApplyToAllGroupPlants] = useState(false);
  const [useStructuredFertilizer, setUseStructuredFertilizer] = useState(true);

  // Handle both single plant ID and bulk plant IDs from URL params
  const plantIdsFromParams = searchParams.get("plantIds");
  const isBulkFromParams = searchParams.get("bulk") === "true";
  const plantIdFromParams =
    preselectedPlantId || searchParams.get("plantId") || "";
  const activityTypeFromParams =
    preselectedActivityType ||
    (searchParams.get("type") as
      | "water"
      | "fertilize"
      | "observe"
      | "pruning"
      | "moisture") ||
    "water";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<CareFormData>({
    resolver: zodResolver(careFormSchema),
    mode: "onChange",
    defaultValues: {
      groupId: "",
      type: preselectedActivityType || activityTypeFromParams,
      date: getTodayDateString(),
      waterValue: null,
      waterUnit: "oz",
    },
  });

  const selectedGroupId = watch("groupId");

  // Get the selected group and its plants
  const selectedGroup = plantGroups.find(
    (group) => group.id === selectedGroupId
  );

  const activityType = watch("type");
  const selectedFertilizerType = watch("fertilizeType");
  const fertilizerDilutionValue = watch("fertilizerDilutionValue");
  const fertilizerDilutionUnit = watch("fertilizerDilutionUnit");
  const fertilizerDilutionPerUnit = watch("fertilizerDilutionPerUnit");
  const fertilizerApplicationAmount = watch("fertilizerApplicationAmount");
  const fertilizerApplicationUnit = watch("fertilizerApplicationUnit");

  const selectedPlantIds = selectedGroup
    ? selectedGroup.plants.map((p) => p.id)
    : [];

  // Find all other groups with the same variety AND same base container for the "Apply to all grouped plants" option
  const otherSameVarietyGroups = selectedGroup
    ? plantGroups.filter((group) => {
        if (group.id === selectedGroup.id) return false;

        // Must have same variety name
        if (group.varietyName !== selectedGroup.varietyName) return false;

        // Must have same base container (remove section info like "Row X, Column Y")
        const getBaseContainer = (container: string) => {
          return container
            .replace(/ - Row \d+, Column \d+/, "")
            .replace(/ - Section .+$/, "")
            .replace(/ - R\d+C\d+/, "")
            .replace(/ - \d+,\d+/, "");
        };

        const selectedBaseContainer = getBaseContainer(selectedGroup.container);
        const groupBaseContainer = getBaseContainer(group.container);

        // Only include if they have the same base container AND same planting date
        return (
          groupBaseContainer === selectedBaseContainer &&
          group.plantedDate.getTime() === selectedGroup.plantedDate.getTime()
        );
      })
    : [];
  const otherSameVarietyPlantIds = otherSameVarietyGroups.flatMap((group) =>
    group.plants.map((p) => p.id)
  );
  const totalSameVarietyPlants =
    selectedPlantIds.length + otherSameVarietyPlantIds.length;

  // Centralized form initialization - replaces multiple setValue useEffects
  useEffect(() => {
    if (plantsLoading) return;

    // Collect all form values that need to be set
    const formValues: Partial<CareFormData> = {};
    let hasChanges = false;

    // Set group ID from preselected plant
    if (plantGroups.length > 0 && plantIdFromParams) {
      const targetGroup = plantGroups.find((group) =>
        group.plants.some((plant) => plant.id === plantIdFromParams)
      );
      if (targetGroup) {
        formValues.groupId = targetGroup.id;
        hasChanges = true;
      }
    }

    // Set group ID from bulk params
    if (isBulkFromParams && plantIdsFromParams && plantGroups.length > 0) {
      const plantIds = plantIdsFromParams.split(",").filter((id) => id.trim());
      const targetGroup = plantGroups.find((group) =>
        plantIds.some((id) => group.plants.some((plant) => plant.id === id))
      );
      if (targetGroup) {
        formValues.groupId = targetGroup.id;
        hasChanges = true;
      }
    }

    // Set preselected activity type
    if (preselectedActivityType && preselectedActivityType !== watch("type")) {
      formValues.type = preselectedActivityType;
      hasChanges = true;
    }

    // Set preselected fertilizer product (if not already set)
    if (preselectedProduct && preselectedProduct !== watch("fertilizeType")) {
      formValues.fertilizeType = preselectedProduct;
      hasChanges = true;
    }

    // Set backfill date
    const backfillParam = searchParams.get("backfill");
    const dateParam = searchParams.get("date");
    if (backfillParam === "true" && dateParam) {
      formValues.date = dateParam;
      setIsBackfillMode(true);
      setBackfillReason("Catching up on missed care activity");
      hasChanges = true;
    }

    // Apply all changes at once using reset to avoid multiple re-renders
    if (hasChanges) {
      reset({
        ...watch(), // Keep existing values
        ...formValues, // Override with new values
      });
    }
  }, [
    plantsLoading,
    plantGroups,
    plantIdFromParams,
    isBulkFromParams,
    plantIdsFromParams,
    preselectedActivityType,
    preselectedProduct,
    searchParams,
    reset,
    watch,
  ]);

  // Auto-check apply to all checkbox when group has multiple plants
  useEffect(() => {
    if (selectedGroup && selectedGroup.plants.length > 1) {
      setApplyToAllGroupPlants(true);
    }
  }, [selectedGroup]);


  useEffect(() => {
    const loadPlantData = async () => {
      if (!selectedGroup) {
        setPlantVariety(null);
        setCurrentStage("germination");
        setAvailableFertilizers([]);
        return;
      }
      // Use the first plant in the group as the representative plant
      const plant = selectedGroup.plants[0];
      if (!plant) return;
      try {
        // Try IndexedDB first, then fallback to seedVarieties data
        let variety = await varietyService.getVariety(plant.varietyId);
        if (!variety) {
          // Fallback to seedVarieties data for Firebase plants
          const seedVariety = seedVarieties.find(
            (v) => v.name === plant.varietyName
          );
          if (seedVariety) {
            variety = {
              id: plant.varietyId,
              name: seedVariety.name,
              category: seedVariety.category,
              normalizedName: seedVariety.name.toLowerCase(),
              protocols: seedVariety.protocols,
              isCustom: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as VarietyRecord;
          }
        }

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
              const allProducts: FertilizerProduct[] =
                fertilizingProtocol.schedule.map(
                  (item: FertilizationScheduleItem) => ({
                    name: item.details.product,
                    dilution: item.details.dilution,
                    amount: item.details.amount,
                    method: item.details.method || "soil-drench", // Default to soil-drench if not specified
                  })
                );

              // Deduplicate fertilizer products by name, keeping the first occurrence
              const seenProducts = new Map<string, FertilizerProduct>();
              allProducts.forEach((product) => {
                if (!seenProducts.has(product.name)) {
                  seenProducts.set(product.name, product);
                }
              });
              const products = Array.from(seenProducts.values());

              setAvailableFertilizers(products);
              // Pre-select product if provided, otherwise default to first product if only one available
              let selectedProduct: FertilizerProduct | null = null;
              let fertilizerToSet: string | undefined;

              if (
                preselectedProduct &&
                products.some((p) => p.name === preselectedProduct)
              ) {
                selectedProduct = products.find((p) => p.name === preselectedProduct) || null;
                fertilizerToSet = preselectedProduct;
              } else if (products.length === 1) {
                selectedProduct = products[0];
                fertilizerToSet = products[0].name;
              }

              if (fertilizerToSet && fertilizerToSet !== watch("fertilizeType")) {
                reset({
                  ...watch(),
                  fertilizeType: fertilizerToSet,
                });
              }
              setSelectedFertilizer(selectedProduct);
            } else {
              setAvailableFertilizers([]);
            }
          } else {
            setAvailableFertilizers([]);
          }
        }
      } catch (error) {
        console.error("Failed to load plant variety:", error);
        setPlantVariety(null);
      }
    };
    loadPlantData();
  }, [selectedGroup, plants, activityType, preselectedProduct, reset, watch]);

  useEffect(() => {
    if (selectedFertilizerType) {
      const fertilizer = availableFertilizers.find(
        (f) => f.name === selectedFertilizerType
      );
      setSelectedFertilizer(fertilizer || null);
      
      if (fertilizer) {
        const formUpdates: Partial<CareFormData> = {};
        let hasUpdates = false;

        if (fertilizer.dilution && fertilizer.dilution !== watch("fertilizeDilution")) {
          formUpdates.fertilizeDilution = fertilizer.dilution;
          hasUpdates = true;
        }
        if (fertilizer.amount && fertilizer.amount !== watch("fertilizeAmount")) {
          formUpdates.fertilizeAmount = fertilizer.amount;
          hasUpdates = true;
        }

        if (hasUpdates) {
          reset({
            ...watch(),
            ...formUpdates,
          });
        }
      }
    } else {
      setSelectedFertilizer(null);
    }
  }, [selectedFertilizerType, availableFertilizers, reset, watch]);

  // Check for container-wide apply options when group is selected
  useEffect(() => {
    if (selectedGroup && plants.length > 0) {
      // Find other groups in the same container
      const sameContainerGroups = plantGroups.filter(
        (group) =>
          group.id !== selectedGroup.id &&
          group.container === selectedGroup.container &&
          group.varietyName === selectedGroup.varietyName
      );

      if (sameContainerGroups.length > 0) {
        const otherPlantIds = sameContainerGroups.flatMap((group) =>
          group.plants.map((p) => p.id)
        );
        setSectionApplyOption({
          sectionKey: `${selectedGroup.container}_${selectedGroup.varietyName}`,
          plantCount: otherPlantIds.length,
          varieties: [selectedGroup.varietyName],
          location: selectedGroup.location,
          container: selectedGroup.container,
          hasVarietyMix: false,
          displayText: `Apply to ${otherPlantIds.length} other ${selectedGroup.varietyName} plants in ${selectedGroup.container}`,
        });
      } else {
        setSectionApplyOption(null);
      }
    } else {
      setSectionApplyOption(null);
    }
  }, [selectedGroup, plantGroups]);


  // Handle bulk care submission for section apply
  const handleBulkCareSubmission = async (
    plantIds: string[]
  ): Promise<BulkCareResult[]> => {
    if (!lastSubmittedData) {
      throw new Error("No previous submission data available");
    }

    const results: BulkCareResult[] = [];

    // Generate a unique section ID for this bulk application
    const sectionId = `section_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    for (const plantId of plantIds) {
      try {
        const plant = plants.find((p) => p.id === plantId);
        if (!plant) {
          results.push({
            plantId,
            plantName: "Unknown Plant",
            success: false,
            error: "Plant not found",
          });
          continue;
        }

        const details: Partial<CareActivityDetails> = {
          type: lastSubmittedData.type,
          // Mark as section-based activity
          sectionBased: true,
          sectionId: sectionId,
          plantsInSection: plantIds.length,
        };

        // Only set notes if it has a valid value
        if (lastSubmittedData.notes) {
          details.notes = lastSubmittedData.notes;
        }

        if (lastSubmittedData.type === "water") {
          details.amount = {
            value: lastSubmittedData.waterValue!,
            unit: lastSubmittedData.waterUnit!,
          };
          // Store total section amount for reference
          details.totalSectionAmount = {
            value: lastSubmittedData.waterValue!,
            unit: lastSubmittedData.waterUnit!,
          };
          if (showDetailedTracking && lastSubmittedData.moistureBefore) {
            details.moistureLevel = {
              before: lastSubmittedData.moistureBefore,
              ...(lastSubmittedData.moistureAfter && {
                after: lastSubmittedData.moistureAfter,
              }),
              scale: "1-10",
            };
          }
        } else if (lastSubmittedData.type === "fertilize") {
          // Only set fertilizer fields if they have valid values
          if (lastSubmittedData.fertilizeType) {
            details.product = lastSubmittedData.fertilizeType;
          }
          if (lastSubmittedData.fertilizeDilution) {
            details.dilution = lastSubmittedData.fertilizeDilution;
          }
          if (lastSubmittedData.fertilizeAmount) {
            details.amount = lastSubmittedData.fertilizeAmount;
          }
          // Only set applicationMethod if it has a valid value
          if (selectedFertilizer?.method) {
            details.applicationMethod = selectedFertilizer.method;
          }
        } else if (lastSubmittedData.type === "moisture") {
          // Moisture tracking - log the current moisture level
          if (lastSubmittedData.moistureBefore) {
            details.moistureLevel = {
              before: lastSubmittedData.moistureBefore,
              scale: "1-10",
            };
          }
        }

        await logActivity({
          plantId: plantId,
          type: lastSubmittedData.type,
          date: createDateForCareLogging(lastSubmittedData.date),
          details: details as CareActivityDetails,
        });

        // If this is a fertilizer activity that requires water, also log a watering activity
        if (
          lastSubmittedData.type === "fertilize" &&
          selectedFertilizer?.method &&
          requiresWater(selectedFertilizer.method)
        ) {
          try {
            // Calculate appropriate water amount based on application method
            const providedAmount =
              lastSubmittedData.fertilizerApplicationAmount &&
              lastSubmittedData.fertilizerApplicationUnit === "ml"
                ? lastSubmittedData.fertilizerApplicationAmount
                : undefined;

            const { amount: waterAmount, unit: waterUnit } =
              getWaterAmountForMethod(
                selectedFertilizer.method,
                providedAmount
              );

            const waterDetails: CareActivityDetails = {
              type: "water",
              amount: {
                value: waterAmount,
                unit: waterUnit as any,
              },
              notes: `Watered in fertilizer (${getMethodDisplay(
                selectedFertilizer.method
              )})`,
            };

            await logActivity({
              plantId: plantId,
              type: "water",
              date: createDateForCareLogging(lastSubmittedData.date),
              details: waterDetails,
            });
          } catch (waterError) {
            console.error(
              `Failed to log water activity for fertilizer on plant ${plantId}:`,
              waterError
            );
            // Don't fail the main fertilizer activity if water logging fails
          }
        }

        results.push({
          plantId,
          plantName: plant.name || plant.varietyName,
          success: true,
        });
      } catch (error) {
        const plant = plants.find((p) => p.id === plantId);
        results.push({
          plantId,
          plantName: plant?.name || plant?.varietyName || "Unknown Plant",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Show summary toast
    const successCount = results.filter((r) => r.success).length;
    const totalCount = results.length;

    if (successCount === totalCount) {
      toast.success(`✓ Applied to all ${totalCount} plants in section`);
    } else if (successCount > 0) {
      toast.success(`✓ Applied to ${successCount} of ${totalCount} plants`);
    } else {
      toast.error("Failed to apply to section plants");
    }

    // Auto-hide section apply after completion
    setTimeout(() => {
      setShowSectionApply(false);
      setLastSubmittedData(null);
      reset();
      onSuccess?.();
    }, 3000);

    return results;
  };

  // Handle supplemental watering addition
  const handleSupplementalWatering = async (amount: number, unit: string) => {
    if (!lastSubmittedData || !partialWateringAnalysis || !selectedGroup)
      return;

    try {
      const details: Partial<CareActivityDetails> = {
        type: "water",
        amount: { value: amount, unit: unit as any },
        notes: "Supplemental watering to complete previous partial application",
        // Mark as supplemental
        isPartialWatering: false, // This completes the watering
        recommendedAmount: partialWateringAnalysis.recommendedAmount,
        wateringCompleteness: 1, // Now complete
      };

      // Apply to all plants in the group
      for (const plant of selectedGroup.plants) {
        await logActivity({
          plantId: plant.id,
          type: "water",
          date: new Date(),
          details: details as CareActivityDetails,
        });
      }

      toast.success(`Added ${amount} ${unit} supplemental water!`);
    } catch (error) {
      console.error("Failed to add supplemental watering:", error);
      toast.error("Failed to add supplemental water");
      throw error;
    }
  };

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

    // Manual validation for structured fertilizer inputs
    if (data.type === "fertilize" && useStructuredFertilizer) {
      if (
        !data.fertilizerApplicationAmount ||
        !data.fertilizerApplicationUnit
      ) {
        setError("fertilizerApplicationAmount", {
          type: "manual",
          message:
            "Application amount and unit are required when using structured fertilizer inputs.",
        });
        return;
      }
    }

    setIsLoading(true);
    setSubmitError(null);
    try {
      const details: Partial<CareActivityDetails> = {
        type: data.type,
      };

      // Only set notes if it has a valid value
      if (data.notes) {
        details.notes = data.notes;
      }

      if (data.type === "water") {
        details.amount = {
          value: data.waterValue!,
          unit: data.waterUnit!,
        };
        if (showDetailedTracking && data.moistureBefore) {
          details.moistureLevel = {
            before: data.moistureBefore,
            ...(data.moistureAfter && { after: data.moistureAfter }),
            scale: "1-10",
          };
        }

        // Analyze if this is partial watering using representative plant from group
        if (selectedGroup && selectedGroup.plants.length > 0) {
          const representativePlant = selectedGroup.plants[0];
          try {
            const analysis = await PartialWateringService.analyzeWateringAmount(
              representativePlant,
              data.waterValue!,
              data.waterUnit!
            );

            // Enhance details with partial watering info
            details.recommendedAmount = analysis.recommendedAmount;
            details.isPartialWatering = analysis.isPartial;
            details.wateringCompleteness = analysis.completeness;

            // Show user feedback if partial and offer supplemental watering
            if (analysis.isPartial) {
              toast(analysis.message, {
                duration: 6000,
                icon: "⚠️",
                style: {
                  background: "#FEF3C7",
                  color: "#92400E",
                  border: "1px solid #FCD34D",
                },
              });

              // Show supplemental watering option
              if (analysis.canAddSupplement) {
                setPartialWateringAnalysis(analysis);
                setShowSupplementalWatering(true);
              }
            }
          } catch (error) {
            console.error("Failed to analyze watering amount:", error);
          }
        }
      } else if (data.type === "fertilize") {
        // Only set product if it has a valid value
        if (data.fertilizeType) {
          details.product = data.fertilizeType;
        }

        // Handle structured fertilizer inputs
        if (
          useStructuredFertilizer &&
          data.fertilizerDilutionValue &&
          data.fertilizerDilutionUnit &&
          data.fertilizerDilutionPerUnit
        ) {
          details.dilution = `${data.fertilizerDilutionValue} ${data.fertilizerDilutionUnit}/${data.fertilizerDilutionPerUnit}`;
        } else if (data.fertilizeDilution) {
          details.dilution = data.fertilizeDilution;
        }

        if (
          useStructuredFertilizer &&
          data.fertilizerApplicationAmount &&
          data.fertilizerApplicationUnit
        ) {
          details.amount = `${data.fertilizerApplicationAmount} ${data.fertilizerApplicationUnit}`;
        } else if (data.fertilizeAmount) {
          details.amount = data.fertilizeAmount;
        }

        // Only set applicationMethod if it has a valid value
        if (selectedFertilizer?.method) {
          details.applicationMethod = selectedFertilizer.method;
        }
      } else if (data.type === "moisture") {
        // Moisture tracking - log the current moisture level
        if (data.moistureBefore) {
          details.moistureLevel = {
            before: data.moistureBefore,
            scale: "1-10",
          };
        }
      }

      // Now all submissions are "bulk" since we're working with groups
      if (selectedPlantIds.length > 0) {
        // Determine which plants to apply care to
        const targetPlantIds = applyToAllGroupPlants
          ? [...selectedPlantIds, ...otherSameVarietyPlantIds]
          : selectedPlantIds;

        // Handle group submission with section tracking
        const sectionId = `section_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        let successCount = 0;
        let errorCount = 0;

        for (const plantId of targetPlantIds) {
          try {
            // Create section-aware details for bulk mode
            const bulkDetails: CareActivityDetails = {
              ...(details as CareActivityDetails),
              sectionBased: true,
              sectionId: sectionId,
              plantsInSection: selectedPlantIds.length,
            };

            // For watering, store the total section amount
            if (data.type === "water" && data.waterValue) {
              bulkDetails.totalSectionAmount = {
                value: data.waterValue,
                unit: data.waterUnit!,
              };
            }

            await logActivity({
              plantId,
              type: data.type,
              date: createDateForCareLogging(data.date),
              details: bulkDetails,
            });

            // If this is a fertilizer activity that requires water, also log a watering activity
            if (
              data.type === "fertilize" &&
              selectedFertilizer?.method &&
              requiresWater(selectedFertilizer.method)
            ) {
              try {
                // Calculate appropriate water amount based on application method
                const providedAmount =
                  data.fertilizerApplicationAmount &&
                  data.fertilizerApplicationUnit === "ml"
                    ? data.fertilizerApplicationAmount
                    : undefined;

                const { amount: waterAmount, unit: waterUnit } =
                  getWaterAmountForMethod(
                    selectedFertilizer.method,
                    providedAmount
                  );

                const waterDetails: CareActivityDetails = {
                  type: "water",
                  amount: {
                    value: waterAmount,
                    unit: waterUnit as any,
                  },
                  sectionBased: bulkDetails.sectionBased,
                  sectionId: bulkDetails.sectionId,
                  plantsInSection: bulkDetails.plantsInSection,
                  notes: `Watered in fertilizer (${getMethodDisplay(
                    selectedFertilizer.method
                  )})`,
                };

                await logActivity({
                  plantId,
                  type: "water",
                  date: createDateForCareLogging(data.date),
                  details: waterDetails,
                });
              } catch (waterError) {
                console.error(
                  `Failed to log water activity for fertilizer on plant ${plantId}:`,
                  waterError
                );
                // Don't fail the main fertilizer activity if water logging fails
              }
            }

            successCount++;
          } catch (error) {
            console.error(
              `Failed to log activity for plant ${plantId}:`,
              error
            );
            errorCount++;
          }
        }

        if (errorCount === 0) {
          let message =
            applyToAllGroupPlants && otherSameVarietyPlantIds.length > 0
              ? `✅ Care activity logged for ${successCount} ${selectedGroup?.varietyName} plants!`
              : `✅ Care activity logged for ${successCount} plants!`;

          // Add water logging notification for fertilizer activities
          if (data.type === "fertilize" && selectedFertilizer?.method) {
            message += ` Watering activities also logged automatically.`;
          }

          toast.success(message, {
            duration: 4000,
            style: {
              background: "#10B981",
              color: "white",
            },
          });

          // Reset form on successful submission
          reset();

          // Call success callback if provided
          onSuccess?.();
        } else if (successCount > 0) {
          toast.success(
            `⚠️ Care activity logged for ${successCount} plants (${errorCount} failed)`,
            {
              duration: 5000,
              style: {
                background: "#F59E0B",
                color: "white",
              },
            }
          );
        } else {
          throw new Error("Failed to log activity for all plants");
        }

        // Show section apply option if available and not showing supplemental watering
        if (
          sectionApplyOption &&
          sectionApplyOption.plantCount > 0 &&
          !showSupplementalWatering
        ) {
          setLastSubmittedData(data);
          setShowSectionApply(true);
        } else if (!showSupplementalWatering) {
          reset();
          onSuccess?.();
        }
      } else {
        // No group selected - this shouldn't happen with proper validation
        throw new Error("No plant section selected");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      console.error("Failed to log care activity:", error);
      setSubmitError(`Failed to log care activity: ${errorMessage}`);
      toast.error(`❌ Failed to log activity: ${errorMessage}`, {
        duration: 6000,
        style: {
          background: "#EF4444",
          color: "white",
        },
      });
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
      case "pruning":
        return <span className="text-sm">✂️</span>;
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
      case "pruning":
        return "Pruning";
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
                min="1"
                step="1"
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
                  Moisture After (1-10) - Optional
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  placeholder="1-10"
                  {...register("moistureAfter", { valueAsNumber: true })}
                  className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty if you want to track moisture separately
                </p>
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
          {/* Toggle between structured and simple input */}
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="structured-fertilizer"
              checked={useStructuredFertilizer}
              onChange={(e) => setUseStructuredFertilizer(e.target.checked)}
              className="rounded border-border"
            />
            <label
              htmlFor="structured-fertilizer"
              className="text-sm text-foreground"
            >
              Use structured inputs (precise measurements)
            </label>
          </div>

          {useStructuredFertilizer && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="text-sm text-green-800 dark:text-green-200">
                <div className="font-medium mb-1">Quick Presets:</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      reset({
                        ...watch(),
                        fertilizerDilutionValue: 1,
                        fertilizerDilutionUnit: "tbsp",
                        fertilizerDilutionPerUnit: "gal",
                      });
                    }}
                    className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-800"
                  >
                    1 tbsp/gal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      reset({
                        ...watch(),
                        fertilizerDilutionValue: 2,
                        fertilizerDilutionUnit: "tbsp",
                        fertilizerDilutionPerUnit: "gal",
                      });
                    }}
                    className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-800"
                  >
                    2 tbsp/gal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      reset({
                        ...watch(),
                        fertilizerDilutionValue: 1,
                        fertilizerDilutionUnit: "tsp",
                        fertilizerDilutionPerUnit: "quart",
                      });
                    }}
                    className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-800"
                  >
                    1 tsp/quart
                  </button>
                </div>
              </div>
            </div>
          )}

          {useStructuredFertilizer ? (
            <>
              {/* Structured Dilution Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Dilution Ratio
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="1"
                    {...register("fertilizerDilutionValue", {
                      valueAsNumber: true,
                    })}
                    className="p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                  />
                  <select
                    {...register("fertilizerDilutionUnit")}
                    className="p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                  >
                    <option value="">Unit</option>
                    <option value="tsp">tsp</option>
                    <option value="tbsp">tbsp</option>
                    <option value="oz">oz</option>
                    <option value="ml">ml</option>
                    <option value="cups">cups</option>
                  </select>
                  <span className="flex items-center justify-center text-foreground">
                    per
                  </span>
                  <select
                    {...register("fertilizerDilutionPerUnit")}
                    className="p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                  >
                    <option value="">Unit</option>
                    <option value="gal">gallon</option>
                    <option value="quart">quart</option>
                    <option value="liter">liter</option>
                    <option value="cup">cup</option>
                  </select>
                </div>
                {fertilizerDilutionValue &&
                  fertilizerDilutionUnit &&
                  fertilizerDilutionPerUnit && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Dilution: {fertilizerDilutionValue}{" "}
                      {fertilizerDilutionUnit} per {fertilizerDilutionPerUnit}
                    </p>
                  )}
              </div>

              {/* Structured Application Amount */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Application Amount *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.5"
                    {...register("fertilizerApplicationAmount", {
                      valueAsNumber: true,
                    })}
                    className="p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                  />
                  <select
                    {...register("fertilizerApplicationUnit")}
                    className="p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                  >
                    <option value="">Unit</option>
                    <option value="oz">oz</option>
                    <option value="ml">ml</option>
                    <option value="cups">cups</option>
                    <option value="gal">gallon</option>
                    <option value="quart">quart</option>
                    <option value="liter">liter</option>
                  </select>
                </div>
                {fertilizerApplicationAmount && fertilizerApplicationUnit && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Amount: {fertilizerApplicationAmount}{" "}
                    {fertilizerApplicationUnit}
                  </p>
                )}
                {errors.fertilizerApplicationAmount && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.fertilizerApplicationAmount.message}
                  </p>
                )}
              </div>

              {/* Structured Input Preview */}
              {(fertilizerDilutionValue &&
                fertilizerDilutionUnit &&
                fertilizerDilutionPerUnit) ||
              (fertilizerApplicationAmount && fertilizerApplicationUnit) ? (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Fertilizer Application Summary
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                    {fertilizerDilutionValue &&
                      fertilizerDilutionUnit &&
                      fertilizerDilutionPerUnit && (
                        <div>
                          <span className="font-medium">Dilution:</span>{" "}
                          {fertilizerDilutionValue} {fertilizerDilutionUnit} per{" "}
                          {fertilizerDilutionPerUnit}
                        </div>
                      )}
                    {fertilizerApplicationAmount &&
                      fertilizerApplicationUnit && (
                        <div>
                          <span className="font-medium">Amount:</span>{" "}
                          {fertilizerApplicationAmount}{" "}
                          {fertilizerApplicationUnit}
                        </div>
                      )}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <>
              {/* Simple Text Inputs */}
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
            </>
          )}
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
                    This application method requires water. A watering activity
                    will be automatically logged along with the fertilizer
                    application.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderMoistureFields = () => {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            🌡️ Moisture Check
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Track soil moisture level without watering
          </p>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Current Moisture Level (1-10) *
            </label>
            <input
              type="number"
              min={1}
              max={10}
              step={1}
              placeholder="1-10 (1=dry, 10=saturated)"
              {...register("moistureBefore", {
                required: "Moisture level is required for moisture tracking",
                valueAsNumber: true,
              })}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
            />
            {errors.moistureBefore && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.moistureBefore.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Scale: 1 = Completely dry, 5 = Optimal, 10 = Waterlogged
            </p>
          </div>
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
      case "moisture":
        return renderMoistureFields();
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
  // Plants are now organized by groups instead of individual plant sorting
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
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label
                        htmlFor="group-select"
                        className="block text-sm font-medium text-foreground"
                      >
                        Plant Section *
                      </label>
                      {selectedGroup && selectedGroup.plants.length > 1 && (
                        <span className="text-xs text-muted-foreground">
                          {selectedGroup.plants.length} plants in this section
                        </span>
                      )}
                    </div>
                    <select
                      id="group-select"
                      {...register("groupId")}
                      className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                    >
                      <option value="">Choose a plant section...</option>
                      {plantGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.varietyName} ({group.plants.length} plant
                          {group.plants.length > 1 ? "s" : ""})
                          {group.container && ` - ${group.container}`}
                        </option>
                      ))}
                    </select>
                    {errors.groupId && (
                      <p className="mt-1 text-sm text-red-600" role="alert">
                        {errors.groupId.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Planted Date Information */}
                {selectedGroup && selectedGroup.plants.length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-3 border">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        Plant Information
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Planted:</span>{" "}
                        {(() => {
                          const plant = selectedGroup.plants[0];
                          const plantingDate = plant.plantedDate;

                          if (plantingDate) {
                            try {
                              return format(
                                new Date(plantingDate),
                                "MMM d, yyyy"
                              );
                            } catch (e) {
                              console.error(
                                "Date format error:",
                                e,
                                plantingDate
                              );
                              return `Invalid date: ${plantingDate}`;
                            }
                          }
                          return "Date not available";
                        })()}
                      </div>
                      <div>
                        <span className="font-medium">Days since planted:</span>{" "}
                        {(() => {
                          const plant = selectedGroup.plants[0];
                          const plantingDate = plant.plantedDate;

                          if (plantingDate) {
                            try {
                              return Math.floor(
                                (new Date().getTime() -
                                  new Date(plantingDate).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              );
                            } catch (e) {
                              return "Invalid date";
                            }
                          }
                          return "N/A";
                        })()}{" "}
                        days
                      </div>
                    </div>
                  </div>
                )}

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
                    <option value="moisture">🌡️ Moisture Check</option>
                    <option value="photo">📸 Photo Log</option>
                    <option value="note">📝 General Note</option>
                    <option value="pruning">✂️ Pruning</option>
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
                      reset({
                        ...watch(),
                        date: format(subDays(new Date(), 1), "yyyy-MM-dd")
                      })
                    }
                  >
                    Yesterday
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      reset({
                        ...watch(),
                        date: format(subDays(new Date(), 7), "yyyy-MM-dd")
                      })
                    }
                  >
                    Last Week
                  </Button>
                </div>

                {/* Apply to all grouped plants checkbox */}
                {selectedGroup && otherSameVarietyPlantIds.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="apply-to-all-group"
                        checked={applyToAllGroupPlants}
                        onChange={(e) =>
                          setApplyToAllGroupPlants(e.target.checked)
                        }
                        className="mt-1 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor="apply-to-all-group"
                          className="block text-sm font-medium text-blue-900 dark:text-blue-100 cursor-pointer"
                        >
                          Apply to all {selectedGroup.varietyName} plants
                        </label>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          This will log the same care activity for all{" "}
                          {totalSameVarietyPlants} {selectedGroup.varietyName}{" "}
                          plants across all groups
                        </p>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          • Current group: {selectedPlantIds.length} plant
                          {selectedPlantIds.length > 1 ? "s" : ""}
                          {otherSameVarietyGroups.length > 0 && (
                            <span>
                              <br />• Other groups:{" "}
                              {otherSameVarietyPlantIds.length} plant
                              {otherSameVarietyPlantIds.length > 1
                                ? "s"
                                : ""}{" "}
                              in {otherSameVarietyGroups.length} additional
                              group
                              {otherSameVarietyGroups.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
              disabled={isLoading || isSubmitting}
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

        {/* Supplemental Watering Card - shown after partial watering */}
        {showSupplementalWatering &&
          partialWateringAnalysis &&
          lastSubmittedData &&
          selectedGroup?.plants[0] && (
            <div className="mt-4">
              <SupplementalWateringCard
                plant={selectedGroup.plants[0]}
                analysis={partialWateringAnalysis}
                onSupplementAdded={handleSupplementalWatering}
                onSkip={() => {
                  setShowSupplementalWatering(false);
                  setPartialWateringAnalysis(null);
                  // Show section apply if available, otherwise finish
                  if (sectionApplyOption && sectionApplyOption.plantCount > 0) {
                    setShowSectionApply(true);
                  } else {
                    reset();
                    onSuccess?.();
                  }
                }}
                disabled={isLoading}
              />
            </div>
          )}

        {/* Section Apply Card - shown after successful submission */}
        {showSectionApply &&
          sectionApplyOption &&
          lastSubmittedData &&
          selectedGroup?.plants[0] && (
            <div className="mt-4">
              <SectionApplyCard
                targetPlant={selectedGroup.plants[0]}
                allPlants={plants}
                sectionOption={sectionApplyOption}
                activityType={lastSubmittedData.type}
                activityLabel={getActivityLabel(lastSubmittedData.type)}
                onApplyToSection={handleBulkCareSubmission}
                disabled={isLoading}
              />
            </div>
          )}
      </CardContent>
    </Card>
  );
}
