/**
 * Tests for ActionButtonGroup generic UI component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { Settings } from "lucide-react";
import {
  ActionButtonGroup,
  PrimaryCancelButtons,
  QuickActionButtons,
  ToggleActionButton
} from "@/components/ui/ActionButtonGroup";

describe("ActionButtonGroup", () => {
  const mockButtons = [
    {
      id: "save",
      label: "Save",
      onClick: vi.fn(),
    },
    {
      id: "cancel",
      label: "Cancel",
      variant: "outline" as const,
      onClick: vi.fn(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders buttons with correct labels", () => {
    render(<ActionButtonGroup buttons={mockButtons} />);

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("handles button clicks", () => {
    render(<ActionButtonGroup buttons={mockButtons} />);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(mockButtons[0].onClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockButtons[1].onClick).toHaveBeenCalledTimes(1);
  });

  it("renders buttons with icons", () => {
    const buttonsWithIcons = [
      {
        id: "settings",
        label: "Settings",
        icon: <Settings data-testid="settings-icon" />,
        onClick: vi.fn(),
      },
    ];

    render(<ActionButtonGroup buttons={buttonsWithIcons} />);
    
    expect(screen.getByTestId("settings-icon")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
  });

  it("applies grid layout correctly", () => {
    const { container } = render(
      <ActionButtonGroup 
        buttons={mockButtons} 
        layout="grid" 
        gridCols={3} 
      />
    );
    
    expect(container.firstChild).toHaveClass("grid", "grid-cols-3");
  });

  it("applies flex layout correctly", () => {
    const { container } = render(
      <ActionButtonGroup 
        buttons={mockButtons} 
        layout="flex" 
      />
    );
    
    expect(container.firstChild).toHaveClass("flex", "flex-wrap");
  });

  it("applies vertical layout correctly", () => {
    const { container } = render(
      <ActionButtonGroup 
        buttons={mockButtons} 
        layout="vertical" 
      />
    );
    
    expect(container.firstChild).toHaveClass("flex", "flex-col");
  });

  it("handles disabled buttons", () => {
    const disabledButtons = [
      {
        id: "disabled",
        label: "Disabled",
        onClick: vi.fn(),
        disabled: true,
      },
    ];

    render(<ActionButtonGroup buttons={disabledButtons} />);
    
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(disabledButtons[0].onClick).not.toHaveBeenCalled();
  });

  it("shows loading state", () => {
    const loadingButtons = [
      {
        id: "loading",
        label: "Loading",
        onClick: vi.fn(),
        loading: true,
      },
    ];

    render(<ActionButtonGroup buttons={loadingButtons} />);
    
    // Should show spinner and disable button
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    
    // Check for loading spinner
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });
});

describe("PrimaryCancelButtons", () => {
  const mockOnPrimary = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default labels", () => {
    render(
      <PrimaryCancelButtons 
        onPrimary={mockOnPrimary}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("renders with custom labels", () => {
    render(
      <PrimaryCancelButtons 
        primaryLabel="Delete"
        cancelLabel="Keep"
        onPrimary={mockOnPrimary}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep" })).toBeInTheDocument();
  });

  it("handles primary button click", () => {
    render(
      <PrimaryCancelButtons 
        onPrimary={mockOnPrimary}
        onCancel={mockOnCancel}
      />
    );
    
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(mockOnPrimary).toHaveBeenCalledTimes(1);
  });

  it("handles cancel button click", () => {
    render(
      <PrimaryCancelButtons 
        onPrimary={mockOnPrimary}
        onCancel={mockOnCancel}
      />
    );
    
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("disables primary when loading", () => {
    render(
      <PrimaryCancelButtons 
        onPrimary={mockOnPrimary}
        onCancel={mockOnCancel}
        primaryLoading={true}
      />
    );
    
    const buttons = screen.getAllByRole("button");
    const primaryButton = buttons.find(btn => (btn as HTMLButtonElement).disabled);
    expect(primaryButton).toBeDisabled();
  });
});

describe("QuickActionButtons", () => {
  const mockActions = {
    onWater: vi.fn(),
    onFertilize: vi.fn(),
    onObserve: vi.fn(),
    onPrune: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all provided action buttons", () => {
    render(<QuickActionButtons {...mockActions} />);
    
    expect(screen.getByRole("button", { name: "💧 Water" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "🌱 Fertilize" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "👁️ Observe" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "✂️ Prune" })).toBeInTheDocument();
  });

  it("only renders provided actions", () => {
    render(<QuickActionButtons onWater={mockActions.onWater} />);
    
    expect(screen.getByRole("button", { name: "💧 Water" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "🌱 Fertilize" })).not.toBeInTheDocument();
  });

  it("handles action clicks", () => {
    render(<QuickActionButtons {...mockActions} />);
    
    fireEvent.click(screen.getByRole("button", { name: "💧 Water" }));
    expect(mockActions.onWater).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "🌱 Fertilize" }));
    expect(mockActions.onFertilize).toHaveBeenCalledTimes(1);
  });

  it("disables all buttons when disabled prop is true", () => {
    render(<QuickActionButtons {...mockActions} disabled={true} />);
    
    const buttons = screen.getAllByRole("button");
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });
});

describe("ToggleActionButton", () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders inactive state", () => {
    render(
      <ToggleActionButton
        label="Enable"
        isActive={false}
        onClick={mockOnClick}
      />
    );
    
    expect(screen.getByRole("button", { name: "Enable" })).toBeInTheDocument();
  });

  it("renders active state with different label", () => {
    render(
      <ToggleActionButton
        label="Enable"
        activeLabel="Disable"
        isActive={true}
        onClick={mockOnClick}
      />
    );
    
    expect(screen.getByRole("button", { name: "Disable" })).toBeInTheDocument();
  });

  it("handles toggle click", () => {
    render(
      <ToggleActionButton
        label="Toggle"
        isActive={false}
        onClick={mockOnClick}
      />
    );
    
    fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("applies active styling", () => {
    const { container } = render(
      <ToggleActionButton
        label="Toggle"
        isActive={true}
        onClick={mockOnClick}
      />
    );
    
    const button = container.querySelector("button");
    expect(button).toHaveClass("border-primary/50", "bg-primary/10", "text-primary");
  });
});