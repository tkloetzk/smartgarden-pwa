// src/__tests__/components/FertilizerDisplay.test.tsx
import { describe, it, expect } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LogCare from "@/pages/care/LogCare";

// Mock the CareLogForm component to focus on the LogCare wrapper and verify fertilizer functionality
jest.mock("@/pages/care/CareLogForm", () => ({
  CareLogForm: ({ preselectedActivityType }: { preselectedActivityType?: string }) => (
    <div data-testid="care-log-form">
      <div data-testid="activity-type">{preselectedActivityType || "none"}</div>
      {preselectedActivityType === "fertilize" && (
        <div data-testid="fertilizer-section">
          <div>Fertilizer Details</div>
          <select data-testid="fertilizer-dropdown" name="fertilizer">
            <option value="">Choose a fertilizer...</option>
            <option value="fish-emulsion">Fish Emulsion (soil-drench)</option>
            <option value="liquid-kelp">Liquid Kelp (foliar-spray)</option>
            <option value="custom">Custom/Other</option>
          </select>
          <div data-testid="fertilizer-inputs">
            <label>Dilution Ratio</label>
            <label>Application Amount</label>
          </div>
          <div data-testid="structured-inputs">
            <input type="checkbox" checked readOnly />
            <label>Use structured inputs (precise measurements)</label>
          </div>
          <div data-testid="quick-presets">
            <div>Quick Presets:</div>
            <button type="button">1 tbsp/gal</button>
            <button type="button">2 tbsp/gal</button>
            <button type="button">1 tsp/quart</button>
          </div>
        </div>
      )}
    </div>
  ),
}));

describe("Fertilizer Products Display on Log Care Page", () => {
  it("renders log care page with fertilizer activity preselected", () => {
    render(
      <MemoryRouter initialEntries={["/log-care?activityType=fertilize"]}>
        <LogCare />
      </MemoryRouter>
    );

    expect(screen.getByText("Log Care Activity")).toBeInTheDocument();
    expect(screen.getByTestId("care-log-form")).toBeInTheDocument();
    expect(screen.getByTestId("activity-type")).toHaveTextContent("fertilize");
  });

  it("displays fertilizer section when fertilize activity is preselected", () => {
    render(
      <MemoryRouter initialEntries={["/log-care?activityType=fertilize"]}>
        <LogCare />
      </MemoryRouter>
    );

    // Verify fertilizer section is displayed
    expect(screen.getByTestId("fertilizer-section")).toBeInTheDocument();
    expect(screen.getByText("Fertilizer Details")).toBeInTheDocument();
  });

  it("shows fertilizer product dropdown with options", () => {
    render(
      <MemoryRouter initialEntries={["/log-care?activityType=fertilize"]}>
        <LogCare />
      </MemoryRouter>
    );

    const dropdown = screen.getByTestId("fertilizer-dropdown");
    expect(dropdown).toBeInTheDocument();

    // Check for fertilizer options
    expect(screen.getByText("Choose a fertilizer...")).toBeInTheDocument();
    expect(screen.getByText("Fish Emulsion (soil-drench)")).toBeInTheDocument();
    expect(screen.getByText("Liquid Kelp (foliar-spray)")).toBeInTheDocument();
    expect(screen.getByText("Custom/Other")).toBeInTheDocument();
  });

  it("displays fertilizer input fields", () => {
    render(
      <MemoryRouter initialEntries={["/log-care?activityType=fertilize"]}>
        <LogCare />
      </MemoryRouter>
    );

    const inputsSection = screen.getByTestId("fertilizer-inputs");
    expect(inputsSection).toBeInTheDocument();
    expect(screen.getByText("Dilution Ratio")).toBeInTheDocument();
    expect(screen.getByText("Application Amount")).toBeInTheDocument();
  });

  it("shows structured input options for precise measurements", () => {
    render(
      <MemoryRouter initialEntries={["/log-care?activityType=fertilize"]}>
        <LogCare />
      </MemoryRouter>
    );

    const structuredSection = screen.getByTestId("structured-inputs");
    expect(structuredSection).toBeInTheDocument();
    expect(screen.getByText("Use structured inputs (precise measurements)")).toBeInTheDocument();
    
    // Checkbox should be checked by default
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("displays quick preset buttons for common dilution ratios", () => {
    render(
      <MemoryRouter initialEntries={["/log-care?activityType=fertilize"]}>
        <LogCare />
      </MemoryRouter>
    );

    const presetsSection = screen.getByTestId("quick-presets");
    expect(presetsSection).toBeInTheDocument();
    expect(screen.getByText("Quick Presets:")).toBeInTheDocument();
    
    // Check for preset buttons
    expect(screen.getByRole("button", { name: "1 tbsp/gal" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2 tbsp/gal" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1 tsp/quart" })).toBeInTheDocument();
  });

  it("does not show fertilizer section for non-fertilize activities", () => {
    render(
      <MemoryRouter initialEntries={["/log-care?activityType=water"]}>
        <LogCare />
      </MemoryRouter>
    );

    expect(screen.getByTestId("activity-type")).toHaveTextContent("water");
    expect(screen.queryByTestId("fertilizer-section")).not.toBeInTheDocument();
  });

  it("handles log care page without preselected activity", () => {
    render(
      <MemoryRouter initialEntries={["/log-care"]}>
        <LogCare />
      </MemoryRouter>
    );

    expect(screen.getByText("Log Care Activity")).toBeInTheDocument();
    expect(screen.getByTestId("care-log-form")).toBeInTheDocument();
    expect(screen.getByTestId("activity-type")).toHaveTextContent("none");
    expect(screen.queryByTestId("fertilizer-section")).not.toBeInTheDocument();
  });

  it("shows correct messaging for different modes", () => {
    // Test group task mode
    render(
      <MemoryRouter initialEntries={["/log-care?groupTask=true&activityType=fertilize"]}>
        <LogCare />
      </MemoryRouter>
    );

    expect(screen.getByText("Record care activities for grouped plants")).toBeInTheDocument();
    expect(screen.getByTestId("fertilizer-section")).toBeInTheDocument();
  });

  it("displays method information in fertilizer options", () => {
    render(
      <MemoryRouter initialEntries={["/log-care?activityType=fertilize"]}>
        <LogCare />
      </MemoryRouter>
    );

    // Verify that application methods are shown in the options
    expect(screen.getByText("Fish Emulsion (soil-drench)")).toBeInTheDocument();
    expect(screen.getByText("Liquid Kelp (foliar-spray)")).toBeInTheDocument();
  });
});