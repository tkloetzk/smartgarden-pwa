import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
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
    it("displays correct stage for 103-day-old Albion strawberry in Plants page", async () => {
      const varieties = await varietyService.getAllVarieties();
      const albion = varieties.find((v) => v.name === "Albion Strawberries");
      expect(albion).toBeDefined();

      const plantedDate = subDays(new Date(), 103);
      await plantService.addPlant({
        varietyId: albion!.id,
        varietyName: albion!.name,
        name: "Test Strawberry",
        plantedDate,
        currentStage: "germination", // This should be updated by the system
        location: "Indoor",
        container: "5 gallon",
        isActive: true,
      });

      renderWithRouter(<Plants />);

      // Wait for the plant to be displayed
      await waitFor(() => {
        const matches = screen.getAllByText("Test Strawberry");
        expect(matches.length).toBeGreaterThan(0);
      });

      // Check that the stage is calculated and displayed correctly for everbearing strawberry
      await waitFor(() => {
        const stageText =
          screen.queryByText(/ongoing.?production/i) ||
          screen.queryByText(/ongoing\s+production/i) ||
          screen.queryByText(/Stage.*ongoing.?production/i);
        expect(stageText).toBeInTheDocument();
      });
    });

    it("displays correct stage for 50-day-old Astro Arugula (everbearing)", async () => {
      const varieties = await varietyService.getAllVarieties();
      const arugula = varieties.find((v) => v.name === "Astro Arugula");
      expect(arugula).toBeDefined();

      const plantedDate = subDays(new Date(), 50);
      await plantService.addPlant({
        varietyId: arugula!.id,
        varietyName: arugula!.name,
        name: "Test Arugula",
        plantedDate,
        currentStage: "germination",
        location: "Indoor",
        container: "4 inch pot",
        isActive: true,
      });

      renderWithRouter(<Plants />);

      await waitFor(() => {
        const matches = screen.getAllByText("Test Arugula");
        expect(matches.length).toBeGreaterThan(0);
      });

      // Arugula is everbearing - should show ongoing-production after 37 days maturation
      await waitFor(() => {
        const stageText =
          screen.queryByText(/ongoing.?production/i) ||
          screen.queryByText(/ongoing\s+production/i) ||
          screen.queryByText(/Stage.*ongoing.?production/i);
        expect(stageText).toBeInTheDocument();
      });
    });

    it("displays correct stage for 80-day-old non-everbearing plant", async () => {
      const varieties = await varietyService.getAllVarieties();
      // Find a non-everbearing variety with shorter maturation time
      const carrots = varieties.find((v) => v.name === "Little Finger Carrots");
      expect(carrots).toBeDefined();

      const plantedDate = subDays(new Date(), 80);
      await plantService.addPlant({
        varietyId: carrots!.id,
        varietyName: carrots!.name,
        name: "Test Carrots",
        plantedDate,
        currentStage: "germination",
        location: "Indoor",
        container: "Deep container",
        isActive: true,
      });

      renderWithRouter(<Plants />);

      await waitFor(() => {
        const matches = screen.getAllByText("Test Carrots");
        expect(matches.length).toBeGreaterThan(0);
      });

      // Non-everbearing plants should show "harvest" after maturation
      await waitFor(() => {
        const stageText =
          screen.queryByText(/harvest/i) ||
          screen.queryByText(/Stage.*harvest/i);
        expect(stageText).toBeInTheDocument();
      });
    });

    it("displays correct stage for plant in vegetative stage", async () => {
      const varieties = await varietyService.getAllVarieties();
      const spinach = varieties.find((v) => v.name === "Baby's Leaf Spinach");
      expect(spinach).toBeDefined();

      // For Baby's Leaf Spinach: germination(7) + seedling(14) = 21, so day 25 should be vegetative
      const plantedDate = subDays(new Date(), 25);
      await plantService.addPlant({
        varietyId: spinach!.id,
        varietyName: spinach!.name,
        name: "Test Spinach",
        plantedDate,
        currentStage: "germination",
        location: "Indoor",
        container: "Medium container",
        isActive: true,
      });

      renderWithRouter(<Plants />);

      await waitFor(() => {
        const matches = screen.getAllByText("Test Spinach");
        expect(matches.length).toBeGreaterThan(0);
      });

      // Plant should be in vegetative stage at 25 days
      await waitFor(() => {
        const stageText =
          screen.queryByText(/vegetative/i) ||
          screen.queryByText(/Stage.*vegetative/i);
        expect(stageText).toBeInTheDocument();
      });
    });

    it("displays correct stage for plant in seedling stage", async () => {
      const varieties = await varietyService.getAllVarieties();
      const spinach = varieties.find((v) => v.name === "Baby's Leaf Spinach");
      expect(spinach).toBeDefined();

      // At 15 days, should still be in seedling stage (day 7-21)
      const plantedDate = subDays(new Date(), 15);
      await plantService.addPlant({
        varietyId: spinach!.id,
        varietyName: spinach!.name,
        name: "Test Spinach Seedling",
        plantedDate,
        currentStage: "germination",
        location: "Indoor",
        container: "Small container",
        isActive: true,
      });

      renderWithRouter(<Plants />);

      await waitFor(() => {
        const matches = screen.getAllByText("Test Spinach Seedling");
        expect(matches.length).toBeGreaterThan(0);
      });

      // Plant should be in seedling stage at 15 days
      await waitFor(() => {
        const stageText =
          screen.queryByText(/seedling/i) ||
          screen.queryByText(/Stage.*seedling/i);
        expect(stageText).toBeInTheDocument();
      });
    });
  });
});
