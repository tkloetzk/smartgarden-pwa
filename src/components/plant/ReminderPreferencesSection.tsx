// src/components/plant/ReminderPreferencesSection.tsx
import { Switch } from "@/components/ui/Switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

// Define the type explicitly to avoid circular reference
interface ReminderPreferences {
  watering: boolean;
  fertilizing: boolean;
  observation: boolean;
  lighting: boolean;
  pruning: boolean;
}

interface ReminderPreferencesProps {
  preferences: ReminderPreferences;
  onChange: (preferences: ReminderPreferences) => void;
}

const ReminderPreferencesSection = ({
  preferences,
  onChange,
}: ReminderPreferencesProps) => {
  const handleToggle = (key: keyof ReminderPreferences) => {
    onChange({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  const reminderTypes = [
    {
      key: "watering" as const,
      label: "Watering",
      icon: "💧",
      description: "Get notified when watering is due",
    },
    {
      key: "fertilizing" as const,
      label: "Fertilizing",
      icon: "🌱",
      description: "Reminders for feeding schedule",
    },
    {
      key: "observation" as const,
      label: "Health Checks",
      icon: "👁️",
      description: "Regular observation reminders",
    },
    {
      key: "lighting" as const,
      label: "Lighting",
      icon: "💡",
      description: "Light schedule adjustments",
    },
    {
      key: "pruning" as const,
      label: "Maintenance",
      icon: "✂️",
      description: "Pruning and maintenance tasks",
    },
  ];

  return (
    <Card className="border-emerald-200 bg-emerald-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span>🔔</span>
          Reminder Preferences
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose which types of care reminders you'd like to receive for this
          plant
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {reminderTypes.map(({ key, label, icon, description }) => (
          <div
            key={key}
            className="flex items-center justify-between p-3 rounded-lg border border-emerald-100 bg-card/50 hover:bg-card/80 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{icon}</span>
                <span className="font-medium text-foreground">{label}</span>
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Switch
              checked={preferences[key]}
              onCheckedChange={() => handleToggle(key)}
              className="ml-4"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ReminderPreferencesSection;
