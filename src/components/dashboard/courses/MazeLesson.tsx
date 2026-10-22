import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Compass,
  Play,
  RotateCcw,
  RotateCw,
  ArrowUp,
  Trophy,
  Sparkles,
  AlertTriangle,
  Heart,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Lesson, Module, Course } from './coursesData';
import { sendModuleLesson } from '@/_base/services/course';
import { toast } from 'sonner';

import { IHubChallenge } from '@/_base/interfaces/challenges';
import { ISendMazeParams } from '@/_base/interfaces/challenges/IMazeChallenge';

interface Props {
  course: Course;
  module: Module;
  lesson: Lesson;
  challenge?: IHubChallenge;
  onBack: () => void;
  onMarkWatched: (lessonId: string) => void;
  onAnswer?: (answer: ISendMazeParams & { attempts?: number }) => void;
}

type Direction = 'UP' | 'RIGHT' | 'DOWN' | 'LEFT';
type ActionType = 'FORWARD' | 'TURN_LEFT' | 'TURN_RIGHT';

interface ActionCommand {
  id: string;
  type: ActionType;
  label: string;
}

interface Coordinate {
  x: number;
  y: number;
}

export const MazeLesson = ({ course, module, lesson, challenge, onBack, onMarkWatched, onAnswer }: Props) => {
  const challengeId = challenge?.id || lesson.challenge_data?.id || lesson.id;

  // Extract or fallback maze data
  const mazeConfig =
    challenge?.data?.maze_field ||
    (lesson.challenge_data?.data as any)?.maze_field ||
    (lesson as any).data?.maze_field || {
      size: 6,
      start: { x: 0, y: 0 },
      finish: { x: 4, y: 3 },
      path: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
        { x: 4, y: 3 },
      ],
      player: 'car',
    };

  const playerName = mazeConfig.player || 'car';

  const gridSize = mazeConfig.size || 6;
  const startPos: Coordinate = mazeConfig.start || { x: 0, y: 0 };
  const finishPos: Coordinate = mazeConfig.finish || { x: 4, y: 3 };
  const validPath: Coordinate[] = mazeConfig.path || [];

  const [playerPos, setPlayerPos] = useState<Coordinate>(startPos);
  const [playerAngle, setPlayerAngle] = useState<number>(90); // 0 = UP, 90 = RIGHT, 180 = DOWN, 270 = LEFT
  const [commands, setCommands] = useState<ActionCommand[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [lives, setLives] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  const runningRef = useRef(false);

  const isCellPath = (x: number, y: number) => {
    return validPath.some((p) => p.x === x && p.y === y);
  };

  const isCellFinish = (x: number, y: number) => {
    return finishPos.x === x && finishPos.y === y;
  };

  const isCellStart = (x: number, y: number) => {
    return startPos.x === x && startPos.y === y;
  };

  const addCommand = (type: ActionType) => {
    if (isRunning || isCompleted) return;
    let label = 'Avançar 1 casa';
    if (type === 'TURN_LEFT') label = 'Girar 90° à Esquerda';
    if (type === 'TURN_RIGHT') label = 'Girar 90° à Direita';

    setCommands((prev) => [...prev, { id: `${type}-${Date.now()}-${Math.random()}`, type, label }]);
  };

  const removeCommand = (index: number) => {
    if (isRunning || isCompleted) return;
    setCommands((prev) => prev.filter((_, i) => i !== index));
  };

  const resetSimulation = () => {
    runningRef.current = false;
    setIsRunning(false);
    setActiveStepIndex(null);
    setPlayerPos(startPos);
    setPlayerAngle(90);
    setHasFailed(false);
  };

  const handleRun = async () => {
    if (commands.length === 0 || isRunning) return;
    resetSimulation();
    setIsRunning(true);
    runningRef.current = true;

    let curX = startPos.x;
    let curY = startPos.y;
    let curAngle = 90;

    for (let i = 0; i < commands.length; i++) {
      if (!runningRef.current) break;

      setActiveStepIndex(i);
      const cmd = commands[i];

      if (cmd.type === 'TURN_LEFT') {
        curAngle = (curAngle - 90 + 360) % 360;
        setPlayerAngle(curAngle);
      } else if (cmd.type === 'TURN_RIGHT') {
        curAngle = (curAngle + 90) % 360;
        setPlayerAngle(curAngle);
      } else if (cmd.type === 'FORWARD') {
        let nextX = curX;
        let nextY = curY;

        if (curAngle === 0) nextY -= 1; // UP
        else if (curAngle === 90) nextX += 1; // RIGHT
        else if (curAngle === 180) nextY += 1; // DOWN
        else if (curAngle === 270) nextX -= 1; // LEFT

        // Check boundary & path collision
        const outOfBounds = nextX < 0 || nextX >= gridSize || nextY < 0 || nextY >= gridSize;
        const offPath = validPath.length > 0 && !isCellPath(nextX, nextY);

        if (outOfBounds || offPath) {
          curX = nextX;
          curY = nextY;
          setPlayerPos({ x: curX, y: curY });
          setIsRunning(false);
          setHasFailed(true);
          setLives((l) => Math.max(0, l - 1));
          toast.error('Colisão detectada fora do percurso seguro!');
          runningRef.current = false;
          return;
        }

        curX = nextX;
        curY = nextY;
        setPlayerPos({ x: curX, y: curY });
      }

      // Step delay
      await new Promise((resolve) => setTimeout(resolve, 450));
    }

    setIsRunning(false);
    setActiveStepIndex(null);

    // Check if target was reached
    if (curX === finishPos.x && curY === finishPos.y) {
      setIsCompleted(true);
      toast.success('Parabéns! O robô alcançou o destino com sucesso!');

      const answerPayload: ISendMazeParams & { attempts?: number } = {
        hub_challenge_id: challengeId,
        is_passed: true,
        attempts: Math.max(1, 4 - lives),
      };

      if (onAnswer) {
        onAnswer(answerPayload);
      }

      setSubmitting(true);
      try {
        await sendModuleLesson({
          course_id: course.id,
          module_id: module.id,
          lesson_id: lesson.id,
          answers: [answerPayload],
        });
      } catch (err) {
        console.warn('Erro ao sincronizar envio do labirinto:', err);
      } finally {
        setSubmitting(false);
        onMarkWatched(lesson.id);
      }
    } else {
      setHasFailed(true);
      toast.error('O robô parou antes de atingir o alvo. Ajuste a sequência e tente novamente.');
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

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((heart) => (
              <Heart
                key={heart}
                className={`w-4 h-4 transition-colors ${
                  heart <= lives ? 'text-rose-500 fill-rose-500' : 'text-muted-foreground/30'
                }`}
              />
            ))}
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            Desafio de Labirinto
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border border-border/50 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Missão</span>
          <h2 className="mt-1 text-base md:text-lg font-bold text-foreground">
            Programe as instruções de movimentação e rotação para levar o robô até o ponto de chegada.
          </h2>
        </div>

        {/* Board: Map on Left, Command Builder on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Maze Grid (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/20 border border-border/50">
            <div
              className="grid gap-1.5 p-3 rounded-2xl bg-card/80 border border-border/60 shadow-inner max-w-full overflow-hidden"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                width: '100%',
                maxWidth: '440px',
                aspectRatio: '1 / 1',
              }}
            >
              {Array.from({ length: gridSize }).map((_, y) =>
                Array.from({ length: gridSize }).map((_, x) => {
                  const isPath = isCellPath(x, y);
                  const isStart = isCellStart(x, y);
                  const isFinish = isCellFinish(x, y);
                  const isPlayerHere = playerPos.x === x && playerPos.y === y;

                  return (
                    <div
                      key={`cell-${x}-${y}`}
                      className={`relative rounded-xl flex items-center justify-center border transition-all ${
                        isFinish
                          ? 'bg-amber-500/20 border-amber-500/50 shadow-sm'
                          : isPath
                          ? 'bg-primary/10 border-primary/20'
                          : 'bg-muted/40 border-border/30 opacity-70'
                      }`}
                    >
                      {/* Finish target icon */}
                      {isFinish && !isPlayerHere && (
                        <div className="flex flex-col items-center">
                          <Trophy className="w-5 h-5 text-amber-500 animate-pulse" />
                        </div>
                      )}

                      {/* Start label */}
                      {isStart && !isPlayerHere && (
                        <span className="text-[10px] font-bold text-primary/70 uppercase">Início</span>
                      )}

                      {/* Player element */}
                      {isPlayerHere && (
                        <motion.div
                          animate={{ rotate: playerAngle }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-900 z-10 overflow-hidden"
                        >
                          <img
                            src={`/challenges/icons/${playerName}.svg`}
                            alt={playerName}
                            className="w-5 h-5 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <ArrowUp className="w-4 h-4 stroke-[2.5]" style={{ display: 'none' }} />
                        </motion.div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Status Bar */}
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary/40" /> Caminho Seguro
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Alvo de Chegada
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Robô
              </span>
            </div>
          </div>

          {/* Programming Palette & Sequence (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Action Buttons */}
            <div>
              <span className="text-xs font-bold uppercase text-muted-foreground">Adicionar Comandos</span>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button
                  type="button"
                  disabled={isRunning || isCompleted}
                  onClick={() => addCommand('FORWARD')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-card border border-border/60 hover:border-primary/50 text-xs font-semibold hover:bg-accent transition-all disabled:opacity-40"
                >
                  <ArrowUp className="w-5 h-5 text-primary mb-1" />
                  <span>Avançar</span>
                </button>
                <button
                  type="button"
                  disabled={isRunning || isCompleted}
                  onClick={() => addCommand('TURN_LEFT')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-card border border-border/60 hover:border-primary/50 text-xs font-semibold hover:bg-accent transition-all disabled:opacity-40"
                >
                  <RotateCcw className="w-5 h-5 text-indigo-500 mb-1" />
                  <span>Girar Esq.</span>
                </button>
                <button
                  type="button"
                  disabled={isRunning || isCompleted}
                  onClick={() => addCommand('TURN_RIGHT')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-card border border-border/60 hover:border-primary/50 text-xs font-semibold hover:bg-accent transition-all disabled:opacity-40"
                >
                  <RotateCw className="w-5 h-5 text-indigo-500 mb-1" />
                  <span>Girar Dir.</span>
                </button>
              </div>
            </div>

            {/* Instruction Sequence List */}
            <div className="flex flex-col rounded-2xl bg-card/60 border border-border/60 p-4 min-h-[260px] max-h-[300px] overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-border/40 mb-2">
                <span className="text-xs font-bold uppercase text-foreground">
                  Fila de Comandos ({commands.length})
                </span>
                {commands.length > 0 && !isRunning && !isCompleted && (
                  <button
                    type="button"
                    onClick={() => {
                      setCommands([]);
                      resetSimulation();
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Limpar
                  </button>
                )}
              </div>

              <div className="space-y-1.5 overflow-y-auto pr-1 flex-1">
                {commands.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic py-8 text-center">
                    Adicione comandos acima para construir a trajetória do robô.
                  </div>
                ) : (
                  commands.map((cmd, idx) => {
                    const isActive = activeStepIndex === idx;
                    return (
                      <div
                        key={cmd.id}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium border transition-all ${
                          isActive
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]'
                            : 'bg-muted/40 border-border/50 text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                              isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span>{cmd.label}</span>
                        </div>
                        {!isRunning && !isCompleted && (
                          <button
                            type="button"
                            onClick={() => removeCommand(idx)}
                            className="p-1 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Run / Finish Actions */}
            <div className="space-y-2 pt-2">
              {!isCompleted ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isRunning}
                    onClick={resetSimulation}
                    className="p-3 rounded-2xl border border-border/60 hover:bg-accent text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Resetar</span>
                  </button>
                  <button
                    type="button"
                    disabled={commands.length === 0 || isRunning}
                    onClick={handleRun}
                    className="apple-btn flex items-center justify-center gap-2 text-xs"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isRunning ? 'Executando...' : 'Iniciar Simulação'}</span>
                  </button>
                </div>
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
        </div>

        {/* Result Alerts */}
        <AnimatePresence>
          {isCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex items-center gap-3"
            >
              <Sparkles className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-sm font-bold">Desafio Concluído com Êxito!</p>
                <p className="text-xs opacity-90">
                  O algoritmo de navegação guiou o veículo até o objetivo final sem colisões.
                </p>
              </div>
            </motion.div>
          )}

          {hasFailed && !isCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 flex items-center gap-3"
            >
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-sm font-bold">Atenção ao Trajeto</p>
                <p className="text-xs opacity-90">
                  O robô desviou do trajeto seguro ou não alcançou a coordenada final. Experimente ajustar as ordens de virada.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default MazeLesson;
