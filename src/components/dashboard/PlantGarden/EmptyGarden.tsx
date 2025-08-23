import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export interface EmptyGardenProps {
  onNavigateToAddPlant: () => void;
}

export const EmptyGarden = ({ onNavigateToAddPlant }: EmptyGardenProps) => {
  return (
    <Card>
      <CardContent className="text-center py-8">
        <h3
          className="text-lg font-semibold mb-2"
          data-testid="welcome-message-title"
        >
          🌱 Welcome to SmartGarden!
        </h3>
        <p className="text-muted-foreground mb-4">
          Start your gardening journey by adding your first plant. Track
          growth, log care activities, and get personalized recommendations.
        </p>
        <Button onClick={onNavigateToAddPlant}>🌿 Add Your First Plant</Button>
      </CardContent>
    </Card>
  );
};