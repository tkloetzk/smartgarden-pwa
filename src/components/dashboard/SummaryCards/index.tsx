import { ReactNode } from "react";
import { CareStatusCard } from "./CareStatusCard";
import { PlantCountCard } from "./PlantCountCard";
import { FertilizationTasksCard } from "./FertilizationTasksCard";

interface SummaryCardsProps {
  children: ReactNode;
}

export const SummaryCards = ({ children }: SummaryCardsProps) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  );
};

// Compound component pattern - attach sub-components
SummaryCards.CareStatus = CareStatusCard;
SummaryCards.PlantCount = PlantCountCard;
SummaryCards.FertilizationTasks = FertilizationTasksCard;

export { CareStatusCard, PlantCountCard, FertilizationTasksCard };