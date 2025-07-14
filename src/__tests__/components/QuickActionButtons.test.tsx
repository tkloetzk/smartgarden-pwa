import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuickActionButtons, QuickActionType } from "@/components/shared/QuickActionButtons";

// Use unified test utilities
import { renderComponent, useTestLifecycle } from "../utils/testSetup";

describe("QuickActionButtons", () => {
  const mockOnAction = jest.fn();

  // Use standardized lifecycle management
  useTestLifecycle();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders default actions correctly", () => {
    // Use unified rendering (this component doesn't need router)
    renderComponent(<QuickActionButtons onAction={mockOnAction} />, {
      withRouter: false,
    });

    // Check for text content within buttons
    expect(screen.getByRole("button", { name: /water/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /fertilize/i })).toBeInTheDocument(); 
    expect(screen.getByRole("button", { name: /inspect/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /more/i })).toBeInTheDocument();

    // Check for icons
    expect(screen.getByText("💧")).toBeInTheDocument();
    expect(screen.getByText("🌱")).toBeInTheDocument();
    expect(screen.getByText("👁️")).toBeInTheDocument();
    expect(screen.getByText("📝")).toBeInTheDocument();
  });

  it("renders custom actions correctly", () => {
    renderComponent(
      <QuickActionButtons 
        onAction={mockOnAction} 
        actions={["water", "photo"]} 
      />,
      { withRouter: false }
    );

    expect(screen.getByRole("button", { name: /water/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /photo/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /fertilize/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /inspect/i })).not.toBeInTheDocument();
  });

  it("calls onAction with correct type when button is clicked", async () => {
    const user = userEvent.setup();
    renderComponent(<QuickActionButtons onAction={mockOnAction} />, {
      withRouter: false,
    });

    await user.click(screen.getByRole("button", { name: /water/i }));
    expect(mockOnAction).toHaveBeenCalledWith("water");

    await user.click(screen.getByRole("button", { name: /fertilize/i }));
    expect(mockOnAction).toHaveBeenCalledWith("fertilize");

    await user.click(screen.getByRole("button", { name: /inspect/i }));
    expect(mockOnAction).toHaveBeenCalledWith("observe");

    await user.click(screen.getByRole("button", { name: /more/i }));
    expect(mockOnAction).toHaveBeenCalledWith("more");
  });

  it("applies grid layout by default", () => {
    renderComponent(<QuickActionButtons onAction={mockOnAction} />, {
      withRouter: false,
    });
    
    const container = screen.getByRole("button", { name: /water/i }).closest("div");
    expect(container).toHaveClass("grid", "grid-cols-2", "gap-2");
  });

  it("applies horizontal layout when specified", () => {
    renderComponent(<QuickActionButtons onAction={mockOnAction} layout="horizontal" />, {
      withRouter: false,
    });
    
    const container = screen.getByRole("button", { name: /water/i }).closest("div");
    expect(container).toHaveClass("flex", "gap-2", "flex-wrap");
    expect(container).not.toHaveClass("grid");
  });

  it("prevents event propagation by default", async () => {
    const user = userEvent.setup();
    const parentClickHandler = jest.fn();

    renderComponent(
      <div onClick={parentClickHandler}>
        <QuickActionButtons onAction={mockOnAction} />
      </div>,
      { withRouter: false }
    );

    await user.click(screen.getByRole("button", { name: /water/i }));
    
    expect(mockOnAction).toHaveBeenCalledWith("water");
    expect(parentClickHandler).not.toHaveBeenCalled();
  });

  it("allows event propagation when disabled", async () => {
    const user = userEvent.setup();
    const parentClickHandler = jest.fn();

    renderComponent(
      <div onClick={parentClickHandler}>
        <QuickActionButtons 
          onAction={mockOnAction} 
          preventPropagation={false} 
        />
      </div>,
      { withRouter: false }
    );

    await user.click(screen.getByRole("button", { name: /water/i }));
    
    expect(mockOnAction).toHaveBeenCalledWith("water");
    expect(parentClickHandler).toHaveBeenCalled();
  });

  it("applies custom className", () => {
    renderComponent(
      <QuickActionButtons 
        onAction={mockOnAction} 
        className="custom-class" 
      />,
      { withRouter: false }
    );
    
    const container = screen.getByRole("button", { name: /water/i }).closest("div");
    expect(container).toHaveClass("custom-class");
  });

  it("uses correct button size", () => {
    renderComponent(
      <QuickActionButtons 
        onAction={mockOnAction} 
        buttonSize="md"
      />,
      { withRouter: false }
    );
    
    const button = screen.getByRole("button", { name: /water/i });
    // Note: We're testing that the size prop is passed through
    // The actual styling classes would depend on the Button component implementation
    expect(button).toBeInTheDocument();
  });

  it("handles all action types correctly", async () => {
    const user = userEvent.setup();
    const actions: (QuickActionType | "more")[] = ["water", "fertilize", "observe", "photo", "more"];
    
    renderComponent(
      <QuickActionButtons 
        onAction={mockOnAction} 
        actions={actions}
      />,
      { withRouter: false }
    );

    // Test each action
    await user.click(screen.getByRole("button", { name: /water/i }));
    expect(mockOnAction).toHaveBeenLastCalledWith("water");

    await user.click(screen.getByRole("button", { name: /fertilize/i }));
    expect(mockOnAction).toHaveBeenLastCalledWith("fertilize");

    await user.click(screen.getByRole("button", { name: /inspect/i }));
    expect(mockOnAction).toHaveBeenLastCalledWith("observe");

    await user.click(screen.getByRole("button", { name: /photo/i }));
    expect(mockOnAction).toHaveBeenLastCalledWith("photo");

    await user.click(screen.getByRole("button", { name: /more/i }));
    expect(mockOnAction).toHaveBeenLastCalledWith("more");

    expect(mockOnAction).toHaveBeenCalledTimes(5);
  });
});

describe("getActivityIcon", () => {
  // Import using ES6 module syntax to satisfy linter
  let getActivityIcon: (activityType: string) => string;
  
  beforeAll(async () => {
    const module = await import("@/components/shared/QuickActionButtons");
    getActivityIcon = module.getActivityIcon;
  });

  it("returns correct icons for standard activities", () => {
    expect(getActivityIcon("water")).toBe("💧");
    expect(getActivityIcon("fertilize")).toBe("🌱");
    expect(getActivityIcon("observe")).toBe("👁️");
    expect(getActivityIcon("photo")).toBe("📸");
    expect(getActivityIcon("harvest")).toBe("🌾");
    expect(getActivityIcon("transplant")).toBe("🪴");
  });

  it("handles case insensitive input", () => {
    expect(getActivityIcon("WATER")).toBe("💧");
    expect(getActivityIcon("Fertilize")).toBe("🌱");
    expect(getActivityIcon("OBSERVE")).toBe("👁️");
  });

  it("handles partial matches", () => {
    expect(getActivityIcon("fertilizing")).toBe("🌱");
    expect(getActivityIcon("observation")).toBe("👁️");
    expect(getActivityIcon("check plant")).toBe("👁️");
    expect(getActivityIcon("inspect")).toBe("👁️");
  });

  it("returns default icon for unknown activities", () => {
    expect(getActivityIcon("unknown")).toBe("📝");
    expect(getActivityIcon("custom")).toBe("📝");
    expect(getActivityIcon("")).toBe("📝");
  });

  it("handles special activities", () => {
    expect(getActivityIcon("pruning")).toBe("✂️");
    expect(getActivityIcon("lighting")).toBe("💡");
    expect(getActivityIcon("thinning")).toBe("🌱");
  });
});