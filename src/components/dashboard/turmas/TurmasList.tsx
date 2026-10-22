import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, ArrowUpRight, Download, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Turma } from './turmasData';
import { getColorByGrade } from '@/_base/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface Props {
  turmas: Turma[];
  onSelectTurma: (turma: Turma) => void;
  onAddTurma: () => void;
  onExportEvaluations?: () => void;
  isExporting?: boolean;
  onRemoveTurma?: (turma: Turma) => void;
  isRemoving?: boolean;
}

const TurmasList = ({
  turmas,
  onSelectTurma,
  onAddTurma,
  onExportEvaluations,
  isExporting = false,
  onRemoveTurma,
  isRemoving = false,
}: Props) => {
  const [classToRemove, setClassToRemove] = useState<Turma | null>(null);

  const handleConfirmRemove = () => {
    if (classToRemove && onRemoveTurma) {
      onRemoveTurma(classToRemove);
      setClassToRemove(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Turmas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Gerencie suas turmas e alunos</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {onExportEvaluations && (
            <button
              type="button"
              disabled={isExporting || turmas.length === 0}
              onClick={onExportEvaluations}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border/80 bg-card hover:bg-accent/60 text-foreground font-semibold text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Gerando relatório...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-muted-foreground" />
                  <span>Exportar Avaliações</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onAddTurma}
            data-tour="add-turma-btn"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-105 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Turma</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {turmas.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-border/60 bg-card/60 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-base font-semibold text-foreground">Nenhuma turma encontrada</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Você ainda não possui turmas vinculadas ao seu painel. Clique em "Adicionar Turma" para começar.
          </p>
        </div>
      ) : (
        <div data-tour="turmas-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {turmas.map((turma, i) => {
            const gradeColor = getColorByGrade(turma.grade);
            const cleanCode = turma.code ? turma.code.replace(/^#+/, '') : undefined;

            return (
              <motion.div
                key={turma.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3 }}
                className="group relative w-full overflow-hidden rounded-2xl border border-border/60 bg-card text-left transition-all duration-300 hover:border-border hover:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.18)]"
              >
                {/* Soft accent gradient background */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-40 transition-opacity duration-500 group-hover:opacity-80"
                  style={{
                    background: `radial-gradient(120% 80% at 100% 0%, ${gradeColor}22 0%, ${gradeColor}08 35%, transparent 65%)`,
                  }}
                />

                {/* Left accent bar */}
                <span
                  className="absolute left-0 top-0 bottom-0 w-[4px] transition-all duration-300 group-hover:w-[6px]"
                  style={{ backgroundColor: gradeColor }}
                />

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectTurma(turma)}
                  className="relative p-5 pl-6 cursor-pointer"
                >
                  {/* Top: icon + code + remove button */}
                  <div className="flex items-start justify-between mb-6">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
                      style={{
                        backgroundColor: `${gradeColor}1a`,
                        color: gradeColor,
                        boxShadow: `inset 0 0 0 1px ${gradeColor}33`,
                      }}
                    >
                      <Users className="h-4.5 w-4.5" strokeWidth={2.2} />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {cleanCode && (
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums font-mono"
                          style={{
                            backgroundColor: `${gradeColor}1f`,
                            color: gradeColor,
                            border: `1px solid ${gradeColor}33`,
                          }}
                        >
                          #{cleanCode}
                        </span>
                      )}

                      {onRemoveTurma && (
                        <button
                          type="button"
                          title="Remover turma"
                          onClick={(e) => {
                            e.stopPropagation();
                            setClassToRemove(turma);
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="text-base font-bold text-foreground tracking-tight truncate mb-1">
                    {turma.name}
                  </h3>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground font-medium tabular-nums">
                        {turma.studentCount} {turma.studentCount === 1 ? 'Aluno' : 'Alunos'}
                      </span>
                      {turma.studentCount > 0 && turma.students?.length > 0 && (
                        <div className="flex -space-x-1.5">
                          {turma.students.slice(0, 3).map((s) => (
                            <div
                              key={s.id}
                              className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white ring-2 ring-card"
                              style={{ backgroundColor: s.color || gradeColor }}
                            >
                              {s.initials}
                            </div>
                          ))}
                          {turma.studentCount > 3 && (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[8px] font-bold text-muted-foreground ring-2 ring-card">
                              +{turma.studentCount - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Remove Confirmation Modal */}
      <Dialog open={!!classToRemove} onOpenChange={(open) => !open && setClassToRemove(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle>Remover turma</DialogTitle>
                <DialogDescription>
                  {classToRemove?.name} (#{classToRemove?.code?.replace(/^#+/, '')})
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground">
            Tem certeza que deseja remover esta turma do seu painel? Você não perderá os dados, mas precisará adicioná-la novamente para acessá-la.
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              disabled={isRemoving}
              onClick={() => setClassToRemove(null)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isRemoving}
              onClick={handleConfirmRemove}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold shadow-sm hover:brightness-105 transition-all"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Removendo...
                </>
              ) : (
                'Sim, remover'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default TurmasList;
