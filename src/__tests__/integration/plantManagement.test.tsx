// src/__tests__/integration/plantManagement.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "@/pages/dashboard";
import PlantDetail from "@/pages/plants/PlantDetail";
import {
  plantService,
  careService,
  varietyService,
  CareRecord,
} from "@/types/database";
import { initializeDatabase } from "@/db/seedData";
import { subDays } from "date-fns";

// Mock navigation at the top level
const mockNavigate = jest.fn();
const mockUseParams = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

describe("Plant Management Integration", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ plantId: "test-plant-id" });

    // Initialize fresh database
    const { db } = await import("@/types/database");
    await db.plants.clear();
    await db.varieties.clear();
    await db.careActivities.clear();
    await initializeDatabase();
  });

  describe("Complete Plant Lifecycle Workflow", () => {
    it("completes full plant lifecycle workflow", async () => {
      // Step 1: Register a new plant
      const varieties = await varietyService.getAllVarieties();
      const testVariety = varieties[0];

      const plantId = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        name: "Integration Test Plant",
        plantedDate: subDays(new Date(), 14),
        currentStage: "seedling",
        location: "Indoor",
        container: "5 gallon pot",
        isActive: true,
      });

      // Step 2: Verify plant appears in dashboard
      const { unmount } = render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        const plantElements = screen.getAllByText("Integration Test Plant");
        expect(plantElements.length).toBeGreaterThan(0);
      });

      // Clean up dashboard render
      unmount();

      // Step 3: Log care activity
      await careService.addCareActivity({
        plantId,
        type: "water",
        date: new Date(),
        details: {
          type: "water",
          amount: { value: 16, unit: "oz" },
          moistureReading: {
            before: 3,
            after: 7,
            scale: "1-10",
          },
          notes: "Regular watering",
        },
      });

      // Verify the care activity was saved
      const savedCareHistory = await careService.getPlantCareHistory(plantId);
      expect(savedCareHistory).toHaveLength(1);
      expect(savedCareHistory[0].details.notes).toBe("Regular watering");

      // Step 4: Check care history in plant detail
      mockUseParams.mockReturnValue({ plantId });

      render(
        <BrowserRouter>
          <PlantDetail />
        </BrowserRouter>
      );

      // Wait for plant to load
      await waitFor(() => {
        expect(screen.getByText("Integration Test Plant")).toBeInTheDocument();
      });

      // Wait for care history section to appear with the specific activity
      await waitFor(
        () => {
          // Look for care history section
          expect(screen.getByText("Care History")).toBeInTheDocument();
          // Look for watering activity - the component shows "Watering (16 oz)"
          expect(screen.getByText("Watering (16 oz)")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Step 5: Verify plant data persistence
      const savedPlant = await plantService.getPlant(plantId);
      const careHistory = await careService.getPlantCareHistory(plantId);

      expect(savedPlant).toBeTruthy();
      expect(savedPlant!.name).toBe("Integration Test Plant");
      expect(careHistory).toHaveLength(1);
      expect(careHistory[0].details.notes).toBe("Regular watering");
    });

    it("handles plant status changes throughout lifecycle", async () => {
      const varieties = await varietyService.getAllVarieties();
      const testVariety = varieties[0];

      // Create plant in germination stage
      const plantId = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        plantedDate: subDays(new Date(), 5),
        currentStage: "germination",
        location: "Indoor",
        container: "4 inch pot",
        isActive: true,
      });

      // Simulate stage progression
      await plantService.updatePlant(plantId, {
        currentStage: "seedling",
        updatedAt: new Date(),
      });

      await plantService.updatePlant(plantId, {
        currentStage: "vegetative",
        updatedAt: new Date(),
      });

      // Verify final state
      const plant = await plantService.getPlant(plantId);
      expect(plant!.currentStage).toBe("vegetative");
    });
  });

  describe("Plant Deletion and Cleanup", () => {
    it("handles plant soft deletion correctly", async () => {
      const varieties = await varietyService.getAllVarieties();
      const testVariety = varieties[0];

      // Create plant with care history
      const plantId = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        plantedDate: subDays(new Date(), 30),
        currentStage: "vegetative",
        location: "Indoor",
        container: "5 gallon pot",
        isActive: true,
      });

      // Add multiple care activities with proper types
      const careActivities = [
        {
          type: "water" as const,
          date: subDays(new Date(), 5),
          details: {
            type: "water" as const,
            amount: { value: 16, unit: "oz" as const },
          },
        },
        {
          type: "fertilize" as const,
          date: subDays(new Date(), 10),
          details: {
            type: "fertilize" as const,
            product: "General fertilizer",
            dilution: "1:10",
            amount: "1 tbsp",
          },
        },
        {
          type: "observe" as const,
          date: subDays(new Date(), 3),
          details: {
            type: "observe" as const,
            healthAssessment: "good" as const,
            observations: "Looking healthy",
            notes: "Plant appears healthy",
          },
        },
      ];

      for (const activity of careActivities) {
        await careService.addCareActivity({
          plantId,
          ...activity,
        });
      }

      // Verify data exists
      const initialCareHistory = await careService.getPlantCareHistory(plantId);
      expect(initialCareHistory).toHaveLength(3);

      // Perform soft delete
      await plantService.deletePlant(plantId);

      // Verify plant is soft deleted (still exists but isActive = false)
      const deletedPlant = await plantService.getPlant(plantId);
      expect(deletedPlant).toBeTruthy();
      expect(deletedPlant!.isActive).toBe(false);

      // Verify care history still exists (soft delete doesn't cascade)
      const remainingCareHistory = await careService.getPlantCareHistory(
        plantId
      );
      expect(remainingCareHistory).toHaveLength(3);

      // Verify plant doesn't appear in active plants
      const activePlants = await plantService.getActivePlants();
      expect(activePlants.find((p) => p.id === plantId)).toBeUndefined();
    });

    it("handles multiple plant soft deletion independently", async () => {
      const varieties = await varietyService.getAllVarieties();
      const testVariety = varieties[0];

      // Create multiple plants
      const plantIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const plantId = await plantService.addPlant({
          varietyId: testVariety.id,
          varietyName: testVariety.name,
          plantedDate: subDays(new Date(), 30),
          currentStage: "vegetative",
          location: `Location ${i}`,
          container: "5 gallon pot",
          isActive: true,
        });
        plantIds.push(plantId);

        // Add care activity to each
        await careService.addCareActivity({
          plantId,
          type: "water",
          date: new Date(),
          details: {
            type: "water",
            amount: { value: 16, unit: "oz" },
          },
        });
      }

      // Delete middle plant
      await plantService.deletePlant(plantIds[1]);

      // Verify only the deleted plant is marked inactive
      const remainingActivePlants = await plantService.getActivePlants();
      expect(remainingActivePlants).toHaveLength(2);
      expect(
        remainingActivePlants.find((p) => p.id === plantIds[1])
      ).toBeUndefined();

      // Verify deleted plant still exists but is inactive
      const deletedPlant = await plantService.getPlant(plantIds[1]);
      expect(deletedPlant).toBeTruthy();
      expect(deletedPlant!.isActive).toBe(false);

      // Verify other plants' care activities remain
      const plant0Care = await careService.getPlantCareHistory(plantIds[0]);
      const plant2Care = await careService.getPlantCareHistory(plantIds[2]);
      expect(plant0Care).toHaveLength(1);
      expect(plant2Care).toHaveLength(1);

      // Verify deleted plant's care still exists (no cascade delete)
      const deletedPlantCare = await careService.getPlantCareHistory(
        plantIds[1]
      );
      expect(deletedPlantCare).toHaveLength(1);
    });

    it("demonstrates hard delete with cascade cleanup", async () => {
      const varieties = await varietyService.getAllVarieties();
      const testVariety = varieties[0];

      const plantId = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        plantedDate: subDays(new Date(), 30),
        currentStage: "vegetative",
        location: "Indoor",
        container: "5 gallon pot",
        isActive: true,
      });

      // Add care activity
      await careService.addCareActivity({
        plantId,
        type: "water",
        date: new Date(),
        details: {
          type: "water",
          amount: { value: 16, unit: "oz" },
        },
      });

      // Perform manual hard delete with cascade cleanup
      const { db } = await import("@/types/database");

      // Delete care activities first
      await db.careActivities.where("plantId").equals(plantId).delete();

      // Then delete the plant
      await db.plants.delete(plantId);

      // Verify plant is completely gone
      const deletedPlant = await plantService.getPlant(plantId);
      expect(deletedPlant).toBeUndefined();

      // Verify care history is cleaned up
      const remainingCareHistory = await careService.getPlantCareHistory(
        plantId
      );
      expect(remainingCareHistory).toHaveLength(0);
    });
  });

  describe("Cross-Service Integration", () => {
    it("integrates care scheduling with plant management", async () => {
      const varieties = await varietyService.getAllVarieties();
      const testVariety = varieties[0];

      // Create plant that should have overdue tasks
      const plantId = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        plantedDate: subDays(new Date(), 14),
        currentStage: "seedling",
        location: "Indoor",
        container: "4 inch pot",
        isActive: true,
        reminderPreferences: {
          watering: true,
          fertilizing: true,
          observation: true,
          lighting: true,
          pruning: true,
        },
      });

      // Import after plant is created to avoid timing issues
      const { CareSchedulingService } = await import(
        "@/services/careSchedulingService"
      );

      // Get tasks for the plant
      const tasks = await CareSchedulingService.getUpcomingTasks();
      const plantTasks = tasks.filter((task) => task.plantId === plantId);

      expect(plantTasks.length).toBeGreaterThan(0);

      // Verify task properties
      plantTasks.forEach((task) => {
        expect(task.plantId).toBe(plantId);
        expect(task.dueDate).toBeInstanceOf(Date);
        expect(["low", "medium", "high"]).toContain(task.priority);
      });
    });

    it("integrates smart defaults with plant history", async () => {
      const varieties = await varietyService.getAllVarieties();
      const testVariety = varieties.find(
        (v) =>
          v.protocols?.watering && Object.keys(v.protocols.watering).length > 0
      );

      if (!testVariety) return;

      const plantId = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        plantedDate: subDays(new Date(), 30),
        currentStage: "vegetative",
        location: "Indoor",
        container: "5 gallon pot",
        isActive: true,
      });

      // Add care history
      await careService.addCareActivity({
        plantId,
        type: "water",
        date: subDays(new Date(), 2),
        details: {
          type: "water",
          amount: { value: 20, unit: "oz" },
          moistureReading: {
            before: 4,
            after: 8,
            scale: "1-10",
          },
        },
      });

      const plant = await plantService.getPlant(plantId);
      const { SmartDefaultsService } = await import(
        "@/services/smartDefaultsService"
      );

      const defaults = await SmartDefaultsService.getDefaultsForPlant(plant!);
      const quickOptions = await SmartDefaultsService.getQuickCompletionOptions(
        plant!,
        "water"
      );

      expect(defaults).toBeTruthy();
      expect(defaults!.watering).toBeTruthy();
      expect(quickOptions).toBeTruthy();

      if (quickOptions && quickOptions.length > 0) {
        expect(quickOptions[0].values.waterValue).toBeGreaterThan(0);
      }
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("handles invalid plant data gracefully", async () => {
      // Attempt to create plant with invalid variety
      await expect(
        plantService.addPlant({
          varietyId: "non-existent-variety",
          varietyName: "Invalid Variety",
          plantedDate: new Date(),
          currentStage: "seedling",
          location: "Test",
          container: "Test",
          isActive: true,
        })
      ).resolves.toBeTruthy(); // Should still create but with orphaned data

      const plants = await plantService.getActivePlants();
      const orphanedPlant = plants.find(
        (p) => p.varietyId === "non-existent-variety"
      );
      expect(orphanedPlant).toBeTruthy();

      // Services should handle orphaned plants gracefully
      const { CareSchedulingService } = await import(
        "@/services/careSchedulingService"
      );
      const tasks = await CareSchedulingService.getUpcomingTasks();

      // Should not throw and should not include tasks for orphaned plant
      expect(Array.isArray(tasks)).toBe(true);
      const orphanedTasks = tasks.filter(
        (t) => t.plantId === orphanedPlant!.id
      );
      expect(orphanedTasks).toHaveLength(0);
    });

    it("handles concurrent operations safely", async () => {
      const varieties = await varietyService.getAllVarieties();
      const testVariety = varieties[0];

      const plantId = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        plantedDate: new Date(),
        currentStage: "seedling",
        location: "Test",
        container: "Test",
        isActive: true,
      });

      // Simulate concurrent care logging
      const concurrentOperations = Array(5)
        .fill(null)
        .map((_, index) =>
          careService.addCareActivity({
            plantId,
            type: "water",
            date: new Date(),
            details: {
              type: "water",
              amount: { value: 10 + index, unit: "oz" },
              notes: `Concurrent operation ${index}`,
            },
          })
        );

      await Promise.all(concurrentOperations);

      // Verify all activities were recorded
      const careHistory = await careService.getPlantCareHistory(plantId);
      expect(careHistory).toHaveLength(5);

      // Verify each activity is unique - properly type the parameter
      const notes = careHistory.map(
        (careRecord: CareRecord) => careRecord.details.notes
      );
      const uniqueNotes = new Set(notes);
      expect(uniqueNotes.size).toBe(5);
    });
  });
});
