// src/components/CatchUpTaskCard.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Droplet } from "lucide-react";

// Create a simple CatchUpTaskCard component for Storybook
const CatchUpTaskCard = ({
  taskName,
  plantName,
  daysMissed,
  suggestedAction,
  reason,
}: {
  taskName: string;
  plantName: string;
  daysMissed: number;
  suggestedAction: "reschedule" | "skip" | "log-as-done";
  reason: string;
}) => (
  <Card className="w-full max-w-md">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Droplet className="h-5 w-5 text-blue-500" />
          {taskName}
        </CardTitle>
        <Badge variant={daysMissed > 7 ? "destructive" : "secondary"}>
          {daysMissed} days overdue
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{plantName}</p>
    </CardHeader>
    <CardContent>
      <p className="text-sm mb-4">{reason}</p>
      <div className="flex gap-2">
        <Button size="sm">
          {suggestedAction === "reschedule" ? "Log Now" : "Mark Complete"}
        </Button>
        <Button size="sm" variant="outline">
          Skip
        </Button>
      </div>
    </CardContent>
  </Card>
);

const meta: Meta<typeof CatchUpTaskCard> = {
  title: "Components/CatchUpTaskCard",
  component: CatchUpTaskCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WateringOverdue: Story = {
  args: {
    taskName: "Water Plant",
    plantName: "Little Finger Carrots",
    daysMissed: 5,
    suggestedAction: "reschedule",
    reason: "Consistent moisture is critical for root development",
  },
};

export const FertilizingCritical: Story = {
  args: {
    taskName: "Fertilize Plant",
    plantName: "Little Finger Carrots",
    daysMissed: 12,
    suggestedAction: "reschedule",
    reason: "Root vegetables need phosphorus for proper development",
  },
};

export const ShouldSkip: Story = {
  args: {
    taskName: "Pruning",
    plantName: "Little Finger Carrots",
    daysMissed: 30,
    suggestedAction: "skip",
    reason: "Pruning opportunity may have passed for this growth stage",
  },
};
