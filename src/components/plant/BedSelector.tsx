import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { BedRecord, bedService } from "@/types/database";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

const bedFormSchema = z.object({
  name: z.string().min(1, "Bed name is required"),
  type: z.enum(["raised-bed", "container", "ground-bed", "greenhouse-bench", "other"]),
  length: z.number().min(0.1, "Length must be greater than 0"),
  width: z.number().min(0.1, "Width must be greater than 0"),
  unit: z.enum(["inches", "cm", "feet", "mm"]),
  orientation: z.enum(["north-south", "east-west", "diagonal"]).optional(),
  referencePoint: z.string().optional(),
});

type BedFormSchema = z.infer<typeof bedFormSchema>;

interface BedSelectorProps {
  selectedBedId?: string;
  onBedSelect: (bedId: string) => void;
  onBedChange: (bed: BedRecord | null) => void;
}

export function BedSelector({ selectedBedId, onBedSelect, onBedChange }: BedSelectorProps) {
  const [beds, setBeds] = useState<BedRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BedFormSchema>({
    resolver: zodResolver(bedFormSchema),
    defaultValues: {
      type: "raised-bed",
      unit: "inches",
      orientation: "north-south",
    },
  });

  useEffect(() => {
    loadBeds();
  }, []);

  useEffect(() => {
    if (selectedBedId) {
      const selectedBed = beds.find(bed => bed.id === selectedBedId);
      onBedChange(selectedBed || null);
    } else {
      onBedChange(null);
    }
  }, [selectedBedId, beds, onBedChange]);

  const loadBeds = async () => {
    try {
      setIsLoading(true);
      const activeBeds = await bedService.getActiveBeds();
      setBeds(activeBeds);
      return activeBeds;
    } catch (error) {
      console.error("Failed to load beds:", error);
      toast.error("Failed to load beds");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBed = async (data: BedFormSchema) => {
    try {
      setIsCreating(true);
      const bedData = {
        name: data.name,
        type: data.type,
        dimensions: {
          length: data.length,
          width: data.width,
          unit: data.unit,
        },
        orientation: data.orientation,
        referencePoint: data.referencePoint,
        isActive: true,
      };

      const newBedId = await bedService.addBed(bedData);
      toast.success("Bed created successfully");
      
      // Reload beds and select the new one
      await loadBeds();
      onBedSelect(newBedId);
      
      // Close form and reset
      setShowCreateForm(false);
      reset();
    } catch (error) {
      console.error("Failed to create bed:", error);
      toast.error("Failed to create bed");
    } finally {
      setIsCreating(false);
    }
  };

  const bedTypeOptions = [
    { value: "raised-bed", label: "Raised Bed", icon: "🏗️" },
    { value: "container", label: "Container", icon: "🪣" },
    { value: "ground-bed", label: "Ground Bed", icon: "🌱" },
    { value: "greenhouse-bench", label: "Greenhouse Bench", icon: "🏠" },
    { value: "other", label: "Other", icon: "📦" },
  ];

  const unitOptions = [
    { value: "inches", label: "Inches" },
    { value: "feet", label: "Feet" },
    { value: "cm", label: "Centimeters" },
    { value: "mm", label: "Millimeters" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Bed/Container
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowCreateForm(!showCreateForm);
          }}
        >
          {showCreateForm ? "Cancel" : "+ Create Bed"}
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Bed Name</label>
                <Input
                  {...register("name")}
                  placeholder="e.g., Raised Bed 1, Greenhouse Bench A"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Bed Type</label>
                <select
                  {...register("type")}
                  className="w-full p-2 border border-border rounded bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent"
                >
                  {bedTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Length</label>
                  <Input
                    type="number"
                    step="0.1"
                    {...register("length", { valueAsNumber: true })}
                    placeholder="108"
                    className={errors.length ? "border-red-500" : ""}
                  />
                  {errors.length && (
                    <p className="text-sm text-red-600 mt-1">{errors.length.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Width</label>
                  <Input
                    type="number"
                    step="0.1"
                    {...register("width", { valueAsNumber: true })}
                    placeholder="24"
                    className={errors.width ? "border-red-500" : ""}
                  />
                  {errors.width && (
                    <p className="text-sm text-red-600 mt-1">{errors.width.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Unit</label>
                <select
                  {...register("unit")}
                  className="w-full p-2 border border-border rounded bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent"
                >
                  {unitOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.unit && (
                  <p className="text-sm text-red-600 mt-1">{errors.unit.message}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Reference Point (Optional)</label>
                <Input
                  {...register("referencePoint")}
                  placeholder="e.g., northwest corner, drainage end"
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  type="button" 
                  disabled={isCreating}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSubmit(handleCreateBed)();
                  }}
                >
                  {isCreating ? "Creating..." : "Create Bed"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowCreateForm(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <select
          value={selectedBedId || ""}
          onChange={(e) => onBedSelect(e.target.value)}
          className="w-full p-2 border border-border rounded bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent"
        >
          <option value="">
            {isLoading ? "Loading beds..." : "Select a bed"}
          </option>
          {beds.map((bed) => (
            <option key={bed.id} value={bed.id}>
              {bedTypeOptions.find(option => option.value === bed.type)?.icon || "📦"} {bed.name} ({bed.dimensions.length} × {bed.dimensions.width} {bed.dimensions.unit})
            </option>
          ))}
        </select>
      </div>

      {selectedBedId && (
        <div className="p-3 bg-muted/50 rounded-lg border border-border">
          {(() => {
            const bed = beds.find(b => b.id === selectedBedId);
            if (!bed) return null;
            
            const totalArea = bed.dimensions.length * bed.dimensions.width;
            return (
              <div className="text-sm space-y-1 text-foreground">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dimensions:</span>
                  <span className="font-medium">
                    {bed.dimensions.length} × {bed.dimensions.width} {bed.dimensions.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Area:</span>
                  <span className="font-medium">{totalArea} {bed.dimensions.unit}²</span>
                </div>
                {bed.orientation && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Orientation:</span>
                    <span className="font-medium">{bed.orientation}</span>
                  </div>
                )}
                {bed.referencePoint && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference:</span>
                    <span className="font-medium">{bed.referencePoint}</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}