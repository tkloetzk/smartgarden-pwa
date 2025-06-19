// src/hooks/useFirstTimeUser.ts
import { useState, useEffect } from "react";
import { plantService } from "@/types/database";

export const useFirstTimeUser = () => {
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkFirstTimeUser = async () => {
      try {
        // Check if user has any plants
        const plants = await plantService.getActivePlants();

        // Check if user has completed onboarding (you could store this in localStorage)
        const hasCompletedOnboarding = localStorage.getItem(
          "smartgarden_onboarding_completed"
        );

        setIsFirstTime(plants.length === 0 && !hasCompletedOnboarding);
      } catch (error) {
        console.error("Error checking first time user:", error);
        setIsFirstTime(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkFirstTimeUser();
  }, []);

  const markOnboardingComplete = () => {
    localStorage.setItem("smartgarden_onboarding_completed", "true");
    setIsFirstTime(false);
  };

  return {
    isFirstTime,
    isLoading,
    markOnboardingComplete,
  };
};
