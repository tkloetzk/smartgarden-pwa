// src/utils/careActivityHelpers.ts - NEW FILE
import { CareActivityType } from "@/types";

export const getTaskTypeIcon = (taskType: CareActivityType): string => {
  switch (taskType) {
    case "water":
      return "💧";
    case "fertilize":
      return "🌱";
    case "observe":
      return "👁️";
    case "harvest":
      return "🌾";
    case "transplant":
      return "🏺";
    case "photo":
      return "📸";
    case "note":
      return "📝";
    case "lighting":
      return "💡";
    case "pruning":
      return "✂️";
    case "thin":
      return "🌿";
    default:
      return "📋";
  }
};

export const getTaskTypeColor = (taskType: CareActivityType): string => {
  switch (taskType) {
    case "water":
      return "bg-blue-50 border-blue-200 text-blue-700";
    case "fertilize":
      return "bg-green-50 border-green-200 text-green-700";
    case "observe":
      return "bg-yellow-50 border-yellow-200 text-yellow-700";
    case "harvest":
      return "bg-orange-50 border-orange-200 text-orange-700";
    case "transplant":
      return "bg-purple-50 border-purple-200 text-purple-700";
    case "photo":
      return "bg-pink-50 border-pink-200 text-pink-700";
    case "note":
      return "bg-gray-50 border-gray-200 text-gray-700";
    case "lighting":
      return "bg-amber-50 border-amber-200 text-amber-700";
    case "pruning":
      return "bg-red-50 border-red-200 text-red-700";
    case "thin":
      return "bg-emerald-50 border-emerald-200 text-emerald-700";
    default:
      return "bg-gray-50 border-gray-200 text-gray-700";
  }
};

export const getTaskTypeLabel = (taskType: CareActivityType): string => {
  switch (taskType) {
    case "water":
      return "Watering";
    case "fertilize":
      return "Fertilizing";
    case "observe":
      return "Health Check";
    case "harvest":
      return "Harvest";
    case "transplant":
      return "Transplanting";
    case "photo":
      return "Photo Documentation";
    case "note":
      return "Notes";
    case "lighting":
      return "Lighting Adjustment";
    case "pruning":
      return "Pruning/Trimming";
    case "thin":
      return "Thinning";
    default:
      return "Care Activity";
  }
};

export const getPriorityColor = (daysMissed: number): string => {
  if (daysMissed <= 2) return "bg-yellow-100 text-yellow-800";
  if (daysMissed <= 7) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
};
