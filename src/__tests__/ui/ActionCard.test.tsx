/**
 * Tests for ActionCard generic UI component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { Calendar } from "lucide-react";
import { ActionCard, StatusCard, LoadingCard } from "@/components/ui/ActionCard";

describe("ActionCard", () => {
  const defaultProps = {
    title: "Test Card Title",
    children: <div>Test content</div>,
  };

  it("renders with basic props", () => {
    render(<ActionCard {...defaultProps} />);
    
    expect(screen.getByText("Test Card Title")).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders with icon", () => {
    render(
      <ActionCard 
        {...defaultProps} 
        icon={<Calendar data-testid="calendar-icon" />} 
      />
    );
    
    expect(screen.getByTestId("calendar-icon")).toBeInTheDocument();
  });

  it("renders with badge", () => {
    render(
      <ActionCard 
        {...defaultProps} 
        badge={{ text: "High Priority", variant: "destructive" }} 
      />
    );
    
    expect(screen.getByText("High Priority")).toBeInTheDocument();
  });

  it("applies priority styling", () => {
    const { container } = render(
      <ActionCard {...defaultProps} priority="high" />
    );
    
    expect(container.firstChild).toHaveClass("border-l-red-500");
  });

  it("handles click events", () => {
    const handleClick = jest.fn();
    render(<ActionCard {...defaultProps} onClick={handleClick} />);
    
    fireEvent.click(screen.getByText("Test Card Title").closest('[role="button"], div')!);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("handles header click events", () => {
    const handleHeaderClick = jest.fn();
    render(<ActionCard {...defaultProps} onHeaderClick={handleHeaderClick} />);
    
    fireEvent.click(screen.getByText("Test Card Title"));
    expect(handleHeaderClick).toHaveBeenCalledTimes(1);
  });

  it("renders header actions", () => {
    const headerActions = <button data-testid="action-button">Action</button>;
    render(<ActionCard {...defaultProps} headerActions={headerActions} />);
    
    expect(screen.getByTestId("action-button")).toBeInTheDocument();
  });

  it("hides header when hideHeader is true", () => {
    render(<ActionCard {...defaultProps} hideHeader={true} />);
    
    expect(screen.queryByText("Test Card Title")).not.toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <ActionCard {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("StatusCard", () => {
  it("renders with status badge", () => {
    render(
      <StatusCard
        title="Status Card"
        status="Completed"
        statusVariant="secondary"
      >
        <div>Status content</div>
      </StatusCard>
    );
    
    expect(screen.getByText("Status Card")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Status content")).toBeInTheDocument();
  });
});

describe("LoadingCard", () => {
  it("renders loading state", () => {
    render(<LoadingCard title="Loading..." lines={3} />);
    
    // Should have animated elements for loading state
    const animatedElements = document.querySelectorAll(".animate-pulse");
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it("renders custom number of loading lines", () => {
    const { container } = render(<LoadingCard lines={5} />);
    
    // Count loading line elements (excluding icon and title)
    const loadingLines = container.querySelectorAll(".animate-pulse");
    expect(loadingLines.length).toBeGreaterThan(3); // Should have more elements with 5 lines
  });

  it("uses isLoading prop from ActionCard", () => {
    render(
      <ActionCard 
        title="Test" 
        isLoading={true}
      >
        <div>Should not be visible</div>
      </ActionCard>
    );
    
    // Should show loading state
    const animatedElements = document.querySelectorAll(".animate-pulse");
    expect(animatedElements.length).toBeGreaterThan(0);
    
    // Content should not be visible
    expect(screen.queryByText("Should not be visible")).not.toBeInTheDocument();
  });
});