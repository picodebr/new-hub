import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Flame, Coins, Sparkles, CheckCircle2, XCircle, ArrowRight, Trophy, Heart } from 'lucide-react';
import { getDailyChallenges, sendDailyChallenges } from '@/_base/services/challenges';
import { IDailyChallenge } from '@/_base/interfaces/challenges';
import { toast } from 'sonner';

interface DailyChallengeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRewardClaimed: (coinsEarned: number) => void;
}

interface Question {
  id: string;
  title: string;
  description: string;
  options: string[];
  correctIndex: number;
}

const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 'q1',
    title: 'Desafio Maker: Sensores',
    description: 'Qual sensor é mais indicado para medir a distância de um objeto no robô autônomo?',
    options: ['Sensor Ultrassônico', 'LDR (Luz)', 'Potenciômetro', 'Buzzer'],
    correctIndex: 0,
  },
  {
    id: 'q2',
    title: 'Lógica e Algoritmo',
    description: 'Se uma condição "SE" for falsa e não houver "SENÃO", o que acontece com a execução?',
    options: [
      'O programa é interrompido',
      'O bloco dentro do "SE" é pulado e o código continua',
      'O código entra em loop infinito',
      'O robô reinicia',
    ],
    correctIndex: 1,
  },
];

export const DailyChallengeDialog = ({ open, onOpenChange, onRewardClaimed }: DailyChallengeDialogProps) => {
  const [dailyData, setDailyData] = useState<IDailyChallenge | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [lifes, setLifes] = useState(3);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setSelectedOption(null);
      setAnswered(false);
      setCompleted(false);
      setResults([]);
      getDailyChallenges()
        .then((data) => {
          if (data && Array.isArray(data.challenges) && data.challenges.length > 0) {
            setDailyData(data);
            if (data.daily_lifes !== undefined) setLifes(data.daily_lifes);
          }
        })
        .catch((err) => {
          console.warn('Usando desafio diário padrão:', err);
        });
    }
  }, [open]);

  const questions: Question[] = (dailyData?.challenges && dailyData.challenges.length > 0)
    ? dailyData.challenges.map((c) => {
        const answers = c.data?.quiz_answers || [];
        const correctIdx = answers.findIndex((a) => a.is_correct);
        return {
          id: c.id,
          title: c.title || 'Desafio Diário',
          description: c.description || '',
          options: answers.map((a) => a.text),
          correctIndex: correctIdx >= 0 ? correctIdx : 0,
        };
      })
    : DEFAULT_QUESTIONS;

  const currentQ = questions[currentIndex] || questions[0];

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelectedOption(idx);
  };

  const handleConfirm = () => {
    if (selectedOption === null || answered) return;
    const correct = selectedOption === currentQ.correctIndex;
    setAnswered(true);
    setIsCorrect(correct);

    const newResult = {
      id: currentQ.id,
      hub_challenge_id: currentQ.id,
      isCorrect: correct,
      time: 5,
      attempts: 1,
      option: currentQ.options[selectedOption],
    };
    setResults((prev) => [...prev, newResult]);

    if (!correct) {
      setLifes((l) => Math.max(0, l - 1));
    }
  };

  const handleNext = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setAnswered(false);
    } else {
      // Finalizado
      setLoading(true);
      try {
        const res = await sendDailyChallenges({
          results: results.length > 0 ? results : [{ id: currentQ.id, isCorrect: true, time: 5, attempts: 1 } as any],
        });
        const coinsEarned = typeof res?.coins_earned === 'number' ? res.coins_earned : 5;
        onRewardClaimed(coinsEarned);
        toast.success(`Parabéns! +R$ ${coinsEarned.toFixed(2).replace('.', ',')} em moedas e +1 dia de sequência!`);
      } catch (err) {
        console.warn('Erro ao registrar desafio remoto:', err);
        onRewardClaimed(5);
        toast.success('Parabéns! +R$ 5,00 em moedas e +1 dia de sequência!');
      } finally {
        setLoading(false);
        setCompleted(true);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-lg border-border/50 p-6 sm:rounded-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">Desafio Diário</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Complete para manter sua sequência e ganhar moedas
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-500">
                <Heart className="h-3.5 w-3.5 fill-rose-500" />
                {lifes}
              </div>
              <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Coins className="h-3.5 w-3.5" />
                +R$ 5,00
              </div>
            </div>
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!completed ? (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="mt-4 space-y-4"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider text-primary">
                  Questão {currentIndex + 1} de {DEFAULT_QUESTIONS.length}
                </span>
                <span>{dailyData?.consecutive_days ? `${dailyData.consecutive_days} dias seguidos` : 'Streak ativo'}</span>
              </div>

              <div className="rounded-2xl border border-border/50 bg-card/60 p-4">
                <h3 className="text-sm font-bold text-foreground">{currentQ.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{currentQ.description}</p>
              </div>

              <div className="space-y-2">
                {currentQ.options.map((opt, i) => {
                  const isSel = selectedOption === i;
                  let btnStyle = 'border-border/60 bg-card/40 hover:bg-accent/60';
                  if (answered) {
                    if (i === currentQ.correctIndex) {
                      btnStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold';
                    } else if (isSel) {
                      btnStyle = 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold';
                    }
                  } else if (isSel) {
                    btnStyle = 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/20';
                  }

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelect(i)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-xs text-left transition-all ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {answered && i === currentQ.correctIndex && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      )}
                      {answered && isSel && i !== currentQ.correctIndex && (
                        <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                {!answered ? (
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={selectedOption === null}
                    className="apple-btn w-full"
                  >
                    Confirmar Resposta
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={loading}
                    className="apple-btn w-full flex items-center justify-center gap-2"
                  >
                    <span>{currentIndex + 1 < DEFAULT_QUESTIONS.length ? 'Próxima Questão' : 'Concluir Desafio'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center space-y-4"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/15 text-amber-500 ring-2 ring-amber-500/30">
                <Trophy className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Desafio de Hoje Concluído!</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Você garantiu seu bônus diário e manteve sua sequência em chamas!
                </p>
              </div>

              <div className="inline-flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-600 dark:text-amber-400">
                <Coins className="h-4 w-4" />
                <span>+R$ 5,00 adicionados ao seu saldo</span>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="apple-btn w-full mt-2"
                >
                  Continuar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default DailyChallengeDialog;
