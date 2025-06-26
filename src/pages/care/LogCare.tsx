import React from "react";
import { CareLogForm } from "@/pages/care/CareLogForm";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { BookOpen } from "lucide-react";

const LogCare: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedPlantId = searchParams.get("plantId");

  const handleSuccess = () => {
    navigate(-1);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-4">
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            Log Care Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            Record care activities for your plants to track their health and
            growth progress.
          </p>
        </CardContent>
      </Card>

      <CareLogForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        preselectedPlantId={preSelectedPlantId || undefined}
      />
    </div>
  );
};

export default LogCare;
