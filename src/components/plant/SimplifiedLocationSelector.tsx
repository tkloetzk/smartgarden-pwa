import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { BedRecord, bedService } from "@/types/database";
import { PlantSection, Position } from "@/types/spacing";
import { BedLayoutVisualizer } from "./BedLayoutVisualizer";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const containerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  containerType: z.enum(["grow-bag", "pot", "raised-bed"]),
  size: z.string().optional(),
  customLength: z.number().optional(),
  customWidth: z.number().optional(),
  customHeight: z.number().optional(),
  customDiameter: z.number().optional(),
}).refine((data) => {
  // For raised beds, size is automatically "custom" so no validation needed
  if (data.containerType === "raised-bed") return true;
  // For other types, size is required
  return data.size && data.size.length > 0;
}, {
  message: "Please select a size",
  path: ["size"],
});

type ContainerFormData = z.infer<typeof containerFormSchema>;

const containerOptions = {
  "grow-bag": {
    label: "Grow Bag",
    icon: "🌱",
    sizes: [
      { value: "1-gallon", label: "1 Gallon", dimensions: { length: 7, width: 7, unit: "inches" } },
      { value: "2-gallon", label: "2 Gallon", dimensions: { length: 8, width: 8, unit: "inches" } },
      { value: "3-gallon", label: "3 Gallon", dimensions: { length: 10, width: 10, unit: "inches" } },
      { value: "5-gallon", label: "5 Gallon", dimensions: { length: 12, width: 12, unit: "inches" } },
      { value: "7-gallon", label: "7 Gallon", dimensions: { length: 14, width: 14, unit: "inches" } },
      { value: "10-gallon", label: "10 Gallon", dimensions: { length: 16, width: 16, unit: "inches" } },
      { value: "15-gallon", label: "15 Gallon", dimensions: { length: 18, width: 18, unit: "inches" } },
      { value: "30-gallon", label: "30 Gallon", dimensions: { length: 24, width: 24, unit: "inches" } },
      { value: "custom", label: "Custom Size", dimensions: null },
    ],
  },
  "pot": {
    label: "Pot",
    icon: "🪴",
    sizes: [
      { value: "seed-starting", label: "Seed Starting", dimensions: { length: 2, width: 2, unit: "inches" } },
      { value: "3-inch", label: "3 inch", dimensions: { length: 3, width: 3, unit: "inches" } },
      { value: "4-inch", label: "4 inch", dimensions: { length: 4, width: 4, unit: "inches" } },
      { value: "5-inch", label: "5 inch", dimensions: { length: 5, width: 5, unit: "inches" } },
      { value: "6-inch", label: "6 inch", dimensions: { length: 6, width: 6, unit: "inches" } },
      { value: "custom", label: "Custom Size", dimensions: null },
    ],
  },
  "raised-bed": {
    label: "Raised Bed",
    icon: "🏗️",
    sizes: [
      { value: "custom", label: "Custom Dimensions", dimensions: null },
    ],
  },
};

interface SimplifiedLocationSelectorProps {
  // Selected values
  selectedBedId?: string;
  section?: string;
  structuredSection?: PlantSection;
  location: boolean; // indoor/outdoor
  
  // Change handlers
  onBedSelect: (bedId: string) => void;
  onSectionChange: (section: string) => void;
  onStructuredSectionChange: (section: PlantSection | null) => void;
  onLocationChange: (isOutdoor: boolean) => void;
}

export function SimplifiedLocationSelector({
  selectedBedId,
  section,
  structuredSection,
  location,
  onBedSelect,
  onSectionChange,
  onStructuredSectionChange,
  onLocationChange,
}: SimplifiedLocationSelectorProps) {
  const { plants } = useFirebasePlants();
  const [beds, setBeds] = useState<BedRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSectionInput, setShowSectionInput] = useState(false);
  const [showAdvancedPositioning, setShowAdvancedPositioning] = useState(false);
  const [showCreateContainer, setShowCreateContainer] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContainerFormData>({
    resolver: zodResolver(containerFormSchema),
    defaultValues: {
      containerType: "grow-bag",
    },
  });

  const watchedContainerType = watch("containerType");
  const watchedSize = watch("size");

  const selectedBed = beds.find(bed => bed.id === selectedBedId);

  // Filter plants for the current bed and format for visualizer
  const currentBedPlants = plants
    ?.filter(plant => plant.structuredSection?.bedId === selectedBedId)
    .map(plant => ({
      id: plant.id,
      name: plant.name || plant.varietyName,
      varietyName: plant.varietyName,
      section: plant.structuredSection,
    })) || [];

  useEffect(() => {
    loadBeds();
  }, []);

  // Auto-show section input if section has content and bed type supports sections
  useEffect(() => {
    if ((section || structuredSection) && shouldShowSectionInput()) {
      setShowSectionInput(true);
    } else if (!shouldShowSectionInput()) {
      // Clear section data and hide input for container types that don't support sections
      setShowSectionInput(false);
      if (section) onSectionChange("");
      if (structuredSection) onStructuredSectionChange(null);
    }
  }, [section, structuredSection, selectedBed]);

  const loadBeds = async () => {
    try {
      setIsLoading(true);
      const activeBeds = await bedService.getActiveBeds();
      setBeds(activeBeds);
    } catch (error) {
      console.error("Failed to load beds:", error);
      toast.error("Failed to load beds");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateContainer = async (data: ContainerFormData) => {
    try {
      setIsCreating(true);
      
      const containerOption = containerOptions[data.containerType];
      
      // For raised beds, always use custom dimensions
      const effectiveSize = data.containerType === "raised-bed" ? "custom" : data.size;
      const sizeOption = containerOption.sizes.find(s => s.value === effectiveSize);
      
      let dimensions;
      if (sizeOption?.dimensions) {
        // Use predefined dimensions
        dimensions = sizeOption.dimensions;
      } else {
        // Use custom dimensions
        if (data.containerType === "raised-bed") {
          dimensions = {
            length: data.customLength || 48,
            width: data.customWidth || 24,
            unit: "inches" as const,
          };
        } else {
          // For pots and grow bags, use diameter as both length and width
          const diameter = data.customDiameter || 12;
          dimensions = {
            length: diameter,
            width: diameter,
            unit: "inches" as const,
          };
        }
      }

      const bedData = {
        name: data.name,
        type: data.containerType === "raised-bed" ? "raised-bed" as const : "container" as const,
        dimensions: {
          ...dimensions,
          unit: dimensions.unit as "inches" | "cm" | "feet" | "mm",
        },
        isActive: true,
      };

      const newBedId = await bedService.addBed(bedData);
      toast.success(`${containerOption.label} created successfully`);
      
      // Reload beds and select the new one
      await loadBeds();
      onBedSelect(newBedId);
      
      // Close form and reset
      setShowCreateContainer(false);
      reset();
    } catch (error) {
      console.error("Failed to create container:", error);
      toast.error("Failed to create container");
    } finally {
      setIsCreating(false);
    }
  };

  const handlePositionSelect = (position: Position) => {
    if (!selectedBed) return;
    
    const newSection: PlantSection = {
      bedId: selectedBed.id,
      position,
    };
    onStructuredSectionChange(newSection);
  };

  const getBedDisplayName = (bed: BedRecord) => {
    const typeEmoji = {
      "raised-bed": "🏗️",
      "container": "🪣", 
      "greenhouse-bench": "🏠",
      "ground-bed": "🌱",
      "other": "📦",
    }[bed.type] || "📦";
    
    return `${typeEmoji} ${bed.name} (${bed.dimensions.length}×${bed.dimensions.width} ${bed.dimensions.unit})`;
  };

  const shouldShowSectionInput = () => {
    if (!selectedBed) return false;
    // Only show section input for raised beds (containers like pots and grow bags are single units)
    return selectedBed.type === "raised-bed";
  };

  const getSectionPlaceholder = () => {
    if (!selectedBed) return "e.g., Row 1, Section A, North End";
    
    switch (selectedBed.type) {
      case "raised-bed":
        return "e.g., Row 1, North Section, 0-24\"";
      case "greenhouse-bench":
        return "e.g., Bench section A, Row 1";
      case "ground-bed":
        return "e.g., North section, Row 1";
      default:
        return "e.g., Section A, Row 1";
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-lg border border-blue-500/20">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <span className="text-lg">🌍</span>
        Where are you planting?
      </h3>

      {/* Indoor/Outdoor Toggle */}
      <div className="flex items-center justify-center space-x-4 p-3 bg-background/50 rounded-lg">
        <span className="text-sm font-medium text-foreground">Indoor</span>
        <Switch
          checked={location}
          onCheckedChange={onLocationChange}
          aria-label="Location toggle between indoor and outdoor"
        />
        <span className="text-sm font-medium text-foreground">Outdoor</span>
      </div>

      {/* Bed/Container Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Bed/Container *
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCreateContainer(!showCreateContainer)}
          >
            {showCreateContainer ? "Cancel" : "+ Add Container"}
          </Button>
        </div>

        {showCreateContainer && (
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    {...register("name")}
                    placeholder="e.g., Tomato Grow Bag, Seed Starting Tray"
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Container Type</label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {Object.entries(containerOptions).map(([key, option]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setValue("containerType", key as any, { shouldValidate: true });
                          // Auto-select "custom" for raised beds since it's the only option
                          if (key === "raised-bed") {
                            setValue("size", "custom", { shouldValidate: true });
                          } else {
                            setValue("size", "", { shouldValidate: true });
                          }
                        }}
                        className={`p-3 border-2 rounded-lg text-left transition-all ${
                          watchedContainerType === key
                            ? "border-accent bg-accent/10"
                            : "border-border hover:border-accent/50"
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">{option.icon}</div>
                          <div className="text-xs font-medium">{option.label}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {errors.containerType && (
                    <p className="text-sm text-red-600 mt-1">{errors.containerType.message}</p>
                  )}
                </div>

                {watchedContainerType && watchedContainerType !== "raised-bed" && (
                  <div>
                    <label className="text-sm font-medium">Size</label>
                    <select
                      {...register("size")}
                      className="w-full p-2 border border-border rounded bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent"
                    >
                      <option value="">Select size</option>
                      {containerOptions[watchedContainerType as keyof typeof containerOptions]?.sizes.map((size) => (
                        <option key={size.value} value={size.value}>
                          {size.label}
                        </option>
                      ))}
                    </select>
                    {errors.size && (
                      <p className="text-sm text-red-600 mt-1">{errors.size.message}</p>
                    )}
                  </div>
                )}

                {watchedContainerType === "raised-bed" && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium text-foreground mb-2">Custom Dimensions</p>
                    <p className="text-xs text-muted-foreground">Enter the dimensions for your raised bed</p>
                  </div>
                )}

                {(watchedSize === "custom" || watchedContainerType === "raised-bed") && (
                  <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium">Dimensions</p>
                    {watchedContainerType === "raised-bed" ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Length (inches)</label>
                          <Input
                            type="number"
                            step="0.1"
                            {...register("customLength", { valueAsNumber: true })}
                            placeholder="48"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Width (inches)</label>
                          <Input
                            type="number"
                            step="0.1"
                            {...register("customWidth", { valueAsNumber: true })}
                            placeholder="24"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="text-sm font-medium">Diameter (inches)</label>
                        <Input
                          type="number"
                          step="0.1"
                          {...register("customDiameter", { valueAsNumber: true })}
                          placeholder="12"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    disabled={isCreating}
                    onClick={handleSubmit(handleCreateContainer)}
                  >
                    {isCreating ? "Creating..." : "Add Container"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateContainer(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <select
          value={selectedBedId || ""}
          onChange={(e) => onBedSelect(e.target.value)}
          className="w-full p-3 border border-border rounded bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent"
        >
          <option value="">
            {isLoading ? "Loading..." : "Select where you're planting"}
          </option>
          {beds.map((bed) => (
            <option key={bed.id} value={bed.id}>
              {getBedDisplayName(bed)}
            </option>
          ))}
        </select>

        {selectedBed && (
          <div className="p-3 bg-muted/30 rounded-lg border border-border">
            <div className="text-sm space-y-1 text-foreground">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Size:</span>
                <span className="font-medium">
                  {selectedBed.dimensions.length} × {selectedBed.dimensions.width} {selectedBed.dimensions.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Area:</span>
                <span className="font-medium">
                  {selectedBed.dimensions.length * selectedBed.dimensions.width} {selectedBed.dimensions.unit}²
                </span>
              </div>
              {!shouldShowSectionInput() && (
                <div className="pt-2 border-t border-border mt-2">
                  <p className="text-xs text-muted-foreground">
                    This {selectedBed.type.replace('-', ' ')} will be used as a single planting unit.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Optional Section Specification - only for beds that support sections */}
      {selectedBed && shouldShowSectionInput() && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="specify-section"
                checked={showSectionInput}
                onChange={(e) => setShowSectionInput(e.target.checked)}
                className="w-4 h-4 text-accent border-border focus:ring-accent"
              />
              <label htmlFor="specify-section" className="text-sm font-medium text-foreground cursor-pointer">
                Specify section/row/area
              </label>
            </div>
            <span className="text-xs text-muted-foreground">
              Leave unchecked to use the whole {selectedBed.type.replace('-', ' ')}
            </span>
          </div>

          {showSectionInput && (
            <div className="space-y-3 p-3 bg-background/50 rounded-lg border border-border">
              <div>
                <label htmlFor="section-input" className="text-sm font-medium text-foreground">
                  Where in this {selectedBed.type.replace('-', ' ')}?
                </label>
                <Input
                  id="section-input"
                  value={section || ""}
                  onChange={(e) => onSectionChange(e.target.value)}
                  placeholder={getSectionPlaceholder()}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Describe the specific area, row, or section you're using
                </p>
              </div>

              {/* Advanced Positioning Toggle */}
              <div className="pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedPositioning(!showAdvancedPositioning)}
                  className="text-xs"
                >
                  {showAdvancedPositioning ? "Hide" : "Show"} advanced positioning
                </Button>

                {showAdvancedPositioning && (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Use advanced positioning for precise succession planting and visual layout
                    </p>
                    
                    <BedLayoutVisualizer
                      bed={selectedBed}
                      currentPlants={currentBedPlants}
                      selectedPosition={structuredSection?.position || null}
                      onPositionSelect={handlePositionSelect}
                      suggestedPositions={[]}
                      spacing={{
                        minSpacing: 4,
                        optimalSpacing: 6,
                        unit: selectedBed.dimensions.unit,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}