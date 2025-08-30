// src/pages/care/LogCare.tsx
import { useSearchParams } from "react-router-dom";
import { CareLogForm } from "./CareLogForm";

const LogCare = () => {
  const [searchParams] = useSearchParams();
  const plantId = searchParams.get("plantId");
  const activityType = searchParams.get("activityType") as
    | "water"
    | "fertilize"
    | "observe"
    | "pruning"
    | null;
  const type = searchParams.get("type") as
    | "water"
    | "fertilize"
    | "observe"
    | "pruning"
    | null;
  const product = searchParams.get("product");
  const isGroupTask = searchParams.get("groupTask") === "true";

  // Use 'type' parameter if 'activityType' is not provided (for fertilization task navigation)
  const finalActivityType = activityType || type;
  console.log("finalActivityType:", finalActivityType);
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-center">Log Care Activity</h1>
        <p className="text-center text-muted-foreground mt-2">
          {isGroupTask
            ? "Record care activities for grouped plants"
            : "Record care activities for your plants"}
        </p>
      </div>

      <CareLogForm
        preselectedPlantId={plantId || undefined}
        preselectedActivityType={finalActivityType || undefined}
        preselectedProduct={product || undefined}
        onSuccess={() => {
          // Small delay to ensure Firebase propagation, then trigger refresh event
          setTimeout(() => {
            const event = new CustomEvent("care-activity-logged", {
              detail: {
                plantId,
                activityType: finalActivityType,
                timestamp: Date.now(),
                source: "LogCare",
              },
            });
            window.dispatchEvent(event);
          }, 500); // 500ms delay to allow Firebase to propagate
        }}
      />
    </div>
  );
};

export default LogCare;
