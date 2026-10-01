import React, { useState } from 'react';
import { WalletState, TransactionRecord } from '../types';
import { sound } from '../utils/sound';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  History, 
  Zap, 
  CheckCircle2, 
  QrCode, 
  AlertCircle, 
  X, 
  Building2, 
  Wallet,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CashierModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletState;
  onUpdateWallet: (updater: (prev: WalletState) => WalletState) => void;
  transactions: TransactionRecord[];
  onAddTransaction: (tx: TransactionRecord) => void;
}

export const CashierModal: React.FC<CashierModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onUpdateWallet,
  transactions,
  onAddTransaction
}) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'settle' | 'history' | 'vault'>('deposit');
  const [selectedChannel, setSelectedChannel] = useState<'instant' | 'crypto' | 'fpx' | 'vip'>('instant');
  const [depositAmount, setDepositAmount] = useState<number>(1000);
  const [customDeposit, setCustomDeposit] = useState<string>('');
  
  // Settle state
  const [settleAmount, setSettleAmount] = useState<number>(500);
  const [settleAccount, setSettleAccount] = useState<string>('Maybank-882199');

  // Vault state
  const [vaultAmount, setVaultAmount] = useState<number>(10000);

  // Live Payment Simulation State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [completedTx, setCompletedTx] = useState<TransactionRecord | null>(null);

  if (!isOpen) return null;

  const channels = [
    { id: 'instant', name: '极速马币沙盒支付', desc: '秒级实时结算 · 推荐通道', icon: Zap, fee: '0%' },
    { id: 'fpx', name: 'DuitNow / 大马网银 (FPX)', desc: 'Maybank · CIMB · Public Bank 互联', icon: CreditCard, fee: '0%' },
    { id: 'crypto', name: 'USDT 虚拟加密通道', desc: 'TRC20 模拟网络 · 隐私匿名', icon: Wallet, fee: '0%' },
    { id: 'vip', name: '大马私人钱庄直冲', desc: '大额免审实时结算直通车', icon: Building2, fee: '0%' }
  ];

  const quickAmounts = [100, 500, 1000, 5000, 10000, 50000];

  const effectiveDepositAmount = customDeposit ? parseInt(customDeposit, 10) || 0 : depositAmount;

  // Execute Real-Time Deposit
  const handleStartDeposit = () => {
    if (effectiveDepositAmount <= 0) return;
    sound.playChip();
    setIsProcessing(true);
    setProcessStep('正在建立安全加密支付通道...');

    const channelName = channels.find(c => c.id === selectedChannel)?.name || '极速沙盒支付';
    const txId = 'TX' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 1000);

    setTimeout(() => {
      setProcessStep('网关已接收到账信号，正在清算结算...');
    }, 400);

    setTimeout(() => {
      setProcessStep('账房风控核对无误，执行实时入账...');
    }, 850);

    setTimeout(() => {
      setIsProcessing(false);
      sound.playCashSettlement();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });

      const newTx: TransactionRecord = {
        id: txId,
        timestamp: Date.now(),
        type: 'deposit',
        title: `充值充币 - ${channelName}`,
        amount: effectiveDepositAmount,
        channel: channelName,
        status: 'completed',
        referenceNo: 'ORD-' + Math.floor(10000000 + Math.random() * 90000000)
      };

      onUpdateWallet(prev => ({
        ...prev,
        balance: prev.balance + effectiveDepositAmount,
        totalWagered: prev.totalWagered + 0
      }));

      onAddTransaction(newTx);
      setCompletedTx(newTx);
    }, 1250);
  };

  // Execute Real-Time Settlement (Cashout)
  const handleStartSettlement = () => {
    if (settleAmount <= 0) return;
    if (settleAmount > wallet.balance) {
      sound.playLoss();
      alert('您的当前可用马币余额不足！');
      return;
    }

    sound.playChip();
    setIsProcessing(true);
    setProcessStep('正在向清算银行提交实时结算下发凭据...');

    const txId = 'SET' + Date.now().toString(36).toUpperCase();

    setTimeout(() => {
      setProcessStep('结算系统正在自动打款平账...');
    }, 500);

    setTimeout(() => {
      setIsProcessing(false);
      sound.playCashSettlement();

      const newTx: TransactionRecord = {
        id: txId,
        timestamp: Date.now(),
        type: 'settlement',
        title: `马币结算出款 - 账户 [${settleAccount}]`,
        amount: -settleAmount,
        channel: '自动实时结算系统',
        status: 'completed',
        referenceNo: 'SET-' + Math.floor(10000000 + Math.random() * 90000000)
      };

      onUpdateWallet(prev => ({
        ...prev,
        balance: prev.balance - settleAmount
      }));

      onAddTransaction(newTx);
      setCompletedTx(newTx);
    }, 1100);
  };

  // Vault Deposit / Withdraw
  const handleVaultAction = (type: 'in' | 'out') => {
    if (vaultAmount <= 0) return;
    if (type === 'in' && wallet.balance < vaultAmount) {
      alert('可用马币不足以存入保险箱');
      return;
    }
    if (type === 'out' && wallet.vaultBalance < vaultAmount) {
      alert('保险箱马币不足以转出');
      return;
    }

    sound.playChip();
    if (type === 'in') {
      onUpdateWallet(prev => ({
        ...prev,
        balance: prev.balance - vaultAmount,
        vaultBalance: prev.vaultBalance + vaultAmount
      }));
      onAddTransaction({
        id: 'VAULT' + Date.now(),
        timestamp: Date.now(),
        type: 'vault_in',
        title: '资金划转 - 存入贵宾金库保险箱 (RM)',
        amount: -vaultAmount,
        channel: '内部金库',
        status: 'completed',
        referenceNo: 'VLT-' + Date.now().toString().slice(-6)
      });
    } else {
      onUpdateWallet(prev => ({
        ...prev,
        balance: prev.balance + vaultAmount,
        vaultBalance: prev.vaultBalance - vaultAmount
      }));
      onAddTransaction({
        id: 'VAULT' + Date.now(),
        timestamp: Date.now(),
        type: 'vault_out',
        title: '资金划转 - 从贵宾金库取出马币 (RM)',
        amount: vaultAmount,
        channel: '内部金库',
        status: 'completed',
        referenceNo: 'VLT-' + Date.now().toString().slice(-6)
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-neutral-950 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-neutral-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel text-lg sm:text-xl font-bold text-amber-300">
                VIP 财务账房与实时结算中心
              </h2>
              <p className="text-xs text-neutral-400">
                模拟实时在线充提通道 · 极速清算结算系统
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Status Banner */}
        <div className="px-6 py-3 bg-neutral-900/40 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">可用马币：</span>
            <span className="font-mono-nums font-bold text-amber-300 text-base">
              RM {wallet.balance.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">金库保险箱：</span>
            <span className="font-mono-nums font-bold text-emerald-400 text-base">
              RM {wallet.vaultBalance.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>实时清算引擎在线</span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-neutral-800 bg-neutral-950 px-6 gap-2 pt-2">
          {[
            { id: 'deposit', label: '实时充值', icon: ArrowDownLeft },
            { id: 'settle', label: '模拟提兑结算', icon: ArrowUpRight },
            { id: 'vault', label: '金库保险箱', icon: Wallet },
            { id: 'history', label: '账房流水明细', icon: History }
          ].map(tab => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playChip();
                  setActiveTab(tab.id as typeof activeTab);
                  setCompletedTx(null);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  active
                    ? 'border-amber-400 text-amber-300 bg-amber-500/5'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 no-scrollbar space-y-5">
          {/* Real-time processing overlay */}
          {isProcessing && (
            <div className="p-8 rounded-xl bg-neutral-900 border border-amber-500/40 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-400 rounded-full animate-spin mx-auto" />
              <div className="font-cinzel text-lg font-bold text-amber-300">
                实时结算处理中
              </div>
              <p className="text-sm text-neutral-300 animate-pulse font-mono">
                {processStep}
              </p>
            </div>
          )}

          {/* Success Transaction Banner */}
          {!isProcessing && completedTx && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-sm font-bold text-emerald-300">
                    交易实时清算完成！
                  </div>
                  <div className="text-xs text-neutral-300 font-mono">
                    流水凭据: {completedTx.referenceNo} · 金额: {completedTx.amount > 0 ? `+RM ${completedTx.amount.toLocaleString()}` : `-RM ${Math.abs(completedTx.amount).toLocaleString()}`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCompletedTx(null)}
                className="text-xs text-neutral-400 hover:text-white"
              >
                关闭提示
              </button>
            </div>
          )}

          {/* TAB 1: DEPOSIT */}
          {!isProcessing && activeTab === 'deposit' && (
            <div className="space-y-6">
              {/* Payment Channel Selection */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  选择充值通道 (全自动即时结算)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {channels.map(ch => {
                    const active = selectedChannel === ch.id;
                    const Icon = ch.icon;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          sound.playChip();
                          setSelectedChannel(ch.id as typeof selectedChannel);
                        }}
                        className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                          active
                            ? 'bg-amber-950/30 border-amber-400 ring-1 ring-amber-400/50'
                            : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${active ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-neutral-100">{ch.name}</span>
                            <span className="text-[10px] text-emerald-400 font-mono">费率 {ch.fee}</span>
                          </div>
                          <p className="text-xs text-neutral-400 mt-0.5">{ch.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Selection */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  快捷充值金额 (马币 RM)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {quickAmounts.map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        sound.playChip();
                        setDepositAmount(amt);
                        setCustomDeposit('');
                      }}
                      className={`py-2 px-1 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                        depositAmount === amt && !customDeposit
                          ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:border-neutral-600'
                      }`}
                    >
                      RM {amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div className="mt-3">
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="自定义充值马币数量..."
                      value={customDeposit}
                      onChange={(e) => {
                        setCustomDeposit(e.target.value);
                      }}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3.5 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-neutral-400 font-bold font-mono">RM</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartDeposit}
                  className="w-full py-3.5 text-sm font-bold text-neutral-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-xl shadow-lg hover:from-amber-300 hover:to-amber-400 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-neutral-950" />
                  <span>立即支付并完成实时结算 (+RM {effectiveDepositAmount.toLocaleString()})</span>
                </button>
              </div>

              {/* Notice */}
              <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800/80 text-xs text-neutral-400 leading-relaxed">
                <span className="text-amber-400 font-semibold">⚡ 即时清算协议保障：</span>
                所有沙盒交易经由模拟清算节点，充值将在 1 秒内完成入账并在流水明细生成唯一的防伪对账编号。
              </div>
            </div>
          )}

          {/* TAB 2: SETTLE (CASHOUT SIMULATOR) */}
          {!isProcessing && activeTab === 'settle' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">可结算出款额度</span>
                  <span className="font-mono-nums font-bold text-amber-300 text-lg">
                    RM {wallet.balance.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-neutral-500">
                  支持模拟提兑至 Maybank、CIMB、Public Bank 等大马银行账户、DuitNow、数字货币 TRC20。
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  提兑金额 (马币 RM)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3.5 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setSettleAmount(wallet.balance)}
                    className="px-4 py-2 bg-neutral-800 text-amber-300 border border-neutral-700 rounded-lg text-xs font-semibold hover:bg-neutral-700 cursor-pointer"
                  >
                    全部提兑
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  接收结算账户 / 地址 (模拟)
                </label>
                <input
                  type="text"
                  value={settleAccount}
                  onChange={(e) => setSettleAccount(e.target.value)}
                  placeholder="例如：Maybank 账号 114012345678 或 DuitNow 手机号"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3.5 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handleStartSettlement}
                disabled={settleAmount <= 0 || settleAmount > wallet.balance}
                className="w-full py-3.5 text-sm font-bold text-neutral-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 rounded-xl shadow-lg hover:from-emerald-300 hover:to-emerald-400 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>提交并执行实时结算下发 (-RM {settleAmount.toLocaleString()})</span>
              </button>
            </div>
          )}

          {/* TAB 3: VAULT SAFE */}
          {!isProcessing && activeTab === 'vault' && (
            <div className="space-y-5">
              <div className="p-5 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-amber-500/20 text-center space-y-2">
                <div className="text-xs text-neutral-400">贵宾金库累计储备</div>
                <div className="font-mono-nums font-extrabold text-2xl text-emerald-400">
                  RM {wallet.vaultBalance.toLocaleString()}
                </div>
                <p className="text-xs text-neutral-500">
                  存入金库的马币不会带入游戏桌面，避免上头，随存随取免手续费。
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  划转金额 (马币 RM)
                </label>
                <input
                  type="number"
                  value={vaultAmount}
                  onChange={(e) => setVaultAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3.5 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleVaultAction('in')}
                  className="py-3 px-4 bg-amber-500/10 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition-all cursor-pointer"
                >
                  存入金库保险箱 (RM)
                </button>
                <button
                  type="button"
                  onClick={() => handleVaultAction('out')}
                  className="py-3 px-4 bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-all cursor-pointer"
                >
                  从金库取出到钱包 (RM)
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: HISTORY */}
          {!isProcessing && activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-400 pb-1">
                <span>实时清算流水账单（共 {transactions.length} 条记录）</span>
                <span className="font-mono">自动对账校准完成</span>
              </div>

              {transactions.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500 bg-neutral-900/40 rounded-xl border border-neutral-800">
                  暂无充值与结算记录
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.slice(0, 15).map(tx => {
                    const isPositive = tx.amount > 0;
                    return (
                      <div
                        key={tx.id}
                        className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-neutral-200">{tx.title}</div>
                          <div className="text-[10px] text-neutral-500 font-mono">
                            {new Date(tx.timestamp).toLocaleString()} · 凭证: {tx.referenceNo}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-mono font-bold text-sm ${isPositive ? 'text-amber-400' : 'text-neutral-300'}`}>
                            {isPositive ? `+RM ${tx.amount.toLocaleString()}` : `-RM ${Math.abs(tx.amount).toLocaleString()}`}
                          </div>
                          <span className="text-[10px] text-emerald-400">已实时结算</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer / Legal Notice */}
        <div className="px-6 py-3 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-1.5 text-amber-500/90">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>合规声明：本系统采用 100% 虚拟马币 (RM) 娱乐代币，无任何真实法定货币交易，仅供休闲游艺体验。</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-neutral-800 text-neutral-200 rounded hover:bg-neutral-700 cursor-pointer text-xs"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
