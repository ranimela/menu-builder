import type { FoodConstraint } from '../types/food';

export const SYSTEM_CONSTRAINTS: FoodConstraint[] = [
  { foodId: 'whey_protein', dayId: 'fri', min: 1, description: "Requires at least 1 scoop on Friday" },
  { foodId: 'whey_protein', dayId: 'sat', min: 1, description: "Requires at least 1 scoop on Saturday" },
];
