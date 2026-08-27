import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface DecimalInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  min?: number;
  max?: number;
}

export const DecimalInput: React.FC<DecimalInputProps> = ({ 
  value, 
  onChange, 
  className,
  min = 0,
  max = Infinity
}) => {
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  const [localValue, setLocalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const displayValue = isFocused ? localValue : safeValue.toFixed(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setLocalValue(valStr);
    
    if (valStr.trim() === '') {
      return; // Allow empty input temporarily during typing
    }
    
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange(clamped);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setLocalValue(safeValue.toFixed(1));
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFloat(localValue);
    if (isNaN(parsed)) {
      setLocalValue(safeValue.toFixed(1));
    } else {
      const clamped = Math.max(min, Math.min(max, parsed));
      const rounded = Math.round(clamped * 10) / 10;
      setLocalValue(rounded.toFixed(1));
      if (rounded !== value) {
        onChange(rounded);
      }
    }
  };

  const handleIncrement = () => {
    const newVal = Math.max(min, Math.min(max, Math.round((safeValue + 0.1) * 10) / 10));
    onChange(newVal);
    if (isFocused) {
      setLocalValue(newVal.toFixed(1));
    }
  };

  const handleDecrement = () => {
    const newVal = Math.max(min, Math.min(max, Math.round((safeValue - 0.1) * 10) / 10));
    onChange(newVal);
    if (isFocused) {
      setLocalValue(newVal.toFixed(1));
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`${className} pr-8`}
      />
      <div className="absolute right-1.5 flex flex-col justify-center h-full">
        <button
          type="button"
          tabIndex={-1}
          onClick={handleIncrement}
          className="p-0.5 text-slate-400 hover:text-brand-accent transition cursor-pointer leading-none"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          onClick={handleDecrement}
          className="p-0.5 text-slate-400 hover:text-brand-accent transition cursor-pointer leading-none"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};
