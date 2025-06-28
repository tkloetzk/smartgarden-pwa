// Create new file: src/components/plant/StageUpdateModal.tsx

import React from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PlantRecord } from "@/types/database";
import { GrowthStage } from "@/types/core";
import { visualCues } from "@/data/visualCues";
import { getNextStage } from "@/utils/growthStage"; // We will create/update this utility next

interface StageUpdateModalProps {
  plant: PlantRecord;
  currentStage: GrowthStage;
  onConfirm: (newStage: GrowthStage) => void;
  onClose: () => void;
}

export const StageUpdateModal: React.FC<StageUpdateModalProps> = ({
  plant,
  currentStage,
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-xl">Update Growth Stage</CardTitle>
          <p className="text-muted-foreground">
            Is your "{plant.name || plant.varietyName}" ready for the next
            stage?
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-muted-foreground">
                Current Stage:
              </span>
              <Badge variant="secondary" className="capitalize">
                {currentStage.replace("-", " ")}
              </Badge>
            </div>
            {nextStage && (
              <div className="flex items-center gap-2 mt-2">
                <span className="font-medium text-muted-foreground">
                  Next Stage:
                </span>
                <Badge className="capitalize">
                  {nextStage.replace("-", " ")}
                </Badge>
              </div>
            )}
          </div>

          {nextStage ? (
            <div className="p-4 bg-muted/50 dark:bg-muted/30 border border-border rounded-lg">
              <h4 className="font-semibold mb-2 text-foreground">
                Look for these signs for the '{nextStage.replace("-", " ")}'
                stage:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {cues.map((cue, index) => (
                  <li key={index}>{cue}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-center">
              <p className="font-semibold text-green-800 dark:text-green-200">
                Your plant is in its final growth stage!
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {nextStage && (
              <Button onClick={handleConfirm}>
                Yes, Confirm '{nextStage.replace("-", " ")}' Stage
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
