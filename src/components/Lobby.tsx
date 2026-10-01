import React from 'react';
import { GameTab, WalletState } from '../types';
import { sound } from '../utils/sound';
import { Sparkles, Trophy, Shield, Flame, Building2, Coins, ArrowRight, Ticket } from 'lucide-react';

// Imported generated assets
import heroHallImg from '../assets/images/casino_hero_hall_1790835282379.jpg';
import slotBannerImg from '../assets/images/slot_jackpot_banner_1790835294848.jpg';
import baccaratSuiteImg from '../assets/images/baccarat_vip_suite_1790835307266.jpg';
import cashierVaultImg from '../assets/images/cashier_vault_luxury_1790835317786.jpg';

interface LobbyProps {
  onSelectGame: (tab: GameTab, subView?: string) => void;
  wallet: WalletState;
  onOpenCashier: () => void;
  onOpenBonus: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  onSelectGame,
  wallet,
  onOpenCashier,
  onOpenBonus
}) => {
  const games = [
    {
      id: 'lottery' as GameTab,
      title: '马来西亚马票 4D',
      subtitle: 'Malaysia 4D Live Lottery',
      desc: '万能/大马彩/多多同步开彩 · 周三六日及特开周二 19:00准时开 · 官方统一标准赔率',
      icon: Ticket,
      badge: '大马统一官方赔率',
      color: 'from-amber-600/30 to-neutral-900',
      activePlayers: 4890
    },
    {
      id: 'slots' as GameTab,
      title: '777 狂野老虎机',
      subtitle: 'Wild 777 Super Slots',
      desc: '3轴5线经典爆机 · 狂野百搭钻石 · 免费旋转3倍奖池',
      image: slotBannerImg,
      icon: Trophy,
      badge: '最高爆率 100x',
      color: 'from-amber-500/20 to-neutral-900',
      activePlayers: 1842
    },
    {
      id: 'baccarat' as GameTab,
      title: '皇家百家乐',
      subtitle: 'Macau Royal Baccarat',
      desc: '标准8副洗牌靴 · 珠盘路走势图 · 庄对/闲对/超级6点',
      image: baccaratSuiteImg,
      icon: Shield,
      badge: '澳门标准路单',
      color: 'from-emerald-500/20 to-neutral-900',
      activePlayers: 2950
    },
    {
      id: 'blackjack' as GameTab,
      title: '拉斯维加斯 21点',
      subtitle: 'Vegas Blackjack VIP',
      desc: 'Blackjack 3:2 赔付 · 真实要牌/停牌/加倍下注策略',
      icon: Sparkles,
      badge: '高额回报率 99.5%',
      color: 'from-blue-500/20 to-neutral-900',
      activePlayers: 1120
    },
    {
      id: 'poker' as GameTab,
      title: '极速炸金花',
      subtitle: 'Golden Flower 3-Cards',
      desc: '豹子顺金同花对决 · 闷牌暗注 · 智能AI激战对决',
      icon: Flame,
      badge: '多人激烈比牌',
      color: 'from-rose-500/20 to-neutral-900',
      activePlayers: 1680
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10">
      {/* Hero Showcase Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl bg-neutral-950">
        <div className="absolute inset-0 z-0">
          <img
            src={heroHallImg}
            alt="Macau VIP Casino Hall"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter brightness-40 transform scale-102 transition-transform duration-700 hover:scale-105"
          />
          {/* Measured Scrim for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent" />
        </div>

        <div className="relative z-10 p-6 sm:p-12 lg:p-16 max-w-3xl space-y-5">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold tracking-wider uppercase">
            <span>澳门 & 拉斯维加斯 豪华贵宾游艺城</span>
            <span aria-hidden="true">·</span>
            <span>虚拟沙盒娱乐中心</span>
          </div>

          <h1 className="font-cinzel text-3xl sm:text-5xl font-black text-amber-200 tracking-tight leading-tight text-balance">
            星豪国际贵宾会所
          </h1>

          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-2xl">
            汇聚经典 777 狂野老虎机、澳门标准路单百家乐、21点及炸金花棋牌，配备全自动实时在线充提与结算系统，享受殿堂级沉浸式娱乐体验。
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                sound.playChip();
                onSelectGame('slots');
              }}
              className="py-3 px-6 text-sm font-bold text-neutral-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-xl shadow-xl hover:from-amber-300 hover:to-amber-400 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>立即入场开玩</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                sound.playChip();
                onOpenCashier();
              }}
              className="py-3 px-6 text-sm font-semibold text-neutral-200 bg-neutral-900/90 border border-amber-500/40 rounded-xl hover:bg-neutral-800 transition-all cursor-pointer flex items-center gap-2"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>实时账房与结算</span>
            </button>

            <button
              onClick={() => {
                sound.playChip();
                onOpenBonus();
              }}
              className="py-3 px-5 text-sm font-semibold text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded-xl hover:bg-amber-900/50 transition-all cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>领取每日马币 (RM)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Casino Games Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-amber-300">
              热门游艺桌台与项目
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              国际标准真实赔率规则 · 实时结算返奖
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map(game => {
            const Icon = game.icon;
            return (
              <div
                key={game.id}
                onClick={() => {
                  sound.playChip();
                  onSelectGame(game.id);
                }}
                className="group relative rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-amber-500/50 p-5 transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-2xl cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                {/* Background image if present */}
                {game.image && (
                  <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-25 group-hover:opacity-40 transition-opacity pointer-events-none overflow-hidden">
                    <img
                      src={game.image}
                      alt={game.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center filter grayscale group-hover:grayscale-0 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-900/80 to-transparent" />
                  </div>
                )}

                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                      {game.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-cinzel text-lg sm:text-xl font-bold text-neutral-100 group-hover:text-amber-300 transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5">{game.subtitle}</p>
                    <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                      {game.desc}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 pt-4 mt-4 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-neutral-500 font-mono">
                    在线热度: {game.activePlayers.toLocaleString()} 人正在游玩
                  </span>
                  {game.id === 'lottery' ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          sound.playChip();
                          onSelectGame('lottery', 'betting');
                        }}
                        className="px-3 py-1.5 rounded-xl font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-neutral-950 text-xs shadow-md hover:from-amber-300 hover:to-amber-400 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Ticket className="w-3.5 h-3.5 fill-neutral-950" />
                        <span>独立投注中心</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          sound.playChip();
                          onSelectGame('lottery', 'dashboard');
                        }}
                        className="px-2.5 py-1.5 rounded-xl font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs transition-colors cursor-pointer border border-neutral-700"
                      >
                        开彩大厅
                      </button>
                    </div>
                  ) : (
                    <span className="text-amber-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>进入游戏</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Cashier Feature Spotlight */}
      <div className="rounded-2xl bg-neutral-900/60 border border-amber-500/20 p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>全自动秒级清算与实时在线结算中心</span>
          </div>
          <h3 className="font-cinzel text-xl font-bold text-neutral-100">
            极速沙盒支付网关 · 自动对账与即时提兑
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            支持模拟即时沙盒充值、马币 (RM) 极速转账、USDT-TRC20 虚拟结算通道、快捷银联借记卡与 VIP 私人金库，提供真实单笔对账编号与秒级自动入账结算动效。
          </p>
        </div>

        <button
          onClick={() => {
            sound.playChip();
            onOpenCashier();
          }}
          className="py-3 px-6 text-sm font-bold text-neutral-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-xl hover:from-amber-300 hover:to-amber-400 cursor-pointer shadow-lg whitespace-nowrap"
        >
          打开财务账房与结算
        </button>
      </div>

      {/* Compliance / Safety Footer Notice */}
      <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-center text-xs text-neutral-500 space-y-1">
        <p className="font-semibold text-neutral-400">
          ⚠️ 绿色健康娱乐与安全合规提示
        </p>
        <p>
          本应用为纯单机/沙盒虚拟游艺娱乐模拟平台，内含所有游戏马币 (RM)、充值与提兑结算均为虚拟代币模拟，不具备任何真实货币流通价值，不支持亦杜绝任何真实货币赌博或洗钱行为，请理性娱乐，享受纯粹的游戏乐趣。
        </p>
      </div>
    </div>
  );
};
