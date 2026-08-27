import React, { useMemo } from 'react';
import type { FoodItem } from '../types/food';
import { Wheat } from 'lucide-react';
import { getNutrition } from '../utils/solver';

interface CarbAlternativesTableProps {
  totalRiceQuantity: number;
  foodMap: Map<string, FoodItem>;
}

interface CarbAlternativeEntry {
  food: FoodItem;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const CarbAlternativesTable: React.FC<CarbAlternativesTableProps> = ({
  totalRiceQuantity,
  foodMap
}) => {
  const safeRiceQty = typeof totalRiceQuantity === 'number' && !isNaN(totalRiceQuantity) && totalRiceQuantity > 0 ? totalRiceQuantity : 0;
  const riceFood = foodMap.get('white_rice');
  const riceCarbsPerServing = (riceFood && riceFood.servingSize > 0) ? ((riceFood.carbs || 0) / riceFood.servingSize) : 0.28;
  const totalRiceCarbs = safeRiceQty * riceCarbsPerServing;

  const carbAlternatives = useMemo<CarbAlternativeEntry[]>(() => {
    const alternativeIds = [
      'white_rice',
      'quinoa',
      'pasta',
      'rice_noodles',
      'sweet_potatoes',
      'potatoes',
      'majadra',
      'raw_oats',
      'cooked_lentils'
    ];

    if (!riceFood || !riceFood.servingSize || riceFood.servingSize <= 0) return [];

    const list: CarbAlternativeEntry[] = [];

    for (const id of alternativeIds) {
      const food = foodMap.get(id);
      if (!food || !food.servingSize || food.servingSize <= 0) continue;

      const carbDensity = (food.carbs || 0) / food.servingSize;
      const equivQty = carbDensity > 0 ? totalRiceCarbs / carbDensity : 0;

      const step = food.step && food.step > 0 ? food.step : 10;
      const roundedQty = Math.round((Math.round(equivQty / step) * step) * 100) / 100;
      const nut = getNutrition(food, roundedQty);

      list.push({
        food,
        quantity: Math.round(roundedQty * 10) / 10,
        calories: Math.round(nut.calories),
        protein: Math.round(nut.protein * 10) / 10,
        carbs: Math.round(nut.carbs * 10) / 10,
        fat: Math.round(nut.fat * 10) / 10
      });
    }

    return list;
  }, [totalRiceCarbs, riceFood, foodMap]);

  return (
    <section className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-border pb-4">
        <div>
          <h2 className="text-lg font-bold text-brand-primary flex items-center gap-2">
            <Wheat className="h-5 w-5 text-amber-500" /> Carb Alternatives Equivalents
          </h2>
          <p className="text-xs text-slate-500">
            Portion size of alternative carb sources matching the total carbohydrates of your active White Rice ({safeRiceQty}g = {Math.round(totalRiceCarbs * 10) / 10}g carbs)
          </p>
        </div>
        {safeRiceQty <= 0 && (
          <span className="text-xs text-brand-accent font-semibold bg-brand-accent/10 border border-brand-accent/20 px-2.5 py-1 rounded-full">
            Add White Rice to menu to calculate swaps
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-bg text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-brand-border">
              <th className="py-3 px-6">Food Name</th>
              <th className="py-3 px-6">Equivalent Portion</th>
              <th className="py-3 px-6">Calories</th>
              <th className="py-3 px-6">Protein</th>
              <th className="py-3 px-6">Carbs</th>
              <th className="py-3 px-6">Fats</th>
              <th className="py-3 px-6">Step Size</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {safeRiceQty <= 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 text-sm">
                  Select or increase White Rice quantity in the menu to display equivalent carbohydrate swaps.
                </td>
              </tr>
            ) : (
              carbAlternatives.map((alt) => (
                <tr key={alt.food.id} className={`hover:bg-brand-bg/50 transition ${alt.food.id === 'white_rice' ? 'bg-brand-secondary/10 font-bold' : ''}`}>
                  <td className="py-4 px-6 text-brand-primary flex items-center gap-2">
                    {alt.food.id === 'white_rice' && <span className="h-1.5 w-1.5 rounded-full bg-brand-accent"></span>}
                    {alt.food.name}
                  </td>
                  <td className="py-4 px-6 text-brand-primary font-semibold">
                    {alt.quantity} {alt.food.unit}
                  </td>
                  <td className="py-4 px-6 text-orange-500 font-medium">
                    {alt.calories} kcal
                  </td>
                  <td className="py-4 px-6 text-rose-500">
                    {alt.protein}g
                  </td>
                  <td className="py-4 px-6 text-amber-600">
                    {alt.carbs}g
                  </td>
                  <td className="py-4 px-6 text-sky-500">
                    {alt.fat}g
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-500 font-medium">
                    {alt.food.step ? `${alt.food.step}${alt.food.unit}` : '10g'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
