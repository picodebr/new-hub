import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Sparkles,
  Coins,
  AtSign,
  Trophy,
  Flame,
  BookOpen,
  Pencil,
  Zap,
} from 'lucide-react';
import MyCertificates from '@/components/dashboard/MyCertificates';
import StudentExtract from './StudentExtract';
import DailyChallengeDialog from './DailyChallengeDialog';
import { useUser } from '@/hooks/useUser';
import { useStudentAvatar } from '@/hooks/useStudentAvatar';
import { updateProfile } from '@/_base/services/user';
import { listUserCertificates } from '@/_base/services/certificates';
import { listCourses } from '@/_base/services/course';
import { formatCoin } from '@/_base/utils';
import { toast } from 'sonner';
import AvatarCustomizer, {
  AvatarPreview,
  type AvatarConfig,
} from './AvatarCustomizer';

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
  balance: number;
  streak: number;
  certsCount: number;
  coursesCount: number;
  onOpenDaily: () => void;
}

const ProfileHero = ({ avatar, onEdit, balance, streak, certsCount, coursesCount, onOpenDaily }: ProfileHeroProps) => {
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
              {user?.name ?? 'Aluno PiCode'}
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
              value={formatCoin(balance)}
              tone="amber"
            />
            <StatPill
              icon={<Trophy className="h-4 w-4" />}
              label="Certificados"
              value={certsCount.toString()}
              tone="blue"
            />
            <StatPill
              icon={<BookOpen className="h-4 w-4" />}
              label="Cursos"
              value={coursesCount.toString()}
              tone="emerald"
            />
            <StatPill
              icon={<Flame className="h-4 w-4" />}
              label="Sequência"
              value={`${streak} dias`}
              tone="rose"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 justify-center lg:justify-end">
          <button
            onClick={onOpenDaily}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.03] hover:bg-amber-600"
          >
            <Flame className="h-4 w-4" />
            Desafio Diário
          </button>
          <button
            onClick={onEdit}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-lg transition-all hover:scale-[1.03] hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" />
            Customizar Avatar
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const StudentHome = () => {
  const [openAvatar, setOpenAvatar] = useState(false);
  const [openDaily, setOpenDaily] = useState(false);
  const [certsCount, setCertsCount] = useState<number>(0);
  const [coursesCount, setCoursesCount] = useState<number>(0);
  const { user, setUser } = useUser();
  const { avatar, setAvatar } = useStudentAvatar();

  useEffect(() => {
    listUserCertificates()
      .then((certs) => {
        if (Array.isArray(certs)) setCertsCount(certs.length);
      })
      .catch(() => setCertsCount(0));

    listCourses()
      .then((res: any) => {
        const courses = res?.results || (Array.isArray(res) ? res : []);
        setCoursesCount(courses.length || (user?.hub_class ? 1 : 0));
      })
      .catch(() => setCoursesCount(user?.hub_class ? 1 : 0));
  }, [user?.hub_class]);

  const balance = Number(user?.metadata?.coins ?? 0);
  const streak = user?.metadata?.streak !== undefined
    ? Number(user.metadata.streak)
    : (user?.metadata?.first_access
        ? Math.max(0, Math.floor((Date.now() - new Date(user.metadata.first_access).getTime()) / (1000 * 60 * 60 * 24)))
        : 0);

  const handleRewardClaimed = (earnedCoins: number) => {
    if (user) {
      const updatedCoins = (user.metadata?.coins || 0) + earnedCoins;
      const updatedStreak = (user.metadata?.streak || 0) + 1;
      const updatedUser = {
        ...user,
        metadata: {
          ...user.metadata,
          coins: updatedCoins,
          streak: updatedStreak,
        },
      };
      setUser(updatedUser);
      updateProfile({
        metadata: updatedUser.metadata,
      }).catch((e) => console.warn('Erro ao atualizar saldo:', e));
    }
  };

  const handleAvatarConfirm = async (c: AvatarConfig) => {
    setAvatar(c);
    if (user) {
      try {
        const updatedMetadata = { ...user.metadata, avatar_config: c };
        await updateProfile({ metadata: updatedMetadata });
        setUser({ ...user, metadata: updatedMetadata });
        toast.success('Avatar atualizado com sucesso!');
      } catch (err) {
        console.warn('Erro ao salvar avatar:', err);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4 overflow-x-hidden md:space-y-6"
    >
      {/* Hero do perfil — full width */}
      <ProfileHero
        avatar={avatar}
        onEdit={() => setOpenAvatar(true)}
        balance={balance}
        streak={streak}
        certsCount={certsCount}
        coursesCount={coursesCount}
        onOpenDaily={() => setOpenDaily(true)}
      />

      {/* Extrato + Certificados lado a lado */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <StudentExtract balance={balance} />
        <MyCertificates />
      </div>

      {/* Modal de Customização de Avatar */}
      <AvatarCustomizer
        open={openAvatar}
        onOpenChange={setOpenAvatar}
        initial={avatar}
        balance={balance}
        onBalanceChange={(newBal) => {
          if (user) {
            setUser({ ...user, metadata: { ...user.metadata, coins: newBal } });
          }
        }}
        onConfirm={handleAvatarConfirm}
      />

      {/* Modal de Desafio Diário */}
      <DailyChallengeDialog
        open={openDaily}
        onOpenChange={setOpenDaily}
        onRewardClaimed={handleRewardClaimed}
      />
    </motion.div>
  );
};

export default StudentHome;
