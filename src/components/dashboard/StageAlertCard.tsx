// In: src/components/dashboard/StageAlertCard.tsx

import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StageAlert } from "@/hooks/useProactiveStageAlerts";
import { getPlantDisplayName } from "@/utils/plantDisplay";
import { ArrowRight, Check, X } from "lucide-react";
import { GrowthStage } from "@/types";

interface StageAlertCardProps {
  alert: StageAlert;
  onConfirm: (plantId: string, newStage: GrowthStage) => void;
  onDismiss: (plantId: string) => void;
}

const StageAlertCard: React.FC<StageAlertCardProps> = ({
  alert,
  onConfirm,
  onDismiss,
}) => {
  const { plant, predictedNextStage, daysUntilTransition } = alert;

  const getTransitionText = () => {
    if (daysUntilTransition === 0) {
      return "Predicted for today";
    }
    if (daysUntilTransition === 1) {
      return "Predicted for tomorrow";
    }
    return `Predicted in ${daysUntilTransition} days`;
  };

  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800">
      <CardContent className="p-4 flex flex-col space-y-3">
        <div>
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            Stage Transition Alert
          </p>
          <h4 className="text-lg font-bold text-foreground">
            {getPlantDisplayName(plant)}
          </h4>
        </div>

        <div className="flex items-center justify-center space-x-3 text-center">
          <Badge variant="secondary" className="capitalize">
            {plant.confirmedStage || "germination"}
          </Badge>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
          <Badge className="capitalize bg-emerald-600 hover:bg-emerald-700 text-white">
            {predictedNextStage}
          </Badge>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          {getTransitionText()}
        </p>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            onClick={() => onDismiss(plant.id)}
          >
            <X className="h-4 w-4 mr-2" />
            Not Yet
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => onConfirm(plant.id, predictedNextStage)}
          >
            <Check className="h-4 w-4 mr-2" />
            Confirm Stage
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StageAlertCard;
