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

      // Clear success status after 3 seconds
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Failed to update reminder preferences:", error);
      setSaveStatus("error");
      toast.error("Failed to update preferences");

      // Clear error status after 5 seconds
      setTimeout(() => setSaveStatus("idle"), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if preferences have changed from original
  const hasChanges =
    JSON.stringify(preferences) !==
    JSON.stringify(
      plant.reminderPreferences || {
        watering: true,
        fertilizing: true,
        observation: true,
        lighting: true,
        pruning: true,
      }
    );

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Saving...
        </div>
      );
    }

    if (saveStatus === "success") {
      return (
        <div className="flex items-center gap-2">
          <span className="text-green-600">✓</span>
          Saved Successfully!
        </div>
      );
    }

    if (saveStatus === "error") {
      return (
        <div className="flex items-center gap-2">
          <span className="text-red-600">✗</span>
          Save Failed - Retry
        </div>
      );
    }

    return hasChanges ? "Save Changes" : "No Changes";
  };

  const getButtonVariant = () => {
    if (saveStatus === "success") return "outline";
    if (saveStatus === "error") return "destructive";
    return hasChanges ? "primary" : "outline";
  };

  return (
    <div className="space-y-6">
      <ReminderPreferencesSection
        preferences={preferences}
        onChange={setPreferences}
      />

      {/* Save Status Message */}
      {saveStatus !== "idle" && (
        <div
          className={`p-3 rounded-lg text-sm font-medium ${
            saveStatus === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {saveStatus === "success" && (
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Your reminder preferences have been updated successfully!
            </div>
          )}
          {saveStatus === "error" && (
            <div className="flex items-center gap-2">
              <span className="text-red-600">⚠️</span>
              Failed to save your preferences. Please try again.
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isLoading || !hasChanges}
          variant={getButtonVariant()}
          // className={`min-w-32 transition-all duration-300 ${
          //   saveStatus === "success"
          //     ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
          //     : saveStatus === "error"
          //     ? "bg-red-500 hover:bg-red-600"
          //     : hasChanges
          //     ? "shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30"
          //     : "opacity-60 cursor-not-allowed"
          // }`}
        >
          {getButtonContent()}
        </Button>
      </div>

      {/* Changes Indicator */}
      {hasChanges && saveStatus === "idle" && (
        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2 text-center">
          <span className="mr-1">⚠️</span>
          You have unsaved changes
        </div>
      )}
    </div>
  );
};

export default PlantReminderSettings;
