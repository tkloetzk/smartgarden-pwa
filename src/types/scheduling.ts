export interface UpcomingTask {
  id: string;
  plantId: string;
  name: string;
  task: string;
  dueIn: string;
  plantStage: string;
  dueDate: Date;
  priority: "low" | "medium" | "high";
  quickCompleteOptions?: QuickCompleteOption[];
  canBypass: boolean;
}

export interface TaskBypassReason {
  id: string;
  taskId: string;
  plantId: string;
  reason: string;
  timestamp: Date;
  userId?: string;
}

export interface TaskGroup {
  type: "watering" | "fertilizing" | "observation" | "maintenance";
  title: string;
  emoji: string;
  tasks: UpcomingTask[];
  isExpanded: boolean;
}

export interface QuickCompleteOption {
  label: string;
  values: QuickCompletionValues;
}

export interface QuickCompletionValues {
  waterValue?: number;
  waterUnit?: string;
  product?: string;
  dilution?: string;
  amount?: string;
}

export interface TaskRecommendation {
  task: UpcomingTask;
  protocol: {
    expectedMoisture?: [number, number];
    lastReading?: number;
    daysSinceLastCare?: number;
  };
}
