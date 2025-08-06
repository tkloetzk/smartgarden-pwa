// src/utils/containerGrouping.ts
import { PlantGroup } from "./plantGrouping";

export interface ContainerGroup {
  containerName: string;
  plantGroups: PlantGroup[];
  totalPlants: number;
  needsCareCount: number;
}

export const groupPlantGroupsByContainer = (
  plantGroups: PlantGroup[]
): ContainerGroup[] => {
  const containerMap = new Map<string, PlantGroup[]>();

  // Group by container name
  plantGroups.forEach((plantGroup) => {
    const containerName = plantGroup.container || "Unassigned Container";
    
    if (!containerMap.has(containerName)) {
      containerMap.set(containerName, []);
    }
    containerMap.get(containerName)!.push(plantGroup);
  });

  // Convert to ContainerGroup array
  const containerGroups: ContainerGroup[] = [];
  
  containerMap.forEach((groups, containerName) => {
    const totalPlants = groups.reduce((sum, group) => sum + group.plants.length, 0);
    
    containerGroups.push({
      containerName,
      plantGroups: groups.sort((a, b) => a.varietyName.localeCompare(b.varietyName)),
      totalPlants,
      needsCareCount: 0 // Will be calculated later when we have care status
    });
  });

  return containerGroups.sort((a, b) => a.containerName.localeCompare(b.containerName));
};

export const findContainerMates = (
  targetPlantGroup: PlantGroup,
  allPlantGroups: PlantGroup[]
): PlantGroup[] => {
  return allPlantGroups.filter((group) => 
    group.id !== targetPlantGroup.id && 
    group.container === targetPlantGroup.container
  );
};