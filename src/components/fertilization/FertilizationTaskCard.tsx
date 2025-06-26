import React from "react";
import { ScheduledTask } from "@/services/ProtocolTranspilerService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Beaker,
  Clock,
  Droplets,
  Leaf,
  Info,
  CheckCircle2,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { formatDistanceToNow, isPast, isToday, isTomorrow } from "date-fns";
import { QuickCompletionValues } from "@/services/smartDefaultsService";

interface FertilizationTaskCardProps {
  task: ScheduledTask;
  onComplete: (taskId: string, quickData?: QuickCompletionValues) => void;
  onBypass: (taskId: string, reason?: string) => void;
  onLogActivity: (taskId: string) => void;
  isWateringDueSoon?: boolean;
  canCombineWithWatering?: boolean;
  showQuickActions?: boolean;
}

export const FertilizationTaskCard: React.FC<FertilizationTaskCardProps> = ({
  task,
  onComplete,
  onBypass,
  onLogActivity,
  isWateringDueSoon = false,
  canCombineWithWatering = false,
  showQuickActions = true,
}) => {
  const isOverdue = isPast(task.dueDate);
  const isDueToday = isToday(task.dueDate);
  const isDueTomorrow = isTomorrow(task.dueDate);

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "soil-drench":
        return <Droplets className="h-4 w-4" />;
      case "foliar-spray":
        return <Leaf className="h-4 w-4" />;
      case "top-dress":
        return <Beaker className="h-4 w-4" />;
      default:
        return <Beaker className="h-4 w-4" />;
    }
  };

  const getMethodDisplay = (method: string) => {
    switch (method) {
      case "soil-drench":
        return "Soil Drench";
      case "foliar-spray":
        return "Foliar Spray";
      case "top-dress":
        return "Top Dress";
      default:
        return method;
    }
  };

  const getPriorityColor = () => {
    if (isOverdue) return "border-red-500 bg-red-50 dark:bg-red-950/30";
    if (isDueToday)
      return "border-orange-500 bg-orange-50 dark:bg-orange-950/30";
    if (isDueTomorrow)
      return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30";
    return "border-green-500 bg-green-50 dark:bg-green-950/30";
  };

  const getStatusDisplay = () => {
    if (isOverdue) {
      return {
        text: `Overdue by ${formatDistanceToNow(task.dueDate)}`,
        icon: <AlertTriangle className="h-4 w-4" />,
        color: "text-red-600 dark:text-red-400",
      };
    }
    if (isDueToday) {
      return {
        text: "Due today",
        icon: <Clock className="h-4 w-4" />,
        color: "text-orange-600 dark:text-orange-400",
      };
    }
    if (isDueTomorrow) {
      return {
        text: "Due tomorrow",
        icon: <Calendar className="h-4 w-4" />,
        color: "text-yellow-600 dark:text-yellow-500",
      };
    }
    return {
      text: `Due in ${formatDistanceToNow(task.dueDate)}`,
      icon: <Clock className="h-4 w-4" />,
      color: "text-green-600 dark:text-green-400",
    };
  };

  const handleQuickComplete = () => {
    const quickData: QuickCompletionValues = {
      product: task.details.product,
      amount: task.details.amount,
      dilution: task.details.dilution,
      notes: `Quick completion: ${task.taskName}`,
    };
    onComplete(task.id, quickData);
  };

  const status = getStatusDisplay();

  return (
    <Card
      className={`border-l-4 transition-all duration-200 hover:shadow-md ${getPriorityColor()}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Beaker className="h-5 w-5 text-green-600" />
              {task.taskName}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              {status.icon}
              <span className={`text-sm font-medium ${status.color}`}>
                {status.text}
              </span>
            </div>
          </div>
          <Badge
            variant={
              isOverdue ? "destructive" : isDueToday ? "default" : "secondary"
            }
          >
            {task.priority}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Beaker className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Product</span>
            </div>
            <p className="text-sm text-muted-foreground pl-6">
              {task.details.product}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getMethodIcon(task.details.method)}
              <span className="text-sm font-medium">Method</span>
            </div>
            <p className="text-sm text-muted-foreground pl-6">
              {getMethodDisplay(task.details.method)}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Amount</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {task.details.amount}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Dilution</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {task.details.dilution}
            </p>
          </div>
        </div>

        {}
        {canCombineWithWatering && isWateringDueSoon && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Smart Timing Suggestion
                </p>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  Watering is due soon. Consider combining this fertilizer
                  application with watering to prevent overwatering.
                </p>
              </div>
            </div>
          </div>
        )}

        {}
        {showQuickActions && (
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              onClick={handleQuickComplete}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Quick: {task.details.product}
            </Button>

            <Button
              onClick={() => onLogActivity(task.id)}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              <Beaker className="h-4 w-4 mr-2" />
              Log Details
            </Button>

            <Button
              onClick={() => onBypass(task.id)}
              variant="outline"
              className="text-muted-foreground hover:text-foreground"
              size="sm"
            >
              Bypass
            </Button>
          </div>
        )}

        {}
        {task.sourceProtocol && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            Protocol guidance for {task.sourceProtocol.stage} stage
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FertilizationTaskCard;
