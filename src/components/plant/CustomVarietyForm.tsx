// src/components/plant/CustomVarietyForm.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { varietyService } from "@/types/database";
import toast from "react-hot-toast";

const customVarietySchema = z.object({
  name: z.string().min(1, "Variety name is required"),
  category: z.enum([
    "root-vegetables",
    "leafy-greens",
    "herbs",
    "berries",
    "fruiting-plants",
  ]),
  growthTimeline: z.object({
    germination: z.number().min(1).max(90),
    seedling: z.number().min(1).max(90),
    vegetative: z.number().min(1).max(180),
    rootDevelopment: z.number().min(1).max(180),
    maturation: z.number().min(1).max(365),
  }),
  customMoistureRanges: z.boolean().optional(),
  triggerMin: z.number().min(1).max(10).optional(),
  triggerMax: z.number().min(1).max(10).optional(),
  targetMin: z.number().min(1).max(10).optional(),
  targetMax: z.number().min(1).max(10).optional(),
});

type CustomVarietyData = z.infer<typeof customVarietySchema>;

interface CustomVarietyFormProps {
  onSuccess?: (varietyId: string) => void;
  onCancel?: () => void;
}

export function CustomVarietyForm({
  onSuccess,
  onCancel,
}: CustomVarietyFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showMoistureCustomization, setShowMoistureCustomization] =
    useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomVarietyData>({
    resolver: zodResolver(customVarietySchema),
    defaultValues: {
      triggerMin: 3,
      triggerMax: 4,
      targetMin: 6,
      targetMax: 7,
    },
  });

  async function onSubmit(data: CustomVarietyData) {
    setIsLoading(true);
    try {
      // Build watering protocols if custom moisture ranges are specified
      let protocols = undefined;
      if (
        data.customMoistureRanges &&
        data.triggerMin &&
        data.triggerMax &&
        data.targetMin &&
        data.targetMax
      ) {
        const wateringRanges = {
          trigger: { moistureLevel: `${data.triggerMin}-${data.triggerMax}` },
          target: { moistureLevel: `${data.targetMin}-${data.targetMax}` },
        };

        // Apply the same watering ranges to all growth stages
        protocols = {
          watering: {
            germination: wateringRanges,
            seedling: wateringRanges,
            vegetative: wateringRanges,
            flowering: wateringRanges,
            fruiting: wateringRanges,
            maturation: wateringRanges,
            harvest: wateringRanges,
            "ongoing-production": wateringRanges,
          },
        };
      }

      const varietyId = await varietyService.addVariety({
        name: data.name,
        category: data.category,
        growthTimeline: {
          ...data.growthTimeline,
          rootDevelopment: data.growthTimeline.rootDevelopment,
        },
        protocols,
        isCustom: true,
      });

      toast.success(`Created custom variety: ${data.name}!`);
      reset();
      onSuccess?.(varietyId);
    } catch (error) {
      console.error("Failed to create variety:", error);
      toast.error("Failed to create variety. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Custom Plant Variety</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Add your own plant varieties like pumpkins, exotic herbs, or local
          cultivars
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Variety Name *
            </label>
            <input
              {...register("name")}
              placeholder="e.g., Jack-o'-lantern Pumpkins, Cherokee Purple Tomatoes"
              className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-garden-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Category *
            </label>
            <select
              {...register("category")}
              className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-garden-500"
            >
              <option value="fruiting-plants">
                🎃 Fruiting Plants (pumpkins, squash, melons, etc.)
              </option>
              <option value="leafy-greens">
                🥬 Leafy Greens (lettuce, spinach, kale, etc.)
              </option>
              <option value="root-vegetables">
                🥕 Root Vegetables (carrots, beets, radishes, etc.)
              </option>
              <option value="herbs">
                🌿 Herbs (basil, cilantro, sage, etc.)
              </option>
              <option value="berries">
                🫐 Berries (strawberries, raspberries, etc.)
              </option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              This determines default care guidelines and protocols
            </p>
          </div>

          {/* Growth Timeline */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">
              Growth Timeline (days)
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              How long does each growth stage typically last? These help predict
              care needs.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Germination Days
                </label>
                <input
                  type="number"
                  {...register("growthTimeline.germination", {
                    valueAsNumber: true,
                  })}
                  placeholder="7"
                  className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-garden-500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Days to sprout
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Seedling Stage Days
                </label>
                <input
                  type="number"
                  {...register("growthTimeline.seedling", {
                    valueAsNumber: true,
                  })}
                  placeholder="14"
                  className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-garden-500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Early growth period
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Vegetative Growth Days
                </label>
                <input
                  type="number"
                  {...register("growthTimeline.vegetative", {
                    valueAsNumber: true,
                  })}
                  placeholder="30"
                  className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-garden-500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leaf and stem development
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Root Development Days
                </label>
                <input
                  type="number"
                  {...register("growthTimeline.rootDevelopment", {
                    valueAsNumber: true,
                  })}
                  placeholder="42"
                  className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-garden-500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Root system establishment
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Total Days to Maturity
                </label>
                <input
                  type="number"
                  {...register("growthTimeline.maturation", {
                    valueAsNumber: true,
                  })}
                  placeholder="60"
                  className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-garden-500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ready for harvest
                </p>
              </div>
            </div>
          </div>

          {/* Custom Moisture Ranges */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-foreground">
                  Custom Moisture Protocol
                </h3>
                <p className="text-sm text-muted-foreground">
                  Set specific watering ranges, or use category defaults
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setShowMoistureCustomization(!showMoistureCustomization)
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showMoistureCustomization ? "bg-garden-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${
                    showMoistureCustomization
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {showMoistureCustomization && (
              <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                <input
                  type="hidden"
                  {...register("customMoistureRanges")}
                  checked={showMoistureCustomization}
                />

                <div className="text-sm text-blue-800 mb-3">
                  💡 <strong>Moisture Meter Guide:</strong> Most plants prefer
                  watering when moisture drops to 3-4, then watered until
                  reaching 6-8. Adjust based on your specific variety's needs.
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Water When (Min Level)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.5"
                      {...register("triggerMin", { valueAsNumber: true })}
                      className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-garden-500"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Lowest moisture before watering
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Water When (Max Level)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.5"
                      {...register("triggerMax", { valueAsNumber: true })}
                      className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-garden-500"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Highest moisture before watering
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Target After (Min Level)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.5"
                      {...register("targetMin", { valueAsNumber: true })}
                      className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-garden-500"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum moisture after watering
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Target After (Max Level)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.5"
                      {...register("targetMax", { valueAsNumber: true })}
                      className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-garden-500"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum moisture after watering
                    </p>
                  </div>
                </div>
                <p className="text-xs text-blue-700">
                  💡 These ranges will apply to all growth stages initially. You
                  can refine them later as you learn your plant's specific needs
                  through the care logging system.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Creating..." : "Create Variety"}
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
