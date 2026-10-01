import { PlayingCard } from '../types';

export const SUITS: Array<PlayingCard['suit']> = ['spades', 'hearts', 'clubs', 'diamonds'];

export function createDeck(decks = 1): PlayingCard[] {
  const cards: PlayingCard[] = [];
  for (let d = 0; d < decks; d++) {
    for (const suit of SUITS) {
      for (let value = 1; value <= 13; value++) {
        cards.push({ suit, value });
      }
    }
  }
  return shuffle(cards);
}

export function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getCardLabel(value: number): string {
  if (value === 1) return 'A';
  if (value === 11) return 'J';
  if (value === 12) return 'Q';
  if (value === 13) return 'K';
  return value.toString();
}

export function getCardSuitIcon(suit: PlayingCard['suit']): string {
  switch (suit) {
    case 'spades': return '♠';
    case 'hearts': return '♥';
    case 'clubs': return '♣';
    case 'diamonds': return '♦';
  }
}

export function isCardRed(suit: PlayingCard['suit']): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

// Baccarat point rule: 10, J, Q, K = 0; A = 1; 2-9 = face value. Sum modulo 10.
export function calculateBaccaratHand(cards: PlayingCard[]): number {
  const sum = cards.reduce((acc, c) => {
    if (c.value >= 10) return acc;
    return acc + c.value;
  }, 0);
  return sum % 10;
}

// Check for pairs in initial 2 cards
export function hasPair(cards: PlayingCard[]): boolean {
  if (cards.length < 2) return false;
  return cards[0].value === cards[1].value;
}

// Blackjack score calculator
export function calculateBlackjackScore(cards: PlayingCard[]): { score: number; isSoft: boolean; isBust: boolean; isBlackjack: boolean } {
  let score = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.hidden) continue;
    if (card.value === 1) {
      aces += 1;
      score += 11;
    } else if (card.value >= 10) {
      score += 10;
    } else {
      score += card.value;
    }
  }

  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }

  const isBlackjack = cards.length === 2 && score === 21;
  const isBust = score > 21;
  const isSoft = aces > 0 && score <= 21;

  return { score, isSoft, isBust, isBlackjack };
}

// 炸金花 / Three Card Poker Ranking
export type PokerHandRank = 
  | 'trail'          // 豹子 (AAA, KKK)
  | 'straight_flush' // 顺金 (同花顺)
  | 'flush'          // 金花 (同花)
  | 'straight'       // 顺子
  | 'pair'           // 对子
  | 'high_card';     // 单张

export interface PokerEvaluation {
  rank: PokerHandRank;
  rankName: string;
  weight: number; // for comparison
}

export function evaluateThreeCardPoker(cards: PlayingCard[]): PokerEvaluation {
  if (cards.length < 3) {
    return { rank: 'high_card', rankName: '单张', weight: 0 };
  }

  const vals = cards.map(c => (c.value === 1 ? 14 : c.value)).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  const isFlush = suits[0] === suits[1] && suits[1] === suits[2];

  // Check straight: e.g. 14, 13, 12 or 5, 4, 3 or A-2-3 (14, 3, 2)
  let isStraight = false;
  let straightHigh = vals[0];
  if (vals[0] - vals[1] === 1 && vals[1] - vals[2] === 1) {
    isStraight = true;
  } else if (vals[0] === 14 && vals[1] === 3 && vals[2] === 2) {
    // A-2-3
    isStraight = true;
    straightHigh = 3;
  }

  // Check Trail (three of a kind)
  if (vals[0] === vals[1] && vals[1] === vals[2]) {
    return {
      rank: 'trail',
      rankName: '豹子',
      weight: 6000000 + vals[0]
    };
  }

  // Check Straight Flush (顺金)
  if (isFlush && isStraight) {
    return {
      rank: 'straight_flush',
      rankName: '顺金 (同花顺)',
      weight: 5000000 + straightHigh
    };
  }

  // Check Flush (金花)
  if (isFlush) {
    return {
      rank: 'flush',
      rankName: '金花 (同花)',
      weight: 4000000 + vals[0] * 400 + vals[1] * 20 + vals[2]
    };
  }

  // Check Straight (顺子)
  if (isStraight) {
    return {
      rank: 'straight',
      rankName: '顺子',
      weight: 3000000 + straightHigh
    };
  }

  // Check Pair (对子)
  if (vals[0] === vals[1] || vals[1] === vals[2] || vals[0] === vals[2]) {
    let pairVal = vals[1];
    let singleVal = vals[0] === vals[1] ? vals[2] : (vals[1] === vals[2] ? vals[0] : vals[1]);
    return {
      rank: 'pair',
      rankName: '对子',
      weight: 2000000 + pairVal * 20 + singleVal
    };
  }

  // High card (单张)
  return {
    rank: 'high_card',
    rankName: '单张',
    weight: 1000000 + vals[0] * 400 + vals[1] * 20 + vals[2]
  };
}
