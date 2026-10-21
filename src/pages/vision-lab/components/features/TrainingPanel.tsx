import { BrainCircuit, Play, CheckCircle2 } from 'lucide-react';
import { useVisionLabStore } from '@/_base/hooks';
import { trainModel } from '@/_base/lib/ml';

export function TrainingPanel() {
  const { classes, isTraining, isTrained, trainingProgress, setTrainingState, openConfirmModal } = useVisionLabStore();

  const handleTrain = async () => {
    const invalidClasses = classes.filter((c) => c.samples.length === 0);
    if (invalidClasses.length > 0) {
      openConfirmModal(null, 'error_no_samples');
      return;
    }
    if (classes.length < 2) {
      openConfirmModal(null, 'error_min_classes_train');
      return;
    }

    setTrainingState({ isTraining: true, trainingProgress: 'Preparando Dados...' });

    try {
      await new Promise((r) => setTimeout(r, 100));

      await trainModel(classes, (epoch, loss) => {
        setTrainingState({
          trainingProgress: `Época ${epoch + 1}/50 - Perda: ${loss.toFixed(4)}`,
        });
      });

      setTrainingState({ isTraining: false, isTrained: true, trainingProgress: 'Modelo Treinado!' });
    } catch (err) {
      console.error(err);
      setTrainingState({ isTraining: false, trainingProgress: 'Erro no treinamento' });
    }
  };

  return (
    <div className="glass-card w-full max-w-xs rounded-3xl p-6 border border-border/60 shadow-xl flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <BrainCircuit className="w-8 h-8 text-primary" />
      </div>

      <h3 className="text-lg font-bold text-foreground">Treinamento</h3>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1 mb-5">
        Ensine o computador com suas amostras!
      </p>

      <button
        type="button"
        disabled={isTraining}
        onClick={handleTrain}
        className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
          isTraining
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : isTrained
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
            : 'apple-btn'
        }`}
      >
        {!isTraining && <Play className="w-4 h-4 fill-current" />}
        <span>{isTraining ? trainingProgress : isTrained ? 'TREINAR NOVAMENTE' : 'TREINAR AGORA'}</span>
      </button>

      {isTraining && (
        <div className="w-full mt-4 bg-muted rounded-full h-2 overflow-hidden">
          <div className="bg-primary h-full w-full animate-pulse" />
        </div>
      )}

      {isTrained && !isTraining && (
        <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>{trainingProgress}</span>
        </div>
      )}
    </div>
  );
}
