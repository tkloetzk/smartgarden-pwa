import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PlantRecord, VarietyRecord } from "@/types/database";
import { useDynamicStage } from "@/hooks/useDynamicStage";
import { formatDate, getDaysSincePlanting } from "@/utils/dateUtils";
import { getPlantDisplayName } from "@/utils/plantDisplay";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Package, Sun, Droplet } from "lucide-react";
import { GrowthStage } from "@/types";
import { varietyService } from "@/services";

interface PlantInfoCardProps {
  plant: PlantRecord;
  onLogCare?: (plantId: string, activityType: string) => void;
  className?: string;
  showQuickActions?: boolean;
}

/**
 * Finds the correct protocol for a given stage by checking for direct matches
 * and common variations in naming conventions.
 * @param protocols - The protocol object (e.g., for lighting or watering).
 * @param stage - The standardized growth stage.
 * @returns The matching protocol object or null.
 */
const getProtocolForStage = (
  protocols: any,
  stage: GrowthStage
): any | null => {
  if (!protocols) return null;

  // 1. Check for a direct match
  if (protocols[stage]) return protocols[stage];

  // 2. Check for common variations if direct match fails
  const stageMappings: { [key in GrowthStage]?: string[] } = {
    vegetative: ["vegetativeGrowth", "vegetativeVining"],
    flowering: ["flowerBudFormation"],
    harvest: ["fruitingHarvesting", "podSetMaturation"],
    "ongoing-production": ["ongoingProduction"],
    germination: ["germinationEmergence", "slipProduction"],
    seedling: ["establishment"],
  };

  const possibleKeys = stageMappings[stage] || [];
  for (const key of possibleKeys) {
    if (protocols[key]) {
      return protocols[key];
    }
  }

  // 3. No match found
  return null;
};

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
  const [variety, setVariety] = useState<VarietyRecord | null>(null);

  useEffect(() => {
    const fetchVariety = async () => {
      if (plant.varietyId) {
        const varietyData = await varietyService.getVariety(plant.varietyId);
        setVariety(varietyData || null);
      }
    };
    fetchVariety();
  }, [plant.varietyId]);

  const lightingProtocol = getProtocolForStage(
    variety?.protocols?.lighting,
    stage
  );
  const wateringProtocol = getProtocolForStage(
    variety?.protocols?.watering,
    stage
  );

  const handleQuickAction = (activityType: string) => {
    if (onLogCare) {
      onLogCare(plant.id, activityType);
    } else {
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
        <div onClick={handleCardClick} className="cursor-pointer space-y-3">
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

            {plant.section && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-sm">🏷️</span>
                <span className="font-medium">{plant.section}</span>
              </div>
            )}
            {lightingProtocol && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sun size={14} />
                <span>
                  {lightingProtocol.photoperiod.hours}h light | PPFD:{" "}
                  {lightingProtocol.ppfd.min}-{lightingProtocol.ppfd.max}{" "}
                  {lightingProtocol.ppfd.optimal &&
                    `"| Optimal " ${lightingProtocol.ppfd.optimal}`}{" "}
                  {lightingProtocol.ppfd.unit}
                </span>
              </div>
            )}
            {wateringProtocol && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <Droplet size={14} className="mt-0.5 flex-shrink-0" />
                <div className="flex flex-col">
                  {(() => {
                    if (wateringProtocol.volume) {
                      const details = [
                        ...wateringProtocol.volume.amount
                          .split(",")
                          .map((s: string) => s.trim()),
                      ];
                      let frequencyString = wateringProtocol.volume.frequency;
                      if (wateringProtocol.volume.perPlant) {
                        frequencyString += " per plant";
                      }
                      details.push(frequencyString);

                      return details.map((detail, index) => (
                        <span key={index}>{detail}</span>
                      ));
                    }
                    return (
                      <span>
                        Water at moisture:{" "}
                        {wateringProtocol.trigger.moistureLevel}
                      </span>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

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
