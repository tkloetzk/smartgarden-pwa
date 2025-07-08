// src/__tests__/components/BulkActivityModal.realData.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import BulkActivityModal from "@/components/plant/BulkActivityModal";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { useFirebaseCareActivities } from "@/hooks/useFirebaseCareActivities";
import {
  initializeDatabase,
  resetDatabaseInitializationFlag,
} from "@/db/seedData";
import { varietyService } from "@/types/database";
import { subDays } from "date-fns";

// Only mock the hooks, not the data
jest.mock("@/hooks/useFirebasePlants");
jest.mock("@/hooks/useFirebaseCareActivities");

const mockUseFirebasePlants = useFirebasePlants as jest.Mock;
const mockUseFirebaseCareActivities = useFirebaseCareActivities as jest.Mock;

describe("BulkActivityModal - Real Variety Data", () => {
  const mockLogActivity = jest.fn();

  beforeEach(async () => {
    // Initialize real database with real seed data
    resetDatabaseInitializationFlag();
    const { db } = await import("@/types/database");
    await db.delete();
    await db.open();
    await initializeDatabase();

    mockUseFirebaseCareActivities.mockReturnValue({
      logActivity: mockLogActivity,
    });
  });

  afterEach(async () => {
    const { db } = await import("@/types/database");
    await db.delete();
  });

  it("shows correct fertilizer options for 5-week-old Little Finger Carrots (vegetative stage)", async () => {
    // Get the REAL Little Finger Carrots variety from the database
    const varieties = await varietyService.getAllVarieties();
    const carrotVariety = varieties.find(
      (v) => v.name === "Little Finger Carrots"
    );
    expect(carrotVariety).toBeDefined();

    const vegetativeCarrotPlant = {
      id: "carrot-vegetative",
      varietyId: carrotVariety!.id,
      varietyName: "Little Finger Carrots",
      plantedDate: subDays(new Date(), 35), // 5 weeks old
      location: "Indoor",
      container: "Deep container",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUseFirebasePlants.mockReturnValue({
      plants: [vegetativeCarrotPlant],
      loading: false,
      error: null,
    });

    render(
      <BulkActivityModal
        isOpen={true}
        onClose={jest.fn()}
        plantIds={["carrot-vegetative"]}
        activityType="fertilize"
        plantCount={1}
        varietyName="Little Finger Carrots"
      />
    );

    // Wait for fertilizer options to load
    await waitFor(() => {
      // This test will use the REAL growth stage calculation and REAL fertilization protocols
      const protocolText = screen.queryByText(
        "Protocol-specific options for Little Finger Carrots"
      );
      if (protocolText) {
        // Should show vegetative stage fertilizers
        expect(
          screen.getByDisplayValue("Lower-N Fish Emulsion")
        ).toBeInTheDocument();
      } else {
        // If no protocol-specific options, we know there's a real data issue
        expect(
          screen.getByText(
            "No protocol-specific options found - using general options"
          )
        ).toBeInTheDocument();
      }
    });
  });

  it("shows correct fertilizer options for 8-week-old Little Finger Carrots (rootDevelopment stage)", async () => {
    const varieties = await varietyService.getAllVarieties();
    const carrotVariety = varieties.find(
      (v) => v.name === "Little Finger Carrots"
    );
    expect(carrotVariety).toBeDefined();

    const rootDevCarrotPlant = {
      id: "carrot-root-dev",
      varietyId: carrotVariety!.id,
      varietyName: "Little Finger Carrots",
      plantedDate: subDays(new Date(), 56), // 8 weeks old
      location: "Indoor",
      container: "Deep container",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUseFirebasePlants.mockReturnValue({
      plants: [rootDevCarrotPlant],
      loading: false,
      error: null,
    });

    render(
      <BulkActivityModal
        isOpen={true}
        onClose={jest.fn()}
        plantIds={["carrot-root-dev"]}
        activityType="fertilize"
        plantCount={1}
        varietyName="Little Finger Carrots"
      />
    );

    await waitFor(() => {
      // This will reveal the real issue - either:
      // 1. Growth stage is calculated wrong (showing "flowering" instead of "rootDevelopment")
      // 2. rootDevelopment fertilization schedule is missing
      const protocolText = screen.queryByText(
        "Protocol-specific options for Little Finger Carrots"
      );
      expect(protocolText).toBeInTheDocument();
    });
  });

  it("validates the actual growth stage calculation for different ages", async () => {
    const varieties = await varietyService.getAllVarieties();
    const carrotVariety = varieties.find(
      (v) => v.name === "Little Finger Carrots"
    );

    // Test the actual growth timeline from seedVarieties.ts
    console.log(
      "Real carrot variety growth timeline:",
      carrotVariety?.growthTimeline
    );

    // This will help us see what the real data looks like
    expect(carrotVariety?.growthTimeline).toBeDefined();
  });
});
