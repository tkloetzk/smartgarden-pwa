// src/pages/plants/EditPlant.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { varietyService, VarietyRecord } from "@/types/database";
import { SimplifiedLocationSelector } from "@/components/plant/SimplifiedLocationSelector";
import toast from "react-hot-toast";
import SoilMixtureSelector from "@/components/plant/SoilMixtureSelector";
import ReminderPreferencesSection from "@/components/plant/ReminderPreferencesSection";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PlantSection, PlantRecord } from "@/types";
import { ArrowLeft } from "lucide-react";
import { dateToLocalDateString } from "@/utils/dateUtils";
import { FirebasePlantService } from "@/services/firebase/plantService";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

const plantEditSchema = z.object({
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
  soilMix: z.string().min(1, "Please select a soil mixture"),
  notes: z.string().optional(),
});

type PlantEditFormData = z.infer<typeof plantEditSchema>;

export default function EditPlant() {
  const { plantId } = useParams<{ plantId: string }>();
  const navigate = useNavigate();
  const { plants, updatePlant, loading: plantsLoading } = useFirebasePlants();
  const { user } = useFirebaseAuth();
  
  const [plant, setPlant] = useState<PlantRecord | null>(null);
  const [varieties, setVarieties] = useState<VarietyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
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
    formState: { errors, isValid },
  } = useForm<PlantEditFormData>({
    resolver: zodResolver(plantEditSchema),
    mode: "onChange",
  });


  // Load plant data and varieties
  useEffect(() => {
    const loadData = async () => {
      if (!plantId) {
        navigate("/plants");
        return;
      }

      try {
        setIsLoadingData(true);
        
        // Find the plant
        if (!plantsLoading && plants) {
          const foundPlant = plants.find(p => p.id === plantId);
          if (!foundPlant) {
            toast.error("Plant not found");
            navigate("/plants");
            return;
          }
          
          setPlant(foundPlant);
          
          // Pre-fill form with existing plant data
          setValue("varietyId", foundPlant.varietyId);
          setValue("name", foundPlant.name || "");
          setValue("plantedDate", dateToLocalDateString(foundPlant.plantedDate));
          setValue("location", foundPlant.location === "Outdoor");
          setValue("selectedBedId", foundPlant.structuredSection?.bedId || "");
          setValue("section", foundPlant.section || "");
          setValue("soilMix", foundPlant.soilMix || "");
          setValue("notes", Array.isArray(foundPlant.notes) ? foundPlant.notes.join("\n") : foundPlant.notes || "");
          
          if (foundPlant.structuredSection) {
            setStructuredSection(foundPlant.structuredSection);
          }
          
          if (foundPlant.reminderPreferences) {
            setReminderPreferences({
              watering: foundPlant.reminderPreferences.watering ?? true,
              fertilizing: foundPlant.reminderPreferences.fertilizing ?? true,
              observation: foundPlant.reminderPreferences.observation ?? true,
              lighting: foundPlant.reminderPreferences.lighting ?? true,
              pruning: foundPlant.reminderPreferences.pruning ?? true,
            });
          }
        }

        // Load varieties
        const varietyData = await varietyService.getAllVarieties();
        setVarieties(varietyData);
        
      } catch (error) {
        console.error("Failed to load plant data:", error);
        toast.error("Failed to load plant data");
        navigate("/plants");
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [plantId, plants, plantsLoading, navigate, setValue]);

  const handleFormSubmit = async (data: PlantEditFormData) => {
    if (!plant || !user) return;

    try {
      setIsLoading(true);
      setSubmitError(null);

      const updatedPlantData = {
        ...plant,
        varietyId: data.varietyId,
        varietyName: varieties.find(v => v.id === data.varietyId)?.name || plant.varietyName,
        name: data.name,
        plantedDate: new Date(data.plantedDate),
        location: data.location ? "Outdoor" : "Indoor",
        section: data.section,
        structuredSection: structuredSection || undefined,
        soilMix: data.soilMix,
        notes: data.notes ? [data.notes] : undefined,
        reminderPreferences,
      };

      await updatePlant(plant.id, updatedPlantData);
      
      // Regenerate scheduled tasks with the updated plant data
      try {
        const finalPlantRecord = { ...updatedPlantData, id: plant.id };
        await FirebasePlantService.regenerateTasksForPlant(finalPlantRecord, user.uid);
        console.log(`✅ Tasks regenerated for updated plant ${plant.id}`);
      } catch (taskError) {
        console.error("Failed to regenerate tasks:", taskError);
        // Don't fail the plant update if task regeneration fails
      }
      
      toast.success("Plant updated successfully! 🌱");
      navigate(`/plants/${plant.id}`);
    } catch (error) {
      console.error("Failed to update plant:", error);
      setSubmitError("Failed to update plant. Please try again.");
      toast.error("Failed to update plant");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/plants/${plant?.id || ""}`);
  };

  const handleBedSelect = (bedId: string) => {
    setValue("selectedBedId", bedId);
  };

  const handleSectionChange = (section: string) => {
    setValue("section", section);
  };

  const handleStructuredSectionChange = (section: PlantSection | null) => {
    setStructuredSection(section);
  };

  const handleLocationChange = (isOutdoor: boolean) => {
    setValue("location", isOutdoor);
  };

  if (isLoadingData || plantsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Plant not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Edit Plant
              </h1>
              <p className="text-sm text-muted-foreground">
                Update plant information and settings
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {submitError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-600">{submitError}</p>
              </CardContent>
            </Card>
          )}

          {/* Basic Plant Information */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Plant Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Variety *
                  </label>
                  <select
                    {...register("varietyId")}
                    className="w-full p-3 border border-border rounded bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent"
                    disabled={isLoading}
                  >
                    <option value="">Select variety</option>
                    {varieties.map((variety) => (
                      <option key={variety.id} value={variety.id}>
                        {variety.name}
                      </option>
                    ))}
                  </select>
                  {errors.varietyId && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.varietyId.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Custom Name (optional)
                  </label>
                  <Input
                    {...register("name")}
                    placeholder="e.g., My favorite tomato plant"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave blank to use variety name
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Planting Date *
                  </label>
                  <Input
                    type="date"
                    {...register("plantedDate")}
                    disabled={isLoading}
                  />
                  {errors.plantedDate && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.plantedDate.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <SimplifiedLocationSelector
            selectedBedId={watch("selectedBedId")}
            section={watch("section")}
            structuredSection={structuredSection || undefined}
            location={watch("location")}
            onBedSelect={handleBedSelect}
            onSectionChange={handleSectionChange}
            onStructuredSectionChange={handleStructuredSectionChange}
            onLocationChange={handleLocationChange}
          />

          {/* Soil Mix */}
          <SoilMixtureSelector
            selectedMixture={watch("soilMix")}
            onMixtureChange={(mix: string) => setValue("soilMix", mix)}
          />

          {/* Reminder Preferences */}
          <Card>
            <CardContent className="p-6">
              <ReminderPreferencesSection
                preferences={reminderPreferences}
                onChange={setReminderPreferences}
              />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Notes</h2>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Additional Notes (optional)
                </label>
                <textarea
                  {...register("notes")}
                  rows={3}
                  className="w-full p-3 border border-border rounded bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent resize-vertical"
                  placeholder="Any additional information about this plant..."
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? "Updating..." : "Update Plant"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}