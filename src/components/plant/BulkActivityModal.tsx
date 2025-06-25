// src/components/plant/BulkActivityModal.tsx (FIXED)
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useFirebaseCareActivities } from "@/hooks/useFirebaseCareActivities";
import { toast } from "react-hot-toast";

interface BulkActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantIds: string[];
  activityType: string;
  plantCount: number;
  varietyName: string;
}

const BulkActivityModal = ({
  isOpen,
  onClose,
  plantIds,
  activityType,
  plantCount,
  varietyName,
}: BulkActivityModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState("20");
  const [notes, setNotes] = useState("");

  const { logActivity } = useFirebaseCareActivities();

  const isIndividual = plantCount === 1;
  const modalTitle = isIndividual
    ? `${
        activityType === "water"
          ? "💧 Water Plant"
          : activityType === "fertilize"
          ? "🌱 Fertilize Plant"
          : "👁️ Inspect Plant"
      }`
    : `${
        activityType === "water"
          ? "💧 Water All Plants"
          : activityType === "fertilize"
          ? "🌱 Fertilize All Plants"
          : "👁️ Inspect All Plants"
      }`;

  const buttonText = isIndividual
    ? `Log ${
        activityType === "water"
          ? "Watering"
          : activityType === "fertilize"
          ? "Fertilizing"
          : "Inspection"
      }`
    : `Log Activity for All ${plantCount} Plants`;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      for (const plantId of plantIds) {
        let details: any = { notes };

        if (activityType === "water") {
          details = {
            type: "water",
            amount: { value: parseFloat(amount), unit: "oz" },
            notes,
          };
        } else if (activityType === "fertilize") {
          details = {
            type: "fertilize",
            product: "General fertilizer",
            dilution: "1:10",
            amount: amount,
            notes,
          };
        } else if (activityType === "observe") {
          details = {
            type: "observe",
            healthAssessment: "good",
            observations: notes || "Routine inspection",
            notes,
          };
        }

        await logActivity({
          plantId,
          type: activityType as any,
          date: new Date(),
          details,
        });
      }

      const successMessage = isIndividual
        ? `${
            activityType === "water"
              ? "Watering"
              : activityType === "fertilize"
              ? "Fertilizing"
              : "Inspection"
          } logged successfully! 🌱`
        : `Activity logged for all ${plantCount} ${varietyName} plants! 🌱`;

      toast.success(successMessage);
      onClose();
    } catch (error) {
      toast.error("Failed to log activities");
      console.error("Activity logging error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{modalTitle}</span>
            <Button variant="outline" size="sm" onClick={onClose}>
              ✕
            </Button>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isIndividual
              ? `Logging for ${varietyName} plant`
              : `Logging for ${plantCount} ${varietyName} plants`}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {activityType === "water" && (
            <div>
              <label htmlFor="bulk-amount" className="text-sm font-medium">
                Amount (oz)
              </label>
              <Input
                id="bulk-amount" // Add the id attribute
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="20"
              />
            </div>
          )}

          {activityType === "fertilize" && (
            <div>
              <label htmlFor="fertilize-amount" className="text-sm font-medium">
                Amount
              </label>
              <Input
                id="fertilize-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="2 tbsp"
              />
            </div>
          )}

          <div>
            <label htmlFor="bulk-notes" className="text-sm font-medium">
              Notes (optional)
            </label>
            <Input
              id="bulk-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any observations..."
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Logging..." : buttonText}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkActivityModal;
