// src/components/EmptyState.tsx (Updated)
import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: string;
  actionLabel: string;
  actionTo: string;
  showWelcome?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  actionTo,
  showWelcome = false,
}) => {
  return (
    <div className="flex items-center justify-center min-h-96">
      <Card className="w-full max-w-md mx-4 shadow-sm border border-border">
        <CardContent className="text-center py-12 px-6 space-y-6">
          {showWelcome && (
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                🌱 Welcome to SmartGarden
              </h1>
              <p className="text-muted-foreground">
                Your digital gardening companion
              </p>
            </div>
          )}

          <div className="text-6xl mb-4" role="img" aria-label={title}>
            {icon}
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          <div className="pt-4">
            <Link to={actionTo} className="block">
              <Button size="lg" className="w-full">
                {actionLabel}
              </Button>
            </Link>
          </div>

          {showWelcome && (
            <div className="pt-6 border-t border-gray-100">
              <p className="text-sm text-muted-foreground">
                Need help getting started?{" "}
                <button
                  className="text-green-700 underline hover:text-green-800"
                  onClick={() => {
                    console.log("Show tutorial");
                  }}
                >
                  View quick tutorial
                </button>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmptyState;
