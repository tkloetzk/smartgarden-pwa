import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useNextPlantTask } from "@/hooks/useNextPlantTask";
import { Clock, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";
import Badge from "../ui/Badge";

interface NextActivityCardProps {
  plantId: string;
  onTaskClick?: (taskType: string) => void;
  className?: string;
}

const NextActivityCard = ({
  plantId,
  onTaskClick,
  className = "",
}: NextActivityCardProps) => {
  const { nextTask, isLoading } = useNextPlantTask(plantId);

  const getTaskIcon = (task: string): string => {
    const taskLower = task.toLowerCase();
    if (taskLower.includes("water")) return "💧";
    if (taskLower.includes("fertiliz")) return "🌱";
    if (taskLower.includes("observe") || taskLower.includes("check"))
      return "👁️";
    if (taskLower.includes("harvest")) return "🌾";
    if (taskLower.includes("prune")) return "✂️";
    return "📋";
  };

  const getPriorityConfig = (priority: "low" | "medium" | "high") => {
    switch (priority) {
      case "high":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <AlertTriangle className="h-3 w-3" />,
          buttonStyle: "bg-red-500 hover:bg-red-600 text-white",
        };
      case "medium":
        return {
          color: "bg-orange-100 text-orange-800 border-orange-200",
          icon: <Clock className="h-3 w-3" />,
          buttonStyle: "bg-orange-500 hover:bg-orange-600 text-white",
        };
      case "low":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: <CheckCircle2 className="h-3 w-3" />,
          buttonStyle: "bg-green-500 hover:bg-green-600 text-white",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <Clock className="h-3 w-3" />,
          buttonStyle: "bg-primary hover:bg-primary/90",
        };
    }
  };

  const getActivityType = (taskDescription: string): string => {
    const task = taskDescription.toLowerCase();
    if (task.includes("water") || task.includes("watering")) return "water";
    if (task.includes("fertiliz")) return "fertilize";
    if (task.includes("health check") || task.includes("observe"))
      return "observe";
    if (task.includes("harvest")) return "harvest";
    if (task.includes("transplant")) return "transplant";
    return "water";
  };

  const handleTaskClick = () => {
    if (nextTask && onTaskClick) {
      const activityType = getActivityType(nextTask.task);
      onTaskClick(activityType);
    }
  };

  if (isLoading) {
    return (
      <Card className={`border-border shadow-sm ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Next Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-muted rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-muted rounded animate-pulse w-2/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!nextTask) {
    return (
      <Card className={`border-border shadow-sm ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Next Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-3 py-2">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">
                All caught up!
              </div>
              <div className="text-xs text-muted-foreground">
                No tasks scheduled
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const priorityConfig = getPriorityConfig(nextTask.priority);

  return (
    <Card className={`border-border shadow-sm ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4" />
          Next Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Task Info */}
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 bg-background border border-border rounded-full flex items-center justify-center text-lg">
              {getTaskIcon(nextTask.task)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">
                  {nextTask.task}
                </span>
                <Badge
                  className={`${priorityConfig.color} text-xs px-2 py-0.5 flex items-center gap-1`}
                >
                  {priorityConfig.icon}
                  {nextTask.priority}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {nextTask.dueIn}
              </div>
            </div>
          </div>

          {/* Action Button */}
          {onTaskClick && (
            <Button
              onClick={handleTaskClick}
              className={`w-full ${priorityConfig.buttonStyle} text-sm py-2`}
              size="sm"
            >
              <span className="mr-2">{getTaskIcon(nextTask.task)}</span>
              Log {nextTask.task}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NextActivityCard;
