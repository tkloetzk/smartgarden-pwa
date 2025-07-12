// Service interfaces for dependency injection
export interface ICareSchedulingService {
  calculateNextDueDate(
    activityType: string,
    lastDate: Date,
    plant: PlantRecord,
    variety: VarietyRecord
  ): Date;
  
  getUpcomingTasks(plantId?: string): Promise<UpcomingTask[]>;
  filterTasksByPreferences(tasks: UpcomingTask[], preferences: ReminderPreferences): UpcomingTask[];
}

export interface IDynamicSchedulingService {
  recordTaskCompletion(plantId: string, taskType: string, completionDate: Date): Promise<void>;
  getCompletionPatterns(plantId: string, taskType: string): Promise<CompletionPattern>;
  getNextDueDateForTask(plantId: string, taskType: string): Promise<Date>;
}

// Service factory for dependency injection
export class ServiceContainer {
  private static instance: ServiceContainer;
  private services: Map<string, unknown> = new Map();

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  register<T>(key: string, service: T): void {
    this.services.set(key, service);
  }

  get<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service ${key} not registered`);
    }
    return service as T;
  }
}