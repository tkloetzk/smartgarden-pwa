import { QuickCompleteOption } from "@/services/smartDefaultsService";
import { CareActivityType, GrowthStage } from "./core";

export interface UpcomingTask {
  id: string;
  plantId: string;
  plantName: string;
  task: string;
  dueDate: Date;
  dueIn: string;
  priority: "low" | "medium" | "high";
  type: CareActivityType;
  plantStage: GrowthStage;
  canBypass?: boolean;
  quickCompleteOptions?: QuickCompleteOption[];
}

export interface TaskGroup {
  type: string;
  title: string;
  emoji: string;
  tasks: UpcomingTask[];
  isExpanded: boolean;
}

export interface TaskGrouping {
  date: string;
  tasks: UpcomingTask[];
  overallPriority: "low" | "medium" | "high";
}

export interface SchedulingAdjustment {
  plantId: string;
  taskType: CareActivityType;
  originalInterval: number;
  adjustedInterval: number;
  reason: string;
  confidence: number;
}
