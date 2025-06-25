// src/components/plant/PlantRegistrationForm.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { Input } from "../ui/Input";
import { varietyService, VarietyRecord } from "@/types/database";
import { CustomVarietyForm } from "./CustomVarietyForm";
import toast from "react-hot-toast";
import SoilMixtureSelector from "./SoilMixtureSelector";
import { Switch } from "@/components/ui/Switch";
import ReminderPreferencesSection from "@/components/plant/ReminderPreferencesSection";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { LoadingSpinner } from "../ui/LoadingSpinner";

type ContainerOption = {
  label: string;
  icon: string;
  defaultSetup: string;
  sizes: ReadonlyArray<{
    value: string;
    label: string;
  }>;
};

const plantSchema = z.object({
  varietyId: z.string().min(1, "Please select a variety"),
  plantedDate: z.string().refine((date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    return selectedDate <= today && selectedDate >= oneYearAgo;
  }, "Planting date must be within the past year and not in the future"),
  location: z.boolean(),
  containerType: z.string().min(1, "Please select a container type"),
  containerSize: z.string().min(1, "Please specify container size"),
  quantity: z
    .number()
    .min(1, "Quantity must be at least 1")
    .max(999, "Quantity cannot exceed 999"),
  setupType: z.enum(["multiple-containers", "same-container"]),
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

const containerOptions = {
  "grow-bag": {
    label: "Grow Bag",
    icon: "🎒",
    defaultSetup: "multiple-containers",
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
    defaultSetup: "multiple-containers",
    sizes: [
      { value: "4-inch", label: "4 inch" },
      { value: "5-inch", label: "5 inch" },
      { value: "6-inch", label: "6 inch" },
      { value: "8-inch", label: "8 inch" },
      { value: "10-inch", label: "10 inch" },
      { value: "12-inch", label: "12 inch" },
      { value: "custom", label: "Custom Size" },
    ],
  },
  "cell-tray": {
    label: "Seed Starting Cell Tray",
    icon: "📱",
    defaultSetup: "same-container",
    sizes: [
      { value: "72-cell", label: "72 Cell Tray" },
      { value: "50-cell", label: "50 Cell Tray" },
      { value: "32-cell", label: "32 Cell Tray" },
      { value: "custom", label: "Custom Cell Count" },
    ],
  },
  "raised-bed": {
    label: "Raised Bed",
    icon: "🏗️",
    defaultSetup: "same-container",
    sizes: [{ value: "custom-dimensions", label: "Custom Dimensions" }],
  },
} as const;

export function PlantRegistrationForm({
  onSuccess,
  onCancel,
}: PlantRegistrationFormProps) {
  const { createPlant } = useFirebasePlants();

  const [varieties, setVarieties] = useState<VarietyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVarieties, setIsLoadingVarieties] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showCustomVarietyForm, setShowCustomVarietyForm] = useState(false);
  const [reminderPreferences, setReminderPreferences] = useState({
    watering: true,
    fertilizing: true,
    observation: true,
    lighting: false,
    pruning: false,
  });

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
      location: false,
      quantity: 1,
      setupType: "multiple-containers",
      plantedDate: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const selectedVarietyId = watch("varietyId");
  const containerType = watch("containerType");
  // const containerSize = watch("containerSize");
  const setupType = watch("setupType");
  const quantity = watch("quantity");

  useEffect(() => {
    loadVarieties();
  }, []);

  useEffect(() => {
    if (containerType) {
      const option =
        containerOptions[containerType as keyof typeof containerOptions];
      if (option) {
        setValue("setupType", option.defaultSetup, { shouldValidate: true });
        // Always set the first size when container type changes
        setValue("containerSize", option.sizes[0].value, {
          shouldValidate: true,
        });
      }
    }
  }, [containerType, setValue]);

  const loadVarieties = async () => {
    try {
      setIsLoadingVarieties(true);
      const varietyList = await varietyService.getAllVarieties();
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

  const onSubmit = async (data: PlantFormData) => {
    try {
      setIsLoading(true);
      setSubmitError(null);

      const variety = varieties.find((v) => v.id === data.varietyId);
      if (!variety) {
        throw new Error("Selected variety not found");
      }

      const varietyName = variety.name;
      const locationString = data.location ? "Outdoor" : "Indoor";

      // Build container description
      let containerDescription = "";
      const containerOption =
        containerOptions[data.containerType as keyof typeof containerOptions];

      if (
        data.containerSize === "custom" ||
        data.containerSize === "custom-dimensions"
      ) {
        containerDescription = buildCustomContainerDescription(
          data,
          containerOption
        );
      } else {
        const sizeOption = containerOption?.sizes.find(
          (s) => s.value === data.containerSize
        );
        const singleDescription = `${sizeOption?.label || data.containerSize} ${
          containerOption?.label || data.containerType
        }`;

        const isMultipleContainers = data.setupType === "multiple-containers";
        if (data.quantity > 1 && !isMultipleContainers) {
          containerDescription = `${singleDescription} (${data.quantity} plants)`;
        } else {
          containerDescription = singleDescription;
        }
      }

      const baseName = varietyName;

      // Create plants based on quantity and setup type
      for (let i = 0; i < data.quantity; i++) {
        let plantName = baseName;

        if (data.quantity > 1) {
          const isMultipleContainers = data.setupType === "multiple-containers";
          if (isMultipleContainers) {
            plantName = `${baseName} #${i + 1}`;
          } else {
            plantName = `${baseName} (Plant ${i + 1})`;
          }
        }

        await createPlant({
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
          quantity: data.quantity,
          setupType: data.setupType,
        });
      }

      toast.success(`Successfully registered ${data.quantity} plant(s)! 🌱`);
      reset();
      onSuccess?.();
    } catch (error) {
      console.error("Failed to register plant:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to register plant";
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const buildCustomContainerDescription = (
    data: PlantFormData,
    containerOption: ContainerOption | undefined
  ) => {
    if (data.containerType === "grow-bag" && data.customBagShape) {
      if (data.customBagShape === "round") {
        return `${data.customDiameter}"D x ${data.customBagHeight}"H ${
          containerOption?.label || "Grow Bag"
        }`;
      } else {
        return `${data.customBagWidth}"W x ${data.customBagLength}"L x ${
          data.customBagHeight
        }"H ${containerOption?.label || "Grow Bag"}`;
      }
    } else if (data.containerType === "raised-bed") {
      return `${data.customWidth}"W x ${data.customLength}"L x ${data.customDepth}"D Raised Bed`;
    } else if (data.containerType === "pot") {
      return `${data.customDiameter}" ${containerOption?.label || "Pot"}`;
    }
    return "Custom Container";
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
              className={`w-full p-3 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent ${
                error ? "border-red-500" : "border-border"
              }`}
              disabled={isLoadingVarieties}
            >
              <option value="">
                {isLoadingVarieties
                  ? "Loading varieties..."
                  : "Select a variety"}
              </option>
              {varieties.map((variety) => (
                <option key={variety.id} value={variety.id}>
                  {getVarietyDisplayName(variety)}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCustomVarietyForm(true)}
              className="text-sm"
            >
              + Add Custom Variety
            </Button>
          </div>
        ) : type === "select" && id === "containerType" ? (
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(containerOptions).map(([key, option]) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setValue("containerType", key, { shouldValidate: true })
                }
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  watch("containerType") === key
                    ? "border-accent bg-accent/10"
                    : "border-border hover:border-accent/50"
                }`}
                data-testid={`container-type-${key}`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{option.icon}</span>
                  <span className="font-medium">{option.label}</span>
                </div>
              </button>
            ))}
          </div>
        ) : type === "select" && id === "containerSize" ? (
          renderContainerSizeSelect(error)
        ) : type === "textarea" ? (
          <textarea
            {...register(id)}
            id={id}
            placeholder={placeholder}
            rows={3}
            className={`w-full p-3 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent resize-none ${
              error ? "border-red-500" : "border-border"
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

  const renderContainerSizeSelect = (
    error: FormErrors[keyof PlantFormData]
  ) => {
    const selectedContainerType =
      containerType as keyof typeof containerOptions;
    if (!selectedContainerType || !containerOptions[selectedContainerType]) {
      return (
        <p className="text-sm text-muted-foreground">
          Please select a container type first
        </p>
      );
    }

    const options = containerOptions[selectedContainerType];

    return (
      <div className="space-y-3">
        <select
          {...register("containerSize")}
          className={`w-full p-3 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent ${
            error ? "border-red-500" : "border-border"
          }`}
        >
          <option value="">Select size</option>
          {options.sizes.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>

        {renderCustomSizeFields()}
      </div>
    );
  };

  const renderCustomSizeFields = () => {
    const size = watch("containerSize");
    if (size !== "custom" && size !== "custom-dimensions") return null;

    if (containerType === "grow-bag") {
      return (
        <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-1">Bag Shape</label>
            <select
              {...register("customBagShape")}
              className="w-full p-2 border rounded bg-background"
            >
              <option value="">Select shape</option>
              <option value="round">Round</option>
              <option value="rectangular">Rectangular</option>
            </select>
          </div>

          {watch("customBagShape") === "round" ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Diameter (inches)
                </label>
                <Input
                  {...register("customDiameter")}
                  type="number"
                  placeholder="e.g., 12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Height (inches)
                </label>
                <Input
                  {...register("customBagHeight")}
                  type="number"
                  placeholder="e.g., 8"
                />
              </div>
            </>
          ) : watch("customBagShape") === "rectangular" ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Width (inches)
                </label>
                <Input
                  {...register("customBagWidth")}
                  type="number"
                  placeholder="e.g., 24"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Length (inches)
                </label>
                <Input
                  {...register("customBagLength")}
                  type="number"
                  placeholder="e.g., 36"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Height (inches)
                </label>
                <Input
                  {...register("customBagHeight")}
                  type="number"
                  placeholder="e.g., 12"
                />
              </div>
            </>
          ) : null}
        </div>
      );
    }

    if (containerType === "raised-bed") {
      return (
        <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-1">
              Width (inches)
            </label>
            <Input
              {...register("customWidth")}
              type="number"
              placeholder="e.g., 48"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Length (inches)
            </label>
            <Input
              {...register("customLength")}
              type="number"
              placeholder="e.g., 96"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Depth (inches)
            </label>
            <Input
              {...register("customDepth")}
              type="number"
              placeholder="e.g., 12"
            />
          </div>
        </div>
      );
    }

    if (containerType === "pot") {
      return (
        <div className="p-3 bg-muted/50 rounded-lg">
          <label className="block text-sm font-medium mb-1">
            Diameter (inches)
          </label>
          <Input
            {...register("customDiameter")}
            type="number"
            placeholder="e.g., 14"
          />
        </div>
      );
    }

    return null;
  };

  const getQuantityHelperText = () => {
    const isMultipleContainers = setupType === "multiple-containers";
    const isSameContainer = setupType === "same-container";

    if (isMultipleContainers) {
      return "Number of separate containers (1 plant each)";
    } else if (isSameContainer) {
      return "Number of plants in the same container";
    }
    return "Number of containers/plants";
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
                "plantedDate",
                "Planting Date",
                "date",
                "",
                true
              )}
            </div>

            {/* Location Section */}
            <div className="space-y-4 p-4 bg-gradient-to-br from-accent/5 to-accent/10 rounded-lg border border-accent/20">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span className="text-lg">📍</span>
                Growing Location
              </h3>
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Location
                </label>
                <div className="flex items-center justify-center space-x-4 p-4 bg-background/50 rounded-lg">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <span className="text-sm font-medium text-foreground">
                      Indoor
                    </span>
                    <Switch
                      checked={watch("location")}
                      onCheckedChange={(checked) =>
                        setValue("location", checked, { shouldValidate: true })
                      }
                      aria-label="Location toggle between indoor and outdoor"
                    />
                    <span className="text-sm font-medium text-foreground">
                      Outdoor
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Container Section */}
            <div className="space-y-4 p-4 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 rounded-lg border border-emerald-500/20">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span className="text-lg">🪴</span>
                Container Setup
              </h3>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Container Type *
                </label>
                {renderFormField("containerType", "", "select")}
              </div>

              {containerType && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Container Size *
                  </label>
                  {renderFormField("containerSize", "", "select")}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Setup Type
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-background/50 transition-colors">
                      <input
                        type="radio"
                        value="multiple-containers"
                        {...register("setupType")}
                        className="w-4 h-4 text-accent border-gray-300 focus:ring-accent"
                      />
                      <div>
                        <div className="font-medium">Multiple Containers</div>
                        <div className="text-sm text-muted-foreground">
                          Each plant gets its own container
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-background/50 transition-colors">
                      <input
                        type="radio"
                        value="same-container"
                        {...register("setupType")}
                        className="w-4 h-4 text-accent border-gray-300 focus:ring-accent"
                      />
                      <div>
                        <div className="font-medium">Same Container</div>
                        <div className="text-sm text-muted-foreground">
                          Multiple plants share one container
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

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
                  <p className="text-xs text-muted-foreground mt-1 bg-background/50 p-2 rounded">
                    {getQuantityHelperText()}
                  </p>
                </div>
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
