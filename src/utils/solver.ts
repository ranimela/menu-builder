import type { FoodItem, Meal, TargetMacros } from '../types/food';

// Helper to compute nutrition for a given quantity of a food item
export function getNutrition(food: FoodItem, quantity: number) {
  const ratio = quantity / food.servingSize;
  return {
    calories: food.calories * ratio,
    protein: food.protein * ratio,
    carbs: food.carbs * ratio,
    fat: food.fat * ratio,
  };
}

// Calculate the total daily nutrition for all meals in a day
export function calculateTotals(meals: Meal[], foodDb: FoodItem[]) {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  const foodMap = new Map(foodDb.map(f => [f.id, f]));

  for (const meal of meals) {
    for (const item of meal.foods) {
      const food = foodMap.get(item.foodId);
      if (food) {
        const nut = getNutrition(food, item.quantity);
        calories += nut.calories;
        protein += nut.protein;
        carbs += nut.carbs;
        fat += nut.fat;
      }
    }
  }

  return { calories, protein, carbs, fat };
}

// Helper to get day/meal specific constraints
export function getFoodLimits(
  foodId: string,
  dayId: string,
  mealId: string,
  baseFood: FoodItem
): { min: number; max: number } {
  let min = baseFood.minQuantity;
  let max = baseFood.maxQuantity;

  if (foodId === 'whole_egg') {
    if (dayId === 'sun_thu') {
      min = 2; // 2 is mandatory minimum, but can be more
    } else if (dayId === 'sat' && mealId === 'dinner') {
      min = 1;
      max = 2; // Eggs 1 or 2
    }
  } else if (foodId === 'whey_protein') {
    if (dayId === 'fri' || dayId === 'sat') {
      min = 1; // at least 1 scoop per meal
    }
  }

  return { min, max };
}

// Optimization solver to adjust free-parameter foods
export function solveDayMenu(
  meals: Meal[],
  foodDb: FoodItem[],
  targets: TargetMacros,
  dayId: 'sun_thu' | 'fri' | 'sat'
): Meal[] {
  // 1. Deep clone the meals to avoid mutating state
  const optimizedMeals: Meal[] = JSON.parse(JSON.stringify(meals));
  const foodMap = new Map(foodDb.map(f => [f.id, f]));

  // Identify all food entries that can be adjusted
  // A food entry is adjustable if:
  // - It is selected in a meal
  // - It is NOT locked
  interface AdjustableItem {
    mealIndex: number;
    foodIndex: number;
    food: FoodItem;
    min: number;
    max: number;
  }

  const adjustables: AdjustableItem[] = [];

  for (let m = 0; m < optimizedMeals.length; m++) {
    const meal = optimizedMeals[m];
    for (let f = 0; f < meal.foods.length; f++) {
      const item = meal.foods[f];
      const food = foodMap.get(item.foodId);
      if (food && !item.locked) {
        const limits = getFoodLimits(item.foodId, dayId, meal.id, food);
        adjustables.push({
          mealIndex: m,
          foodIndex: f,
          food,
          min: limits.min,
          max: limits.max,
        });
      }
    }
  }

  if (adjustables.length === 0) {
    // Nothing to optimize
    return optimizedMeals;
  }

  // Weight coefficients for our loss function
  // We prioritize protein and calories heavily as requested
  const W_CAL = 0.5;
  const W_PRO = 4.0;
  const W_CARB = 1.0;
  const W_FAT = 2.0;

  // Loss function: measures how far we are from targets
  const getLoss = (currentMeals: Meal[]) => {
    const totals = calculateTotals(currentMeals, foodDb);
    const dCal = totals.calories - targets.calories;
    const dPro = totals.protein - targets.protein;
    const dCarb = totals.carbs - targets.carbs;
    const dFat = totals.fat - targets.fat;

    return (
      W_CAL * dCal * dCal +
      W_PRO * dPro * dPro +
      W_CARB * dCarb * dCarb +
      W_FAT * dFat * dFat
    );
  };

  // Coordinate descent optimization loop
  let bestLoss = getLoss(optimizedMeals);
  let stepSize = 20.0; // Initial search step in grams/units
  const minStep = 0.1; // Stop when steps get too small
  const maxIterations = 150;

  for (let iter = 0; iter < maxIterations && stepSize > minStep; iter++) {
    let improved = false;

    for (const adj of adjustables) {
      const currentQty = optimizedMeals[adj.mealIndex].foods[adj.foodIndex].quantity;

      // Try increasing quantity
      const testQtyUp = Math.min(adj.max, currentQty + stepSize);
      optimizedMeals[adj.mealIndex].foods[adj.foodIndex].quantity = testQtyUp;
      const lossUp = getLoss(optimizedMeals);

      if (lossUp < bestLoss) {
        bestLoss = lossUp;
        improved = true;
        continue;
      }

      // Try decreasing quantity
      const testQtyDown = Math.max(adj.min, currentQty - stepSize);
      optimizedMeals[adj.mealIndex].foods[adj.foodIndex].quantity = testQtyDown;
      const lossDown = getLoss(optimizedMeals);

      if (lossDown < bestLoss) {
        bestLoss = lossDown;
        improved = true;
        continue;
      }

      // Revert if no improvement
      optimizedMeals[adj.mealIndex].foods[adj.foodIndex].quantity = currentQty;
    }

    // If we didn't improve in this cycle, reduce the search step size
    if (!improved) {
      stepSize *= 0.5;
    }
  }

  // Round quantities to the nearest multiple of the food item's step size
  for (const adj of adjustables) {
    const step = adj.food.step || 1;
    const qty = optimizedMeals[adj.mealIndex].foods[adj.foodIndex].quantity;
    const rounded = Math.round(qty / step) * step;
    optimizedMeals[adj.mealIndex].foods[adj.foodIndex].quantity = Math.round(rounded * 10) / 10;
  }

  return optimizedMeals;
}
