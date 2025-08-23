import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { useFirebaseCareActivities } from "@/hooks/useFirebaseCareActivities";
import { useScheduledTasks } from "@/hooks/useScheduledTasks";

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
  const { logActivity } = useFirebaseCareActivities();
  const {
    getUpcomingFertilizationTasks,
    error: scheduledTasksError,
  } = useScheduledTasks();

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