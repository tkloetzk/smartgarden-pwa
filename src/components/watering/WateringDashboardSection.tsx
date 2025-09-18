import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Droplets,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import WateringTaskCard from "@/components/watering/WateringTaskCard";

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

interface WateringDashboardSectionProps {
  tasks: WateringTask[];
  onTaskComplete: (taskId: string, quickData?: any) => void;
  onTaskBypass: (taskId: string, reason?: string) => void;
  onTaskLogActivity: (taskId: string) => void;
}

const WateringDashboardSection: React.FC<WateringDashboardSectionProps> = ({
  tasks,
  onTaskComplete,
  onTaskBypass,
  onTaskLogActivity,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const navigate = useNavigate();

  const now = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const threeDaysFromNow = new Date(todayStart);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 4);

  const threeDaysAgo = new Date(todayStart);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // Filter tasks to show relevant ones
  const relevantTasks = tasks.filter((task) => {
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);

    // For overdue tasks, show up to 3 days back
    // For future tasks, show up to 3 days ahead
    if (taskDate < todayStart) {
      return taskDate >= threeDaysAgo;
    } else {
      return taskDate < threeDaysFromNow;
    }
  });

  // Don't render if no relevant tasks
  if (relevantTasks.length === 0) {
    return null;
  }

  const overdueTasks = relevantTasks.filter((task) => task.dueDate < now);
  const todayTasks = relevantTasks.filter((task) => {
    return task.dueDate.toDateString() === now.toDateString();
  });
  const upcomingTasks = relevantTasks.filter((task) => task.dueDate >= tomorrow);

  const getPriorityCount = () => {
    const overdue = overdueTasks.length;
    const today = todayTasks.length;
    return { overdue, today };
  };

  const { overdue, today } = getPriorityCount();

  // Enhanced task handlers that navigate to log-care with plant ID pre-filled
  const handleTaskCardClick = (task: WateringTask) => {
    // For grouped tasks, use the first plant ID, or fall back to single plantId
    const plantId = (task as any).plantIds?.[0] || task.plantId;
    navigate(`/log-care/${plantId}?type=water&amount=${encodeURIComponent(task.details.amount || '20oz')}`);
  };

  const handleViewAllUpcoming = () => {
    setShowAllUpcoming(!showAllUpcoming);
  };

  const upcomingTasksToShow = showAllUpcoming ? upcomingTasks : upcomingTasks.slice(0, 3);

  return (
    <Card className="mb-6" data-testid="watering-dashboard-section">
      <CardHeader
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-600" />
            <span>💧 Watering Tasks</span>
            <Badge variant="secondary" className="ml-2">
              {relevantTasks.length}
            </Badge>
            {tasks.length > relevantTasks.length && (
              <span className="text-xs text-muted-foreground ml-1">
                ({tasks.length - relevantTasks.length} more in schedule)
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {overdue > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {overdue}
              </Badge>
            )}
            {today > 0 && (
              <Badge variant="default" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {today}
              </Badge>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Overdue Tasks */}
          {overdueTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <h4 className="font-medium text-red-600">
                  Overdue ({overdueTasks.length})
                </h4>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {overdueTasks.map((task) => (
                  <div key={task.id} onClick={() => handleTaskCardClick(task)} className="cursor-pointer">
                    <WateringTaskCard
                      task={task}
                      onComplete={onTaskComplete}
                      onBypass={onTaskBypass}
                      onLogActivity={onTaskLogActivity}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today Tasks */}
          {todayTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-orange-600" />
                <h4 className="font-medium text-orange-600">
                  Due Today ({todayTasks.length})
                </h4>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {todayTasks.map((task) => (
                  <div key={task.id} onClick={() => handleTaskCardClick(task)} className="cursor-pointer">
                    <WateringTaskCard
                      task={task}
                      onComplete={onTaskComplete}
                      onBypass={onTaskBypass}
                      onLogActivity={onTaskLogActivity}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Tasks */}
          {upcomingTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <h4 className="font-medium text-green-600">
                  Upcoming ({upcomingTasksToShow.length}
                  {!showAllUpcoming && upcomingTasks.length > 3 ? ` of ${upcomingTasks.length}` : ""})
                </h4>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingTasksToShow.map((task) => (
                  <div key={task.id} onClick={() => handleTaskCardClick(task)} className="cursor-pointer">
                    <WateringTaskCard
                      task={task}
                      onComplete={onTaskComplete}
                      onBypass={onTaskBypass}
                      onLogActivity={onTaskLogActivity}
                      showQuickActions={false}
                    />
                  </div>
                ))}
              </div>
              {upcomingTasks.length > 3 && (
                <Button
                  variant="outline"
                  className="w-full mt-3"
                  onClick={handleViewAllUpcoming}
                >
                  {showAllUpcoming
                    ? `Show Less (${upcomingTasks.slice(0, 3).length} of ${upcomingTasks.length})`
                    : `View All ${upcomingTasks.length} Upcoming Tasks`
                  }
                </Button>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default WateringDashboardSection;