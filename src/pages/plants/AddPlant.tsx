// src/pages/AddPlant.tsx
import React from "react";
import { PlantRegistrationForm } from "@/components/plant/PlantRegistrationForm";
import { useNavigate } from "react-router-dom";

const AddPlant: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/plants");
  };

  const handleCancel = () => {
    navigate("/plants");
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Add New Plant
      </h1>
      <PlantRegistrationForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default AddPlant;
