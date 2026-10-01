import React from 'react';

export const CHIP_DENOMINATIONS = [10, 50, 100, 500, 1000, 5000, 25000] as const;
export type ChipValue = typeof CHIP_DENOMINATIONS[number];

interface ChipProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  value,
  size = 'md',
  selected = false,
  onClick,
  className = '',
  disabled = false
}) => {
  const getColors = (v: number) => {
    if (v >= 25000) return 'from-amber-400 via-yellow-200 to-amber-600 text-neutral-950 border-amber-300';
    if (v >= 5000) return 'from-purple-800 via-purple-700 to-purple-950 text-white border-purple-400';
    if (v >= 1000) return 'from-neutral-900 via-neutral-800 to-black text-amber-300 border-amber-500/60';
    if (v >= 500) return 'from-emerald-700 via-emerald-600 to-emerald-900 text-white border-emerald-400';
    if (v >= 100) return 'from-red-700 via-red-600 to-red-900 text-white border-red-400';
    if (v >= 50) return 'from-blue-700 via-blue-600 to-blue-900 text-white border-blue-400';
    return 'from-slate-200 via-white to-slate-300 text-slate-900 border-slate-400';
  };

  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-10 h-10 sm:w-11 sm:h-11 text-xs',
    lg: 'w-13 h-13 text-sm'
  }[size];

  const formatChipLabel = (v: number) => {
    if (v >= 10000) return `${v / 1000}k`;
    if (v >= 1000) return `${v / 1000}k`;
    return v.toString();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClasses}
        rounded-full relative p-0.5 font-bold font-mono tracking-tight
        bg-gradient-to-br ${getColors(value)}
        border-2 shadow-lg
        flex items-center justify-center cursor-pointer select-none
        transition-all duration-150 transform
        ${selected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-neutral-950 scale-110 -translate-y-1' : 'hover:scale-105 active:scale-95'}
        ${disabled ? 'opacity-40 cursor-not-allowed filter grayscale' : ''}
        ${className}
      `}
      aria-label={`Chip ${value}`}
    >
      {/* Outer Dotted Edge Accent */}
      <div className="w-full h-full rounded-full border border-dashed border-white/40 flex items-center justify-center p-0.5">
        <div className="w-full h-full rounded-full bg-black/20 flex items-center justify-center shadow-inner">
          <span className="drop-shadow-sm font-extrabold">{formatChipLabel(value)}</span>
        </div>
      </div>
    </button>
  );
};
