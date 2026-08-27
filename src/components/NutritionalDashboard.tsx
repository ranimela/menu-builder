import React from 'react';
import type { TargetMacros, TargetRatios, SolverResult, Meal, FoodItem } from '../types/food';
import { Flame, AlertTriangle } from 'lucide-react';
import { getNutrition } from '../utils/solver';

interface NutritionalDashboardProps {
  actualTotals: TargetMacros;
  targets: TargetMacros;
  weight: number;
  ratios: TargetRatios;
  solverResult: SolverResult;
  activeMeals: Meal[];
  foodDatabase: FoodItem[];
}

export const NutritionalDashboard: React.FC<NutritionalDashboardProps> = ({
  actualTotals,
  targets,
  weight,
  ratios,
  solverResult,
  activeMeals,
  foodDatabase
}) => {
  const safeTargetCal = targets?.calories && !isNaN(targets.calories) ? targets.calories : 0;
  const safeTargetPro = targets?.protein && !isNaN(targets.protein) ? targets.protein : 0;
  const safeTargetCarb = targets?.carbs && !isNaN(targets.carbs) ? targets.carbs : 0;
  const safeTargetFat = targets?.fat && !isNaN(targets.fat) ? targets.fat : 0;

  const safeActualCal = actualTotals?.calories && !isNaN(actualTotals.calories) ? actualTotals.calories : 0;
  const safeActualPro = actualTotals?.protein && !isNaN(actualTotals.protein) ? actualTotals.protein : 0;
  const safeActualCarb = actualTotals?.carbs && !isNaN(actualTotals.carbs) ? actualTotals.carbs : 0;
  const safeActualFat = actualTotals?.fat && !isNaN(actualTotals.fat) ? actualTotals.fat : 0;

  const caloriesPct = safeTargetCal > 0 ? Math.min(100, Math.max(0, (safeActualCal / safeTargetCal) * 100)) : 0;
  const proteinPct = safeTargetPro > 0 ? Math.min(100, Math.max(0, (safeActualPro / safeTargetPro) * 100)) : 0;
  const carbsPct = safeTargetCarb > 0 ? Math.min(100, Math.max(0, (safeActualCarb / safeTargetCarb) * 100)) : 0;
  const fatPct = safeTargetFat > 0 ? Math.min(100, Math.max(0, (safeActualFat / safeTargetFat) * 100)) : 0;

  const calDelta = Math.round(safeActualCal - safeTargetCal) || 0;
  const proDelta = (Math.round((safeActualPro - safeTargetPro) * 10) / 10) || 0;
  const carbDelta = (Math.round((safeActualCarb - safeTargetCarb) * 10) / 10) || 0;
  const fatDelta = (Math.round((safeActualFat - safeTargetFat) * 10) / 10) || 0;

  const safeWeight = typeof weight === 'number' && !isNaN(weight) && weight > 0 ? weight : 0;
  const targetCalRatio = safeWeight > 0 ? (Math.round((safeTargetCal / safeWeight) * 10) / 10) || 0 : 0;
  const actualCalRatio = safeWeight > 0 ? (Math.round((safeActualCal / safeWeight) * 10) / 10) || 0 : 0;
  const actualProRatio = safeWeight > 0 ? (Math.round((safeActualPro / safeWeight) * 10) / 10) || 0 : 0;
  const actualCarbRatio = safeWeight > 0 ? (Math.round((safeActualCarb / safeWeight) * 10) / 10) || 0 : 0;
  const actualFatRatio = safeWeight > 0 ? (Math.round((safeActualFat / safeWeight) * 10) / 10) || 0 : 0;

  const safeTargetProRatio = typeof ratios?.proteinPerKg === 'number' && !isNaN(ratios.proteinPerKg) ? ratios.proteinPerKg : 0;
  const safeTargetCarbRatio = typeof ratios?.carbsPerKg === 'number' && !isNaN(ratios.carbsPerKg) ? ratios.carbsPerKg : 0;
  const safeTargetFatRatio = typeof ratios?.fatPerKg === 'number' && !isNaN(ratios.fatPerKg) ? ratios.fatPerKg : 0;

  const isUnreachable = solverResult.status === 'unreachable';

  // Calculate locked foods macro contributions
  const lockedTotals = React.useMemo(() => {
    let cal = 0, pro = 0, carb = 0, fat = 0;
    const foodMap = new Map(foodDatabase.map(f => [f.id, f]));
    for (const meal of activeMeals) {
      for (const item of meal.foods) {
        if (item.locked) {
          const food = foodMap.get(item.foodId);
          if (food) {
            const nut = getNutrition(food, item.quantity);
            cal += nut.calories;
            pro += nut.protein;
            carb += nut.carbs;
            fat += nut.fat;
          }
        }
      }
    }
    return { calories: cal, protein: pro, carbs: carb, fat: fat };
  }, [activeMeals, foodDatabase]);

  const exceedsCal = lockedTotals.calories > safeTargetCal;
  const exceedsPro = lockedTotals.protein > safeTargetPro;
  const exceedsCarb = lockedTotals.carbs > safeTargetCarb;
  const exceedsFat = lockedTotals.fat > safeTargetFat;
  const hasExceededLocked = exceedsCal || exceedsPro || exceedsCarb || exceedsFat;

  return (
    <div className="space-y-6">
      {/* Target Progress Section */}
      <section className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-border pb-4">
          <div>
            <h2 className="text-lg font-bold text-brand-primary flex items-center gap-2">
              <Flame className="h-5 w-5 text-brand-accent animate-pulse" /> Nutritional Targets Dashboard
            </h2>
            <p className="text-xs text-slate-500">Real-time macro accumulation monitoring and ratio breakdown</p>
          </div>
        </div>

        {/* Locked values exceeding targets diagnostics check */}
        {hasExceededLocked && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 text-rose-800 text-sm">
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold">Locked Items Exceed Targets</h4>
              <p className="text-xs text-rose-700 mt-1">
                Your locked meal quantities are already greater than your daily targets:
                {exceedsCal && ` Calories (Locked: ${Math.round(lockedTotals.calories)} kcal / Target: ${Math.round(safeTargetCal)} kcal)`}
                {exceedsPro && ` Protein (Locked: ${Math.round(lockedTotals.protein * 10) / 10}g / Target: ${Math.round(safeTargetPro * 10) / 10}g)`}
                {exceedsCarb && ` Carbs (Locked: ${Math.round(lockedTotals.carbs * 10) / 10}g / Target: ${Math.round(safeTargetCarb * 10) / 10}g)`}
                {exceedsFat && ` Fat (Locked: ${Math.round(lockedTotals.fat * 10) / 10}g / Target: ${Math.round(safeTargetFat * 10) / 10}g)`}.
                Unlock some items or reduce locked portions to allow optimization.
              </p>
            </div>
          </div>
        )}

        {/* Diagnostic Warning Card if Unreachable */}
        {isUnreachable && !hasExceededLocked && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 text-sm">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold">Macro Targets Unreachable with Current Settings</h4>
              <p className="text-xs text-amber-700 mt-1">
                The optimization solver is unable to perfectly reach target values. Protein delta: {proDelta > 0 ? `+${proDelta.toFixed(1)}` : proDelta.toFixed(1)}g, Carbs: {carbDelta > 0 ? `+${carbDelta.toFixed(1)}` : carbDelta.toFixed(1)}g. Try unlocking items (like Chicken Breast, Beef, or Rice) to allow the solver to balance the ratios dynamically.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Calories */}
          <div className="bg-brand-bg border border-brand-border p-5 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                <span>CALORIES</span>
                <span className={`${Math.abs(calDelta) > 50 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}`}>
                  {calDelta > 0 ? `+${calDelta}` : calDelta} kcal
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-orange-500">{Math.round(safeActualCal)}</span>
                <span className="text-xs text-slate-500">/ {Math.round(safeTargetCal)} kcal</span>
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 mt-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-500 to-brand-highlight h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${caloriesPct}%` }}
              />
            </div>
          </div>

          {/* Protein */}
          <div className="bg-brand-bg border border-brand-border p-5 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                <span>PROTEIN</span>
                <span className={`${Math.abs(proDelta) > 3 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}`}>
                  {proDelta > 0 ? `+${proDelta.toFixed(1)}` : proDelta.toFixed(1)} g
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-rose-500">{Math.round(safeActualPro * 10) / 10}</span>
                <span className="text-xs text-slate-500">/ {Math.round(safeTargetPro * 10) / 10} g</span>
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 mt-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-rose-500 to-pink-500 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${proteinPct}%` }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div className="bg-brand-bg border border-brand-border p-5 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                <span>CARBOHYDRATES</span>
                <span className={`${Math.abs(carbDelta) > 5 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}`}>
                  {carbDelta > 0 ? `+${carbDelta.toFixed(1)}` : carbDelta.toFixed(1)} g
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-amber-600">{Math.round(safeActualCarb * 10) / 10}</span>
                <span className="text-xs text-slate-500">/ {Math.round(safeTargetCarb * 10) / 10} g</span>
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 mt-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-500 to-yellow-500 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${carbsPct}%` }}
              />
            </div>
          </div>

          {/* Fat */}
          <div className="bg-brand-bg border border-brand-border p-5 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                <span>FAT</span>
                <span className={`${Math.abs(fatDelta) > 3 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}`}>
                  {fatDelta > 0 ? `+${fatDelta.toFixed(1)}` : fatDelta.toFixed(1)} g
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-sky-500">{Math.round(safeActualFat * 10) / 10}</span>
                <span className="text-xs text-slate-500">/ {Math.round(safeTargetFat * 10) / 10} g</span>
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 mt-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-sky-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${fatPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Ratio Deltas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 border-t border-brand-border pt-6">
          {/* Cal ratio */}
          <div className="bg-brand-bg border border-brand-border p-4 rounded-xl flex flex-col justify-between">
            <span className="text-xs text-slate-500 font-semibold mb-2">CALORIES RATIO</span>
            <span className="text-lg font-bold text-orange-500">{actualCalRatio.toFixed(1)} / {targetCalRatio.toFixed(1)} kcal/kg</span>
          </div>
          {/* Pro ratio */}
          <div className="bg-brand-bg border border-brand-border p-4 rounded-xl flex flex-col justify-between">
            <span className="text-xs text-slate-500 font-semibold mb-2">PROTEIN RATIO</span>
            <span className="text-lg font-bold text-rose-500">{actualProRatio.toFixed(1)} / {safeTargetProRatio.toFixed(1)} g/kg</span>
          </div>
          {/* Carb ratio */}
          <div className="bg-brand-bg border border-brand-border p-4 rounded-xl flex flex-col justify-between">
            <span className="text-xs text-slate-500 font-semibold mb-2">CARBS RATIO</span>
            <span className="text-lg font-bold text-amber-600">{actualCarbRatio.toFixed(1)} / {safeTargetCarbRatio.toFixed(1)} g/kg</span>
          </div>
          {/* Fat ratio */}
          <div className="bg-brand-bg border border-brand-border p-4 rounded-xl flex flex-col justify-between">
            <span className="text-xs text-slate-500 font-semibold mb-2">FAT RATIO</span>
            <span className="text-lg font-bold text-sky-500">{actualFatRatio.toFixed(1)} / {safeTargetFatRatio.toFixed(1)} g/kg</span>
          </div>
        </div>
      </section>
    </div>
  );
};
