import { WaterAmount } from "../types/database";
export function convertToMl(amount: WaterAmount): number {
  const conversions = {
    ml: 1,
    oz: 29.5735,
    cups: 236.588,
    liters: 1000,
    gallons: 3785.41,
  };
  return amount.value * conversions[amount.unit];
}

export function formatWaterAmount(amount: WaterAmount): string {
  return `${amount.value} ${amount.unit}`;
}
