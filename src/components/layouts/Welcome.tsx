// src/components/Welcome.tsx (Modern mobile-first design)
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Link } from "react-router-dom";

const Welcome: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const onboardingSteps = [
    {
      title: "Welcome to SmartGarden",
      content: (
        <div className="text-center space-y-6">
          <div className="text-7xl mb-6 animate-bounce">🌿</div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-foreground leading-tight">
              Your digital gardening companion
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Track your plants, schedule care tasks, and grow healthier gardens
              with science-backed protocols.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Smart Care Scheduling",
      content: (
        <div className="text-center space-y-6">
          <div className="text-7xl mb-6 animate-pulse">📅</div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-foreground leading-tight">
              Never miss a watering
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Get personalized care reminders based on your plants' growth
              stages and your logging history.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Photo & Progress Tracking",
      content: (
        <div className="text-center space-y-6">
          <div className="text-7xl mb-6">📸</div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-foreground leading-tight">
              Document your garden's journey
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Capture photos, log activities, and watch your plants thrive with
              detailed growth tracking.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Ready to Start?",
      content: (
        <div className="text-center space-y-6">
          <div className="text-7xl mb-6">🚀</div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-foreground leading-tight">
              Let's add your first plant
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Start your digital garden by registering your first plant. We'll
              guide you through the process.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-lg rounded-3xl overflow-hidden">
          <CardHeader className="text-center pb-6 bg-gradient-to-r from-emerald-500/5 to-green-500/5">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {currentStepData.title}
            </CardTitle>

            {/* Modern progress indicator */}
            <div className="flex justify-center mt-8 space-x-2">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-3 rounded-full transition-all duration-500 ease-out ${
                    index === currentStep
                      ? "w-8 bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/40"
                      : index < currentStep
                      ? "w-3 bg-emerald-400"
                      : "w-3 bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </CardHeader>

          <CardContent className="pb-8 px-6">
            {/* Step content */}
            <div className="min-h-80 flex items-center justify-center mb-8">
              {currentStepData.content}
            </div>

            {/* Modern button layout */}
            <div className="space-y-4">
              {/* Primary button */}
              <div className="w-full">
                {isLastStep ? (
                  <Link to="/add-plant" className="block">
                    <Button
                      size="lg"
                      className="w-full group"
                      rightIcon={
                        <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
                          🌱
                        </span>
                      }
                    >
                      Add My First Plant
                    </Button>
                  </Link>
                ) : (
                  <Button
                    onClick={nextStep}
                    size="lg"
                    className="w-full group"
                    rightIcon={
                      <svg
                        className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    }
                  >
                    Continue
                  </Button>
                )}
              </div>

              {/* Secondary buttons */}
              <div className="flex gap-3">
                <div className="flex-1">
                  {!isFirstStep && (
                    <Button
                      variant="ghost"
                      onClick={previousStep}
                      className="w-full"
                      leftIcon={
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      }
                    >
                      Back
                    </Button>
                  )}
                </div>
                <div className="flex-1">
                  {!isLastStep && (
                    <Link to="/add-plant" className="block">
                      <Button
                        variant="ghost"
                        className="w-full"
                        rightIcon={
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        }
                      >
                        Skip
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Welcome;
