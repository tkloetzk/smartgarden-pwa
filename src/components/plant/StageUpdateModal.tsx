// Create new file: src/components/plant/StageUpdateModal.tsx

import React from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { PlantRecord } from "@/types/database";
import { GrowthStage } from "@/types";
import { visualCues } from "@/data/visualCues";
import { getNextStage } from "@/utils/growthStage";

interface StageUpdateModalProps {
  plant: PlantRecord;
  currentStage: GrowthStage;
  isOpen: boolean;
  onConfirm: (newStage: GrowthStage) => void;
  onClose: () => void;
}

export const StageUpdateModal: React.FC<StageUpdateModalProps> = ({
  plant,
  currentStage,
  isOpen,
  onConfirm,
  onClose,
}) => {
  const nextStage = getNextStage(currentStage);
  const cues = (plant.varietyName &&
    nextStage &&
    visualCues[plant.varietyName]?.[nextStage]) || [
    "No specific visual cues available for this stage. Please refer to general knowledge for this variety.",
  ];

  const handleConfirm = () => {
    if (nextStage) {
      onConfirm(nextStage);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Update Growth Stage</DialogTitle>
          <p className="text-muted-foreground">
            Is your "{plant.name || plant.varietyName}" ready for the next
            stage?
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-muted-foreground">
                Current Stage:
              </span>
              <Badge variant="secondary" className="capitalize">
                {currentStage.replace("-", " ")}
              </Badge>
            </div>
            {nextStage && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground">
                  Next Stage:
                </span>
                <Badge className="capitalize bg-emerald-600 text-white">
                  {nextStage.replace("-", " ")}
                </Badge>
              </div>
            )}
          </div>

          {nextStage ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <h4 className="font-semibold mb-2 text-emerald-800 dark:text-emerald-200">
                Look for these signs for the '{nextStage.replace("-", " ")}'
                stage:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-emerald-700 dark:text-emerald-300">
                {cues.map((cue, index) => (
                  <li key={index}>{cue}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-center">
              <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                Your plant is in its final growth stage!
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {nextStage && (
              <Button
                onClick={handleConfirm}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Yes, Confirm '{nextStage.replace("-", " ")}' Stage
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
