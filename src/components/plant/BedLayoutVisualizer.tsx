import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BedRecord } from "@/types/database";
import { Position, PlantSection } from "@/types";

interface BedLayoutVisualizerProps {
  bed: BedRecord;
  currentPlants?: Array<{
    id: string;
    name: string;
    varietyName: string;
    section?: PlantSection;
  }>;
  selectedPosition?: Position | null;
  onPositionSelect: (position: Position) => void;
  suggestedPositions?: Position[];
  spacing?: {
    minSpacing: number;
    optimalSpacing: number;
    unit: string;
  };
}

interface GridCell {
  x: number;
  y: number;
  width: number;
  height: number;
  status: "occupied" | "available" | "suggested" | "selected" | "conflict";
  plantId?: string;
  plantName?: string;
  isClickable: boolean;
}

export function BedLayoutVisualizer({
  bed,
  currentPlants = [],
  selectedPosition,
  onPositionSelect,
  suggestedPositions = [],
  spacing,
}: BedLayoutVisualizerProps) {
  const [gridCells, setGridCells] = useState<GridCell[]>([]);
  const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);

  // Calculate optimal grid size based on bed dimensions and spacing
  const gridConfig = useMemo(() => {
    const optimalSpacing = spacing?.optimalSpacing || 6;
    const bedLength = bed.dimensions.length;
    const bedWidth = bed.dimensions.width;
    
    const cols = Math.floor(bedLength / optimalSpacing);
    const rows = Math.floor(bedWidth / optimalSpacing);
    
    // Visual sizing (pixels)
    const maxWidth = 600;
    const maxHeight = 400;
    const cellWidth = Math.min(maxWidth / cols, 60);
    const cellHeight = Math.min(maxHeight / rows, 60);
    
    return {
      cols,
      rows,
      cellWidth,
      cellHeight,
      totalWidth: cols * cellWidth,
      totalHeight: rows * cellHeight,
      spacing: optimalSpacing,
    };
  }, [bed.dimensions, spacing]);

  // Generate grid cells based on plant positions
  useEffect(() => {
    const cells: GridCell[] = [];
    
    for (let row = 0; row < gridConfig.rows; row++) {
      for (let col = 0; col < gridConfig.cols; col++) {
        const actualX = col * gridConfig.spacing;
        const actualY = row * gridConfig.spacing;
        
        // Check if this cell is occupied by a plant
        const occupyingPlant = currentPlants.find(plant => {
          if (!plant.section?.position) return false;
          const pos = plant.section.position;
          return (
            actualX >= pos.start &&
            actualX < pos.start + pos.length &&
            actualY >= 0 && // Simplified Y calculation for now
            actualY < (pos.width || pos.length)
          );
        });
        
        // Check if this cell is in suggested positions
        const isSuggested = suggestedPositions.some(suggestion =>
          Math.abs(suggestion.start - actualX) < gridConfig.spacing / 2
        );
        
        // Check if this cell is selected
        const isSelected = selectedPosition &&
          Math.abs(selectedPosition.start - actualX) < gridConfig.spacing / 2;
        
        let status: GridCell["status"] = "available";
        if (occupyingPlant) status = "occupied";
        else if (isSelected) status = "selected";
        else if (isSuggested) status = "suggested";
        
        cells.push({
          x: col * gridConfig.cellWidth,
          y: row * gridConfig.cellHeight,
          width: gridConfig.cellWidth,
          height: gridConfig.cellHeight,
          status,
          plantId: occupyingPlant?.id,
          plantName: occupyingPlant?.name || occupyingPlant?.varietyName,
          isClickable: status === "available" || status === "suggested",
        });
      }
    }
    
    setGridCells(cells);
  }, [currentPlants, selectedPosition, suggestedPositions, gridConfig]);

  const handleCellClick = (cell: GridCell) => {
    if (!cell.isClickable) return;
    
    const col = Math.round(cell.x / gridConfig.cellWidth);
    const actualStart = col * gridConfig.spacing;
    
    const newPosition: Position = {
      start: actualStart,
      length: spacing?.optimalSpacing || gridConfig.spacing,
      unit: bed.dimensions.unit,
    };
    
    onPositionSelect(newPosition);
  };

  const getCellColor = (cell: GridCell): string => {
    switch (cell.status) {
      case "occupied":
        return "bg-red-200 dark:bg-red-800 border-red-400 dark:border-red-600 text-red-800 dark:text-red-200";
      case "selected":
        return "bg-blue-200 dark:bg-blue-800 border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-200";
      case "suggested":
        return "bg-green-200 dark:bg-green-800 border-green-400 dark:border-green-600 text-green-800 dark:text-green-200";
      case "conflict":
        return "bg-orange-200 dark:bg-orange-800 border-orange-400 dark:border-orange-600 text-orange-800 dark:text-orange-200";
      case "available":
      default:
        return "bg-muted border-border hover:bg-accent text-muted-foreground hover:text-foreground";
    }
  };

  const getStatusCounts = () => {
    const counts = gridCells.reduce(
      (acc, cell) => {
        acc[cell.status] = (acc[cell.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    
    return counts;
  };

  const statusCounts = getStatusCounts();
  const totalCells = gridCells.length;
  const occupancyRate = totalCells > 0 ? Math.round((statusCounts.occupied || 0) / totalCells * 100) : 0;

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* Header with bed info and stats */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-foreground">{bed.name}</h3>
              <p className="text-xs text-muted-foreground">
                {bed.dimensions.length} × {bed.dimensions.width} {bed.dimensions.unit}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">
                {occupancyRate}% occupied
              </Badge>
              <Badge variant="outline">
                {statusCounts.available || 0} available
              </Badge>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 text-xs text-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-200 dark:bg-red-800 border border-red-400 dark:border-red-600 rounded"></div>
              <span>Occupied ({statusCounts.occupied || 0})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-200 dark:bg-green-800 border border-green-400 dark:border-green-600 rounded"></div>
              <span>Suggested ({statusCounts.suggested || 0})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-200 dark:bg-blue-800 border border-blue-400 dark:border-blue-600 rounded"></div>
              <span>Selected ({statusCounts.selected || 0})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-muted border border-border rounded"></div>
              <span>Available ({statusCounts.available || 0})</span>
            </div>
          </div>

          {/* Visual bed layout */}
          <div className="border border-border rounded-lg p-4 bg-background">
            <div className="mb-2 text-xs text-muted-foreground text-center">
              Click on available sections to select position
            </div>
            
            <div 
              className="relative mx-auto border-2 border-amber-600 dark:border-amber-500 rounded bg-amber-50 dark:bg-amber-950/20"
              style={{
                width: gridConfig.totalWidth,
                height: gridConfig.totalHeight,
              }}
            >
              {/* Grid cells */}
              {gridCells.map((cell, index) => (
                <div
                  key={index}
                  className={`absolute border cursor-pointer transition-all duration-200 text-xs flex items-center justify-center ${getCellColor(cell)} ${
                    cell.isClickable ? 'hover:scale-105 hover:shadow-md' : 'cursor-not-allowed'
                  }`}
                  style={{
                    left: cell.x,
                    top: cell.y,
                    width: cell.width,
                    height: cell.height,
                  }}
                  onClick={() => handleCellClick(cell)}
                  onMouseEnter={() => setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                  title={
                    cell.status === "occupied" 
                      ? `Occupied by ${cell.plantName}`
                      : cell.status === "suggested"
                      ? `Suggested position (${Math.round(cell.x / gridConfig.cellWidth * gridConfig.spacing)}")`
                      : cell.status === "selected"
                      ? "Selected position"
                      : `Available position (${Math.round(cell.x / gridConfig.cellWidth * gridConfig.spacing)}")`
                  }
                >
                  {cell.status === "occupied" && cell.plantName && (
                    <span className="text-[10px] font-medium truncate px-1">
                      {cell.plantName.substring(0, 3)}
                    </span>
                  )}
                  {cell.status === "suggested" && (
                    <span className="text-[10px] font-bold">✓</span>
                  )}
                  {cell.status === "selected" && (
                    <span className="text-[10px] font-bold">●</span>
                  )}
                </div>
              ))}
              
              {/* Reference point indicator */}
              <div className="absolute -top-4 -left-4 text-xs font-medium text-amber-700 dark:text-amber-400">
                {bed.referencePoint || "Reference"}
              </div>
              
              {/* Dimension labels */}
              <div className="absolute -bottom-6 left-0 right-0 text-center text-xs text-muted-foreground">
                {bed.dimensions.length} {bed.dimensions.unit}
              </div>
              <div className="absolute -left-8 top-0 bottom-0 flex items-center">
                <div className="transform -rotate-90 text-xs text-muted-foreground whitespace-nowrap">
                  {bed.dimensions.width} {bed.dimensions.unit}
                </div>
              </div>
            </div>
          </div>

          {/* Hovered cell info */}
          {hoveredCell && (
            <div className="text-xs p-2 bg-muted rounded border border-border">
              <strong>Position:</strong> {Math.round(hoveredCell.x / gridConfig.cellWidth * gridConfig.spacing)}" from reference point
              <br />
              <strong>Status:</strong> {hoveredCell.status}
              {hoveredCell.plantName && (
                <>
                  <br />
                  <strong>Plant:</strong> {hoveredCell.plantName}
                </>
              )}
            </div>
          )}

          {/* Quick actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const firstSuggested = suggestedPositions[0];
                if (firstSuggested) {
                  onPositionSelect(firstSuggested);
                }
              }}
              disabled={suggestedPositions.length === 0}
            >
              Use First Suggestion
            </Button>
            <Button
              type="button"
              variant="outline" 
              size="sm"
              onClick={() => {
                // Find next available spot from the beginning
                const firstAvailable = gridCells.find(cell => cell.status === "available");
                if (firstAvailable) {
                  handleCellClick(firstAvailable);
                }
              }}
              disabled={!statusCounts.available}
            >
              Next Available
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}