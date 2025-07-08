// src/pages/care/LogCare.tsx
import { useSearchParams } from "react-router-dom";
import { CareLogForm } from "./CareLogForm";

const LogCare = () => {
  const [searchParams] = useSearchParams();
  const plantId = searchParams.get("plantId");

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-center">Log Care Activity</h1>
        <p className="text-center text-muted-foreground mt-2">
          Record care activities for your plants
        </p>
      </div>

      <CareLogForm
        preselectedPlantId={plantId || undefined}
        onSuccess={() => {
          console.log("Care activity logged successfully");
        }}
      />
    </div>
  );
};

export default LogCare;
