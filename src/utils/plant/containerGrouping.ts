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
    let containerName = plantGroup.container || "Unassigned Container";
    
    // Extract base container name by removing section information
    // Handle patterns like "🏗️ Little Finger Carrots Bed - Row 3, Column 1"
    const sectionPatterns = [
      / - Row \d+, Column \d+/,
      / - Section .+$/,
      / - R\d+C\d+/,
      / - \d+,\d+/
    ];
    
    for (const pattern of sectionPatterns) {
      containerName = containerName.replace(pattern, '');
    }
    
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

  const result = containerGroups.sort((a, b) => a.containerName.localeCompare(b.containerName));
  
  
  return result;
};

export const findContainerMates = (
  targetPlantGroup: PlantGroup,
  allPlantGroups: PlantGroup[]
): PlantGroup[] => {
  // Extract base container name for both target and other groups
  const getBaseContainerName = (container: string) => {
    let containerName = container || "Unassigned Container";
    
    // Remove section information to get base container name
    const sectionPatterns = [
      / - Row \d+, Column \d+/,
      / - Section .+$/,
      / - R\d+C\d+/,
      / - \d+,\d+/
    ];
    
    for (const pattern of sectionPatterns) {
      containerName = containerName.replace(pattern, '');
    }
    
    return containerName;
  };

  const targetBaseContainer = getBaseContainerName(targetPlantGroup.container);
  
  return allPlantGroups.filter((group) => 
    group.id !== targetPlantGroup.id && 
    getBaseContainerName(group.container) === targetBaseContainer
  );
};