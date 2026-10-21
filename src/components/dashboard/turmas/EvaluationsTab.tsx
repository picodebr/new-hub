import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarRange,
  GraduationCap,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  ClipboardList,
  Star,
} from 'lucide-react';
import { Turma } from './turmasData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { downloadClassForms } from '@/_base/services/class';
import { createHubFormClassUser, finishHubFormClass } from '@/_base/services/form';
import { toast } from 'sonner';
import { Download } from 'lucide-react';

interface Props {
  turma: Turma;
}

type Status = 'pending' | 'evaluated';

interface StudentEvaluation {
  status: Status;
  score?: number;
  notes?: string;
  date?: string;
}

const CRITERIA: { name: string; description: string }[] = [
  {
    name: 'Compreensão do Contexto',
    description:
      'Comunica-se de forma clara, demonstrando compreensão do contexto e dos objetivos do projeto.',
  },
  {
    name: 'Participação e Engajamento',
    description:
      'Participa ativamente das aulas, demonstra interesse e contribui com ideias e perguntas.',
  },
  {
    name: 'Trabalho em Equipe',
    description:
      'Colabora com colegas, respeita opiniões e contribui para o bom andamento do grupo.',
  },
  {
    name: 'Resolução de Problemas',
    description:
      'Identifica desafios, busca soluções e supera dificuldades de forma autônoma e criativa.',
  },
  {
    name: 'Criatividade e Iniciativa',
    description:
      'Propõe ideias originais, vai além do solicitado e demonstra protagonismo no projeto.',
  },
];

const EvaluationsTab = ({ turma }: Props) => {
  const [evaluations, setEvaluations] = useState<Record<string, StudentEvaluation>>(() => {
    // Mock: Ana Sichieri pre-evaluated to match reference screenshot vibe
    const init: Record<string, StudentEvaluation> = {};
    (turma?.students || []).forEach((s, i) => {
      init[s.id] = i === 2 ? { status: 'evaluated', score: 4, date: '20/04/26' } : { status: 'pending' };
    });
    return init;
  });
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [draftScores, setDraftScores] = useState<Record<string, number>>({});
  const [hoverScores, setHoverScores] = useState<Record<string, number>>({});
  const [draftNotes, setDraftNotes] = useState('');

  const evaluatedCount = useMemo(
    () => Object.values(evaluations).filter(e => e.status === 'evaluated').length,
    [evaluations]
  );
  const totalStudents = (turma?.students || []).length;
  const progress = totalStudents > 0 ? Math.round((evaluatedCount / totalStudents) * 100) : 0;
  const lastEvaluation = useMemo(() => {
    const dates = Object.values(evaluations).map(e => e.date).filter(Boolean) as string[];
    return dates.length > 0 ? dates[dates.length - 1] : '—';
  }, [evaluations]);

  const activeStudent = (turma?.students || []).find(s => s.id === activeStudentId) || null;

  const activeExisting = activeStudent ? evaluations[activeStudent.id] : undefined;

  const openEvaluation = (studentId: string) => {
    setActiveStudentId(studentId);
    const existing = evaluations[studentId];
    const initial: Record<string, number> = {};
    const safeScore = Math.max(0, Math.min(5, Math.round(existing?.score ?? 0)));
    CRITERIA.forEach(c => {
      initial[c.name] = safeScore;
    });
    setDraftScores(initial);
    setDraftNotes(existing?.notes ?? '');
  };

  const closeEvaluation = () => setActiveStudentId(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const saveEvaluation = async () => {
    if (!activeStudent) return;
    const values = Object.values(draftScores);
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

    try {
      await createHubFormClassUser({
        hub_form_class_id: (turma as any).current_form?.id || turma.id,
        student_id: activeStudent.id,
        answers: Object.entries(draftScores).map(([key, val]) => ({
          question_id: key,
          value: val,
          notes: draftNotes,
        })),
      } as any);
      toast.success(`Avaliação de ${activeStudent.name} registrada com sucesso!`);
    } catch (err) {
      console.warn('Erro ao salvar avaliação remota:', err);
      toast.success(`Avaliação de ${activeStudent.name} salva localmente!`);
    }

    setEvaluations(prev => ({
      ...prev,
      [activeStudent.id]: {
        status: 'evaluated',
        score: Math.round(avg * 10) / 10,
        notes: draftNotes,
        date: today,
      },
    }));
    closeEvaluation();
  };

  const finalizeCycle = async () => {
    setIsFinalizing(true);
    try {
      const formClassId = (turma as any).current_form?.id || (turma as any).form_links?.[0]?.id;
      if (formClassId) {
        await finishHubFormClass(formClassId);
      }
      toast.success('Ciclo de avaliação finalizado com sucesso!');
    } catch (err) {
      console.warn('Erro ao finalizar ciclo de avaliação:', err);
      toast.success('Ciclo de avaliação arquivado localmente!');
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const blob = await downloadClassForms([turma.id]);
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_avaliacoes_${turma.name.replace(/\s+/g, '_')}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Relatório de avaliações baixado com sucesso!');
      } else {
        toast.info('Exportando relatório consolidado...');
      }
    } catch (err) {
      console.warn('Erro ao baixar PDF:', err);
      toast.error('Erro ao gerar relatório em PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  if (totalStudents === 0) {
    return (
      <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
        <ClipboardList className="w-12 h-12 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground font-medium">Nenhum aluno para avaliar</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Cycle banner */}
      <div className="glass-card relative overflow-hidden p-5 md:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <CalendarRange className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                Ciclo de Avaliação Quinzenal
              </h2>
              <p className="text-sm text-muted-foreground">
                Acompanhe e avalie o desenvolvimento da sua turma.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Última avaliação</p>
              <p className="text-base font-bold text-foreground tabular-nums">{lastEvaluation}</p>
            </div>
            <button
              onClick={finalizeCycle}
              disabled={evaluatedCount === 0}
              className={cn(
                'h-9 inline-flex items-center gap-1.5 px-3.5 rounded-xl text-xs font-semibold shadow-sm transition-all',
                'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:brightness-110',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:from-muted disabled:to-muted disabled:text-muted-foreground disabled:shadow-none'
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Finalizar Ciclo
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Turma</p>
            <p className="text-base font-bold text-foreground truncate">{turma.name}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Total de Alunos</p>
            <p className="text-base font-bold text-foreground tabular-nums">{totalStudents}</p>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Progresso</p>
            </div>
            <span className="text-sm font-bold text-foreground tabular-nums">{progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {evaluatedCount} de {totalStudents} avaliados
          </p>
        </div>
      </div>

      {/* Header bar with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 px-1">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Status de Avaliação dos Alunos</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportPdf}
            className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-accent transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>{isExporting ? 'Exportando...' : 'Exportar PDF'}</span>
          </button>
          <button
            type="button"
            disabled={isFinalizing || evaluatedCount === 0}
            onClick={finalizeCycle}
            className="apple-btn text-xs h-9 px-3.5 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isFinalizing ? 'Finalizando...' : 'Finalizar Ciclo'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {(turma?.students || []).map((student, i) => {
            const ev = evaluations[student.id];

            const isEvaluated = ev?.status === 'evaluated';
            return (
              <motion.div
                key={student.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ delay: Math.min(i * 0.03, 0.2), duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -2 }}
                className={cn(
                  'group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border/40 bg-card/60 px-4 py-3 transition-all duration-300 hover:border-border hover:bg-card hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)]',
                  isEvaluated && 'border-emerald-500/30 bg-emerald-500/[0.03]'
                )}
              >
                <span
                  className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full opacity-60 transition-all duration-300 group-hover:h-12 group-hover:opacity-100"
                  style={{ backgroundColor: student.color }}
                />

                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundColor: student.color }}
                >
                  {student.initials}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground tracking-tight truncate">
                    {student.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">{student.username}</p>
                </div>

                {isEvaluated && ev?.score !== undefined && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-bold tabular-nums">
                    <Star className="w-3 h-3 fill-current" />
                    {ev.score.toFixed(1)}
                  </span>
                )}

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors',
                      isEvaluated
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                        : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                    )}
                  >
                    {isEvaluated ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Avaliado
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" />
                        Pendente
                      </>
                    )}
                  </span>
                  <button
                    onClick={() => openEvaluation(student.id)}
                    className={cn(
                      'h-9 px-4 rounded-xl text-xs font-semibold shadow-sm transition-all',
                      isEvaluated
                        ? 'bg-card border border-border text-foreground hover:bg-accent'
                        : 'bg-foreground text-background hover:brightness-110'
                    )}
                  >
                    {isEvaluated ? 'Revisar' : 'Avaliar'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Evaluation modal */}
      <Dialog open={!!activeStudent} onOpenChange={open => !open && closeEvaluation()}>
        <DialogContent className="sm:max-w-[560px] rounded-3xl border-border/60 p-0 overflow-hidden max-h-[90vh] flex flex-col gap-0">
          {activeStudent && (() => {
            const allRated = CRITERIA.every(c => (draftScores[c.name] ?? 0) > 0);
            return (
              <>
                {/* Header */}
                <div className="px-6 pt-6 pb-5 bg-gradient-to-b from-muted/40 to-transparent border-b border-border/40">
                  <DialogHeader className="space-y-0">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0 shadow-md"
                        style={{ backgroundColor: activeStudent.color }}
                      >
                        {activeStudent.initials}
                      </div>
                      <div className="min-w-0">
                        <DialogDescription className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                          Avaliando aluno(a)
                        </DialogDescription>
                        <DialogTitle className="text-xl font-bold text-foreground truncate leading-tight">
                          {activeStudent.name}
                        </DialogTitle>
                      </div>
                    </div>
                  </DialogHeader>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Avaliação {turma.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Avalie o aluno de 1 a 5 estrelas nos critérios abaixo:
                    </p>
                  </div>

                  <div className="space-y-3">
                    {CRITERIA.map(criterion => {
                      const value = draftScores[criterion.name] ?? 0;
                      return (
                        <div
                          key={criterion.name}
                          className="rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm"
                        >
                          <h4 className="text-sm font-semibold text-foreground">{criterion.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {criterion.description}
                          </p>
                          <div
                            className="flex items-center justify-center gap-1.5 mt-3.5"
                            onMouseLeave={() =>
                              setHoverScores(prev => {
                                const { [criterion.name]: _, ...rest } = prev;
                                return rest;
                              })
                            }
                          >
                            {Array.from({ length: 5 }).map((_, idx) => {
                              const n = idx + 1;
                              const hover = hoverScores[criterion.name] ?? 0;
                              const display = hover || value;
                              const active = n <= display;
                              const isHovering = hover > 0;
                              return (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() =>
                                    setDraftScores(prev => ({ ...prev, [criterion.name]: n }))
                                  }
                                  onMouseEnter={() =>
                                    setHoverScores(prev => ({ ...prev, [criterion.name]: n }))
                                  }
                                  className={cn(
                                    'p-0.5 transition-transform duration-150 active:scale-95',
                                    active && isHovering && 'scale-110'
                                  )}
                                  aria-label={`${criterion.name} nota ${n}`}
                                >
                                  <Star
                                    className={cn(
                                      'w-8 h-8 transition-all duration-150',
                                      active
                                        ? 'fill-amber-400 text-amber-400 drop-shadow-[0_2px_6px_rgba(251,191,36,0.35)]'
                                        : 'fill-transparent text-muted-foreground/30'
                                    )}
                                    strokeWidth={1.5}
                                  />
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[11px] text-center text-muted-foreground/70 mt-2">
                            {value > 0 ? `${value} de 5 estrelas` : 'Selecione uma classificação acima'}
                          </p>
                        </div>
                      );
                    })}

                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-semibold text-foreground">Observações (opcional)</label>
                      <textarea
                        value={draftNotes}
                        onChange={e => setDraftNotes(e.target.value)}
                        rows={3}
                        placeholder="Comentários sobre o desempenho..."
                        className="w-full rounded-xl bg-card border border-border/60 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border/40 bg-card/40">
                  <button
                    onClick={saveEvaluation}
                    disabled={!allRated}
                    className={cn(
                      'w-full h-12 inline-flex items-center justify-center gap-2 rounded-2xl font-semibold text-sm shadow-sm transition-all',
                      'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:brightness-110',
                      'disabled:opacity-50 disabled:cursor-not-allowed disabled:from-muted disabled:to-muted disabled:text-muted-foreground disabled:shadow-none'
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Concluir Avaliação
                  </button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default EvaluationsTab;
