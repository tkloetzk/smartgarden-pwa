// src/pages/catch-up/index.tsx
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { useCatchUpData } from "@/hooks/useCatchUpData";
import { CatchUpAssistant } from "@/components/plant/CatchUpAssistant";
import { ArrowLeft } from "lucide-react";

export const CatchUpPage = () => {
  const navigate = useNavigate();
  const { loading } = useFirebasePlants();
  const { refetch } = useCatchUpData();

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={() => navigate("/")} size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              Catch-Up Tasks
            </h1>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/")} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Catch-Up Tasks
            </h1>
            <p className="text-muted-foreground">
              Review and handle missed care activities for your plants
            </p>
          </div>
        </div>

        <CatchUpAssistant mode="full" onOpportunityHandled={refetch} />
      </div>
    </div>
  );
};

export default CatchUpPage;
