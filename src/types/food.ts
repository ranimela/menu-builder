export interface FoodItem {
  id: string;
  name: string;
  calories: number; // per servingSize
  protein: number;  // per servingSize
  carbs: number;    // per servingSize
  fat: number;      // per servingSize
  servingSize: number;
  unit: string;
  defaultQuantity: number;
  minQuantity: number;
  maxQuantity: number;
  isFreeParameter: boolean;
  isMandatory: boolean;
  preconditions?: string[];
  step?: number;
}

export interface SelectedFood {
  foodId: string;
  quantity: number;
  locked: boolean;
}

export interface Meal {
  id: string;
  name: string;
  foods: SelectedFood[];
}

export interface DayPlan {
  dayId: 'sun_thu' | 'fri' | 'sat';
  name: string;
  regime: 'OMAD' | 'Lunch_Dinner';
  meals: Meal[];
  ratios: TargetRatios;
}

export interface TargetRatios {
  proteinPerKg: number;
  carbsPerKg: number;
  fatPerKg: number;
}

export interface TargetMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
