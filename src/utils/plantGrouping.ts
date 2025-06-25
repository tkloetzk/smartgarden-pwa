// src/utils/plantGrouping.ts
import { PlantRecord } from "@/types/database";

export interface PlantGroup {
  id: string;
  varietyId: string;
  varietyName: string;
  plantedDate: Date;
  container: string;
  soilMix?: string;
  location: string;
  plants: PlantRecord[];
  setupType: "multiple-containers" | "same-container";
}

export const groupPlantsByConditions = (
  plants: PlantRecord[]
): PlantGroup[] => {
  const groupMap = new Map<string, PlantRecord[]>();

  plants.forEach((plant) => {
    // Create a key based on matching criteria
    const key = `${plant.varietyId}-${
      plant.plantedDate.toISOString().split("T")[0]
    }-${plant.container}-${plant.soilMix || "no-soil"}-${plant.location}`;

    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(plant);
  });

  const groups: PlantGroup[] = [];

  groupMap.forEach((plantsInGroup) => {
    if (plantsInGroup.length === 0) return;

    // Use the first plant as the template for group properties
    const templatePlant = plantsInGroup[0];

    groups.push({
      id: `group-${
        templatePlant.varietyId
      }-${templatePlant.plantedDate.getTime()}`,
      varietyId: templatePlant.varietyId,
      varietyName: templatePlant.varietyName,
      plantedDate: templatePlant.plantedDate,
      container: templatePlant.container,
      soilMix: templatePlant.soilMix,
      location: templatePlant.location,
      plants: plantsInGroup.sort(
        (a, b) => a.name?.localeCompare(b.name || "") || 0
      ),
      setupType: templatePlant.setupType || "multiple-containers",
    });
  });

  return groups.sort((a, b) => a.varietyName.localeCompare(b.varietyName));
};
