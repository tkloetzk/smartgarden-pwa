import { Card, CardContent } from "@/components/ui/Card";

export interface PlantCountCardProps {
  visiblePlantsCount: number;
}

export const PlantCountCard = ({ visiblePlantsCount }: PlantCountCardProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Total Plants
            </p>
            <p className="text-2xl font-bold">{visiblePlantsCount}</p>
            <p className="text-xs text-muted-foreground">in your garden</p>
          </div>
          <div className="text-2xl">🪴</div>
        </div>
      </CardContent>
    </Card>
  );
};