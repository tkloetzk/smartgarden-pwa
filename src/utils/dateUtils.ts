// src/utils/dateUtils.ts
import { differenceInDays } from "date-fns";

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getDaysSincePlanting(plantedDate: Date): number {
  const now = new Date();
  // Using differenceInDays is more robust for calendar day calculations.
  // We add 1 to make the count inclusive (e.g., planting day is "Day 1").
  const days = differenceInDays(now, plantedDate);
  return days + 1;
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
