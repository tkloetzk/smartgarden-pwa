import { ReactNode } from "react";
import { PlantGardenContainer } from "./PlantGardenContainer";
import { ContainerGroup } from "./ContainerGroup";
import { PlantGroupGrid } from "./PlantGroupGrid";
import { EmptyGarden } from "./EmptyGarden";
import { GardenHeader } from "./GardenHeader";

interface PlantGardenProps {
  children: ReactNode;
}

export const PlantGarden = ({ children }: PlantGardenProps) => {
  return <div>{children}</div>;
};

// Compound component pattern - attach sub-components
PlantGarden.Container = PlantGardenContainer;
PlantGarden.Header = GardenHeader;
PlantGarden.ContainerGroup = ContainerGroup;
PlantGarden.PlantGrid = PlantGroupGrid;
PlantGarden.Empty = EmptyGarden;

export { 
  PlantGardenContainer, 
  ContainerGroup, 
  PlantGroupGrid, 
  EmptyGarden,
  GardenHeader 
};