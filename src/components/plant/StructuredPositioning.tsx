import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BedRecord } from "@/types/database";
import { Position } from "@/types/spacing";
import { successionPlanningService } from "@/services/successionPlanningService";
import { Button } from "../ui/Button";
import { BedLayoutVisualizer } from "./BedLayoutVisualizer";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";

interface StructuredPositioningProps {
  selectedBed: BedRecord | null;
  position: Position | null;
  onPositionChange: (position: Position | null) => void;
  description?: string;
  onDescriptionChange?: (description: string) => void;
  row?: string;
  onRowChange?: (row: string) => void;
  column?: string;
  onColumnChange?: (column: string) => void;
}

export function StructuredPositioning({
  selectedBed,
  position,
  onPositionChange,
  description,
  onDescriptionChange,
  row,
  onRowChange,
  column,
  onColumnChange,
}: StructuredPositioningProps) {
  const { plants } = useFirebasePlants();
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    conflicts: string[];
  } | null>(null);
  const [spacingRecommendation, setSpacingRecommendation] = useState<{
    minSpacing: number;
    optimalSpacing: number;
  } | null>(null);
  const [suggestedPositions, setSuggestedPositions] = useState<Position[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [showManualInputs, setShowManualInputs] = useState(false);

  // Filter plants for the current bed and format for visualizer
  const currentBedPlants = plants
    ?.filter(plant => plant.structuredSection?.bedId === selectedBed?.id)
    .map(plant => ({
      id: plant.id,
      name: plant.name || plant.varietyName,
      varietyName: plant.varietyName,
      section: plant.structuredSection,
    })) || [];

  const loadSuggestedPositions = useCallback(async () => {
    if (!selectedBed) return;

    try {
      const spacing = await successionPlanningService.calculateAvailableSpace(
        selectedBed.id
      );
      setSuggestedPositions(spacing.suggestedPositions || []);
    } catch (error) {
      console.error("Failed to load suggested positions:", error);
    }
  }, [selectedBed]);

  const validatePosition = useCallback(async () => {
    if (!selectedBed || !position) return;

    setIsValidating(true);
    try {
      const result = await successionPlanningService.validatePosition(
        selectedBed.id,
        position
      );
      setValidationResult(result);
    } catch (error) {
      console.error("Failed to validate position:", error);
      setValidationResult({
        isValid: false,
        conflicts: ["Validation error"],
      });
    } finally {
      setIsValidating(false);
    }
  }, [selectedBed, position]);

  useEffect(() => {
    if (selectedBed) {
      // Get spacing recommendations (could be enhanced with variety-specific data)
      const spacing =
        successionPlanningService.calculateOptimalSpacing("medium");
      setSpacingRecommendation(spacing);

      // Load suggested positions
      loadSuggestedPositions();
    }
  }, [selectedBed, loadSuggestedPositions]);

  useEffect(() => {
    if (selectedBed && position) {
      validatePosition();
    }
  }, [selectedBed, position, validatePosition]);

  const handlePositionChange = (field: keyof Position, value: number) => {
    if (!selectedBed) return;

    const newPosition: Position = {
      start: position?.start ?? 0,
      length: position?.length ?? (spacingRecommendation?.optimalSpacing || 6),
      unit: selectedBed.dimensions.unit,
      width: position?.width,
      [field]: value,
    };

    onPositionChange(newPosition);
  };

  const applySuggestedPosition = (suggestedPosition: Position) => {
    onPositionChange(suggestedPosition);
  };

  const calculateEndPosition = (): number => {
    if (!position) return 0;
    return position.start + position.length;
  };

  const calculateArea = (): number => {
    if (!position) return 0;
    return position.length * (position.width || position.length);
  };

  if (!selectedBed) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          Please select a bed first to configure positioning.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Visual Bed Layout */}
      <BedLayoutVisualizer
        bed={selectedBed}
        currentPlants={currentBedPlants}
        selectedPosition={position}
        onPositionSelect={onPositionChange}
        suggestedPositions={suggestedPositions}
        spacing={spacingRecommendation ? {
          minSpacing: spacingRecommendation.minSpacing,
          optimalSpacing: spacingRecommendation.optimalSpacing,
          unit: selectedBed.dimensions.unit,
        } : undefined}
      />

      {/* Toggle for Manual Inputs */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Position Details</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowManualInputs(!showManualInputs)}
        >
          {showManualInputs ? "Hide" : "Show"} Manual Inputs
        </Button>
      </div>

      {/* Manual Input Fields (Collapsible) */}
      {showManualInputs && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Position Inputs */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="text-sm font-semibold mb-4">Position & Dimensions</h3>
              <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="start-position" className="text-xs font-medium">
                    Start Position
                  </label>
                  <Input
                    id="start-position"
                    type="number"
                    step="0.1"
                    value={position?.start || ""}
                    onChange={(e) =>
                      handlePositionChange(
                        "start",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="0"
                    className="h-8"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Distance from reference point
                  </p>
                </div>
                <div>
                  <label htmlFor="length" className="text-xs font-medium">
                    Length
                  </label>
                  <Input
                    id="length"
                    type="number"
                    step="0.1"
                    value={position?.length || ""}
                    onChange={(e) =>
                      handlePositionChange(
                        "length",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder={
                      spacingRecommendation?.optimalSpacing.toString() || "6"
                    }
                    className="h-8"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Section length
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="width" className="text-xs font-medium">
                  Width (Optional)
                </label>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  value={position?.width || ""}
                  onChange={(e) =>
                    handlePositionChange("width", parseFloat(e.target.value) || 0)
                  }
                  placeholder="Same as length"
                  className="h-8"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank for square section
                </p>
              </div>

              {position && (
                <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>End Position:</span>
                    <span className="font-medium">
                      {calculateEndPosition()} {selectedBed.dimensions.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Area:</span>
                    <span className="font-medium">
                      {calculateArea()} {selectedBed.dimensions.unit}²
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Dimensions:</span>
                    <span className="font-medium">
                      {position.length} × {position.width || position.length}{" "}
                      {selectedBed.dimensions.unit}
                    </span>
                  </div>
                </div>
              )}
              </div>
            </CardContent>
          </Card>

          {/* Grid Reference (Optional) */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="text-sm font-semibold mb-4">Grid Reference (Optional)</h3>
              <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="row" className="text-xs font-medium">
                    Row
                  </label>
                  <Input
                    id="row"
                    value={row || ""}
                    onChange={(e) => onRowChange?.(e.target.value)}
                    placeholder="A, 1, North"
                    className="h-8"
                  />
                </div>
                <div>
                  <label htmlFor="column" className="text-xs font-medium">
                    Column
                  </label>
                  <Input
                    id="column"
                    value={column || ""}
                    onChange={(e) => onColumnChange?.(e.target.value)}
                    placeholder="1, A, East"
                    className="h-8"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="text-xs font-medium">
                  Description
                </label>
                <Input
                  id="description"
                  value={description || ""}
                  onChange={(e) => onDescriptionChange?.(e.target.value)}
                  placeholder="e.g., First lettuce section, Near water source"
                  className="h-8"
                />
              </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Current Position Summary */}
      {position && (
        <Card>
          <CardContent className="pt-4">
            <h3 className="text-sm font-semibold mb-2">Selected Position</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Start:</span>
                <span className="ml-2 font-medium">{position.start} {selectedBed.dimensions.unit}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Length:</span>
                <span className="ml-2 font-medium">{position.length} {selectedBed.dimensions.unit}</span>
              </div>
              <div>
                <span className="text-muted-foreground">End:</span>
                <span className="ml-2 font-medium">{calculateEndPosition()} {selectedBed.dimensions.unit}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Area:</span>
                <span className="ml-2 font-medium">{calculateArea()} {selectedBed.dimensions.unit}²</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spacing Recommendations */}
      {spacingRecommendation && (
        <Card>
          <CardContent className="pt-4">
            <h3 className="text-sm font-semibold mb-4">Spacing Recommendations</h3>
            <div className="flex gap-2">
              <Badge variant="outline">
                Min: {spacingRecommendation.minSpacing}{" "}
                {selectedBed.dimensions.unit}
              </Badge>
              <Badge variant="outline">
                Optimal: {spacingRecommendation.optimalSpacing}{" "}
                {selectedBed.dimensions.unit}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              These recommendations are based on general spacing guidelines.
              Adjust based on your specific variety and growing conditions.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Suggested Positions */}
      {suggestedPositions.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <h3 className="text-sm font-semibold mb-2">Suggested Positions</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Available positions calculated from current bed usage
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {suggestedPositions.slice(0, 6).map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => applySuggestedPosition(suggestion)}
                  className="h-auto p-2 text-xs"
                >
                  <div className="text-left">
                    <div className="font-medium">
                      Position {suggestion.start}
                    </div>
                    <div className="text-muted-foreground">
                      {suggestion.length} ×{" "}
                      {suggestion.width || suggestion.length} {suggestion.unit}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      {validationResult && (
        <div className={`p-4 rounded-lg ${validationResult.isValid ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800'}`}>
          {validationResult.isValid ? (
            <p className="text-sm text-green-800 dark:text-green-200">
              Position is valid and doesn't conflict with existing plantings.
            </p>
          ) : (
            <div className="text-sm text-red-800 dark:text-red-200">
              <p className="font-medium">Position conflicts detected:</p>
              <ul className="list-disc list-inside mt-1">
                {validationResult.conflicts.map((conflict, index) => (
                  <li key={index}>{conflict}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {isValidating && (
        <div className="text-sm text-muted-foreground">
          Validating position...
        </div>
      )}
    </div>
  );
}
