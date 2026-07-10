import { useState, useEffect, useMemo } from 'react';
import type { FoodItem, Meal, TargetMacros, TargetRatios, SolverResult, UserProfile } from '../types/food';
import { solveDayMenu, calculateTotals, getFoodLimits } from '../utils/solver';
import defaultFoodDb from '../../foodItems.json';

const FOOD_DATABASE = defaultFoodDb as FoodItem[];

const INITIAL_RATIOS: Record<'sun_thu' | 'fri' | 'sat', TargetRatios> = {
  sun_thu: { proteinPerKg: 2.2, carbsPerKg: 3.0, fatPerKg: 0.8 },
  fri: { proteinPerKg: 2.2, carbsPerKg: 3.0, fatPerKg: 0.8 },
  sat: { proteinPerKg: 2.2, carbsPerKg: 3.0, fatPerKg: 0.8 },
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
          { foodId: 'whey_protein', quantity: 1, locked: false }
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
          { foodId: 'flax_seeds', quantity: 15, locked: false },
          { foodId: 'pumpkin_seeds', quantity: 30, locked: false },
          { foodId: 'rice_cake', quantity: 1, locked: false },
          { foodId: 'jam', quantity: 20, locked: false },
          { foodId: 'raw_oats', quantity: 50, locked: false }
        ]
      }
    ];
  } else {
    return [
      {
        id: 'omad_meal',
        name: 'OMAD Meal',
        foods: [
          { foodId: 'white_rice', quantity: 200, locked: false },
          { foodId: 'mixed_salad', quantity: 250, locked: false },
          { foodId: 'whey_protein', quantity: 1, locked: false },
          { foodId: 'rice_cake', quantity: 1, locked: false },
          { foodId: 'jam', quantity: 20, locked: false },
          { foodId: 'raw_oats', quantity: 50, locked: false }
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

const DEFAULT_DAY_PLANS = {
  sun_thu: {
    dayId: 'sun_thu' as const,
    name: 'Sunday - Thursday',
    regime: 'OMAD' as const,
    ratios: INITIAL_RATIOS.sun_thu,
    meals: createDefaultMeals('sun_thu'),
  },
  fri: {
    dayId: 'fri' as const,
    name: 'Friday',
    regime: 'OMAD' as const,
    ratios: INITIAL_RATIOS.fri,
    meals: createDefaultMeals('fri'),
  },
  sat: {
    dayId: 'sat' as const,
    name: 'Saturday',
    regime: 'Lunch_Dinner' as const,
    ratios: INITIAL_RATIOS.sat,
    meals: createDefaultMeals('sat'),
  }
};

export function useMealPlanner() {
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    try {
      const savedProfiles = localStorage.getItem('meal_planner_profiles');
      if (savedProfiles) {
        const parsed = JSON.parse(savedProfiles);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse profiles', e);
    }

    // Try to load legacy local storage values to construct initial profile
    let legacyWeight = 71;
    try {
      const savedWeight = localStorage.getItem('meal_planner_weight');
      if (savedWeight) legacyWeight = Number(savedWeight);
    } catch {}

    let legacyActiveDay: 'sun_thu' | 'fri' | 'sat' = 'sun_thu';
    try {
      const savedActiveDay = localStorage.getItem('meal_planner_active_day');
      if (savedActiveDay === 'sun_thu' || savedActiveDay === 'fri' || savedActiveDay === 'sat') {
        legacyActiveDay = savedActiveDay;
      }
    } catch {}

    let legacyAutoSolve = true;
    try {
      const savedAutoSolve = localStorage.getItem('meal_planner_auto_solve');
      if (savedAutoSolve !== null) legacyAutoSolve = savedAutoSolve === 'true';
    } catch {}

    let legacySelectedSwaps: Record<string, string> = {};
    try {
      const savedSelectedSwaps = localStorage.getItem('meal_planner_selected_swaps');
      if (savedSelectedSwaps) legacySelectedSwaps = JSON.parse(savedSelectedSwaps);
    } catch {}

    let legacyDayPlans = DEFAULT_DAY_PLANS;
    try {
      const savedDayPlans = localStorage.getItem('meal_planner_day_plans');
      if (savedDayPlans) legacyDayPlans = JSON.parse(savedDayPlans);
    } catch {}

    let legacySolverFocus: 'balanced' | 'protein' | 'calories' = 'balanced';
    try {
      const savedSolverFocus = localStorage.getItem('meal_planner_solver_focus');
      if (savedSolverFocus === 'balanced' || savedSolverFocus === 'protein' || savedSolverFocus === 'calories') {
        legacySolverFocus = savedSolverFocus;
      }
    } catch {}

    const defaultProfile: UserProfile = {
      id: 'default',
      name: 'Default Profile',
      weight: legacyWeight,
      activeDay: legacyActiveDay,
      autoSolve: legacyAutoSolve,
      selectedSwaps: legacySelectedSwaps,
      dayPlans: legacyDayPlans,
      solverFocus: legacySolverFocus
    };

    return [defaultProfile];
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    try {
      const savedActiveProfileId = localStorage.getItem('meal_planner_active_profile_id');
      if (savedActiveProfileId) {
        return savedActiveProfileId;
      }
    } catch {}
    return 'default';
  });

  const activeProfile = useMemo(() => {
    return profiles.find(p => p.id === activeProfileId) || profiles[0] || {
      id: 'default',
      name: 'Default Profile',
      weight: 71,
      activeDay: 'sun_thu' as const,
      autoSolve: true,
      selectedSwaps: {},
      dayPlans: DEFAULT_DAY_PLANS,
      solverFocus: 'balanced' as const
    };
  }, [profiles, activeProfileId]);

  const {
    weight,
    activeDay,
    autoSolve,
    selectedSwaps,
    dayPlans,
    solverFocus
  } = activeProfile;

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('meal_planner_profiles', JSON.stringify(profiles));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [profiles]);

  useEffect(() => {
    try {
      localStorage.setItem('meal_planner_active_profile_id', activeProfileId);
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [activeProfileId]);

  const [customFoods, setCustomFoods] = useState<FoodItem[]>(() => {
    try {
      const saved = localStorage.getItem('meal_planner_custom_foods');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('meal_planner_custom_foods', JSON.stringify(customFoods));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [customFoods]);

  const updateActiveProfile = (updater: (profile: UserProfile) => UserProfile) => {
    setProfiles(prev => prev.map(p => p.id === activeProfileId ? updater(p) : p));
  };

  const setActiveDay = (val: 'sun_thu' | 'fri' | 'sat' | ((prev: 'sun_thu' | 'fri' | 'sat') => 'sun_thu' | 'fri' | 'sat')) => {
    updateActiveProfile(p => ({
      ...p,
      activeDay: typeof val === 'function' ? val(p.activeDay) : val
    }));
  };

  const setWeight = (val: number | ((prev: number) => number)) => {
    updateActiveProfile(p => ({
      ...p,
      weight: typeof val === 'function' ? val(p.weight) : val
    }));
  };

  const setAutoSolve = (val: boolean | ((prev: boolean) => boolean)) => {
    updateActiveProfile(p => ({
      ...p,
      autoSolve: typeof val === 'function' ? val(p.autoSolve) : val
    }));
  };

  const setSelectedSwaps = (val: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => {
    updateActiveProfile(p => ({
      ...p,
      selectedSwaps: typeof val === 'function' ? val(p.selectedSwaps) : val
    }));
  };

  const setSolverFocus = (val: ('balanced' | 'protein' | 'calories') | ((prev: ('balanced' | 'protein' | 'calories')) => ('balanced' | 'protein' | 'calories'))) => {
    updateActiveProfile(p => ({
      ...p,
      solverFocus: typeof val === 'function' ? val(p.solverFocus) : val
    }));
  };

  const mergedFoodDatabase = useMemo(() => {
    return [...FOOD_DATABASE, ...customFoods];
  }, [customFoods]);

  useEffect(() => {
    // Keep active swaps safe
    updateActiveProfile(p => {
      const activeSwaps = { ...p.selectedSwaps };
      let changed = false;
      const currentPlan = p.dayPlans[p.activeDay];
      for (const key of Object.keys(activeSwaps)) {
        if (!currentPlan.meals.some(m => m.id === key)) {
          delete activeSwaps[key];
          changed = true;
        }
      }
      if (changed) {
        return {
          ...p,
          selectedSwaps: activeSwaps
        };
      }
      return p;
    });
  }, [activeDay]);

  const currentPlan = dayPlans[activeDay];
  const foodMap = useMemo(() => new Map(mergedFoodDatabase.map(f => [f.id, f])), [mergedFoodDatabase]);

  // Compute targets
  const currentPlanTargets = useMemo(() => {
    return computeTargetMacros(weight, currentPlan.ratios);
  }, [weight, currentPlan.ratios]);

  // Solver running & state evaluation
  const solverResult = useMemo<SolverResult>(() => {
    return solveDayMenu(currentPlan.meals, mergedFoodDatabase, currentPlanTargets, activeDay, solverFocus);
  }, [currentPlan.meals, currentPlanTargets, activeDay, mergedFoodDatabase, solverFocus]);

  // If autoSolve is enabled, use optimized meals, else use raw plan meals
  const activeMeals = autoSolve ? solverResult.optimizedMeals : currentPlan.meals;

  // Compute actual daily nutrition totals from selected meals (including selected carb swaps)
  const actualTotals = useMemo(() => {
    const totals = calculateTotals(activeMeals, mergedFoodDatabase);
    
    // Add the deltas from selected carb swaps in each meal
    for (const meal of activeMeals) {
      const swapFoodId = selectedSwaps[meal.id];
      if (swapFoodId) {
        const altFood = foodMap.get(swapFoodId);
        const riceFood = foodMap.get('white_rice');
        const riceInMeal = meal.foods.find(f => f.foodId === 'white_rice');

        if (altFood && riceFood && riceInMeal && riceInMeal.quantity > 0) {
          if (!riceFood.servingSize || riceFood.servingSize <= 0) continue;
          if (!altFood.servingSize || altFood.servingSize <= 0) continue;

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
    updateActiveProfile(p => {
      const ratios = updatedRatios || p.dayPlans[p.activeDay].ratios;
      return {
        ...p,
        dayPlans: {
          ...p.dayPlans,
          [p.activeDay]: {
            ...p.dayPlans[p.activeDay],
            ratios,
            meals: updatedMeals
          }
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

  const handleAddCustomFood = (food: FoodItem) => {
    setCustomFoods(prev => [...prev, food]);
  };

  const handleRemoveCustomFood = (id: string) => {
    setCustomFoods(prev => prev.filter(f => f.id !== id));
  };

  const handleCreateProfile = (name: string) => {
    const newId = Math.random().toString(36).substring(2, 9);
    const newProfile: UserProfile = {
      id: newId,
      name: name.trim() || `Profile ${newId}`,
      weight: 71,
      activeDay: 'sun_thu',
      autoSolve: true,
      selectedSwaps: {},
      dayPlans: DEFAULT_DAY_PLANS,
      solverFocus: 'balanced'
    };
    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newId);
  };

  const handleSelectProfile = (id: string) => {
    if (profiles.some(p => p.id === id)) {
      setActiveProfileId(id);
    }
  };

  const handleDeleteProfile = (id: string) => {
    setProfiles(prev => {
      const filtered = prev.filter(p => p.id !== id);
      if (filtered.length === 0) {
        const defaultProfile: UserProfile = {
          id: 'default',
          name: 'Default Profile',
          weight: 71,
          activeDay: 'sun_thu',
          autoSolve: true,
          selectedSwaps: {},
          dayPlans: DEFAULT_DAY_PLANS,
          solverFocus: 'balanced'
        };
        setActiveProfileId('default');
        return [defaultProfile];
      }
      if (activeProfileId === id) {
        setActiveProfileId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleRenameProfile = (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, name: trimmed } : p));
  };

  return {
    FOOD_DATABASE: mergedFoodDatabase,
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
    runSolverTrigger,
    handleAddCustomFood,
    handleRemoveCustomFood,
    customFoods,
    solverFocus,
    setSolverFocus,
    profiles,
    activeProfileId,
    handleCreateProfile,
    handleSelectProfile,
    handleDeleteProfile,
    handleRenameProfile
  };
}
