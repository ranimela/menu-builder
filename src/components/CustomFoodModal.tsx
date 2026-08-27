import React, { useState } from 'react';
import type { FoodItem } from '../types/food';
import { X } from 'lucide-react';

interface CustomFoodModalProps {
  onClose: () => void;
  onSave: (food: FoodItem) => void;
}

export const CustomFoodModal: React.FC<CustomFoodModalProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('g');
  const [servingSize, setServingSize] = useState<number>(100);
  const [calories, setCalories] = useState<number>(0);
  const [protein, setProtein] = useState<number>(0);
  const [carbs, setCarbs] = useState<number>(0);
  const [fat, setFat] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Food name is required');
    if (!servingSize || isNaN(servingSize) || servingSize <= 0) return alert('Serving size must be greater than zero');

    const safeServingSize = typeof servingSize === 'number' && !isNaN(servingSize) && servingSize > 0 ? servingSize : 100;
    const safeCalories = typeof calories === 'number' && !isNaN(calories) ? Math.max(0, calories) : 0;
    const safeProtein = typeof protein === 'number' && !isNaN(protein) ? Math.max(0, protein) : 0;
    const safeCarbs = typeof carbs === 'number' && !isNaN(carbs) ? Math.max(0, carbs) : 0;
    const safeFat = typeof fat === 'number' && !isNaN(fat) ? Math.max(0, fat) : 0;

    const newFood: FoodItem = {
      id: `custom_${Date.now()}`,
      name: `${name.trim()} (Custom)`,
      calories: safeCalories,
      protein: safeProtein,
      carbs: safeCarbs,
      fat: safeFat,
      servingSize: safeServingSize,
      unit,
      defaultQuantity: safeServingSize,
      minQuantity: 0,
      maxQuantity: safeServingSize * 5,
      isFreeParameter: true,
      isMandatory: false,
      step: unit === 'g' || unit === 'ml' ? 10 : 1
    };

    onSave(newFood);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-brand-card border border-brand-border rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-brand-border flex justify-between items-center bg-brand-bg/50">
          <h3 className="font-bold text-brand-primary text-base">Add Custom Food Item</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg transition text-slate-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Food Name</label>
            <input
              type="text"
              required
              placeholder="e.g. My Protein Bar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:border-brand-accent text-brand-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Measurement Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:border-brand-accent text-brand-primary"
              >
                <option value="g">Grams (g)</option>
                <option value="pcs">Pieces (pcs)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="scoops">Scoops</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Serving Size</label>
              <input
                type="number"
                required
                min={1}
                value={servingSize}
                onChange={(e) => setServingSize(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full bg-brand-bg border border-brand-border text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:border-brand-accent text-brand-primary"
              />
            </div>
          </div>

          <div className="border-t border-brand-border pt-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Nutrients per Serving ({servingSize}{unit})</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Calories (kcal)</label>
                <input
                  type="number"
                  min={0}
                  value={calories}
                  onChange={(e) => setCalories(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-brand-bg border border-brand-border text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:border-brand-accent text-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Protein (g)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  value={protein}
                  onChange={(e) => setProtein(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-brand-bg border border-brand-border text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:border-brand-accent text-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Carbohydrates (g)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  value={carbs}
                  onChange={(e) => setCarbs(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-brand-bg border border-brand-border text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:border-brand-accent text-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Fat (g)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  value={fat}
                  onChange={(e) => setFat(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-brand-bg border border-brand-border text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:border-brand-accent text-brand-primary"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-brand-border pt-4 flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-brand-bg border border-brand-border text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-brand-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-brand-primary/95 transition"
            >
              Save Custom Food
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
