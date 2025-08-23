import { useMemo } from "react";
import { groupPlantsByConditions, PlantGroup } from "@/utils/plantGrouping";
import {
  groupPlantGroupsByContainer,
  ContainerGroup,
} from "@/utils/containerGrouping";

export interface ContainerGroupsManager {
  plantGroups: PlantGroup[];
  containerGroups: ContainerGroup[];
  visiblePlants: any[];
  visiblePlantsCount: number;
}

export const useContainerGroups = (
  plants: any[] | null,
  loading: boolean,
  hiddenGroups: Set<string>
): ContainerGroupsManager => {
  // Generate plant groups from plants
  const plantGroups = useMemo(() => {
    if (!loading && plants) {
      return groupPlantsByConditions(plants);
    }
    return [];
  }, [plants, loading]);

  // Get visible plants (not in hidden groups)
  const visiblePlants = useMemo(() => {
    if (!plants) return [];

    // Find all plants that are in visible groups (not hidden)
    const visibleGroups = plantGroups.filter(
      (group) => !hiddenGroups.has(group.id)
    );
    return visibleGroups.flatMap((group) => group.plants);
  }, [plants, plantGroups, hiddenGroups]);

  // Calculate visible plants count
  const visiblePlantsCount = useMemo(() => {
    return visiblePlants.length;
  }, [visiblePlants]);

  // Generate container groups from visible plant groups
  const containerGroups = useMemo(() => {
    // Filter out hidden groups
    const visibleGroups = plantGroups.filter(
      (group) => !hiddenGroups.has(group.id)
    );
    return groupPlantGroupsByContainer(visibleGroups);
  }, [plantGroups, hiddenGroups]);

  return {
    plantGroups,
    containerGroups,
    visiblePlants,
    visiblePlantsCount,
  };
};