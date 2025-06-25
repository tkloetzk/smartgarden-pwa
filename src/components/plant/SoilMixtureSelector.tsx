// src/components/plant/SoilMixtureSelector.tsx
import { useState } from "react";
import { PlantCategory } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface SoilComponent {
  name: string;
  percentage: number;
}

interface SoilMixture {
  id: string;
  name: string;
  description: string;
  category?: PlantCategory;
  components: SoilComponent[];
  amendments?: { name: string; amount: string }[];
  suitable: string[];
  notes?: string[];
}

interface SoilMixtureSelectorProps {
  selectedMixture?: string;
  onMixtureChange: (mixture: string) => void;
  plantCategory?: PlantCategory;
}

const PRESET_MIXTURES: SoilMixture[] = [
  {
    id: "leafy-greens-standard",
    name: "Leafy Greens Mix",
    description:
      "Nutrient-rich blend perfect for arugula, spinach, and lettuce",
    category: "leafy-greens",
    components: [
      { name: "Coco Coir", percentage: 40 },
      { name: "Perlite", percentage: 25 },
      { name: "Vermiculite", percentage: 25 },
      { name: "Worm Castings", percentage: 10 },
    ],
    amendments: [{ name: "Compost", amount: "½–1 cup per cubic foot" }],
    suitable: ["Arugula", "Spinach", "Lettuce", "Kale"],
    notes: ["Retains moisture well", "High in organic matter"],
  },
  {
    id: "root-vegetables-standard",
    name: "Root Vegetables Mix",
    description: "Well-draining mix for carrots, beets, and onions",
    category: "root-vegetables",
    components: [
      { name: "Coco Coir", percentage: 40 },
      { name: "Perlite", percentage: 30 },
      { name: "Vermiculite", percentage: 25 },
      { name: "Worm Castings", percentage: 5 },
    ],
    amendments: [
      { name: "Compost", amount: "2 tbsp per gallon" },
      { name: "Bone Meal", amount: "1 tsp per gallon" },
    ],
    suitable: ["Carrots", "Beets", "Onions", "Radishes"],
    notes: ["Excellent drainage", "Prevents root rot"],
  },
  {
    id: "herbs-standard",
    name: "Mediterranean Herbs Mix",
    description: "Well-draining, lean mix for oregano, thyme, and rosemary",
    category: "herbs",
    components: [
      { name: "Coco Coir", percentage: 30 },
      { name: "Perlite", percentage: 35 },
      { name: "Sand", percentage: 20 },
      { name: "Vermiculite", percentage: 15 },
    ],
    amendments: [{ name: "Lime", amount: "1 tsp per gallon" }],
    suitable: ["Oregano", "Thyme", "Rosemary", "Sage"],
    notes: ["Slightly alkaline", "Fast draining"],
  },
  {
    id: "berries-standard",
    name: "Berry & Fruit Mix",
    description: "Acidic mix designed for strawberries and berry plants",
    category: "berries",
    components: [
      { name: "Peat Moss", percentage: 35 },
      { name: "Coco Coir", percentage: 30 },
      { name: "Perlite", percentage: 20 },
      { name: "Worm Castings", percentage: 15 },
    ],
    amendments: [
      { name: "Sulfur", amount: "½ tsp per gallon (for acidity)" },
      { name: "Fish Emulsion", amount: "1 tbsp per gallon monthly" },
    ],
    suitable: ["Strawberries", "Blueberries", "Raspberries"],
    notes: ["pH 5.5-6.5", "High organic matter"],
  },
  {
    id: "fruiting-plants-standard",
    name: "Fruiting Plants Mix",
    description: "Heavy-feeder mix for tomatoes, peppers, and eggplants",
    category: "fruiting-plants",
    components: [
      { name: "Coco Coir", percentage: 35 },
      { name: "Perlite", percentage: 20 },
      { name: "Vermiculite", percentage: 20 },
      { name: "Compost", percentage: 15 },
      { name: "Worm Castings", percentage: 5 },
      { name: "Biochar", percentage: 5 },
    ],
    amendments: [
      { name: "Gypsum", amount: "½ cup per 15-gal bag" },
      { name: "Bone Meal", amount: "2-3 tbsp per container" },
      { name: "Kelp Meal", amount: "2 tbsp per container" },
    ],
    suitable: ["Tomatoes", "Peppers", "Peas", "Beans"],
    notes: ["Heavy feeder support", "Calcium-rich for fruit development"],
  },
  {
    id: "universal-standard",
    name: "Universal Garden Mix",
    description: "Balanced all-purpose mix suitable for most plants",
    components: [
      { name: "Coco Coir", percentage: 40 },
      { name: "Perlite", percentage: 25 },
      { name: "Vermiculite", percentage: 20 },
      { name: "Compost", percentage: 10 },
      { name: "Worm Castings", percentage: 5 },
    ],
    amendments: [{ name: "Bone Meal", amount: "1 tbsp per gallon" }],
    suitable: ["Most vegetables", "Herbs", "Annual flowers"],
    notes: ["Good drainage", "Balanced nutrition", "Easy to work with"],
  },
];

export const SoilMixtureSelector = ({
  selectedMixture,
  onMixtureChange,
  plantCategory,
}: SoilMixtureSelectorProps) => {
  const [showCustom, setShowCustom] = useState(false);
  const [customMixture, setCustomMixture] = useState("");

  const getRelevantMixtures = () => {
    if (!plantCategory) {
      return PRESET_MIXTURES;
    }

    const categoryMixtures = PRESET_MIXTURES.filter(
      (mix) => mix.category === plantCategory
    );
    const otherMixtures = PRESET_MIXTURES.filter(
      (mix) => mix.category !== plantCategory
    );

    return [...categoryMixtures, ...otherMixtures];
  };

  const formatComponents = (components: SoilComponent[]) => {
    return components
      .map((comp) => `${comp.percentage}% ${comp.name}`)
      .join(", ");
  };

  const handlePresetSelect = (mixtureId: string) => {
    const mixture = PRESET_MIXTURES.find((m) => m.id === mixtureId);
    if (mixture) {
      const mixtureText = `${mixture.name}: ${formatComponents(
        mixture.components
      )}`;
      onMixtureChange(mixtureText);
      setShowCustom(false);
    }
  };

  const handleCustomSubmit = () => {
    if (customMixture.trim()) {
      onMixtureChange(customMixture);
      setShowCustom(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Soil Mixture *
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          Choose a preset mixture or create your own custom blend
        </p>
      </div>

      {!showCustom ? (
        <>
          {/* Preset Mixtures */}
          <div className="grid gap-3">
            {getRelevantMixtures().map((mixture) => (
              <div
                key={mixture.id}
                data-testid={`mixture-card-${mixture.id}`}
                className={`cursor-pointer transition-all border rounded-lg shadow-sm ${
                  selectedMixture?.includes(mixture.name)
                    ? "ring-4 ring-ring bg-muted border-ring shadow-lg" // ✅ FIXED: Using semantic colors
                    : "bg-card border-border hover:bg-muted/50 hover:shadow-md"
                }`}
                onClick={() => handlePresetSelect(mixture.id)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-foreground mb-1 flex items-center">
                        {selectedMixture?.includes(mixture.name) && (
                          <span className="mr-2 text-primary text-lg">✓</span>
                        )}
                        {mixture.name}
                        {mixture.category === plantCategory && (
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {mixture.description}
                      </p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>
                          <strong>Components:</strong>{" "}
                          {formatComponents(mixture.components)}
                        </div>
                        {mixture.amendments && (
                          <div>
                            <strong>Amendments:</strong>{" "}
                            {mixture.amendments
                              .map((a) => `${a.name} (${a.amount})`)
                              .join(", ")}
                          </div>
                        )}
                        <div>
                          <strong>Best for:</strong>{" "}
                          {mixture.suitable.join(", ")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Custom Mixture Button */}
          <Button
            type="button"
            variant="primary"
            onClick={() => setShowCustom(true)}
            className="w-full"
          >
            🧪 Create Custom Mixture
          </Button>
        </>
      ) : (
        /* Custom Mixture Form */
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Custom Soil Mixture</CardTitle>
            <p className="text-sm text-muted-foreground">
              Describe your custom soil mixture with components and percentages
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="custom-mixture"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Mixture Description
              </label>
              <textarea
                id="custom-mixture"
                value={customMixture}
                onChange={(e) => setCustomMixture(e.target.value)}
                placeholder="e.g., 40% coco coir, 30% perlite, 25% vermiculite, 5% compost"
                rows={4}
                className="w-full p-3 bg-input text-input-foreground border border-border rounded-md focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="primary"
                onClick={handleCustomSubmit}
                disabled={!customMixture.trim()}
                className="flex-1"
              >
                Save Custom Mixture
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCustom(false);
                  setCustomMixture("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Mixture Display */}
      {selectedMixture && !showCustom && (
        <div className="p-3 bg-muted border border-border rounded-md">
          {" "}
          {/* ✅ FIXED: Using semantic colors */}
          <div className="text-sm font-medium text-foreground mb-1">
            {" "}
            {/* ✅ FIXED: Using semantic colors */}
            Selected Mixture:
          </div>
          <div className="text-sm text-muted-foreground">
            {selectedMixture}
          </div>{" "}
          {/* ✅ FIXED: Using semantic colors */}
        </div>
      )}
    </div>
  );
};

export default SoilMixtureSelector;
