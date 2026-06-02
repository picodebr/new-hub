import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Coins, KeyRound, Users as UsersIcon, Sparkles,
  AlertCircle, Activity, Check, X, Copy, Eye, EyeOff,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export interface StudentProfileData {
  id: string;
  name: string;
  username: string;
  initials: string;
  color: string;
  coins: number;
  groups: string[];
  skills?: string[];
  difficulties?: string[];
  /** acessos no último mês — usado para calcular engajamento (0-100) */
  accessesLastMonth?: number;
}

interface Props {
  student: StudentProfileData;
  onBack: () => void;
}

const TARGET_ACCESSES = 20; // 20+ acessos/mês = 100% de engajamento

const StudentProfile = ({ student, onBack }: Props) => {
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [copied, setCopied] = useState(false);

  const accesses = student.accessesLastMonth ?? Math.floor(Math.random() * 25);
  const engagement = useMemo(
    () => Math.min(100, Math.round((accesses / TARGET_ACCESSES) * 100)),
    [accesses]
  );

  const engagementLabel =
    engagement >= 80 ? 'Excelente' :
    engagement >= 50 ? 'Bom' :
    engagement >= 25 ? 'Regular' : 'Baixo';

  const engagementColor =
    engagement >= 80 ? 'hsl(142 71% 45%)' :
    engagement >= 50 ? 'hsl(199 89% 48%)' :
    engagement >= 25 ? 'hsl(38 92% 50%)' : 'hsl(0 84% 60%)';

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let p = '';
    for (let i = 0; i < 8; i++) p += chars[Math.floor(Math.random() * chars.length)];
    return p;
  };

  const handleReset = () => {
    setNewPassword(generatePassword());
    setShowPwd(true);
  };

  const copyPassword = async () => {
    if (!newPassword) return;
    await navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Engagement ring math
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (engagement / 100) * circumference;

  const skills = student.skills ?? [];
  const difficulties = student.difficulties ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      {/* Back */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-accent transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight" style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}>
            Perfil do Aluno
          </h1>
          <p className="text-sm text-muted-foreground">Acompanhe progresso, saldo e engajamento</p>
        </div>
      </div>

      {/* Hero card */}
      <div className="glass-card p-6 md:p-8 relative overflow-hidden">
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: student.color }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          {/* Avatar */}
          <div
            className="w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center text-3xl font-bold text-white shrink-0 ring-4 ring-background shadow-xl"
            style={{ backgroundColor: student.color }}
          >
            {student.initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight" style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}>
              {student.name}
            </h2>
            <p className="text-sm text-muted-foreground">{student.username}</p>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">
                <Coins className="w-4 h-4" />
                <span className="text-sm font-bold">
                  R$ {student.coins.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <button
                onClick={() => setResetOpen(true)}
                data-tour="reset-password-btn"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-sm font-semibold transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                Resetar Senha
              </button>
            </div>
          </div>

          {/* Engagement ring */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60" cy="60" r={radius}
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                  className="opacity-40"
                />
                <motion.circle
                  cx="60" cy="60" r={radius}
                  fill="none"
                  stroke={engagementColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Activity className="w-3.5 h-3.5 mb-0.5" style={{ color: engagementColor }} />
                <span className="text-2xl font-bold text-foreground tabular-nums">{engagement}%</span>
                <span className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: engagementColor }}>
                  {engagementLabel}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground text-center max-w-[140px]">
              {accesses} acessos no último mês
            </p>
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Grupos */}
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <UsersIcon className="w-[18px] h-[18px] text-primary" />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground tracking-tight">Grupos da Turma</h3>
          </div>
          {student.groups.length === 0 ? (
            <EmptyCard icon={UsersIcon} text="Nenhum grupo" />
          ) : (
            <div className="space-y-2">
              {student.groups.map(g => (
                <div
                  key={g}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border/40 bg-card/60 px-3 py-2.5 transition-all duration-300 hover:border-border hover:bg-card hover:shadow-[0_6px_20px_-12px_rgba(0,0,0,0.12)]"
                >
                  <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary opacity-60 transition-all duration-300 group-hover:h-8 group-hover:opacity-100" />
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                    <UsersIcon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground tracking-tight truncate">{g}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Habilidades */}
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Sparkles className="w-[18px] h-[18px] text-emerald-500" />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground tracking-tight">Habilidades</h3>
          </div>
          {skills.length === 0 ? (
            <EmptyCard icon={Sparkles} text="Nenhuma habilidade mapeada" />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {skills.map(s => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold tracking-tight transition-colors hover:bg-emerald-500/15"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Dificuldades */}
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <AlertCircle className="w-[18px] h-[18px] text-rose-500" />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground tracking-tight">Dificuldades</h3>
          </div>
          {difficulties.length === 0 ? (
            <EmptyCard icon={AlertCircle} text="Nenhuma dificuldade reportada" />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {difficulties.map(d => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-md border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold tracking-tight transition-colors hover:bg-rose-500/15"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {d}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reset password modal */}
      <Dialog
        open={resetOpen}
        onOpenChange={(o) => {
          setResetOpen(o);
          if (!o) { setNewPassword(null); setShowPwd(false); }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            Resetar senha
          </DialogTitle>
          <DialogDescription>
            {!newPassword
              ? `Tem certeza que deseja gerar uma nova senha para ${student.name}?`
              : 'Senha gerada com sucesso. Compartilhe com o aluno.'}
          </DialogDescription>

          <AnimatePresence mode="wait">
            {!newPassword ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-end gap-2 pt-2"
              >
                <button
                  onClick={() => setResetOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Gerar nova senha
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="password"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3 pt-2"
              >
                <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/40 border border-border/50">
                  <code className="flex-1 text-lg font-mono font-bold text-foreground tracking-widest">
                    {showPwd ? newPassword : '•'.repeat(newPassword.length)}
                  </code>
                  <button
                    onClick={() => setShowPwd(s => !s)}
                    className="p-2 rounded-lg hover:bg-accent transition-colors"
                    aria-label="Mostrar/ocultar"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={copyPassword}
                    className="p-2 rounded-lg hover:bg-accent transition-colors"
                    aria-label="Copiar"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={() => setResetOpen(false)}
                  className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Concluir
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

const EmptyCard = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
  <div className="flex flex-col items-center justify-center text-center py-8 rounded-xl bg-accent/20">
    <div className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center mb-2.5">
      <Icon className="w-4 h-4 text-muted-foreground/60" />
    </div>
    <p className="text-xs text-muted-foreground">{text}</p>
  </div>
);

export default StudentProfile;
