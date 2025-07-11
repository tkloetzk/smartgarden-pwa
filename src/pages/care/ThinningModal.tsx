// src/components/plant/ThinningModal.tsx
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ThinningReason } from "@/types";
import { PlantRecord } from "@/types/database";

interface ThinningModalProps {
  plant: PlantRecord;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: {
    finalCount: number;
    reason: ThinningReason;
    notes: string;
  }) => void;
}

const ThinningModal = ({
  plant,
  isOpen,
  onClose,
  onSubmit,
}: ThinningModalProps) => {
  const [finalCount, setFinalCount] = useState(plant.currentPlantCount || 1);
  const [reason, setReason] = useState<ThinningReason>("overcrowding");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    onSubmit?.({
      finalCount,
      reason,
      notes,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Thin {plant.varietyName}</span>
            <Button variant="outline" size="sm" onClick={onClose}>
              ✕
            </Button>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Reduce from{" "}
            {plant.currentPlantCount || plant.originalPlantCount || 1} plants
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label
              htmlFor="final-count"
              className="text-sm font-medium block mb-2"
            >
              New Plant Count
            </label>
            <Input
              id="final-count"
              type="number"
              value={finalCount}
              onChange={(e) => setFinalCount(parseInt(e.target.value))}
              max={plant.currentPlantCount || plant.originalPlantCount || 1}
              min={1}
            />
          </div>

          <div>
            <label
              htmlFor="thinning-reason"
              className="text-sm font-medium block mb-2"
            >
              Reason for Thinning
            </label>
            <select
              id="thinning-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as ThinningReason)}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="overcrowding">Overcrowding</option>
              <option value="weak-seedlings">Remove Weak Seedlings</option>
              <option value="succession-planning">Succession Planning</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="thinning-notes"
              className="text-sm font-medium block mb-2"
            >
              Notes (optional)
            </label>
            <Input
              id="thinning-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you remove? How are the remaining plants?"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={finalCount >= (plant.currentPlantCount || 1)}
              className="flex-1"
            >
              Log Thinning
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThinningModal;
