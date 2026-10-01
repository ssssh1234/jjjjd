import React, { useState, useEffect, useRef } from 'react';
import { WalletState } from '../../types';
import { sound } from '../../utils/sound';
import { Chip, CHIP_DENOMINATIONS, ChipValue } from '../Chip';
import { Sparkles, Zap, RotateCcw, Award, Volume2, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SlotMachineProps {
  wallet: WalletState;
  onUpdateWallet: (updater: (prev: WalletState) => WalletState) => void;
  onRecordGameWin: (game: string, bet: number, win: number) => void;
}

interface SymbolDef {
  id: string;
  icon: string;
  name: string;
  color: string;
  payout3: number; // 3 of a kind multiplier
}

const SYMBOLS: SymbolDef[] = [
  { id: 'diamond', icon: '💎', name: '狂野钻石', color: 'text-cyan-400', payout3: 100 },
  { id: 'seven', icon: '7️⃣', name: '幸运大7', color: 'text-red-500', payout3: 50 },
  { id: 'coin', icon: '🪙', name: '免费金币', color: 'text-amber-400', payout3: 30 },
  { id: 'bell', icon: '🔔', name: '金玲珑', color: 'text-yellow-400', payout3: 20 },
  { id: 'watermelon', icon: '🍉', name: '西瓜', color: 'text-emerald-400', payout3: 12 },
  { id: 'grapes', icon: '🍇', name: '葡萄', color: 'text-purple-400', payout3: 8 },
  { id: 'cherry', icon: '🍒', name: '樱桃', color: 'text-rose-400', payout3: 5 },
];

const PAYLINES = [
  { id: 1, name: '中横线', coords: [[1, 0], [1, 1], [1, 2]], color: 'border-amber-400' },
  { id: 2, name: '上横线', coords: [[0, 0], [0, 1], [0, 2]], color: 'border-blue-400' },
  { id: 3, name: '下横线', coords: [[2, 0], [2, 1], [2, 2]], color: 'border-emerald-400' },
  { id: 4, name: '主对角线', coords: [[0, 0], [1, 1], [2, 2]], color: 'border-purple-400' },
  { id: 5, name: '副对角线', coords: [[2, 0], [1, 1], [0, 2]], color: 'border-rose-400' },
];

export const SlotMachine: React.FC<SlotMachineProps> = ({
  wallet,
  onUpdateWallet,
  onRecordGameWin
}) => {
  // Grid: 3 rows x 3 columns
  const [grid, setGrid] = useState<string[][]>([
    ['seven', 'bell', 'cherry'],
    ['diamond', 'seven', 'coin'],
    ['grapes', 'watermelon', 'seven'],
  ]);

  const [chipBet, setChipBet] = useState<ChipValue>(100);
  const [activeLines, setActiveLines] = useState<number>(5);
  const totalBet = chipBet * activeLines;

  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [reelSpinning, setReelSpinning] = useState<boolean[]>([false, false, false]);
  const [winAmount, setWinAmount] = useState<number>(0);
  const [winningLines, setWinningLines] = useState<number[]>([]);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState<number>(0);
  const [autoSpinsLeft, setAutoSpinsLeft] = useState<number>(0);
  const [turbo, setTurbo] = useState<boolean>(false);
  const [lastWinType, setLastWinType] = useState<string | null>(null);

  const autoSpinRef = useRef<number>(0);
  autoSpinRef.current = autoSpinsLeft;

  const getRandomSymbol = () => {
    // Weighted random
    const weights = [4, 7, 10, 14, 18, 22, 25]; // diamond rarest, cherry most common
    const sum = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * sum;
    for (let i = 0; i < weights.length; i++) {
      if (rand < weights[i]) return SYMBOLS[i].id;
      rand -= weights[i];
    }
    return SYMBOLS[SYMBOLS.length - 1].id;
  };

  const spin = () => {
    if (isSpinning) return;
    const isFree = freeSpinsLeft > 0;

    if (!isFree && wallet.balance < totalBet) {
      sound.playLoss();
      alert('您的马币 (RM) 余额不足以进行本次下注，请前往账房充值！');
      setAutoSpinsLeft(0);
      return;
    }

    // Deduct bet if not free spin
    if (!isFree) {
      onUpdateWallet(prev => ({
        ...prev,
        balance: prev.balance - totalBet,
        totalWagered: prev.totalWagered + totalBet
      }));
    } else {
      setFreeSpinsLeft(prev => prev - 1);
    }

    sound.playChip();
    setIsSpinning(true);
    setWinningLines([]);
    setWinAmount(0);
    setLastWinType(null);
    setReelSpinning([true, true, true]);

    // Fast tick interval for sound
    const tickInterval = setInterval(() => {
      sound.playSpinTick();
    }, turbo ? 80 : 120);

    const baseDelay = turbo ? 300 : 700;
    const reelStops = [baseDelay, baseDelay + (turbo ? 200 : 400), baseDelay + (turbo ? 400 : 800)];

    // Target final grid
    const finalGrid = [
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
    ];

    // Progressive stop
    reelStops.forEach((stopTime, reelIdx) => {
      setTimeout(() => {
        setReelSpinning(prev => {
          const next = [...prev];
          next[reelIdx] = false;
          return next;
        });

        // Update column in grid
        setGrid(currentGrid => {
          const next = currentGrid.map(row => [...row]);
          for (let r = 0; r < 3; r++) {
            next[r][reelIdx] = finalGrid[r][reelIdx];
          }
          return next;
        });
      }, stopTime);
    });

    // All stopped, evaluate win
    setTimeout(() => {
      clearInterval(tickInterval);
      evaluateResults(finalGrid, isFree);
      setIsSpinning(false);
    }, reelStops[2] + 50);
  };

  const evaluateResults = (g: string[][], isFree: boolean) => {
    let totalWin = 0;
    const hitLines: number[] = [];
    const multiplierBonus = isFree ? 3 : 1;

    // Check lines up to activeLines count
    for (let i = 0; i < activeLines; i++) {
      const line = PAYLINES[i];
      const s0 = g[line.coords[0][0]][line.coords[0][1]];
      const s1 = g[line.coords[1][0]][line.coords[1][1]];
      const s2 = g[line.coords[2][0]][line.coords[2][1]];

      // Check wild diamond logic
      const targetSym = s0 !== 'diamond' ? s0 : (s1 !== 'diamond' ? s1 : s2);
      const isMatch = (s0 === targetSym || s0 === 'diamond') &&
                      (s1 === targetSym || s1 === 'diamond') &&
                      (s2 === targetSym || s2 === 'diamond');

      if (isMatch) {
        const symDef = SYMBOLS.find(s => s.id === targetSym) || SYMBOLS[SYMBOLS.length - 1];
        const lineWin = chipBet * symDef.payout3 * multiplierBonus;
        totalWin += lineWin;
        hitLines.push(line.id);
      } else if (s0 === 'cherry' || s1 === 'cherry' || s2 === 'cherry') {
        // Cherry consolation
        const cherryCount = [s0, s1, s2].filter(s => s === 'cherry').length;
        if (cherryCount >= 2) {
          totalWin += chipBet * 2 * multiplierBonus;
          hitLines.push(line.id);
        }
      }
    }

    // Check Scatter Coin for Free Spins (count anywhere on grid)
    let coinCount = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (g[r][c] === 'coin') coinCount++;
      }
    }

    let triggerFreeSpins = false;
    if (coinCount >= 3) {
      triggerFreeSpins = true;
      setFreeSpinsLeft(prev => prev + 10);
      setLastWinType('🎉 触发 10 次 3倍 免费旋转！');
    }

    if (totalWin > 0) {
      setWinAmount(totalWin);
      setWinningLines(hitLines);

      // Record win to wallet
      onUpdateWallet(prev => ({
        ...prev,
        balance: prev.balance + totalWin,
        totalWon: prev.totalWon + totalWin
      }));
      onRecordGameWin('777狂野老虎机', totalBet, totalWin);

      if (totalWin >= totalBet * 20 || triggerFreeSpins) {
        sound.playJackpot();
        setLastWinType('💥 MEGA JACKPOT 巨奖！');
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 }
        });
      } else {
        sound.playWin();
        if (!triggerFreeSpins) setLastWinType('✨ 获胜中奖！');
      }
    } else {
      sound.playLoss();
    }

    // Check auto spin continuation
    if (autoSpinRef.current > 0) {
      setAutoSpinsLeft(prev => prev - 1);
      setTimeout(() => {
        spin();
      }, turbo ? 400 : 900);
    }
  };

  const getSymbolObj = (id: string) => {
    return SYMBOLS.find(s => s.id === id) || SYMBOLS[0];
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Slot Header Bar */}
      <div className="casino-wood-rim rounded-2xl p-4 sm:p-6 text-center relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="font-cinzel text-xl sm:text-2xl font-black text-amber-300 tracking-wide flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>777 狂野聚宝盆 · 经典老虎机</span>
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              3-Reel 5-Paylines · 狂野百搭钻石 · 最高 100x 爆机倍率
            </p>
          </div>

          {/* Free Spins Banner */}
          {freeSpinsLeft > 0 && (
            <div className="px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 text-white rounded-xl font-bold text-xs sm:text-sm animate-pulse flex items-center gap-2 shadow-lg">
              <Sparkles className="w-4 h-4 fill-white" />
              <span>免费旋转激活中：剩余 {freeSpinsLeft} 次 (3倍奖池)</span>
            </div>
          )}

          {/* Quick Paytable preview button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTurbo(!turbo)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                turbo
                  ? 'bg-amber-400 text-neutral-950 border-amber-300'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>极速模式 {turbo ? '开启' : '关闭'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Machine Cabinet */}
      <div className="relative bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-900 border-2 border-amber-500/40 rounded-3xl p-4 sm:p-8 shadow-2xl overflow-hidden">
        {/* Ambient Top Light */}
        <div className="absolute top-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent blur-xs" />

        {/* Win / Status Screen */}
        <div className="mb-6 p-4 rounded-2xl bg-neutral-950 border border-amber-500/30 shadow-inner flex flex-wrap items-center justify-between gap-3 text-center">
          <div className="flex-1 text-left">
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">当前单注 / 线数</span>
            <span className="font-mono-nums font-bold text-neutral-200 text-sm">
              RM {chipBet} × {activeLines} 线 = <span className="text-amber-400">RM {totalBet}</span>
            </span>
          </div>

          <div className="flex-1 text-center">
            {lastWinType ? (
              <span className="font-cinzel font-bold text-amber-300 text-sm sm:text-base animate-bounce block">
                {lastWinType}
              </span>
            ) : (
              <span className="text-xs text-neutral-500 block">点击旋转开启幸运回合</span>
            )}
          </div>

          <div className="flex-1 text-right">
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">本轮结算赢赏</span>
            <span className="font-mono-nums font-black text-emerald-400 text-lg sm:text-xl">
              +RM {winAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 3-Reel Visual Display */}
        <div className="relative bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 border-4 border-amber-600/50 rounded-2xl p-4 sm:p-6 shadow-2xl mb-6">
          {/* Glass glare effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none rounded-2xl" />

          {/* 3 Column Grid */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 relative">
            {[0, 1, 2].map(colIdx => (
              <div
                key={colIdx}
                className={`relative bg-neutral-950/80 border-2 border-neutral-800 rounded-xl p-2 sm:p-3 flex flex-col justify-around min-h-[220px] sm:min-h-[280px] overflow-hidden ${
                  reelSpinning[colIdx] ? 'blur-xs scale-98 transition-transform' : ''
                }`}
              >
                {[0, 1, 2].map(rowIdx => {
                  const symId = grid[rowIdx][colIdx];
                  const sym = getSymbolObj(symId);
                  return (
                    <div
                      key={rowIdx}
                      className="flex items-center justify-center p-2 rounded-lg bg-neutral-900/50 border border-neutral-800/80 shadow-sm relative group transition-all"
                    >
                      <span className="text-3xl sm:text-5xl select-none filter drop-shadow">
                        {sym.icon}
                      </span>
                      <span className="absolute bottom-1 text-[9px] font-sans font-medium text-neutral-500 hidden sm:block">
                        {sym.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Payline indicators badges */}
          <div className="mt-4 pt-3 border-t border-neutral-800 flex flex-wrap items-center justify-center gap-2">
            {PAYLINES.map(line => {
              const active = line.id <= activeLines;
              const isHit = winningLines.includes(line.id);
              return (
                <button
                  key={line.id}
                  onClick={() => {
                    if (!isSpinning) setActiveLines(line.id);
                  }}
                  className={`px-2.5 py-1 text-[11px] rounded font-medium transition-all cursor-pointer ${
                    isHit
                      ? 'bg-amber-400 text-neutral-950 font-bold ring-2 ring-amber-300 animate-pulse'
                      : active
                      ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                      : 'bg-neutral-900/40 text-neutral-600 border border-neutral-800'
                  }`}
                >
                  {line.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Betting Controls & Spin Dashboard */}
        <div className="space-y-4">
          {/* Chip Selection Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-900/70 border border-neutral-800 rounded-xl">
            <div className="text-xs text-neutral-300 font-semibold">
              选择下注面额 (RM)：
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {CHIP_DENOMINATIONS.slice(0, 5).map(val => (
                <Chip
                  key={val}
                  value={val}
                  selected={chipBet === val}
                  onClick={() => {
                    sound.playChip();
                    setChipBet(val);
                  }}
                  disabled={isSpinning}
                />
              ))}
            </div>
          </div>

          {/* Spin Buttons Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Auto Spin selector */}
            <div className="flex gap-1.5">
              {[10, 25].map(count => (
                <button
                  key={count}
                  onClick={() => {
                    sound.playChip();
                    if (autoSpinsLeft > 0) {
                      setAutoSpinsLeft(0);
                    } else {
                      setAutoSpinsLeft(count);
                      spin();
                    }
                  }}
                  disabled={isSpinning && autoSpinsLeft === 0}
                  className={`flex-1 py-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    autoSpinsLeft > 0
                      ? 'bg-red-500/20 text-red-400 border-red-500 animate-pulse'
                      : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-neutral-600'
                  }`}
                >
                  {autoSpinsLeft > 0 ? `停止自动 (${autoSpinsLeft})` : `自动 ${count} 次`}
                </button>
              ))}
            </div>

            {/* Max Bet Button */}
            <button
              onClick={() => {
                sound.playChip();
                setChipBet(1000);
                setActiveLines(5);
              }}
              disabled={isSpinning}
              className="py-3 px-4 bg-neutral-900 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold hover:bg-amber-500/10 transition-all cursor-pointer"
            >
              一键满线满注
            </button>

            {/* Big Primary Spin Lever Button */}
            <button
              onClick={spin}
              disabled={isSpinning}
              className="sm:col-span-2 py-4 px-6 text-base font-black text-neutral-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-xl shadow-xl hover:from-amber-300 hover:to-amber-400 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 fill-neutral-950" />
              <span>{isSpinning ? '旋转摇奖中...' : `立即拉杆旋转 (RM ${totalBet})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Paytable Chart */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5">
        <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-3">
          中奖赔率说明表 (3 连线触发)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
          {SYMBOLS.map(sym => (
            <div key={sym.id} className="p-2.5 bg-neutral-900/60 rounded-lg border border-neutral-800">
              <span className="text-2xl block mb-1">{sym.icon}</span>
              <span className="font-semibold text-neutral-200 block text-[11px]">{sym.name}</span>
              <span className="font-mono font-bold text-amber-400">{sym.payout3}x</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
