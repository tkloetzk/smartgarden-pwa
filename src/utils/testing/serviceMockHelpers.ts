// Service mocking helpers for testing - not a test suite
// This file provides utilities for mocking services in tests
import { jest } from '@jest/globals';
import { PlantRecord, VarietyRecord, CareActivityRecord } from '@/types';
import { careService, plantService, varietyService } from '@/types/database';
import { FirebasePlantService } from '@/services/firebase/plantService';
import { FirebaseCareActivityService } from '@/services/firebase/careActivityService';

// Mock data factories
export const createMockPlant = (overrides: Partial<PlantRecord> = {}): PlantRecord => ({
  id: 'test-plant-id',
  varietyId: 'test-variety-id',
  varietyName: 'Test Variety',
  name: 'Test Plant',
  plantedDate: new Date('2024-01-01'),
  location: 'Test Location',
  container: 'Test Container',
  isActive: true,
  reminderPreferences: {
    watering: true,
    fertilizing: true,
    observation: true,
    lighting: true,
    pruning: true,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockVariety = (overrides: Partial<VarietyRecord> = {}): VarietyRecord => ({
  id: 'test-variety-id',
  name: 'Test Variety',
  normalizedName: 'test-variety',
  category: 'fruiting-plants',
  description: 'Test variety description',
  growthTimeline: {
    germination: 7,
    seedling: 14,
    vegetative: 30,
    maturation: 60,
  },
  protocols: {
    watering: {
      germination: {
        trigger: { moistureLevel: '7-8 on moisture meter' },
        target: { moistureLevel: '8-9 on moisture meter' },
        volume: { amount: '50-75ml', frequency: 'daily', perPlant: true },
      },
      seedling: {
        trigger: { moistureLevel: '6-7 on moisture meter' },
        target: { moistureLevel: '7-8 on moisture meter' },
        volume: { amount: '100-125ml', frequency: 'every 1-2 days', perPlant: true },
      },
      vegetative: {
        trigger: { moistureLevel: '3-4 on moisture meter' },
        target: { moistureLevel: '6-7 on moisture meter' },
        volume: { amount: '150-200ml', frequency: 'every 2-3 days', perPlant: true },
      },
      flowering: {
        trigger: { moistureLevel: '4-5 on moisture meter' },
        target: { moistureLevel: '6-7 on moisture meter' },
        volume: { amount: '200-250ml', frequency: 'every 2-3 days', perPlant: true },
      },
      fruiting: {
        trigger: { moistureLevel: '4-5 on moisture meter' },
        target: { moistureLevel: '6-7 on moisture meter' },
        volume: { amount: '200-300ml', frequency: 'every 2-3 days', perPlant: true },
      },
      harvest: {
        trigger: { moistureLevel: '4-5 on moisture meter' },
        target: { moistureLevel: '6-7 on moisture meter' },
        volume: { amount: '200-300ml', frequency: 'every 2-3 days', perPlant: true },
      },
      maturation: {
        trigger: { moistureLevel: '3-4 on moisture meter' },
        target: { moistureLevel: '6-7 on moisture meter' },
        volume: { amount: '150-200ml', frequency: 'every 2-3 days', perPlant: true },
      },
      rootDevelopment: {
        trigger: { moistureLevel: '3-4 on moisture meter' },
        target: { moistureLevel: '6-7 on moisture meter' },
        volume: { amount: '150-200ml', frequency: 'every 2-3 days', perPlant: true },
      },
      'ongoing-production': {
        trigger: { moistureLevel: '4-5 on moisture meter' },
        target: { moistureLevel: '6-7 on moisture meter' },
        volume: { amount: '200-300ml', frequency: 'every 2-3 days', perPlant: true },
      },
      budding: {
        trigger: { moistureLevel: '4-5 on moisture meter' },
        target: { moistureLevel: '7-8 on moisture meter' },
        volume: { amount: '150-200ml', frequency: 'every 2 days', perPlant: true },
      },
      dormancy: {
        trigger: { moistureLevel: '2-3 on moisture meter' },
        target: { moistureLevel: '4-5 on moisture meter' },
        volume: { amount: '50-75ml', frequency: 'weekly', perPlant: true },
      },
    },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockCareActivity = (overrides: Partial<CareActivityRecord> = {}): CareActivityRecord => ({
  id: 'test-activity-id',
  plantId: 'test-plant-id',
  type: 'water',
  date: new Date(),
  details: {
    type: 'water',
    amount: { value: 200, unit: 'ml' },
    notes: 'Test watering',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Service mock utilities
export class ServiceMockManager {
  private originalMocks = new Map<string, unknown>();

  // Setup comprehensive service mocks
  setupAllMocks(): void {
    this.setupDatabaseMocks();
    this.setupFirebaseMocks();
  }

  setupDatabaseMocks(): void {
    // Plant service mocks
    this.mockService('plantService.getPlant', jest.fn());
    this.mockService('plantService.addPlant', (jest.fn() as any).mockResolvedValue('test-plant-id'));
    this.mockService('plantService.updatePlant', (jest.fn() as any).mockResolvedValue(undefined));
    this.mockService('plantService.getActivePlants', (jest.fn() as any).mockResolvedValue([]));
    
    // Variety service mocks
    this.mockService('varietyService.getVariety', jest.fn());
    this.mockService('varietyService.getAllVarieties', (jest.fn() as any).mockResolvedValue([]));
    
    // Care service mocks
    this.mockService('careService.addCareActivity', (jest.fn() as any).mockResolvedValue('test-activity-id'));
    this.mockService('careService.getLastActivityByType', (jest.fn() as any).mockResolvedValue(null));
    this.mockService('careService.getPlantCareHistory', (jest.fn() as any).mockResolvedValue([]));
  }

  setupFirebaseMocks(): void {
    // Firebase Plant Service
    jest.spyOn(FirebasePlantService, 'getPlant').mockResolvedValue(createMockPlant());
    jest.spyOn(FirebasePlantService, 'subscribeToPlantsChanges').mockReturnValue(() => {});
    jest.spyOn(FirebasePlantService, 'createPlant').mockResolvedValue('test-plant-id');
    jest.spyOn(FirebasePlantService, 'updatePlant').mockResolvedValue(undefined);
    
    // Firebase Care Activity Service
    jest.spyOn(FirebaseCareActivityService, 'createCareActivity').mockResolvedValue('test-activity-id');
    jest.spyOn(FirebaseCareActivityService, 'getRecentActivitiesForPlant').mockResolvedValue([]);
  }

  private mockService(path: string, mockFn: jest.Mock): void {
    const [serviceName, methodName] = path.split('.');
    const service = this.getService(serviceName);
    
    if (service && methodName in service) {
      this.originalMocks.set(path, (service as any)[methodName]);
      (service as any)[methodName] = mockFn;
    }
  }

  private getService(serviceName: string): any {
    switch (serviceName) {
      case 'plantService': return plantService;
      case 'varietyService': return varietyService;
      case 'careService': return careService;
      default: return null;
    }
  }

  // Configure specific mock behaviors
  configurePlantMocks(plant: PlantRecord, variety?: VarietyRecord): void {
    (plantService.getPlant as any).mockResolvedValue(plant);
    if (variety) {
      (varietyService.getVariety as any).mockResolvedValue(variety);
    }
  }

  configureErrorMocks(errorType: 'database' | 'firebase' | 'network', errorMessage = 'Test error'): void {
    const error = new Error(errorMessage);
    
    switch (errorType) {
      case 'database':
        (careService.addCareActivity as any).mockRejectedValue(error);
        break;
      case 'firebase':
        jest.spyOn(FirebaseCareActivityService, 'createCareActivity').mockRejectedValue(error);
        break;
      case 'network':
        // Mock network-related failures
        jest.spyOn(FirebasePlantService, 'getPlant').mockRejectedValue(error);
        break;
    }
  }

  // Restore all mocks
  restoreAll(): void {
    jest.restoreAllMocks();
    
    // Restore original implementations
    this.originalMocks.forEach((originalFn, path) => {
      const [serviceName, methodName] = path.split('.');
      const service = this.getService(serviceName);
      if (service) {
        (service as any)[methodName] = originalFn;
      }
    });
    
    this.originalMocks.clear();
  }

  // Clear all mock call history
  clearMockHistory(): void {
    jest.clearAllMocks();
  }
}

// Test helper class for integration tests
export class IntegrationTestHelper {
  private mockManager = new ServiceMockManager();

  setup(): void {
    this.mockManager.setupAllMocks();
  }

  teardown(): void {
    this.mockManager.restoreAll();
  }

  // Helper for testing complete workflows
  async testCareLoggingWorkflow(
    plantData: Partial<PlantRecord> = {},
    varietyData: Partial<VarietyRecord> = {},
    activityData: Partial<CareActivityRecord> = {}
  ) {
    const plant = createMockPlant(plantData);
    const variety = createMockVariety(varietyData);
    const activity = createMockCareActivity(activityData);

    this.mockManager.configurePlantMocks(plant, variety);

    return { plant, variety, activity };
  }

  // Helper for testing error scenarios
  async testErrorScenario(errorType: 'database' | 'firebase' | 'network') {
    this.mockManager.configureErrorMocks(errorType);
  }

  // Get mock call counts and arguments
  getMockCallInfo(servicePath: string) {
    const [serviceName, methodName] = servicePath.split('.');
    const service = this.mockManager['getService'](serviceName) as any;
    const mock = service?.[methodName] as any;
    
    return {
      callCount: mock?.mock.calls.length || 0,
      calls: mock?.mock.calls || [],
      lastCall: mock?.mock.calls[mock?.mock.calls.length - 1] || null,
    };
  }
}

// Export singleton instance for convenience
export const testHelper = new IntegrationTestHelper();