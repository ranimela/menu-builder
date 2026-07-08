import React from 'react';
import type { FoodItem } from '../types/food';
import { X, Trash2 } from 'lucide-react';

interface ManageCustomFoodsModalProps {
  onClose: () => void;
  customFoods: FoodItem[];
  onRemove: (id: string) => void;
}

export const ManageCustomFoodsModal: React.FC<ManageCustomFoodsModalProps> = ({
  onClose,
  customFoods,
  onRemove
}) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-brand-card border border-brand-border rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="px-6 py-4 border-b border-brand-border flex justify-between items-center bg-brand-bg/50">
          <h3 className="font-bold text-brand-primary text-base">Manage Custom Foods</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg transition text-slate-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {customFoods.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No custom food items created yet. Add one from the main menu.
            </div>
          ) : (
            <div className="divide-y divide-brand-border border border-brand-border rounded-xl overflow-hidden">
              {customFoods.map((food) => (
                <div key={food.id} className="p-4 flex justify-between items-center hover:bg-brand-bg/30 transition">
                  <div>
                    <h4 className="font-semibold text-brand-primary text-sm">{food.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Per {food.servingSize}{food.unit} • {food.calories} kcal • {food.protein}g P • {food.carbs}g C • {food.fat}g F
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to remove "${food.name}"?`)) {
                        onRemove(food.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-brand-accent hover:bg-brand-accent/5 rounded-lg transition cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-brand-border bg-brand-bg/50 flex justify-end">
          <button
            onClick={onClose}
            className="bg-brand-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-brand-primary/95 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
