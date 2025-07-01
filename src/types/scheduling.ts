// src/types/scheduling.ts
import { GrowthStage } from "./core";

export type FertilizationMethod =
  | "soil-drench"
  | "foliar-spray"
  | "top-dress"
  | "mix-in-soil";

export interface QuickCompleteOption {
  id: string;
  label: string;
  values: {
    amount?: string;
    product?: string;
    dilution?: string;
    notes?: string;
  };
}

export interface UpcomingTask {
  id: string;
  plantId: string;
  plantName: string;
  task: string; // This is what the code uses, not taskName
  type: string;
  dueDate: Date;
  dueIn: string; // Human readable "2 days overdue", "due today", etc.
  priority: "low" | "medium" | "high" | "overdue";
  category: "watering" | "fertilizing" | "observation" | "maintenance";
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

export interface FertilizerDetails {
  type: string;
  product: string;
  amount: string;
  dilution: string;
  method: FertilizationMethod;
  notes: string;
}
