// src/__tests__/components/LogCare.test.tsx
import { describe, it, expect, beforeEach } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LogCare from "@/pages/care/LogCare";
import { initializeDatabase } from "@/db/seedData";

// Mock the CareLogForm component for testing with all new props
jest.mock("@/pages/care/CareLogForm", () => ({
  CareLogForm: ({ 
    preselectedPlantId, 
    preselectedActivityType
  }: { 
    preselectedPlantId?: string;
    preselectedActivityType?: string;
  }) => (
    <div data-testid="care-log-form">
      {preselectedPlantId && (
        <div data-testid="pre-selected-plant-id">{preselectedPlantId}</div>
      )}
      {preselectedActivityType && (
        <div data-testid="pre-selected-activity-type">{preselectedActivityType}</div>
      )}
    </div>
  ),
}));

describe("LogCare", () => {
  beforeEach(async () => {
    await initializeDatabase();
  });

  it("renders without a pre-selected plant", () => {
    render(
      <MemoryRouter initialEntries={["/log-care"]}>
        <LogCare />
      </MemoryRouter>
    );

    expect(screen.getByText("Log Care Activity")).toBeInTheDocument();
    expect(screen.getByTestId("care-log-form")).toBeInTheDocument();
    expect(
      screen.queryByTestId("pre-selected-plant-id")
    ).not.toBeInTheDocument();
  });

  it("passes pre-selected plant ID from URL params to CareLogForm", () => {
    const testPlantId = "test-plant-123";

    render(
      <MemoryRouter initialEntries={[`/log-care?plantId=${testPlantId}`]}>
        <LogCare />
      </MemoryRouter>
    );

    expect(screen.getByText("Log Care Activity")).toBeInTheDocument();
    expect(screen.getByTestId("care-log-form")).toBeInTheDocument();
    expect(screen.getByTestId("pre-selected-plant-id")).toHaveTextContent(
      testPlantId
    );
  });

  it("passes activity type from URL params to CareLogForm", () => {
    const testPlantId = "test-plant-123";
    const activityType = "water";

    render(
      <MemoryRouter initialEntries={[`/log-care?plantId=${testPlantId}&activityType=${activityType}`]}>
        <LogCare />
      </MemoryRouter>
    );

    expect(screen.getByTestId("pre-selected-activity-type")).toHaveTextContent(activityType);
  });

  it("displays group task message when groupTask=true", () => {
    render(
      <MemoryRouter initialEntries={["/log-care?groupTask=true"]}>
        <LogCare />
      </MemoryRouter>
    );

    expect(screen.getByText("Record care activities for grouped plants")).toBeInTheDocument();
  });

  it("displays regular message when groupTask=false or absent", () => {
    render(
      <MemoryRouter initialEntries={["/log-care"]}>
        <LogCare />
      </MemoryRouter>
    );

    expect(screen.getByText("Record care activities for your plants")).toBeInTheDocument();
  });

  it("handles all URL parameters together", () => {
    const testPlantId = "test-plant-456";
    const activityType = "fertilize";

    render(
      <MemoryRouter 
        initialEntries={[`/log-care?plantId=${testPlantId}&activityType=${activityType}&groupTask=true`]}
      >
        <LogCare />
      </MemoryRouter>
    );

    expect(screen.getByTestId("pre-selected-plant-id")).toHaveTextContent(testPlantId);
    expect(screen.getByTestId("pre-selected-activity-type")).toHaveTextContent(activityType);
    expect(screen.getByText("Record care activities for grouped plants")).toBeInTheDocument();
  });
});
