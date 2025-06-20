// src/components/plant/PlantRegistrationForm.tsx
import { useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { plantService, varietyService, VarietyRecord } from "@/types/database";
import { CustomVarietyForm } from "./CustomVarietyForm";
import toast from "react-hot-toast";
import SoilMixtureSelector from "./SoilMixtureSelector";
import { Switch } from "@/components/ui/Switch";
import ReminderPreferencesSection from "@/components/plant/ReminderPreferencesSection";
import { cn } from "@/utils/cn";

const plantSchema = z.object({
  varietyId: z.string().min(1, "Please select a variety"),
  name: z.string().optional(),
  plantedDate: z.string().min(1, "Please select a planting date"),
  location: z.boolean(),
  containerType: z.string().min(1, "Please select a container type"),
  containerSize: z.string().min(1, "Please specify container size"),
  customBagShape: z.string().optional(),
  customDiameter: z.string().optional(),
  customBagHeight: z.string().optional(),
  customBagWidth: z.string().optional(),
  customBagLength: z.string().optional(),
  customWidth: z.string().optional(),
  customLength: z.string().optional(),
  customDepth: z.string().optional(),
  soilMix: z.string().min(1, "Please select a soil mixture"),
  notes: z.string().optional(),
});

type PlantFormData = z.infer<typeof plantSchema>;

interface PlantRegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormErrors {
  [key: string]: { message?: string } | undefined;
}

// Container options configuration
const containerOptions = {
  "grow-bag": {
    label: "Grow Bag",
    icon: "🎒",
    sizes: [
      { value: "1-gallon", label: "1 Gallon" },
      { value: "2-gallon", label: "2 Gallon" },
      { value: "3-gallon", label: "3 Gallon" },
      { value: "5-gallon", label: "5 Gallon" },
      { value: "7-gallon", label: "7 Gallon" },
      { value: "10-gallon", label: "10 Gallon" },
      { value: "15-gallon", label: "15 Gallon" },
      { value: "30-gallon", label: "30 Gallon" },
      { value: "custom", label: "Custom Size" },
    ],
  },
  pot: {
    label: "Pot",
    icon: "🪴",
    sizes: [
      { value: "4-inch", label: "4 inch" },
      { value: "5-inch", label: "5 inch" },
      { value: "6-inch", label: "6 inch" },
    ],
  },
  "cell-tray": {
    label: "Seed Starting Cell Tray",
    icon: "📱",
    sizes: [{ value: "standard", label: "Standard Cell Tray" }],
  },
  "raised-bed": {
    label: "Raised Bed",
    icon: "🏗️",
    sizes: [{ value: "custom-dimensions", label: "Custom Dimensions" }],
  },
};

export function PlantRegistrationForm({
  onSuccess,
  onCancel,
}: PlantRegistrationFormProps) {
  const [varieties, setVarieties] = useState<VarietyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showCustomVarietyForm, setShowCustomVarietyForm] = useState(false);
  const [reminderPreferences, setReminderPreferences] = useState({
    watering: true,
    fertilizing: true,
    observation: true,
    lighting: true,
    pruning: true,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    reset,
    setValue,
    watch,
    control,
  } = useForm<PlantFormData>({
    resolver: zodResolver(plantSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      plantedDate: new Date().toISOString().split("T")[0],
      containerType: "",
      containerSize: "",
      soilMix: "",
      notes: "",
      location: false,
    },
  });

  const selectedContainerType = watch("containerType");
  const selectedContainerSize = watch("containerSize");

  useEffect(() => {
    loadVarieties();
  }, []);

  useEffect(() => {
    if (selectedContainerType) {
      setValue("containerSize", "");
      setValue("customBagShape", "");
      setValue("customDiameter", "");
      setValue("customBagHeight", "");
      setValue("customBagWidth", "");
      setValue("customBagLength", "");
      setValue("customWidth", "");
      setValue("customLength", "");
      setValue("customDepth", "");
    }
  }, [selectedContainerType, setValue]);

  async function loadVarieties() {
    try {
      const allVarieties = await varietyService.getAllVarieties();
      const sortedVarieties = allVarieties.sort((a, b) => {
        if (a.isCustom !== b.isCustom) {
          return a.isCustom ? 1 : -1;
        }
        return a.name.localeCompare(b.name);
      });
      setVarieties(sortedVarieties);
    } catch (error) {
      console.error("Failed to load varieties:", error);
      setSubmitError(
        "Failed to load plant varieties. Please refresh the page."
      );
    }
  }

  async function onSubmit(data: PlantFormData) {
    setIsLoading(true);
    setSubmitError(null);

    try {
      const selectedVariety = varieties.find((v) => v.id === data.varietyId);
      const varietyName = selectedVariety?.name || "Unknown Variety";

      const locationString = data.location ? "Outdoor" : "Indoor";

      // Build container description
      let containerDescription = "";
      const containerConfig =
        containerOptions[data.containerType as keyof typeof containerOptions];

      if (data.containerSize === "custom") {
        // Custom grow bag
        if (data.customBagShape === "circular") {
          containerDescription = `${containerConfig.label} - ${data.customDiameter}"⌀ x ${data.customBagHeight}"H (Circular)`;
        } else if (data.customBagShape === "rectangular") {
          containerDescription = `${containerConfig.label} - ${data.customBagWidth}"W x ${data.customBagLength}"L x ${data.customBagHeight}"H (Rectangular)`;
        }
      } else if (data.containerSize === "custom-dimensions") {
        // Custom raised bed
        containerDescription = `${containerConfig.label} - ${data.customWidth}"W x ${data.customLength}"L x ${data.customDepth}"D`;
      } else {
        // Standard sizes
        const sizeConfig = containerConfig.sizes.find(
          (size) => size.value === data.containerSize
        );
        containerDescription = `${containerConfig.label} - ${sizeConfig?.label}`;
      }

      await plantService.addPlant({
        varietyId: data.varietyId,
        varietyName,
        name: data.name?.trim() || undefined,
        plantedDate: new Date(data.plantedDate),
        currentStage: "germination",
        location: locationString,
        container: containerDescription,
        soilMix: data.soilMix || undefined,
        isActive: true,
        notes: data.notes ? [data.notes] : [],
        reminderPreferences, // This comes from state, not form data
      });

      toast.success(`${data.name || varietyName} registered successfully! 🌱`);

      reset();
      onSuccess?.();
    } catch (error) {
      console.error("Failed to register plant:", error);
      setSubmitError("Failed to register plant. Please try again.");
      toast.error("Failed to register plant. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function renderFormField(
    id: keyof PlantFormData,
    label: string,
    type: "text" | "date" | "select" | "textarea" = "text",
    placeholder?: string,
    required: boolean = false
  ) {
    const error = (errors as FormErrors)[id];

    return (
      <div>
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label} {required && "*"}
        </label>

        {type === "select" && id === "varietyId" ? (
          <div className="space-y-2">
            <select
              id={id}
              {...register(id)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-garden-500 focus:border-transparent"
            >
              <option value="">Select a variety...</option>

              {varieties.filter((v) => !v.isCustom).length > 0 && (
                <optgroup label="Built-in Varieties">
                  {varieties
                    .filter((variety) => !variety.isCustom)
                    .map((variety) => (
                      <option key={variety.id} value={variety.id}>
                        {variety.name} ({variety.category})
                      </option>
                    ))}
                </optgroup>
              )}

              {varieties.filter((v) => v.isCustom).length > 0 && (
                <optgroup label="Your Custom Varieties">
                  {varieties
                    .filter((variety) => variety.isCustom)
                    .map((variety) => (
                      <option key={variety.id} value={variety.id}>
                        🌱 {variety.name} ({variety.category})
                      </option>
                    ))}
                </optgroup>
              )}
            </select>

            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCustomVarietyForm(true)}
              className="w-full"
            >
              ➕ Create Custom Variety
            </Button>
          </div>
        ) : type === "textarea" ? (
          <textarea
            id={id}
            {...register(id)}
            placeholder={placeholder}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-garden-500 focus:border-transparent"
          />
        ) : (
          <input
            id={id}
            type={type}
            {...register(id)}
            placeholder={placeholder}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-garden-500 focus:border-transparent"
          />
        )}

        {error?.message && (
          <p className="mt-1 text-sm text-red-600">{error.message}</p>
        )}
      </div>
    );
  }

  function renderContainerFields() {
    const selectedBagShape = watch("customBagShape");

    return (
      <div className="space-y-4">
        {/* Container Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Container Type *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(containerOptions).map(([key, option]) => (
              <label
                key={key}
                className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all active:scale-95 ${
                  selectedContainerType === key
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 active:border-gray-400"
                }`}
              >
                <input
                  type="radio"
                  value={key}
                  {...register("containerType")}
                  className="sr-only"
                />
                <span className="text-2xl mr-3">{option.icon}</span>
                <span className="font-medium text-gray-900 text-sm">
                  {option.label}
                </span>
                {selectedContainerType === key && (
                  <span className="absolute top-2 right-2 text-emerald-500">
                    ✓
                  </span>
                )}
              </label>
            ))}
          </div>
          {errors.containerType && (
            <p className="mt-1 text-sm text-red-600">
              {errors.containerType.message}
            </p>
          )}
        </div>

        {/* Container Size Selection */}
        {selectedContainerType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {
                containerOptions[
                  selectedContainerType as keyof typeof containerOptions
                ].label
              }{" "}
              Size *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {containerOptions[
                selectedContainerType as keyof typeof containerOptions
              ].sizes.map((size) => (
                <label
                  key={size.value}
                  className={`relative flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all active:scale-95 ${
                    selectedContainerSize === size.value
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 active:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    value={size.value}
                    {...register("containerSize")}
                    className="sr-only"
                  />
                  <span className="font-medium text-gray-900 text-sm">
                    {size.label}
                  </span>
                  {selectedContainerSize === size.value && (
                    <span className="absolute top-2 right-2 text-emerald-500">
                      ✓
                    </span>
                  )}
                </label>
              ))}
            </div>
            {errors.containerSize && (
              <p className="mt-1 text-sm text-red-600">
                {errors.containerSize.message}
              </p>
            )}
          </div>
        )}

        {/* Custom Grow Bag Configuration */}
        {selectedContainerType === "grow-bag" &&
          selectedContainerSize === "custom" && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Grow Bag Shape *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`relative flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-all active:scale-95 ${
                      selectedBagShape === "circular"
                        ? "border-blue-500 bg-blue-100"
                        : "border-gray-200 active:border-gray-400"
                    }`}
                  >
                    <input
                      type="radio"
                      value="circular"
                      {...register("customBagShape")}
                      className="sr-only"
                    />
                    <span className="text-3xl mb-1">⭕</span>
                    <span className="font-medium text-gray-900 text-sm">
                      Circle
                    </span>
                    {selectedBagShape === "circular" && (
                      <span className="absolute top-2 right-2 text-blue-500">
                        ✓
                      </span>
                    )}
                  </label>

                  <label
                    className={`relative flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-all active:scale-95 ${
                      selectedBagShape === "rectangular"
                        ? "border-blue-500 bg-blue-100"
                        : "border-gray-200 active:border-gray-400"
                    }`}
                  >
                    <input
                      type="radio"
                      value="rectangular"
                      {...register("customBagShape")}
                      className="sr-only"
                    />
                    <span className="text-3xl mb-1">⬜</span>
                    <span className="font-medium text-gray-900 text-sm">
                      Rectangle
                    </span>
                    {selectedBagShape === "rectangular" && (
                      <span className="absolute top-2 right-2 text-blue-500">
                        ✓
                      </span>
                    )}
                  </label>
                </div>
                {errors.customBagShape && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.customBagShape.message}
                  </p>
                )}
              </div>

              {/* Circular Bag Dimensions */}
              {selectedBagShape === "circular" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Circular Grow Bag Dimensions (inches) *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="customDiameter"
                        className="block text-xs font-medium text-gray-600 mb-1"
                      >
                        Diameter
                      </label>
                      <input
                        id="customDiameter"
                        type="number"
                        step="0.5"
                        min="1"
                        {...register("customDiameter")}
                        placeholder="24"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                      />
                      {errors.customDiameter && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.customDiameter.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="customBagHeight"
                        className="block text-xs font-medium text-gray-600 mb-1"
                      >
                        Height
                      </label>
                      <input
                        id="customBagHeight"
                        type="number"
                        step="0.5"
                        min="1"
                        {...register("customBagHeight")}
                        placeholder="18"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                      />
                      {errors.customBagHeight && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.customBagHeight.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Example: 24" diameter × 18" height
                  </p>
                </div>
              )}

              {/* Rectangular Bag Dimensions */}
              {selectedBagShape === "rectangular" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Rectangular Grow Bag Dimensions (inches) *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label
                        htmlFor="customBagWidth"
                        className="block text-xs font-medium text-gray-600 mb-1"
                      >
                        Width
                      </label>
                      <input
                        id="customBagWidth"
                        type="number"
                        step="0.5"
                        min="1"
                        {...register("customBagWidth")}
                        placeholder="24"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                      />
                      {errors.customBagWidth && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.customBagWidth.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="customBagLength"
                        className="block text-xs font-medium text-gray-600 mb-1"
                      >
                        Length
                      </label>
                      <input
                        id="customBagLength"
                        type="number"
                        step="0.5"
                        min="1"
                        {...register("customBagLength")}
                        placeholder="48"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                      />
                      {errors.customBagLength && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.customBagLength.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="customBagHeight"
                        className="block text-xs font-medium text-gray-600 mb-1"
                      >
                        Height
                      </label>
                      <input
                        id="customBagHeight"
                        type="number"
                        step="0.5"
                        min="1"
                        {...register("customBagHeight")}
                        placeholder="18"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                      />
                      {errors.customBagHeight && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.customBagHeight.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Example: 24" wide × 48" long × 18" height
                  </p>
                </div>
              )}
            </div>
          )}

        {/* Custom Dimensions Input for Raised Beds */}
        {selectedContainerType === "raised-bed" &&
          selectedContainerSize === "custom-dimensions" && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Raised Bed Dimensions (inches) *
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="customWidth"
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    Width
                  </label>
                  <input
                    id="customWidth"
                    type="number"
                    step="0.5"
                    min="1"
                    {...register("customWidth")}
                    placeholder="48"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-center"
                  />
                  {errors.customWidth && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.customWidth.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="customLength"
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    Length
                  </label>
                  <input
                    id="customLength"
                    type="number"
                    step="0.5"
                    min="1"
                    {...register("customLength")}
                    placeholder="96"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-center"
                  />
                  {errors.customLength && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.customLength.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="customDepth"
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    Soil Depth
                  </label>
                  <input
                    id="customDepth"
                    type="number"
                    step="0.5"
                    min="1"
                    {...register("customDepth")}
                    placeholder="12"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-center"
                  />
                  {errors.customDepth && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.customDepth.message}
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Example: 48" wide × 96" long × 12" deep
              </p>
            </div>
          )}
      </div>
    );
  }

  return (
    <>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Register New Plant</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {submitError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}
            {renderFormField(
              "varietyId",
              "Plant Variety",
              "select",
              undefined,
              true
            )}
            {renderFormField(
              "name",
              "Plant Name (Optional)",
              "text",
              "e.g., Tomato #1, Kitchen Basil"
            )}
            {renderFormField(
              "plantedDate",
              "Planting Date",
              "date",
              undefined,
              true
            )}
            <div>
              <label
                id="location-label"
                className="block text-sm font-medium text-gray-700 mb-3"
              >
                Location *
              </label>
              <Switch
                id="location"
                checked={watch("location") || false}
                onCheckedChange={(checked) => setValue("location", checked)}
                leftLabel="Indoor"
                rightLabel="Outdoor"
                leftIcon={<span className="text-lg">🏠</span>}
                rightIcon={<span className="text-lg">🌞</span>}
                size="lg"
                className="justify-center"
                aria-labelledby="location-label"
              />
              {errors.location && (
                <p className="mt-2 text-sm text-red-600">
                  Please select a location
                </p>
              )}
            </div>

            {/* Updated Container Fields */}
            {renderContainerFields()}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Soil Mix *
              </label>

              <Controller
                name="soilMix"
                control={control}
                render={({ field }) => (
                  <SoilMixtureSelector
                    selectedMixture={field.value}
                    onMixtureChange={field.onChange}
                    plantCategory={
                      varieties.find((v) => v.id === watch("varietyId"))
                        ?.category
                    }
                  />
                )}
              />
              {errors.soilMix?.message && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.soilMix.message}
                </p>
              )}
            </div>

            <ReminderPreferencesSection
              preferences={reminderPreferences}
              onChange={setReminderPreferences}
            />
            {/* Notes Field */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                {...register("notes")}
                placeholder="Any additional notes about this plant..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-garden-500 focus:border-transparent"
              />
              {errors.notes?.message && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.notes.message}
                </p>
              )}
            </div>
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                variant={isValid && !isSubmitting ? "primary" : "outline"}
                disabled={isLoading || !isValid}
                className={cn(
                  "flex-1 transition-all duration-300",
                  isValid && !isSubmitting && !isLoading
                    ? "shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transform hover:scale-[1.02]"
                    : "opacity-60 cursor-not-allowed shadow-sm"
                )}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Registering...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isValid ? (
                      <>
                        <span className="text-lg">🌱</span>
                        Register Plant
                      </>
                    ) : (
                      <>
                        <span className="text-gray-400">📝</span>
                        Complete Required Fields
                      </>
                    )}
                  </div>
                )}
              </Button>

              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Custom Variety Form Modal */}
      {showCustomVarietyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <CustomVarietyForm
              onSuccess={async (varietyId) => {
                setShowCustomVarietyForm(false);
                // Load varieties first, then set the value
                await loadVarieties();
                setValue("varietyId", varietyId);
              }}
              onCancel={() => setShowCustomVarietyForm(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
