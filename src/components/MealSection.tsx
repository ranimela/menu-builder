import React from 'react';
import type { Meal, FoodItem } from '../types/food';
import { Trash2, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { getNutrition, getFoodLimits, getSwapDetails } from '../utils/solver';
import { SYSTEM_CONSTRAINTS } from '../utils/constraints';

interface MealSectionProps {
  meal: Meal;
  dayId: string;
  foodDatabase: FoodItem[];
  foodMap: Map<string, FoodItem>;
  onQuantityChange: (mealId: string, foodId: string, qty: number) => void;
  onToggleLock: (mealId: string, foodId: string) => void;
  onRemoveFood: (mealId: string, foodId: string) => void;
  onAddFood: (mealId: string, foodId: string) => void;
  selectedSwaps: Record<string, string>;
  setSelectedSwaps: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  mealTotals: { calories: number; protein: number; carbs: number; fat: number };
}

export const MealSection: React.FC<MealSectionProps> = ({
  meal,
  dayId,
  foodDatabase,
  foodMap,
  onQuantityChange,
  onToggleLock,
  onRemoveFood,
  onAddFood,
  selectedSwaps,
  setSelectedSwaps,
  mealTotals
}) => {
  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-sm">
      {/* Meal Header card */}
      <div className="bg-brand-card px-6 py-4 border-b border-brand-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-base font-bold text-brand-primary flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand-accent"></span>
            {meal.name}
          </h3>
          <p className="text-xs text-slate-500">Add or adjust portion sizes of food items in this meal</p>
        </div>

        {/* Mini totals display */}
        <div className="flex gap-4 text-xs font-semibold text-slate-700">
          <span className="bg-brand-bg px-2.5 py-1.5 rounded-lg border border-brand-border">
            Calories: <strong className="text-orange-500">{Math.round(mealTotals.calories)} kcal</strong>
          </span>
          <span className="bg-brand-bg px-2.5 py-1.5 rounded-lg border border-brand-border">
            Protein: <strong className="text-rose-500">{Math.round(mealTotals.protein * 10) / 10}g</strong>
          </span>
          <span className="bg-brand-bg px-2.5 py-1.5 rounded-lg border border-brand-border">
            Carbs: <strong className="text-amber-600">{Math.round(mealTotals.carbs * 10) / 10}g</strong>
          </span>
          <span className="bg-brand-bg px-2.5 py-1.5 rounded-lg border border-brand-border">
            Fats: <strong className="text-sky-500">{Math.round(mealTotals.fat * 10) / 10}g</strong>
          </span>
        </div>
      </div>

      {/* Meal list */}
      {(() => {
        const resolvedFoods = meal.foods.flatMap((item) => {
          const food = foodMap.get(item.foodId);
          if (!food) return [];

          const nut = getNutrition(food, item.quantity);
          const limits = getFoodLimits(item.foodId, dayId, meal.id, food);
          // Find matching declarative constraint description
          const activeConstraint = SYSTEM_CONSTRAINTS.find(
            (c) =>
              c.foodId === item.foodId &&
              (!c.dayId || c.dayId === dayId) &&
              (!c.mealId || c.mealId === meal.id)
          );

          return [{ item, food, nut, limits, activeConstraint }];
        });

        const swapDisplay = (() => {
          const swapFoodId = selectedSwaps[meal.id];
          if (!swapFoodId) return null;

          const swap = getSwapDetails(meal, swapFoodId, foodMap);
          if (!swap) return null;

          const { altFood, roundedQty, delta } = swap;
          const diff = {
            calories: Math.round(delta.calories),
            protein: Math.round(delta.protein * 10) / 10,
            carbs: Math.round(delta.carbs * 10) / 10,
            fat: Math.round(delta.fat * 10) / 10,
          };

          const formatDiff = (val: number) => {
            if (val > 0) return `+${val.toFixed(1)}`;
            if (val < 0) return `${val.toFixed(1)}`;
            return `0.0`;
          };

          return { altFood, roundedQty, diff, formatDiff };
        })();

        const renderBadges = (
          isMandatory: boolean | undefined,
          activeConstraint: (typeof SYSTEM_CONSTRAINTS)[number] | undefined,
          justifyClass: string
        ) => {
          if (!isMandatory && !activeConstraint) return null;
          return (
            <div className={`flex flex-wrap gap-1.5 items-center ${justifyClass}`}>
              {isMandatory && (
                <span className="bg-brand-accent/10 text-brand-accent border border-brand-accent/20 text-[10px] font-bold px-2 py-0.5 rounded">
                  Mandatory
                </span>
              )}
              {activeConstraint && (
                <span
                  title={activeConstraint.description}
                  className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 cursor-help"
                >
                  <AlertTriangle className="h-3 w-3" />
                  {activeConstraint.min !== undefined ? `Min: ${activeConstraint.min}` : ''}
                  {activeConstraint.max !== undefined ? ` Max: ${activeConstraint.max}` : ''}
                </span>
              )}
            </div>
          );
        };

        const renderQuantityInput = (
          item: (typeof meal.foods)[number],
          food: NonNullable<ReturnType<typeof foodMap.get>>,
          limits: { min: number; max: number },
          widthClass: string
        ) => (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <input
              type="number"
              step={food.step || 1}
              min={limits.min}
              max={limits.max}
              value={item.quantity === 0 ? '' : item.quantity}
              onChange={(e) => {
                const valStr = e.target.value;
                if (valStr === '') {
                  onQuantityChange(meal.id, item.foodId, 0);
                } else {
                  const parsed = parseFloat(valStr);
                  if (!isNaN(parsed)) {
                    onQuantityChange(meal.id, item.foodId, parsed);
                  }
                }
              }}
              className={`${widthClass} bg-brand-bg border border-brand-border text-brand-primary focus:border-brand-accent rounded-lg text-sm font-semibold px-2 py-1 outline-none`}
            />
            <span className="text-xs text-slate-500 font-semibold">{food.unit}</span>
          </div>
        );

        const renderLockButton = (item: (typeof meal.foods)[number]) => (
          <button
            onClick={() => onToggleLock(meal.id, item.foodId)}
            className={`p-1.5 rounded-lg border transition ${
              item.locked
                ? 'bg-brand-highlight/20 border-brand-highlight/50 text-brand-primary hover:bg-brand-highlight/30'
                : 'bg-brand-bg border-brand-border text-slate-400 hover:text-brand-primary hover:border-slate-300'
            }`}
            title={item.locked ? 'Unlock quantity' : 'Lock quantity'}
          >
            {item.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </button>
        );

        const renderRemoveButton = (foodId: string) => (
          <button
            onClick={() => onRemoveFood(meal.id, foodId)}
            className="p-1.5 rounded-lg border border-transparent hover:border-brand-border text-slate-400 hover:text-brand-accent hover:bg-brand-accent/5 transition cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        );

        const renderMacros = (nut: { protein: number; carbs: number; fat: number }) => (
          <div className="text-xs font-semibold space-x-1.5">
            <span className="text-rose-500">{Math.round(nut.protein * 10) / 10}g P</span>
            <span className="text-slate-400">/</span>
            <span className="text-amber-500">{Math.round(nut.carbs * 10) / 10}g C</span>
            <span className="text-slate-400">/</span>
            <span className="text-sky-500">{Math.round(nut.fat * 10) / 10}g F</span>
          </div>
        );

        const renderSwapMacros = (
          diff: { protein: number; carbs: number; fat: number },
          formatDiff: (val: number) => string
        ) => (
          <div className="text-xs font-bold space-x-1.5">
            <span className={diff.protein >= 0 ? 'text-rose-500' : 'text-rose-700'}>
              {formatDiff(diff.protein)}g P
            </span>
            <span className="text-slate-400">/</span>
            <span className={diff.carbs >= 0 ? 'text-amber-500' : 'text-amber-700'}>
              {formatDiff(diff.carbs)}g C
            </span>
            <span className="text-slate-400">/</span>
            <span className={diff.fat >= 0 ? 'text-sky-500' : 'text-sky-700'}>
              {formatDiff(diff.fat)}g F
            </span>
          </div>
        );

        const renderClearSwapButton = () => (
          <button
            onClick={() => {
              setSelectedSwaps((prev) => {
                const copy = { ...prev };
                delete copy[meal.id];
                return copy;
              });
            }}
            className="p-1 px-2.5 rounded-lg border border-brand-border hover:border-brand-accent text-xs font-bold text-slate-500 hover:text-brand-accent hover:bg-brand-accent/5 transition cursor-pointer"
          >
            Clear Swap
          </button>
        );

        return (
          <>
            {/* Mobile Stacked Cards */}
            <div className="md:hidden divide-y divide-brand-border">
              {resolvedFoods.length === 0 ? (
                <div className="py-8 px-4 text-center text-slate-500 text-sm">
                  No food items added to this meal yet. Use the dropdown below to select foods.
                </div>
              ) : (
                resolvedFoods.map(({ item, food, nut, limits, activeConstraint }) => (
                  <div key={item.foodId} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="font-semibold text-brand-primary text-sm leading-snug">
                          {food.name}
                        </div>
                        {renderBadges(food.isMandatory, activeConstraint, 'justify-start')}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {renderQuantityInput(item, food, limits, 'w-16')}
                        {renderLockButton(item)}
                        {renderRemoveButton(item.foodId)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-orange-500 font-bold text-xs">
                        {Math.round(nut.calories)} kcal
                      </span>
                      {renderMacros(nut)}
                    </div>
                  </div>
                ))
              )}

              {swapDisplay && (
                <div className="bg-brand-secondary/5 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-amber-600 font-bold text-sm">
                        Swap: {swapDisplay.altFood.name}
                      </div>
                      <div className="text-xs text-slate-500">Equivalent Portion</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-brand-primary">
                        {swapDisplay.roundedQty} {swapDisplay.altFood.unit}
                      </span>
                      {renderClearSwapButton()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-orange-500 font-bold text-xs">
                      {swapDisplay.diff.calories > 0
                        ? `+${swapDisplay.diff.calories}`
                        : swapDisplay.diff.calories}{' '}
                      kcal
                    </span>
                    {renderSwapMacros(swapDisplay.diff, swapDisplay.formatDiff)}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-bg text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-brand-border">
                    <th className="py-3 px-6">Food Name</th>
                    <th className="py-3 px-6">Quantity</th>
                    <th className="py-3 px-6 text-center">Lock Portions</th>
                    <th className="py-3 px-6">Calories</th>
                    <th className="py-3 px-6">P / C / F</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {resolvedFoods.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 text-sm">
                        No food items added to this meal yet. Use the dropdown below to select foods.
                      </td>
                    </tr>
                  ) : (
                    resolvedFoods.map(({ item, food, nut, limits, activeConstraint }) => (
                      <tr key={item.foodId} className="hover:bg-brand-bg/50 transition">
                        <td className="py-4 px-6 font-semibold text-brand-primary">
                          <div className="flex flex-wrap items-center gap-2">
                            <span>{food.name}</span>
                            {renderBadges(food.isMandatory, activeConstraint, 'justify-start')}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {renderQuantityInput(item, food, limits, 'w-20')}
                        </td>
                        <td className="py-4 px-6 text-center">{renderLockButton(item)}</td>
                        <td className="py-4 px-6 text-orange-500 font-bold text-sm">
                          {Math.round(nut.calories)} kcal
                        </td>
                        <td className="py-4 px-6">{renderMacros(nut)}</td>
                        <td className="py-4 px-6 text-right">
                          {renderRemoveButton(item.foodId)}
                        </td>
                      </tr>
                    ))
                  )}

                  {/* Carb Swap Row */}
                  {swapDisplay && (
                    <tr className="bg-brand-secondary/5 font-semibold text-brand-primary border-t border-brand-border">
                      <td className="py-3 px-6 text-amber-600 font-bold">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>Swap: {swapDisplay.altFood.name}</span>
                          <span className="text-xs font-normal text-slate-500">
                            Equivalent Portion
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        <div className="text-sm font-bold text-brand-primary">
                          {swapDisplay.roundedQty} {swapDisplay.altFood.unit}
                        </div>
                      </td>
                      <td className="py-3 px-6 text-center"></td>
                      <td className="py-3 px-6 text-orange-500 font-bold text-sm">
                        {swapDisplay.diff.calories > 0
                          ? `+${swapDisplay.diff.calories}`
                          : swapDisplay.diff.calories}{' '}
                        kcal
                      </td>
                      <td className="py-3 px-6">
                        {renderSwapMacros(swapDisplay.diff, swapDisplay.formatDiff)}
                      </td>
                      <td className="py-3 px-6 text-right">{renderClearSwapButton()}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        );
      })()}

      {/* Add food to meal controls */}
      <div className="bg-brand-bg p-4 border-t border-brand-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add food item:</span>
          <select
            onChange={(e) => {
              if (e.target.value) {
                onAddFood(meal.id, e.target.value);
                e.target.value = '';
              }
            }}
            className="bg-brand-card border border-brand-border text-sm font-semibold rounded-lg px-3 py-1.5 outline-none focus:border-brand-accent text-brand-primary w-full sm:w-64"
            defaultValue=""
          >
            <option value="" disabled>Select food item...</option>
            {foodDatabase.filter(f => !meal.foods.some(mf => mf.foodId === f.id)).map(food => (
              <option key={food.id} value={food.id}>
                {food.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Carb Swap:</span>
          {(() => {
            const hasRice = meal.foods.some(f => f.foodId === 'white_rice' && f.quantity > 0);
            const swapOptions = [
              { id: 'quinoa', name: 'Quinoa' },
              { id: 'pasta', name: 'Pasta' },
              { id: 'rice_noodles', name: 'Rice Noodles' },
              { id: 'sweet_potatoes', name: 'Sweet Potatoes' },
              { id: 'potatoes', name: 'Potatoes' },
              { id: 'majadra', name: 'Majadra' },
              { id: 'raw_oats', name: 'Raw Oats' },
              { id: 'cooked_lentils', name: 'Cooked Lentils' },
              { id: 'spelt_pita', name: 'Spelt Pita' },
              { id: 'rice_cake', name: 'Rice Cake' },
              { id: 'buckwheat_cake', name: 'Buckwheat Cake' }
            ];

            return (
              <select
                disabled={!hasRice}
                value={selectedSwaps[meal.id] || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedSwaps(prev => {
                    if (!val) {
                      const copy = { ...prev };
                      delete copy[meal.id];
                      return copy;
                    }
                    return {
                      ...prev,
                      [meal.id]: val
                    };
                  });
                }}
                className="bg-brand-card border border-brand-border text-sm font-semibold rounded-lg px-3 py-1.5 outline-none focus:border-brand-accent text-brand-primary disabled:opacity-50 w-full sm:w-56"
              >
                <option value="">
                  {hasRice ? "Select swap alternative..." : "Add White Rice to enable swaps"}
                </option>
                {swapOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
