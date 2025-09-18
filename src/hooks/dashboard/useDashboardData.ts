import { useFirebaseAuth } from "@/hooks/auth/useFirebaseAuth";
import { useFirebasePlants } from "@/hooks/plants/useFirebasePlants";
import { useCareActivities } from "@/hooks/care/useCareActivities";
import { useScheduledTasks } from "@/hooks/tasks/useScheduledTasks";
import { useCallback } from "react";

export interface DashboardData {
  plants: any[] | null;
  loading: boolean;
  user: any;
  signOut: () => void;
  logActivity: (activity: any) => Promise<string | null>;
  getUpcomingFertilizationTasks: ((days: number) => any[]) | undefined;
  scheduledTasksError: string | null;
}

export const useDashboardData = (): DashboardData => {
  const { plants, loading } = useFirebasePlants();
  const { user, signOut } = useFirebaseAuth();
  const { logActivity } = useCareActivities();

  // Create wrapper function for getLastActivityByType
  const getLastActivityByType = useCallback(
    async (plantId: string, type: string) => {
      if (!user?.uid) return null;
      const { FirebaseCareActivityService } = await import("@/services/firebase/careActivityService");
      return FirebaseCareActivityService.getLastActivityByType(plantId, user.uid, type);
    },
    [user?.uid]
  );

  const scheduledTasksResult = useScheduledTasks(plants || [], getLastActivityByType);

  const { getUpcomingFertilizationTasks, error: scheduledTasksError } =
    scheduledTasksResult;

  return {
    plants,
    loading,
    user,
    signOut,
    logActivity,
    getUpcomingFertilizationTasks,
    scheduledTasksError,
  };
};
