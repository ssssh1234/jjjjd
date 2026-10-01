import React, { useState } from 'react';
import { WalletState, PlayingCard } from '../../types';
import { sound } from '../../utils/sound';
import { createDeck, calculateBlackjackScore } from '../../utils/deck';
import { CardView } from '../CardView';
import { Chip, CHIP_DENOMINATIONS, ChipValue } from '../Chip';
import { Sparkles, RotateCcw, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BlackjackProps {
  wallet: WalletState;
  onUpdateWallet: (updater: (prev: WalletState) => WalletState) => void;
  onRecordGameWin: (game: string, bet: number, win: number) => void;
}

export const Blackjack: React.FC<BlackjackProps> = ({
  wallet,
  onUpdateWallet,
  onRecordGameWin
}) => {
  const [selectedChip, setSelectedChip] = useState<ChipValue>(100);
  const [bet, setBet] = useState<number>(0);
  const [deck, setDeck] = useState<PlayingCard[]>([]);

  const [playerCards, setPlayerCards] = useState<PlayingCard[]>([]);
  const [dealerCards, setDealerCards] = useState<PlayingCard[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'player_turn' | 'dealer_turn' | 'round_over'>('betting');
  const [message, setMessage] = useState<string>('请在桌面上投注 RM 以开始21点');
  const [roundResult, setRoundResult] = useState<{ win: number; text: string } | null>(null);

  const playerScore = calculateBlackjackScore(playerCards);
  const dealerScore = calculateBlackjackScore(dealerCards);

  // Add bet
  const handleAddBet = (val: number) => {
    if (gameState !== 'betting') return;
    if (wallet.balance < bet + val) {
      sound.playLoss();
      alert('可用马币 (RM) 余额不足！');
      return;
    }
    sound.playChip();
    setBet(prev => prev + val);
  };

  const handleClearBet = () => {
    if (gameState !== 'betting') return;
    sound.playChip();
    setBet(0);
  };

  // Deal initial hand
  const handleDeal = () => {
    if (bet <= 0) {
      alert('请先投注下注金额！');
      return;
    }
    if (wallet.balance < bet) {
      sound.playLoss();
      alert('可用马币不足！');
      return;
    }

    sound.playChip();
    onUpdateWallet(prev => ({
      ...prev,
      balance: prev.balance - bet,
      totalWagered: prev.totalWagered + bet
    }));

    const newDeck = createDeck(4);
    const p1 = newDeck.pop()!;
    const d1 = newDeck.pop()!;
    const p2 = newDeck.pop()!;
    const d2 = { ...newDeck.pop()!, hidden: true }; // Hole card

    setDeck(newDeck);
    setPlayerCards([p1, p2]);
    setDealerCards([d1, d2]);
    setRoundResult(null);

    sound.playCard();

    // Check Player Natural Blackjack (21 on 2 cards)
    const pEval = calculateBlackjackScore([p1, p2]);
    if (pEval.isBlackjack) {
      setGameState('dealer_turn');
      // Reveal dealer
      setTimeout(() => {
        const revealedDealer = [d1, { ...d2, hidden: false }];
        setDealerCards(revealedDealer);
        const dEval = calculateBlackjackScore(revealedDealer);

        if (dEval.isBlackjack) {
          // Push
          settleRound('push', bet, '双方皆为 Blackjack，平局退回本金');
        } else {
          // Blackjack pays 3:2 (bet * 2.5)
          const win = bet + Math.floor(bet * 1.5);
          settleRound('blackjack', win, '🎉 恭喜获得天生 21点 (Blackjack 3:2)！');
        }
      }, 700);
      return;
    }

    setGameState('player_turn');
    setMessage('请选择：要牌 (Hit) 或 停牌 (Stand)');
  };

  // Player Hits
  const handleHit = () => {
    if (gameState !== 'player_turn') return;
    sound.playCard();

    const currentDeck = [...deck];
    const newCard = currentDeck.pop()!;
    const nextPlayerCards = [...playerCards, newCard];

    setDeck(currentDeck);
    setPlayerCards(nextPlayerCards);

    const nextScore = calculateBlackjackScore(nextPlayerCards);
    if (nextScore.isBust) {
      // Player Busts
      setGameState('round_over');
      settleRound('bust', 0, `爆牌！您的点数为 ${nextScore.score} 点，超出 21 点`);
    } else if (nextScore.score === 21) {
      // Automatically stand on 21
      handleStand(nextPlayerCards, currentDeck);
    }
  };

  // Player Double Down
  const handleDoubleDown = () => {
    if (gameState !== 'player_turn' || playerCards.length !== 2) return;
    if (wallet.balance < bet) {
      alert('马币余额不足以进行双倍下注！');
      return;
    }

    sound.playChip();
    onUpdateWallet(prev => ({
      ...prev,
      balance: prev.balance - bet,
      totalWagered: prev.totalWagered + bet
    }));

    const doubledBet = bet * 2;
    setBet(doubledBet);

    const currentDeck = [...deck];
    const newCard = currentDeck.pop()!;
    const nextPlayerCards = [...playerCards, newCard];
    setDeck(currentDeck);
    setPlayerCards(nextPlayerCards);

    const nextScore = calculateBlackjackScore(nextPlayerCards);
    if (nextScore.isBust) {
      setGameState('round_over');
      settleRound('bust', 0, `爆牌！点数为 ${nextScore.score}，双倍投注遗憾告负`);
    } else {
      handleStand(nextPlayerCards, currentDeck, doubledBet);
    }
  };

  // Player Stands -> Dealer Turn
  const handleStand = (pCards = playerCards, dShoe = deck, currentBet = bet) => {
    setGameState('dealer_turn');
    setMessage('庄家开底牌并补牌中...');

    // Reveal hidden card
    let currentDealer: PlayingCard[] = dealerCards.map(c => ({ ...c, hidden: false }));
    setDealerCards(currentDealer);
    sound.playCard();

    let curDeck = [...dShoe];

    const dealerStep = () => {
      let dScore = calculateBlackjackScore(currentDealer);
      if (dScore.score < 17) {
        setTimeout(() => {
          sound.playCard();
          const drawn = curDeck.pop()!;
          currentDealer = [...currentDealer, drawn];
          setDealerCards(currentDealer);
          dealerStep();
        }, 600);
      } else {
        // Dealer stops, evaluate result
        finalizeGame(pCards, currentDealer, currentBet);
      }
    };

    setTimeout(() => {
      dealerStep();
    }, 500);
  };

  const finalizeGame = (pCards: PlayingCard[], dCards: PlayingCard[], currentBet: number) => {
    const p = calculateBlackjackScore(pCards);
    const d = calculateBlackjackScore(dCards);

    if (d.isBust) {
      settleRound('win', currentBet * 2, `庄家爆牌 (${d.score} 点)！闲家获胜`);
    } else if (p.score > d.score) {
      settleRound('win', currentBet * 2, `闲家 ${p.score} 点 胜过 庄家 ${d.score} 点！`);
    } else if (p.score < d.score) {
      settleRound('loss', 0, `庄家 ${d.score} 点 胜过 闲家 ${p.score} 点。`);
    } else {
      settleRound('push', currentBet, `双方同为 ${p.score} 点，平局退还下注`);
    }
  };

  const settleRound = (result: 'win' | 'blackjack' | 'push' | 'loss' | 'bust', winAmount: number, text: string) => {
    setGameState('round_over');
    setMessage(text);
    setRoundResult({ win: winAmount, text });

    if (winAmount > 0) {
      onUpdateWallet(prev => ({
        ...prev,
        balance: prev.balance + winAmount,
        totalWon: prev.totalWon + winAmount
      }));
      onRecordGameWin('拉斯维加斯21点', bet, winAmount);

      if (result === 'blackjack' || winAmount >= bet * 2) {
        sound.playJackpot();
        confetti({ particleCount: 60, spread: 60 });
      } else {
        sound.playWin();
      }
    } else {
      sound.playLoss();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Header Rim */}
      <div className="casino-wood-rim rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-xl sm:text-2xl font-black text-amber-300 tracking-wide flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>拉斯维加斯 21点 · VIP 桌台</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Blackjack 3:2 赔付 · 庄家 17 点停牌 · 真实双倍下注
          </p>
        </div>

        <div className="px-4 py-2 bg-neutral-950/80 border border-amber-500/30 rounded-xl text-xs sm:text-sm font-semibold text-amber-300">
          {message}
        </div>
      </div>

      {/* Main Blackjack Table Surface */}
      <div className="relative casino-felt border-4 border-amber-800/60 rounded-3xl p-5 sm:p-8 shadow-2xl overflow-hidden">
        {/* Dealer Zone (Top) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/50 border border-neutral-700/50 flex flex-col items-center mb-6">
          <div className="flex items-center justify-between w-full mb-3">
            <span className="font-cinzel font-bold text-amber-300 text-base sm:text-lg">
              DEALER 庄家
            </span>
            <span className="px-3 py-1 bg-neutral-900 border border-neutral-700 rounded-lg font-mono-nums font-bold text-xs sm:text-sm text-amber-300">
              点数: {dealerCards.length > 0 ? (dealerCards.some(c => c.hidden) ? `${calculateBlackjackScore([dealerCards[0]]).score} + ?` : dealerScore.score) : '-'}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-3 min-h-[120px]">
            {dealerCards.length === 0 ? (
              <div className="text-xs text-neutral-500 font-mono py-8">等待开始...</div>
            ) : (
              dealerCards.map((c, i) => (
                <CardView key={i} card={c} size="md" />
              ))
            )}
          </div>
        </div>

        {/* Round Result Banner */}
        {roundResult && (
          <div className="mb-6 p-4 rounded-xl bg-neutral-950/90 border border-amber-400/50 shadow-xl text-center space-y-1">
            <div className={`font-cinzel font-black text-xl ${roundResult.win > 0 ? 'text-amber-400' : 'text-neutral-400'}`}>
              {roundResult.win > 0 ? `+RM ${roundResult.win.toLocaleString()}` : 'RM 0'}
            </div>
            <div className="text-xs text-neutral-300 font-semibold">{roundResult.text}</div>
          </div>
        )}

        {/* Player Zone (Bottom) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/50 border border-neutral-700/50 flex flex-col items-center mb-6">
          <div className="flex items-center justify-between w-full mb-3">
            <span className="font-cinzel font-bold text-amber-300 text-base sm:text-lg">
              PLAYER 闲家
            </span>
            <span className="px-3 py-1 bg-neutral-900 border border-neutral-700 rounded-lg font-mono-nums font-bold text-xs sm:text-sm text-emerald-400">
              点数: {playerCards.length > 0 ? (playerScore.isSoft ? `${playerScore.score} (软)` : playerScore.score) : '-'}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-3 min-h-[120px]">
            {playerCards.length === 0 ? (
              <div className="text-xs text-neutral-500 font-mono py-8">请下注并点击发牌</div>
            ) : (
              playerCards.map((c, i) => (
                <CardView key={i} card={c} size="md" />
              ))
            )}
          </div>
        </div>

        {/* Control Desk */}
        <div className="space-y-4">
          {/* Betting Phase: Select Chips */}
          {gameState === 'betting' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-950/70 rounded-xl border border-neutral-800">
                <span className="text-xs font-semibold text-neutral-300">
                  点击下注面额 (RM) 加入下注盘：
                </span>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {CHIP_DENOMINATIONS.slice(0, 5).map(val => (
                    <Chip
                      key={val}
                      value={val}
                      onClick={() => handleAddBet(val)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearBet}
                    disabled={bet === 0}
                    className="px-4 py-2.5 bg-neutral-900 border border-neutral-700 text-neutral-300 rounded-xl text-xs font-bold hover:bg-neutral-800 disabled:opacity-40 cursor-pointer"
                  >
                    清空下注
                  </button>
                  <div className="text-xs text-neutral-300 font-mono">
                    已投注: <span className="font-bold text-amber-400 text-sm">RM {bet.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDeal}
                  disabled={bet === 0}
                  className="py-3 px-8 text-sm font-black text-neutral-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-xl shadow-xl hover:from-amber-300 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 fill-neutral-950" />
                  <span>确认下注并发牌</span>
                </button>
              </div>
            </div>
          )}

          {/* Playing Phase: Hit / Stand / Double Down */}
          {gameState === 'player_turn' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={handleHit}
                className="py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-lg"
              >
                要牌 (Hit)
              </button>
              <button
                type="button"
                onClick={() => handleStand()}
                className="py-3.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-lg"
              >
                停牌 (Stand)
              </button>
              <button
                type="button"
                onClick={handleDoubleDown}
                disabled={playerCards.length !== 2 || wallet.balance < bet}
                className="col-span-2 sm:col-span-1 py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl text-sm transition-all cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                双倍下注 (Double)
              </button>
            </div>
          )}

          {/* Round Over Phase */}
          {gameState === 'round_over' && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  sound.playChip();
                  setGameState('betting');
                  setPlayerCards([]);
                  setDealerCards([]);
                  setRoundResult(null);
                  setMessage('请下注以开始新的一局');
                }}
                className="py-3 px-8 text-sm font-bold text-neutral-950 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-xl hover:from-amber-300 hover:to-amber-400 cursor-pointer shadow-lg"
              >
                再来一局 (新局)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
