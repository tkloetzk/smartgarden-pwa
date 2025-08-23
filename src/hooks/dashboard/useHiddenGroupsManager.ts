import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

const HIDDEN_GROUPS_KEY = "hiddenPlantGroups";

export interface HiddenGroupsManager {
  hiddenGroups: Set<string>;
  hideGroup: (groupId: string, varietyName?: string) => void;
  restoreAllHidden: () => void;
  isGroupHidden: (groupId: string) => boolean;
}

export const useHiddenGroupsManager = (): HiddenGroupsManager => {
  const [hiddenGroups, setHiddenGroups] = useState<Set<string>>(() => {
    // Load hidden groups from localStorage on initialization
    try {
      const saved = localStorage.getItem(HIDDEN_GROUPS_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (error) {
      console.warn("Failed to load hidden groups from localStorage:", error);
      return new Set();
    }
  });

  // Save hidden groups to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        HIDDEN_GROUPS_KEY,
        JSON.stringify([...hiddenGroups])
      );
    } catch (error) {
      console.warn("Failed to save hidden groups to localStorage:", error);
    }
  }, [hiddenGroups]);

  const hideGroup = useCallback((groupId: string, varietyName?: string) => {
    setHiddenGroups((prev) => new Set([...prev, groupId]));
    if (varietyName) {
      toast.success(`${varietyName} removed from view`);
    }
  }, []);

  const restoreAllHidden = useCallback(() => {
    const count = hiddenGroups.size;
    setHiddenGroups(new Set());
    toast.success(
      `${count} plant group${count !== 1 ? "s" : ""} restored to view`
    );
  }, [hiddenGroups.size]);

  const isGroupHidden = useCallback((groupId: string) => {
    return hiddenGroups.has(groupId);
  }, [hiddenGroups]);

  return {
    hiddenGroups,
    hideGroup,
    restoreAllHidden,
    isGroupHidden,
  };
};