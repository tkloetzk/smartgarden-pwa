// src/components/plant/PlantReminderSettings.tsx
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { plantService, PlantRecord } from "@/types/database";
import ReminderPreferencesSection from "./ReminderPreferencesSection";
import toast from "react-hot-toast";

interface PlantReminderSettingsProps {
  plant: PlantRecord;
  onUpdate: (updatedPlant: PlantRecord) => void;
}

// Define the complete ReminderPreferences type to match what ReminderPreferencesSection expects
interface ReminderPreferences {
  watering: boolean;
  fertilizing: boolean;
  observation: boolean;
  lighting: boolean;
  pruning: boolean;
}

const PlantReminderSettings = ({
  plant,
  onUpdate,
}: PlantReminderSettingsProps) => {
  // Ensure all properties are defined as booleans (no undefined values)
  const [preferences, setPreferences] = useState<ReminderPreferences>({
    watering: plant.reminderPreferences?.watering ?? true,
    fertilizing: plant.reminderPreferences?.fertilizing ?? true,
    observation: plant.reminderPreferences?.observation ?? true,
    lighting: plant.reminderPreferences?.lighting ?? true,
    pruning: plant.reminderPreferences?.pruning ?? true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setSaveStatus("idle");

      await plantService.updatePlant(plant.id, {
        reminderPreferences: preferences,
        updatedAt: new Date(),
      });

      const updatedPlant = {
        ...plant,
        reminderPreferences: preferences,
      };

      onUpdate(updatedPlant);
      setSaveStatus("success");
      toast.success("Reminder preferences updated!");
    } catch (error) {
      console.error("Failed to update preferences:", error);
      setSaveStatus("error");
      toast.error("Failed to update preferences");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if preferences have changed from initial values
  const hasChanges =
    preferences.watering !== (plant.reminderPreferences?.watering ?? true) ||
    preferences.fertilizing !==
      (plant.reminderPreferences?.fertilizing ?? true) ||
    preferences.observation !==
      (plant.reminderPreferences?.observation ?? true) ||
    preferences.lighting !== (plant.reminderPreferences?.lighting ?? true) ||
    preferences.pruning !== (plant.reminderPreferences?.pruning ?? true);

  return (
    <div className="space-y-6">
      <ReminderPreferencesSection
        preferences={preferences}
        onChange={setPreferences}
      />

      <div className="flex gap-4 pt-4">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
          variant={hasChanges ? "primary" : "outline"}
          className="flex-1"
        >
          {isLoading ? "Saving..." : hasChanges ? "Save Changes" : "No Changes"}
        </Button>
      </div>

      {saveStatus === "success" && (
        <p className="text-sm text-emerald-600">
          ✓ Preferences saved successfully
        </p>
      )}
      {saveStatus === "error" && (
        <p className="text-sm text-red-600">✗ Failed to save preferences</p>
      )}
    </div>
  );
};

export default PlantReminderSettings;
