import React, { useState } from 'react';
import { WalletState, PlayingCard, BaccaratHistoryItem } from '../../types';
import { sound } from '../../utils/sound';
import { createDeck, calculateBaccaratHand, hasPair } from '../../utils/deck';
import { CardView } from '../CardView';
import { Chip, CHIP_DENOMINATIONS, ChipValue } from '../Chip';
import { Shield, Sparkles, RotateCcw, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BaccaratProps {
  wallet: WalletState;
  onUpdateWallet: (updater: (prev: WalletState) => WalletState) => void;
  onRecordGameWin: (game: string, bet: number, win: number) => void;
}

type BetTarget = 'player' | 'banker' | 'tie' | 'playerPair' | 'bankerPair' | 'super6';

export const Baccarat: React.FC<BaccaratProps> = ({
  wallet,
  onUpdateWallet,
  onRecordGameWin
}) => {
  const [selectedChip, setSelectedChip] = useState<ChipValue>(500);
  const [bets, setBets] = useState<Record<BetTarget, number>>({
    player: 0,
    banker: 0,
    tie: 0,
    playerPair: 0,
    bankerPair: 0,
    super6: 0
  });

  const totalBet = Object.values(bets).reduce((a, b) => a + b, 0);

  const [playerCards, setPlayerCards] = useState<PlayingCard[]>([]);
  const [bankerCards, setBankerCards] = useState<PlayingCard[]>([]);
  const [gamePhase, setGamePhase] = useState<'betting' | 'dealing' | 'settled'>('betting');
  const [statusMessage, setStatusMessage] = useState<string>('请在桌面上选择 RM 投注面额并下注');
  const [payoutResult, setPayoutResult] = useState<{ win: number; detail: string } | null>(null);

  // History for Bead Plate (珠盘路)
  const [history, setHistory] = useState<BaccaratHistoryItem[]>([
    { id: '1', winner: 'banker', playerScore: 5, bankerScore: 8, playerPair: false, bankerPair: false },
    { id: '2', winner: 'player', playerScore: 9, bankerScore: 4, playerPair: false, bankerPair: true },
    { id: '3', winner: 'banker', playerScore: 3, bankerScore: 7, playerPair: false, bankerPair: false },
    { id: '4', winner: 'banker', playerScore: 6, bankerScore: 9, playerPair: true, bankerPair: false },
    { id: '5', winner: 'tie', playerScore: 6, bankerScore: 6, playerPair: false, bankerPair: false },
    { id: '6', winner: 'player', playerScore: 8, bankerScore: 2, playerPair: false, bankerPair: false },
    { id: '7', winner: 'player', playerScore: 7, bankerScore: 5, playerPair: false, bankerPair: false },
    { id: '8', winner: 'banker', playerScore: 4, bankerScore: 6, playerPair: false, bankerPair: false },
  ]);

  const handlePlaceBet = (target: BetTarget) => {
    if (gamePhase !== 'betting') return;
    if (wallet.balance < totalBet + selectedChip) {
      sound.playLoss();
      alert('马币余额不足！请前往账房充值。');
      return;
    }

    sound.playChip();
    setBets(prev => ({
      ...prev,
      [target]: prev[target] + selectedChip
    }));
  };

  const handleClearBets = () => {
    if (gamePhase !== 'betting') return;
    sound.playChip();
    setBets({
      player: 0,
      banker: 0,
      tie: 0,
      playerPair: 0,
      bankerPair: 0,
      super6: 0
    });
  };

  // Start Deal & Standard Macau Baccarat Rules
  const handleDeal = () => {
    if (totalBet <= 0) {
      alert('请先在闲、庄、和或对子区域下注！');
      return;
    }
    if (wallet.balance < totalBet) {
      sound.playLoss();
      alert('可用马币不足！');
      return;
    }

    // Deduct total bet
    onUpdateWallet(prev => ({
      ...prev,
      balance: prev.balance - totalBet,
      totalWagered: prev.totalWagered + totalBet
    }));

    setGamePhase('dealing');
    setPayoutResult(null);
    setStatusMessage('澳门荷官发牌中...');
    sound.playCard();

    const shoe = createDeck(8); // 8-deck shoe
    const p1 = shoe[0];
    const b1 = shoe[1];
    const p2 = shoe[2];
    const b2 = shoe[3];

    setPlayerCards([p1, p2]);
    setBankerCards([b1, b2]);

    setTimeout(() => {
      sound.playCard();
      const pInitialScore = calculateBaccaratHand([p1, p2]);
      const bInitialScore = calculateBaccaratHand([b1, b2]);

      // Check Natural 8 or 9
      if (pInitialScore >= 8 || bInitialScore >= 8) {
        setStatusMessage(`天王例牌！闲家 ${pInitialScore} 点 vs 庄家 ${bInitialScore} 点`);
        finishRound([p1, p2], [b1, b2]);
        return;
      }

      // 3rd card rules
      let pFinal = [p1, p2];
      let bFinal = [b1, b2];
      let p3: PlayingCard | null = null;

      // Player 3rd card rule: draw on 0-5, stand on 6-7
      if (pInitialScore <= 5) {
        p3 = shoe[4];
        pFinal = [p1, p2, p3];
      }

      // Banker 3rd card rule
      if (!p3) {
        // Player stood
        if (bInitialScore <= 5) {
          bFinal = [b1, b2, shoe[5]];
        }
      } else {
        // Player drew p3
        const p3Val = p3.value >= 10 ? 0 : p3.value;
        let bankerDraws = false;
        if (bInitialScore <= 2) bankerDraws = true;
        else if (bInitialScore === 3 && p3Val !== 8) bankerDraws = true;
        else if (bInitialScore === 4 && [2, 3, 4, 5, 6, 7].includes(p3Val)) bankerDraws = true;
        else if (bInitialScore === 5 && [4, 5, 6, 7].includes(p3Val)) bankerDraws = true;
        else if (bInitialScore === 6 && [6, 7].includes(p3Val)) bankerDraws = true;

        if (bankerDraws) {
          bFinal = [b1, b2, shoe[5]];
        }
      }

      // Animate 3rd cards if any
      setTimeout(() => {
        setPlayerCards(pFinal);
        setBankerCards(bFinal);
        finishRound(pFinal, bFinal);
      }, 700);

    }, 800);
  };

  const finishRound = (pCards: PlayingCard[], bCards: PlayingCard[]) => {
    const pScore = calculateBaccaratHand(pCards);
    const bScore = calculateBaccaratHand(bCards);
    const isPlayerPair = hasPair(pCards.slice(0, 2));
    const isBankerPair = hasPair(bCards.slice(0, 2));

    let winner: 'player' | 'banker' | 'tie' = 'tie';
    if (pScore > bScore) winner = 'player';
    else if (bScore > pScore) winner = 'banker';

    // Calculate payouts
    let totalWin = 0;
    const details: string[] = [];

    // Player bet: 1:1
    if (bets.player > 0) {
      if (winner === 'player') {
        const win = bets.player * 2;
        totalWin += win;
        details.push(`闲赢 (+${win})`);
      } else if (winner === 'tie') {
        totalWin += bets.player; // Push on tie
        details.push(`和局退本 (+${bets.player})`);
      }
    }

    // Banker bet: 1:0.95 (5% commission)
    if (bets.banker > 0) {
      if (winner === 'banker') {
        const win = bets.banker + bets.banker * 0.95;
        totalWin += win;
        details.push(`庄赢 (+${Math.floor(win)})`);
      } else if (winner === 'tie') {
        totalWin += bets.banker;
        details.push(`和局退本 (+${bets.banker})`);
      }
    }

    // Tie bet: 8:1
    if (bets.tie > 0 && winner === 'tie') {
      const win = bets.tie * 9;
      totalWin += win;
      details.push(`击中和局 8倍 (+${win})`);
    }

    // Player Pair: 11:1
    if (bets.playerPair > 0 && isPlayerPair) {
      const win = bets.playerPair * 12;
      totalWin += win;
      details.push(`闲对子 11倍 (+${win})`);
    }

    // Banker Pair: 11:1
    if (bets.bankerPair > 0 && isBankerPair) {
      const win = bets.bankerPair * 12;
      totalWin += win;
      details.push(`庄对子 11倍 (+${win})`);
    }

    // Super 6: 12:1 if Banker wins with 6
    if (bets.super6 > 0 && winner === 'banker' && bScore === 6) {
      const win = bets.super6 * 13;
      totalWin += win;
      details.push(`超级6点 12倍 (+${win})`);
    }

    // Settle wallet
    if (totalWin > 0) {
      onUpdateWallet(prev => ({
        ...prev,
        balance: prev.balance + totalWin,
        totalWon: prev.totalWon + totalWin
      }));
      onRecordGameWin('皇家百家乐', totalBet, totalWin);

      if (totalWin >= totalBet * 3) {
        sound.playJackpot();
        confetti({ particleCount: 70, spread: 70 });
      } else {
        sound.playWin();
      }
    } else {
      sound.playLoss();
    }

    // Record history
    const historyItem: BaccaratHistoryItem = {
      id: Date.now().toString(),
      winner,
      playerScore: pScore,
      bankerScore: bScore,
      playerPair: isPlayerPair,
      bankerPair: isBankerPair
    };
    setHistory(prev => [historyItem, ...prev.slice(0, 24)]);

    const winnerName = winner === 'banker' ? '庄家胜' : (winner === 'player' ? '闲家胜' : '双方和局');
    setStatusMessage(`开牌结果：${winnerName}（闲 ${pScore} 点 vs 庄 ${bScore} 点）`);
    setPayoutResult({
      win: totalWin,
      detail: details.length > 0 ? details.join(' · ') : '未击中下注区域'
    });

    setGamePhase('settled');
  };

  const pScore = calculateBaccaratHand(playerCards);
  const bScore = calculateBaccaratHand(bankerCards);

  // Statistics for Road
  const stats = history.reduce((acc, h) => {
    if (h.winner === 'banker') acc.b++;
    else if (h.winner === 'player') acc.p++;
    else acc.t++;
    return acc;
  }, { b: 0, p: 0, t: 0 });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Table Rim Header */}
      <div className="casino-wood-rim rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-xl sm:text-2xl font-black text-amber-300 tracking-wide flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <span>皇家百家乐 · 澳门贵宾厅</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            标准 8 副牌洗牌靴 · 真实补牌规则 · 庄 5% 佣金
          </p>
        </div>

        {/* Status Message Display */}
        <div className="px-4 py-2 bg-neutral-950/80 border border-amber-500/30 rounded-xl text-xs sm:text-sm font-semibold text-amber-300">
          {statusMessage}
        </div>
      </div>

      {/* Main Luxury Green Felt Table */}
      <div className="relative casino-felt-baccarat border-4 border-amber-800/60 rounded-3xl p-5 sm:p-8 shadow-2xl overflow-hidden">
        {/* Card Hands Display Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Player (闲家) Zone */}
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-3">
              <span className="font-cinzel font-bold text-blue-400 text-lg sm:text-xl">
                PLAYER 闲家
              </span>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/40 rounded-lg font-mono-nums font-bold text-sm">
                点数: {playerCards.length > 0 ? pScore : '-'}
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-3 min-h-[120px]">
              {playerCards.length === 0 ? (
                <div className="text-xs text-blue-300/40 font-mono py-8">等待发牌...</div>
              ) : (
                playerCards.map((card, idx) => (
                  <CardView key={idx} card={card} size="md" />
                ))
              )}
            </div>
          </div>

          {/* Banker (庄家) Zone */}
          <div className="p-4 sm:p-5 rounded-2xl bg-red-950/40 border border-red-500/30 flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-3">
              <span className="font-cinzel font-bold text-red-400 text-lg sm:text-xl">
                BANKER 庄家
              </span>
              <span className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-400/40 rounded-lg font-mono-nums font-bold text-sm">
                点数: {bankerCards.length > 0 ? bScore : '-'}
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-3 min-h-[120px]">
              {bankerCards.length === 0 ? (
                <div className="text-xs text-red-300/40 font-mono py-8">等待发牌...</div>
              ) : (
                bankerCards.map((card, idx) => (
                  <CardView key={idx} card={card} size="md" />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Settlement Banner */}
        {payoutResult && (
          <div className="mb-6 p-4 rounded-xl bg-neutral-950/90 border border-amber-400/50 shadow-xl text-center space-y-1">
            <div className="text-xs text-neutral-400 font-mono">本局结算结算明细</div>
            <div className={`font-cinzel font-black text-xl ${payoutResult.win > 0 ? 'text-amber-400' : 'text-neutral-400'}`}>
              {payoutResult.win > 0 ? `+RM ${payoutResult.win.toLocaleString()}` : 'RM 0'}
            </div>
            <div className="text-xs text-neutral-300 font-semibold">{payoutResult.detail}</div>
          </div>
        )}

        {/* Macau Baccarat Betting Layout Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
          {/* 闲对 Player Pair */}
          <button
            type="button"
            onClick={() => handlePlaceBet('playerPair')}
            disabled={gamePhase === 'dealing'}
            className="p-3 rounded-xl bg-blue-950/60 border border-blue-500/40 text-center hover:bg-blue-900/60 transition-all cursor-pointer relative group"
          >
            <span className="text-xs font-bold text-blue-300 block">闲对子 (11:1)</span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">Player Pair</span>
            {bets.playerPair > 0 && (
              <span className="mt-2 inline-block px-2 py-0.5 bg-amber-400 text-neutral-950 font-mono-nums font-bold text-xs rounded-full">
                {bets.playerPair.toLocaleString()}
              </span>
            )}
          </button>

          {/* 闲 Player */}
          <button
            type="button"
            onClick={() => handlePlaceBet('player')}
            disabled={gamePhase === 'dealing'}
            className="sm:col-span-2 p-4 rounded-xl bg-blue-900/80 border-2 border-blue-400 text-center hover:bg-blue-800 transition-all cursor-pointer relative shadow-lg"
          >
            <span className="text-base font-black text-blue-100 block">闲 PLAYER (1:1)</span>
            <span className="text-xs text-blue-300/80 block mt-0.5">闲家赢 1 赔 1</span>
            {bets.player > 0 && (
              <span className="mt-2 inline-block px-3 py-1 bg-amber-400 text-neutral-950 font-mono-nums font-extrabold text-sm rounded-full shadow">
                {bets.player.toLocaleString()}
              </span>
            )}
          </button>

          {/* 庄 Banker */}
          <button
            type="button"
            onClick={() => handlePlaceBet('banker')}
            disabled={gamePhase === 'dealing'}
            className="sm:col-span-2 p-4 rounded-xl bg-red-900/80 border-2 border-red-400 text-center hover:bg-red-800 transition-all cursor-pointer relative shadow-lg"
          >
            <span className="text-base font-black text-red-100 block">庄 BANKER (1:0.95)</span>
            <span className="text-xs text-red-300/80 block mt-0.5">庄家赢 (扣 5% 佣金)</span>
            {bets.banker > 0 && (
              <span className="mt-2 inline-block px-3 py-1 bg-amber-400 text-neutral-950 font-mono-nums font-extrabold text-sm rounded-full shadow">
                {bets.banker.toLocaleString()}
              </span>
            )}
          </button>

          {/* 庄对 Banker Pair */}
          <button
            type="button"
            onClick={() => handlePlaceBet('bankerPair')}
            disabled={gamePhase === 'dealing'}
            className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-center hover:bg-red-900/60 transition-all cursor-pointer relative group"
          >
            <span className="text-xs font-bold text-red-300 block">庄对子 (11:1)</span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">Banker Pair</span>
            {bets.bankerPair > 0 && (
              <span className="mt-2 inline-block px-2 py-0.5 bg-amber-400 text-neutral-950 font-mono-nums font-bold text-xs rounded-full">
                {bets.bankerPair.toLocaleString()}
              </span>
            )}
          </button>

          {/* 和 Tie (Spanning bottom center) */}
          <button
            type="button"
            onClick={() => handlePlaceBet('tie')}
            disabled={gamePhase === 'dealing'}
            className="sm:col-span-3 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-center hover:bg-emerald-900/60 transition-all cursor-pointer"
          >
            <span className="text-sm font-black text-emerald-300 block">和局 TIE (8:1)</span>
            <span className="text-[10px] text-neutral-400 block">双方同点 1 赔 8</span>
            {bets.tie > 0 && (
              <span className="mt-1.5 inline-block px-2.5 py-0.5 bg-amber-400 text-neutral-950 font-mono-nums font-bold text-xs rounded-full">
                {bets.tie.toLocaleString()}
              </span>
            )}
          </button>

          {/* 超级6点 Super 6 */}
          <button
            type="button"
            onClick={() => handlePlaceBet('super6')}
            disabled={gamePhase === 'dealing'}
            className="sm:col-span-3 p-3 rounded-xl bg-purple-950/70 border border-purple-500/40 text-center hover:bg-purple-900/60 transition-all cursor-pointer"
          >
            <span className="text-sm font-black text-purple-300 block">超级6点 SUPER 6 (12:1)</span>
            <span className="text-[10px] text-neutral-400 block">庄以 6 点胜出 1 赔 12</span>
            {bets.super6 > 0 && (
              <span className="mt-1.5 inline-block px-2.5 py-0.5 bg-amber-400 text-neutral-950 font-mono-nums font-bold text-xs rounded-full">
                {bets.super6.toLocaleString()}
              </span>
            )}
          </button>
        </div>

        {/* Chip Bar & Deal Controls */}
        <div className="space-y-4 pt-2">
          {/* Chip Selection */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-950/70 rounded-xl border border-neutral-800">
            <span className="text-xs font-semibold text-neutral-300">
              选择下注面额 (RM)：
            </span>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {CHIP_DENOMINATIONS.map(val => (
                <Chip
                  key={val}
                  value={val}
                  selected={selectedChip === val}
                  onClick={() => {
                    sound.playChip();
                    setSelectedChip(val);
                  }}
                  disabled={gamePhase === 'dealing'}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearBets}
                disabled={gamePhase === 'dealing' || totalBet === 0}
                className="px-4 py-2.5 bg-neutral-900 border border-neutral-700 text-neutral-300 rounded-xl text-xs font-bold hover:bg-neutral-800 disabled:opacity-40 cursor-pointer"
              >
                清除所有下注
              </button>
              <div className="text-xs text-neutral-300 font-mono">
                总下注: <span className="font-bold text-amber-400 text-sm">RM {totalBet.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {gamePhase === 'settled' ? (
                <button
                  type="button"
                  onClick={() => {
                    sound.playChip();
                    setGamePhase('betting');
                    setStatusMessage('请选择 RM 投注面额并在桌面下注');
                    setPlayerCards([]);
                    setBankerCards([]);
                    setPayoutResult(null);
                  }}
                  className="py-3 px-6 text-sm font-bold text-neutral-950 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-xl hover:from-amber-300 hover:to-amber-400 cursor-pointer shadow-lg"
                >
                  继续下一局
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDeal}
                  disabled={gamePhase === 'dealing' || totalBet === 0}
                  className="py-3 px-8 text-sm font-black text-neutral-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-xl shadow-xl hover:from-amber-300 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 fill-neutral-950" />
                  <span>{gamePhase === 'dealing' ? '荷官开牌中...' : '确认下注并发牌'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Macau Bead Plate & Big Road (珠盘路走势分析) */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-neutral-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-200 uppercase tracking-wider">
              澳门标准珠盘路走势 (Bead Road)
            </span>
            <span className="text-neutral-500">· 统计 24 局</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono font-semibold">
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              庄: {stats.b}
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              闲: {stats.p}
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              和: {stats.t}
            </span>
          </div>
        </div>

        {/* Bead Road Grid */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
          {history.map(item => {
            const isBanker = item.winner === 'banker';
            const isPlayer = item.winner === 'player';
            const isTie = item.winner === 'tie';

            return (
              <div
                key={item.id}
                className={`w-9 h-9 rounded-full flex flex-col items-center justify-center font-black text-xs font-mono shrink-0 shadow border relative ${
                  isBanker
                    ? 'bg-red-700 text-white border-red-400'
                    : isPlayer
                    ? 'bg-blue-700 text-white border-blue-400'
                    : 'bg-emerald-700 text-white border-emerald-400'
                }`}
                title={`闲 ${item.playerScore} vs 庄 ${item.bankerScore}`}
              >
                <span>{isBanker ? '庄' : (isPlayer ? '闲' : '和')}</span>
                <span className="text-[8px] leading-none opacity-80">
                  {isBanker ? item.bankerScore : (isPlayer ? item.playerScore : item.bankerScore)}
                </span>

                {/* Pair indicators */}
                {item.playerPair && (
                  <span className="absolute -top-0.5 -left-0.5 w-2 h-2 rounded-full bg-blue-300 ring-1 ring-neutral-950" />
                )}
                {item.bankerPair && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-300 ring-1 ring-neutral-950" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
