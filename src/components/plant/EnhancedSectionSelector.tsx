import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { BedRecord } from "@/types/database";
import { PlantSection, Position } from "@/types/spacing";
import { BedSelector } from "./BedSelector";
import { StructuredPositioning } from "./StructuredPositioning";

interface EnhancedSectionSelectorProps {
  // Simple text section
  section?: string;
  onSectionChange: (section: string) => void;
  
  // Structured section
  structuredSection?: PlantSection;
  onStructuredSectionChange: (section: PlantSection | null) => void;
  
  // Current mode
  sectionMode: "simple" | "structured";
  onSectionModeChange: (mode: "simple" | "structured") => void;
  
  // Container context for dynamic field adjustment
  containerType?: string;
  containerSize?: string;
}

export function EnhancedSectionSelector({
  section,
  onSectionChange,
  structuredSection,
  onStructuredSectionChange,
  sectionMode,
  onSectionModeChange,
  containerType,
  containerSize,
}: EnhancedSectionSelectorProps) {
  const [selectedBed, setSelectedBed] = useState<BedRecord | null>(null);

  const shouldShowStructuredMode = () => {
    // Structured mode is most beneficial for raised beds and large containers
    return containerType === "raised-bed" || 
           (containerType === "grow-bag" && containerSize?.includes("gallon") && 
            (containerSize.includes("15") || containerSize.includes("30")));
  };

  // Auto-switch to simple mode if structured mode becomes unavailable
  useEffect(() => {
    if (sectionMode === "structured" && !shouldShowStructuredMode()) {
      onSectionModeChange("simple");
    }
  }, [containerType, containerSize, sectionMode, onSectionModeChange]);

  const handleBedSelect = (bedId: string) => {
    if (selectedBed?.id !== bedId) {
      // Clear position when bed changes
      const newSection: PlantSection = {
        bedId,
        position: { start: 0, length: 6, unit: "inches" },
      };
      onStructuredSectionChange(newSection);
    }
  };

  const handleBedChange = (bed: BedRecord | null) => {
    setSelectedBed(bed);
    if (!bed) {
      onStructuredSectionChange(null);
    }
  };

  const handlePositionChange = (position: Position | null) => {
    if (!selectedBed || !position) {
      onStructuredSectionChange(null);
      return;
    }

    const newSection: PlantSection = {
      bedId: selectedBed.id,
      position,
      row: structuredSection?.row,
      column: structuredSection?.column,
      description: structuredSection?.description,
    };
    onStructuredSectionChange(newSection);
  };

  const handleDescriptionChange = (description: string) => {
    if (!structuredSection) return;
    
    const newSection: PlantSection = {
      ...structuredSection,
      description,
    };
    onStructuredSectionChange(newSection);
  };

  const handleRowChange = (row: string) => {
    if (!structuredSection) return;
    
    const newSection: PlantSection = {
      ...structuredSection,
      row,
    };
    onStructuredSectionChange(newSection);
  };

  const handleColumnChange = (column: string) => {
    if (!structuredSection) return;
    
    const newSection: PlantSection = {
      ...structuredSection,
      column,
    };
    onStructuredSectionChange(newSection);
  };

  // Dynamic content based on container type
  const getPlaceholderText = () => {
    if (!containerType) return "e.g., Row 1 - 6\" section at 0\", Section A, North End";
    
    switch (containerType) {
      case "raised-bed":
        return "e.g., North Section, Row 1 (0-24\"), West End";
      case "grow-bag":
        return "e.g., Bag #1, Left Side, Center Position";
      case "pot":
        return "e.g., Pot A, Front Section, East Side";
      case "cell-tray":
        return "e.g., Cells A1-A6, Row 1, Left Section";
      default:
        return "e.g., Section A, North End, Row 1";
    }
  };

  const getHelpText = () => {
    if (!containerType) return "Specify a section within your location for organization";
    
    switch (containerType) {
      case "raised-bed":
        return "Define sections within your raised bed for succession planting";
      case "grow-bag":
        return "Specify location or grouping for this grow bag";
      case "pot":
        return "Identify this pot's position or section for organization";
      case "cell-tray":
        return "Specify which cells or sections of the tray are used";
      default:
        return "Specify a section within your container for organization";
    }
  };

  const getStructuredModeDescription = () => {
    if (containerType === "raised-bed") {
      return "Structured positioning (recommended for succession planting in raised beds)";
    }
    return "Structured positioning (recommended for large containers and succession planting)";
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">
          Section/Area Configuration
        </label>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              value="simple"
              id="simple"
              checked={sectionMode === "simple"}
              onChange={() => onSectionModeChange("simple")}
              className="w-4 h-4"
            />
            <label htmlFor="simple" className="text-sm cursor-pointer">
              Simple text description
            </label>
          </div>
          {shouldShowStructuredMode() && (
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                value="structured"
                id="structured"
                checked={sectionMode === "structured"}
                onChange={() => onSectionModeChange("structured")}
                className="w-4 h-4"
              />
              <label htmlFor="structured" className="text-sm cursor-pointer">
                {getStructuredModeDescription()}
              </label>
            </div>
          )}
        </div>
      </div>

      {sectionMode === "simple" && (
        <div className="space-y-2">
          <label htmlFor="section" className="text-sm font-medium text-foreground">
            Section/Area (Optional)
          </label>
          <Input
            id="section"
            value={section || ""}
            onChange={(e) => onSectionChange(e.target.value)}
            placeholder={getPlaceholderText()}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            {getHelpText()}
          </p>
        </div>
      )}

      {sectionMode === "structured" && (
        <Card>
          <CardContent className="pt-4">
            <h3 className="text-sm font-semibold mb-2">Structured Positioning</h3>
            <p className="text-sm text-gray-600 mb-4">
              Define precise position and dimensions for succession planting calculations
            </p>
            <div className="space-y-4">
            <BedSelector
              selectedBedId={structuredSection?.bedId}
              onBedSelect={handleBedSelect}
              onBedChange={handleBedChange}
            />
            
            {selectedBed && (
              <StructuredPositioning
                selectedBed={selectedBed}
                position={structuredSection?.position || null}
                onPositionChange={handlePositionChange}
                description={structuredSection?.description}
                onDescriptionChange={handleDescriptionChange}
                row={structuredSection?.row?.toString()}
                onRowChange={handleRowChange}
                column={structuredSection?.column?.toString()}
                onColumnChange={handleColumnChange}
              />
            )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}