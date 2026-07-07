import React from 'react';
import type { TargetMacros, TargetRatios, SolverResult } from '../types/food';
import { Flame, AlertTriangle } from 'lucide-react';

interface NutritionalDashboardProps {
  actualTotals: TargetMacros;
  targets: TargetMacros;
  weight: number;
  ratios: TargetRatios;
  solverResult: SolverResult;
}

export const NutritionalDashboard: React.FC<NutritionalDashboardProps> = ({
  actualTotals,
  targets,
  weight,
  ratios,
  solverResult
}) => {
  const caloriesPct = Math.min(100, (actualTotals.calories / targets.calories) * 100);
  const proteinPct = Math.min(100, (actualTotals.protein / targets.protein) * 100);
  const carbsPct = Math.min(100, (actualTotals.carbs / targets.carbs) * 100);
  const fatPct = Math.min(100, (actualTotals.fat / targets.fat) * 100);

  const calDelta = Math.round(actualTotals.calories - targets.calories);
  const proDelta = Math.round((actualTotals.protein - targets.protein) * 10) / 10;
  const carbDelta = Math.round((actualTotals.carbs - targets.carbs) * 10) / 10;
  const fatDelta = Math.round((actualTotals.fat - targets.fat) * 10) / 10;

  const actualCalRatio = weight > 0 ? Math.round((actualTotals.calories / weight) * 10) / 10 : 0;
  const actualProRatio = weight > 0 ? Math.round((actualTotals.protein / weight) * 10) / 10 : 0;
  const actualCarbRatio = weight > 0 ? Math.round((actualTotals.carbs / weight) * 10) / 10 : 0;
  const actualFatRatio = weight > 0 ? Math.round((actualTotals.fat / weight) * 10) / 10 : 0;

  const isUnreachable = solverResult.status === 'unreachable';

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

        {/* Diagnostic Warning Card if Unreachable */}
        {isUnreachable && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 text-sm">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold">Macro Targets Unreachable with Current Settings</h4>
              <p className="text-xs text-amber-700 mt-1">
                The optimization solver is unable to perfectly reach target values. Protein delta: {proDelta > 0 ? `+${proDelta}` : proDelta}g, Carbs: {carbDelta > 0 ? `+${carbDelta}` : carbDelta}g. Try unlocking items (like Chicken Breast, Beef, or Rice) to allow the solver to balance the ratios dynamically.
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
                <span className="text-2xl font-extrabold text-orange-500">{Math.round(actualTotals.calories)}</span>
                <span className="text-xs text-slate-500">/ {targets.calories} kcal</span>
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
                  {proDelta > 0 ? `+${proDelta}` : proDelta} g
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-rose-500">{Math.round(actualTotals.protein * 10) / 10}</span>
                <span className="text-xs text-slate-500">/ {targets.protein} g</span>
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
                  {carbDelta > 0 ? `+${carbDelta}` : carbDelta} g
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-amber-600">{Math.round(actualTotals.carbs * 10) / 10}</span>
                <span className="text-xs text-slate-500">/ {targets.carbs} g</span>
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
                  {fatDelta > 0 ? `+${fatDelta}` : fatDelta} g
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-sky-500">{Math.round(actualTotals.fat * 10) / 10}</span>
                <span className="text-xs text-slate-500">/ {targets.fat} g</span>
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
            <span className="text-lg font-bold text-orange-500">{actualCalRatio.toFixed(1)} / {Math.round((targets.calories / weight) * 10) / 10} kcal/kg</span>
          </div>
          {/* Pro ratio */}
          <div className="bg-brand-bg border border-brand-border p-4 rounded-xl flex flex-col justify-between">
            <span className="text-xs text-slate-500 font-semibold mb-2">PROTEIN RATIO</span>
            <span className="text-lg font-bold text-rose-500">{actualProRatio.toFixed(1)} / {ratios.proteinPerKg.toFixed(1)} g/kg</span>
          </div>
          {/* Carb ratio */}
          <div className="bg-brand-bg border border-brand-border p-4 rounded-xl flex flex-col justify-between">
            <span className="text-xs text-slate-500 font-semibold mb-2">CARBS RATIO</span>
            <span className="text-lg font-bold text-amber-600">{actualCarbRatio.toFixed(1)} / {ratios.carbsPerKg.toFixed(1)} g/kg</span>
          </div>
          {/* Fat ratio */}
          <div className="bg-brand-bg border border-brand-border p-4 rounded-xl flex flex-col justify-between">
            <span className="text-xs text-slate-500 font-semibold mb-2">FAT RATIO</span>
            <span className="text-lg font-bold text-sky-500">{actualFatRatio.toFixed(1)} / {ratios.fatPerKg.toFixed(1)} g/kg</span>
          </div>
        </div>
      </section>
    </div>
  );
};
