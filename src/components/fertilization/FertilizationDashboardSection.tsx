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

  if (tasks.length === 0) return null;

  const overdueTasks = tasks.filter((task) => task.dueDate < new Date());
  const todayTasks = tasks.filter((task) => {
    const today = new Date();
    return task.dueDate.toDateString() === today.toDateString();
  });
  const upcomingTasks = tasks.filter((task) => task.dueDate > new Date());

  const getPriorityCount = () => {
    const overdue = overdueTasks.length;
    const today = todayTasks.length;
    return { overdue, today };
  };

  const { overdue, today } = getPriorityCount();

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
              {tasks.length}
            </Badge>
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
              <div className="space-y-3">
                {overdueTasks.map((task) => (
                  <FertilizationTaskCard
                    key={task.id}
                    task={task}
                    onComplete={onTaskComplete}
                    onBypass={onTaskBypass}
                    onLogActivity={onTaskLogActivity}
                  />
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
              <div className="space-y-3">
                {todayTasks.map((task) => (
                  <FertilizationTaskCard
                    key={task.id}
                    task={task}
                    onComplete={onTaskComplete}
                    onBypass={onTaskBypass}
                    onLogActivity={onTaskLogActivity}
                  />
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
                  Upcoming ({upcomingTasks.slice(0, 3).length}
                  {upcomingTasks.length > 3 ? "+" : ""})
                </h4>
              </div>
              <div className="space-y-3">
                {upcomingTasks.slice(0, 3).map((task) => (
                  <FertilizationTaskCard
                    key={task.id}
                    task={task}
                    onComplete={onTaskComplete}
                    onBypass={onTaskBypass}
                    onLogActivity={onTaskLogActivity}
                    showQuickActions={false}
                  />
                ))}
              </div>
              {upcomingTasks.length > 3 && (
                <Button variant="outline" className="w-full mt-3">
                  View All {upcomingTasks.length} Upcoming Tasks
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
