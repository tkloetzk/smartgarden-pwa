import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { toast } from "react-hot-toast";
import BulkActivityModal from "@/components/plant/BulkActivityModal";
import { useFirebaseCareActivities } from "@/hooks/useFirebaseCareActivities";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";

// Mock the hooks
jest.mock("@/hooks/useFirebaseCareActivities");
jest.mock("@/hooks/useFirebasePlants");
jest.mock("react-hot-toast");

const mockUseFirebaseCareActivities = useFirebaseCareActivities as jest.MockedFunction<
  typeof useFirebaseCareActivities
>;
const mockUseFirebasePlants = useFirebasePlants as jest.MockedFunction<
  typeof useFirebasePlants
>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe("BulkActivityModal - Thinning", () => {
  const mockLogActivity = jest.fn();
  const mockDeletePlant = jest.fn();
  const mockOnClose = jest.fn();

  const mockPlants = [
    {
      id: "plant-1",
      varietyName: "Carrots",
      varietyId: "carrots-variety",
      plantedDate: new Date("2024-01-01"),
      location: "Indoor",
      container: "6-inch pot",
      isActive: true,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    {
      id: "plant-2", 
      varietyName: "Carrots",
      varietyId: "carrots-variety",
      plantedDate: new Date("2024-01-01"),
      location: "Indoor",
      container: "6-inch pot",
      isActive: true,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    {
      id: "plant-3",
      varietyName: "Carrots", 
      varietyId: "carrots-variety",
      plantedDate: new Date("2024-01-01"),
      location: "Indoor",
      container: "6-inch pot",
      isActive: true,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseFirebaseCareActivities.mockReturnValue({
      activities: [],
      loading: false,
      error: null,
      logActivity: mockLogActivity,
    });

    mockUseFirebasePlants.mockReturnValue({
      plants: mockPlants,
      loading: false,
      error: null,
      createPlant: jest.fn(),
      updatePlant: jest.fn(),
      deletePlant: mockDeletePlant,
    });

    mockLogActivity.mockResolvedValue(undefined);
    mockDeletePlant.mockResolvedValue(undefined);
    mockToast.success = jest.fn();
  });

  it("shows current plant count correctly for thinning", () => {
    render(
      <BulkActivityModal
        isOpen={true}
        onClose={mockOnClose}
        plantIds={["plant-1", "plant-2", "plant-3"]}
        activityType="thin"
        plantCount={3}
        varietyName="Carrots"
      />
    );

    expect(screen.getByText("Current Plant Count:")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("This is the number of plants you're thinning from")).toBeInTheDocument();
  });

  it("logs thinning activity and deactivates plants when final count is entered", async () => {
    render(
      <BulkActivityModal
        isOpen={true}
        onClose={mockOnClose}
        plantIds={["plant-1", "plant-2", "plant-3"]}
        activityType="thin"
        plantCount={3}
        varietyName="Carrots"
      />
    );

    // Enter final count (keep 1 plant, remove 2)
    const finalCountInput = screen.getByLabelText(/Final Plant Count/);
    fireEvent.change(finalCountInput, { target: { value: "1" } });

    // Submit the form
    const submitButton = screen.getByRole("button", { name: /Log Activity for All 3 Plants/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Should log activity for all 3 plants
      expect(mockLogActivity).toHaveBeenCalledTimes(3);
      
      // Should deactivate 2 plants (3 - 1 = 2)
      expect(mockDeletePlant).toHaveBeenCalledTimes(2);
      
      // Should show success message with final count
      expect(mockToast.success).toHaveBeenCalledWith(
        "Thinning completed! 1 plants remaining from 3 original plants 🌱"
      );
      
      // Should close modal
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("validates final count is less than original count", async () => {
    render(
      <BulkActivityModal
        isOpen={true}
        onClose={mockOnClose}
        plantIds={["plant-1", "plant-2", "plant-3"]}
        activityType="thin"
        plantCount={3}
        varietyName="Carrots"
      />
    );

    // Try to enter a final count equal to original (should not deactivate any)
    const finalCountInput = screen.getByLabelText(/Final Plant Count/);
    fireEvent.change(finalCountInput, { target: { value: "3" } });

    const submitButton = screen.getByRole("button", { name: /Log Activity for All 3 Plants/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Should log activity for all plants
      expect(mockLogActivity).toHaveBeenCalledTimes(3);
      
      // Should NOT deactivate any plants since final count equals original
      expect(mockDeletePlant).not.toHaveBeenCalled();
      
      // Should show standard success message
      expect(mockToast.success).toHaveBeenCalledWith(
        "Thinning activity logged for 3 Carrots plants! 🌱"
      );
    });
  });

  it("handles empty final count by not deactivating plants", async () => {
    render(
      <BulkActivityModal
        isOpen={true}
        onClose={mockOnClose}
        plantIds={["plant-1", "plant-2", "plant-3"]}
        activityType="thin"
        plantCount={3}
        varietyName="Carrots"
      />
    );

    // Don't enter final count (leave empty)
    const submitButton = screen.getByRole("button", { name: /Log Activity for All 3 Plants/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Should log activity for all plants
      expect(mockLogActivity).toHaveBeenCalledTimes(3);
      
      // Should NOT deactivate any plants since no final count provided
      expect(mockDeletePlant).not.toHaveBeenCalled();
      
      // Should show standard success message
      expect(mockToast.success).toHaveBeenCalledWith(
        "Activity logged for all 3 Carrots plants! 🌱"
      );
    });
  });

  it("includes correct thinning details in logged activities", async () => {
    render(
      <BulkActivityModal
        isOpen={true}
        onClose={mockOnClose}
        plantIds={["plant-1", "plant-2", "plant-3"]}
        activityType="thin"
        plantCount={3}
        varietyName="Carrots"
      />
    );

    const finalCountInput = screen.getByLabelText(/Final Plant Count/);
    fireEvent.change(finalCountInput, { target: { value: "2" } });

    const notesInput = screen.getByLabelText(/Notes/);
    fireEvent.change(notesInput, { target: { value: "Removed overcrowded seedlings" } });

    const submitButton = screen.getByRole("button", { name: /Log Activity for All 3 Plants/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Check that activity details include thinning info
      expect(mockLogActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "thin",
          details: expect.objectContaining({
            type: "thin",
            originalCount: 3,
            finalCount: 2,
            notes: "Removed overcrowded seedlings"
          })
        })
      );
    });
  });
});