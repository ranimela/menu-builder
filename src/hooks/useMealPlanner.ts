import { useState, useEffect, useMemo } from 'react';
import type { FoodItem, Meal, DayPlan, TargetMacros, TargetRatios, SolverResult } from '../types/food';
import { solveDayMenu, calculateTotals, getFoodLimits } from '../utils/solver';
import defaultFoodDb from '../../foodItems.json';

const FOOD_DATABASE = defaultFoodDb as FoodItem[];

const INITIAL_RATIOS: Record<'sun_thu' | 'fri' | 'sat', TargetRatios> = {
  sun_thu: { proteinPerKg: 2.0, carbsPerKg: 2.5, fatPerKg: 0.7 },
  fri: { proteinPerKg: 2.0, carbsPerKg: 2.5, fatPerKg: 0.7 },
  sat: { proteinPerKg: 2.0, carbsPerKg: 2.5, fatPerKg: 0.7 },
};

function createDefaultMeals(dayId: 'sun_thu' | 'fri' | 'sat'): Meal[] {
  if (dayId === 'sat') {
    return [
      {
        id: 'lunch',
        name: 'Lunch',
        foods: [
          { foodId: 'beef', quantity: 150, locked: false },
          { foodId: 'white_rice', quantity: 200, locked: false },
          { foodId: 'mixed_salad', quantity: 250, locked: false },
          { foodId: 'whey_protein', quantity: 1, locked: false },
          { foodId: 'medjool_dates', quantity: 3, locked: true }
        ]
      },
      {
        id: 'dinner',
        name: 'Dinner',
        foods: [
          { foodId: 'whole_egg', quantity: 2, locked: false },
          { foodId: 'mixed_salad', quantity: 250, locked: false },
          { foodId: 'white_cheese_5', quantity: 150, locked: false },
          { foodId: 'whey_protein', quantity: 1, locked: false }
        ]
      }
    ];
  } else if (dayId === 'sun_thu') {
    return [
      {
        id: 'omad_meal',
        name: 'OMAD Meal',
        foods: [
          { foodId: 'chicken_breast', quantity: 250, locked: false },
          { foodId: 'white_rice', quantity: 200, locked: false },
          { foodId: 'tortilla_wrap', quantity: 1, locked: false },
          { foodId: 'hummus', quantity: 50, locked: false },
          { foodId: 'mixed_salad', quantity: 250, locked: false },
          { foodId: 'whey_protein', quantity: 1, locked: false },
          { foodId: 'white_cheese_5', quantity: 150, locked: false },
          { foodId: 'whole_egg', quantity: 2, locked: true },
          { foodId: 'flax_seeds', quantity: 15, locked: false },
          { foodId: 'pumpkin_seeds', quantity: 30, locked: false }
        ]
      }
    ];
  } else {
    return [
      {
        id: 'omad_meal',
        name: 'OMAD Meal',
        foods: [
          { foodId: 'beef', quantity: 400, locked: true },
          { foodId: 'white_rice', quantity: 200, locked: false },
          { foodId: 'mixed_salad', quantity: 250, locked: false },
          { foodId: 'whey_protein', quantity: 1, locked: false },
          { foodId: 'medjool_dates', quantity: 3, locked: true }
        ]
      }
    ];
  }
}

function computeTargetMacros(weight: number, ratios: TargetRatios): TargetMacros {
  const protein = weight * ratios.proteinPerKg;
  const carbs = weight * ratios.carbsPerKg;
  const fat = weight * ratios.fatPerKg;
  const calories = protein * 4 + carbs * 4 + fat * 9;
  return {
    calories: Math.round(calories * 10) / 10,
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
  };
}

export function useMealPlanner() {
  const [activeDay, setActiveDay] = useState<'sun_thu' | 'fri' | 'sat'>('sun_thu');
  const [weight, setWeight] = useState<number>(71);
  const [autoSolve, setAutoSolve] = useState(true);
  const [selectedSwaps, setSelectedSwaps] = useState<Record<string, string>>({});

  const [dayPlans, setDayPlans] = useState<Record<'sun_thu' | 'fri' | 'sat', DayPlan>>(() => ({
    sun_thu: {
      dayId: 'sun_thu',
      name: 'Sunday - Thursday',
      regime: 'OMAD',
      ratios: INITIAL_RATIOS.sun_thu,
      meals: createDefaultMeals('sun_thu'),
    },
    fri: {
      dayId: 'fri',
      name: 'Friday',
      regime: 'OMAD',
      ratios: INITIAL_RATIOS.fri,
      meals: createDefaultMeals('fri'),
    },
    sat: {
      dayId: 'sat',
      name: 'Saturday',
      regime: 'Lunch_Dinner',
      ratios: INITIAL_RATIOS.sat,
      meals: createDefaultMeals('sat'),
    }
  }));

  useEffect(() => {
    setSelectedSwaps({});
  }, [activeDay]);

  const currentPlan = dayPlans[activeDay];
  const foodMap = useMemo(() => new Map(FOOD_DATABASE.map(f => [f.id, f])), []);

  // Compute targets
  const currentPlanTargets = useMemo(() => {
    return computeTargetMacros(weight, currentPlan.ratios);
  }, [weight, currentPlan.ratios]);

  // Solver running & state evaluation
  const solverResult = useMemo<SolverResult>(() => {
    return solveDayMenu(currentPlan.meals, FOOD_DATABASE, currentPlanTargets, activeDay);
  }, [currentPlan.meals, currentPlanTargets, activeDay]);

  // If autoSolve is enabled, use optimized meals, else use raw plan meals
  const activeMeals = autoSolve ? solverResult.optimizedMeals : currentPlan.meals;

  // Compute actual daily nutrition totals from selected meals (including selected carb swaps)
  const actualTotals = useMemo(() => {
    const totals = calculateTotals(activeMeals, FOOD_DATABASE);
    
    // Add the deltas from selected carb swaps in each meal
    for (const meal of activeMeals) {
      const swapFoodId = selectedSwaps[meal.id];
      if (swapFoodId) {
        const altFood = foodMap.get(swapFoodId);
        const riceFood = foodMap.get('white_rice');
        const riceInMeal = meal.foods.find(f => f.foodId === 'white_rice');

        if (altFood && riceFood && riceInMeal && riceInMeal.quantity > 0) {
          const riceQty = riceInMeal.quantity;
          const riceCarbs = riceQty * (riceFood.carbs / riceFood.servingSize);
          const altCarbDensity = altFood.carbs / altFood.servingSize;
          const equivQty = altCarbDensity > 0 ? riceCarbs / altCarbDensity : 0;
          
          const step = 10;
          const roundedQty = Math.round(equivQty / step) * step;

          const riceRatio = riceQty / riceFood.servingSize;
          const altRatio = roundedQty / altFood.servingSize;

          const riceNut = {
            calories: riceFood.calories * riceRatio,
            protein: riceFood.protein * riceRatio,
            carbs: riceFood.carbs * riceRatio,
            fat: riceFood.fat * riceRatio
          };

          const altNut = {
            calories: altFood.calories * altRatio,
            protein: altFood.protein * altRatio,
            carbs: altFood.carbs * altRatio,
            fat: altFood.fat * altRatio
          };

          totals.calories += (altNut.calories - riceNut.calories);
          totals.protein += (altNut.protein - riceNut.protein);
          totals.carbs += (altNut.carbs - riceNut.carbs);
          totals.fat += (altNut.fat - riceNut.fat);
        }
      }
    }

    return totals;
  }, [activeMeals, selectedSwaps, foodMap]);

  const handlePlanChange = (updatedMeals: Meal[], updatedRatios?: TargetRatios) => {
    setDayPlans(prev => {
      const ratios = updatedRatios || prev[activeDay].ratios;
      return {
        ...prev,
        [activeDay]: {
          ...prev[activeDay],
          ratios,
          meals: updatedMeals
        }
      };
    });
  };

  const handleRatioChange = (key: keyof TargetRatios, val: number) => {
    const newRatios = {
      ...currentPlan.ratios,
      [key]: Math.max(0, val)
    };
    handlePlanChange(currentPlan.meals, newRatios);
  };

  const handleAddFoodToMeal = (mealId: string, foodId: string) => {
    const food = foodMap.get(foodId);
    if (!food) return;

    const updatedMeals = currentPlan.meals.map(meal => {
      if (meal.id === mealId) {
        if (meal.foods.some(f => f.foodId === foodId)) return meal;
        return {
          ...meal,
          foods: [
            ...meal.foods,
            {
              foodId,
              quantity: food.defaultQuantity,
              locked: false
            }
          ]
        };
      }
      return meal;
    });

    handlePlanChange(updatedMeals);
  };

  const handleRemoveFoodFromMeal = (mealId: string, foodId: string) => {
    const updatedMeals = currentPlan.meals.map(meal => {
      if (meal.id === mealId) {
        return {
          ...meal,
          foods: meal.foods.filter(f => f.foodId !== foodId)
        };
      }
      return meal;
    });
    handlePlanChange(updatedMeals);
  };

  const handleQuantityChange = (mealId: string, foodId: string, qty: number) => {
    const food = foodMap.get(foodId);
    if (!food) return;

    const limits = getFoodLimits(foodId, activeDay, mealId, food);
    const safeQty = Math.max(0, Math.min(limits.max, qty));

    const updatedMeals = currentPlan.meals.map(meal => {
      if (meal.id === mealId) {
        return {
          ...meal,
          foods: meal.foods.map(f => f.foodId === foodId ? { ...f, quantity: safeQty, locked: true } : f)
        };
      }
      return meal;
    });
    handlePlanChange(updatedMeals);
  };

  const handleToggleLock = (mealId: string, foodId: string) => {
    const updatedMeals = currentPlan.meals.map(meal => {
      if (meal.id === mealId) {
        return {
          ...meal,
          foods: meal.foods.map(f => f.foodId === foodId ? { ...f, locked: !f.locked } : f)
        };
      }
      return meal;
    });
    handlePlanChange(updatedMeals);
  };

  const handleResetDay = () => {
    const newMeals = createDefaultMeals(activeDay);
    handlePlanChange(newMeals, INITIAL_RATIOS[activeDay]);
  };

  // Run optimization manually
  const runSolverTrigger = () => {
    if (solverResult.optimizedMeals) {
      handlePlanChange(solverResult.optimizedMeals);
    }
  };

  return {
    FOOD_DATABASE,
    activeDay,
    setActiveDay,
    weight,
    setWeight,
    autoSolve,
    setAutoSolve,
    selectedSwaps,
    setSelectedSwaps,
    dayPlans,
    currentPlan,
    foodMap,
    currentPlanTargets,
    actualTotals,
    solverResult,
    activeMeals,
    handlePlanChange,
    handleRatioChange,
    handleAddFoodToMeal,
    handleRemoveFoodFromMeal,
    handleQuantityChange,
    handleToggleLock,
    handleResetDay,
    runSolverTrigger
  };
}
