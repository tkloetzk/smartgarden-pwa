// src/pages/settings/index.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

const Settings = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Sync Settings</CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>App Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Version:</span>
            <span>1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Build:</span>
            <span>Development</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
