export type GameTab = 'lobby' | 'lottery' | 'slots' | 'baccarat' | 'blackjack' | 'poker' | 'cashier';

export type VipTier = 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Crown';

export interface WalletState {
  balance: number;       // 当前可用马币 (RM)
  vaultBalance: number;  // 贵宾金库保险箱 (RM)
  totalWagered: number;  // 累计流水
  totalWon: number;      // 累计中奖
  vipTier: VipTier;
  lastDailyBonus?: string; // ISO date string
}

export type TransactionType = 'deposit' | 'settlement' | 'bonus' | 'cashback' | 'vault_in' | 'vault_out';

export interface TransactionRecord {
  id: string;
  timestamp: number;
  type: TransactionType;
  title: string;
  amount: number;
  channel: string;
  status: 'completed' | 'processing' | 'rejected';
  referenceNo: string;
}

export interface PlayingCard {
  suit: 'spades' | 'hearts' | 'clubs' | 'diamonds';
  value: number; // 1 to 13 (1=A, 11=J, 12=Q, 13=K)
  hidden?: boolean;
}

export interface BaccaratHistoryItem {
  id: string;
  winner: 'player' | 'banker' | 'tie';
  playerScore: number;
  bankerScore: number;
  playerPair: boolean;
  bankerPair: boolean;
}

// Malaysia 4D Lottery Types
export type LotteryHouse = 
  | 'magnum'    // 万能 4D
  | 'damacai'   // 大马彩 1+3D
  | 'toto'      // 多多 Sports Toto
  | 'singapore' // 新加坡万字
  | 'sabah88'   // 沙巴 88
  | 'sandakan'  // 山打根 STC 4D
  | 'cashsweep';// 砂拉越特别大万

export interface LotteryDrawResult {
  house: LotteryHouse;
  drawNo: string;
  drawDate: string;
  dayOfWeek: string;
  firstPrize: string;
  secondPrize: string;
  thirdPrize: string;
  specialPrizes: string[]; // 10 numbers
  consolationPrizes: string[]; // 10 numbers
  fiveDResult?: string; // 5 digits
  sixDResult?: string;  // 6 digits
}

export interface LotteryTicket {
  id: string;
  gameType?: '4D' | '5D' | '6D';
  drawNo: string;
  drawDate: string;
  houses: LotteryHouse[];
  number: string;
  bigBet: number;      // 大万 / 基础投注
  smallBet: number;    // 小万
  singleABet: number;  // 单A
  totalCost: number;
  purchaseTime: number;
  checked: boolean;
  winAmount: number;
  winDetails: string[];
}

