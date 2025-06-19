export interface UpcomingTask {
  id: string;
  plantId: string;
  name: string; // Dashboard expects 'name', not 'plantName'
  task: string; // Dashboard expects 'task', not 'description'
  dueIn: string; // This matches
  priority: "low" | "medium" | "high";
  plantStage: string; // Dashboard expects 'plantStage', not 'stage'
  dueDate: Date; // Keep this for sorting
}

export interface TaskRecommendation {
  task: UpcomingTask;
  protocol: {
    expectedMoisture?: [number, number];
    lastReading?: number;
    daysSinceLastCare?: number;
  };
}
