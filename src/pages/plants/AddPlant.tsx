// src/pages/plants/AddPlant.tsx
import React from "react";
import { PlantRegistrationForm } from "@/components/plant/PlantRegistrationForm";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import Navigation from "@/components/Navigation";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { ArrowLeft } from "lucide-react";

const AddPlant: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useFirebaseAuth();

  const handleSuccess = () => {
    navigate("/");
  };

  const handleCancel = () => {
    navigate("/");
  };

  return (
    <>
      <OfflineIndicator />
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="bg-card border-b border-border sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/")}
                  className="p-2"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-2xl">🌱</span>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    Add New Plant
                  </h1>
                  <p className="text-sm text-muted-foreground hidden sm:block">
                    Register a new plant to start tracking its growth
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:block">
                  <span className="text-sm text-muted-foreground">
                    Welcome, {user?.displayName || user?.email}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              <PlantRegistrationForm
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            </div>
          </div>
        </div>
      </div>
      <Navigation />
    </>
  );
};

export default AddPlant;
