import React from 'react';
import { GameTab, WalletState } from '../types';
import { Volume2, VolumeX, ShieldAlert, Sparkles, Coins } from 'lucide-react';
import { sound } from '../utils/sound';

interface HeaderProps {
  currentTab: GameTab;
  onSelectTab: (tab: GameTab) => void;
  wallet: WalletState;
  onOpenCashier: () => void;
  onOpenBonus: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  wallet,
  onOpenCashier,
  onOpenBonus,
  muted,
  onToggleMute
}) => {
  const navItems: { id: GameTab; label: string }[] = [
    { id: 'lobby', label: '大厅 Lobby' },
    { id: 'lottery', label: '大马马票 4D' },
    { id: 'slots', label: '老虎机 Slots' },
    { id: 'baccarat', label: '百家乐 Baccarat' },
    { id: 'blackjack', label: '21点 Blackjack' },
    { id: 'poker', label: '炸金花 Poker' },
    { id: 'cashier', label: '账房结算 Cashier' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-500/20 bg-neutral-950/95 backdrop-blur-md px-4 sm:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Brand title wordmark, single text element */}
        <button
          onClick={() => onSelectTab('lobby')}
          className="font-cinzel text-xl sm:text-2xl font-bold tracking-wider text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 text-left focus-visible:outline-none"
        >
          Grand Vegas VIP
        </button>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navItems.map((item) => {
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sound.playChip();
                  onSelectTab(item.id);
                }}
                className={`transition-colors whitespace-nowrap py-1 cursor-pointer relative ${
                  active
                    ? 'text-amber-400 font-semibold'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Wallet chip count & 1-2 primary actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Daily Gift Claim Button */}
          <button
            onClick={() => {
              sound.playChip();
              onOpenBonus();
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/60 border border-amber-600/40 rounded-lg hover:bg-amber-900/50 hover:border-amber-500 transition-all cursor-pointer whitespace-nowrap"
            title="领取每日免费马币 (RM)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>每日礼金</span>
          </button>

          {/* Virtual Balance Chip Indicator */}
          <div
            onClick={onOpenCashier}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-amber-500/30 rounded-lg shadow-inner cursor-pointer hover:border-amber-400/60 transition-colors"
            title="点击打开虚拟账房"
          >
            <Coins className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex flex-col text-right leading-none">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">马币余额 (RM)</span>
              <span className="font-mono-nums font-bold text-amber-300 text-sm sm:text-base">
                RM {wallet.balance.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Primary Action: Cashier / Settlement */}
          <button
            onClick={() => {
              sound.playChip();
              onOpenCashier();
            }}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-neutral-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-lg shadow-md hover:from-amber-300 hover:to-amber-400 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            账房结算
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            className="p-2 text-neutral-400 hover:text-white bg-neutral-900/80 border border-neutral-800 rounded-lg transition-colors cursor-pointer"
            aria-label={muted ? 'Unmute sound' : 'Mute sound'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex md:hidden items-center justify-between gap-1 overflow-x-auto no-scrollbar pt-2.5 mt-2 border-t border-neutral-800/80">
        {navItems.map((item) => {
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                sound.playChip();
                onSelectTab(item.id);
              }}
              className={`text-xs px-2.5 py-1 rounded whitespace-nowrap cursor-pointer transition-colors ${
                active
                  ? 'bg-amber-500/20 text-amber-300 font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {item.label.split(' ')[0]}
            </button>
          );
        })}
      </div>
    </header>
  );
};
