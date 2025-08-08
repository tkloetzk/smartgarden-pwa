// src/components/plant/PlantRegistrationForm.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { Input } from "../ui/Input";
import { varietyService, VarietyRecord, bedService } from "@/types/database";
import { CustomVarietyForm } from "./CustomVarietyForm";
import { SimplifiedLocationSelector } from "./SimplifiedLocationSelector";
import toast from "react-hot-toast";
import SoilMixtureSelector from "./SoilMixtureSelector";
import ReminderPreferencesSection from "@/components/plant/ReminderPreferencesSection";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { useFirebaseCareActivities } from "@/hooks/useFirebaseCareActivities";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { PlantSection, CareActivityDetails, VolumeUnit } from "@/types";
import { Logger } from "@/utils/logger";


const careHistorySchema = z.object({
  lastWatered: z.string().optional(),
  lastWaterAmount: z.number().optional(),
  lastWaterUnit: z.enum(["ml", "fl-oz", "cups", "liters", "gallons"]).optional(),
  lastFertilized: z.string().optional(),
  lastFertilizerProduct: z.string().optional(),
  lastFertilizerDilution: z.string().optional(),
  lightingHours: z.number().min(0).max(24).optional(),
  lightingIntensity: z.string().optional(),
  lastObservation: z.string().optional(),
  lastObservationDate: z.string().optional(),
});

const plantSchema = z.object({
  varietyId: z.string().min(1, "Please select a variety"),
  name: z.string().optional(),
  plantedDate: z.string().refine((date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    return selectedDate <= today && selectedDate >= oneYearAgo;
  }, "Planting date must be within the past year and not in the future"),
  location: z.boolean(),
  selectedBedId: z.string().min(1, "Please select where you're planting"),
  section: z.string().optional(),
  sectionMode: z.enum(["simple", "structured"]),
  quantity: z
    .number()
    .min(1, "Quantity must be at least 1")
    .max(999, "Quantity cannot exceed 999"),
  setupType: z.enum(["multiple-containers", "same-container"]),
  soilMix: z.string().min(1, "Please select a soil mixture"),
  notes: z.string().optional(),
  enableCareHistory: z.boolean().optional(),
  careHistory: careHistorySchema.optional(),
});

type PlantFormData = z.infer<typeof plantSchema>;

interface PlantRegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormErrors {
  [key: string]: { message?: string } | undefined;
}


export function PlantRegistrationForm({
  onSuccess,
  onCancel,
}: PlantRegistrationFormProps) {
  const { createPlant } = useFirebasePlants();
  const { logActivity } = useFirebaseCareActivities();

  const [varieties, setVarieties] = useState<VarietyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVarieties, setIsLoadingVarieties] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showCustomVarietyForm, setShowCustomVarietyForm] = useState(false);
  const [reminderPreferences, setReminderPreferences] = useState({
    watering: true,
    fertilizing: true,
    observation: true,
    lighting: true,
    pruning: true,
  });
  const [structuredSection, setStructuredSection] = useState<PlantSection | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<PlantFormData>({
    resolver: zodResolver(plantSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      location: false,
      selectedBedId: "",
      quantity: 1,
      setupType: "multiple-containers",
      plantedDate: new Date().toLocaleDateString('en-CA'),
      notes: "",
      sectionMode: "simple",
      enableCareHistory: false,
      careHistory: {},
    },
  });

  const selectedVarietyId = watch("varietyId");
  const quantity = watch("quantity");

  useEffect(() => {
    loadVarieties();
  }, []);


  const loadVarieties = async () => {
    try {
      setIsLoadingVarieties(true);
      const varietyList = await varietyService.getAllVarieties();
      
      // Debug logging to help identify variety loading issues
      console.log(`Loaded ${varietyList.length} varieties`);
      const categoryCount = varietyList.reduce((acc, variety) => {
        acc[variety.category] = (acc[variety.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log("Varieties by category:", categoryCount);
      
      setVarieties(varietyList);
    } catch (error) {
      console.error("Failed to load varieties:", error);
      toast.error("Failed to load plant varieties");
    } finally {
      setIsLoadingVarieties(false);
    }
  };

  const selectedVariety = varieties.find((v) => v.id === selectedVarietyId);
  const plantCategory = selectedVariety?.category;

  const getVarietyDisplayName = (variety: VarietyRecord) => {
    return variety.isCustom ? `${variety.name} (Custom)` : variety.name;
  };

  const getCategoryDisplayName = (category: string) => {
    const categoryNames: Record<string, string> = {
      "leafy-greens": "🥬 Leafy Greens",
      "root-vegetables": "🥕 Root Vegetables", 
      "herbs": "🌿 Herbs",
      "fruiting-plants": "🍅 Fruiting Plants",
      "berries": "🫐 Berries",
      "flowers": "🌸 Flowers"
    };
    return categoryNames[category] || category;
  };

  const groupedVarieties = varieties.reduce((groups, variety) => {
    const category = variety.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(variety);
    return groups;
  }, {} as Record<string, VarietyRecord[]>);

  const onSubmit = async (data: PlantFormData) => {
    try {
      setIsLoading(true);
      setSubmitError(null);

      const variety = varieties.find((v) => v.id === data.varietyId);
      if (!variety) {
        throw new Error("Selected variety not found");
      }

      // Get the selected bed information
      const selectedBed = await bedService.getBed(data.selectedBedId);
      if (!selectedBed) {
        throw new Error("Selected bed/container not found");
      }

      const varietyName = variety.name;
      const locationString = data.location ? "Outdoor" : "Indoor";

      // Build container description from bed data
      const typeEmoji = {
        "raised-bed": "🏗️",
        "container": "🪣", 
        "greenhouse-bench": "🏠",
        "ground-bed": "🌱",
        "other": "📦",
      }[selectedBed.type] || "📦";
      
      let containerDescription = `${typeEmoji} ${selectedBed.name}`;
      
      // Add section info if provided
      if (data.section) {
        containerDescription += ` - ${data.section}`;
      }

      // Use custom name if provided, otherwise use variety name
      const baseName = data.name?.trim() || varietyName;

      const plantPromises = [];
      for (let i = 0; i < data.quantity; i++) {
        let plantName = data.name?.trim() || undefined; // Use undefined if no custom name

        // If no custom name was provided, don't set a name (let display logic handle it)
        // If custom name was provided and quantity > 1, add numbering
        if (data.name?.trim() && data.quantity > 1) {
          const isMultipleContainers = data.setupType === "multiple-containers";
          if (isMultipleContainers) {
            plantName = `${baseName} #${i + 1}`;
          } else {
            plantName = `${baseName} (Plant ${i + 1})`;
          }
        }

        // Use the Firebase createPlant (not PlantRegistrationService)
        plantPromises.push(
          createPlant({
            varietyId: data.varietyId,
            varietyName: varietyName,
            name: plantName,
            plantedDate: new Date(data.plantedDate),
            location: locationString,
            container: containerDescription,
            soilMix: data.soilMix,
            isActive: true,
            notes: data.notes ? [data.notes] : [""],
            reminderPreferences,
            section: data.section || undefined,
            structuredSection: data.sectionMode === "structured" ? structuredSection || undefined : undefined,
            quantity: data.quantity,
            setupType: data.setupType,
          })
        );
      }

      // Wait for all plants to be created
      const plantResults = await Promise.all(plantPromises);

      // Create care history if enabled
      if (data.enableCareHistory && data.careHistory) {
        const carePromises = [];
        
        for (let i = 0; i < plantResults.length; i++) {
          const plantId = plantResults[i];
          const history = data.careHistory;
          
          // Add last watering activity
          if (history.lastWatered) {
            const waterDetails: CareActivityDetails = {
              type: "water",
              waterAmount: history.lastWaterAmount || 0,
              waterUnit: (history.lastWaterUnit as VolumeUnit) || "fl-oz",
              notes: "Backfilled during plant registration",
            };
            
            carePromises.push(
              logActivity({
                plantId,
                type: "water",
                date: new Date(history.lastWatered),
                details: waterDetails,
              })
            );
          }
          
          // Add last fertilization activity
          if (history.lastFertilized) {
            const fertilizerDetails: CareActivityDetails = {
              type: "fertilize",
              product: history.lastFertilizerProduct || "",
              dilution: history.lastFertilizerDilution || "",
              applicationMethod: "soil-drench",
              notes: "Backfilled during plant registration",
            };
            
            carePromises.push(
              logActivity({
                plantId,
                type: "fertilize",
                date: new Date(history.lastFertilized),
                details: fertilizerDetails,
              })
            );
          }
          
          // Add lighting activity if specified
          if (history.lightingHours) {
            const lightingDetails: CareActivityDetails = {
              type: "lighting",
              lightLevel: history.lightingHours,
              notes: `Set to ${history.lightingHours} hours${history.lightingIntensity ? ` at ${history.lightingIntensity} intensity` : ""}. Backfilled during plant registration.`,
            };
            
            carePromises.push(
              logActivity({
                plantId,
                type: "lighting",
                date: new Date(), // Use current date for lighting setup
                details: lightingDetails,
              })
            );
          }
          
          // Add last observation if specified
          if (history.lastObservation && history.lastObservationDate) {
            const observationDetails: CareActivityDetails = {
              type: "observe",
              observations: history.lastObservation,
              healthAssessment: "good", // Default assessment
              notes: "Backfilled during plant registration",
            };
            
            carePromises.push(
              logActivity({
                plantId,
                type: "observe",
                date: new Date(history.lastObservationDate),
                details: observationDetails,
              })
            );
          }
        }
        
        // Create all care activities
        if (carePromises.length > 0) {
          await Promise.all(carePromises);
          toast.success(`Successfully registered ${data.quantity} plant(s) with care history! 🌱`);
        } else {
          toast.success(`Successfully registered ${data.quantity} plant(s)! 🌱`);
        }
      } else {
        toast.success(`Successfully registered ${data.quantity} plant(s)! 🌱`);
      }

      reset();
      onSuccess?.();
    } catch (error) {
      Logger.error("Failed to register plant:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to register plant";
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  const renderFormField = (
    id: keyof PlantFormData,
    label: string,
    type: "text" | "date" | "select" | "textarea" | "number" = "text",
    placeholder?: string,
    required: boolean = false
  ) => {
    const error = (errors as FormErrors)[id];

    return (
      <div>
        <label
          htmlFor={id}
          className="block text-sm font-medium text-foreground mb-2"
        >
          {label} {label && required && "*"}
        </label>

        {type === "select" && id === "varietyId" ? (
          <div className="space-y-2">
            <select
              {...register(id)}
              id={id}
              className={`w-full p-3 border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary shadow-sm ${
                error ? "border-red-500" : "border-input"
              }`}
              disabled={isLoadingVarieties}
            >
              <option value="">
                {isLoadingVarieties
                  ? "Loading varieties..."
                  : `Select a variety (${varieties.length} available)`}
              </option>
              {Object.entries(groupedVarieties)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([category, categoryVarieties]) => (
                  <optgroup key={category} label={getCategoryDisplayName(category)}>
                    {categoryVarieties
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((variety) => (
                        <option key={variety.id} value={variety.id}>
                          {getVarietyDisplayName(variety)}
                        </option>
                      ))}
                  </optgroup>
                ))}
            </select>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCustomVarietyForm(true)}
                className="text-sm"
              >
                + Add Custom Variety
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={loadVarieties}
                className="text-sm text-muted-foreground"
                title="Refresh plant varieties"
              >
                🔄 Refresh
              </Button>
            </div>
          </div>
        ) : type === "textarea" ? (
          <textarea
            {...register(id)}
            id={id}
            placeholder={placeholder}
            rows={3}
            className={`w-full p-3 border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary resize-none shadow-sm ${
              error ? "border-red-500" : "border-input"
            }`}
          />
        ) : type === "number" ? (
          <Input
            {...register(id, { valueAsNumber: true })}
            id={id}
            type="number"
            placeholder={placeholder}
            min={1}
            max={999}
            className={error ? "border-red-500" : ""}
          />
        ) : (
          <Input
            {...register(id)}
            id={id}
            type={type}
            placeholder={placeholder}
            className={error ? "border-red-500" : ""}
          />
        )}

        {error && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {error.message}
          </p>
        )}
      </div>
    );
  };




  if (showCustomVarietyForm) {
    return (
      <CustomVarietyForm
        onSuccess={(varietyId) => {
          setValue("varietyId", varietyId, { shouldValidate: true });
          setShowCustomVarietyForm(false);
          loadVarieties();
        }}
        onCancel={() => setShowCustomVarietyForm(false)}
      />
    );
  }

  if (isLoadingVarieties) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center space-x-3">
            <LoadingSpinner size="sm" />
            <span>Loading plant varieties...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Form Header */}
      <div className="text-center">
        <div className="text-4xl mb-4">🌿</div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Register Your Plant
        </h2>
        <p className="text-muted-foreground">
          Fill in the details below to start tracking your plant's growth
          journey
        </p>
      </div>

      {/* Form Card */}
      <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
        <CardContent className="p-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
            data-testid="plant-registration-form"
          >
            {submitError && (
              <div
                className="p-4 bg-red-50 border border-red-200 rounded-lg"
                role="alert"
              >
                <div className="flex items-center gap-2">
                  <span className="text-red-500">⚠️</span>
                  <p className="text-sm text-red-600 font-medium">
                    {submitError}
                  </p>
                </div>
              </div>
            )}

            {/* Plant Selection Section */}
            <div className="space-y-4 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span className="text-lg">🌱</span>
                Plant Information
              </h3>
              {renderFormField(
                "varietyId",
                "Plant Variety",
                "select",
                "",
                true
              )}
              {renderFormField(
                "name",
                "Plant Name",
                "text",
                "Optional - leave blank to auto-name as 'Variety (Container Size)'",
                false
              )}
              {renderFormField(
                "plantedDate",
                "Planting Date",
                "date",
                "",
                true
              )}
            </div>

            {/* Simplified Location & Container Selection */}
            <SimplifiedLocationSelector
              selectedBedId={watch("selectedBedId")}
              section={watch("section")}
              structuredSection={structuredSection || undefined}
              location={watch("location")}
              onBedSelect={(bedId) => setValue("selectedBedId", bedId, { shouldValidate: true })}
              onSectionChange={(section) => setValue("section", section)}
              onStructuredSectionChange={(section) => setStructuredSection(section)}
              onLocationChange={(isOutdoor) => setValue("location", isOutdoor, { shouldValidate: true })}
            />

            {/* Quantity Selection */}
            <div className="space-y-4 p-4 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 rounded-lg border border-emerald-500/20">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span className="text-lg">🌱</span>
                How many plants?
              </h3>
              <div>
                <label
                  htmlFor="quantity"
                  className="block text-sm font-medium text-foreground mb-3"
                >
                  Quantity *
                </label>
                <div className="flex items-center space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setValue("quantity", Math.max(1, quantity - 1), {
                        shouldValidate: true,
                      })
                    }
                    disabled={quantity <= 1}
                    className="w-10 h-10 p-0"
                    aria-label="Decrease quantity"
                  >
                    -
                  </Button>
                  <div className="flex-1">
                    <Input
                      {...register("quantity", { valueAsNumber: true })}
                      id="quantity"
                      type="number"
                      placeholder="1"
                      min={1}
                      max={999}
                      className={errors.quantity ? "border-red-500" : ""}
                      aria-label="Plant quantity"
                      data-testid="quantity-input"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setValue("quantity", Math.min(999, quantity + 1), {
                        shouldValidate: true,
                      })
                    }
                    disabled={quantity >= 999}
                    className="w-10 h-10 p-0"
                    aria-label="Increase quantity"
                  >
                    +
                  </Button>
                </div>
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.quantity.message}
                  </p>
                )}
                {errors.selectedBedId && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.selectedBedId.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1 bg-background/50 p-2 rounded">
                  Number of plants to register from this planting
                </p>
              </div>
            </div>

            {/* Soil & Care Section */}
            <div className="space-y-4 p-4 bg-gradient-to-br from-amber-500/5 to-amber-500/10 rounded-lg border border-amber-500/20">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span className="text-lg">🌱</span>
                Soil & Care Preferences
              </h3>

              <div>
                <SoilMixtureSelector
                  selectedMixture={watch("soilMix")}
                  onMixtureChange={(mixture) =>
                    setValue("soilMix", mixture, { shouldValidate: true })
                  }
                  plantCategory={plantCategory}
                />
                {errors.soilMix && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.soilMix.message}
                  </p>
                )}
              </div>

              <ReminderPreferencesSection
                preferences={reminderPreferences}
                onChange={setReminderPreferences}
              />
            </div>

            {/* Notes Section */}
            <div className="space-y-4 p-4 bg-gradient-to-br from-slate-500/5 to-slate-500/10 rounded-lg border border-slate-500/20">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span className="text-lg">📝</span>
                Additional Notes
              </h3>
              {renderFormField(
                "notes",
                "Notes",
                "textarea",
                "Add any additional notes about this plant, growing conditions, or special care instructions...",
                false
              )}
            </div>

            {/* Care History Section - Only show if planting date is not today */}
            {(() => {
              const plantedDate = watch("plantedDate");
              const today = new Date().toISOString().split("T")[0];
              const isBackdating = plantedDate && plantedDate !== today;
              
              if (!isBackdating) return null;
              
              return (
            <div className="space-y-4 p-4 bg-gradient-to-br from-purple-500/5 to-purple-500/10 rounded-lg border border-purple-500/20">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <span className="text-lg">🔄</span>
                  Recent Care History
                </h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enable-care-history"
                    {...register("enableCareHistory")}
                    className="w-4 h-4 text-purple-500 border-border focus:ring-purple-500"
                  />
                  <label htmlFor="enable-care-history" className="text-sm font-medium text-foreground cursor-pointer">
                    Add recent care activities
                  </label>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Enable this to add your most recent care activities (watering, fertilizing, etc.) so the system can calculate the correct care schedule.
              </p>

              {watch("enableCareHistory") && (
                <div className="space-y-4 p-4 bg-background/50 rounded-lg border border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Last Watering */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        <span>💧</span>
                        Last Watering
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Date</label>
                          <Input
                            type="date"
                            {...register("careHistory.lastWatered")}
                            className="text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-xs font-medium text-muted-foreground">Amount</label>
                            <Input
                              type="number"
                              step="0.1"
                              {...register("careHistory.lastWaterAmount", { valueAsNumber: true })}
                              placeholder="8"
                              className="text-sm"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-medium text-muted-foreground">Unit</label>
                            <select
                              {...register("careHistory.lastWaterUnit")}
                              className="w-full p-2 text-sm border border-border rounded bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent"
                            >
                              <option value="fl-oz">fl oz</option>
                              <option value="ml">ml</option>
                              <option value="cups">cups</option>
                              <option value="liters">liters</option>
                              <option value="gallons">gallons</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Last Fertilizing */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        <span>🌱</span>
                        Last Fertilizing
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Date</label>
                          <Input
                            type="date"
                            {...register("careHistory.lastFertilized")}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Product</label>
                          <Input
                            {...register("careHistory.lastFertilizerProduct")}
                            placeholder="e.g., General Hydroponics MaxiGro"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Dilution</label>
                          <Input
                            {...register("careHistory.lastFertilizerDilution")}
                            placeholder="e.g., 1/2 tsp per gallon"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Lighting Setup */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        <span>💡</span>
                        Current Lighting
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Hours per day</label>
                          <Input
                            type="number"
                            min="0"
                            max="24"
                            step="0.5"
                            {...register("careHistory.lightingHours", { valueAsNumber: true })}
                            placeholder="14"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Intensity/Type</label>
                          <Input
                            {...register("careHistory.lightingIntensity")}
                            placeholder="e.g., 100% LED, 6500K"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Last Observation */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        <span>👀</span>
                        Last Observation
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Date</label>
                          <Input
                            type="date"
                            {...register("careHistory.lastObservationDate")}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Notes</label>
                          <textarea
                            {...register("careHistory.lastObservation")}
                            placeholder="e.g., Plant looks healthy, good color, new growth visible"
                            rows={3}
                            className="w-full p-2 text-sm border border-border rounded bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      💡 <strong>Tip:</strong> Adding recent care history helps the system calculate when your plant needs attention next, so you get accurate scheduling right away.
                    </p>
                  </div>
                </div>
              )}
            </div>
              );
            })()}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-border">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={!isValid || isSubmitting || isLoading}
                className="flex-1 bg-primary hover:bg-primary/90"
                size="lg"
                aria-label="Register Plant"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>Registering...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>🌱</span>
                    <span>Register Plant{quantity > 1 ? "s" : ""}</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
