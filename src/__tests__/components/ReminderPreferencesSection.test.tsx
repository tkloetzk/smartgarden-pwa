// src/__tests__/components/ReminderPreferencesSection.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReminderPreferencesSection from "@/components/plant/ReminderPreferencesSection";

describe("ReminderPreferencesSection", () => {
  const defaultPreferences = {
    watering: true,
    fertilizing: true,
    observation: true,
    lighting: true,
    pruning: true,
  };

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all reminder types with correct labels", () => {
    render(
      <ReminderPreferencesSection
        preferences={defaultPreferences}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText("Reminder Preferences")).toBeInTheDocument();
    expect(screen.getByText("Watering")).toBeInTheDocument();
    expect(screen.getByText("Fertilizing")).toBeInTheDocument();
    expect(screen.getByText("Health Checks")).toBeInTheDocument();
    expect(screen.getByText("Lighting")).toBeInTheDocument();
    expect(screen.getByText("Maintenance")).toBeInTheDocument();

    // Check descriptions
    expect(
      screen.getByText("Get notified when watering is due")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Reminders for feeding schedule")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Regular observation reminders")
    ).toBeInTheDocument();
  });

  it("displays current preference states correctly", () => {
    const mixedPreferences = {
      watering: true,
      fertilizing: false,
      observation: true,
      lighting: false,
      pruning: true,
    };

    render(
      <ReminderPreferencesSection
        preferences={mixedPreferences}
        onChange={mockOnChange}
      />
    );

    // Check that switches reflect current state
    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(5);

    // Watering should be on
    expect(switches[0]).toHaveAttribute("aria-checked", "true");
    // Fertilizing should be off
    expect(switches[1]).toHaveAttribute("aria-checked", "false");
    // Observation should be on
    expect(switches[2]).toHaveAttribute("aria-checked", "true");
    // Lighting should be off
    expect(switches[3]).toHaveAttribute("aria-checked", "false");
    // Pruning should be on
    expect(switches[4]).toHaveAttribute("aria-checked", "true");
  });

  it("calls onChange when a switch is toggled", async () => {
    const user = userEvent.setup();

    render(
      <ReminderPreferencesSection
        preferences={defaultPreferences}
        onChange={mockOnChange}
      />
    );

    // Click the watering switch to turn it off
    const wateringSwitch = screen.getAllByRole("switch")[0];
    await user.click(wateringSwitch);

    expect(mockOnChange).toHaveBeenCalledWith({
      watering: false, // Should be toggled
      fertilizing: true,
      observation: true,
      lighting: true,
      pruning: true,
    });
  });

  it("toggles multiple preferences correctly", async () => {
    const user = userEvent.setup();

    render(
      <ReminderPreferencesSection
        preferences={defaultPreferences}
        onChange={mockOnChange}
      />
    );

    // Turn off fertilizing
    const fertilizingSwitch = screen.getAllByRole("switch")[1];
    await user.click(fertilizingSwitch);

    expect(mockOnChange).toHaveBeenCalledWith({
      watering: true,
      fertilizing: false, // Toggled off
      observation: true,
      lighting: true,
      pruning: true,
    });

    // Turn off lighting
    const lightingSwitch = screen.getAllByRole("switch")[3];
    await user.click(lightingSwitch);

    expect(mockOnChange).toHaveBeenCalledWith({
      watering: true,
      fertilizing: true,
      observation: true,
      lighting: false, // Toggled off
      pruning: true,
    });
  });

  it("has proper accessibility attributes", () => {
    render(
      <ReminderPreferencesSection
        preferences={defaultPreferences}
        onChange={mockOnChange}
      />
    );

    const switches = screen.getAllByRole("switch");
    switches.forEach((switchElement) => {
      expect(switchElement).toHaveAttribute("aria-checked");
      expect(switchElement).not.toHaveAttribute("aria-disabled");
    });
  });
});
