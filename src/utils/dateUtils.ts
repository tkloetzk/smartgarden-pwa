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

export function formatDueIn(dueDate: Date): string {
  const now = new Date();
  const diffDays = differenceInDays(dueDate, now);

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} day${
      Math.abs(diffDays) !== 1 ? "s" : ""
    } overdue`;
  } else if (diffDays === 0) {
    return "Due today";
  } else if (diffDays === 1) {
    return "Due tomorrow";
  } else {
    return `Due in ${diffDays} days`;
  }
}

export function calculatePriority(
  daysOverdue: number
): "low" | "medium" | "high" | "overdue" {
  if (daysOverdue > 0) return "overdue";
  if (daysOverdue === 0) return "high";
  if (daysOverdue >= -1) return "medium";
  return "low";
}

export function ensureDateObject(date: Date | string): Date {
  return date instanceof Date ? date : new Date(date);
}

/**
 * Get today's date in YYYY-MM-DD format using local timezone
 * This avoids timezone issues that can occur with toISOString() or toLocaleDateString()
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert a Date object to YYYY-MM-DD format using local timezone
 */
export function dateToLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
