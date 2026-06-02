import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Check } from 'lucide-react';
import { Turma } from './turmasData';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allTurmas: Turma[];
  addedIds: string[];
  onToggle: (id: string) => void;
  onToggleAll: (selectAll: boolean) => void;
}

const AddTurmaDialog = ({ open, onOpenChange, allTurmas, addedIds, onToggle, onToggleAll }: Props) => {
  const allSelected = addedIds.length === allTurmas.length;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="glass-card w-full max-w-md max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground text-base">Turmas da Escola</h2>
                    <p className="text-xs text-muted-foreground">Selecione as turmas para seu painel</p>
                  </div>
                </div>
                <button onClick={() => onOpenChange(false)} className="p-2 rounded-xl hover:bg-accent transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="p-4 border-b border-border/50">
                <button
                  onClick={() => onToggleAll(!allSelected)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-accent/50 hover:bg-accent transition-colors"
                >
                  <span className="text-sm font-medium text-foreground">Selecionar todas as disponíveis</span>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${allSelected ? 'bg-primary' : 'border-2 border-muted-foreground/30'}`}>
                    {allSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {allTurmas.map(turma => {
                  const isAdded = addedIds.includes(turma.id);
                  return (
                    <button
                      key={turma.id}
                      onClick={() => onToggle(turma.id)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{turma.name}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${isAdded ? 'bg-primary' : 'border-2 border-muted-foreground/30'}`}>
                        {isAdded && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-3 p-4 border-t border-border/50">
                <button
                  onClick={() => onOpenChange(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => onOpenChange(false)}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Adicionar Turmas
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddTurmaDialog;
