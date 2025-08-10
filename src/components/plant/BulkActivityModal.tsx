// src/components/plant/BulkActivityModal.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useFirebaseCareActivities } from "@/hooks/useFirebaseCareActivities";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { toast } from "react-hot-toast";
import { seedVarieties } from "@/data/seedVarieties";
import { CareActivityDetails } from "@/types";
import { CareActivityType, ApplicationMethod, VolumeUnit } from "@/types";
import { PartialWateringService } from "@/services/partialWateringService";
import { requiresWater, getWaterAmountForMethod, getMethodDisplay } from "@/utils/fertilizationUtils";

interface BulkActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantIds: string[];
  activityType: string;
  plantCount: number;
  varietyName: string;
  containerMates?: Array<{
    groupId: string;
    plantIds: string[];
    varietyName: string;
    location: string;
    plantCount: number;
  }>;
  onActivityLogged?: () => void;
}

interface FertilizerOption {
  product: string;
  defaultDilution: string;
  taskName: string;
}

// Helper function to get activity display info
const getActivityInfo = (activityType: string) => {
  const activityMap: Record<string, { icon: string; label: string; verb: string }> = {
    water: { icon: "💧", label: "Water", verb: "Watering" },
    fertilize: { icon: "🌱", label: "Fertilize", verb: "Fertilizing" },
    observe: { icon: "👁️", label: "Inspect", verb: "Inspection" },
    photo: { icon: "📸", label: "Photo", verb: "Photo Documentation" },
    pruning: { icon: "✂️", label: "Prune", verb: "Pruning" },
    harvest: { icon: "🌾", label: "Harvest", verb: "Harvesting" },
    transplant: { icon: "🪴", label: "Transplant", verb: "Transplanting" },
    note: { icon: "📝", label: "Note", verb: "Note Taking" },
    lighting: { icon: "💡", label: "Lighting", verb: "Lighting Adjustment" },
    thin: { icon: "🌱", label: "Thin", verb: "Thinning" },
  };
  
  return activityMap[activityType] || { icon: "📝", label: "Activity", verb: "Activity" };
};

const BulkActivityModal = ({
  isOpen,
  onClose,
  plantIds,
  activityType,
  plantCount,
  varietyName,
  containerMates = [],
  onActivityLogged,
}: BulkActivityModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState("20");
  const [waterUnit, setWaterUnit] = useState<VolumeUnit>("oz");
  const [notes, setNotes] = useState("");

  // Fertilizing-specific fields
  const [fertilizeProduct, setFertilizeProduct] = useState("fish-emulsion");
  const [dilution, setDilution] = useState("1:10");
  const [applicationMethod, setApplicationMethod] =
    useState<ApplicationMethod>("soil-drench");

  // Harvest-specific fields
  const [harvestAmount, setHarvestAmount] = useState("");
  const [harvestQuality, setHarvestQuality] = useState<"excellent" | "good" | "fair" | "poor">("good");

  // Transplant-specific fields  
  const [fromContainer, setFromContainer] = useState("");
  const [toContainer, setToContainer] = useState("");
  const [transplantReason, setTransplantReason] = useState("");

  // Thinning-specific fields
  const [finalCount, setFinalCount] = useState("");

  // Pruning-specific fields
  const [partsRemoved, setPartsRemoved] = useState<"leaves" | "stems" | "flowers" | "runners" | "multiple">("leaves");
  const [amountRemoved, setAmountRemoved] = useState("");
  const [pruningPurpose, setPruningPurpose] = useState<"maintenance" | "disease-control" | "shape" | "harvest" | "other">("maintenance");

  // Dynamic fertilizer options
  const [availableFertilizers, setAvailableFertilizers] = useState<
    FertilizerOption[]
  >([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Container-aware logging state
  const [selectedContainerMates, setSelectedContainerMates] = useState<string[]>([]);

  const { logActivity } = useFirebaseCareActivities();
  const { plants, deletePlant } = useFirebasePlants();

  const isIndividual = plantCount === 1;
  const activityInfo = getActivityInfo(activityType);
  
  const modalTitle = isIndividual
    ? `${activityInfo.icon} ${activityInfo.label} Plant`
    : `${activityInfo.icon} ${activityInfo.label} All Plants`;

  const buttonText = isIndividual
    ? `Log ${activityInfo.verb}`
    : `Log Activity for All ${plantCount} Plants`;

  // Load fertilizer options when modal opens for fertilizing
  useEffect(() => {
    if (isOpen && activityType === "fertilize" && plantIds.length > 0) {
      loadFertilizerOptions();
    }
  }, [isOpen, activityType, plantIds]);

  const loadFertilizerOptions = async () => {
    try {
      setIsLoadingOptions(true);

      const plant = plants?.find((p) => p.id === plantIds[0]);
      if (!plant) {
        console.error("Plant not found for fertilizer options");
        return;
      }

      console.log("🌱 Plant variety name:", plant.varietyName);

      // ✅ SIMPLE: Find variety directly from seedVarieties by name
      const variety = seedVarieties.find((v) => v.name === plant.varietyName);

      if (!variety?.protocols?.fertilization) {
        console.log("No fertilization protocols found for:", plant.varietyName);
        setAvailableFertilizers([]);
        return;
      }

      console.log("✅ Found variety protocols for:", variety.name);

      // Calculate current growth stage using the fresh data
      const daysSincePlanted = Math.floor(
        (new Date().getTime() - plant.plantedDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      console.log("📅 Days since planted:", daysSincePlanted);
      console.log("📅 Growth timeline:", variety.growthTimeline);

      // Simple stage calculation based on timeline
      let currentStage: string = "germination";
      let cumulativeDays = 0;

      for (const [stage, duration] of Object.entries(variety.growthTimeline)) {
        if (daysSincePlanted < cumulativeDays + duration) {
          currentStage = stage;
          break;
        }
        cumulativeDays += duration;
      }

      console.log("🎯 Calculated stage:", currentStage);

      // Get fertilization options for current stage
      const stageProtocol = variety.protocols.fertilization[currentStage];
      if (!stageProtocol?.schedule || stageProtocol.schedule.length === 0) {
        console.log(`No fertilization schedule for ${currentStage} stage`);
        setAvailableFertilizers([]);
        return;
      }

      // Convert to fertilizer options
      const options = stageProtocol.schedule.map((item) => ({
        product: item.details.product || "Unknown Product",
        defaultDilution: item.details.dilution || "As directed",
        taskName: item.taskName,
      }));

      console.log("✅ Available fertilizer options:", options);
      setAvailableFertilizers(options);

      // Set defaults
      if (options.length > 0) {
        setFertilizeProduct(options[0].product);
        setDilution(options[0].defaultDilution);
      }
    } catch (error) {
      console.error("Error loading fertilizer options:", error);
      setAvailableFertilizers([]);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const handleProductChange = (selectedProduct: string) => {
    setFertilizeProduct(selectedProduct);

    // Find the corresponding option and set its default dilution
    const selectedOption = availableFertilizers.find(
      (opt) => opt.product === selectedProduct
    );
    if (selectedOption) {
      setDilution(selectedOption.defaultDilution);
    } else {
      // Handle fallback options
      if (selectedProduct === "Worm Casting Tea") {
        setDilution("1:10");
      } else if (selectedProduct.includes("Fish Emulsion")) {
        setDilution("0.5-1 Tbsp/gal");
      } else if (selectedProduct.includes("Kelp")) {
        setDilution("1 Tbsp/gal");
      } else {
        setDilution("1:10");
      }
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Collect all plant IDs to log activities for
      const allPlantIds = [...plantIds];
      
      // Add selected container mates
      selectedContainerMates.forEach(groupId => {
        const containerMate = containerMates.find(mate => mate.groupId === groupId);
        if (containerMate) {
          allPlantIds.push(...containerMate.plantIds);
        }
      });

      const promises = allPlantIds.map(async (plantId) => {
        // Create a proper Date object for the selected date
        const now = new Date();
        const todayString = now.toISOString().split("T")[0];
        
        // If the selected date is today, use current date/time to avoid timezone issues
        let activityDate: Date;
        if (selectedDate === todayString) {
          activityDate = now;
        } else {
          // For other dates, create a local date and set current time
          activityDate = new Date(selectedDate + "T00:00:00");
          activityDate.setHours(
            now.getHours(),
            now.getMinutes(),
            now.getSeconds()
          );
        }

        // Build the details object with required type field
        const details: CareActivityDetails = {
          type: activityType as CareActivityType,
          notes: notes || "",
        };

        if (activityType === "water") {
          details.waterAmount = parseFloat(amount);
          details.waterUnit = waterUnit;
          
          // Analyze if this is partial watering for better scheduling
          const plant = plants?.find((p) => p.id === plantId);
          if (plant) {
            try {
              const analysis = await PartialWateringService.analyzeWateringAmount(
                plant,
                parseFloat(amount),
                waterUnit
              );
              
              // Enhance details with partial watering info
              details.recommendedAmount = analysis.recommendedAmount;
              details.isPartialWatering = analysis.isPartial;
              details.wateringCompleteness = analysis.completeness;
            } catch (error) {
              console.error("Failed to analyze watering amount:", error);
            }
          }
        } else if (activityType === "fertilize") {
          details.product = fertilizeProduct;
          details.dilution = dilution === "custom" ? amount : dilution;
          details.applicationMethod = applicationMethod;
        } else if (activityType === "harvest") {
          if (harvestAmount) details.amount = harvestAmount;
          details.quality = harvestQuality;
        } else if (activityType === "transplant") {
          if (fromContainer) details.fromContainer = fromContainer;
          if (toContainer) details.toContainer = toContainer;
          if (transplantReason) details.reason = transplantReason;
        } else if (activityType === "thin") {
          details.originalCount = plantCount; // Use the known plant count
          if (finalCount) {
            const finalCountNum = parseInt(finalCount);
            // Validate that final count is reasonable
            if (finalCountNum > 0 && finalCountNum < plantCount) {
              details.finalCount = finalCountNum;
            } else {
              details.finalCount = Math.max(1, Math.floor(plantCount / 2)); // Default to half
            }
          }
        } else if (activityType === "pruning") {
          details.partsRemoved = partsRemoved;
          if (amountRemoved) details.amountRemoved = amountRemoved;
          details.purpose = pruningPurpose;
        }

        // Create the full activity record structure
        const activityRecord = {
          plantId,
          type: activityType as CareActivityType,
          date: activityDate, // Top-level date field (not timestamp)
          details, // Details object
        };

        return logActivity(activityRecord);
      });

      await Promise.all(promises);

      // Handle automatic water logging for fertilizer activities
      if (activityType === "fertilize" && applicationMethod) {
        if (requiresWater(applicationMethod)) {
          // Calculate water amount based on fertilizer method and amount
          const providedAmount = amount && waterUnit === "ml" ? parseFloat(amount) : undefined;
          const { amount: waterAmount, unit: waterUnitType } = getWaterAmountForMethod(
            applicationMethod, 
            providedAmount
          );

          // Create water logging promises for all plants
          const waterPromises = allPlantIds.map(plantId => {
            // Create a proper Date object for the selected date (same as main activity)
            const now = new Date();
            const todayString = now.toISOString().split("T")[0];
            
            // If the selected date is today, use current date/time to avoid timezone issues
            let waterActivityDate: Date;
            if (selectedDate === todayString) {
              waterActivityDate = now;
            } else {
              // For other dates, create a local date and set current time
              waterActivityDate = new Date(selectedDate + "T00:00:00");
              waterActivityDate.setHours(
                now.getHours(),
                now.getMinutes(),
                now.getSeconds()
              );
            }

            const waterDetails: CareActivityDetails = {
              type: "water",
              waterAmount: waterAmount,
              waterUnit: waterUnitType as VolumeUnit,
              notes: `Watered in fertilizer (${getMethodDisplay(applicationMethod)})`,
            };

            const waterActivityRecord = {
              plantId,
              type: "water" as CareActivityType,
              date: waterActivityDate,
              details: waterDetails,
            };

            return logActivity(waterActivityRecord);
          });

          try {
            await Promise.all(waterPromises);
          } catch (waterError) {
            console.error("Failed to log automatic water activities:", waterError);
            // Don't fail the main operation if water logging fails
          }
        }
      }

      // Handle plant deactivation for thinning
      if (activityType === "thin" && finalCount) {
        const finalCountNum = parseInt(finalCount);
        if (finalCountNum > 0 && finalCountNum < plantCount) {
          const plantsToRemove = plantCount - finalCountNum;
          
          // Randomly select plants to deactivate
          const shuffledIds = [...plantIds].sort(() => Math.random() - 0.5);
          const idsToDeactivate = shuffledIds.slice(0, plantsToRemove);
          
          // Deactivate selected plants
          const deactivationPromises = idsToDeactivate.map(plantId => 
            deletePlant(plantId)
          );
          
          await Promise.all(deactivationPromises);
          
          toast.success(
            `Thinning completed! ${finalCountNum} plants remaining from ${plantCount} original plants 🌱`
          );
        } else {
          toast.success(
            `Thinning activity logged for ${plantCount} ${varietyName} plants! 🌱`
          );
        }
      } else {
        const totalPlantsAffected = allPlantIds.length;
        const containerMateCount = selectedContainerMates.length;
        
        // Create base success message
        let baseMessage = "";
        if (containerMateCount > 0) {
          baseMessage = `Activity logged for ${varietyName} and ${containerMateCount} other section${containerMateCount > 1 ? 's' : ''} in container! (${totalPlantsAffected} plants total) 🌱`;
        } else {
          baseMessage = `Activity logged for all ${plantCount} ${varietyName} plants! 🌱`;
        }
        
        // Add water logging notification for fertilizer activities
        if (activityType === "fertilize" && applicationMethod) {
          baseMessage += " Watering activities also logged automatically.";
        }
        
        toast.success(baseMessage);
      }
      
      // Call refresh callback to update dashboard
      if (onActivityLogged) {
        onActivityLogged();
      }
      
      onClose();
    } catch (error) {
      console.error("Failed to log bulk activity:", error);
      toast.error("Failed to log activity. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{modalTitle}</span>
            <Button variant="outline" size="sm" onClick={onClose}>
              ✕
            </Button>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isIndividual
              ? `Logging for ${varietyName} plant`
              : `Logging for ${plantCount} ${varietyName} plants`}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Water-specific fields */}
          {activityType === "water" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="bulk-amount" className="text-sm font-medium block mb-2">
                    Water Amount
                  </label>
                  <Input
                    id="bulk-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="20"
                  />
                </div>
                <div>
                  <label htmlFor="water-unit" className="text-sm font-medium block mb-2">
                    Unit
                  </label>
                  <select
                    id="water-unit"
                    value={waterUnit}
                    onChange={(e) => setWaterUnit(e.target.value as VolumeUnit)}
                    className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                  >
                    <option value="oz">oz</option>
                    <option value="ml">ml</option>
                    <option value="cups">cups</option>
                    <option value="L">L</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Fertilize-specific fields */}
          {activityType === "fertilize" && (
            <>
              {isLoadingOptions ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Loading fertilizer options...
                  </p>
                </div>
              ) : availableFertilizers.length > 0 ? (
                <>
                  <div>
                    <label
                      htmlFor="fertilize-product"
                      className="text-sm font-medium block mb-2"
                    >
                      Fertilizer Product
                    </label>
                    <select
                      id="fertilize-product"
                      value={fertilizeProduct}
                      onChange={(e) => handleProductChange(e.target.value)}
                      className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                    >
                      {availableFertilizers.map((option, index) => (
                        <option key={index} value={option.product}>
                          {option.product}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Protocol-specific options for {varietyName}
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="dilution"
                      className="text-sm font-medium block mb-2"
                    >
                      Dilution/Application Rate
                    </label>
                    <Input
                      id="dilution"
                      value={dilution}
                      onChange={(e) => setDilution(e.target.value)}
                      placeholder="Protocol default loaded..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Default from variety protocol. Adjust if needed.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label
                      htmlFor="fertilize-product"
                      className="text-sm font-medium block mb-2"
                    >
                      Fertilizer Product
                    </label>
                    <select
                      id="fertilize-product"
                      value={fertilizeProduct}
                      onChange={(e) => handleProductChange(e.target.value)}
                      className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                    >
                      <option value="fish-emulsion">Fish Emulsion</option>
                      <option value="kelp-meal">Kelp Meal</option>
                      <option value="bone-meal">Bone Meal</option>
                      <option value="compost">Compost</option>
                      <option value="neptunes-harvest">
                        Neptune's Harvest Fish + Seaweed
                      </option>
                      <option value="balanced-liquid">
                        Balanced Liquid Fertilizer
                      </option>
                      <option value="other">Other</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      No protocol-specific options found - using general options
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="dilution"
                      className="text-sm font-medium block mb-2"
                    >
                      Dilution/Application Rate
                    </label>
                    <select
                      id="dilution"
                      value={dilution}
                      onChange={(e) => setDilution(e.target.value)}
                      className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                    >
                      <option value="1:10">1:10 (Light feeding)</option>
                      <option value="1:5">1:5 (Standard feeding)</option>
                      <option value="1:3">1:3 (Heavy feeding)</option>
                      <option value="0.5-1 Tbsp/gal">0.5-1 Tbsp/gal</option>
                      <option value="2-tbsp-per-gal">2 tbsp per gallon</option>
                      <option value="1-tbsp-per-gal">1 tbsp per gallon</option>
                      <option value="as-directed">
                        As directed on package
                      </option>
                      <option value="custom">Custom amount</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="application-method"
                  className="text-sm font-medium block mb-2"
                >
                  Application Method
                </label>
                <select
                  id="application-method"
                  value={applicationMethod}
                  onChange={(e) =>
                    setApplicationMethod(e.target.value as ApplicationMethod)
                  }
                  className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="soil-drench">
                    Soil Drench (watered into soil)
                  </option>
                  <option value="foliar-spray">
                    Foliar Spray (sprayed on leaves)
                  </option>
                  <option value="top-dress">
                    Top Dress (applied to soil surface)
                  </option>
                  <option value="mix-in-soil">Mixed into soil</option>
                </select>
              </div>

              {dilution === "custom" && (
                <div>
                  <label
                    htmlFor="custom-amount"
                    className="text-sm font-medium block mb-2"
                  >
                    Custom Amount/Dilution
                  </label>
                  <Input
                    id="custom-amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g., 3 tbsp, 1:8 ratio, etc."
                  />
                </div>
              )}
            </>
          )}

          {/* Observation-specific fields */}
          {activityType === "observe" && (
            <div>
              <label
                htmlFor="observation-notes"
                className="text-sm font-medium block mb-2"
              >
                Observations
              </label>
              <Input
                id="observation-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Plant health, growth, issues noticed..."
              />
            </div>
          )}

          {/* Harvest-specific fields */}
          {activityType === "harvest" && (
            <>
              <div>
                <label htmlFor="harvest-amount" className="text-sm font-medium block mb-2">
                  Amount Harvested
                </label>
                <Input
                  id="harvest-amount"
                  value={harvestAmount}
                  onChange={(e) => setHarvestAmount(e.target.value)}
                  placeholder="e.g., 2 lbs, 12 tomatoes, handful of herbs"
                />
              </div>
              <div>
                <label htmlFor="harvest-quality" className="text-sm font-medium block mb-2">
                  Quality
                </label>
                <select
                  id="harvest-quality"
                  value={harvestQuality}
                  onChange={(e) => setHarvestQuality(e.target.value as "excellent" | "good" | "fair" | "poor")}
                  className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
            </>
          )}

          {/* Transplant-specific fields */}
          {activityType === "transplant" && (
            <>
              <div>
                <label htmlFor="from-container" className="text-sm font-medium block mb-2">
                  From Container
                </label>
                <Input
                  id="from-container"
                  value={fromContainer}
                  onChange={(e) => setFromContainer(e.target.value)}
                  placeholder="e.g., 4-inch pot, seed tray"
                />
              </div>
              <div>
                <label htmlFor="to-container" className="text-sm font-medium block mb-2">
                  To Container
                </label>
                <Input
                  id="to-container"
                  value={toContainer}
                  onChange={(e) => setToContainer(e.target.value)}
                  placeholder="e.g., 8-inch pot, garden bed"
                />
              </div>
              <div>
                <label htmlFor="transplant-reason" className="text-sm font-medium block mb-2">
                  Reason
                </label>
                <Input
                  id="transplant-reason"
                  value={transplantReason}
                  onChange={(e) => setTransplantReason(e.target.value)}
                  placeholder="e.g., outgrown pot, better location"
                />
              </div>
            </>
          )}

          {/* Thinning-specific fields */}
          {activityType === "thin" && (
            <>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Current Plant Count:</span>
                  <span className="text-lg font-bold text-blue-600">{plantCount}</span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  This is the number of plants you're thinning from
                </p>
              </div>
              <div>
                <label htmlFor="final-count" className="text-sm font-medium block mb-2">
                  Final Plant Count (after thinning)
                </label>
                <Input
                  id="final-count"
                  type="number"
                  value={finalCount}
                  onChange={(e) => setFinalCount(e.target.value)}
                  placeholder={`e.g., ${Math.floor(plantCount / 2)} (remove overcrowded plants)`}
                  max={plantCount}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter how many plants you want to keep (must be less than {plantCount})
                </p>
              </div>
            </>
          )}

          {/* Pruning-specific fields */}
          {activityType === "pruning" && (
            <>
              <div>
                <label htmlFor="parts-removed" className="text-sm font-medium block mb-2">
                  Parts Removed
                </label>
                <select
                  id="parts-removed"
                  value={partsRemoved}
                  onChange={(e) => setPartsRemoved(e.target.value as "leaves" | "stems" | "flowers" | "runners" | "multiple")}
                  className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="leaves">Leaves</option>
                  <option value="stems">Stems</option>
                  <option value="flowers">Flowers</option>
                  <option value="runners">Runners</option>
                  <option value="multiple">Multiple parts</option>
                </select>
              </div>
              <div>
                <label htmlFor="amount-removed" className="text-sm font-medium block mb-2">
                  Amount Removed
                </label>
                <Input
                  id="amount-removed"
                  value={amountRemoved}
                  onChange={(e) => setAmountRemoved(e.target.value)}
                  placeholder="e.g., 5 leaves, bottom third, light trimming"
                />
              </div>
              <div>
                <label htmlFor="pruning-purpose" className="text-sm font-medium block mb-2">
                  Purpose
                </label>
                <select
                  id="pruning-purpose"
                  value={pruningPurpose}
                  onChange={(e) => setPruningPurpose(e.target.value as "maintenance" | "disease-control" | "shape" | "harvest" | "other")}
                  className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="maintenance">Maintenance</option>
                  <option value="disease-control">Disease Control</option>
                  <option value="shape">Shape/Training</option>
                  <option value="harvest">Harvest</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="activity-date"
              className="text-sm font-medium block mb-2"
            >
              Date *
              <span className="text-xs text-muted-foreground ml-1">
                (can select past dates for catch-up logging)
              </span>
            </label>
            <input
              id="activity-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Container-aware logging section */}
          {containerMates.length > 0 && (
            <div className="border-t border-border pt-4">
              <div className="mb-3">
                <h4 className="text-sm font-medium text-foreground mb-1">
                  💡 Apply to other sections in same container?
                </h4>
                <p className="text-xs text-muted-foreground">
                  You can apply the same {activityInfo.label.toLowerCase()} to other plant sections in this container
                </p>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {containerMates.map((mate) => (
                  <label
                    key={mate.groupId}
                    className="flex items-center gap-3 p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedContainerMates.includes(mate.groupId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedContainerMates([...selectedContainerMates, mate.groupId]);
                        } else {
                          setSelectedContainerMates(selectedContainerMates.filter(id => id !== mate.groupId));
                        }
                      }}
                      className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-ring focus:ring-2"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {mate.varietyName} ({mate.location})
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {mate.plantCount} plant{mate.plantCount !== 1 ? 's' : ''} • Same {activityType === 'water' ? `${amount}${waterUnit}` : 'activity'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {selectedContainerMates.length > 0 && (
                <div className="mt-2 p-2 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    ✅ Will apply to {selectedContainerMates.length} additional section{selectedContainerMates.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* General notes field for all types */}
          <div>
            <label
              htmlFor="bulk-notes"
              className="text-sm font-medium block mb-2"
            >
              {activityType === "observe"
                ? "Additional Notes"
                : "Notes (optional)"}
            </label>
            <Input
              id="bulk-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                activityType === "fertilize"
                  ? "Any special considerations..."
                  : activityType === "water"
                  ? "Soil moisture, plant condition..."
                  : "Any observations..."
              }
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (activityType === "fertilize" && !fertilizeProduct)
            }
            className="w-full"
          >
            {isSubmitting ? "Logging..." : buttonText}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkActivityModal;
