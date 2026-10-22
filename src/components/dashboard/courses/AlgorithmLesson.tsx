import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Trophy,
  Sparkles,
  RefreshCw,
  GitMerge,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Play,
} from 'lucide-react';
import { Lesson, Module, Course } from './coursesData';
import { sendModuleLesson } from '@/_base/services/course';
import { toast } from 'sonner';

import { IHubChallenge } from '@/_base/interfaces/challenges';
import { ISendAlgorithmParams } from '@/_base/interfaces/challenges/IAlgorithmChallenge';

interface Props {
  course: Course;
  module: Module;
  lesson: Lesson;
  challenge?: IHubChallenge;
  onBack: () => void;
  onMarkWatched: (lessonId: string) => void;
  onAnswer?: (answer: ISendAlgorithmParams) => void;
}

interface AlgorithmItem {
  id: string;
  text: string;
}

export const AlgorithmLesson = ({ course, module, lesson, challenge, onBack, onMarkWatched, onAnswer }: Props) => {
  const challengeId = challenge?.id || lesson.challenge_data?.id || lesson.id;

  // Default steps if challenge data is empty
  const defaultSteps = [
    'Conectar o sensor ultrassônico aos pinos digitais',
    'Configurar pino Trig como SAÍDA e Echo como ENTRADA',
    'Disparar pulso de 10 microssegundos no pino Trig',
    'Medir o tempo de resposta retornado no pino Echo',
    'Calcular a distância em centímetros: (tempo / 2) / 29.1',
  ];

  const rawSteps: string[] =
    challenge?.data?.algorithm_sequence ||
    (lesson.challenge_data?.data as any)?.algorithm_sequence ||
    defaultSteps;

  // Expected sequence is the original order; we shuffle available blocks initially
  const [available, setAvailable] = useState<AlgorithmItem[]>(() => {
    const items = rawSteps.map((text, i) => ({ id: `step-${i}`, text }));
    // Shuffle available items
    return [...items].sort(() => Math.random() - 0.5);
  });

  const [sequence, setSequence] = useState<AlgorithmItem[]>([]);
  const [verified, setVerified] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const moveToSequence = (item: AlgorithmItem) => {
    if (verified && isCorrect) return;
    setAvailable((prev) => prev.filter((i) => i.id !== item.id));
    setSequence((prev) => [...prev, item]);
    setVerified(false);
  };

  const moveToAvailable = (item: AlgorithmItem) => {
    if (verified && isCorrect) return;
    setSequence((prev) => prev.filter((i) => i.id !== item.id));
    setAvailable((prev) => [...prev, item]);
    setVerified(false);
  };

  const moveUp = (index: number) => {
    if (index === 0 || (verified && isCorrect)) return;
    setSequence((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
    setVerified(false);
  };

  const moveDown = (index: number) => {
    if (index >= sequence.length - 1 || (verified && isCorrect)) return;
    setSequence((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
    setVerified(false);
  };

  const handleReset = () => {
    const items = rawSteps.map((text, i) => ({ id: `step-${i}`, text }));
    setAvailable([...items].sort(() => Math.random() - 0.5));
    setSequence([]);
    setVerified(false);
    setIsCorrect(false);
  };

  const handleVerify = async () => {
    if (sequence.length !== rawSteps.length) {
      toast.error('Adicione todos os blocos na sequência de resposta antes de verificar!');
      return;
    }

    const currentTexts = sequence.map((s) => s.text);
    const correct = currentTexts.every((text, i) => text === rawSteps[i]);

    setVerified(true);
    setIsCorrect(correct);

    const answerPayload: ISendAlgorithmParams = {
      hub_challenge_id: challengeId,
      sequence: currentTexts,
    };

    if (onAnswer) {
      onAnswer(answerPayload);
    }

    if (correct) {
      setSubmitting(true);
      try {
        await sendModuleLesson({
          course_id: course.id,
          module_id: module.id,
          lesson_id: lesson.id,
          answers: [answerPayload],
        });
      } catch (err) {
        console.warn('Erro ao registrar resposta do algoritmo:', err);
      } finally {
        setSubmitting(false);
        onMarkWatched(lesson.id);
        toast.success('Algoritmo correto! Parabéns por ordenar a lógica com precisão.');
      }
    } else {
      setAttempts((a) => a + 1);
      toast.error('A ordem dos passos não está correta. Analise o fluxo e tente novamente!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-accent/80 flex items-center justify-center hover:bg-accent transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-foreground truncate">{lesson.title}</h1>
            <p className="text-xs text-muted-foreground">{module.title} · {course.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-semibold">
            <GitMerge className="w-3.5 h-3.5" />
            Desafio de Algoritmo
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border border-border/50 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Instrução</span>
          <h2 className="mt-1 text-base md:text-lg font-bold text-foreground">
            Ordene os passos abaixo para construir o algoritmo correto em ordem cronológica de execução.
          </h2>
        </div>

        {/* 2-Column Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Available Blocks Column */}
          <div className="flex flex-col rounded-2xl bg-muted/30 border border-border/60 p-4 min-h-[320px]">
            <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-3">
              <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                Blocos Disponíveis ({available.length})
              </span>
            </div>

            <div className="space-y-2 flex-1">
              {available.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic py-8">
                  Todos os blocos foram adicionados à sequência.
                </div>
              ) : (
                available.map((item) => (
                  <motion.div
                    layout
                    key={item.id}
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60 shadow-sm text-xs font-medium text-foreground hover:border-primary/50 transition-all cursor-pointer group"
                    onClick={() => moveToSequence(item)}
                  >
                    <span className="flex-1 pr-2">{item.text}</span>
                    <button
                      type="button"
                      className="p-1 rounded-lg bg-accent text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      title="Adicionar à sequência"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Ordered Sequence Column */}
          <div className="flex flex-col rounded-2xl bg-primary/5 border border-primary/20 p-4 min-h-[320px]">
            <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-3">
              <span className="text-xs font-bold uppercase text-primary flex items-center gap-1.5">
                Sequência de Execução ({sequence.length}/{rawSteps.length})
              </span>
              {sequence.length > 0 && !isCorrect && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reiniciar
                </button>
              )}
            </div>

            <div className="space-y-2 flex-1">
              {sequence.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic py-8 text-center px-4">
                  Clique nos blocos da esquerda para montar a ordem de execução do algoritmo.
                </div>
              ) : (
                sequence.map((item, index) => (
                  <motion.div
                    layout
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${
                      verified
                        ? isCorrect
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/40 text-rose-800 dark:text-rose-300'
                        : 'bg-card border-border/70 text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 pr-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-bold">
                        {index + 1}
                      </span>
                      <span>{item.text}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0 || (verified && isCorrect)}
                        onClick={() => moveUp(index)}
                        className="p-1 rounded hover:bg-accent disabled:opacity-30 transition-opacity"
                        title="Mover para cima"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === sequence.length - 1 || (verified && isCorrect)}
                        onClick={() => moveDown(index)}
                        className="p-1 rounded hover:bg-accent disabled:opacity-30 transition-opacity"
                        title="Mover para baixo"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={verified && isCorrect}
                        onClick={() => moveToAvailable(item)}
                        className="p-1 rounded hover:bg-destructive/10 text-destructive disabled:opacity-30 transition-opacity ml-1"
                        title="Remover da sequência"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Feedback Area */}
        <AnimatePresence>
          {verified && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl border ${
                isCorrect
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {isCorrect ? <Sparkles className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span>
                  {isCorrect
                    ? 'Excelente! Algoritmo executado com sucesso e ordem perfeita.'
                    : 'A ordem dos blocos ainda contém divergências. Experimente inverter os passos com as setas.'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-between">
          {!verified || !isCorrect ? (
            <button
              type="button"
              disabled={sequence.length === 0 || submitting}
              onClick={handleVerify}
              className="apple-btn w-full flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>{submitting ? 'Verificando...' : 'Testar e Validar Algoritmo'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onBack}
              className="apple-btn w-full flex items-center justify-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              <span>Concluir e Voltar às Aulas</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AlgorithmLesson;
