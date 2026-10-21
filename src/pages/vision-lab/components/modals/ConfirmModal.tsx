import { Trash2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisionLabStore } from '@/_base/hooks';

export function VisionLabConfirmModal() {
  const { classes, activeConfirmModal, closeConfirmModal, removeClass, removeSample } = useVisionLabStore();

  if (!activeConfirmModal) return null;

  const { classId, action } = activeConfirmModal;
  const classData = classId !== null ? classes.find((c) => c.id === classId) : null;
  const isError = action.startsWith('error_') || action === 'info_min_classes';

  const handleConfirm = () => {
    if (classId === null) return;

    if (action === 'clear' && classData) {
      classData.samples.forEach((s) => removeSample(classId, s.id));
    } else if (action === 'remove') {
      removeClass(classId);
    }
    closeConfirmModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={closeConfirmModal}
      />

      {/* Modal Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 15 }}
        className="glass-card relative z-10 w-full max-w-sm rounded-3xl p-6 sm:p-8 border border-border shadow-2xl space-y-4"
      >
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            isError ? 'bg-primary/10 text-primary' : 'bg-rose-500/10 text-rose-500'
          }`}
        >
          {isError ? <AlertCircle className="w-8 h-8" /> : <Trash2 className="w-8 h-8" />}
        </div>

        <div>
          <h3 className="text-xl font-bold text-foreground">
            {action === 'error_no_samples'
              ? 'Faltam exemplos!'
              : action === 'error_min_classes_train'
              ? 'Treinamento impossível'
              : action === 'info_min_classes'
              ? 'Ação não permitida'
              : action === 'clear'
              ? 'Limpar as Fotos?'
              : 'Remover Classe?'}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {action === 'error_no_samples'
              ? 'Todas as classes precisam ter pelo menos um exemplo ou foto para que eu possa aprender!'
              : action === 'error_min_classes_train'
              ? 'Para criar uma inteligência, precisamos comparar pelo menos duas coisas diferentes com exemplos!'
              : action === 'info_min_classes'
              ? 'Não é possível deixar menos de 2 classes. Para criar a inteligência, precisamos comparar pelo menos duas coisas diferentes!'
              : action === 'clear'
              ? 'Como você só tem 2 classes, podemos apenas apagar todas as fotos dela. Tem certeza?'
              : `Tem certeza que deseja jogar a classe "${classData?.name}" fora? Todas as fotos dela serão perdidas.`}
          </p>
        </div>

        <div className="flex gap-2.5 pt-2">
          {isError ? (
            <button
              type="button"
              onClick={closeConfirmModal}
              className="apple-btn w-full py-2.5"
            >
              Entendi
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={closeConfirmModal}
                className="flex-1 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-semibold hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors shadow-md"
              >
                Sim, {action === 'clear' ? 'Limpar' : 'Remover'}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
