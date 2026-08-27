import type { FoodItem, Meal, TargetMacros, SolverResult } from '../types/food';
import { SYSTEM_CONSTRAINTS } from './constraints';

// Helper to compute nutrition for a given quantity of a food item
export function getNutrition(food: FoodItem, quantity: number) {
  if (!food || !food.servingSize || food.servingSize <= 0) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }
  const safeQty = typeof quantity === 'number' && !isNaN(quantity) ? Math.max(0, quantity) : 0;
  const ratio = safeQty / food.servingSize;
  return {
    calories: (food.calories || 0) * ratio,
    protein: (food.protein || 0) * ratio,
    carbs: (food.carbs || 0) * ratio,
    fat: (food.fat || 0) * ratio,
  };
}

// Calculate the total daily nutrition for all meals in a day
export function calculateTotals(meals: Meal[], foodDbOrMap: FoodItem[] | Map<string, FoodItem>) {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  const foodMap = foodDbOrMap instanceof Map ? foodDbOrMap : new Map(foodDbOrMap.map(f => [f.id, f]));

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

// Helper to get carb swap replacement details and nutritional difference
export function getSwapDetails(
  meal: Meal,
  swapFoodId: string,
  foodMap: Map<string, FoodItem>
) {
  if (!swapFoodId) return null;
  const altFood = foodMap.get(swapFoodId);
  const riceFood = foodMap.get('white_rice');
  const riceInMeal = meal.foods.find(f => f.foodId === 'white_rice');

  if (!altFood || !riceFood || !riceInMeal || typeof riceInMeal.quantity !== 'number' || isNaN(riceInMeal.quantity) || riceInMeal.quantity <= 0) return null;
  if (!riceFood.servingSize || riceFood.servingSize <= 0) return null;
  if (!altFood.servingSize || altFood.servingSize <= 0) return null;

  const riceQty = riceInMeal.quantity;
  const riceCarbs = riceQty * ((riceFood.carbs || 0) / riceFood.servingSize);
  const altCarbDensity = (altFood.carbs || 0) / altFood.servingSize;
  const equivQty = altCarbDensity > 0 ? riceCarbs / altCarbDensity : 0;

  const step = altFood.step && altFood.step > 0 ? altFood.step : 10;
  const roundedQty = Math.round((Math.round(equivQty / step) * step) * 100) / 100;

  const riceNut = getNutrition(riceFood, riceQty);
  const altNut = getNutrition(altFood, roundedQty);

  const delta = {
    calories: altNut.calories - riceNut.calories,
    protein: altNut.protein - riceNut.protein,
    carbs: altNut.carbs - riceNut.carbs,
    fat: altNut.fat - riceNut.fat
  };

  return {
    altFood,
    riceFood,
    riceQty,
    roundedQty,
    riceNut,
    altNut,
    delta
  };
}

// Calculate the total nutrition for a single meal including any active carb swap
export function calculateMealTotals(
  meal: Meal,
  foodDbOrMap: FoodItem[] | Map<string, FoodItem>,
  swapFoodId?: string
) {
  const foodMap = foodDbOrMap instanceof Map ? foodDbOrMap : new Map(foodDbOrMap.map(f => [f.id, f]));
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;

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

  if (swapFoodId) {
    const swap = getSwapDetails(meal, swapFoodId, foodMap);
    if (swap) {
      calories += swap.delta.calories;
      protein += swap.delta.protein;
      carbs += swap.delta.carbs;
      fat += swap.delta.fat;
    }
  }

  return { calories, protein, carbs, fat };
}

// Helper to get day/meal specific constraints
export function getFoodLimits(
  foodId: string,
  dayId: string,
  mealId: string,
  baseFood?: FoodItem
): { min: number; max: number } {
  let min = (typeof baseFood?.minQuantity === 'number' && !isNaN(baseFood.minQuantity)) ? Math.max(0, baseFood.minQuantity) : 0;
  let max = (typeof baseFood?.maxQuantity === 'number' && !isNaN(baseFood.maxQuantity) && baseFood.maxQuantity > 0) ? baseFood.maxQuantity : 99999;

  // Query declarative system constraints
  for (const constraint of SYSTEM_CONSTRAINTS) {
    if (constraint.foodId === foodId) {
      // Check day matching
      if (constraint.dayId && constraint.dayId !== dayId) continue;
      // Check meal matching
      if (constraint.mealId && constraint.mealId !== mealId) continue;

      if (constraint.min !== undefined) {
        min = Math.max(min, constraint.min);
      }
      if (constraint.max !== undefined) {
        max = Math.min(max, constraint.max);
      }
    }
  }

  if (min > max) {
    max = min;
  }

  return { min, max };
}

// Optimization solver to adjust free-parameter foods
export function solveDayMenu(
  meals: Meal[],
  foodDb: FoodItem[],
  targets: TargetMacros,
  dayId: 'sun_thu' | 'fri' | 'sat',
  focus: 'balanced' | 'protein' | 'calories' = 'balanced',
  selectedSwaps?: Record<string, string>
): SolverResult {
  // 1. Deep clone the meals to avoid mutating state
  const optimizedMeals: Meal[] = JSON.parse(JSON.stringify(meals));
  const foodMap = new Map(foodDb.map(f => [f.id, f]));

  // Identify all food entries that can be adjusted
  interface AdjustableItem {
    mealIndex: number;
    foodIndex: number;
    food: FoodItem;
    min: number;
    max: number;
    step: number;
  }

  const adjustables: AdjustableItem[] = [];

  for (let m = 0; m < optimizedMeals.length; m++) {
    const meal = optimizedMeals[m];
    for (let f = 0; f < meal.foods.length; f++) {
      const item = meal.foods[f];
      const food = foodMap.get(item.foodId);
      if (food && !item.locked) {
        const limits = getFoodLimits(item.foodId, dayId, meal.id, food);
        const step = food.step && food.step > 0 ? food.step : 1;

        // Initial clamp and step alignment strictly within [min, max]
        const minStepQty = limits.min <= 0 ? 0 : Math.ceil((limits.min - 1e-9) / step) * step;
        const maxStepQty = Math.floor((limits.max + 1e-9) / step) * step;
        let initialAligned = Math.round(item.quantity / step) * step;
        if (minStepQty <= maxStepQty) {
          initialAligned = Math.max(minStepQty, Math.min(maxStepQty, initialAligned));
        } else {
          initialAligned = limits.min;
        }
        item.quantity = Math.round(initialAligned * 100) / 100;

        adjustables.push({
          mealIndex: m,
          foodIndex: f,
          food,
          min: limits.min,
          max: limits.max,
          step,
        });
      }
    }
  }

  // Weight coefficients for our loss function based on user focus preference
  let W_CAL = 0.5;
  let W_PRO = 4.0;
  const W_CARB = 1.0;
  const W_FAT = 2.0;

  if (focus === 'protein') {
    W_PRO = 12.0;
    W_CAL = 0.1;
  } else if (focus === 'calories') {
    W_CAL = 3.0;
    W_PRO = 1.0;
  }

  const targetCal = typeof targets?.calories === 'number' && !isNaN(targets.calories) ? Math.max(0, targets.calories) : 0;
  const targetPro = typeof targets?.protein === 'number' && !isNaN(targets.protein) ? Math.max(0, targets.protein) : 0;
  const targetCarb = typeof targets?.carbs === 'number' && !isNaN(targets.carbs) ? Math.max(0, targets.carbs) : 0;
  const targetFat = typeof targets?.fat === 'number' && !isNaN(targets.fat) ? Math.max(0, targets.fat) : 0;

  // Helper to compute total nutrition across meals including active carb swaps
  const evaluateTotals = (currentMeals: Meal[]) => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    for (const meal of currentMeals) {
      const swapFoodId = selectedSwaps?.[meal.id];
      const mealTotals = calculateMealTotals(meal, foodMap, swapFoodId);
      calories += mealTotals.calories;
      protein += mealTotals.protein;
      carbs += mealTotals.carbs;
      fat += mealTotals.fat;
    }

    return { calories, protein, carbs, fat };
  };

  // Loss function: measures how far we are from targets
  const getLoss = (currentMeals: Meal[]) => {
    const totals = evaluateTotals(currentMeals);
    // Normalize calorie delta (converting calories to macro gram equivalents by dividing by 4)
    const dCalNormalized = (totals.calories - targetCal) / 4;
    const dPro = totals.protein - targetPro;
    const dCarb = totals.carbs - targetCarb;
    const dFat = totals.fat - targetFat;

    return (
      W_CAL * dCalNormalized * dCalNormalized +
      W_PRO * dPro * dPro +
      W_CARB * dCarb * dCarb +
      W_FAT * dFat * dFat
    );
  };

  if (adjustables.length > 0) {
    let bestLoss = getLoss(optimizedMeals);

    // Multiscale discrete coordinate descent: operate directly on integer multiples of food step size
    const multipliers = [32, 16, 8, 4, 2, 1];

    for (const mult of multipliers) {
      let sweepImproved = true;
      let sweepCount = 0;
      const maxSweepsPerScale = 50;

      while (sweepImproved && sweepCount < maxSweepsPerScale) {
        sweepImproved = false;
        sweepCount++;

        for (const adj of adjustables) {
          const currentQty = optimizedMeals[adj.mealIndex].foods[adj.foodIndex].quantity;
          const delta = mult * adj.step;

          // Try increasing quantity (clamped strictly within limits & aligned to step)
          const maxStepQty = Math.floor((adj.max + 1e-9) / adj.step) * adj.step;
          const testUp = Math.min(maxStepQty, currentQty + delta);
          const alignedUp = Math.round((Math.round(testUp / adj.step) * adj.step) * 100) / 100;
          if (alignedUp > currentQty && alignedUp <= adj.max && alignedUp >= adj.min) {
            optimizedMeals[adj.mealIndex].foods[adj.foodIndex].quantity = alignedUp;
            const lossUp = getLoss(optimizedMeals);

            if (lossUp < bestLoss - 1e-9) {
              bestLoss = lossUp;
              sweepImproved = true;
              continue;
            }
          }

          // Try decreasing quantity (clamped strictly within limits & aligned to step)
          const minStepQty = adj.min <= 0 ? 0 : Math.ceil((adj.min - 1e-9) / adj.step) * adj.step;
          const testDown = Math.max(minStepQty, currentQty - delta);
          const alignedDown = Math.round((Math.round(testDown / adj.step) * adj.step) * 100) / 100;
          if (alignedDown < currentQty && alignedDown >= adj.min && alignedDown <= adj.max) {
            optimizedMeals[adj.mealIndex].foods[adj.foodIndex].quantity = alignedDown;
            const lossDown = getLoss(optimizedMeals);

            if (lossDown < bestLoss - 1e-9) {
              bestLoss = lossDown;
              sweepImproved = true;
              continue;
            }
          }

          // Revert if no improvement
          optimizedMeals[adj.mealIndex].foods[adj.foodIndex].quantity = currentQty;
        }
      }
    }

    // Clean up precision on final quantities
    for (const adj of adjustables) {
      const qty = optimizedMeals[adj.mealIndex].foods[adj.foodIndex].quantity;
      optimizedMeals[adj.mealIndex].foods[adj.foodIndex].quantity = Math.round(qty * 100) / 100;
    }
  }

  // Evaluate target deltas
  const finalTotals = evaluateTotals(optimizedMeals);
  const deltas = {
    calories: Math.round(finalTotals.calories - targetCal) || 0,
    protein: (Math.round((finalTotals.protein - targetPro) * 10) / 10) || 0,
    carbs: (Math.round((finalTotals.carbs - targetCarb) * 10) / 10) || 0,
    fat: (Math.round((finalTotals.fat - targetFat) * 10) / 10) || 0,
  };

  // If deltas deviate significantly, mark status as unreachable
  const isOptimal = 
    Math.abs(deltas.calories) <= 30 &&
    Math.abs(deltas.protein) <= 3.0 &&
    Math.abs(deltas.carbs) <= 3.0 &&
    Math.abs(deltas.fat) <= 3.0;

  return {
    optimizedMeals,
    status: isOptimal ? 'optimal' : 'unreachable',
    deltas,
    loss: getLoss(optimizedMeals)
  };
}
