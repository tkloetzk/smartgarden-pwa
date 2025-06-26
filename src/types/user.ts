export interface UserSettings {
  id: string;
  units: {
    temperature: "fahrenheit" | "celsius";
    volume: "ounces" | "liters";
  };
  notifications: {
    careReminders: boolean;
    harvestAlerts: boolean;
  };
  location: {
    timezone: string;
    zipCode?: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  settings: UserSettings;
  createdAt: Date;
  lastLoginAt: Date;
}
