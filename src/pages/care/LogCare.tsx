// src/pages/care/LogCare.tsx
import React from "react";
import { CareLogForm } from "@/pages/care/CareLogForm";
import { useNavigate } from "react-router-dom";

const LogCare: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/"); // Return to dashboard after logging
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Log Care Activity
      </h1>
      <CareLogForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
};

export default LogCare;
