import React, { useState, useEffect } from 'react';
import { WalletState, LotteryHouse, LotteryDrawResult, LotteryTicket } from '../../types';
import { 
  LOTTERY_HOUSES, 
  MALAYSIA_4D_ODDS, 
  DREAM_DICTIONARY, 
  checkTicketWin, 
  generateRandom4D, 
  generateRandom5D,
  generateRandom6D,
  generateMockDraw 
} from '../../utils/lottery';
import { sound } from '../../utils/sound';
import { 
  Edit3, 
  FileText, 
  Gauge, 
  Search, 
  Trophy, 
  Coins, 
  RotateCw, 
  RefreshCw, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Flame, 
  BookOpen, 
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Ticket,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MalaysiaLotteryProps {
  wallet: WalletState;
  onUpdateWallet: (updater: (prev: WalletState) => WalletState) => void;
  onRecordGameWin: (game: string, bet: number, win: number) => void;
  onOpenCashier?: () => void;
  initialView?: MainViewMode;
  onBackToLobby?: () => void;
}

type MainViewMode = 'dashboard' | 'betting' | 'live_draw' | 'receipts' | 'results' | 'winnings' | 'dream_book';
type LottoCategory = '4D' | '5D' | '6D';

export const MalaysiaLottery: React.FC<MalaysiaLotteryProps> = ({
  wallet,
  onUpdateWallet,
  onRecordGameWin,
  onOpenCashier,
  initialView = 'dashboard',
  onBackToLobby
}) => {
  const [activeView, setActiveView] = useState<MainViewMode>(initialView);
  const [selectedHouse, setSelectedHouse] = useState<LotteryHouse>('magnum');

  useEffect(() => {
    if (initialView) {
      setActiveView(initialView);
    }
  }, [initialView]);

  // Active Lottery Category inside Betting view
  const [betLottoCategory, setBetLottoCategory] = useState<LottoCategory>('4D');
  const [bet4DSubMode, setBet4DSubMode] = useState<'single' | 'batch'>('single');

  // Malaysia Time Clock (GMT+8)
  const [mytTime, setMytTime] = useState<string>('');
  
  // Dynamic Live Jackpots
  const [jackpot1, setJackpot1] = useState<number>(6575420);
  const [jackpot2, setJackpot2] = useState<number>(2416230);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const myt = new Date(utc + (3600000 * 8));
      const timeStr = myt.toLocaleTimeString('zh-CN', { hour12: false });
      const dateStr = myt.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
      setMytTime(`${dateStr} ${timeStr} MYT`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Increment jackpots subtly
  useEffect(() => {
    const jInterval = setInterval(() => {
      setJackpot1(prev => prev + Math.floor(Math.random() * 5) + 1);
      setJackpot2(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 3000);
    return () => clearInterval(jInterval);
  }, []);

  // Live Draw Results State for all 7 houses
  const [drawResults, setDrawResults] = useState<Record<LotteryHouse, LotteryDrawResult>>(() => {
    const initialDate = '2026-10-04';
    const drawNo = '5828/26';
    const day = '星期日 / Sun';
    const map = {} as Record<LotteryHouse, LotteryDrawResult>;
    LOTTERY_HOUSES.forEach(h => {
      map[h.id] = generateMockDraw(h.id, drawNo, initialDate, day);
    });
    return map;
  });

  // Simulated Live Ball Draw State
  const [isLiveDrawing, setIsLiveDrawing] = useState<boolean>(false);
  const [liveRollingNumbers, setLiveRollingNumbers] = useState<string>('----');

  // Betting Form State (4D 单注)
  const [betNumber, setBetNumber] = useState<string>('8899');
  const [betBig, setBetBig] = useState<number>(5);
  const [betSmall, setBetSmall] = useState<number>(5);
  const [betSingleA, setBetSingleA] = useState<number>(0);
  const [selectedHousesForBet, setSelectedHousesForBet] = useState<LotteryHouse[]>(['magnum', 'damacai', 'toto']);
  const [dreamSearch, setDreamSearch] = useState<string>('');

  // Betting Form State (4D 批量复式)
  const [multiNumbersText, setMultiNumbersText] = useState<string>('1188, 8899, 9999, 7238');
  const [multiBig, setMultiBig] = useState<number>(2);
  const [multiSmall, setMultiSmall] = useState<number>(2);

  // 5D State
  const [bet5DNumber, setBet5DNumber] = useState<string>('88991');
  const [bet5DAmount, setBet5DAmount] = useState<number>(2);

  // 6D State
  const [bet6DNumber, setBet6DNumber] = useState<string>('889912');
  const [bet6DAmount, setBet6DAmount] = useState<number>(2);

  // User Tickets List (Persisted in localStorage)
  const [tickets, setTickets] = useState<LotteryTicket[]>(() => {
    try {
      const saved = localStorage.getItem('malaysia_4d_tickets');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'MY-TKT-99120',
        drawNo: '5828/26',
        drawDate: '2026-10-04',
        houses: ['magnum', 'damacai'],
        number: '8899',
        bigBet: 10,
        smallBet: 10,
        singleABet: 5,
        totalCost: 50,
        purchaseTime: Date.now() - 3600000 * 3,
        checked: false,
        winAmount: 0,
        winDetails: []
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('malaysia_4d_tickets', JSON.stringify(tickets));
    } catch {
      // ignore
    }
  }, [tickets]);

  // Calculations for Bet 1
  const costPerHouse = betBig + betSmall + betSingleA;
  const totalBetCost = costPerHouse * selectedHousesForBet.length;

  const handleToggleHouseSelection = (h: LotteryHouse) => {
    sound.playChip();
    setSelectedHousesForBet(prev => {
      if (prev.includes(h)) {
        if (prev.length === 1) return prev;
        return prev.filter(item => item !== h);
      }
      return [...prev, h];
    });
  };

  const handleSelectAllHouses = () => {
    sound.playChip();
    setSelectedHousesForBet(LOTTERY_HOUSES.map(h => h.id));
  };

  // Place 4D Bet Ticket (投注1)
  const handlePurchaseTicket1 = () => {
    if (betNumber.length !== 4 || !/^\d{4}$/.test(betNumber)) {
      alert('请输入合法的 4 位纯数字号码（如 8899）！');
      return;
    }
    if (totalBetCost <= 0) {
      alert('请至少下注大万、小万或单A的金额！');
      return;
    }
    if (selectedHousesForBet.length === 0) {
      alert('请至少选择一家开彩博彩公司！');
      return;
    }
    if (wallet.balance < totalBetCost) {
      sound.playLoss();
      alert('可用马币 (RM) 余额不足以购买该彩票，请前往账房充值！');
      return;
    }

    sound.playChip();
    onUpdateWallet(prev => ({
      ...prev,
      balance: prev.balance - totalBetCost,
      totalWagered: prev.totalWagered + totalBetCost
    }));

    const newTicket: LotteryTicket = {
      id: 'MY-TKT-' + Math.floor(100000 + Math.random() * 900000),
      drawNo: '5828/26',
      drawDate: '2026-10-04',
      houses: [...selectedHousesForBet],
      number: betNumber,
      bigBet: betBig,
      smallBet: betSmall,
      singleABet: betSingleA,
      totalCost: totalBetCost,
      purchaseTime: Date.now(),
      checked: false,
      winAmount: 0,
      winDetails: []
    };

    setTickets(prev => [newTicket, ...prev]);
    sound.playCard();
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    alert(`【4D 投注成功】号码 [${betNumber}] 已出票，消费 RM ${totalBetCost}，您可在【收据】中查验！`);
  };

  // Place Batch Bet (投注2)
  const handlePurchaseTicket2 = () => {
    const rawNums = multiNumbersText.split(/[,，\s]+/).filter(s => /^\d{4}$/.test(s));
    if (rawNums.length === 0) {
      alert('请输入合法的4位数字列表（用逗号或空格隔开）！');
      return;
    }
    const costPerNum = (multiBig + multiSmall) * selectedHousesForBet.length;
    const totalCost = costPerNum * rawNums.length;

    if (wallet.balance < totalCost) {
      sound.playLoss();
      alert('马币 (RM) 余额不足以完成批量复式投注！');
      return;
    }

    sound.playChip();
    onUpdateWallet(prev => ({
      ...prev,
      balance: prev.balance - totalCost,
      totalWagered: prev.totalWagered + totalCost
    }));

    const newBatch: LotteryTicket[] = rawNums.map(num => ({
      id: 'MY-TKT-' + Math.floor(100000 + Math.random() * 900000),
      drawNo: '5828/26',
      drawDate: '2026-10-04',
      houses: [...selectedHousesForBet],
      number: num,
      bigBet: multiBig,
      smallBet: multiSmall,
      singleABet: 0,
      totalCost: costPerNum,
      purchaseTime: Date.now(),
      checked: false,
      winAmount: 0,
      winDetails: []
    }));

    setTickets(prev => [...newBatch, ...prev]);
    sound.playCard();
    confetti({ particleCount: 50, spread: 70 });
    alert(`【4D 批量打字成功】共计投注 ${rawNums.length} 组号码，总花费 RM ${totalCost}！`);
  };

  // Place 5D Bet Ticket
  const handlePurchaseTicket5D = () => {
    if (bet5DNumber.length !== 5 || !/^\d{5}$/.test(bet5DNumber)) {
      alert('请输入合法的 5 位纯数字号码（如 88991）！');
      return;
    }
    const cost = bet5DAmount * selectedHousesForBet.length;
    if (cost <= 0) {
      alert('请输入投注金额！');
      return;
    }
    if (wallet.balance < cost) {
      sound.playLoss();
      alert('马币 (RM) 余额不足以投注 5D 彩票！');
      return;
    }

    sound.playChip();
    onUpdateWallet(prev => ({
      ...prev,
      balance: prev.balance - cost,
      totalWagered: prev.totalWagered + cost
    }));

    const newTicket: LotteryTicket = {
      id: '5D-TKT-' + Math.floor(100000 + Math.random() * 900000),
      gameType: '5D',
      drawNo: '5828/26',
      drawDate: '2026-10-04',
      houses: [...selectedHousesForBet],
      number: bet5DNumber,
      bigBet: bet5DAmount,
      smallBet: 0,
      singleABet: 0,
      totalCost: cost,
      purchaseTime: Date.now(),
      checked: false,
      winAmount: 0,
      winDetails: []
    };

    setTickets(prev => [newTicket, ...prev]);
    sound.playCard();
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    alert(`【5D 投注成功】号码 [${bet5DNumber}]，花费 RM ${cost}，头奖最高可得 20,000 倍！`);
  };

  // Place 6D Bet Ticket
  const handlePurchaseTicket6D = () => {
    if (bet6DNumber.length !== 6 || !/^\d{6}$/.test(bet6DNumber)) {
      alert('请输入合法的 6 位纯数字号码（如 889912）！');
      return;
    }
    const cost = bet6DAmount * selectedHousesForBet.length;
    if (cost <= 0) {
      alert('请输入投注金额！');
      return;
    }
    if (wallet.balance < cost) {
      sound.playLoss();
      alert('马币 (RM) 余额不足以投注 6D 彩票！');
      return;
    }

    sound.playChip();
    onUpdateWallet(prev => ({
      ...prev,
      balance: prev.balance - cost,
      totalWagered: prev.totalWagered + cost
    }));

    const newTicket: LotteryTicket = {
      id: '6D-TKT-' + Math.floor(100000 + Math.random() * 900000),
      gameType: '6D',
      drawNo: '5828/26',
      drawDate: '2026-10-04',
      houses: [...selectedHousesForBet],
      number: bet6DNumber,
      bigBet: bet6DAmount,
      smallBet: 0,
      singleABet: 0,
      totalCost: cost,
      purchaseTime: Date.now(),
      checked: false,
      winAmount: 0,
      winDetails: []
    };

    setTickets(prev => [newTicket, ...prev]);
    sound.playCard();
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
    alert(`【6D 投注成功】号码 [${bet6DNumber}]，花费 RM ${cost}，头奖高达 150,000 倍！`);
  };

  // Trigger Instant Live Draw Simulation (时时彩)
  const handleTriggerLiveDraw = () => {
    sound.playChip();
    setIsLiveDrawing(true);

    let count = 0;
    const interval = setInterval(() => {
      sound.playSpinTick();
      setLiveRollingNumbers(generateRandom4D());
      count++;
      if (count > 16) {
        clearInterval(interval);
        // Generate new draw set
        const updatedDraw = generateMockDraw(selectedHouse, '5828/26', '2026-10-04', '星期日 / Sun');
        setDrawResults(prev => ({
          ...prev,
          [selectedHouse]: updatedDraw
        }));
        setIsLiveDrawing(false);
        sound.playWin();
      }
    }, 90);
  };

  // Check Single or All Tickets (中奖结算)
  const handleCheckAllTickets = () => {
    sound.playChip();
    let grandWin = 0;
    const updated = tickets.map(ticket => {
      const result = checkTicketWin(ticket, drawResults);
      if (result.isWin && !ticket.checked) {
        grandWin += result.totalWin;
      }
      return {
        ...ticket,
        checked: true,
        winAmount: result.totalWin,
        winDetails: result.winDetails
      };
    });

    setTickets(updated);

    if (grandWin > 0) {
      sound.playJackpot();
      confetti({ particleCount: 90, spread: 80 });
      onUpdateWallet(prev => ({
        ...prev,
        balance: prev.balance + grandWin,
        totalWon: prev.totalWon + grandWin
      }));
      onRecordGameWin('大马马票4D', 0, grandWin);
      alert(`🎉 恭喜！您的马票击中开彩号码，累计派彩赢取 +RM ${grandWin.toLocaleString()}，已实时结算入账！`);
    } else {
      sound.playLoss();
      alert('已完成自动对奖：当前所选期号未击中大奖，请继续加油！');
    }
  };

  const currentResult = drawResults[selectedHouse];
  const houseInfo = LOTTERY_HOUSES.find(h => h.id === selectedHouse) || LOTTERY_HOUSES[0];

  const filteredDreams = dreamSearch
    ? DREAM_DICTIONARY.filter(d => d.keyword.includes(dreamSearch) || d.number.includes(dreamSearch))
    : DREAM_DICTIONARY.slice(0, 8);

  return (
    <div className={`w-full ${activeView === 'betting' ? 'max-w-4xl' : 'max-w-2xl'} mx-auto space-y-4 font-sans text-neutral-100 transition-all duration-300`}>
      {/* 1. App Top Header Bar (eKOR Branding & View Switcher) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-neutral-900/90 border border-amber-500/20 rounded-2xl shadow-md backdrop-blur">
        <div className="flex items-center gap-2">
          {onBackToLobby && (
            <button
              onClick={() => {
                sound.playChip();
                onBackToLobby();
              }}
              className="p-1.5 text-neutral-400 hover:text-amber-300 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              title="返回娱乐城大厅"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => {
              sound.playChip();
              setActiveView('dashboard');
            }}
            className="font-cinzel text-xl font-black tracking-wider text-amber-400 flex items-center gap-1.5 cursor-pointer text-left"
          >
            <span className="text-2xl font-black text-amber-300">e</span>
            <span className="text-white tracking-widest font-extrabold">KOR</span>
            <span className="text-[10px] text-amber-400/80 font-mono font-normal ml-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
              4D PRO
            </span>
          </button>
        </div>

        {/* View Switcher: 开彩大厅 vs 独立投注中心 */}
        <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
          <button
            type="button"
            onClick={() => {
              sound.playChip();
              setActiveView('dashboard');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'dashboard'
                ? 'bg-amber-400 text-neutral-950 font-black shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            开彩大厅
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playChip();
              setActiveView('betting');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'betting'
                ? 'bg-amber-400 text-neutral-950 font-black shadow'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>独立投注中心</span>
            <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
              activeView === 'betting' ? 'bg-neutral-950 text-amber-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              4D·5D·6D
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="hidden sm:inline">{mytTime}</span>
        </div>
      </div>

      {/* ========================================================
          1. DASHBOARD VIEW (独立大厅主页：包含信用卡片、6宫格、双彩池、开彩看板、官方赔率表)
          ======================================================== */}
      {activeView === 'dashboard' && (
        <div className="space-y-4">
          {/* 2. Top Balance Card (Preserving our Dark Luxury Gold Colors) */}
          <div className="relative rounded-3xl p-5 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border-2 border-amber-500/40 shadow-2xl overflow-hidden space-y-3">
        {/* Subtle background glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Marquee Broadcast Banner */}
        <div className="flex items-center gap-2 text-[11px] text-amber-300/90 bg-neutral-950/80 px-3 py-1.5 rounded-full border border-amber-500/20 overflow-hidden">
          <Sparkles className="w-3 h-3 text-amber-400 shrink-0 animate-pulse" />
          <div className="overflow-hidden whitespace-nowrap text-ellipsis flex-1">
            温馨提示：大马各大合法博彩公司开奖实时开出，中奖奖金将按时自动派发清算至信用余额，支持极速结算 · The winning prizes will be paid on time.
          </div>
        </div>

        {/* Credit Balance Area */}
        <div className="flex items-center justify-between pt-1">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs text-neutral-400 font-semibold tracking-wide">
              <span>信用余额:</span>
              <button
                onClick={() => sound.playChip()}
                className="text-amber-400 hover:rotate-180 transition-transform cursor-pointer"
                title="刷新余额"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono-nums font-bold text-amber-400 text-sm">RM</span>
              <span className="font-mono-nums font-black text-3xl sm:text-4xl text-neutral-100 tracking-tight">
                {wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-300 flex items-center justify-center font-black text-2xl text-neutral-950 shadow-lg">
            e
          </div>
        </div>

        {/* 3. 6 Action Grid Tiles (2 Rows x 3 Columns as in reference) */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          {/* Tile 1: 投注 (点击进去可选 4D, 5D, 6D 选项) */}
          <button
            type="button"
            onClick={() => {
              sound.playChip();
              setActiveView('betting');
            }}
            className="p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 relative group bg-neutral-900/90 hover:bg-neutral-850 border-neutral-700/80 text-neutral-100 hover:border-amber-400/60 shadow"
          >
            <div className="relative">
              <Ticket className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1.5 -right-3 text-[9px] px-1 py-0.2 rounded-full font-bold bg-amber-500 text-neutral-950">
                4D·5D·6D
              </span>
            </div>
            <span className="text-xs font-black">投注中心</span>
          </button>

          {/* Tile 2: 时时彩 (Live Lucky 4D) with NEW ribbon */}
          <button
            type="button"
            onClick={() => {
              sound.playChip();
              setActiveView('live_draw');
              handleTriggerLiveDraw();
            }}
            className="p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 relative overflow-hidden group bg-neutral-900/90 hover:bg-neutral-850 border-neutral-700/80 text-neutral-100 hover:border-amber-400/60 shadow"
          >
            {/* NEW Ribbon */}
            <div className="absolute -top-1.5 -left-1.5 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-br shadow transform -rotate-12">
              NEW
            </div>
            <Gauge className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">时时彩</span>
          </button>

          {/* Tile 3: 开彩成绩 (Results) */}
          <button
            type="button"
            onClick={() => {
              sound.playChip();
              setActiveView('results');
            }}
            className="p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 relative group bg-neutral-900/90 hover:bg-neutral-850 border-neutral-700/80 text-neutral-100 hover:border-amber-400/60 shadow"
          >
            <Trophy className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">开彩成绩</span>
          </button>

          {/* Tile 4: 收据 (Receipts) */}
          <button
            type="button"
            onClick={() => {
              sound.playChip();
              setActiveView('receipts');
            }}
            className="p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 relative group bg-neutral-900/90 hover:bg-neutral-850 border-neutral-700/80 text-neutral-100 hover:border-amber-400/60 shadow"
          >
            <FileText className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">收据 ({tickets.length})</span>
          </button>

          {/* Tile 5: 中奖对奖 (Winnings) */}
          <button
            type="button"
            onClick={() => {
              sound.playChip();
              setActiveView('winnings');
              handleCheckAllTickets();
            }}
            className="p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 relative group bg-neutral-900/90 hover:bg-neutral-850 border-neutral-700/80 text-neutral-100 hover:border-amber-400/60 shadow"
          >
            <Coins className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">中奖对奖</span>
          </button>

          {/* Tile 6: 万字梦册 (Dream Book) */}
          <button
            type="button"
            onClick={() => {
              sound.playChip();
              setActiveView('dream_book');
            }}
            className="p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 relative group bg-neutral-900/90 hover:bg-neutral-850 border-neutral-700/80 text-neutral-100 hover:border-amber-400/60 shadow"
          >
            <BookOpen className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">万字梦册</span>
          </button>
        </div>
      </div>

      {/* 4. Dual Jackpot Banners (As in reference image) */}
      <div className="space-y-2">
        {/* Banner 1: Hari Hari Jackpot */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-cyan-950 via-neutral-900 to-blue-950 border border-cyan-500/40 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-xs font-bold text-cyan-300">
              4D
            </div>
            <div>
              <span className="text-[10px] text-cyan-400/80 font-mono block">01 OCT 2026 JACKPOT</span>
              <span className="font-cinzel text-xs font-black text-cyan-300 tracking-wider">HARI HARI 4D</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono-nums font-black text-amber-400 text-sm sm:text-base tracking-wider">
              RM {jackpot1.toLocaleString()}
            </span>
            <span className="p-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs">
              1L
            </span>
          </div>
        </div>

        {/* Banner 2: Supreme Toto / Magnum Jackpot */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-purple-950 via-neutral-900 to-indigo-950 border border-purple-500/40 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-400/50 flex items-center justify-center text-xs font-bold text-purple-300">
              W
            </div>
            <div>
              <span className="text-[10px] text-purple-400/80 font-mono block">01 OCT 2026 JACKPOT</span>
              <span className="font-cinzel text-xs font-black text-purple-300 tracking-wider">SUPREME JACKPOT</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono-nums font-black text-amber-400 text-sm sm:text-base tracking-wider">
              RM {jackpot2.toLocaleString()}
            </span>
            <span className="p-1 rounded-full bg-purple-500/20 text-purple-300 text-xs">
              1L
            </span>
          </div>
        </div>
      </div>

      {/* 4.5. Live Draw Results Board on Dashboard */}
      <div className="rounded-2xl border border-amber-500/40 bg-neutral-900/95 p-4 shadow-xl space-y-3">
          {/* Header & House Selector */}
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="font-cinzel text-xs font-bold text-amber-300">
                大马各博彩公司今日开彩号码
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">
              期号 {currentResult.drawNo} · {currentResult.drawDate}
            </span>
          </div>

          {/* House Badges Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {LOTTERY_HOUSES.map(h => (
              <button
                key={h.id}
                type="button"
                onClick={() => {
                  sound.playChip();
                  setSelectedHouse(h.id);
                }}
                className={`py-1 px-2.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  selectedHouse === h.id
                    ? 'bg-amber-400 text-neutral-950 font-black shadow'
                    : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {h.name}
              </button>
            ))}
          </div>

          {/* Top 3 Winning Numbers */}
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2.5 bg-neutral-950 rounded-xl border border-amber-500/50 shadow-inner">
              <span className="text-[10px] text-amber-400 font-bold block">头奖 (1st)</span>
              <span className="font-mono-nums text-xl font-black text-amber-300 tracking-wider">
                {currentResult.firstPrize}
              </span>
              <span className="text-[9px] text-amber-500/80 block font-mono">RM 3,500</span>
            </div>

            <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-700 shadow-inner">
              <span className="text-[10px] text-neutral-300 font-bold block">2奖 (2nd)</span>
              <span className="font-mono-nums text-xl font-black text-neutral-100 tracking-wider">
                {currentResult.secondPrize}
              </span>
              <span className="text-[9px] text-neutral-400 block font-mono">RM 1,100</span>
            </div>

            <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-700 shadow-inner">
              <span className="text-[10px] text-amber-600 font-bold block">3奖 (3rd)</span>
              <span className="font-mono-nums text-xl font-black text-amber-500 tracking-wider">
                {currentResult.thirdPrize}
              </span>
              <span className="text-[9px] text-amber-600/80 block font-mono">RM 550</span>
            </div>
          </div>

          {/* 入围 (10 sets) */}
          <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300">入围 (Starter · 10组)</span>
              <span className="text-[9px] font-mono text-amber-400 px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">
                价格 RM 240
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-center font-mono-nums font-bold text-xs text-neutral-200">
              {currentResult.specialPrizes.map((num, idx) => (
                <div key={idx} className="py-1 bg-neutral-900 rounded border border-neutral-800">
                  {num}
                </div>
              ))}
            </div>
          </div>

          {/* 安慰奖 (10 sets) */}
          <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-400">安慰奖 (Consolation · 10组)</span>
              <span className="text-[9px] font-mono text-neutral-400 px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-700">
                价格 RM 70
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-center font-mono-nums font-bold text-xs text-neutral-300">
              {currentResult.consolationPrizes.map((num, idx) => (
                <div key={idx} className="py-1 bg-neutral-900 rounded border border-neutral-800">
                  {num}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Bet Button directly for this house */}
          <button
            type="button"
            onClick={() => {
              sound.playChip();
              setSelectedHousesForBet([selectedHouse]);
              setActiveView('betting');
            }}
            className="w-full py-2 text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>进入投注 [{houseInfo.name}] (可选 4D / 5D / 6D)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 5. The Exact Three-Tier Odds Tables from Reference Image (Dark-Gold Luxury Styling) */}
        <div className="space-y-4 pt-1">
          {/* Table 1: #4D 标准盘 (Exact Odds from uploaded image & user request) */}
          <div className="rounded-2xl border border-amber-500/40 bg-neutral-900/95 overflow-hidden shadow-xl">
            {/* Header Bar */}
            <div className="grid grid-cols-6 text-center text-xs font-black tracking-wider py-2.5 bg-neutral-800 text-amber-300 border-b border-amber-500/30">
              <div>#4D</div>
              <div>B</div>
              <div>S</div>
              <div>SA-B-C-D-E</div>
              <div>3A</div>
              <div>3C</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-neutral-800/80 text-xs font-mono font-bold text-center">
              {/* 头奖 */}
              <div className="grid grid-cols-6 py-2.5 items-center hover:bg-neutral-800/40 transition-colors">
                <span className="text-neutral-200 font-sans font-semibold">头奖</span>
                <span className="text-amber-400">3500</span>
                <span className="text-blue-300">5000</span>
                <span className="text-amber-300">8300</span>
                <span className="text-neutral-200">840</span>
                <span className="text-neutral-200">280</span>
              </div>

              {/* 2奖 */}
              <div className="grid grid-cols-6 py-2.5 items-center hover:bg-neutral-800/40 transition-colors">
                <span className="text-neutral-200 font-sans font-semibold">2奖</span>
                <span className="text-amber-400">1100</span>
                <span className="text-blue-300">2200</span>
                <span className="text-amber-300">8300</span>
                <span className="text-neutral-600">-</span>
                <span className="text-neutral-200">280</span>
              </div>

              {/* 3奖 */}
              <div className="grid grid-cols-6 py-2.5 items-center hover:bg-neutral-800/40 transition-colors">
                <span className="text-neutral-200 font-sans font-semibold">3奖</span>
                <span className="text-amber-400">550</span>
                <span className="text-blue-300">1100</span>
                <span className="text-amber-300">8300</span>
                <span className="text-neutral-600">-</span>
                <span className="text-neutral-200">280</span>
              </div>

              {/* 入围 */}
              <div className="grid grid-cols-6 py-2.5 items-center hover:bg-neutral-800/40 transition-colors">
                <span className="text-amber-300 font-sans font-semibold">入围</span>
                <span className="text-amber-400">240</span>
                <span className="text-neutral-600">-</span>
                <span className="text-amber-300/80">830</span>
                <span className="text-neutral-600">-</span>
                <span className="text-neutral-600">-</span>
              </div>

              {/* 安慰奖 */}
              <div className="grid grid-cols-6 py-2.5 items-center hover:bg-neutral-800/40 transition-colors">
                <span className="text-neutral-400 font-sans font-semibold">安慰奖</span>
                <span className="text-amber-400">70</span>
                <span className="text-neutral-600">-</span>
                <span className="text-amber-300/80">830</span>
                <span className="text-neutral-600">-</span>
                <span className="text-neutral-600">-</span>
              </div>
            </div>
          </div>

          {/* Table 2: SPR 特别盘 (Singapore / Special Package) */}
          <div className="rounded-2xl border border-red-500/40 bg-neutral-900/95 overflow-hidden shadow-xl">
            {/* Header Bar */}
            <div className="grid grid-cols-6 text-center text-xs font-black tracking-wider py-2.5 bg-red-950/60 text-red-300 border-b border-red-500/30">
              <div>SPR</div>
              <div>B</div>
              <div>S</div>
              <div>SA-B-C-D-E</div>
              <div>3A</div>
              <div>3C</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-neutral-800/80 text-xs font-mono font-bold text-center">
              {/* 头奖 */}
              <div className="grid grid-cols-6 py-2.5 items-center hover:bg-neutral-800/40 transition-colors">
                <span className="text-neutral-200 font-sans font-semibold">头奖</span>
                <span className="text-red-300">3000</span>
                <span className="text-blue-300">4000</span>
                <span className="text-red-300">7000</span>
                <span className="text-neutral-200">750</span>
                <span className="text-neutral-200">250</span>
              </div>

              {/* 2奖 */}
              <div className="grid grid-cols-6 py-2.5 items-center hover:bg-neutral-800/40 transition-colors">
                <span className="text-neutral-200 font-sans font-semibold">2奖</span>
                <span className="text-red-300">1000</span>
                <span className="text-blue-300">2000</span>
                <span className="text-red-300">7000</span>
                <span className="text-neutral-600">-</span>
                <span className="text-neutral-200">250</span>
              </div>

              {/* 3奖 */}
              <div className="grid grid-cols-6 py-2.5 items-center hover:bg-neutral-800/40 transition-colors">
                <span className="text-neutral-200 font-sans font-semibold">3奖</span>
                <span className="text-red-300">500</span>
                <span className="text-blue-300">1000</span>
                <span className="text-red-300">7000</span>
                <span className="text-neutral-600">-</span>
                <span className="text-neutral-200">250</span>
              </div>

              {/* 入围 */}
              <div className="grid grid-cols-6 py-2.5 items-center hover:bg-neutral-800/40 transition-colors">
                <span className="text-red-300 font-sans font-semibold">入围</span>
                <span className="text-red-300">200</span>
                <span className="text-neutral-600">-</span>
                <span className="text-red-300/80">700</span>
                <span className="text-neutral-600">-</span>
                <span className="text-neutral-600">-</span>
              </div>

              {/* 安慰奖 */}
              <div className="grid grid-cols-6 py-2.5 items-center hover:bg-neutral-800/40 transition-colors">
                <span className="text-neutral-400 font-sans font-semibold">安慰奖</span>
                <span className="text-red-300">60</span>
                <span className="text-neutral-600">-</span>
                <span className="text-red-300/80">700</span>
                <span className="text-neutral-600">-</span>
                <span className="text-neutral-600">-</span>
              </div>
            </div>
          </div>

          {/* Table 3: #5D & #6D 玩法 (Side-by-side as in reference image) */}
          <div className="grid grid-cols-2 gap-3">
            {/* #5D Table */}
            <div className="rounded-2xl border border-amber-600/40 bg-neutral-900/95 overflow-hidden shadow-xl">
              <div className="grid grid-cols-2 text-center text-xs font-black tracking-wider py-2.5 bg-amber-950/60 text-amber-300 border-b border-amber-500/30">
                <div>#5D</div>
                <div>PRIZE</div>
              </div>
              <div className="divide-y divide-neutral-800/80 text-xs font-mono font-bold text-center">
                {MALAYSIA_4D_ODDS.fiveD.map(item => (
                  <div key={item.rank} className="grid grid-cols-2 py-2 items-center hover:bg-neutral-800/40 transition-colors">
                    <span className="text-neutral-300 font-sans font-medium">{item.rank}</span>
                    <span className="text-amber-400 font-mono-nums">{item.prize.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* #6D Table */}
            <div className="rounded-2xl border border-purple-600/40 bg-neutral-900/95 overflow-hidden shadow-xl">
              <div className="grid grid-cols-2 text-center text-xs font-black tracking-wider py-2.5 bg-purple-950/60 text-purple-300 border-b border-purple-500/30">
                <div>#6D</div>
                <div>PRIZE</div>
              </div>
              <div className="divide-y divide-neutral-800/80 text-xs font-mono font-bold text-center">
                {MALAYSIA_4D_ODDS.sixD.map(item => (
                  <div key={item.rank} className="grid grid-cols-2 py-2 items-center hover:bg-neutral-800/40 transition-colors">
                    <span className="text-neutral-300 font-sans font-medium">{item.rank}</span>
                    <span className="text-purple-300 font-mono-nums">{item.prize.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* ========================================================
          2. STANDALONE BETTING CENTER VIEW (独立的一面：4D / 5D / 6D 官方投注大厅)
          ======================================================== */}
      {activeView === 'betting' && (
        <div className="p-4 sm:p-6 rounded-3xl bg-neutral-900 border-2 border-amber-500/40 shadow-2xl space-y-5">
          {/* Dedicated Header for Standalone Betting View */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  sound.playChip();
                  setActiveView('dashboard');
                }}
                className="px-3 py-1.5 text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all cursor-pointer shadow flex items-center gap-1.5 text-xs font-bold"
                title="返回开彩大厅"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>返回大厅</span>
              </button>
              <div>
                <h2 className="font-cinzel font-bold text-base sm:text-lg text-amber-300 flex items-center gap-2">
                  <span>马票独立投注中心</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
                    独立一面
                  </span>
                </h2>
                <p className="text-[11px] text-neutral-400">
                  全马合法博彩同步 · 4D 万字 · 5D 五字彩 · 6D 六字彩
                </p>
              </div>
            </div>

            {/* Right side balance & actions */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-[10px] text-neutral-400 font-medium">可用余额:</span>
                <span className="font-mono-nums font-bold text-amber-300 text-xs sm:text-sm">
                  RM {wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {onOpenCashier && (
                  <button
                    onClick={() => {
                      sound.playChip();
                      onOpenCashier();
                    }}
                    className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[10px] font-bold rounded cursor-pointer transition-colors"
                  >
                    + 充值
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  sound.playChip();
                  setActiveView('receipts');
                }}
                className="text-xs text-neutral-300 hover:text-white px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition-colors border border-neutral-700 font-semibold cursor-pointer flex items-center gap-1"
                title="查看已购票据"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">收据 ({tickets.length})</span>
              </button>
            </div>
          </div>

          {/* 4D / 5D / 6D Segmented Switcher */}
          <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-neutral-950 rounded-2xl border border-neutral-800">
            <button
              type="button"
              onClick={() => {
                sound.playChip();
                setBetLottoCategory('4D');
              }}
              className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                betLottoCategory === '4D'
                  ? 'bg-amber-400 text-neutral-950 font-black shadow-lg scale-[1.02]'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>#4D 万字</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playChip();
                setBetLottoCategory('5D');
              }}
              className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                betLottoCategory === '5D'
                  ? 'bg-amber-400 text-neutral-950 font-black shadow-lg scale-[1.02]'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>#5D 五字彩</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playChip();
                setBetLottoCategory('6D');
              }}
              className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                betLottoCategory === '6D'
                  ? 'bg-amber-400 text-neutral-950 font-black shadow-lg scale-[1.02]'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>#6D 六字彩</span>
            </button>
          </div>

          {/* OPTION 1: 4D BETTING */}
          {betLottoCategory === '4D' && (
            <div className="space-y-4">
              {/* Sub-mode: Single / Batch */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { sound.playChip(); setBet4DSubMode('single'); }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    bet4DSubMode === 'single'
                      ? 'bg-neutral-800 text-amber-300 border-amber-500/50'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                  }`}
                >
                  单注快速打字
                </button>
                <button
                  type="button"
                  onClick={() => { sound.playChip(); setBet4DSubMode('batch'); }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    bet4DSubMode === 'batch'
                      ? 'bg-neutral-800 text-amber-300 border-amber-500/50'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                  }`}
                >
                  批量复式包字
                </button>
              </div>

              {bet4DSubMode === 'single' ? (
                /* 4D Single Mode */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-300">
                      输入 4 位万字号码
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playChip();
                        setBetNumber(generateRandom4D());
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> 机选号码
                    </button>
                  </div>

                  <input
                    type="text"
                    maxLength={4}
                    value={betNumber}
                    onChange={(e) => setBetNumber(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full bg-neutral-950 border-2 border-amber-500/60 rounded-2xl py-3 px-4 text-center font-mono-nums font-black text-3xl sm:text-4xl text-amber-400 tracking-widest focus:outline-none focus:border-amber-300 shadow-inner"
                    placeholder="8899"
                  />

                  {/* Quick Amounts */}
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                      <span className="text-[11px] font-bold text-amber-300 block">大万 (B) [RM]</span>
                      <input
                        type="number"
                        min={0}
                        value={betBig}
                        onChange={(e) => setBetBig(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 font-mono text-center font-bold text-neutral-100"
                      />
                      <span className="text-[9px] text-amber-400/90 block">头 RM3500/2奖 RM1100/3奖 RM550/入围 RM240/安慰 RM70</span>
                    </div>

                    <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                      <span className="text-[11px] font-bold text-blue-300 block">小万 (S) [RM]</span>
                      <input
                        type="number"
                        min={0}
                        value={betSmall}
                        onChange={(e) => setBetSmall(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 font-mono text-center font-bold text-neutral-100"
                      />
                      <span className="text-[9px] text-blue-400/90 block">头 RM5000/2奖 RM2200/3奖 RM1100</span>
                    </div>

                    <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                      <span className="text-[11px] font-bold text-red-300 block">单A (SA) [RM]</span>
                      <input
                        type="number"
                        min={0}
                        value={betSingleA}
                        onChange={(e) => setBetSingleA(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 font-mono text-center font-bold text-neutral-100"
                      />
                      <span className="text-[9px] text-neutral-500 block">独占 RM 8300</span>
                    </div>
                  </div>

                  {/* Select Companies */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-neutral-300 font-semibold">选择博彩公司：</span>
                      <button
                        type="button"
                        onClick={handleSelectAllHouses}
                        className="text-xs text-amber-400 font-bold"
                      >
                        一键全选
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {LOTTERY_HOUSES.map(h => {
                        const selected = selectedHousesForBet.includes(h.id);
                        return (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => handleToggleHouseSelection(h.id)}
                            className={`p-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                              selected
                                ? 'bg-amber-400 text-neutral-950 border-amber-300'
                                : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                            }`}
                          >
                            {h.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePurchaseTicket1}
                    className="w-full py-3.5 text-sm font-black text-neutral-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-xl shadow-xl hover:from-amber-300 hover:to-amber-400 cursor-pointer mt-2"
                  >
                    立即打字下单 (实付 RM {totalBetCost})
                  </button>
                </div>
              ) : (
                /* 4D Batch Mode */
                <div className="space-y-3">
                  <label className="text-xs font-bold text-neutral-300 block">
                    输入多个 4D 号码（用逗号或空格分隔）
                  </label>
                  <textarea
                    rows={3}
                    value={multiNumbersText}
                    onChange={(e) => setMultiNumbersText(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 font-mono text-sm text-neutral-200 focus:outline-none focus:border-amber-400"
                    placeholder="1188, 8899, 9999, 7238"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                      <span className="text-xs font-bold text-amber-300 block">每号大万 (B)</span>
                      <input
                        type="number"
                        min={0}
                        value={multiBig}
                        onChange={(e) => setMultiBig(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 font-mono text-center font-bold text-neutral-100"
                      />
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                      <span className="text-xs font-bold text-blue-300 block">每号小万 (S)</span>
                      <input
                        type="number"
                        min={0}
                        value={multiSmall}
                        onChange={(e) => setMultiSmall(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 font-mono text-center font-bold text-neutral-100"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePurchaseTicket2}
                    className="w-full py-3.5 text-sm font-black text-neutral-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-xl shadow-xl hover:from-amber-300 hover:to-amber-400 cursor-pointer mt-2"
                  >
                    确认批量出票
                  </button>
                </div>
              )}
            </div>
          )}

          {/* OPTION 2: 5D BETTING */}
          {betLottoCategory === '5D' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between text-xs">
                <span className="text-amber-300 font-semibold">Sports Toto 5D · 经典五字彩玩法</span>
                <span className="font-mono text-neutral-400">头奖高达 RM 20,000</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-300">
                    输入 5 位纯数字号码 (00000 - 99999)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playChip();
                      setBet5DNumber(generateRandom5D());
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> 机选 5D 号码
                  </button>
                </div>

                <input
                  type="text"
                  maxLength={5}
                  value={bet5DNumber}
                  onChange={(e) => setBet5DNumber(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  className="w-full bg-neutral-950 border-2 border-amber-500/60 rounded-2xl py-3 px-4 text-center font-mono-nums font-black text-3xl sm:text-4xl text-amber-400 tracking-widest focus:outline-none focus:border-amber-300 shadow-inner"
                  placeholder="88991"
                />

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-300">每注投注金额 (RM)</span>
                    <span className="text-xs font-mono font-bold text-amber-400">RM {bet5DAmount}</span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={bet5DAmount}
                    onChange={(e) => setBet5DAmount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 font-mono text-center font-bold text-neutral-100"
                  />
                </div>

                {/* 5D Prize Ladder preview */}
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
                  <div className="font-bold text-amber-300 text-[11px] pb-1 border-b border-neutral-900">
                    5D 统一中奖派彩奖金表 (RM)
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center font-mono text-[11px]">
                    <div className="p-1.5 bg-neutral-900 rounded">
                      <span className="text-neutral-400 block text-[9px]">头奖</span>
                      <span className="font-bold text-amber-400">RM 20,000</span>
                    </div>
                    <div className="p-1.5 bg-neutral-900 rounded">
                      <span className="text-neutral-400 block text-[9px]">二奖</span>
                      <span className="font-bold text-slate-200">RM 10,000</span>
                    </div>
                    <div className="p-1.5 bg-neutral-900 rounded">
                      <span className="text-neutral-400 block text-[9px]">三奖</span>
                      <span className="font-bold text-amber-600">RM 5,000</span>
                    </div>
                    <div className="p-1.5 bg-neutral-900 rounded">
                      <span className="text-neutral-400 block text-[9px]">四奖</span>
                      <span className="font-bold text-neutral-300">RM 800</span>
                    </div>
                    <div className="p-1.5 bg-neutral-900 rounded">
                      <span className="text-neutral-400 block text-[9px]">五奖</span>
                      <span className="font-bold text-neutral-300">RM 80</span>
                    </div>
                    <div className="p-1.5 bg-neutral-900 rounded">
                      <span className="text-neutral-400 block text-[9px]">六奖</span>
                      <span className="font-bold text-neutral-300">RM 8</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePurchaseTicket5D}
                  className="w-full py-3.5 text-sm font-black text-neutral-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-xl shadow-xl hover:from-amber-300 hover:to-amber-400 cursor-pointer"
                >
                  确认投注 5D 五字彩 (实付 RM {bet5DAmount * selectedHousesForBet.length})
                </button>
              </div>
            </div>
          )}

          {/* OPTION 3: 6D BETTING */}
          {betLottoCategory === '6D' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between text-xs">
                <span className="text-purple-300 font-semibold">Sports Toto 6D · 终极大奖六字彩</span>
                <span className="font-mono text-neutral-400">头奖高达 RM 150,000</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-300">
                    输入 6 位纯数字号码 (000000 - 999999)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playChip();
                      setBet6DNumber(generateRandom6D());
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> 机选 6D 号码
                  </button>
                </div>

                <input
                  type="text"
                  maxLength={6}
                  value={bet6DNumber}
                  onChange={(e) => setBet6DNumber(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-neutral-950 border-2 border-purple-500/60 rounded-2xl py-3 px-4 text-center font-mono-nums font-black text-3xl sm:text-4xl text-purple-300 tracking-widest focus:outline-none focus:border-purple-300 shadow-inner"
                  placeholder="889912"
                />

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-300">每注投注金额 (RM)</span>
                    <span className="text-xs font-mono font-bold text-purple-300">RM {bet6DAmount}</span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={bet6DAmount}
                    onChange={(e) => setBet6DAmount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 font-mono text-center font-bold text-neutral-100"
                  />
                </div>

                {/* 6D Prize Ladder preview */}
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
                  <div className="font-bold text-purple-300 text-[11px] pb-1 border-b border-neutral-900">
                    6D 统一中奖派彩奖金表 (RM)
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-center font-mono text-[11px]">
                    <div className="p-1.5 bg-neutral-900 rounded">
                      <span className="text-neutral-400 block text-[9px]">头奖 (6对准)</span>
                      <span className="font-bold text-purple-300">RM 150,000</span>
                    </div>
                    <div className="p-1.5 bg-neutral-900 rounded">
                      <span className="text-neutral-400 block text-[9px]">二奖 (5对准)</span>
                      <span className="font-bold text-slate-200">RM 5,000</span>
                    </div>
                    <div className="p-1.5 bg-neutral-900 rounded">
                      <span className="text-neutral-400 block text-[9px]">三奖 (4对准)</span>
                      <span className="font-bold text-amber-600">RM 500</span>
                    </div>
                    <div className="p-1.5 bg-neutral-900 rounded">
                      <span className="text-neutral-400 block text-[9px]">四奖 (3对准)</span>
                      <span className="font-bold text-neutral-300">RM 50</span>
                    </div>
                    <div className="p-1.5 bg-neutral-900 rounded">
                      <span className="text-neutral-400 block text-[9px]">五奖 (2对准)</span>
                      <span className="font-bold text-neutral-300">RM 5</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePurchaseTicket6D}
                  className="w-full py-3.5 text-sm font-black text-neutral-950 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 rounded-xl shadow-xl hover:from-purple-300 hover:to-purple-400 cursor-pointer"
                >
                  确认投注 6D 六字彩 (实付 RM {bet6DAmount * selectedHousesForBet.length})
                </button>
              </div>
            </div>
          )}

          {/* Recent Slips Drawer inside standalone terminal */}
          {tickets.length > 0 && (
            <div className="pt-3 border-t border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 font-bold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>本期已出票注单 (最新 {Math.min(3, tickets.length)} 张)</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    sound.playChip();
                    setActiveView('receipts');
                  }}
                  className="text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                >
                  查看全部收据单据 ({tickets.length}) &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {tickets.slice(0, 3).map(t => (
                  <div key={t.id} className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-mono font-bold text-amber-400 text-base">{t.number}</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">{t.gameType} · {new Date(t.purchaseTime).toLocaleTimeString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-neutral-200 font-bold">RM {t.totalCost.toLocaleString()}</div>
                      <div className="text-[10px] text-emerald-400 font-medium">✓ 已成功出票</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: LIVE DRAW (时时彩现场摇奖) */}
      {activeView === 'live_draw' && (
        <div className="p-5 rounded-3xl bg-neutral-900 border border-amber-500/40 shadow-2xl space-y-4 text-center">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <span className="font-cinzel font-bold text-amber-300">
              时时彩 · 极速现场开彩
            </span>
            <button
              onClick={() => setActiveView('dashboard')}
              className="text-xs text-neutral-400 hover:text-white"
            >
              返回主页
            </button>
          </div>

          <div className="p-8 rounded-2xl bg-neutral-950 border-2 border-amber-500/50 shadow-inner space-y-3">
            <div className="text-xs text-neutral-400 font-mono">
              当前开彩公司: {houseInfo.name} · 期号 5828/26
            </div>
            <div className="font-mono-nums font-black text-5xl sm:text-6xl text-amber-400 tracking-widest drop-shadow animate-pulse py-2">
              {liveRollingNumbers}
            </div>
            <div className="text-xs text-emerald-400">
              {isLiveDrawing ? '摇球机高速运转中...' : '🎉 摇奖完成！最新成绩已写入全网系统'}
            </div>
          </div>

          <button
            onClick={handleTriggerLiveDraw}
            disabled={isLiveDrawing}
            className="py-3 px-6 text-sm font-bold text-neutral-950 bg-gradient-to-r from-red-500 to-amber-400 rounded-xl shadow cursor-pointer disabled:opacity-50"
          >
            再次极速摇奖
          </button>
        </div>
      )}

      {/* VIEW: RECEIPTS (收据打字单) */}
      {activeView === 'receipts' && (
        <div className="p-5 rounded-3xl bg-neutral-900 border border-amber-500/40 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <span className="font-cinzel font-bold text-amber-300">
              我的马票收据单据库 ({tickets.length} 张)
            </span>
            <button
              onClick={() => setActiveView('dashboard')}
              className="text-xs text-neutral-400 hover:text-white"
            >
              关闭
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto no-scrollbar">
            {tickets.map(t => (
              <div key={t.id} className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-mono font-bold text-amber-400 text-lg">{t.number}</div>
                  <div className="text-neutral-500 text-[10px]">{t.id} · {new Date(t.purchaseTime).toLocaleTimeString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-neutral-200">RM {t.totalCost.toLocaleString()}</div>
                  <div className="text-[10px] text-amber-500">{t.checked ? (t.winAmount > 0 ? `中奖 +RM ${t.winAmount.toLocaleString()}` : '未中奖') : '待开彩'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: RESULTS (开彩成绩) */}
      {activeView === 'results' && (
        <div className="p-5 rounded-3xl bg-neutral-900 border-2 border-amber-500/40 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <span className="font-cinzel font-bold text-base text-amber-300 block">
                各大博彩公司最新开彩成绩
              </span>
              <span className="text-[11px] text-neutral-400">
                同步大马官方开彩 · 头奖3500 / 2奖1100 / 3奖550 / 入围240 / 安慰70
              </span>
            </div>
            <button
              onClick={() => setActiveView('dashboard')}
              className="text-xs text-neutral-400 hover:text-white px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors"
            >
              返回主页
            </button>
          </div>

          {/* House Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {LOTTERY_HOUSES.map(h => (
              <button
                key={h.id}
                onClick={() => {
                  sound.playChip();
                  setSelectedHouse(h.id);
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  selectedHouse === h.id
                    ? 'bg-amber-400 text-neutral-950 font-black shadow-md'
                    : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
                }`}
              >
                {h.name}
              </button>
            ))}
          </div>

          {/* Draw Info */}
          <div className="flex items-center justify-between text-xs text-neutral-400 px-1 font-mono">
            <span>公司: {houseInfo.name} ({houseInfo.enName})</span>
            <span>期号: {currentResult.drawNo} · {currentResult.drawDate}</span>
          </div>

          {/* Top 3 Prizes */}
          <div className="grid grid-cols-3 gap-3 text-center pt-1">
            <div className="p-3.5 bg-neutral-950 rounded-2xl border-2 border-amber-500/60 shadow-lg">
              <span className="text-[11px] text-amber-400 font-bold block mb-1">头奖 (1st Prize)</span>
              <span className="font-mono-nums text-2xl sm:text-3xl font-black text-amber-300 tracking-wider">
                {currentResult.firstPrize}
              </span>
              <span className="text-[9px] text-amber-500/80 block mt-1">派彩 RM 3,500</span>
            </div>

            <div className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-700 shadow-md">
              <span className="text-[11px] text-neutral-300 font-bold block mb-1">2奖 (2nd Prize)</span>
              <span className="font-mono-nums text-2xl sm:text-3xl font-black text-neutral-100 tracking-wider">
                {currentResult.secondPrize}
              </span>
              <span className="text-[9px] text-neutral-400 block mt-1">派彩 RM 1,100</span>
            </div>

            <div className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-700 shadow-md">
              <span className="text-[11px] text-amber-600 font-bold block mb-1">3奖 (3rd Prize)</span>
              <span className="font-mono-nums text-2xl sm:text-3xl font-black text-amber-500 tracking-wider">
                {currentResult.thirdPrize}
              </span>
              <span className="text-[9px] text-amber-600/80 block mt-1">派彩 RM 550</span>
            </div>
          </div>

          {/* 入围 (10组 - 价格 240) */}
          <div className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">入围 (Starter Prizes · 10组)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                每注派彩 RM 240
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center font-mono-nums font-bold text-sm text-neutral-200">
              {currentResult.specialPrizes.map((num, i) => (
                <div key={i} className="py-2 px-1 bg-neutral-900 rounded-lg border border-neutral-800">
                  {num}
                </div>
              ))}
            </div>
          </div>

          {/* 安慰奖 (10组 - 价格 70) */}
          <div className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300">安慰奖 (Consolation Prizes · 10组)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                每注派彩 RM 70
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center font-mono-nums font-bold text-sm text-neutral-300">
              {currentResult.consolationPrizes.map((num, i) => (
                <div key={i} className="py-2 px-1 bg-neutral-900 rounded-lg border border-neutral-800">
                  {num}
                </div>
              ))}
            </div>
          </div>

          {/* 5D / 6D Extra Numbers */}
          {(currentResult.fiveDResult || currentResult.sixDResult) && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              {currentResult.fiveDResult && (
                <div className="p-3 bg-neutral-950 rounded-xl border border-amber-500/30 text-center">
                  <span className="text-[10px] text-amber-400 font-bold block">5D 五字彩开奖号码</span>
                  <span className="font-mono-nums text-lg font-black text-amber-300">{currentResult.fiveDResult}</span>
                </div>
              )}
              {currentResult.sixDResult && (
                <div className="p-3 bg-neutral-950 rounded-xl border border-purple-500/30 text-center">
                  <span className="text-[10px] text-purple-400 font-bold block">6D 六字彩开奖号码</span>
                  <span className="font-mono-nums text-lg font-black text-purple-300">{currentResult.sixDResult}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW: WINNINGS (中奖结算) */}
      {activeView === 'winnings' && (
        <div className="p-5 rounded-3xl bg-neutral-900 border-2 border-amber-500/40 shadow-2xl space-y-4 text-center">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <span className="font-cinzel font-bold text-amber-300">中奖查询与派彩结算</span>
            <button
              onClick={() => setActiveView('dashboard')}
              className="text-xs text-neutral-400 hover:text-white px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors"
            >
              返回主页
            </button>
          </div>
          <div className="p-6 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
            <div className="text-base font-bold text-neutral-100">大马官方开彩智能对奖核验完毕</div>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-md mx-auto">
              系统已根据马来西亚官方统一赔率（头奖 3500、2奖 1100、3奖 550、入围 240、安慰奖 70）全自动核验您所持有的全部万字注单，任何中奖奖金 (RM) 已即时结算入账信用余额！
            </p>
            <div className="pt-2">
              <button
                onClick={() => setActiveView('receipts')}
                className="px-4 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-xl shadow cursor-pointer transition-colors"
              >
                查看我的票据与中奖明细
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: DREAM BOOK (万字梦册 / 千字图查号码) */}
      {activeView === 'dream_book' && (
        <div className="p-5 rounded-3xl bg-neutral-900 border-2 border-amber-500/40 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="font-cinzel font-bold text-base text-amber-300">
                  大马民间万字千字解梦字典 (Tua Pek Kong 4D)
                </h2>
                <p className="text-[11px] text-neutral-400">
                  灵签查号 · 梦境吉兆 · 一键填入投注
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveView('dashboard')}
              className="text-xs text-neutral-400 hover:text-white px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors"
            >
              返回主页
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              value={dreamSearch}
              onChange={(e) => setDreamSearch(e.target.value)}
              placeholder="搜索梦境关键词或4位数字（如：发财、龙、车祸、8899...）"
              className="w-full pl-9 pr-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto no-scrollbar pt-1">
            {filteredDreams.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl flex items-center justify-between hover:border-amber-500/40 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-neutral-200">{item.keyword}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                      {item.category}
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">大马灵签旺财万字</div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono-nums font-black text-amber-400 text-lg tracking-wider">
                    {item.number}
                  </span>
                  <button
                    onClick={() => {
                      sound.playChip();
                      setBetNumber(item.number);
                      setActiveView('betting');
                      setBetLottoCategory('4D');
                    }}
                    className="px-2.5 py-1 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-lg cursor-pointer transition-colors shadow"
                  >
                    投注
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
