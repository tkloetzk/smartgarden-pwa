// src/components/plant/PlantInfoCard.tsx
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PlantRecord } from "@/types/database";
import { useDynamicStage } from "@/hooks/useDynamicStage";
import { formatDate, getDaysSincePlanting } from "@/utils/dateUtils";
import { getPlantDisplayName } from "@/utils/plantDisplay";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Package } from "lucide-react";

interface PlantInfoCardProps {
  plant: PlantRecord;
  onLogCare?: (plantId: string, activityType: string) => void;
  className?: string;
  showQuickActions?: boolean;
}

const PlantInfoCard = ({
  plant,
  onLogCare,
  className = "",
  showQuickActions = true,
}: PlantInfoCardProps) => {
  const [showActions, setShowActions] = useState(false);
  const navigate = useNavigate();
  const stage = useDynamicStage(plant);
  const daysSincePlanting = getDaysSincePlanting(plant.plantedDate);
  const plantDisplayName = getPlantDisplayName(plant);

  const handleQuickAction = (activityType: string) => {
    if (onLogCare) {
      onLogCare(plant.id, activityType);
    } else {
      // Default navigation if no custom handler
      const params = new URLSearchParams();
      params.set("plantId", plant.id);
      params.set("type", activityType);
      navigate(`/log-care?${params.toString()}`);
    }
  };

  const handleCardClick = () => {
    navigate(`/plants/${plant.id}`);
  };

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md ${className}`}
    >
      <CardContent className="p-4">
        {/* Main plant info - clickable to go to detail */}
        <div onClick={handleCardClick} className="cursor-pointer space-y-3">
          {/* Header with name and stage */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-lg leading-tight">
                {plantDisplayName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {stage}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Day {daysSincePlanting}
                </span>
              </div>
            </div>
          </div>

          {/* Plant details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar size={14} />
              <span>Planted {formatDate(plant.plantedDate)}</span>
            </div>

            {plant.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin size={14} />
                <span>{plant.location}</span>
              </div>
            )}

            {plant.container && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package size={14} />
                <span>{plant.container}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions section */}
        {showQuickActions && (
          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-primary">
                  Quick Actions
                </div>
                <div className="text-xs text-muted-foreground">
                  Log activity for this plant
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className="text-primary border-primary/50 hover:bg-primary/10"
              >
                {showActions ? "Cancel" : "Log Care"}
              </Button>
            </div>

            {showActions && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickAction("water");
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  💧 Water
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickAction("fertilize");
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  🌱 Fertilize
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickAction("observe");
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  👁️ Inspect
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickAction("photo");
                  }}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  📸 Photo
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlantInfoCard;
