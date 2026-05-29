import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trash2, 
  Lock, 
  Unlock, 
  Sparkles, 
  Calendar, 
  Flame, 
  Beef, 
  Wheat, 
  Droplet,
  RefreshCw,
  Layers,
  Settings,
  Share2
} from 'lucide-react';

import type { FoodItem, Meal, DayPlan, TargetMacros, TargetRatios } from './types/food';
import { solveDayMenu, calculateTotals, getNutrition, getFoodLimits } from './utils/solver';
import defaultFoodDb from '../foodItems.json';

const FOOD_DATABASE = defaultFoodDb as FoodItem[];

// Default day configurations in g/kg (TargetRatios)
const INITIAL_RATIOS: Record<'sun_thu' | 'fri' | 'sat', TargetRatios> = {
  sun_thu: { proteinPerKg: 2.0, carbsPerKg: 2.5, fatPerKg: 0.7 },
  fri: { proteinPerKg: 2.0, carbsPerKg: 2.5, fatPerKg: 0.7 },
  sat: { proteinPerKg: 2.0, carbsPerKg: 2.5, fatPerKg: 0.7 },
};

function isFoodAllowed(_foodId: string, _dayId: 'sun_thu' | 'fri' | 'sat', _mealId: string): boolean {
  return true; // No items are removed from the dropdown for any meal
}

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
          { foodId: 'whey_protein', quantity: 1, locked: false },
          { foodId: 'medjool_dates', quantity: 3, locked: true }
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
          { foodId: 'whole_egg', quantity: 2, locked: true }
        ]
      }
    ];
  } else {
    // Friday default to OMAD
    return [
      {
        id: 'omad_meal',
        name: 'OMAD Meal',
        foods: [
          { foodId: 'beef', quantity: 400, locked: false },
          { foodId: 'white_rice', quantity: 200, locked: false },
          { foodId: 'mixed_salad', quantity: 250, locked: false },
          { foodId: 'whey_protein', quantity: 1, locked: false },
          { foodId: 'medjool_dates', quantity: 3, locked: true }
        ]
      }
    ];
  }
}

// Helper to compute target macros and calories from weight and ratios
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

export const App: React.FC = () => {
  // Day selection tab
  const [activeDay, setActiveDay] = useState<'sun_thu' | 'fri' | 'sat'>('sun_thu');
  
  // User weight in kg (global)
  const [weight, setWeight] = useState<number>(71);

  // Day Plans state
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

  // Auto-solve toggle state
  const [autoSolve, setAutoSolve] = useState(true);

  const currentPlan = dayPlans[activeDay];

  // Map to speed up database lookups
  const foodMap = useMemo(() => new Map(FOOD_DATABASE.map(f => [f.id, f])), []);

  // Compute actual daily nutrition totals from selected meals
  const actualTotals = useMemo(() => {
    return calculateTotals(currentPlan.meals, FOOD_DATABASE);
  }, [currentPlan.meals]);

  // Compute target macros from weight and current plan's ratios
  const currentPlanTargets = useMemo(() => {
    return computeTargetMacros(weight, currentPlan.ratios);
  }, [weight, currentPlan.ratios]);

  // Compute total white rice quantity in current plan
  const totalRiceQuantity = useMemo(() => {
    let total = 0;
    for (const meal of currentPlan.meals) {
      for (const food of meal.foods) {
        if (food.foodId === 'white_rice') {
          total += food.quantity;
        }
      }
    }
    return total;
  }, [currentPlan.meals]);

  // Carb alternatives list
  const carbAlternatives = useMemo(() => {
    const alternativeIds = [
      'white_rice',
      'quinoa',
      'pasta',
      'rice_noodles',
      'sweet_potatoes',
      'potatoes',
      'majadra'
    ];

    const riceFood = foodMap.get('white_rice');
    if (!riceFood) return [];

    const totalRiceCarbs = totalRiceQuantity * (riceFood.carbs / riceFood.servingSize);

    return alternativeIds.map(id => {
      const food = foodMap.get(id);
      if (!food) return null;

      const carbDensity = food.carbs / food.servingSize;
      const equivQty = carbDensity > 0 ? totalRiceCarbs / carbDensity : 0;

      const step = food.step || 1;
      const roundedQty = Math.round(equivQty / step) * step;

      const ratio = roundedQty / food.servingSize;

      return {
        food,
        quantity: Math.round(roundedQty * 10) / 10,
        calories: Math.round(food.calories * ratio),
        protein: Math.round(food.protein * ratio * 10) / 10,
        carbs: Math.round(food.carbs * ratio * 10) / 10,
        fat: Math.round(food.fat * ratio * 10) / 10
      };
    }).filter(Boolean);
  }, [totalRiceQuantity, foodMap]);

  // Solver logic execution
  const runSolver = (dayId: 'sun_thu' | 'fri' | 'sat', targetWt: number) => {
    setDayPlans(prev => {
      const plan = prev[dayId];
      const targets = computeTargetMacros(targetWt, plan.ratios);
      const optimizedMeals = solveDayMenu(plan.meals, FOOD_DATABASE, targets, dayId);
      return {
        ...prev,
        [dayId]: {
          ...plan,
          meals: optimizedMeals
        }
      };
    });
  };

  // Run solver automatically if autoSolve is enabled
  useEffect(() => {
    if (autoSolve) {
      runSolver(activeDay, weight);
    }
  }, [activeDay, autoSolve, weight]);

  // Helper to trigger solver manually or on auto-updates
  const handlePlanChange = (updatedMeals: Meal[], updatedRatios?: TargetRatios) => {
    setDayPlans(prev => {
      const ratios = updatedRatios || prev[activeDay].ratios;
      const targets = computeTargetMacros(weight, ratios);
      let newMeals = updatedMeals;
      if (autoSolve) {
        newMeals = solveDayMenu(updatedMeals, FOOD_DATABASE, targets, activeDay);
      }
      return {
        ...prev,
        [activeDay]: {
          ...prev[activeDay],
          ratios,
          meals: newMeals
        }
      };
    });
  };

  // Update a single target macro ratio field
  const handleRatioChange = (key: keyof TargetRatios, val: number) => {
    const newRatios = {
      ...currentPlan.ratios,
      [key]: Math.max(0, val)
    };
    handlePlanChange(currentPlan.meals, newRatios);
  };

  // Toggle food selection/addition inside a meal
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

  // Remove food from a meal
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

  // Update a food's quantity inside a meal and auto-lock it so solver doesn't override manual edits
  const handleQuantityChange = (mealId: string, foodId: string, qty: number) => {
    const food = foodMap.get(foodId);
    if (!food) return;

    // Constrain quantity only to max bounds during typing to allow editing
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

  const handleExportToKeep = () => {
    // Generate Note text
    let text = `# Meal Plan: ${currentPlan.name} (${weight}kg)\n\n`;
    text += `Target: ${Math.round(currentPlanTargets.calories)} kcal | ${Math.round(currentPlanTargets.protein)}g P | ${Math.round(currentPlanTargets.carbs)}g C | ${Math.round(currentPlanTargets.fat)}g F\n`;
    text += `Actual: ${Math.round(actualTotals.calories)} kcal | ${Math.round(actualTotals.protein * 10) / 10}g P | ${Math.round(actualTotals.carbs * 10) / 10}g C | ${Math.round(actualTotals.fat * 10) / 10}g F\n\n`;

    text += `## Meals:\n`;
    for (const meal of currentPlan.meals) {
      text += `### ${meal.name}:\n`;
      if (meal.foods.length === 0) {
        text += `  (No items selected)\n`;
      } else {
        for (const item of meal.foods) {
          const food = foodMap.get(item.foodId);
          if (food) {
            const nut = getNutrition(food, item.quantity);
            text += `  - ${food.name}: ${item.quantity}${food.unit} (${Math.round(nut.calories)} kcal, ${Math.round(nut.protein * 10) / 10}g P, ${Math.round(nut.carbs * 10) / 10}g C, ${Math.round(nut.fat * 10) / 10}g F)\n`;
          }
        }
      }
      text += `\n`;
    }

    if (totalRiceQuantity > 0) {
      text += `## Carb Alternatives (matching ${totalRiceQuantity}g White Rice / ${Math.round(totalRiceQuantity * 0.28 * 10) / 10}g Carbs):\n`;
      for (const alt of carbAlternatives) {
        if (alt) {
          text += `  - ${alt.food.name}: ${alt.quantity}${alt.food.unit} (${alt.calories} kcal, ${alt.protein}g P, ${alt.carbs}g C, ${alt.fat}g F)\n`;
        }
      }
    }

    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
      alert("Meal plan copied to clipboard! Opening Google Keep in a new tab so you can paste it.");
      window.open("https://keep.google.com/#create", "_blank");
    }).catch(err => {
      console.error("Could not copy text: ", err);
    });
  };

  // Toggle lock state of food item
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

  // Reset current day's layout to defaults
  const handleResetDay = () => {
    const newMeals = createDefaultMeals(activeDay);
    handlePlanChange(newMeals, INITIAL_RATIOS[activeDay]);
  };

  // Pre-calculate deltas and helper strings for visual alerts
  const caloriesPct = Math.min(100, (actualTotals.calories / currentPlanTargets.calories) * 100);
  const proteinPct = Math.min(100, (actualTotals.protein / currentPlanTargets.protein) * 100);
  const carbsPct = Math.min(100, (actualTotals.carbs / currentPlanTargets.carbs) * 100);
  const fatPct = Math.min(100, (actualTotals.fat / currentPlanTargets.fat) * 100);

  const calDelta = Math.round(actualTotals.calories - currentPlanTargets.calories);
  const proDelta = Math.round(actualTotals.protein - currentPlanTargets.protein);
  const carbDelta = Math.round(actualTotals.carbs - currentPlanTargets.carbs);
  const fatDelta = Math.round(actualTotals.fat - currentPlanTargets.fat);

  const targetCalRatio = weight > 0 ? Math.round((currentPlanTargets.calories / weight) * 10) / 10 : 0;
  const actualCalRatio = weight > 0 ? Math.round((actualTotals.calories / weight) * 10) / 10 : 0;
  const calRatioDelta = Math.round((actualCalRatio - targetCalRatio) * 10) / 10;

  const targetProRatio = currentPlan.ratios.proteinPerKg;
  const actualProRatio = weight > 0 ? Math.round((actualTotals.protein / weight) * 100) / 100 : 0;
  const proRatioDelta = Math.round((actualProRatio - targetProRatio) * 100) / 100;

  const targetCarbRatio = currentPlan.ratios.carbsPerKg;
  const actualCarbRatio = weight > 0 ? Math.round((actualTotals.carbs / weight) * 100) / 100 : 0;
  const carbRatioDelta = Math.round((actualCarbRatio - targetCarbRatio) * 100) / 100;

  const targetFatRatio = currentPlan.ratios.fatPerKg;
  const actualFatRatio = weight > 0 ? Math.round((actualTotals.fat / weight) * 100) / 100 : 0;
  const fatRatioDelta = Math.round((actualFatRatio - targetFatRatio) * 100) / 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white pb-16">
      
      {/* Premium Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-purple-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                Macro-Constrained Menu Generator
              </h1>
              <p className="text-xs text-slate-400">Calculate targets dynamically from your weight and g/kg ratios</p>
            </div>
          </div>
          
          {/* Day selection tabs */}
          <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            {(['sun_thu', 'fri', 'sat'] as const).map((dayId) => {
              const isActive = activeDay === dayId;
              const name = dayId === 'sun_thu' ? 'Sun-Thu' : dayId === 'fri' ? 'Friday' : 'Saturday';
              return (
                <button
                  key={dayId}
                  id={`tab-btn-${dayId}`}
                  onClick={() => setActiveDay(dayId)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    isActive 
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/10' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Dynamic target panel and optimization parameters */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Daily target editor cards */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-bold text-slate-100">Set Targets & Weight ({currentPlan.name})</h2>
              </div>
              <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs px-2.5 py-1 rounded-full font-bold">
                {currentPlan.regime === 'OMAD' ? 'OMAD Regime' : 'Lunch & Dinner Split'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Weight Input */}
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-purple-400 text-sm font-semibold mb-2">
                  <Beef className="h-4 w-4" /> Body Weight
                </div>
                <div className="flex items-end gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-lg font-bold px-2 py-1 rounded-lg text-slate-100 outline-none transition"
                  />
                  <span className="text-xs text-slate-500 pb-2">kg</span>
                </div>
              </div>

              {/* Protein g/kg Input */}
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-rose-400 text-sm font-semibold mb-2">
                  <Beef className="h-4 w-4" /> Protein Ratio
                </div>
                <div className="flex items-end gap-1">
                  <input
                    type="number"
                    step="0.05"
                    value={currentPlan.ratios.proteinPerKg}
                    onChange={(e) => handleRatioChange('proteinPerKg', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-lg font-bold px-2 py-1 rounded-lg text-slate-100 outline-none transition"
                  />
                  <span className="text-xs text-slate-500 pb-2">g/kg</span>
                </div>
              </div>

              {/* Carbs g/kg Input */}
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-amber-400 text-sm font-semibold mb-2">
                  <Wheat className="h-4 w-4" /> Carbs Ratio
                </div>
                <div className="flex items-end gap-1">
                  <input
                    type="number"
                    step="0.05"
                    value={currentPlan.ratios.carbsPerKg}
                    onChange={(e) => handleRatioChange('carbsPerKg', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-lg font-bold px-2 py-1 rounded-lg text-slate-100 outline-none transition"
                  />
                  <span className="text-xs text-slate-500 pb-2">g/kg</span>
                </div>
              </div>

              {/* Fat g/kg Input */}
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-sky-400 text-sm font-semibold mb-2">
                  <Droplet className="h-4 w-4" /> Fats Ratio
                </div>
                <div className="flex items-end gap-1">
                  <input
                    type="number"
                    step="0.05"
                    value={currentPlan.ratios.fatPerKg}
                    onChange={(e) => handleRatioChange('fatPerKg', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-lg font-bold px-2 py-1 rounded-lg text-slate-100 outline-none transition"
                  />
                  <span className="text-xs text-slate-500 pb-2">g/kg</span>
                </div>
              </div>
            </div>

            {/* Calculated Values Display */}
            <div className="mt-4 p-4 bg-slate-950/40 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Calculated Daily Targets:</span>
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-200">
                <span className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-orange-400" />
                  Calories: <strong className="text-orange-400">{Math.round(currentPlanTargets.calories)} kcal</strong>
                </span>
                <span className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
                  <Beef className="h-3.5 w-3.5 text-rose-400" />
                  Protein: <strong className="text-rose-400">{Math.round(currentPlanTargets.protein * 10) / 10} g</strong>
                </span>
                <span className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
                  <Wheat className="h-3.5 w-3.5 text-amber-450" />
                  Carbs: <strong className="text-amber-450">{Math.round(currentPlanTargets.carbs * 10) / 10} g</strong>
                </span>
                <span className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
                  <Droplet className="h-3.5 w-3.5 text-sky-400" />
                  Fats: <strong className="text-sky-400">{Math.round(currentPlanTargets.fat * 10) / 10} g</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-400" /> Solver Control
              </h2>
              <p className="text-xs text-slate-400">
                The solver dynamically scales active food items that are not locked to meet the calculated targets.
              </p>
              
              <div className="flex items-center justify-between py-2 border-y border-slate-800/60">
                <span className="text-sm font-semibold text-slate-300">Auto-Solve on Change</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoSolve} 
                    onChange={(e) => setAutoSolve(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <div className="flex gap-2">
                <button
                  onClick={() => runSolver(activeDay, weight)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
                >
                  <RefreshCw className="h-4 w-4 animate-spin-slow" /> Solve Now
                </button>
                <button
                  onClick={handleResetDay}
                  className="border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 font-semibold py-2.5 px-4 rounded-xl transition text-sm"
                >
                  Reset
                </button>
              </div>
              <button
                onClick={handleExportToKeep}
                className="w-full bg-slate-950 border border-slate-850 hover:bg-slate-900 hover:border-slate-800 text-amber-400 font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm"
              >
                <Share2 className="h-4 w-4" /> Export to Google Keep
              </button>
            </div>
          </div>
        </section>

        {/* Dashboards: Planned vs. Actual progress metrics */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-4">
            <Sparkles className="h-5 w-5 text-indigo-400" /> Nutritional Summary (Planned vs. Target)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Calories Card */}
            <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
                  <span>CALORIES</span>
                  <span className={`${calDelta > 50 ? 'text-rose-400' : calDelta < -50 ? 'text-amber-400' : 'text-emerald-400'} font-bold`}>
                    {calDelta > 0 ? `+${calDelta}` : calDelta} kcal
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-orange-400">{Math.round(actualTotals.calories)}</span>
                  <span className="text-xs text-slate-500">/ {currentPlanTargets.calories} kcal</span>
                </div>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2.5 mt-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-amber-400 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${caloriesPct}%` }}
                />
              </div>
            </div>

            {/* Protein Card */}
            <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
                  <span>PROTEIN</span>
                  <span className={`${proDelta > 5 ? 'text-rose-400' : proDelta < -5 ? 'text-amber-400' : 'text-emerald-400'} font-bold`}>
                    {proDelta > 0 ? `+${proDelta}` : proDelta} g
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-rose-400">{Math.round(actualTotals.protein * 10) / 10}</span>
                  <span className="text-xs text-slate-500">/ {currentPlanTargets.protein} g</span>
                </div>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2.5 mt-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-rose-500 to-pink-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${proteinPct}%` }}
                />
              </div>
            </div>

            {/* Carbs Card */}
            <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
                  <span>CARBOHYDRATES</span>
                  <span className={`${carbDelta > 10 ? 'text-rose-400' : carbDelta < -10 ? 'text-amber-400' : 'text-emerald-400'} font-bold`}>
                    {carbDelta > 0 ? `+${carbDelta}` : carbDelta} g
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-amber-455">{Math.round(actualTotals.carbs * 10) / 10}</span>
                  <span className="text-xs text-slate-500">/ {currentPlanTargets.carbs} g</span>
                </div>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2.5 mt-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${carbsPct}%` }}
                />
              </div>
            </div>

            {/* Fat Card */}
            <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
                  <span>FAT</span>
                  <span className={`${fatDelta > 5 ? 'text-rose-400' : fatDelta < -5 ? 'text-amber-400' : 'text-emerald-400'} font-bold`}>
                    {fatDelta > 0 ? `+${fatDelta}` : fatDelta} g
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-sky-400">{Math.round(actualTotals.fat * 10) / 10}</span>
                  <span className="text-xs text-slate-500">/ {currentPlanTargets.fat} g</span>
                </div>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2.5 mt-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-sky-500 to-indigo-400 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${fatPct}%` }}
                />
              </div>
            </div>

          </div>

          {/* Planned vs. Actual Macro Ratios Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 border-t border-slate-800/50 pt-6">
            
            {/* Calories Ratio Card */}
            <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
                  <span>CALORIES RATIO</span>
                  <span className={`${calRatioDelta > 1 ? 'text-rose-400' : calRatioDelta < -1 ? 'text-amber-400' : 'text-emerald-400'} font-bold`}>
                    {calRatioDelta > 0 ? `+${calRatioDelta}` : calRatioDelta} kcal/kg
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-orange-400">{actualCalRatio}</span>
                  <span className="text-xs text-slate-500">/ {targetCalRatio} kcal/kg</span>
                </div>
              </div>
            </div>

            {/* Protein Ratio Card */}
            <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
                  <span>PROTEIN RATIO</span>
                  <span className={`${proRatioDelta > 0.05 ? 'text-rose-400' : proRatioDelta < -0.05 ? 'text-amber-400' : 'text-emerald-400'} font-bold`}>
                    {proRatioDelta > 0 ? `+${proRatioDelta}` : proRatioDelta} g/kg
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-rose-400">{actualProRatio}</span>
                  <span className="text-xs text-slate-500">/ {targetProRatio} g/kg</span>
                </div>
              </div>
            </div>

            {/* Carbs Ratio Card */}
            <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
                  <span>CARBS RATIO</span>
                  <span className={`${carbRatioDelta > 0.1 ? 'text-rose-400' : carbRatioDelta < -0.1 ? 'text-amber-400' : 'text-emerald-400'} font-bold`}>
                    {carbRatioDelta > 0 ? `+${carbRatioDelta}` : carbRatioDelta} g/kg
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-amber-455">{actualCarbRatio}</span>
                  <span className="text-xs text-slate-500">/ {targetCarbRatio} g/kg</span>
                </div>
              </div>
            </div>

            {/* Fat Ratio Card */}
            <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
                  <span>FAT RATIO</span>
                  <span className={`${fatRatioDelta > 0.05 ? 'text-rose-400' : fatRatioDelta < -0.05 ? 'text-amber-400' : 'text-emerald-400'} font-bold`}>
                    {fatRatioDelta > 0 ? `+${fatRatioDelta}` : fatRatioDelta} g/kg
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-sky-400">{actualFatRatio}</span>
                  <span className="text-xs text-slate-500">/ {targetFatRatio} g/kg</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Meal setup editor: list food items inside meals */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-400" /> Meal Contents Configuration
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {currentPlan.meals.map((meal) => {
              // Precalculate meal totals
              const mealTotals = calculateTotals([meal], FOOD_DATABASE);

              return (
                <div key={meal.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  
                  {/* Meal Header card */}
                  <div className="bg-slate-900/80 px-6 py-4 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                        {meal.name}
                      </h3>
                      <p className="text-xs text-slate-400">Add or adjust portion sizes of food items in this meal</p>
                    </div>

                    {/* Mini totals display */}
                    <div className="flex gap-4 text-xs font-semibold text-slate-300">
                      <span className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                        Calories: <strong className="text-orange-400">{Math.round(mealTotals.calories)} kcal</strong>
                      </span>
                      <span className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                        Protein: <strong className="text-rose-400">{Math.round(mealTotals.protein * 10) / 10}g</strong>
                      </span>
                      <span className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                        Carbs: <strong className="text-amber-450">{Math.round(mealTotals.carbs * 10) / 10}g</strong>
                      </span>
                      <span className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                        Fats: <strong className="text-sky-400">{Math.round(mealTotals.fat * 10) / 10}g</strong>
                      </span>
                    </div>
                  </div>

                  {/* Meal list */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-950/40 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
                          <th className="py-3 px-6">Food Name</th>
                          <th className="py-3 px-6 text-center">Attributes</th>
                          <th className="py-3 px-6">Quantity</th>
                          <th className="py-3 px-6 text-center">Lock Portions</th>
                          <th className="py-3 px-6">Calories</th>
                          <th className="py-3 px-6">P / C / F</th>
                          <th className="py-3 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {meal.foods.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-500 text-sm">
                              No food items added to this meal yet. Use the dropdown below to select foods.
                            </td>
                          </tr>
                        ) : (
                          meal.foods.map((item) => {
                            const food = foodMap.get(item.foodId);
                            if (!food) return null;

                            const nut = getNutrition(food, item.quantity);

                            return (
                              <tr key={item.foodId} className="hover:bg-slate-900/40 transition">
                                <td className="py-4 px-6 font-semibold text-slate-200">
                                  {food.name}
                                </td>
                                <td className="py-4 px-6 text-center">
                                  <div className="flex justify-center gap-1.5">
                                    {food.isMandatory && (
                                      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold px-2 py-0.5 rounded">
                                        Mandatory
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      step={food.step || 1}
                                      value={item.quantity}
                                      onChange={(e) => handleQuantityChange(meal.id, item.foodId, parseFloat(e.target.value) || 0)}
                                      className="w-20 bg-slate-950 border border-slate-800 text-slate-200 focus:border-purple-500 rounded-lg text-sm font-semibold px-2 py-1 outline-none"
                                    />
                                    <span className="text-xs text-slate-500 font-semibold">{food.unit}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-center">
                                  <button
                                    onClick={() => handleToggleLock(meal.id, item.foodId)}
                                    className={`p-1.5 rounded-lg border transition ${
                                      item.locked 
                                        ? 'bg-amber-600/10 border-amber-600/40 text-amber-500 hover:bg-amber-600/20' 
                                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                                    }`}
                                    title={item.locked ? "Unlock quantity" : "Lock quantity"}
                                  >
                                    {item.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                                  </button>
                                </td>
                                <td className="py-4 px-6 text-orange-400 font-bold text-sm">
                                  {Math.round(nut.calories)} kcal
                                </td>
                                <td className="py-4 px-6 text-xs font-semibold space-x-1.5">
                                  <span className="text-rose-400">{Math.round(nut.protein * 10) / 10}g P</span>
                                  <span className="text-slate-600">/</span>
                                  <span className="text-amber-450">{Math.round(nut.carbs * 10) / 10}g C</span>
                                  <span className="text-slate-600">/</span>
                                  <span className="text-sky-400">{Math.round(nut.fat * 10) / 10}g F</span>
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <button
                                    onClick={() => handleRemoveFoodFromMeal(meal.id, item.foodId)}
                                    className="p-1.5 rounded-lg border border-transparent hover:border-slate-800/80 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Add food to meal controls */}
                  <div className="bg-slate-950/40 p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Add food item:</span>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddFoodToMeal(meal.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="bg-slate-900 border border-slate-800 text-sm font-semibold rounded-lg px-3 py-1.5 outline-none focus:border-purple-500 text-slate-200 w-full sm:w-64"
                      defaultValue=""
                    >
                      <option value="" disabled>Select food item...</option>
                      {FOOD_DATABASE.filter(f => isFoodAllowed(f.id, activeDay, meal.id) && !meal.foods.some(mf => mf.foodId === f.id)).map(food => (
                        <option key={food.id} value={food.id}>
                          {food.name}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>
              );
            })}
          </div>
        </section>

        {/* Carb Alternatives Table Card */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Wheat className="h-5 w-5 text-amber-450" /> Carb Alternatives Equivalents
              </h2>
              <p className="text-xs text-slate-400">
                Portion size of alternative carb sources matching the total carbohydrates of your active White Rice ({totalRiceQuantity}g = {Math.round(totalRiceQuantity * 0.28 * 10) / 10}g carbs)
              </p>
            </div>
            {totalRiceQuantity === 0 && (
              <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                Add White Rice to menu to calculate swaps
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3 px-6">Food Name</th>
                  <th className="py-3 px-6">Equivalent Portion</th>
                  <th className="py-3 px-6">Calories</th>
                  <th className="py-3 px-6">Protein</th>
                  <th className="py-3 px-6">Carbs</th>
                  <th className="py-3 px-6">Fats</th>
                  <th className="py-3 px-6">Step Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {totalRiceQuantity === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 text-sm">
                      Select or increase White Rice quantity in the menu to display equivalent carbohydrate swaps.
                    </td>
                  </tr>
                ) : (
                  carbAlternatives.map((alt: any) => (
                    <tr key={alt.food.id} className={`hover:bg-slate-900/40 transition ${alt.food.id === 'white_rice' ? 'bg-purple-950/10 font-bold' : ''}`}>
                      <td className="py-4 px-6 text-slate-200 flex items-center gap-2">
                        {alt.food.id === 'white_rice' && <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>}
                        {alt.food.name}
                      </td>
                      <td className="py-4 px-6 text-slate-100 font-semibold">
                        {alt.quantity} {alt.food.unit}
                      </td>
                      <td className="py-4 px-6 text-orange-400 font-medium">
                        {alt.calories} kcal
                      </td>
                      <td className="py-4 px-6 text-rose-400">
                        {alt.protein}g
                      </td>
                      <td className="py-4 px-6 text-amber-450">
                        {alt.carbs}g
                      </td>
                      <td className="py-4 px-6 text-sky-400">
                        {alt.fat}g
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 font-medium">
                        {alt.food.step ? `${alt.food.step}${alt.food.unit}` : '1g'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
};

export default App;
