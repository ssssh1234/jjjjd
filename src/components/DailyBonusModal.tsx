import React, { useState } from 'react';
import { WalletState } from '../types';
import { sound } from '../utils/sound';
import { Sparkles, Gift, X, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailyBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletState;
  onClaim: (amount: number) => void;
}

export const DailyBonusModal: React.FC<DailyBonusModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onClaim
}) => {
  const [claimed, setClaimed] = useState(false);
  const [bonusAmount, setBonusAmount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleClaim = () => {
    sound.playChip();
    // Random bonus between 5,000 and 20,000
    const rewards = [5000, 8888, 12888, 18888, 28888];
    const picked = rewards[Math.floor(Math.random() * rewards.length)];
    setBonusAmount(picked);
    setClaimed(true);

    sound.playJackpot();
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 }
    });

    onClaim(picked);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-neutral-950 border border-amber-500/40 rounded-2xl shadow-2xl p-6 text-center overflow-hidden">
        {/* Decorative ambient glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg border border-amber-300">
          <Gift className="w-8 h-8 text-neutral-950" />
        </div>

        <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-amber-300 mb-2">
          VIP 尊享每日礼金 (RM)
        </h2>
        <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
          每日签到即领高额免费马币 (RM) 礼金，VIP 专属幸运返利，祝您好运连连！
        </p>

        {claimed && bonusAmount ? (
          <div className="space-y-4 py-3">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40">
              <span className="text-xs text-amber-300">恭喜获得今日礼金</span>
              <div className="font-mono-nums font-black text-3xl text-amber-400 my-1">
                +RM {bonusAmount.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-400 flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5" /> 已实时结算入账至马币钱包
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 text-sm font-bold text-neutral-950 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-xl hover:from-amber-300 hover:to-amber-400 transition-all cursor-pointer"
            >
              立即进入游戏
            </button>
          </div>
        ) : (
          <button
            onClick={handleClaim}
            className="w-full py-3.5 text-sm font-bold text-neutral-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-xl shadow-lg hover:from-amber-300 hover:to-amber-400 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-neutral-950" />
            <span>开启今日幸运礼盒</span>
          </button>
        )}
      </div>
    </div>
  );
};
