import { Card, CardContent } from "@/components/ui/Card";

export interface FertilizationTasksCardProps {
  upcomingFertilizationCount: number;
}

export const FertilizationTasksCard = ({
  upcomingFertilizationCount,
}: FertilizationTasksCardProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Fertilization Tasks
            </p>
            <p className="text-2xl font-bold">{upcomingFertilizationCount}</p>
            <p className="text-xs text-muted-foreground">due this week</p>
          </div>
          <div className="text-2xl">🌱</div>
        </div>
      </CardContent>
    </Card>
  );
};