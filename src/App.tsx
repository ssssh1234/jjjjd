/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameTab, WalletState, TransactionRecord } from './types';
import { sound } from './utils/sound';
import { Header } from './components/Header';
import { Lobby } from './components/Lobby';
import { CashierModal } from './components/CashierModal';
import { DailyBonusModal } from './components/DailyBonusModal';
import { SlotMachine } from './components/games/SlotMachine';
import { Baccarat } from './components/games/Baccarat';
import { Blackjack } from './components/games/Blackjack';
import { PokerGame } from './components/games/PokerGame';
import { MalaysiaLottery } from './components/lottery/MalaysiaLottery';
import { Bell, Trophy, ShieldAlert, Sparkles, Coins } from 'lucide-react';

const INITIAL_WALLET: WalletState = {
  balance: 88888,
  vaultBalance: 20000,
  totalWagered: 15000,
  totalWon: 18200,
  vipTier: 'Gold'
};

const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  {
    id: 'TX-INIT-01',
    timestamp: Date.now() - 3600000 * 2,
    type: 'deposit',
    title: '充值充币 - 极速沙盒支付',
    amount: 50000,
    channel: '极速沙盒支付',
    status: 'completed',
    referenceNo: 'ORD-88291043'
  },
  {
    id: 'TX-INIT-02',
    timestamp: Date.now() - 3600000 * 5,
    type: 'bonus',
    title: '迎新礼金 - VIP 金卡开户赠送',
    amount: 38888,
    channel: '系统赠送',
    status: 'completed',
    referenceNo: 'BON-19208392'
  }
];

export default function App() {
  const [currentTab, setCurrentTab] = useState<GameTab>('lobby');
  const [lotteryInitialView, setLotteryInitialView] = useState<'dashboard' | 'betting'>('dashboard');
  const [isCashierOpen, setIsCashierOpen] = useState<boolean>(false);
  const [isBonusOpen, setIsBonusOpen] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);

  const handleSelectGame = (tab: GameTab, subView?: string) => {
    if (tab === 'cashier') {
      setIsCashierOpen(true);
    } else {
      if (tab === 'lottery' && subView === 'betting') {
        setLotteryInitialView('betting');
      } else if (tab === 'lottery') {
        setLotteryInitialView('dashboard');
      }
      setCurrentTab(tab);
    }
  };

  // Persistent wallet state
  const [wallet, setWallet] = useState<WalletState>(() => {
    try {
      const saved = localStorage.getItem('grand_vegas_wallet');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_WALLET;
  });

  // Persistent transactions state
  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('grand_vegas_txs');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_TRANSACTIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('grand_vegas_wallet', JSON.stringify(wallet));
    } catch {
      // ignore
    }
  }, [wallet]);

  useEffect(() => {
    try {
      localStorage.setItem('grand_vegas_txs', JSON.stringify(transactions));
    } catch {
      // ignore
    }
  }, [transactions]);

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    sound.muted = next;
    if (!next) {
      sound.playChip();
    }
  };

  const handleAddTransaction = (tx: TransactionRecord) => {
    setTransactions(prev => [tx, ...prev]);
  };

  const handleClaimDaily = (amt: number) => {
    setWallet(prev => ({
      ...prev,
      balance: prev.balance + amt,
      totalWon: prev.totalWon + amt
    }));
    handleAddTransaction({
      id: 'BON-' + Date.now(),
      timestamp: Date.now(),
      type: 'bonus',
      title: '每日礼金 - 签到幸运礼盒',
      amount: amt,
      channel: '每日活动',
      status: 'completed',
      referenceNo: 'REW-' + Date.now().toString().slice(-6)
    });
  };

  const handleRecordGameWin = (game: string, bet: number, win: number) => {
    if (win >= bet * 2) {
      handleAddTransaction({
        id: 'WIN-' + Date.now(),
        timestamp: Date.now(),
        type: 'bonus',
        title: `${game} - 派彩赢赏实时结算`,
        amount: win,
        channel: '游戏桌台即时结算',
        status: 'completed',
        referenceNo: 'WIN-' + Math.floor(100000 + Math.random() * 900000)
      });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Ticker Broadcast */}
      <div className="bg-neutral-900 border-b border-amber-500/20 px-4 py-1.5 text-[11px] text-amber-300/90 flex items-center justify-between overflow-hidden">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="p-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px] uppercase">
              实时战报
            </span>
            <span className="text-neutral-400">
              恭喜贵宾 <span className="text-amber-300 font-medium">VIP_9821</span> 在 777 狂野老虎机 触发超级巨奖，实时结算入账 <span className="text-emerald-400 font-mono font-bold">+RM 280,000</span>！
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-neutral-400 shrink-0">
            <span>在线状态：极速结算引擎运行中</span>
            <span className="text-amber-400/80 font-mono">延时: 12ms</span>
          </div>
        </div>
      </div>

      {/* Standard Top Navigation Bar */}
      <Header
        currentTab={currentTab}
        onSelectTab={handleSelectGame}
        wallet={wallet}
        onOpenCashier={() => setIsCashierOpen(true)}
        onOpenBonus={() => setIsBonusOpen(true)}
        muted={muted}
        onToggleMute={handleToggleMute}
      />

      {/* Main Game Stage */}
      <main className="flex-1 px-3 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto w-full">
        {currentTab === 'lobby' && (
          <Lobby
            onSelectGame={handleSelectGame}
            wallet={wallet}
            onOpenCashier={() => setIsCashierOpen(true)}
            onOpenBonus={() => setIsBonusOpen(true)}
          />
        )}

        {currentTab === 'lottery' && (
          <MalaysiaLottery
            wallet={wallet}
            onUpdateWallet={setWallet}
            onRecordGameWin={handleRecordGameWin}
            onOpenCashier={() => setIsCashierOpen(true)}
            initialView={lotteryInitialView}
            onBackToLobby={() => setCurrentTab('lobby')}
          />
        )}

        {currentTab === 'slots' && (
          <SlotMachine
            wallet={wallet}
            onUpdateWallet={setWallet}
            onRecordGameWin={handleRecordGameWin}
          />
        )}

        {currentTab === 'baccarat' && (
          <Baccarat
            wallet={wallet}
            onUpdateWallet={setWallet}
            onRecordGameWin={handleRecordGameWin}
          />
        )}

        {currentTab === 'blackjack' && (
          <Blackjack
            wallet={wallet}
            onUpdateWallet={setWallet}
            onRecordGameWin={handleRecordGameWin}
          />
        )}

        {currentTab === 'poker' && (
          <PokerGame
            wallet={wallet}
            onUpdateWallet={setWallet}
            onRecordGameWin={handleRecordGameWin}
          />
        )}
      </main>

      {/* Real-time Payment & Cashier Settlement Modal */}
      <CashierModal
        isOpen={isCashierOpen}
        onClose={() => setIsCashierOpen(false)}
        wallet={wallet}
        onUpdateWallet={setWallet}
        transactions={transactions}
        onAddTransaction={handleAddTransaction}
      />

      {/* Daily Gift Bonus Modal */}
      <DailyBonusModal
        isOpen={isBonusOpen}
        onClose={() => setIsBonusOpen(false)}
        wallet={wallet}
        onClaim={handleClaimDaily}
      />

      {/* Quiet Clean Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 px-6 py-6 text-xs text-neutral-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="font-cinzel text-amber-500/80 font-bold">
            Grand Vegas VIP Virtual Gaming Center
          </div>
          <div className="flex items-center gap-4 text-neutral-400">
            <span>标准国际荷官规则</span>
            <span aria-hidden="true">·</span>
            <span>自动实时平账清算</span>
            <span aria-hidden="true">·</span>
            <span>100% 虚拟娱乐沙盒</span>
          </div>
          <div className="text-[11px] text-neutral-600">
            © 2026 Grand Vegas. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
