// src/__tests__/integration/stageCalculationDisplay.test.tsx - Fixed version
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "@/pages/dashboard";
import Plants from "../../pages/plants/Plants";
import { plantService, varietyService } from "@/types/database";
import { initializeDatabase } from "@/db/seedData";
import { subDays } from "date-fns";

describe("Stage Calculation Integration", () => {
  beforeEach(async () => {
    const { db } = await import("@/types/database");
    await db.plants.clear();
    await db.varieties.clear();
    await initializeDatabase();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  describe("Stage calculation for mature plants", () => {
    it("displays correct stage for 103-day-old Albion strawberry", async () => {
      // Get Albion strawberry variety
      const varieties = await varietyService.getAllVarieties();
      const albion = varieties.find((v) => v.name === "Albion Strawberries");
      expect(albion).toBeDefined();

      // Create plant with 103 days ago planting date
      const plantedDate = subDays(new Date(), 103);
      const plantId = await plantService.addPlant({
        varietyId: albion!.id,
        varietyName: albion!.name,
        name: "Test Strawberry",
        plantedDate,
        currentStage: "germination", // Intentionally wrong - should be corrected
        location: "Indoor",
        container: "5 gallon",
        isActive: true,
      });

      // Render Dashboard
      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        // Should display "ongoing-production" not "germination" (Albion is everbearing!)
        expect(
          screen.getByText(/Stage: ongoing-production/i)
        ).toBeInTheDocument();
        expect(
          screen.queryByText(/Stage: germination/i)
        ).not.toBeInTheDocument();
      });
    });

    it("displays correct stage for 103-day-old plant in Plants page", async () => {
      const varieties = await varietyService.getAllVarieties();
      const albion = varieties.find((v) => v.name === "Albion Strawberries");

      const plantedDate = subDays(new Date(), 103);
      await plantService.addPlant({
        varietyId: albion!.id,
        varietyName: albion!.name,
        name: "Test Strawberry",
        plantedDate,
        currentStage: "germination", // Wrong stored value
        location: "Indoor",
        container: "5 gallon",
        isActive: true,
      });

      renderWithRouter(<Plants />);

      await waitFor(() => {
        expect(screen.getByText("Test Strawberry")).toBeInTheDocument();
        // Should show calculated stage, not stored stage - ongoing-production for everbearing!
        expect(screen.getByText(/ongoing-production/i)).toBeInTheDocument();
      });
    });

    it("handles various growth stages correctly for different plant ages", async () => {
      const varieties = await varietyService.getAllVarieties();
      const albion = varieties.find((v) => v.name === "Albion Strawberries");

      const testCases = [
        { daysAgo: 5, expectedStage: "germination" },
        { daysAgo: 20, expectedStage: "seedling" },
        { daysAgo: 50, expectedStage: "vegetative" },
        { daysAgo: 87, expectedStage: "flowering" },
        { daysAgo: 103, expectedStage: "ongoing-production" }, // ← Fixed! Was "maturation"
      ];

      for (const testCase of testCases) {
        const plantedDate = subDays(new Date(), testCase.daysAgo);
        await plantService.addPlant({
          varietyId: albion!.id,
          varietyName: albion!.name,
          name: `Plant ${testCase.daysAgo} days`,
          plantedDate,
          currentStage: "germination", // Always wrong
          location: "Indoor",
          container: "5 gallon",
          isActive: true,
        });
      }

      renderWithRouter(<Plants />);

      await waitFor(() => {
        for (const testCase of testCases) {
          expect(
            screen.getByText(`Plant ${testCase.daysAgo} days`)
          ).toBeInTheDocument();
          // Each plant should show its calculated stage
          expect(
            screen.getByText(new RegExp(testCase.expectedStage, "i"))
          ).toBeInTheDocument();
        }
      });
    });

    it("handles non-everbearing plants correctly", async () => {
      const varieties = await varietyService.getAllVarieties();
      const carrots = varieties.find((v) => v.name === "Little Finger Carrots");
      expect(carrots).toBeDefined();

      // Create carrot plant past maturation (non-everbearing should show "harvest")
      const plantedDate = subDays(new Date(), 70); // Past 65-day maturation
      await plantService.addPlant({
        varietyId: carrots!.id,
        varietyName: carrots!.name,
        name: "Test Carrots",
        plantedDate,
        currentStage: "germination", // Wrong stored value
        location: "Indoor",
        container: "4 inch pot",
        isActive: true,
      });

      renderWithRouter(<Plants />);

      await waitFor(() => {
        expect(screen.getByText("Test Carrots")).toBeInTheDocument();
        // Non-everbearing should show "harvest" after maturation
        expect(screen.getByText(/harvest/i)).toBeInTheDocument();
      });
    });

    it("handles plants past productive lifespan", async () => {
      const varieties = await varietyService.getAllVarieties();
      const albion = varieties.find((v) => v.name === "Albion Strawberries");

      // Create plant past 730-day productive lifespan
      const plantedDate = subDays(new Date(), 800); // Past 2-year lifespan
      await plantService.addPlant({
        varietyId: albion!.id,
        varietyName: albion!.name,
        name: "Old Strawberry",
        plantedDate,
        currentStage: "ongoing-production", // Wrong - should be harvest
        location: "Indoor",
        container: "5 gallon",
        isActive: true,
      });

      renderWithRouter(<Plants />);

      await waitFor(() => {
        expect(screen.getByText("Old Strawberry")).toBeInTheDocument();
        // Past productive lifespan should show "harvest" (needs replacement)
        expect(screen.getByText(/harvest/i)).toBeInTheDocument();
      });
    });
  });
});
