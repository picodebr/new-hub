import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Check, Loader2 } from 'lucide-react';
import { Turma } from './turmasData';
import { sortGradesByClass } from '@/_base/utils';
import { addClasses } from '@/_base/services/class';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allTurmas: Turma[];
  alreadyLinkedIds: string[];
  onClassesAdded: (added: any[]) => void;
  schoolName?: string;
}

const AddTurmaDialog = ({
  open,
  onOpenChange,
  allTurmas,
  alreadyLinkedIds,
  onClassesAdded,
  schoolName,
}: Props) => {
  const [selectedNewIds, setSelectedNewIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset selected when opening modal
  useEffect(() => {
    if (open) {
      setSelectedNewIds([]);
    }
  }, [open]);

  // Sort allTurmas using sortGradesByClass
  const sortedAllTurmas = useMemo(() => {
    return sortGradesByClass([...allTurmas]);
  }, [allTurmas]);

  // Available classes are those not yet linked
  const availableTurmas = useMemo(() => {
    return sortedAllTurmas.filter((t) => !alreadyLinkedIds.includes(t.id));
  }, [sortedAllTurmas, alreadyLinkedIds]);

  const allAvailableSelected =
    availableTurmas.length > 0 &&
    availableTurmas.every((t) => selectedNewIds.includes(t.id));

  const handleToggle = (id: string) => {
    if (alreadyLinkedIds.includes(id)) return; // Cannot toggle already linked
    setSelectedNewIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleAllAvailable = () => {
    if (allAvailableSelected) {
      setSelectedNewIds([]);
    } else {
      setSelectedNewIds(availableTurmas.map((t) => t.id));
    }
  };

  const handleConfirmAdd = async () => {
    if (selectedNewIds.length === 0) return;
    setIsSubmitting(true);
    try {
      const result = await addClasses({ class_ids: selectedNewIds });
      toast.success('Turmas vinculadas com sucesso!');
      onClassesAdded(Array.isArray(result) ? result : [result]);
      onOpenChange(false);
    } catch (err) {
      console.error('Erro ao adicionar turmas:', err);
      toast.error('Ocorreu um erro ao vincular as turmas. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => !isSubmitting && onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="glass-card w-full max-w-lg max-h-[85vh] flex flex-col bg-card border border-border shadow-2xl rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground text-base">
                      Turmas da Escola {schoolName ? schoolName : ''}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Selecione as turmas nas quais você leciona para adicioná-las ao seu painel.
                    </p>
                  </div>
                </div>
                <button
                  disabled={isSubmitting}
                  onClick={() => onOpenChange(false)}
                  className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Select All Available Bar */}
              <div className="p-4 border-b border-border/50 bg-muted/20">
                <button
                  type="button"
                  disabled={availableTurmas.length === 0 || isSubmitting}
                  onClick={handleToggleAllAvailable}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border/60 hover:border-primary/50 hover:bg-accent/40 transition-colors disabled:opacity-50"
                >
                  <span className="text-sm font-semibold text-foreground">
                    Selecionar todas as disponíveis ({availableTurmas.length})
                  </span>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                      allAvailableSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'border-2 border-muted-foreground/30'
                    }`}
                  >
                    {allAvailableSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              </div>

              {/* Class list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[45vh]">
                {sortedAllTurmas.map((turma) => {
                  const isAlreadyLinked = alreadyLinkedIds.includes(turma.id);
                  const isChecked = isAlreadyLinked || selectedNewIds.includes(turma.id);

                  return (
                    <button
                      key={turma.id}
                      type="button"
                      disabled={isAlreadyLinked || isSubmitting}
                      onClick={() => handleToggle(turma.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
                        isAlreadyLinked
                          ? 'opacity-50 bg-muted/30 border-border/40 cursor-not-allowed'
                          : isChecked
                          ? 'bg-primary/5 border-primary/40 shadow-sm'
                          : 'bg-card border-border/60 hover:bg-accent/40 hover:border-border'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${turma.color || 'hsl(var(--primary))'}1a`,
                            color: turma.color || 'hsl(var(--primary))',
                          }}
                        >
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <span className="text-sm font-semibold text-foreground block truncate">
                            {turma.name}
                          </span>
                          {turma.code && (
                            <span className="text-[11px] text-muted-foreground font-mono">
                              #{turma.code}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isAlreadyLinked && (
                          <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            Já vinculada
                          </span>
                        )}
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                            isChecked
                              ? 'bg-primary text-primary-foreground'
                              : 'border-2 border-muted-foreground/30'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {sortedAllTurmas.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8 italic">
                    Nenhuma turma encontrada na escola.
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-4 border-t border-border/50 bg-muted/10">
                <span className="text-xs text-muted-foreground">
                  {selectedNewIds.length} {selectedNewIds.length === 1 ? 'turma selecionada' : 'turmas selecionadas'}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => onOpenChange(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={selectedNewIds.length === 0 || isSubmitting}
                    onClick={handleConfirmAdd}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adicionando...
                      </>
                    ) : (
                      'Adicionar Turmas'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddTurmaDialog;
