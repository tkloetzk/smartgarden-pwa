import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Droplets,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Info,
} from "lucide-react";
import { formatDistanceToNow, isPast, isToday, isTomorrow } from "date-fns";

interface WateringTask {
  id: string;
  plantId: string;
  taskName: string;
  taskType: "water";
  dueDate: Date;
  priority: "low" | "medium" | "high";
  details: {
    type: "water";
    amount?: string;
    notes?: string;
  };
  plantCount?: number;
  varietyName?: string;
  affectedPlants?: Array<{ id: string; name: string }>;
}

interface WateringTaskCardProps {
  task: WateringTask;
  onComplete: (taskId: string, quickData?: any) => void;
  onBypass: (taskId: string, reason?: string) => void;
  onLogActivity: (taskId: string) => void;
  showQuickActions?: boolean;
}

export const WateringTaskCard: React.FC<WateringTaskCardProps> = ({
  task,
  onComplete,
  onBypass,
  onLogActivity,
  showQuickActions = true,
}) => {
  const isOverdue = isPast(task.dueDate);
  const isDueToday = isToday(task.dueDate);
  const isDueTomorrow = isTomorrow(task.dueDate);

  const getPriorityColor = () => {
    if (isOverdue) return "border-red-500 bg-red-50 dark:bg-red-950/30";
    if (isDueToday)
      return "border-orange-500 bg-orange-50 dark:bg-orange-950/30";
    if (isDueTomorrow)
      return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30";
    return "border-blue-500 bg-blue-50 dark:bg-blue-950/30";
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
      color: "text-blue-600 dark:text-blue-400",
    };
  };

  const handleQuickComplete = () => {
    const quickData = {
      waterAmount: task.details.amount || "20",
      waterUnit: "oz",
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
              <Droplets className="h-5 w-5 text-blue-600" />
              {task.taskName}
              {/* Show plant count for grouped tasks */}
              {task.plantCount && task.plantCount > 1 && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {task.plantCount} {task.varietyName || 'plants'}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              {status.icon}
              <span className={`text-sm font-medium ${status.color}`}>
                {status.text}
              </span>
            </div>
            {/* Show affected plants for grouped tasks */}
            {task.affectedPlants && task.affectedPlants.length > 1 && (
              <div className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium">Plants: </span>
                {task.affectedPlants.slice(0, 3).map((plant, index) => (
                  <span key={plant.id}>
                    {plant.name}
                    {index < Math.min(2, task.affectedPlants!.length - 1) ? ', ' : ''}
                  </span>
                ))}
                {task.affectedPlants.length > 3 && (
                  <span> +{task.affectedPlants.length - 3} more</span>
                )}
              </div>
            )}
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
        {/* Task details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Amount</span>
          </div>
          <p className="text-sm text-muted-foreground pl-6">
            {task.details.amount || "As needed"}
          </p>
        </div>

        {task.details.notes && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Notes</span>
            </div>
            <p className="text-sm text-muted-foreground pl-6">
              {task.details.notes}
            </p>
          </div>
        )}

        {/* Quick actions */}
        {showQuickActions && (
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              onClick={handleQuickComplete}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {task.plantCount && task.plantCount > 1
                ? `Water ${task.plantCount} plants`
                : `Quick: ${task.details.amount || "Water"}`}
            </Button>

            <Button
              onClick={() => onLogActivity(task.id)}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              <Droplets className="h-4 w-4 mr-2" />
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
      </CardContent>
    </Card>
  );
};

export default WateringTaskCard;