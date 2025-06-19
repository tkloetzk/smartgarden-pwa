// Simple user settings
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
