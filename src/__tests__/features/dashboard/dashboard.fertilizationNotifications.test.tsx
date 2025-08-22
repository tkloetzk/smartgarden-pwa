// src/__tests__/features/dashboard/dashboard.fertilizationNotifications.test.tsx
/**
 * Business logic test for fertilization notification calculations
 * Tests task counting, overdue detection, and timing logic
 * for strawberry fertilization notifications
 */

import { addDays, subDays } from "date-fns";
import { ScheduledTask } from "@/services/ProtocolTranspilerService";
import { PlantRecord } from "@/types";

describe("Fertilization Notification Logic", () => {
  // Mock data for testing
  const now = new Date();
  
  const mockStrawberryPlant133Days: PlantRecord = {
    id: "strawberry-133",
    varietyId: "strawberry-albion",
    varietyName: "Albion Strawberry",
    name: "133-day Strawberries",
    plantedDate: subDays(now, 133),
    location: "Indoor",
    container: "Grow Bag A",
    isActive: true,
    quantity: 1,
    createdAt: subDays(now, 133),
    updatedAt: now,
  };

  const mockStrawberryPlant160Days: PlantRecord = {
    id: "strawberry-160",
    varietyId: "strawberry-albion", 
    varietyName: "Albion Strawberry",
    name: "160-day Strawberries",
    plantedDate: subDays(now, 160),
    location: "Indoor",
    container: "Grow Bag B",
    isActive: true,
    quantity: 1,
    createdAt: subDays(now, 160),
    updatedAt: now,
  };

  // Create test fertilization tasks
  const createTestTask = (
    plantId: string,
    taskName: string,
    product: string,
    daysFromNow: number
  ): ScheduledTask => ({
    id: `${plantId}-${product.toLowerCase()}`,
    plantId,
    taskName,
    taskType: "fertilize",
    details: {
      type: "fertilize",
      product,
      dilution: "As directed",
      amount: "1-2 quarts per grow bag",
      method: "soil-drench",
    },
    dueDate: addDays(now, daysFromNow),
    status: "pending",
    sourceProtocol: {
      stage: "ongoing-production",
      originalStartDays: daysFromNow + 91, // Assuming ongoingProduction starts at day 91
      isDynamic: true,
    },
    priority: "normal",
    createdAt: now,
    updatedAt: now,
  });

  const mockFertilizationTasks = [
    // 133-day plant tasks (overdue)
    createTestTask("strawberry-133", "Apply Neptune's Harvest", "Neptune's Harvest", -7), // 7 days overdue
    createTestTask("strawberry-133", "Apply 9-15-30 Fertilizer", "9-15-30 fertilizer", -3), // 3 days overdue
    
    // 160-day plant tasks (overdue)
    createTestTask("strawberry-160", "Apply Neptune's Harvest", "Neptune's Harvest", -10), // 10 days overdue
    
    // Future tasks
    createTestTask("strawberry-133", "Apply Neptune's Harvest", "Neptune's Harvest", 7), // 7 days from now
    createTestTask("strawberry-133", "Apply 9-15-30 Fertilizer", "9-15-30 fertilizer", 14), // 14 days from now
  ];

  describe("Task Count Calculations", () => {
    it("should count fertilization tasks correctly", () => {
      const totalTasks = mockFertilizationTasks.length;
      expect(totalTasks).toBe(5);
    });

    it("should filter tasks by timeframe", () => {
      // Tasks due within 7 days (including overdue)
      const tasksWithin7Days = mockFertilizationTasks.filter(task => {
        const daysDiff = Math.ceil((task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 7;
      });
      
      expect(tasksWithin7Days.length).toBe(4); // 3 overdue + 1 due in 7 days
    });

    it("should identify overdue tasks", () => {
      const overdueTasks = mockFertilizationTasks.filter(task => task.dueDate < now);
      expect(overdueTasks.length).toBe(3);
    });

    it("should identify upcoming tasks", () => {
      const upcomingTasks = mockFertilizationTasks.filter(task => task.dueDate > now);
      expect(upcomingTasks.length).toBe(2);
    });
  });

  describe("Overdue Detection Logic", () => {
    it("should correctly identify overdue Neptune's Harvest tasks", () => {
      const overdueNeptuneTasks = mockFertilizationTasks.filter(task => 
        task.details.product.includes("Neptune") && task.dueDate < now
      );
      
      expect(overdueNeptuneTasks.length).toBe(2); // One from each plant
      expect(overdueNeptuneTasks[0].plantId).toBe("strawberry-133");
      expect(overdueNeptuneTasks[1].plantId).toBe("strawberry-160");
    });

    it("should correctly identify overdue 9-15-30 tasks", () => {
      const overdue930Tasks = mockFertilizationTasks.filter(task => 
        task.details.product.includes("9-15-30") && task.dueDate < now
      );
      
      expect(overdue930Tasks.length).toBe(1);
      expect(overdue930Tasks[0].plantId).toBe("strawberry-133");
    });

    it("should calculate overdue days correctly", () => {
      const task7DaysOverdue = mockFertilizationTasks.find(task => 
        task.plantId === "strawberry-133" && task.details.product.includes("Neptune")
      );
      
      if (task7DaysOverdue) {
        const overdueDays = Math.ceil((now.getTime() - task7DaysOverdue.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        expect(overdueDays).toBe(7);
      }
    });
  });

  describe("Plant Age and Timing Logic", () => {
    it("should correctly calculate plant ages", () => {
      const plant133Age = Math.floor((now.getTime() - mockStrawberryPlant133Days.plantedDate.getTime()) / (1000 * 60 * 60 * 24));
      const plant160Age = Math.floor((now.getTime() - mockStrawberryPlant160Days.plantedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(plant133Age).toBeCloseTo(133, 1);
      expect(plant160Age).toBeCloseTo(160, 1);
    });

    it("should verify plants are in ongoingProduction stage", () => {
      // ongoingProduction starts at day 91 for strawberries
      const plant133Age = Math.floor((now.getTime() - mockStrawberryPlant133Days.plantedDate.getTime()) / (1000 * 60 * 60 * 24));
      const plant160Age = Math.floor((now.getTime() - mockStrawberryPlant160Days.plantedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(plant133Age).toBeGreaterThan(91);
      expect(plant160Age).toBeGreaterThan(91);
    });

    it("should have correct fertilizer products for strawberry protocol", () => {
      const neptunesTasks = mockFertilizationTasks.filter(task => 
        task.details.product.includes("Neptune")
      );
      const fertilizer930Tasks = mockFertilizationTasks.filter(task => 
        task.details.product.includes("9-15-30")
      );
      
      expect(neptunesTasks.length).toBeGreaterThan(0);
      expect(fertilizer930Tasks.length).toBeGreaterThan(0);
    });
  });

  describe("Task Priority and Urgency", () => {
    it("should identify most urgent overdue tasks", () => {
      const overdueTasks = mockFertilizationTasks
        .filter(task => task.dueDate < now)
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()); // Most overdue first
      
      expect(overdueTasks.length).toBeGreaterThan(0);
      
      // Most overdue should be the 160-day plant Neptune's task (10 days overdue)
      expect(overdueTasks[0].plantId).toBe("strawberry-160");
      expect(overdueTasks[0].details.product).toContain("Neptune");
    });

    it("should categorize tasks by urgency levels", () => {
      const criticallyOverdue = mockFertilizationTasks.filter(task => {
        const overdueDays = Math.ceil((now.getTime() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        return overdueDays > 7;
      });
      
      const moderatelyOverdue = mockFertilizationTasks.filter(task => {
        const overdueDays = Math.ceil((now.getTime() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        return overdueDays > 0 && overdueDays <= 7;
      });
      
      expect(criticallyOverdue.length).toBe(1); // 160-day plant, 10 days overdue
      expect(moderatelyOverdue.length).toBe(2); // 133-day plant tasks, 3-7 days overdue
    });
  });

  describe("Task Filtering and Display Logic", () => {
    it("should filter tasks for dashboard display window", () => {
      // Dashboard typically shows tasks from 14 days ago to 37 days in future
      const fourteenDaysAgo = subDays(now, 14);
      const thirtySevenDaysFromNow = addDays(now, 37);
      
      const displayWindowTasks = mockFertilizationTasks.filter(task => 
        task.dueDate >= fourteenDaysAgo && task.dueDate <= thirtySevenDaysFromNow
      );
      
      expect(displayWindowTasks.length).toBe(5); // All our test tasks should be in this window
    });

    it("should group tasks by plant", () => {
      const tasksByPlant = mockFertilizationTasks.reduce((acc, task) => {
        if (!acc[task.plantId]) {
          acc[task.plantId] = [];
        }
        acc[task.plantId].push(task);
        return acc;
      }, {} as Record<string, ScheduledTask[]>);
      
      expect(Object.keys(tasksByPlant)).toEqual(["strawberry-133", "strawberry-160"]);
      expect(tasksByPlant["strawberry-133"].length).toBe(4);
      expect(tasksByPlant["strawberry-160"].length).toBe(1);
    });
  });
});