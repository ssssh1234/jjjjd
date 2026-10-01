import React, { useState } from 'react';
import { WalletState, PlayingCard } from '../../types';
import { sound } from '../../utils/sound';
import { createDeck, evaluateThreeCardPoker, PokerEvaluation } from '../../utils/deck';
import { CardView } from '../CardView';
import { Chip, CHIP_DENOMINATIONS, ChipValue } from '../Chip';
import { Flame, Sparkles, User, Bot, Swords } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PokerGameProps {
  wallet: WalletState;
  onUpdateWallet: (updater: (prev: WalletState) => WalletState) => void;
  onRecordGameWin: (game: string, bet: number, win: number) => void;
}

interface PlayerSeat {
  id: string;
  name: string;
  isBot: boolean;
  avatar: string;
  cards: PlayingCard[];
  hasLooked: boolean;
  isFolded: boolean;
  totalBet: number;
}

export const PokerGame: React.FC<PokerGameProps> = ({
  wallet,
  onUpdateWallet,
  onRecordGameWin
}) => {
  const [ante] = useState<number>(200);
  const [pot, setPot] = useState<number>(0);
  const [gamePhase, setGamePhase] = useState<'idle' | 'playing' | 'showdown'>('idle');
  const [statusText, setStatusText] = useState<string>('极速炸金花桌台 · 底注 RM 200');
  const [currentCallBet, setCurrentCallBet] = useState<number>(200);

  const [players, setPlayers] = useState<PlayerSeat[]>([
    { id: 'bot1', name: '拉斯老陈', isBot: true, avatar: '🎩', cards: [], hasLooked: false, isFolded: false, totalBet: 0 },
    { id: 'player', name: '贵宾您自己', isBot: false, avatar: '👑', cards: [], hasLooked: false, isFolded: false, totalBet: 0 },
    { id: 'bot2', name: '澳门刀仔', isBot: true, avatar: '🕶️', cards: [], hasLooked: false, isFolded: false, totalBet: 0 },
  ]);

  const [winnerInfo, setWinnerInfo] = useState<{ name: string; rankName: string; winPot: number } | null>(null);

  const playerSeat = players.find(p => p.id === 'player')!;

  // Start new round
  const handleStartRound = () => {
    if (wallet.balance < ante) {
      sound.playLoss();
      alert('可用马币不足支付底注！请前往账房充值。');
      return;
    }

    sound.playChip();
    const shoe = createDeck(1);

    // Deduct player's ante
    onUpdateWallet(prev => ({
      ...prev,
      balance: prev.balance - ante,
      totalWagered: prev.totalWagered + ante
    }));

    const pCards = [shoe[0], shoe[1], shoe[2]].map(c => ({ ...c, hidden: true }));
    const b1Cards = [shoe[3], shoe[4], shoe[5]].map(c => ({ ...c, hidden: true }));
    const b2Cards = [shoe[6], shoe[7], shoe[8]].map(c => ({ ...c, hidden: true }));

    const initialPot = ante * 3;
    setPot(initialPot);
    setCurrentCallBet(ante);
    setWinnerInfo(null);

    setPlayers([
      { id: 'bot1', name: '拉斯老陈', isBot: true, avatar: '🎩', cards: b1Cards, hasLooked: false, isFolded: false, totalBet: ante },
      { id: 'player', name: '贵宾您自己', isBot: false, avatar: '👑', cards: pCards, hasLooked: false, isFolded: false, totalBet: ante },
      { id: 'bot2', name: '澳门刀仔', isBot: true, avatar: '🕶️', cards: b2Cards, hasLooked: false, isFolded: false, totalBet: ante },
    ]);

    setGamePhase('playing');
    setStatusText('底注已扣除，可选择【看牌】或【闷牌跟注】');
    sound.playCard();
  };

  // Player Look at Cards
  const handleLookCards = () => {
    if (gamePhase !== 'playing' || playerSeat.hasLooked) return;
    sound.playCard();

    setPlayers(prev => prev.map(p => {
      if (p.id === 'player') {
        return {
          ...p,
          hasLooked: true,
          cards: p.cards.map(c => ({ ...c, hidden: false }))
        };
      }
      return p;
    }));

    const evalResult = evaluateThreeCardPoker(playerSeat.cards.map(c => ({ ...c, hidden: false })));
    setStatusText(`您已看牌！当前牌型：${evalResult.rankName}。明注跟注为 2 倍。`);
  };

  // Player Calls or Bets
  const handlePlayerAction = (action: 'call' | 'raise') => {
    if (gamePhase !== 'playing') return;

    // Blind player pays currentCallBet, Looked player pays currentCallBet * 2
    const betCost = playerSeat.hasLooked ? currentCallBet * 2 : currentCallBet;
    const additionalRaise = action === 'raise' ? 200 : 0;
    const totalPay = betCost + additionalRaise;

    if (wallet.balance < totalPay) {
      sound.playLoss();
      alert('可用马币不足以跟注！');
      return;
    }

    sound.playChip();
    onUpdateWallet(prev => ({
      ...prev,
      balance: prev.balance - totalPay,
      totalWagered: prev.totalWagered + totalPay
    }));

    setPot(prev => prev + totalPay);
    if (action === 'raise') {
      setCurrentCallBet(prev => prev + 200);
    }

    setPlayers(prev => prev.map(p => {
      if (p.id === 'player') {
        return { ...p, totalBet: p.totalBet + totalPay };
      }
      return p;
    }));

    setStatusText(`您进行了【${action === 'raise' ? '加注' : '跟注'}】，放入底池 RM ${totalPay}`);

    // Trigger AI Bots' Turns
    setTimeout(() => {
      handleBotTurns(totalPay);
    }, 600);
  };

  // Simple smart AI bots logic
  const handleBotTurns = (playerBetAmount: number) => {
    setPlayers(currentPlayers => {
      let updated = [...currentPlayers];
      let addedPot = 0;

      for (let i = 0; i < updated.length; i++) {
        const bot = updated[i];
        if (!bot.isBot || bot.isFolded) continue;

        // Reveal bot cards internally for evaluation
        const evalBot = evaluateThreeCardPoker(bot.cards);

        // Weak single card < Q may fold with 40% probability
        if (evalBot.rank === 'high_card' && Math.random() < 0.35 && pot > 1000) {
          bot.isFolded = true;
        } else {
          // Bot calls
          const botBet = bot.hasLooked ? currentCallBet * 2 : currentCallBet;
          bot.totalBet += botBet;
          addedPot += botBet;
        }
      }

      setPot(prev => prev + addedPot);
      return updated;
    });

    // Check if only 1 player remains
    setTimeout(() => {
      checkWinnerOnFolds();
    }, 400);
  };

  const checkWinnerOnFolds = () => {
    setPlayers(current => {
      const active = current.filter(p => !p.isFolded);
      if (active.length === 1) {
        // Sole survivor
        const winner = active[0];
        triggerWin(winner, pot);
      }
      return current;
    });
  };

  // Player Folds
  const handleFold = () => {
    if (gamePhase !== 'playing') return;
    sound.playLoss();

    setPlayers(prev => prev.map(p => {
      if (p.id === 'player') return { ...p, isFolded: true };
      return p;
    }));

    setStatusText('您选择了弃牌认输');
    // Check remaining
    setTimeout(() => {
      checkWinnerOnFolds();
    }, 500);
  };

  // Compare Cards / Showdown (比牌)
  const handleShowdown = () => {
    if (gamePhase !== 'playing') return;
    sound.playCard();

    // Reveal all remaining active cards
    const revealedPlayers = players.map(p => ({
      ...p,
      cards: p.cards.map(c => ({ ...c, hidden: false }))
    }));

    setPlayers(revealedPlayers);
    setGamePhase('showdown');

    // Find best evaluation among active non-folded players
    const active = revealedPlayers.filter(p => !p.isFolded);
    let bestPlayer = active[0];
    let bestEval = evaluateThreeCardPoker(bestPlayer.cards);

    for (let i = 1; i < active.length; i++) {
      const curEval = evaluateThreeCardPoker(active[i].cards);
      if (curEval.weight > bestEval.weight) {
        bestPlayer = active[i];
        bestEval = curEval;
      }
    }

    triggerWin(bestPlayer, pot);
  };

  const triggerWin = (winner: PlayerSeat, winningPot: number) => {
    setGamePhase('showdown');
    // Reveal all cards for clarity
    setPlayers(prev => prev.map(p => ({
      ...p,
      cards: p.cards.map(c => ({ ...c, hidden: false }))
    })));

    const evalResult = evaluateThreeCardPoker(winner.cards);
    setWinnerInfo({
      name: winner.name,
      rankName: evalResult.rankName,
      winPot: winningPot
    });

    if (winner.id === 'player') {
      sound.playJackpot();
      confetti({ particleCount: 70, spread: 70 });
      onUpdateWallet(prev => ({
        ...prev,
        balance: prev.balance + winningPot,
        totalWon: prev.totalWon + winningPot
      }));
      onRecordGameWin('极速炸金花', playerSeat.totalBet, winningPot);
      setStatusText(`🎉 恭喜您赢得底池！牌型：${evalResult.rankName}，赢取 +RM ${winningPot.toLocaleString()}！`);
    } else {
      sound.playLoss();
      setStatusText(`${winner.name} 以【${evalResult.rankName}】胜出，获得奖池`);
    }
  };

  const playerEval = evaluateThreeCardPoker(playerSeat.cards);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header Rim */}
      <div className="casino-wood-rim rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-xl sm:text-2xl font-black text-amber-300 tracking-wide flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500 fill-red-500" />
            <span>极速炸金花 · 三张牌高能博弈</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            豹子 顺金 金花 顺子 对子 · 闷牌暗注 · 激情比牌
          </p>
        </div>

        <div className="px-4 py-2 bg-neutral-950/80 border border-amber-500/30 rounded-xl text-xs sm:text-sm font-semibold text-amber-300">
          {statusText}
        </div>
      </div>

      {/* Main Poker Table */}
      <div className="relative casino-felt border-4 border-amber-800/60 rounded-3xl p-5 sm:p-8 shadow-2xl overflow-hidden min-h-[440px] flex flex-col justify-between">
        {/* Top: 2 Opponent Bots */}
        <div className="grid grid-cols-2 gap-4">
          {players.filter(p => p.isBot).map(bot => {
            const botEval = evaluateThreeCardPoker(bot.cards);
            return (
              <div
                key={bot.id}
                className={`p-3.5 rounded-2xl bg-neutral-950/70 border transition-all ${
                  bot.isFolded
                    ? 'border-neutral-800 opacity-40'
                    : 'border-amber-500/30 shadow'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{bot.avatar}</span>
                    <div>
                      <span className="font-bold text-xs text-neutral-200 block">{bot.name}</span>
                      <span className="text-[10px] text-neutral-500">
                        {bot.isFolded ? '已弃牌' : `已下注: RM ${bot.totalBet}`}
                      </span>
                    </div>
                  </div>
                  {gamePhase === 'showdown' && !bot.isFolded && (
                    <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 rounded text-[11px] font-bold">
                      {botEval.rankName}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center gap-1.5 min-h-[70px]">
                  {bot.cards.length === 0 ? (
                    <div className="text-[11px] text-neutral-600 font-mono">待入局</div>
                  ) : (
                    bot.cards.map((c, i) => (
                      <CardView key={i} card={c} size="sm" />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Center: Gold Chip Pot */}
        <div className="my-6 p-4 rounded-2xl bg-neutral-950/90 border-2 border-amber-500/50 shadow-2xl max-w-sm mx-auto text-center w-full">
          <div className="text-[11px] uppercase tracking-widest text-amber-300 font-semibold mb-0.5">
            桌面底池总额 (POT)
          </div>
          <div className="font-mono-nums font-black text-2xl sm:text-3xl text-amber-400">
            RM {pot.toLocaleString()}
          </div>
          {winnerInfo && (
            <div className="mt-2 text-xs font-bold text-emerald-400 animate-pulse">
              🏆 {winnerInfo.name} 获胜！牌型：{winnerInfo.rankName}
            </div>
          )}
        </div>

        {/* Bottom: Player Hands & Controls */}
        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/80 border border-amber-500/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">👑</span>
              <div>
                <span className="font-bold text-xs text-amber-300 block">您自己的手牌 (贵宾位)</span>
                <span className="text-[10px] text-neutral-400">
                  {playerSeat.isFolded ? '已弃牌' : `已下注: RM ${playerSeat.totalBet}`}
                </span>
              </div>
            </div>

            {/* Hand rank badge if looked or showdown */}
            {(playerSeat.hasLooked || gamePhase === 'showdown') && playerSeat.cards.length > 0 && (
              <span className="px-3 py-1 bg-amber-400/20 border border-amber-400/40 text-amber-300 rounded-lg text-xs font-bold font-mono">
                {playerEval.rankName}
              </span>
            )}
          </div>

          {/* Cards Display */}
          <div className="flex items-center justify-center gap-3 min-h-[90px]">
            {playerSeat.cards.length === 0 ? (
              <div className="text-xs text-neutral-500 font-mono py-4">点击下方开始新的一局炸金花</div>
            ) : (
              playerSeat.cards.map((c, i) => (
                <CardView key={i} card={c} size="md" />
              ))
            )}
          </div>

          {/* Player Buttons */}
          <div className="pt-2">
            {gamePhase === 'idle' || gamePhase === 'showdown' ? (
              <button
                type="button"
                onClick={handleStartRound}
                className="w-full py-3.5 text-sm font-black text-neutral-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-xl shadow-xl hover:from-amber-300 hover:to-amber-400 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 fill-neutral-950" />
                <span>立即入座发牌 (底注 RM {ante})</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Look Cards button */}
                <button
                  type="button"
                  onClick={handleLookCards}
                  disabled={playerSeat.hasLooked || playerSeat.isFolded}
                  className="py-3 px-3 rounded-xl bg-neutral-900 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-neutral-800 disabled:opacity-40 cursor-pointer"
                >
                  {playerSeat.hasLooked ? '已看牌 (明牌)' : '看牌 (翻开手牌)'}
                </button>

                {/* Call Bet button */}
                <button
                  type="button"
                  onClick={() => handlePlayerAction('call')}
                  disabled={playerSeat.isFolded}
                  className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow cursor-pointer"
                >
                  跟注 (RM {playerSeat.hasLooked ? currentCallBet * 2 : currentCallBet})
                </button>

                {/* Showdown Compare button */}
                <button
                  type="button"
                  onClick={handleShowdown}
                  disabled={playerSeat.isFolded}
                  className="py-3 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-neutral-950 text-xs font-black shadow cursor-pointer flex items-center justify-center gap-1"
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>立即开牌比牌</span>
                </button>

                {/* Fold button */}
                <button
                  type="button"
                  onClick={handleFold}
                  disabled={playerSeat.isFolded}
                  className="py-3 px-3 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold cursor-pointer"
                >
                  弃牌 (认输)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
