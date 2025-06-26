// src/pages/dashboard/TaskGroup.tsx

import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import TaskItem from "./TaskItem";
import { TaskGroup as TaskGroupType } from "@/types/scheduling";
import { QuickCompletionValues } from "@/services/smartDefaultsService";

interface TaskGroupProps {
  group: TaskGroupType;
  onQuickComplete?: (
    taskId: string,
    values: QuickCompletionValues
  ) => Promise<void>;
  onBypass?: (taskId: string, reason: string) => Promise<void>;
  onToggleExpanded?: (groupType: string) => void;
}

const TaskGroup: React.FC<TaskGroupProps> = ({
  group,
  onQuickComplete,
  onBypass,
  onToggleExpanded,
}) => {
  const [isExpanded, setIsExpanded] = useState(group.isExpanded);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggleExpanded?.(group.type);
  };

  const urgentTaskCount = group.tasks.filter(
    (task) => task.priority === "high" || task.dueIn.includes("overdue")
  ).length;

  return (
    <Card className="w-full">
      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
        <div
          className="flex items-center justify-between"
          onClick={handleToggle}
        >
          {/* Move the onClick to the inner div, not CardHeader */}
          <div className="flex items-center gap-3">
            <span className="text-2xl">{group.emoji}</span>
            <div>
              <h3 className="text-lg font-semibold">{group.title}</h3>
              <p className="text-sm text-muted-foreground">
                {group.tasks.length} task{group.tasks.length !== 1 ? "s" : ""}
                {urgentTaskCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    {urgentTaskCount} urgent
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <svg
              className={`w-5 h-5 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {group.tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onQuickComplete={onQuickComplete}
                onBypass={onBypass}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default TaskGroup;
