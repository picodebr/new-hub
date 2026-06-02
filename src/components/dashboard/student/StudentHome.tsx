import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Sparkles,
  Coins,
  Receipt,
  TrendingUp,
  AtSign,
  Wallet,
  Trophy,
  Flame,
  BookOpen,
  Pencil,
} from 'lucide-react';
import MyCertificates from '@/components/dashboard/MyCertificates';
import { useUser } from '@/hooks/useUser';
import { useStudentAvatar } from '@/hooks/useStudentAvatar';
import AvatarCustomizer, {
  AvatarPreview,
  type AvatarConfig,
} from './AvatarCustomizer';

interface Transaction {
  id: string;
  title: string;
  date: string;
  amount: number;
}

const TRANSACTIONS: Transaction[] = [
  { id: '1', title: 'Projeto Pitch Deck - Cashback', date: '07/04/2026', amount: 0 },
  { id: '2', title: 'Projeto MVP - Cashback', date: '24/03/2026', amount: 2 },
  { id: '3', title: 'Projeto MVP - Cashback', date: '24/03/2026', amount: 2 },
  { id: '4', title: 'Projeto Picode - Cashback', date: '03/11/2025', amount: 0 },
];

const STUDENT_BALANCE = 14874.14;

const formatBRL = (n: number) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface StatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'amber' | 'emerald' | 'blue' | 'rose';
}

const TONE_MAP: Record<StatProps['tone'], { bg: string; text: string; ring: string }> = {
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/20' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/20' },
  blue: { bg: 'bg-primary/10', text: 'text-primary', ring: 'ring-primary/20' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', ring: 'ring-rose-500/20' },
};

const StatPill = ({ icon, label, value, tone }: StatProps) => {
  const t = TONE_MAP[tone];
  return (
    <div className={`flex items-center gap-3 rounded-2xl border border-border/40 bg-card/60 px-3.5 py-2.5 ring-1 ${t.ring}`}>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${t.bg} ${t.text}`}>
        {icon}
      </div>
      <div className="min-w-0 leading-tight">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`truncate text-sm font-bold ${t.text}`}>{value}</p>
      </div>
    </div>
  );
};

interface ProfileHeroProps {
  avatar: AvatarConfig;
  onEdit: () => void;
}

const ProfileHero = ({ avatar, onEdit, balance }: ProfileHeroProps & { balance: number }) => {
  const { user } = useUser();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card relative overflow-hidden p-5 md:p-7"
    >
      {/* Decorative gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-amber-500/[0.04]" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative grid grid-cols-1 items-center gap-6 lg:grid-cols-[auto,1fr,auto] lg:gap-8">
        {/* Avatar */}
        <div className="flex justify-center lg:justify-start">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary via-primary/40 to-amber-400 opacity-70 blur-md" />
            <div className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/20 via-background to-accent ring-4 ring-background shadow-2xl md:h-40 md:w-40">
              <AvatarPreview config={avatar} />
            </div>
            <button
              onClick={onEdit}
              className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background shadow-lg ring-4 ring-background transition-transform hover:scale-110"
              aria-label="Editar avatar"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Info + stats */}
        <div className="min-w-0 space-y-4 text-center lg:text-left">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" />
              Aluno
            </span>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {user?.name ?? 'Aluno Picode'}
            </h1>
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
              <AtSign className="h-3.5 w-3.5" />
              {user?.username ?? 'aluno@picode'}
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <StatPill
              icon={<Coins className="h-4 w-4" />}
              label="Saldo"
              value={`R$ ${formatBRL(balance)}`}
              tone="amber"
            />
            <StatPill
              icon={<Trophy className="h-4 w-4" />}
              label="Certificados"
              value="1"
              tone="blue"
            />
            <StatPill
              icon={<BookOpen className="h-4 w-4" />}
              label="Cursos"
              value="3"
              tone="emerald"
            />
            <StatPill
              icon={<Flame className="h-4 w-4" />}
              label="Sequência"
              value="7 dias"
              tone="rose"
            />
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-center lg:justify-end">
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-lg transition-all hover:scale-[1.03] hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" />
            Customizar Avatar
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const CoinsExtract = ({ balance }: { balance: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card flex h-full flex-col overflow-hidden p-5 md:p-6"
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
            <Receipt className="h-[18px] w-[18px] text-amber-500" />
          </div>
          <h2 className="text-base font-semibold text-foreground sm:text-lg">Meu Extrato</h2>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
          <Wallet className="h-3.5 w-3.5" />
          R$ {formatBRL(balance)}
        </div>
      </div>

      <div className="flex-1 space-y-2.5">
        {TRANSACTIONS.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className="group flex items-center gap-3 overflow-hidden rounded-2xl border border-border/40 bg-card/60 px-3 py-3 transition-all duration-300 hover:border-border hover:bg-card hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{t.title}</p>
              <p className="text-[11px] text-muted-foreground">{t.date}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                + R$ {t.amount.toFixed(2).replace('.', ',')}
              </span>
              <Coins className="h-3.5 w-3.5 text-amber-500" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const StudentHome = () => {
  const [open, setOpen] = useState(false);
  const { avatar, setAvatar } = useStudentAvatar();
  const [balance, setBalance] = useState(STUDENT_BALANCE);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4 overflow-x-hidden md:space-y-6"
    >
      {/* Hero do perfil — full width */}
      <ProfileHero avatar={avatar} onEdit={() => setOpen(true)} balance={balance} />

      {/* Extrato + Certificados lado a lado */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <CoinsExtract balance={balance} />
        <MyCertificates />
      </div>

      <AvatarCustomizer
        open={open}
        onOpenChange={setOpen}
        initial={avatar}
        balance={balance}
        onBalanceChange={setBalance}
        onConfirm={(c) => setAvatar(c)}
      />
    </motion.div>
  );
};

export default StudentHome;
