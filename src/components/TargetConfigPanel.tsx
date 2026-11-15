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
    <section className="bg-brand-card border border-brand-border rounded-2xl px-4 py-3 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-brand-primary shrink-0">
          <Beef className="h-4 w-4 text-brand-secondary" />
          <span>Targets &amp; Weight</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 lg:max-w-3xl">
          {/* Weight */}
          <div className="bg-brand-bg/70 px-3 py-2 rounded-xl border border-brand-border flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-brand-primary shrink-0">Weight</span>
            <div className="flex items-center gap-1 min-w-0 w-24">
              <DecimalInput
                value={weight}
                onChange={setWeight}
                className="w-full bg-brand-card border border-brand-border focus:border-brand-accent text-sm font-bold px-2 py-1 rounded-lg text-brand-primary outline-none"
              />
              <span className="text-[11px] text-slate-500 shrink-0">kg</span>
            </div>
          </div>

          {/* Protein Ratio */}
          <div className="bg-brand-bg/70 px-3 py-2 rounded-xl border border-brand-border flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-rose-500 shrink-0">Protein</span>
            <div className="flex items-center gap-1 min-w-0 w-24">
              <DecimalInput
                value={ratios.proteinPerKg}
                onChange={(val) => onRatioChange('proteinPerKg', val)}
                className="w-full bg-brand-card border border-brand-border focus:border-brand-accent text-sm font-bold px-2 py-1 rounded-lg text-brand-primary outline-none"
              />
              <span className="text-[11px] text-slate-500 shrink-0">g/kg</span>
            </div>
          </div>

          {/* Carbs Ratio */}
          <div className="bg-brand-bg/70 px-3 py-2 rounded-xl border border-brand-border flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-amber-600 shrink-0">Carbs</span>
            <div className="flex items-center gap-1 min-w-0 w-24">
              <DecimalInput
                value={ratios.carbsPerKg}
                onChange={(val) => onRatioChange('carbsPerKg', val)}
                className="w-full bg-brand-card border border-brand-border focus:border-brand-accent text-sm font-bold px-2 py-1 rounded-lg text-brand-primary outline-none"
              />
              <span className="text-[11px] text-slate-500 shrink-0">g/kg</span>
            </div>
          </div>

          {/* Fat Ratio */}
          <div className="bg-brand-bg/70 px-3 py-2 rounded-xl border border-brand-border flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-sky-500 shrink-0">Fat</span>
            <div className="flex items-center gap-1 min-w-0 w-24">
              <DecimalInput
                value={ratios.fatPerKg}
                onChange={(val) => onRatioChange('fatPerKg', val)}
                className="w-full bg-brand-card border border-brand-border focus:border-brand-accent text-sm font-bold px-2 py-1 rounded-lg text-brand-primary outline-none"
              />
              <span className="text-[11px] text-slate-500 shrink-0">g/kg</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
