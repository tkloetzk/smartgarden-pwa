import { useState } from "react";
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
}

export function EnhancedSectionSelector({
  section,
  onSectionChange,
  structuredSection,
  onStructuredSectionChange,
  sectionMode,
  onSectionModeChange,
}: EnhancedSectionSelectorProps) {
  const [selectedBed, setSelectedBed] = useState<BedRecord | null>(null);

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
              Structured positioning (recommended for succession planting)
            </label>
          </div>
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
            placeholder="e.g., Row 1 - 6&quot; section at 0&quot;, Section A, North End"
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Specify a section within your location for organization
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