/**
 * Refactored PlantInfoCard using generic UI components
 * Demonstrates use of ActionCard, ToggleSection, and ActionButtonGroup
 */

import React, { useState, useEffect } from "react";
import { Calendar, MapPin, Package, Droplets } from "lucide-react";
import { ActionCard } from "@/components/ui/ActionCard";
import { ToggleSection, ShowHideSection } from "@/components/ui/ToggleSection";
import { QuickActionButtons } from "@/components/ui/ActionButtonGroup";
import { PlantRecord, VarietyRecord } from "@/types/database";
import { varietyService } from "@/types/database";
import { getDaysPlanted } from "@/utils/dateHelpers";
import { formatDate } from "date-fns";

interface PlantInfoCardProps {
  plant: PlantRecord;
  className?: string;
  showQuickActions?: boolean;
  onQuickAction?: (action: string, plantId: string) => void;
  onClick?: () => void;
}

export function PlantInfoCard({
  plant,
  className,
  showQuickActions = false,
  onQuickAction,
  onClick,
}: PlantInfoCardProps) {
  const [variety, setVariety] = useState<VarietyRecord | null>(null);
  const [showActions, setShowActions] = useState(false);

  // Fetch variety data
  useEffect(() => {
    const fetchVariety = async () => {
      if (plant.varietyId) {
        const varietyData = await varietyService.getVariety(plant.varietyId);
        setVariety(varietyData || null);
      }
    };
    fetchVariety();
  }, [plant.varietyId]);

  const handleQuickAction = (action: string) => {
    onQuickAction?.(action, plant.id);
    setShowActions(false); // Close actions after selection
  };

  const daysPlanted = getDaysPlanted(plant.plantedDate);
  const plantedDate = formatDate(new Date(plant.plantedDate), "PPP");

  // Get watering protocol if available
  const wateringProtocol = variety?.protocols?.watering?.vegetative;

  return (
    <ActionCard
      title={plant.name}
      icon={<Calendar className="h-4 w-4" />}
      badge={variety ? { text: variety.name, variant: "secondary" } : undefined}
      onClick={onClick}
      className={className}
    >
      <div className="space-y-4">
        {/* Plant details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Planted {daysPlanted} days ago</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{plant.location}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-3 w-3" />
            <span>{plant.container}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{plantedDate}</span>
          </div>
        </div>

        {/* Watering protocol section - only show if available */}
        {wateringProtocol && (
          <ShowHideSection
            title="Watering Guide"
            description="Scientific watering protocol for this plant"
            showText="Show Guide"
            hideText="Hide Guide"
            icon={<Droplets className="h-4 w-4" />}
            hiddenContent={
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trigger:</span>
                  <span>Water at moisture: {wateringProtocol.trigger.moistureLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target:</span>
                  <span>Target moisture: {wateringProtocol.target.moistureLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span>{wateringProtocol.volume.amount} {wateringProtocol.volume.frequency}</span>
                </div>
              </div>
            }
          />
        )}

        {/* Quick actions section */}
        {showQuickActions && (
          <ToggleSection
            title="Quick Actions"
            description="Log activity for this plant"
            buttonText="Log Care"
            activeButtonText="Cancel"
            isActive={showActions}
            onToggle={() => setShowActions(!showActions)}
            className="pt-3 border-t border-border"
          >
            {showActions && (
              <QuickActionButtons
                onWater={() => handleQuickAction("water")}
                onFertilize={() => handleQuickAction("fertilize")}
                onObserve={() => handleQuickAction("observe")}
                onPrune={() => handleQuickAction("photo")}
                className="mt-3"
              />
            )}
          </ToggleSection>
        )}
      </div>
    </ActionCard>
  );
}