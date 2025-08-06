import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { BedRecord, bedService } from "@/types/database";
import { PlantSection, Position } from "@/types";
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
  const { plants, loading: plantsLoading } = useFirebasePlants();
  const [beds, setBeds] = useState<BedRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSectionInput, setShowSectionInput] = useState(false);
  const [showAdvancedPositioning, setShowAdvancedPositioning] = useState(false);
  const [advancedMode, setAdvancedMode] = useState<"visual" | "custom">("visual");
  const [customGridRows, setCustomGridRows] = useState<number>(3);
  const [customGridCols, setCustomGridCols] = useState<number>(4);
  const [selectedCustomPosition, setSelectedCustomPosition] = useState<{row: number, col: number} | null>(null);
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

  const selectedBed = beds?.find(bed => bed.id === selectedBedId);

  // Filter plants for the current bed and format for visualizer
  const currentBedPlants = (plants || [])
    .filter(plant => plant.structuredSection?.bedId === selectedBedId)
    .map(plant => ({
      id: plant.id,
      name: plant.name || plant.varietyName,
      varietyName: plant.varietyName,
      section: plant.structuredSection,
    }));

  const loadBeds = useCallback(async () => {
    // Don't load if plants are still loading
    if (plantsLoading) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Get beds from IndexedDB
      const activeBeds = await bedService.getActiveBeds();
      
      // Get existing containers from Firebase plants and analyze their properties
      const containerMap = new Map<string, { hasStructuredSections: boolean, dimensions?: any }>();
      
      if (plants && plants.length > 0) {
        plants.forEach(plant => {
          if (plant.container && plant.container.trim()) {
            const containerName = plant.container;
            if (!containerMap.has(containerName)) {
              containerMap.set(containerName, { hasStructuredSections: false });
            }
            
            // Check if this container has plants with structured sections (indicating it's a raised bed)
            if (plant.structuredSection) {
              const containerInfo = containerMap.get(containerName)!;
              containerInfo.hasStructuredSections = true;
              containerMap.set(containerName, containerInfo);
            }
          }
        });
      }
      
      // Convert existing containers to bed format for compatibility
      const containerBeds: BedRecord[] = Array.from(containerMap.entries()).map(([containerName, info]) => ({
        id: `firebase-${containerName.toLowerCase().replace(/\s+/g, '-')}`,
        name: containerName,
        // If container has structured sections, treat it as a raised-bed, otherwise as a container
        type: info.hasStructuredSections ? 'raised-bed' as const : 'container' as const,
        dimensions: {
          length: info.hasStructuredSections ? 48 : 12, // Larger default for raised beds
          width: info.hasStructuredSections ? 24 : 12,   // Larger default for raised beds
          unit: 'inches' as const,
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      
      // Combine IndexedDB beds with Firebase containers
      const allBeds = [...activeBeds, ...containerBeds];
      setBeds(allBeds);
      
    } catch (error) {
      console.error("Failed to load beds:", error);
      toast.error("Failed to load beds");
    } finally {
      setIsLoading(false);
    }
  }, [plants, plantsLoading]);

  useEffect(() => {
    loadBeds();
  }, [loadBeds]);

  // Auto-show section input if section has content and bed type supports sections
  useEffect(() => {
    const shouldShow = selectedBed?.type === "raised-bed";
    if ((section || structuredSection) && shouldShow) {
      setShowSectionInput(true);
    } else if (!shouldShow) {
      // Clear section data and hide input for container types that don't support sections
      setShowSectionInput(false);
      if (section) onSectionChange("");
      if (structuredSection) onStructuredSectionChange(null);
    }
  }, [section, structuredSection, selectedBed, onSectionChange, onStructuredSectionChange]);

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

  const handleCustomGridPositionSelect = (row: number, col: number) => {
    setSelectedCustomPosition({ row, col });
    
    // Convert to section description
    const sectionDescription = `Row ${row + 1}, Column ${col + 1}`;
    onSectionChange(sectionDescription);
    
    // Also create a structured section for this custom grid position
    if (selectedBed) {
      const bedWidth = selectedBed.dimensions.width;
      const bedLength = selectedBed.dimensions.length;
      
      // Calculate position within the bed based on custom grid
      const sectionWidth = bedWidth / customGridCols;
      const sectionLength = bedLength / customGridRows;
      const startPosition = (row * sectionLength) + (col * sectionWidth);
      
      const newSection: PlantSection = {
        bedId: selectedBed.id,
        position: { 
          start: startPosition, 
          length: sectionLength, 
          width: sectionWidth,
          unit: selectedBed.dimensions.unit 
        },
        row: row + 1,
        column: col + 1,
        description: sectionDescription,
      };
      onStructuredSectionChange(newSection);
    }
  };

  const renderCustomGrid = () => {
    if (!selectedBed) return null;

    const bedWidth = selectedBed.dimensions.width;
    const bedLength = selectedBed.dimensions.length;
    const sectionWidth = bedWidth / customGridCols;
    const sectionLength = bedLength / customGridRows;
    const unit = selectedBed.dimensions.unit;

    const grid = [];
    for (let row = 0; row < customGridRows; row++) {
      const rowCells = [];
      for (let col = 0; col < customGridCols; col++) {
        const isSelected = selectedCustomPosition?.row === row && selectedCustomPosition?.col === col;
        const isOccupied = currentBedPlants.some(plant => 
          plant.section?.row === row + 1 && plant.section?.column === col + 1
        );
        
        // Format dimensions for display
        const formatDimension = (value: number) => {
          return value % 1 === 0 ? value.toString() : value.toFixed(1);
        };

        // Use abbreviated units for mobile display
        const getUnitSymbol = (unit: string) => {
          switch (unit) {
            case "inches": return '"';
            case "feet": return "'";
            case "cm": return "cm";
            case "mm": return "mm";
            default: return unit;
          }
        };

        const dimensionText = `${formatDimension(sectionLength)}×${formatDimension(sectionWidth)}${getUnitSymbol(unit)}`;
        
        rowCells.push(
          <button
            key={`${row}-${col}`}
            type="button"
            onClick={() => handleCustomGridPositionSelect(row, col)}
            className={`
              border-2 rounded-lg transition-all text-xs font-medium p-2 min-h-[60px] flex flex-col items-center justify-center
              ${isSelected 
                ? "border-accent bg-accent/20 text-accent" 
                : isOccupied
                  ? "border-orange-400 bg-orange-50 text-orange-600"
                  : "border-border hover:border-accent/50 hover:bg-accent/5"
              }
            `}
            title={isOccupied ? `Occupied - ${dimensionText}` : `Row ${row + 1}, Col ${col + 1} - ${dimensionText}`}
          >
            <div className="text-center">
              <div className="font-semibold">
                {isOccupied ? "🌱" : `${row + 1},${col + 1}`}
              </div>
              <div className={`text-[10px] mt-1 ${isOccupied ? "text-orange-500" : "text-muted-foreground"}`}>
                {dimensionText}
              </div>
            </div>
          </button>
        );
      }
      grid.push(
        <div key={row} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${customGridCols}, 1fr)` }}>
          {rowCells}
        </div>
      );
    }
    return grid;
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

  const shouldShowSectionInput = useCallback(() => {
    if (!selectedBed) return false;
    // Only show section input for raised beds (containers like pots and grow bags are single units)
    return selectedBed.type === "raised-bed";
  }, [selectedBed]);

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
                          setValue("containerType", key as "grow-bag" | "pot" | "raised-bed", { shouldValidate: true });
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
          disabled={isLoading || plantsLoading}
        >
          <option value="">
            {isLoading || plantsLoading ? "Loading..." : "Select where you're planting"}
          </option>
          {(beds || []).map((bed) => (
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
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Choose your positioning method
                      </p>
                      <div className="flex bg-muted rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => setAdvancedMode("visual")}
                          className={`px-3 py-1 text-xs rounded-md transition-all ${
                            advancedMode === "visual"
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Visual Grid
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdvancedMode("custom")}
                          className={`px-3 py-1 text-xs rounded-md transition-all ${
                            advancedMode === "custom"
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Custom Grid
                        </button>
                      </div>
                    </div>

                    {advancedMode === "visual" ? (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Click on the grid to place your plant precisely
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
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                          Create your own grid layout for organized planting
                        </p>
                        
                        {/* Grid Size Controls */}
                        <div className="flex gap-4 items-center p-3 bg-background/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-medium">Rows:</label>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={customGridRows}
                              onChange={(e) => setCustomGridRows(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                              className="w-16 h-8 text-xs"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-medium">Columns:</label>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={customGridCols}
                              onChange={(e) => setCustomGridCols(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                              className="w-16 h-8 text-xs"
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {customGridRows} × {customGridCols} = {customGridRows * customGridCols} sections
                          </div>
                        </div>

                        {/* Grid Dimensions Summary */}
                        {selectedBed && (() => {
                          const getUnitSymbol = (unit: string) => {
                            switch (unit) {
                              case "inches": return '"';
                              case "feet": return "'";
                              case "cm": return "cm";
                              case "mm": return "mm";
                              default: return unit;
                            }
                          };
                          
                          const formatDimension = (value: number) => {
                            return value % 1 === 0 ? value.toString() : value.toFixed(1);
                          };
                          
                          const sectionLength = selectedBed.dimensions.length / customGridRows;
                          const sectionWidth = selectedBed.dimensions.width / customGridCols;
                          const unitSymbol = getUnitSymbol(selectedBed.dimensions.unit);
                          
                          return (
                            <div className="p-2 bg-muted/30 rounded-lg text-xs">
                              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                                <div>
                                  <span className="font-medium">Bed Size:</span> {selectedBed.dimensions.length}×{selectedBed.dimensions.width}{unitSymbol}
                                </div>
                                <div>
                                  <span className="font-medium">Section Size:</span> {formatDimension(sectionLength)}×{formatDimension(sectionWidth)}{unitSymbol}
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Custom Grid */}
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-foreground">Click a section to select:</p>
                          <div className="p-3 bg-background/30 rounded-lg border">
                            <div className="space-y-2">
                              {renderCustomGrid()}
                            </div>
                          </div>
                        </div>

                        {/* Selected Position Display */}
                        {selectedCustomPosition && (
                          <div className="p-2 bg-accent/10 rounded-lg border border-accent/20">
                            <p className="text-xs font-medium text-accent">
                              Selected: Row {selectedCustomPosition.row + 1}, Column {selectedCustomPosition.col + 1}
                            </p>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>• Numbers show row,column positions</p>
                          <p>• Dimensions show length×width for each section</p>
                          <p>• 🌱 indicates occupied sections</p>
                          <p>• Click any section to plant there</p>
                        </div>
                      </div>
                    )}
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