import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, XCircle, HelpCircle, Trophy, Sparkles, RefreshCw } from 'lucide-react';
import { Lesson, Module, Course } from './coursesData';
import { sendModuleLesson } from '@/_base/services/course';
import { toast } from 'sonner';

import { IHubChallenge } from '@/_base/interfaces/challenges';
import { ISendQuizParams } from '@/_base/interfaces/challenges/IQuizChallenge';

interface Props {
  course: Course;
  module: Module;
  lesson: Lesson;
  challenge?: IHubChallenge;
  onBack: () => void;
  onMarkWatched: (lessonId: string) => void;
  onAnswer?: (answer: ISendQuizParams) => void;
}

const QuizLesson = ({ course, module, lesson, challenge, onBack, onMarkWatched, onAnswer }: Props) => {
  const challengeAnswers = challenge?.data?.quiz_answers;
  const quiz = challengeAnswers && challengeAnswers.length > 0 ? {
    question: challenge.title || challenge.description || 'Pergunta',
    options: challengeAnswers.map((a) => a.text),
    correctIndex: challengeAnswers.findIndex((a) => a.is_correct) >= 0 ? challengeAnswers.findIndex((a) => a.is_correct) : 0,
    explanation: challenge.description || '',
  } : lesson.quiz_data || {
    question: 'Qual é o componente responsável pelo processamento principal no microcontrolador?',
    options: ['Processador / CPU', 'Resistor', 'Capacitor', 'Diodo'],
    correctIndex: 0,
    explanation: 'A CPU executa as instruções do programa compilado.',
  };

  const challengeId = challenge?.id || lesson.challenge_data?.id || lesson.id;

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelectedOption(idx);
  };

  const handleCheck = async () => {
    if (selectedOption === null) return;
    const correct = selectedOption === quiz.correctIndex;
    setAnswered(true);
    setIsCorrect(correct);

    const answerPayload: ISendQuizParams = {
      hub_challenge_id: challengeId,
      option: quiz.options[selectedOption],
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
        console.warn('Erro ao enviar progresso remoto:', err);
      } finally {
        setSubmitting(false);
        onMarkWatched(lesson.id);
        toast.success('Resposta correta! Aula marcada como concluída.');
      }
    } else {
      setAttempts((a) => a + 1);
      toast.error('Resposta incorreta. Tente novamente!');
    }
  };

  const handleRetry = () => {
    setSelectedOption(null);
    setAnswered(false);
    setIsCorrect(false);
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            Desafio Quiz
          </span>
        </div>
      </div>

      {/* Quiz Card */}
      <div className="glass-card max-w-2xl mx-auto p-6 md:p-8 rounded-3xl border border-border/50 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Pergunta</span>
          <h2 className="mt-2 text-lg md:text-xl font-bold text-foreground leading-snug">
            {quiz.question}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {quiz.options.map((opt, i) => {
            const isSel = selectedOption === i;
            let style = 'border-border/60 bg-card/50 hover:bg-accent/60';

            if (answered) {
              if (i === quiz.correctIndex) {
                style = 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold ring-1 ring-emerald-500/30';
              } else if (isSel) {
                style = 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold ring-1 ring-rose-500/30';
              }
            } else if (isSel) {
              style = 'border-primary bg-primary/10 text-primary font-semibold ring-2 ring-primary/20';
            }

            return (
              <motion.button
                key={i}
                type="button"
                whileHover={!answered ? { scale: 1.01 } : {}}
                whileTap={!answered ? { scale: 0.99 } : {}}
                onClick={() => handleSelect(i)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border text-sm text-left transition-all ${style}`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-muted/60 text-xs font-bold uppercase">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt}</span>
                </div>
                {answered && i === quiz.correctIndex && (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                )}
                {answered && isSel && i !== quiz.correctIndex && (
                  <XCircle className="h-5 w-5 shrink-0 text-rose-500" />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Feedback / Explanation */}
        <AnimatePresence>
          {answered && (
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
                <span>{isCorrect ? 'Excelente! Você acertou!' : 'Quase lá! Tente novamente.'}</span>
              </div>
              {quiz.explanation && isCorrect && (
                <p className="mt-1 text-xs opacity-90">{quiz.explanation}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-between">
          {!answered ? (
            <button
              type="button"
              disabled={selectedOption === null}
              onClick={handleCheck}
              className="apple-btn w-full"
            >
              Verificar Resposta
            </button>
          ) : isCorrect ? (
            <button
              type="button"
              onClick={onBack}
              className="apple-btn w-full flex items-center justify-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              <span>Concluir e Voltar às Aulas</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRetry}
              className="apple-btn w-full flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tentar Novamente</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default QuizLesson;
