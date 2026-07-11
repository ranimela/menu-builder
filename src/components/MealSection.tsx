import React from 'react';
import type { Meal, FoodItem } from '../types/food';
import { Trash2, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { getNutrition, getFoodLimits } from '../utils/solver';
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
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-bg text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-brand-border">
              <th className="py-3 px-6">Food Name</th>
              <th className="py-3 px-6 text-center">Attributes/Constraints</th>
              <th className="py-3 px-6">Quantity</th>
              <th className="py-3 px-6 text-center">Lock Portions</th>
              <th className="py-3 px-6">Calories</th>
              <th className="py-3 px-6">P / C / F</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
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
                const limits = getFoodLimits(item.foodId, dayId, meal.id, food);
                
                // Find matching declarative constraint description
                const activeConstraint = SYSTEM_CONSTRAINTS.find(
                  c => c.foodId === item.foodId && 
                  (!c.dayId || c.dayId === dayId) && 
                  (!c.mealId || c.mealId === meal.id)
                );

                return (
                  <tr key={item.foodId} className="hover:bg-brand-bg/50 transition">
                    <td className="py-4 px-6 font-semibold text-brand-primary">
                      {food.name}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center gap-1.5 items-center">
                        {food.isMandatory && (
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
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
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
                          className="w-20 bg-brand-bg border border-brand-border text-brand-primary focus:border-brand-accent rounded-lg text-sm font-semibold px-2 py-1 outline-none"
                        />
                        <span className="text-xs text-slate-500 font-semibold">{food.unit}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => onToggleLock(meal.id, item.foodId)}
                        className={`p-1.5 rounded-lg border transition ${
                          item.locked 
                            ? 'bg-brand-highlight/20 border-brand-highlight/50 text-brand-primary hover:bg-brand-highlight/30' 
                            : 'bg-brand-bg border-brand-border text-slate-400 hover:text-brand-primary hover:border-slate-300'
                        }`}
                        title={item.locked ? "Unlock quantity" : "Lock quantity"}
                      >
                        {item.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-orange-500 font-bold text-sm">
                      {Math.round(nut.calories)} kcal
                    </td>
                    <td className="py-4 px-6 text-xs font-semibold space-x-1.5">
                      <span className="text-rose-500">{Math.round(nut.protein * 10) / 10}g P</span>
                      <span className="text-slate-400">/</span>
                      <span className="text-amber-500">{Math.round(nut.carbs * 10) / 10}g C</span>
                      <span className="text-slate-400">/</span>
                      <span className="text-sky-500">{Math.round(nut.fat * 10) / 10}g F</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => onRemoveFood(meal.id, item.foodId)}
                        className="p-1.5 rounded-lg border border-transparent hover:border-brand-border text-slate-400 hover:text-brand-accent hover:bg-brand-accent/5 transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}

            {/* Carb Swap Row */}
            {(() => {
              const swapFoodId = selectedSwaps[meal.id];
              if (!swapFoodId) return null;

              const altFood = foodMap.get(swapFoodId);
              const riceFood = foodMap.get('white_rice');
              const riceInMeal = meal.foods.find(f => f.foodId === 'white_rice');

              if (!altFood || !riceFood || !riceInMeal || riceInMeal.quantity <= 0) return null;
              if (!riceFood.servingSize || riceFood.servingSize <= 0) return null;
              if (!altFood.servingSize || altFood.servingSize <= 0) return null;

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

              const diff = {
                calories: Math.round(altNut.calories - riceNut.calories),
                protein: Math.round((altNut.protein - riceNut.protein) * 10) / 10,
                carbs: Math.round((altNut.carbs - riceNut.carbs) * 10) / 10,
                fat: Math.round((altNut.fat - riceNut.fat) * 10) / 10
              };

              const formatDiff = (val: number) => {
                if (val > 0) return `+${val.toFixed(1)}`;
                if (val < 0) return `${val.toFixed(1)}`;
                return `0.0`;
              };

              return (
                <tr className="bg-brand-secondary/5 font-semibold text-brand-primary border-t border-brand-border">
                  <td className="py-3 px-6 text-amber-600 font-bold">
                    Swap: {altFood.name}
                  </td>
                  <td className="py-3 px-6 text-center text-xs text-slate-500">
                    Equivalent Portion
                  </td>
                  <td className="py-3 px-6">
                    <div className="text-sm font-bold text-brand-primary">
                      {roundedQty} {altFood.unit}
                    </div>
                  </td>
                  <td className="py-3 px-6 text-center"></td>
                  <td className="py-3 px-6 text-orange-500 font-bold text-sm">
                    {diff.calories > 0 ? `+${diff.calories}` : diff.calories} kcal
                  </td>
                  <td className="py-3 px-6 text-xs font-bold space-x-1.5">
                    <span className={diff.protein >= 0 ? "text-rose-500" : "text-rose-700"}>
                      {formatDiff(diff.protein)}g P
                    </span>
                    <span className="text-slate-400">/</span>
                    <span className={diff.carbs >= 0 ? "text-amber-500" : "text-amber-700"}>
                      {formatDiff(diff.carbs)}g C
                    </span>
                    <span className="text-slate-400">/</span>
                    <span className={diff.fat >= 0 ? "text-sky-500" : "text-sky-700"}>
                      {formatDiff(diff.fat)}g F
                    </span>
                  </td>
                  <td className="py-3 px-6 text-right">
                    <button
                      onClick={() => {
                        setSelectedSwaps(prev => {
                          const copy = { ...prev };
                          delete copy[meal.id];
                          return copy;
                        });
                      }}
                      className="p-1 px-2.5 rounded-lg border border-brand-border hover:border-brand-accent text-xs font-bold text-slate-500 hover:text-brand-accent hover:bg-brand-accent/5 transition cursor-pointer"
                    >
                      Clear Swap
                    </button>
                  </td>
                </tr>
              );
            })()}
          </tbody>
        </table>
      </div>

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
              { id: 'cooked_lentils', name: 'Cooked Lentils' }
            ];

            return (
              <select
                disabled={!hasRice}
                value={selectedSwaps[meal.id] || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedSwaps(prev => ({
                    ...prev,
                    [meal.id]: val
                  }));
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
