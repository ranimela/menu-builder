import React from 'react';
import type { TargetRatios } from '../types/food';
import { DecimalInput } from './ui/DecimalInput';
import { Beef } from 'lucide-react';

interface TargetConfigPanelProps {
  weight: number;
  setWeight: (val: number) => void;
  ratios: TargetRatios;
  onRatioChange: (key: keyof TargetRatios, val: number) => void;
}

export const TargetConfigPanel: React.FC<TargetConfigPanelProps> = ({
  weight,
  setWeight,
  ratios,
  onRatioChange
}) => {
  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-brand-border pb-4">
        <h2 className="text-lg font-bold text-brand-primary">Set Targets & Weight</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Weight */}
        <div className="bg-brand-bg/60 p-4 rounded-xl border border-brand-border flex flex-col justify-between">
          <div className="text-brand-primary text-sm font-semibold mb-2 flex items-center gap-2">
            <Beef className="h-4 w-4 text-brand-secondary" /> Body Weight
          </div>
          <div className="flex items-end gap-1">
            <DecimalInput
              value={weight}
              onChange={setWeight}
              className="w-full bg-brand-card border border-brand-border focus:border-brand-accent text-lg font-bold px-2 py-1 rounded-lg text-brand-primary outline-none"
            />
            <span className="text-xs text-slate-500 pb-2">kg</span>
          </div>
        </div>

        {/* Protein Ratio */}
        <div className="bg-brand-bg/60 p-4 rounded-xl border border-brand-border flex flex-col justify-between">
          <div className="text-rose-500 text-sm font-semibold mb-2">Protein (g/kg)</div>
          <div className="flex items-end gap-1">
            <DecimalInput
              value={ratios.proteinPerKg}
              onChange={(val) => onRatioChange('proteinPerKg', val)}
              className="w-full bg-brand-card border border-brand-border focus:border-brand-accent text-lg font-bold px-2 py-1 rounded-lg text-brand-primary outline-none"
            />
            <span className="text-xs text-slate-500 pb-2">g/kg</span>
          </div>
        </div>

        {/* Carbs Ratio */}
        <div className="bg-brand-bg/60 p-4 rounded-xl border border-brand-border flex flex-col justify-between">
          <div className="text-amber-500 text-sm font-semibold mb-2">Carbs (g/kg)</div>
          <div className="flex items-end gap-1">
            <DecimalInput
              value={ratios.carbsPerKg}
              onChange={(val) => onRatioChange('carbsPerKg', val)}
              className="w-full bg-brand-card border border-brand-border focus:border-brand-accent text-lg font-bold px-2 py-1 rounded-lg text-brand-primary outline-none"
            />
            <span className="text-xs text-slate-500 pb-2">g/kg</span>
          </div>
        </div>

        {/* Fat Ratio */}
        <div className="bg-brand-bg/60 p-4 rounded-xl border border-brand-border flex flex-col justify-between">
          <div className="text-sky-500 text-sm font-semibold mb-2">Fat (g/kg)</div>
          <div className="flex items-end gap-1">
            <DecimalInput
              value={ratios.fatPerKg}
              onChange={(val) => onRatioChange('fatPerKg', val)}
              className="w-full bg-brand-card border border-brand-border focus:border-brand-accent text-lg font-bold px-2 py-1 rounded-lg text-brand-primary outline-none"
            />
            <span className="text-xs text-slate-500 pb-2">g/kg</span>
          </div>
        </div>
      </div>
    </div>
  );
};
