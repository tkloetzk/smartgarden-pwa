// src/pages/care/__tests__/LogCare.test.tsx
import { describe, it, expect, beforeEach } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LogCare from "../../pages/care/LogCare";
import { initializeDatabase } from "@/db/seedData";

// Mock the CareLogForm component for testing - fix the prop name
jest.mock("@/pages/care/CareLogForm", () => ({
  CareLogForm: ({ preselectedPlantId }: { preselectedPlantId?: string }) => (
    <div data-testid="care-log-form">
      {preselectedPlantId && (
        <div data-testid="pre-selected-plant-id">{preselectedPlantId}</div>
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
});
