import React from 'react';
import { PlayingCard } from '../types';
import { getCardLabel, getCardSuitIcon, isCardRed } from '../utils/deck';

interface CardViewProps {
  card: PlayingCard;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CardView: React.FC<CardViewProps> = ({ card, className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-12 h-18 text-xs rounded-md',
    md: 'w-16 h-24 sm:w-20 sm:h-28 text-sm sm:text-base rounded-lg',
    lg: 'w-24 h-36 sm:w-28 sm:h-40 text-base sm:text-lg rounded-xl'
  }[size];

  if (card.hidden) {
    return (
      <div
        className={`${sizeClasses} bg-neutral-900 border-2 border-amber-600/60 shadow-xl flex items-center justify-center relative overflow-hidden select-none transition-transform hover:-translate-y-1 ${className}`}
      >
        {/* Intricate Card Back Pattern */}
        <div className="absolute inset-1 rounded border border-amber-500/30 bg-gradient-to-br from-red-950 via-neutral-950 to-red-950 flex items-center justify-center p-1">
          <div className="w-full h-full border border-amber-500/20 rounded flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#e5c07b_1px,transparent_1px)] [background-size:6px_6px]" />
            <div className="text-amber-500/80 font-cinzel font-bold text-xs tracking-widest uppercase rotate-45 select-none">
              VIP
            </div>
          </div>
        </div>
      </div>
    );
  }

  const red = isCardRed(card.suit);
  const label = getCardLabel(card.value);
  const suitIcon = getCardSuitIcon(card.suit);

  return (
    <div
      className={`${sizeClasses} bg-gradient-to-b from-stone-50 via-white to-stone-100 text-neutral-950 border border-neutral-300 shadow-2xl flex flex-col justify-between p-1.5 sm:p-2 select-none font-sans font-semibold relative transition-all duration-200 hover:-translate-y-1.5 ${className}`}
    >
      {/* Top Left Rank & Suit */}
      <div className={`flex flex-col items-center leading-none ${red ? 'text-red-600' : 'text-neutral-900'}`}>
        <span className="font-bold tracking-tight">{label}</span>
        <span className="text-xs sm:text-sm mt-0.5">{suitIcon}</span>
      </div>

      {/* Center Big Embossed Suit */}
      <div className={`self-center text-xl sm:text-3xl ${red ? 'text-red-600/90' : 'text-neutral-900/90'} drop-shadow-sm`}>
        {suitIcon}
      </div>

      {/* Bottom Right Inverted Rank & Suit */}
      <div className={`flex flex-col items-center leading-none rotate-180 ${red ? 'text-red-600' : 'text-neutral-900'}`}>
        <span className="font-bold tracking-tight">{label}</span>
        <span className="text-xs sm:text-sm mt-0.5">{suitIcon}</span>
      </div>
    </div>
  );
};
