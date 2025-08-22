import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Beaker,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScheduledTask } from "@/services/ProtocolTranspilerService";
import FertilizationTaskCard from "@/components/fertilization/FertilizationTaskCard";
import { QuickCompletionValues } from "@/services/smartDefaultsService";

interface FertilizationDashboardSectionProps {
  tasks: ScheduledTask[];
  onTaskComplete: (taskId: string, quickData?: QuickCompletionValues) => void;
  onTaskBypass: (taskId: string, reason?: string) => void;
  onTaskLogActivity: (taskId: string) => void;
}

const FertilizationDashboardSection: React.FC<
  FertilizationDashboardSectionProps
> = ({ tasks, onTaskComplete, onTaskBypass, onTaskLogActivity }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const navigate = useNavigate();

  const now = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0); // Start of today
  
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow
  
  const threeDaysFromNow = new Date(todayStart);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 4); // Start of day 4 (so we include up to end of day 3)
  
  const fourteenDaysAgo = new Date(todayStart);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14); // Start of 14 days ago for overdue tasks

  const threeDaysAgo = new Date(todayStart);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3); // Start of 3 days ago for recent overdue

  // Filter tasks to show relevant ones within an extended window for fertilization
  const relevantTasks = tasks.filter((task) => {
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0); // Normalize to start of day for comparison
    
    // For overdue tasks, show up to 14 days back (to catch missed fertilization)
    // For future tasks, show up to 3 days ahead (normal window)
    if (taskDate < todayStart) {
      // Overdue task - show if within 14 days
      return taskDate >= fourteenDaysAgo;
    } else {
      // Future task - show if within 3 days
      return taskDate < threeDaysFromNow;
    }
  });

  // Don't render if no relevant tasks
  if (relevantTasks.length === 0) return null;

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
  const handleTaskCardClick = (task: ScheduledTask) => {
    // For grouped tasks, use the first plant ID, or fall back to single plantId
    const plantId = (task as any).plantIds?.[0] || task.plantId;
    navigate(`/log-care/${plantId}?type=fertilize&product=${encodeURIComponent(task.details.product)}`);
  };

  const handleViewAllUpcoming = () => {
    setShowAllUpcoming(!showAllUpcoming);
  };

  const upcomingTasksToShow = showAllUpcoming ? upcomingTasks : upcomingTasks.slice(0, 3);

  return (
    <Card className="mb-6">
      <CardHeader
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5 text-green-600" />
            <span>🌱 Fertilization Tasks</span>
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
          {}
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
                    <FertilizationTaskCard
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

          {}
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
                    <FertilizationTaskCard
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

          {}
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
                    <FertilizationTaskCard
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

export default FertilizationDashboardSection;
