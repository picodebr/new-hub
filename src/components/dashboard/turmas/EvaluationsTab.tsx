import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
  Download,
  Loader2,
  Filter,
  Check,
  ChevronDown,
} from 'lucide-react';
import { Turma } from './turmasData';
import { IHubClass } from '@/_base/interfaces/class';
import { IHubFormClass, IHubFormClassUser } from '@/_base/interfaces/form';
import {
  createHubFormClassUser,
  updateHubFormClassUser,
  finishHubFormClass,
} from '@/_base/services/form';
import { ClassSkillChart, IDailySkillAverage } from './ClassSkillChart';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatShortName } from '@/_base/utils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface Props {
  turma: Turma;
  hubClass?: IHubClass | null;
  onReloadClass?: () => void;
}

type SubTab = 'Avaliar' | 'Histórico';

interface RatingQuestionItem {
  id: string;
  label: string;
  description?: string;
  value: number;
}

interface FinishedFormRecord {
  student_id: string;
  questions: RatingQuestionItem[];
  hub_form_class_user_id?: string | null;
}

interface IEvaluationRecord {
  student_id: string | number;
  category: string;
  score: number;
  created_at: string;
}

const SCORE_FEEDBACK: Record<number, string> = {
  1: 'Insatisfatório - Apresenta grandes dificuldades',
  2: 'Abaixo do esperado - Requer atenção e mediação',
  3: 'Satisfatório - Atinge os objetivos propostos',
  4: 'Bom - Demonstra consistência e iniciativa',
  5: 'Excelente - Supera as expectativas com autonomia',
};

const EvaluationsTab = ({ turma, hubClass, onReloadClass }: Props) => {
  const effectiveClass = (hubClass || turma.raw) as IHubClass | undefined;

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('Avaliar');
  const [currentFormLink, setCurrentFormLink] = useState<IHubFormClass | null>(
    effectiveClass?.current_form || null
  );
  const [finishedForms, setFinishedForms] = useState<FinishedFormRecord[]>([]);

  // Evaluating student
  const [targetStudent, setTargetStudent] = useState<any | null>(null);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [draftQuestions, setDraftQuestions] = useState<RatingQuestionItem[]>([]);
  const [hoverRating, setHoverRating] = useState<Record<string, number>>({});
  const [isSavingEval, setIsSavingEval] = useState(false);
  const [isFinalizingCycle, setIsFinalizingCycle] = useState(false);

  // History filtering & PDF Export
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('ALL');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const pdfExportRef = useRef<HTMLDivElement>(null);

  // Keep currentFormLink in sync
  useEffect(() => {
    if (effectiveClass?.current_form) {
      setCurrentFormLink(effectiveClass.current_form);
    }
  }, [effectiveClass?.current_form]);

  const students = useMemo(() => {
    return effectiveClass?.students || turma.students || [];
  }, [effectiveClass?.students, turma.students]);

  // Questions from current active form
  const formQuestions: Omit<RatingQuestionItem, 'value'>[] = useMemo(() => {
    if (!currentFormLink?.form?.questions) return [];
    return currentFormLink.form.questions.map((q) => ({
      id: q.id,
      label: q.title,
      description: q.description || undefined,
    }));
  }, [currentFormLink?.form?.questions]);

  // Load existing evaluations in the current cycle from currentFormLink.student_relations
  useEffect(() => {
    if (!currentFormLink?.id || !currentFormLink?.student_relations) return;

    try {
      const records: FinishedFormRecord[] = currentFormLink.student_relations
        .map((studentRel) => {
          const questions = (studentRel.questions || [])
            .map((q: any) => {
              const formQ = currentFormLink.form?.questions?.find((fq) => fq.id === q.question_id);
              if (!formQ) return null;
              return {
                id: q.question_id,
                label: formQ.title,
                description: formQ.description || undefined,
                value: q.score,
              };
            })
            .filter(Boolean) as RatingQuestionItem[];

          return {
            student_id: studentRel.hub_user_id,
            questions,
            hub_form_class_user_id: studentRel.id,
          };
        })
        .filter(Boolean);

      setFinishedForms(records);
    } catch (err) {
      console.error('Erro ao processar avaliações existentes:', err);
    }
  }, [currentFormLink]);

  // Last evaluation date
  const lastExam = useMemo(() => {
    const finishedLinks = (effectiveClass?.form_links || [])
      .filter((f) => f.finished_at)
      .sort((a, b) => new Date(b.finished_at!).getTime() - new Date(a.finished_at!).getTime());
    return finishedLinks[0] || null;
  }, [effectiveClass?.form_links]);

  const lastExamFormatted = useMemo(() => {
    if (!lastExam?.finished_at) return '—';
    return new Date(lastExam.finished_at).toLocaleDateString('pt-BR');
  }, [lastExam]);

  const nextExamFormatted = useMemo(() => {
    if (!currentFormLink?.finished_at) return 'Em andamento';
    const finishedDate = new Date(currentFormLink.finished_at);
    finishedDate.setDate(finishedDate.getDate() + 15);
    return finishedDate.toLocaleDateString('pt-BR');
  }, [currentFormLink?.finished_at]);

  const isCycleFinished = !!currentFormLink?.finished_at;
  const evaluatedCount = finishedForms.length;
  const progressPercent =
    students.length > 0 ? Math.round((evaluatedCount / students.length) * 100) : 0;

  // Open modal for student
  const handleOpenEvaluation = (student: any) => {
    setTargetStudent(student);
    const existing = finishedForms.find((f) => f.student_id === student.id);
    if (existing && existing.questions.length > 0) {
      setDraftQuestions(existing.questions);
    } else {
      setDraftQuestions(
        formQuestions.map((q) => ({
          ...q,
          value: 0,
        }))
      );
    }
    setHoverRating({});
    setEvalModalOpen(true);
  };

  const handleRateQuestion = (questionId: string, rating: number) => {
    setDraftQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, value: rating } : q))
    );
  };

  const allQuestionsAnswered =
    draftQuestions.length > 0 && draftQuestions.every((q) => q.value > 0);

  // Save student evaluation
  const handleSaveStudentEvaluation = async () => {
    if (!targetStudent || !currentFormLink?.id || !allQuestionsAnswered) return;
    setIsSavingEval(true);
    try {
      const existing = finishedForms.find((f) => f.student_id === targetStudent.id);
      const questionsData = draftQuestions.map((q) => ({
        question_id: q.id,
        score: q.value,
      }));

      if (existing?.hub_form_class_user_id) {
        await updateHubFormClassUser(existing.hub_form_class_user_id, questionsData);
        setFinishedForms((prev) =>
          prev.map((f) =>
            f.student_id === targetStudent.id ? { ...f, questions: draftQuestions } : f
          )
        );
        toast.success(`Avaliação de ${targetStudent.name || 'aluno'} atualizada!`);
      } else {
        const created = await createHubFormClassUser({
          hub_form_class_id: currentFormLink.id,
          hub_user_id: targetStudent.id,
          questions: questionsData,
        });
        setFinishedForms((prev) => [
          ...prev.filter((f) => f.student_id !== targetStudent.id),
          {
            student_id: targetStudent.id,
            questions: draftQuestions,
            hub_form_class_user_id: (created as any)?.id || null,
          },
        ]);
        toast.success(`Avaliação de ${targetStudent.name || 'aluno'} registrada!`);
      }

      setEvalModalOpen(false);
      if (onReloadClass) onReloadClass();
    } catch (err) {
      console.error('Erro ao salvar avaliação:', err);
      toast.error('Erro ao salvar avaliação do aluno.');
    } finally {
      setIsSavingEval(false);
    }
  };

  // Finalize evaluation cycle
  const handleFinishCycle = async () => {
    if (!currentFormLink?.id) return;
    setIsFinalizingCycle(true);
    try {
      await finishHubFormClass(currentFormLink.id);
      const nowIso = new Date().toISOString();
      setCurrentFormLink((prev) => (prev ? { ...prev, finished_at: nowIso } : null));
      toast.success('Ciclo de avaliação finalizado com sucesso!');
      if (onReloadClass) onReloadClass();
    } catch (err) {
      console.error('Erro ao finalizar ciclo:', err);
      toast.error('Erro ao finalizar ciclo de avaliação.');
    } finally {
      setIsFinalizingCycle(false);
    }
  };

  // Export history PDF via html2canvas and jsPDF
  const handleExportHistoryPdf = async () => {
    if (!pdfExportRef.current) return;
    setIsExportingPdf(true);
    try {
      await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 200)));

      const canvas = await html2canvas(pdfExportRef.current, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll('[data-pdf-ignore="true"]').forEach((el) => {
            if (el instanceof HTMLElement) el.style.display = 'none';
          });
          const header = clonedDoc.querySelector('[data-pdf-header="true"]');
          if (header instanceof HTMLElement) header.style.display = 'block';
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = 210; // mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const safeClassName = (turma.name || 'Turma').replace(/[\s/\\?%*:|"<>]/g, '_');
      pdf.save(`Historico_Avaliacoes_${safeClassName}.pdf`);
      toast.success('Relatório PDF gerado com sucesso!');
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      toast.error('Erro ao gerar relatório em PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // --- History Extraction ---
  const allEvaluations: IEvaluationRecord[] = useMemo(() => {
    const list: IEvaluationRecord[] = [];
    (effectiveClass?.form_links || []).forEach((formLink) => {
      (formLink.student_relations || []).forEach((studentRel) => {
        (studentRel.questions || []).forEach((q: any) => {
          const categoryTitle =
            formLink.form?.questions?.find((fq) => fq.id === q.question_id)?.title ||
            'Habilidade Geral';
          list.push({
            category: categoryTitle,
            score: q.score,
            student_id: studentRel.hub_user_id,
            created_at: formLink.finished_at || formLink.created_at || new Date().toISOString(),
          });
        });
      });
    });
    return list;
  }, [effectiveClass?.form_links]);

  const uniqueHistorySkills = useMemo(() => {
    return Array.from(new Set(allEvaluations.map((e) => e.category))).filter(Boolean);
  }, [allEvaluations]);

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          {(['Avaliar', 'Histórico'] as SubTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveSubTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeSubTab === tab
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeSubTab === 'Avaliar' && !isCycleFinished && evaluatedCount > 0 && (
          <button
            type="button"
            disabled={isFinalizingCycle}
            onClick={handleFinishCycle}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:brightness-105 transition-all disabled:opacity-50"
          >
            {isFinalizingCycle ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            Finalizar Ciclo de Avaliação
          </button>
        )}
      </div>

      {/* VIEW: AVALIAR */}
      {activeSubTab === 'Avaliar' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl border border-border/70 bg-card shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Última Avaliação
                </p>
                <p className="text-xl font-extrabold text-foreground mt-1">{lastExamFormatted}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-border/70 bg-card shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Próxima Avaliação
                </p>
                <p className="text-xl font-extrabold text-foreground mt-1">{nextExamFormatted}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                <CalendarRange className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-border/70 bg-card shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Progresso
                </p>
                <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {progressPercent}%
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-border/70 bg-card shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Avaliados
                </p>
                <p className="text-xl font-extrabold text-primary mt-1">
                  {evaluatedCount}/{students.length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ClipboardList className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Status Banner */}
          {isCycleFinished && (
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-bold text-foreground">
                  Ciclo de Avaliação Quinzenal Finalizado
                </span>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                Próxima rodada liberada em breve
              </span>
            </div>
          )}

          {/* Student Evaluation List */}
          <div className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between text-xs font-bold text-muted-foreground">
              <div className="w-12 text-center">#</div>
              <div className="flex-1">Aluno</div>
              <div className="w-32 text-center">Status</div>
              <div className="w-32 text-center">Média</div>
              <div className="w-32 text-right pr-4">Ação</div>
            </div>

            <div className="divide-y divide-border/40">
              {students.map((student: any, idx: number) => {
                const finishedRecord = finishedForms.find((f) => f.student_id === student.id);
                const isEvaluated = !!finishedRecord;

                const averageScore = isEvaluated
                  ? (
                      finishedRecord.questions.reduce((acc, q) => acc + q.value, 0) /
                      (finishedRecord.questions.length || 1)
                    ).toFixed(1)
                  : null;

                return (
                  <div
                    key={student.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-accent/30 transition-colors"
                  >
                    <div className="w-12 text-center text-xs font-mono font-bold text-muted-foreground">
                      {idx + 1}
                    </div>

                    <div className="flex-1 flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: student.color || 'hsl(var(--primary))' }}
                      >
                        {student.initials ||
                          (student.name || 'AL')
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-bold text-foreground truncate">{student.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {student.username || `@${student.id}`}
                        </p>
                      </div>
                    </div>

                    <div className="w-32 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          isEvaluated
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isEvaluated ? 'Avaliado' : 'Pendente'}
                      </span>
                    </div>

                    <div className="w-32 text-center text-xs font-bold text-foreground">
                      {averageScore ? (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <Star className="w-3.5 h-3.5 fill-primary" />
                          {averageScore}
                        </span>
                      ) : (
                        '—'
                      )}
                    </div>

                    <div className="w-32 flex items-center justify-end pr-4">
                      {!isCycleFinished && (
                        <button
                          type="button"
                          onClick={() => handleOpenEvaluation(student)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isEvaluated
                              ? 'bg-accent hover:bg-accent/80 text-foreground'
                              : 'bg-primary text-primary-foreground hover:brightness-105 shadow-sm'
                          }`}
                        >
                          {isEvaluated ? 'Revisar' : 'Avaliar'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: HISTÓRICO */}
      {activeSubTab === 'Histórico' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border border-border/70 bg-card shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4" data-pdf-ignore="true">
            {/* Student Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-bold text-foreground">Filtrar Aluno:</span>
              <select
                value={selectedStudentFilter}
                onChange={(e) => setSelectedStudentFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold outline-none focus:border-primary"
              >
                <option value="ALL">TODOS (Média Geral da Turma)</option>
                {students.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.display_name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={isExportingPdf || uniqueHistorySkills.length === 0}
              onClick={handleExportHistoryPdf}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:brightness-105 transition-all disabled:opacity-50"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Exportando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Exportar PDF</span>
                </>
              )}
            </button>
          </div>

          {/* PDF Container (Captures on Export) */}
          <div ref={pdfExportRef} className="p-4 bg-card rounded-2xl border border-border/60">
            {/* Hidden Header for PDF Capture */}
            <div
              data-pdf-header="true"
              style={{ display: 'none' }}
              className="mb-6 p-4 border-b border-slate-300"
            >
              <h2 className="text-xl font-bold text-slate-800">
                {turma.name} - Histórico de Avaliações
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Filtro: {selectedStudentFilter === 'ALL' ? 'Média Geral da Turma' : students.find((s: any) => s.id === selectedStudentFilter)?.name || 'Aluno'}
              </p>
            </div>

            {uniqueHistorySkills.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground italic text-sm">
                Nenhuma avaliação registrada no histórico da turma.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {uniqueHistorySkills.map((skillName) => {
                  const skillEvals = allEvaluations.filter((e) => e.category === skillName);
                  const dailyMap = new Map<string, { sum: number; count: number }>();

                  skillEvals.forEach((ev) => {
                    if (
                      selectedStudentFilter !== 'ALL' &&
                      String(ev.student_id) !== String(selectedStudentFilter)
                    ) {
                      return;
                    }

                    const exactDay = new Date(ev.created_at).toLocaleDateString('pt-BR');
                    const current = dailyMap.get(exactDay) || { sum: 0, count: 0 };
                    dailyMap.set(exactDay, {
                      sum: current.sum + Number(ev.score || 0),
                      count: current.count + 1,
                    });
                  });

                  const chartData: IDailySkillAverage[] = Array.from(dailyMap.entries())
                    .map(([date, { sum, count }]) => ({
                      date,
                      média: count > 0 ? Number((sum / count).toFixed(2)) : 0,
                    }))
                    .sort((a, b) => {
                      const [dA, mA, yA] = a.date.split('/').map(Number);
                      const [dB, mB, yB] = b.date.split('/').map(Number);
                      return (
                        new Date(yA, mA - 1, dA).getTime() - new Date(yB, mB - 1, dB).getTime()
                      );
                    });

                  return <ClassSkillChart key={skillName} skillName={skillName} data={chartData} />;
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE AVALIAÇÃO DE ALUNO */}
      <Dialog open={evalModalOpen} onOpenChange={setEvalModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-border/50 bg-muted/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold text-sm flex items-center justify-center">
              {(targetStudent?.name || 'AL').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Avaliando Aluno(a)
              </span>
              <DialogTitle className="text-base font-extrabold text-foreground">
                {targetStudent?.name}
              </DialogTitle>
            </div>
          </div>

          {/* Form Questions */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {currentFormLink?.form?.title && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                <h4 className="text-xs font-bold text-primary">
                  {currentFormLink.form.title}
                </h4>
                {currentFormLink.form.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {currentFormLink.form.description}
                  </p>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground font-medium">
              Avalie o aluno de 1 a 5 estrelas em cada critério avaliativo:
            </p>

            <div className="space-y-4">
              {draftQuestions.map((q) => {
                const currentVal = q.value;
                const hovered = hoverRating[q.id] || 0;
                const activeVal = hovered || currentVal;

                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-border/60 bg-card space-y-2.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{q.label}</h4>
                        {q.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                            {q.description}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-extrabold text-primary shrink-0">
                        {currentVal > 0 ? `${currentVal}/5` : 'Não avaliado'}
                      </span>
                    </div>

                    {/* Star Rating Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() =>
                            setHoverRating((prev) => ({ ...prev, [q.id]: star }))
                          }
                          onMouseLeave={() =>
                            setHoverRating((prev) => ({ ...prev, [q.id]: 0 }))
                          }
                          onClick={() => handleRateQuestion(q.id, star)}
                          className="p-1 rounded-md transition-transform hover:scale-110 active:scale-95"
                        >
                          <Star
                            className={`w-5 h-5 transition-colors ${
                              star <= activeVal
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        </button>
                      ))}

                      {activeVal > 0 && (
                        <span className="text-[11px] font-semibold text-muted-foreground ml-2">
                          {SCORE_FEEDBACK[activeVal]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 bg-muted/10 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {draftQuestions.filter((q) => q.value > 0).length}/{draftQuestions.length} avaliadas
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSavingEval}
                onClick={() => setEvalModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-accent"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!allQuestionsAnswered || isSavingEval}
                onClick={handleSaveStudentEvaluation}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:brightness-105 transition-all disabled:opacity-50"
              >
                {isSavingEval ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Concluir Avaliação</span>
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EvaluationsTab;
