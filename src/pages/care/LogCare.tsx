// src/pages/care/LogCare.tsx
import React from "react";
import { CareLogForm } from "@/pages/care/CareLogForm";
import { useNavigate, useSearchParams } from "react-router-dom";

const LogCare: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedPlantId = searchParams.get("plantId");

  const handleSuccess = () => {
    navigate("/"); // Return to dashboard after logging
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-foreground mb-6 text-center">
        Log Care Activity
      </h1>
      <CareLogForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        preselectedPlantId={preSelectedPlantId || undefined}
      />
    </div>
  );
};

export default LogCare;
