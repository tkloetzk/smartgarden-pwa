import { CareActivityType } from "./core";

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

export interface TaskGroup {
  type: "watering" | "fertilizing" | "observation" | "maintenance";
  title: string;
  emoji: string;
  tasks: UpcomingTask[];
  isExpanded: boolean;
}

export interface BypassPattern {
  plantId: string;
  taskType: CareActivityType;
  commonReasons: string[];
  frequency: number;
  seasonalPattern?: {
    season: string;
    frequency: number;
  }[];
  confidenceScore: number;
}

export interface BypassInsight {
  pattern: BypassPattern;
  recommendation: string;
  shouldAdjustSchedule: boolean;
  adjustmentDays?: number;
}

export interface SchedulingAdjustment {
  plantId: string;
  taskType: CareActivityType;
  originalInterval: number;
  adjustedInterval: number;
  reason: string;
  confidence: number;
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
  notes?: string;
}

export interface TaskRecommendation {
  task: UpcomingTask;
  protocol: {
    expectedMoisture?: [number, number];
    lastReading?: number;
    daysSinceLastCare?: number;
  };
}
