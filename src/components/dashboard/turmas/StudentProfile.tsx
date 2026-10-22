import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Coins,
  KeyRound,
  Users as UsersIcon,
  Sparkles,
  AlertCircle,
  Plus,
  Minus,
  Loader2,
  Check,
  X,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { getStudent, redefineStudentPassword } from '@/_base/services/user';
import { updateStudentData } from '@/_base/services/student/updateStudentData';
import { formatCoin, removeDuplicateItems } from '@/_base/utils';
import { IHubUser } from '@/_base/interfaces/user';
import StudentEvaluationChart from './StudentEvaluationChart';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Props {
  onBack?: () => void;
}

export const StudentProfile = ({ onBack }: Props) => {
  const { studentId } = useParams<{ studentId?: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<IHubUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Coins Modal (+ or -)
  const [coinModalMode, setCoinModalMode] = useState<'add' | 'remove' | null>(null);
  const [coinAmount, setCoinAmount] = useState('');
  const [isUpdatingCoins, setIsUpdatingCoins] = useState(false);

  // Redefine Password Modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    let mounted = true;
    setLoading(true);

    getStudent(studentId)
      .then((data) => {
        if (mounted && data) {
          setStudent(data);
        }
      })
      .catch((err) => {
        console.error('Erro ao buscar dados do estudante:', err);
        toast.error('Não foi possível carregar o perfil do aluno.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [studentId]);

  // Extract skills (score >= 3) and difficulties (score < 3) from student.hub_forms
  const { skills, difficulties } = useMemo(() => {
    if (!student?.hub_forms || student.hub_forms.length === 0) {
      return { skills: [], difficulties: [] };
    }

    return student.hub_forms.reduce(
      (acc, form) => {
        const goodQuestions = (form.questions || []).filter((q) => q.score >= 3).map((e) => e.question_id);
        const badQuestions = (form.questions || []).filter((q) => q.score < 3).map((e) => e.question_id);

        const formSkills: string[] = [];
        const formDifficulties: string[] = [];

        form.hub_form_class?.form?.questions?.forEach((q) => {
          if (goodQuestions.includes(q.id)) formSkills.push(q.title);
          if (badQuestions.includes(q.id)) formDifficulties.push(q.title);
        });

        return {
          skills: removeDuplicateItems([...acc.skills, ...formSkills]),
          difficulties: removeDuplicateItems([...acc.difficulties, ...formDifficulties]),
        };
      },
      { skills: [] as string[], difficulties: [] as string[] }
    );
  }, [student?.hub_forms]);

  // Handle Coin Credit (+) or Debit (-)
  const handleUpdateCoins = async () => {
    if (!student || !coinModalMode) return;
    const val = Number(coinAmount);
    if (isNaN(val) || val <= 0) {
      toast.error('Informe um valor numérico válido maior que zero.');
      return;
    }

    const currentBalance = Number(student.metadata?.coins || 0);

    let newBalance = currentBalance;
    if (coinModalMode === 'add') {
      newBalance = currentBalance + val;
    } else {
      if (val > currentBalance) {
        toast.error('O valor a descontar não pode ultrapassar o saldo atual do aluno.');
        return;
      }
      newBalance = Math.max(0, currentBalance - val);
    }

    setIsUpdatingCoins(true);
    try {
      const updated = await updateStudentData(student.id, newBalance);
      setStudent((prev) => (prev ? { ...prev, ...updated } : prev));
      toast.success(
        `Moedas ${coinModalMode === 'add' ? 'creditadas' : 'descontadas'} com sucesso!`
      );
      setCoinModalMode(null);
      setCoinAmount('');
    } catch (err) {
      console.error('Erro ao atualizar moedas do aluno:', err);
      toast.error('Erro ao atualizar saldo de moedas.');
    } finally {
      setIsUpdatingCoins(false);
    }
  };

  // Handle Redefine Password
  const handleRedefinePassword = async () => {
    if (!student) return;
    if (newPassword.length < 8) {
      toast.error('A senha deve conter no mínimo 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await redefineStudentPassword(student.id, newPassword);
      toast.success('Senha redefinida com sucesso!');
      setPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Erro ao redefinir senha do aluno:', err);
      toast.error('Erro ao redefinir senha.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">Carregando dados do aluno...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="glass-card p-12 text-center rounded-2xl border border-border bg-card space-y-4">
        <p className="text-muted-foreground font-semibold">Aluno não encontrado.</p>
        <button
          onClick={handleBack}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md hover:brightness-105"
        >
          Voltar
        </button>
      </div>
    );
  }

  const currentCoins = Number(student.metadata?.coins || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 pb-12"
    >
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl border border-border/70 bg-card shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2.5 rounded-xl border border-border/70 bg-card hover:bg-accent text-foreground transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Perfil do Aluno
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Avatar and Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 text-primary font-bold text-xl flex items-center justify-center border-2 border-primary/30 shadow-md">
              {student.avatar ? (
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (student.name || 'AL').slice(0, 2).toUpperCase()
              )}
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                {student.name}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                @{student.username || student.id} • {student.email || 'Email não cadastrado'}
              </p>
            </div>
          </div>

          {/* Balance & Actions */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            {/* Coins Balance with + and - buttons */}
            <div className="flex items-center gap-2 p-2 px-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-extrabold text-base px-2">
                <Coins className="w-5 h-5" />
                <span>{formatCoin(currentCoins)}</span>
              </div>

              {/* + Button */}
              <button
                type="button"
                title="Creditar moedas"
                onClick={() => {
                  setCoinModalMode('add');
                  setCoinAmount('');
                }}
                className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>

              {/* - Button */}
              <button
                type="button"
                title="Descontar moedas"
                disabled={currentCoins <= 0}
                onClick={() => {
                  setCoinModalMode('remove');
                  setCoinAmount('');
                }}
                className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Minus className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            {/* Redefine Password Button */}
            <button
              type="button"
              onClick={() => setPasswordModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/80 bg-card hover:bg-accent text-foreground text-xs font-bold transition-all shadow-sm"
            >
              <KeyRound className="w-4 h-4 text-primary" />
              <span>Resetar Senha</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1 col): Grupos, Habilidades e Dificuldades */}
        <div className="space-y-6">
          {/* Card: Grupos */}
          <div className="p-5 rounded-2xl border border-border/70 bg-card shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                <UsersIcon className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-foreground text-base">Grupos do Aluno</h3>
            </div>

            <div className="space-y-2">
              {(student.groups || []).map((group) => (
                <Link
                  key={group.id}
                  to={`/groups/${group.id}`}
                  className="p-3 rounded-xl border border-border/60 bg-muted/10 hover:border-primary hover:bg-accent/30 transition-all flex items-center justify-between group block"
                >
                  <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {group.display_name}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                    Ver Grupo →
                  </span>
                </Link>
              ))}

              {(student.groups || []).length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-6">
                  Aluno não participa de nenhum grupo ativo.
                </p>
              )}
            </div>
          </div>

          {/* Card: Habilidades (score >= 3) */}
          <div className="p-5 rounded-2xl border border-border/70 bg-card shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base">Habilidades em Destaque</h3>
                <p className="text-[11px] text-muted-foreground">Critérios com nota 3 ou superior</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold"
                >
                  {skill}
                </span>
              ))}

              {skills.length === 0 && (
                <p className="text-xs text-muted-foreground italic py-4">
                  Nenhuma habilidade avaliada com nota satisfatória ainda.
                </p>
              )}
            </div>
          </div>

          {/* Card: Dificuldades (score < 3) */}
          <div className="p-5 rounded-2xl border border-border/70 bg-card shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base">Pontos de Atenção</h3>
                <p className="text-[11px] text-muted-foreground">Critérios com nota inferior a 3</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {difficulties.map((diff) => (
                <span
                  key={diff}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold"
                >
                  {diff}
                </span>
              ))}

              {difficulties.length === 0 && (
                <p className="text-xs text-muted-foreground italic py-4">
                  Nenhum ponto de atenção crítico registrado.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (2 cols): Gráfico de Avaliação do Aluno */}
        <div className="lg:col-span-2">
          {student.hub_forms && student.hub_forms.length > 0 ? (
            <StudentEvaluationChart forms={student.hub_forms} />
          ) : (
            <div className="p-12 rounded-2xl border border-border/70 bg-card shadow-sm text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-foreground">Sem histórico de avaliações</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Assim que o professor registrar avaliações quinzenais para este aluno, o gráfico de evolução por habilidade aparecerá aqui.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CONTROLE DE MOEDAS (+ ou -) */}
      <Dialog open={!!coinModalMode} onOpenChange={(open) => !open && setCoinModalMode(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  coinModalMode === 'add'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-rose-500/10 text-rose-600'
                }`}
              >
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle>
                  {coinModalMode === 'add' ? 'Creditar Moedas' : 'Descontar Moedas'}
                </DialogTitle>
                <DialogDescription>
                  Saldo atual: {formatCoin(currentCoins)}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Quantidade de Moedas ({coinModalMode === 'add' ? 'a adicionar' : 'a subtrair'})
              </label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                autoFocus
                placeholder="Ex: 10.00"
                value={coinAmount}
                onChange={(e) => setCoinAmount(e.target.value)}
                className="h-11 rounded-xl text-base font-bold"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              disabled={isUpdatingCoins}
              onClick={() => setCoinModalMode(null)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!coinAmount || isUpdatingCoins}
              onClick={handleUpdateCoins}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-md transition-all ${
                coinModalMode === 'add'
                  ? 'bg-emerald-600 hover:brightness-105'
                  : 'bg-rose-600 hover:brightness-105'
              }`}
            >
              {isUpdatingCoins ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Atualizando...</span>
                </>
              ) : (
                <span>Confirmar</span>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL RESETAR SENHA */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle>Resetar Senha do Aluno</DialogTitle>
                <DialogDescription>
                  Defina uma nova senha de acesso para {student.name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Nova Senha (mínimo 8 caracteres)</label>
              <Input
                type="password"
                placeholder="Digite a nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-10 rounded-xl text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Confirmar Nova Senha</label>
              <Input
                type="password"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-10 rounded-xl text-sm font-medium"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              disabled={isUpdatingPassword}
              onClick={() => setPasswordModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={newPassword.length < 8 || newPassword !== confirmPassword || isUpdatingPassword}
              onClick={handleRedefinePassword}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:brightness-105 transition-all disabled:opacity-50"
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Atualizar Senha</span>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default StudentProfile;
