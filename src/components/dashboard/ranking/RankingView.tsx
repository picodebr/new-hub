import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Medal,
  Flame,
  Coins,
  Users,
  Globe,
  Swords,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { formatCoin } from '@/_base/utils';
import { toast } from 'sonner';

interface LeaderboardUser {
  rank: number;
  username: string;
  name: string;
  avatar?: string;
  coins: number;
  streak: number;
  isCurrentUser?: boolean;
}

const CLASS_LEADERBOARD: LeaderboardUser[] = [
  { rank: 1, username: 'rafasuffi', name: 'Rafael Suffi', coins: 1420, streak: 12 },
  { rank: 2, username: 'lucaspiovani', name: 'Lucas Piovani', coins: 1250, streak: 8 },
  { rank: 3, username: 'giovannimarin', name: 'Giovanni Marin', coins: 1180, streak: 15 },
  { rank: 4, username: 'adeniltonribeiro', name: 'Adenilton Ribeiro', coins: 950, streak: 5 },
  { rank: 5, username: 'flavianmf', name: 'Flávia Nogueira', coins: 890, streak: 4 },
];

const NATIONAL_LEADERBOARD: LeaderboardUser[] = [
  { rank: 1, username: 'andersonfelix', name: 'Anderson Felix', coins: 3450, streak: 30 },
  { rank: 2, username: 'anasichieri', name: 'Ana Sichieri', coins: 3120, streak: 25 },
  { rank: 3, username: 'caiomoraes', name: 'Caio Moraes', coins: 2890, streak: 18 },
  { rank: 4, username: 'beatrizlima', name: 'Beatriz Lima', coins: 2600, streak: 14 },
  { rank: 5, username: 'eduardocosta', name: 'Eduardo Costa', coins: 2450, streak: 21 },
];

export const RankingView: React.FC = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'class' | 'national'>('class');

  const list = activeTab === 'class' ? CLASS_LEADERBOARD : NATIONAL_LEADERBOARD;

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-sm border border-amber-500/40 shadow-sm">
          🥇
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 rounded-full bg-slate-400/20 text-slate-300 flex items-center justify-center font-bold text-sm border border-slate-400/40 shadow-sm">
          🥈
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-700/20 text-amber-600 flex items-center justify-center font-bold text-sm border border-amber-700/40 shadow-sm">
          🥉
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs text-muted-foreground">
        #{rank}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ranking dos Alunos</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Veja a liderança em moedas conquistadas, desafios cumpridos e dias seguidos de dedicação
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="glass-card !rounded-2xl p-1 inline-flex gap-1">
          <button
            onClick={() => setActiveTab('class')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'class'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Rank da Turma</span>
          </button>
          <button
            onClick={() => setActiveTab('national')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'national'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Rank Nacional</span>
          </button>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {list.slice(0, 3).map((u) => (
          <div
            key={u.username}
            className={`glass-card !rounded-2xl p-6 relative overflow-hidden flex flex-col items-center text-center space-y-3 ${
              u.rank === 1
                ? 'border-amber-500/40 shadow-lg bg-gradient-to-b from-amber-500/5 to-transparent'
                : ''
            }`}
          >
            <div className="absolute top-4 right-4">{getRankBadge(u.rank)}</div>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-blue-500 p-0.5 shadow-md">
              <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center font-bold text-lg text-primary">
                {u.name.substring(0, 2).toUpperCase()}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-base text-foreground">{u.name}</h3>
              <p className="text-xs text-muted-foreground">@{u.username}</p>
            </div>

            <div className="flex items-center gap-4 pt-2 border-t border-border/40 w-full justify-center text-xs">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Coins className="w-3.5 h-3.5" />
                <span>{formatCoin(u.coins)}</span>
              </div>
              <div className="flex items-center gap-1 text-rose-500 font-bold">
                <Flame className="w-3.5 h-3.5" />
                <span>{u.streak} dias</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Leaderboard Table */}
      <div className="glass-card !rounded-2xl p-6">
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <Medal className="w-4 h-4 text-primary" />
          <span>Classificação Completa</span>
        </h3>

        <div className="divide-y divide-border/40">
          {list.map((u) => (
            <div
              key={u.username}
              className="py-3.5 px-3 rounded-xl flex items-center justify-between hover:bg-accent/40 transition-colors"
            >
              <div className="flex items-center gap-4">
                {getRankBadge(u.rank)}
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-sm text-primary">
                  {u.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">{u.name}</h4>
                  <p className="text-xs text-muted-foreground">@{u.username}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-lg">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{u.streak} dias</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-lg">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{formatCoin(u.coins)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Challenge a friend card */}
      <div className="glass-card !rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-transparent to-primary/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-md shrink-0">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Desafiar um colega</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Escolha um desafio de código ou algoritmo e dispute quem resolve em menos passos!
            </p>
          </div>
        </div>

        <button
          onClick={() => toast.info('Convite para duelo enviado aos colegas da turma!')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-md shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Iniciar Desafio</span>
        </button>
      </div>
    </motion.div>
  );
};

export default RankingView;
