// src/pages/catch-up/CatchUpPage.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { CatchUpPage } from "./index";
import { BrowserRouter } from "react-router-dom";

// Mock the hooks and services
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { CatchUpAnalysisService } from "@/services/CatchUpAnalysisService";

// Create mock data
const mockUser = { uid: "test-user-123" };
const mockPlants = [
  {
    id: "carrot-1",
    name: "Little Finger Carrots",
    varietyName: "Little Finger Carrots",
    plantedDate: new Date("2024-11-27"), // 7 weeks ago from current date
    location: "Indoor",
    container: "Deep container",
    isActive: true,
  },
];

const mockOpportunities = [
  {
    id: "water-1",
    plantId: "carrot-1",
    plantName: "Little Finger Carrots",
    taskName: "Water Plant",
    taskType: "water" as const,
    daysMissed: 5,
    suggestedAction: "reschedule" as const,
    reason: "Consistent moisture is critical for root development",
    originalDueDate: new Date("2025-01-10"),
  },
  {
    id: "fertilize-1",
    plantId: "carrot-1",
    plantName: "Little Finger Carrots",
    taskName: "Fertilize Plant",
    taskType: "fertilize" as const,
    daysMissed: 12,
    suggestedAction: "reschedule" as const,
    reason: "Root vegetables need phosphorus for proper development",
    originalDueDate: new Date("2025-01-03"),
  },
];

// Mock the hooks
jest.mock("@/hooks/useFirebaseAuth", () => ({
  useFirebaseAuth: jest.fn(),
}));

jest.mock("@/hooks/useFirebasePlants", () => ({
  useFirebasePlants: jest.fn(),
}));

jest.mock("@/services/CatchUpAnalysisService", () => ({
  CatchUpAnalysisService: {
    findMissedOpportunitiesWithUserId: jest.fn(),
  },
}));

const meta: Meta<typeof CatchUpPage> = {
  title: "Pages/Catch-Up",
  component: CatchUpPage,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "garden" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithCatchUpTasks: Story = {
  beforeEach: () => {
    (useFirebaseAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useFirebasePlants as jest.Mock).mockReturnValue({
      plants: mockPlants,
      loading: false,
    });
    (
      CatchUpAnalysisService.findMissedOpportunitiesWithUserId as jest.Mock
    ).mockResolvedValue(mockOpportunities);
  },
};

export const NoCatchUpNeeded: Story = {
  beforeEach: () => {
    (useFirebaseAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useFirebasePlants as jest.Mock).mockReturnValue({
      plants: mockPlants,
      loading: false,
    });
    (
      CatchUpAnalysisService.findMissedOpportunitiesWithUserId as jest.Mock
    ).mockResolvedValue([]);
  },
};

export const Loading: Story = {
  beforeEach: () => {
    (useFirebaseAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useFirebasePlants as jest.Mock).mockReturnValue({
      plants: [],
      loading: true,
    });
  },
};
