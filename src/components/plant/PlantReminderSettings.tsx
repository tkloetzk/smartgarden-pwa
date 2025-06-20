// Create src/components/plant/PlantReminderSettings.tsx
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { plantService, PlantRecord } from "@/types/database";
import ReminderPreferencesSection from "./ReminderPreferencesSection";
import toast from "react-hot-toast";

interface PlantReminderSettingsProps {
  plant: PlantRecord;
  onUpdate: (updatedPlant: PlantRecord) => void;
}

const PlantReminderSettings = ({
  plant,
  onUpdate,
}: PlantReminderSettingsProps) => {
  const [preferences, setPreferences] = useState(
    plant.reminderPreferences || {
      watering: true,
      fertilizing: true,
      observation: true,
      lighting: true,
      pruning: true,
    }
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);

      await plantService.updatePlant(plant.id, {
        reminderPreferences: preferences,
        updatedAt: new Date(),
      });

      const updatedPlant = {
        ...plant,
        reminderPreferences: preferences,
      };

      onUpdate(updatedPlant);
      toast.success("Reminder preferences updated!");
    } catch (error) {
      console.error("Failed to update reminder preferences:", error);
      toast.error("Failed to update preferences");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ReminderPreferencesSection
        preferences={preferences}
        onChange={setPreferences}
      />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading} className="min-w-24">
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default PlantReminderSettings;
