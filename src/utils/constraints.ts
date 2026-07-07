import type { FoodConstraint } from '../types/food';

export const SYSTEM_CONSTRAINTS: FoodConstraint[] = [
  { foodId: 'whole_egg', dayId: 'sun_thu', min: 2, description: "Must have at least 2 eggs on Sun-Thu" },
  { foodId: 'whole_egg', dayId: 'sat', mealId: 'dinner', min: 1, max: 2, description: "Dinner limit: 1-2 eggs on Saturday" },
  { foodId: 'whey_protein', dayId: 'fri', min: 1, description: "Requires at least 1 scoop on Friday" },
  { foodId: 'whey_protein', dayId: 'sat', min: 1, description: "Requires at least 1 scoop on Saturday" },
];
