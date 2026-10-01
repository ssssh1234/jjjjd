import { LotteryHouse, LotteryDrawResult, LotteryTicket } from '../types';

export interface HouseInfo {
  id: LotteryHouse;
  name: string;
  enName: string;
  region: string;
  tagColor: string;
  bgGradient: string;
  code: string;
}

export const LOTTERY_HOUSES: HouseInfo[] = [
  {
    id: 'magnum',
    name: '万能 4D',
    enName: 'Magnum 4D',
    region: '西马 · 全马连锁',
    tagColor: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10',
    bgGradient: 'from-yellow-950/40 to-neutral-900',
    code: 'MAG'
  },
  {
    id: 'damacai',
    name: '大马彩 1+3D',
    enName: 'Da Ma Cai',
    region: '西马 · 马会慈善',
    tagColor: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
    bgGradient: 'from-blue-950/40 to-neutral-900',
    code: 'DMC'
  },
  {
    id: 'toto',
    name: '多多 Sports Toto',
    enName: 'Sports Toto 4D',
    region: '西马 · 成功集团',
    tagColor: 'text-red-400 border-red-500/40 bg-red-500/10',
    bgGradient: 'from-red-950/40 to-neutral-900',
    code: 'TOT'
  },
  {
    id: 'singapore',
    name: '新加坡万字',
    enName: 'Singapore 4D',
    region: '新马连线 · 官方开彩',
    tagColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
    bgGradient: 'from-cyan-950/40 to-neutral-900',
    code: 'SG4D'
  },
  {
    id: 'sabah88',
    name: '沙巴 88',
    enName: 'Sabah 88 4D',
    region: '东马 · 沙巴万字',
    tagColor: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
    bgGradient: 'from-orange-950/40 to-neutral-900',
    code: 'S88'
  },
  {
    id: 'sandakan',
    name: '山打根马会',
    enName: 'Sandakan STC 4D',
    region: '东马 · 赛马俱乐部',
    tagColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    bgGradient: 'from-emerald-950/40 to-neutral-900',
    code: 'STC'
  },
  {
    id: 'cashsweep',
    name: '砂拉越特别大万',
    enName: 'Special CashSweep',
    region: '东马 · 砂拉越官方',
    tagColor: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
    bgGradient: 'from-purple-950/40 to-neutral-900',
    code: 'CSW'
  },
];

// Malaysia Official Standard 4D Payout Odds (per RM 1)
export const MALAYSIA_4D_ODDS = {
  // #4D 标准盘
  big: {
    firstPrize: 3500,    // 头奖 (首奖 3500)
    secondPrize: 1100,   // 2奖 (1100)
    thirdPrize: 550,     // 3奖 (550)
    specialPrize: 240,   // 入围 (10个，价格 240)
    consolationPrize: 70 // 安慰奖 (10个，价格 70)
  },
  small: {
    firstPrize: 5000,    // 首奖
    secondPrize: 2200,   // 二奖
    thirdPrize: 1100,    // 三奖
    specialPrize: 0,
    consolationPrize: 0
  },
  singleA: {
    firstPrize: 8300,    // SA-B-C-D-E 单选
    secondPrize: 8300,
    thirdPrize: 8300,
    specialPrize: 830,
    consolationPrize: 830
  },
  threeA: {
    firstPrize: 840,
    secondPrize: 0,
    thirdPrize: 0
  },
  threeC: {
    firstPrize: 280,
    secondPrize: 280,
    thirdPrize: 280
  },
  // SPR 特别盘
  spr: {
    big: { firstPrize: 3000, secondPrize: 1000, thirdPrize: 500, specialPrize: 200, consolationPrize: 60 },
    small: { firstPrize: 4000, secondPrize: 2000, thirdPrize: 1000 },
    sa: { top3: 7000, starterConsolation: 700 },
    threeA: 750,
    threeC: 250
  },
  // #5D 玩法
  fiveD: [
    { rank: '头奖', prize: 20000 },
    { rank: '二奖', prize: 10000 },
    { rank: '三奖', prize: 5000 },
    { rank: '四奖', prize: 800 },
    { rank: '五奖', prize: 80 },
    { rank: '六奖', prize: 8 },
  ],
  // #6D 玩法
  sixD: [
    { rank: '头奖', prize: 150000 },
    { rank: '二奖', prize: 5000 },
    { rank: '三奖', prize: 500 },
    { rank: '四奖', prize: 50 },
    { rank: '五奖', prize: 5 },
  ]
};

// Generate 4-digit string
export function generateRandom4D(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Generate 5-digit string
export function generateRandom5D(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// Generate 6-digit string
export function generateRandom6D(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate complete Malaysia 4D/5D/6D Draw set for a House
export function generateMockDraw(house: LotteryHouse, drawNo: string, date: string, dayOfWeek: string): LotteryDrawResult {
  const specials: string[] = [];
  while (specials.length < 10) {
    const num = generateRandom4D();
    if (!specials.includes(num)) specials.push(num);
  }

  const consolations: string[] = [];
  while (consolations.length < 10) {
    const num = generateRandom4D();
    if (!consolations.includes(num) && !specials.includes(num)) consolations.push(num);
  }

  return {
    house,
    drawNo,
    drawDate: date,
    dayOfWeek,
    firstPrize: generateRandom4D(),
    secondPrize: generateRandom4D(),
    thirdPrize: generateRandom4D(),
    specialPrizes: specials,
    consolationPrizes: consolations,
    fiveDResult: generateRandom5D(),
    sixDResult: generateRandom6D()
  };
}

// Dream / Tua Pek Kong / Thousand Numbers Dictionary (大马万字/千字解梦字典)
export interface DreamNumber {
  keyword: string;
  number: string;
  category: string;
}

export const DREAM_DICTIONARY: DreamNumber[] = [
  { keyword: '发财金龙', number: '1188', category: '神仙瑞兽' },
  { keyword: '大伯公', number: '4321', category: '神仙瑞兽' },
  { keyword: '关圣帝君', number: '9999', category: '神圣崇拜' },
  { keyword: '财神爷赐福', number: '8888', category: '祥瑞吉兆' },
  { keyword: '中头奖发大财', number: '8899', category: '财富好运' },
  { keyword: '车祸遇险 (买车牌)', number: '7238', category: '日常征兆' },
  { keyword: '结婚喜事', number: '2345', category: '喜庆良缘' },
  { keyword: '黑狗吠财', number: '0909', category: '飞禽走兽' },
  { keyword: '金凤展翅', number: '5678', category: '神仙瑞兽' },
  { keyword: '捡到大叠钞票', number: '1688', category: '财富好运' },
  { keyword: '盖新房入伙', number: '3829', category: '乔迁安居' },
  { keyword: '钓到大鲈鱼', number: '2831', category: '水族游鱼' },
  { keyword: '天上掉金元宝', number: '6688', category: '祥瑞吉兆' },
  { keyword: '红衣贵人引路', number: '9188', category: '贵人相助' },
];

// Check Draw Ticket Against Results
export function checkTicketWin(ticket: LotteryTicket, drawResults: Record<LotteryHouse, LotteryDrawResult>): {
  totalWin: number;
  winDetails: string[];
  isWin: boolean;
} {
  let totalWin = 0;
  const winDetails: string[] = [];

  for (const houseId of ticket.houses) {
    const draw = drawResults[houseId];
    if (!draw) continue;

    const houseName = LOTTERY_HOUSES.find(h => h.id === houseId)?.name || houseId;
    const num = ticket.number;

    // 5D Ticket Evaluation
    if (ticket.gameType === '5D') {
      const res = draw.fiveDResult || '88991';
      if (num === res) {
        const win = ticket.bigBet * 20000;
        totalWin += win;
        winDetails.push(`${houseName} [5D] 击中头奖！+RM ${win.toLocaleString()}`);
      } else if (num.slice(0, 4) === res.slice(0, 4) || num.slice(1) === res.slice(1)) {
        const win = ticket.bigBet * 10000;
        totalWin += win;
        winDetails.push(`${houseName} [5D] 击中二奖 (4字对准)！+RM ${win.toLocaleString()}`);
      } else if (num.slice(0, 3) === res.slice(0, 3) || num.slice(2) === res.slice(2)) {
        const win = ticket.bigBet * 5000;
        totalWin += win;
        winDetails.push(`${houseName} [5D] 击中三奖 (3字对准)！+RM ${win.toLocaleString()}`);
      } else if (num.slice(0, 2) === res.slice(0, 2) || num.slice(3) === res.slice(3)) {
        const win = ticket.bigBet * 800;
        totalWin += win;
        winDetails.push(`${houseName} [5D] 击中四奖 (2字对准)！+RM ${win.toLocaleString()}`);
      }
      continue;
    }

    // 6D Ticket Evaluation
    if (ticket.gameType === '6D') {
      const res = draw.sixDResult || '889912';
      if (num === res) {
        const win = ticket.bigBet * 150000;
        totalWin += win;
        winDetails.push(`${houseName} [6D] 击中头奖！+RM ${win.toLocaleString()}`);
      } else if (num.slice(0, 5) === res.slice(0, 5) || num.slice(1) === res.slice(1)) {
        const win = ticket.bigBet * 5000;
        totalWin += win;
        winDetails.push(`${houseName} [6D] 击中二奖 (前/后5字)！+RM ${win.toLocaleString()}`);
      } else if (num.slice(0, 4) === res.slice(0, 4) || num.slice(2) === res.slice(2)) {
        const win = ticket.bigBet * 500;
        totalWin += win;
        winDetails.push(`${houseName} [6D] 击中三奖 (4字对准)！+RM ${win.toLocaleString()}`);
      } else if (num.slice(0, 3) === res.slice(0, 3) || num.slice(3) === res.slice(3)) {
        const win = ticket.bigBet * 50;
        totalWin += win;
        winDetails.push(`${houseName} [6D] 击中四奖 (3字对准)！+RM ${win.toLocaleString()}`);
      } else if (num.slice(0, 2) === res.slice(0, 2) || num.slice(4) === res.slice(4)) {
        const win = ticket.bigBet * 5;
        totalWin += win;
        winDetails.push(`${houseName} [6D] 击中五奖 (2字对准)！+RM ${win.toLocaleString()}`);
      }
      continue;
    }

    // Standard 4D Evaluation
    // Check 1st Prize
    if (draw.firstPrize === num) {
      if (ticket.bigBet > 0) {
        const win = ticket.bigBet * MALAYSIA_4D_ODDS.big.firstPrize;
        totalWin += win;
        winDetails.push(`${houseName} [大万] 击中首奖 (头奖)！+RM ${win.toLocaleString()}`);
      }
      if (ticket.smallBet > 0) {
        const win = ticket.smallBet * MALAYSIA_4D_ODDS.small.firstPrize;
        totalWin += win;
        winDetails.push(`${houseName} [小万] 击中首奖 (头奖)！+RM ${win.toLocaleString()}`);
      }
      if (ticket.singleABet > 0) {
        const win = ticket.singleABet * MALAYSIA_4D_ODDS.singleA.firstPrize;
        totalWin += win;
        winDetails.push(`${houseName} [单A] 独中头奖！+RM ${win.toLocaleString()}`);
      }
    }

    // Check 2nd Prize
    if (draw.secondPrize === num) {
      if (ticket.bigBet > 0) {
        const win = ticket.bigBet * MALAYSIA_4D_ODDS.big.secondPrize;
        totalWin += win;
        winDetails.push(`${houseName} [大万] 击中二奖！+RM ${win.toLocaleString()}`);
      }
      if (ticket.smallBet > 0) {
        const win = ticket.smallBet * MALAYSIA_4D_ODDS.small.secondPrize;
        totalWin += win;
        winDetails.push(`${houseName} [小万] 击中二奖！+RM ${win.toLocaleString()}`);
      }
    }

    // Check 3rd Prize
    if (draw.thirdPrize === num) {
      if (ticket.bigBet > 0) {
        const win = ticket.bigBet * MALAYSIA_4D_ODDS.big.thirdPrize;
        totalWin += win;
        winDetails.push(`${houseName} [大万] 击中三奖！+RM ${win.toLocaleString()}`);
      }
      if (ticket.smallBet > 0) {
        const win = ticket.smallBet * MALAYSIA_4D_ODDS.small.thirdPrize;
        totalWin += win;
        winDetails.push(`${houseName} [小万] 击中三奖！+RM ${win.toLocaleString()}`);
      }
    }

    // Check Starter / 入围 (10 sets, only Big Bet pays)
    if (draw.specialPrizes.includes(num)) {
      if (ticket.bigBet > 0) {
        const win = ticket.bigBet * MALAYSIA_4D_ODDS.big.specialPrize;
        totalWin += win;
        winDetails.push(`${houseName} [大万] 击中入围！+RM ${win.toLocaleString()}`);
      }
    }

    // Check Consolation Prizes (10 sets, only Big Bet pays)
    if (draw.consolationPrizes.includes(num)) {
      if (ticket.bigBet > 0) {
        const win = ticket.bigBet * MALAYSIA_4D_ODDS.big.consolationPrize;
        totalWin += win;
        winDetails.push(`${houseName} [大万] 击中安慰奖！+RM ${win.toLocaleString()}`);
      }
    }
  }

  return {
    totalWin,
    winDetails,
    isWin: totalWin > 0
  };
}
