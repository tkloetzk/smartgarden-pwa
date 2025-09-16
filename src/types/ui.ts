/**
 * UI and Hook Types
 * 
 * Types specific to React hooks, UI components, and user interface state management.
 */

import { 
  PlantRecord, 
  CareActivityRecord, 
  VarietyRecord,
  UserProfile 
} from "./records";
import { 
  UpcomingTask, 
  TaskGroup 
} from "./protocols";
import { 
  CareActivityType, 
  GrowthStage 
} from "./core";

// ============================================================================
// ASYNC STATE MANAGEMENT TYPES
// ============================================================================

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface AsyncStateActions<T> {
  setData: (data: T) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// ============================================================================
// DATA SUBSCRIPTION TYPES
// ============================================================================

export interface DataSubscriptionConfig<_T> {
  refreshInterval?: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
}

export interface DataSubscriptionReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export interface SubscriptionConfig<T> {
  query: any;
  transform?: (data: any) => T;
  onError?: (error: Error) => void;
}

export interface FirebaseSubscription<_T> {
  data: any;
  loading: boolean;
  error: string | null;
  unsubscribe: () => void;
}

// ============================================================================
// DASHBOARD DATA TYPES
// ============================================================================

export interface DashboardData {
  plants: PlantRecord[];
  upcomingTasks: UpcomingTask[];
  recentActivities: CareActivityRecord[];
  taskGroups: TaskGroup[];
  loading: boolean;
  error: string | null;
}

export interface CareStatus {
  plantsNeedingCare: number;
  overdueTasks: number;
  upcomingTasks: number;
  recentActivities: number;
  healthyPlants: number;
  totalActivePlants: number;
}

// ============================================================================
// FERTILIZATION TASK MANAGEMENT TYPES
// ============================================================================

export interface FertilizationTasksManager {
  tasks: UpcomingTask[];
  loading: boolean;
  error: string | null;
  completeFertilizationTask: (
    taskId: string,
    plantId: string,
    details: {
      product: string;
      amount: string;
      dilution?: string;
      method?: string;
      notes?: string;
    }
  ) => Promise<void>;
  bulkCompleteFertilization: (
    taskIds: string[],
    details: {
      product: string;
      amount: string;
      dilution?: string;
      method?: string;
      notes?: string;
    }
  ) => Promise<void>;
  refresh: () => Promise<void>;
}

// ============================================================================
// CONTAINER AND GROUPING MANAGEMENT TYPES
// ============================================================================

export interface ContainerGroupsManager {
  groups: Array<{
    container: string;
    plants: PlantRecord[];
    count: number;
    needsWatering: number;
    needsFertilizing: number;
  }>;
  expandedGroups: Set<string>;
  toggleGroup: (container: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  loading: boolean;
  error: string | null;
}

export interface HiddenGroupsManager {
  hiddenGroups: Set<string>;
  hideGroup: (groupId: string) => void;
  showGroup: (groupId: string) => void;
  isHidden: (groupId: string) => boolean;
  resetHidden: () => void;
}

// ============================================================================
// STAGE ALERT TYPES
// ============================================================================

export interface StageAlert {
  plantId: string;
  plantName: string;
  currentStage: GrowthStage;
  expectedStage: GrowthStage;
  daysInCurrentStage: number;
  averageStageDuration: number;
  severity: "info" | "warning" | "critical";
  message: string;
  recommendations: string[];
}

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

// ============================================================================
// FORM AND INPUT TYPES
// ============================================================================

export interface FormField<T = any> {
  value: T;
  error: string | null;
  touched: boolean;
  required: boolean;
}

export interface FormState<T extends Record<string, any>> {
  fields: { [K in keyof T]: FormField<T[K]> };
  isValid: boolean;
  isSubmitting: boolean;
  submitCount: number;
}

export interface ValidationRule<T = any> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
}

// ============================================================================
// PLANT REGISTRATION TYPES
// ============================================================================

export interface PlantRegistrationForm {
  varietyId: string;
  varietyName: string;
  customVariety?: {
    name: string;
    category: string;
  };
  plantName?: string;
  plantedDate: Date;
  quantity: number;
  location?: string;
  container?: string;
  soilMix?: string;
  setupType: "seed" | "transplant" | "cutting" | "bare-root";
  notes?: string;
}

export interface VarietySelectorProps {
  selectedVariety: VarietyRecord | null;
  onVarietySelect: (variety: VarietyRecord) => void;
  varieties: VarietyRecord[];
  loading: boolean;
  error: string | null;
}

// ============================================================================
// CARE ACTIVITY FORM TYPES
// ============================================================================

export interface CareActivityForm {
  plantId: string;
  type: CareActivityType;
  date: Date;
  amount?: string;
  unit?: string;
  product?: string;
  dilution?: string;
  method?: string;
  notes?: string;
  photos?: File[];
}

export interface QuickActionProps {
  plantId: string;
  activityType: CareActivityType;
  onComplete: (activityId: string) => void;
  onCancel: () => void;
}

// ============================================================================
// NAVIGATION AND ROUTING TYPES
// ============================================================================

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  badge?: number;
  children?: NavigationItem[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
  createdAt: Date;
  read: boolean;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

// ============================================================================
// SEARCH AND FILTER TYPES
// ============================================================================

export interface SearchFilters {
  query?: string;
  category?: string;
  stage?: GrowthStage;
  location?: string;
  container?: string;
  needsCare?: boolean;
  isActive?: boolean;
}

export interface SortOption {
  field: keyof PlantRecord;
  direction: "asc" | "desc";
  label: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ============================================================================
// THEME AND PREFERENCES TYPES
// ============================================================================

export interface ThemePreferences {
  mode: "light" | "dark" | "system";
  primaryColor: string;
  fontSize: "small" | "medium" | "large";
  compactMode: boolean;
}

export interface DisplayPreferences {
  showPlantPhotos: boolean;
  groupByContainer: boolean;
  showCompletedTasks: boolean;
  defaultView: "list" | "grid" | "cards";
  itemsPerPage: number;
}
