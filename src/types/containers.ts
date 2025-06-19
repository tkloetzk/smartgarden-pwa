// Simple container specification
export interface Containers {
  id: string;
  name: string; // e.g., "5 gallon grow bag"
  type: "pot" | "grow-bag" | "hanging-bag" | "raised-bed";

  size: {
    volume: number; // gallons
    depth: number; // inches
  };

  material: "plastic" | "fabric" | "ceramic";
}
