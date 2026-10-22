import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  Clock,
  HelpCircle,
  GitMerge,
  Compass,
  Lock,
} from 'lucide-react';
import { Module, Lesson, Course } from './coursesData';

interface Props {
  course: Course;
  module: Module;
  onBack: () => void;
  onSelectLesson: (lesson: Lesson) => void;
}

const LessonList = ({ course, module, onBack, onSelectLesson }: Props) => {
  const sortedLessons = useMemo(() => {
    return [...module.lessons].sort((a, b) => ((a as any).position || 1) - ((b as any).position || 1));
  }, [module.lessons]);

  const respectHierarchy = !!((module as any).metadata?.respect_hierarchy || (module as any).respect_hierarchy);

  const watched = sortedLessons.filter((l) => l.watched).length;
  const total = sortedLessons.length;
  const percent = total > 0 ? Math.round((watched / total) * 100) : 0;

  const renderTypeIcon = (type?: string, watched?: boolean) => {
    if (watched) {
      return <CheckCircle2 className="w-7 h-7 text-primary-foreground" strokeWidth={2} />;
    }
    switch (type) {
      case 'quiz':
        return <HelpCircle className="w-7 h-7 text-amber-300" strokeWidth={2} />;
      case 'algorithm':
        return <GitMerge className="w-7 h-7 text-indigo-300" strokeWidth={2} />;
      case 'map':
        return <Compass className="w-7 h-7 text-emerald-300" strokeWidth={2} />;
      default:
        return <Play className="w-7 h-7 text-white ml-0.5" strokeWidth={2} fill="currentColor" />;
    }
  };

  const renderTypeBadge = (type?: string) => {
    switch (type) {
      case 'quiz':
        return (
          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full ring-1 ring-amber-500/30">
            Quiz
          </span>
        );
      case 'algorithm':
        return (
          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full ring-1 ring-indigo-500/30">
            Algoritmo
          </span>
        );
      case 'map':
        return (
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full ring-1 ring-emerald-500/30">
            Labirinto
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold text-sky-400 bg-sky-500/20 px-2 py-0.5 rounded-full ring-1 ring-sky-500/30">
            Vídeo
          </span>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-accent/80 flex items-center justify-center hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">{module.title}</h1>
          <p className="text-sm text-muted-foreground">{course.title} · {watched}/{total} aulas · {percent}%</p>
        </div>
      </div>

      {/* Lesson cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedLessons.map((lesson, i, arr) => {
          const isLocked = respectHierarchy && i > 0 && !arr[i - 1].watched;

          return (
            <motion.button
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              whileHover={isLocked ? {} : { y: -4 }}
              whileTap={isLocked ? {} : { scale: 0.99 }}
              disabled={isLocked}
              onClick={() => !isLocked && onSelectLesson(lesson)}
              className={`group relative glass-card rounded-3xl overflow-hidden text-left border transition-all duration-300 ${
                isLocked
                  ? 'opacity-60 cursor-not-allowed border-border/30 bg-card/40'
                  : 'cursor-pointer border-border/50 hover:border-primary/30 hover:shadow-xl'
              }`}
            >
              {/* Header Area */}
              <div className="p-3 pb-2 h-36">
                <div className="relative w-full h-full overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
                  {/* Subtle grid pattern */}
                  <div
                    className="absolute inset-0 opacity-[0.18]"
                    style={{
                      backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                      backgroundSize: '14px 14px',
                    }}
                  />
                  {/* Soft top-right glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.18),transparent_60%)]" />

                  {/* Status pill & Type badge */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    {renderTypeBadge(lesson.type)}

                    {isLocked ? (
                      <div className="flex items-center gap-1 bg-amber-500/80 backdrop-blur-md rounded-full px-2.5 py-0.5 ring-1 ring-white/20">
                        <Lock className="w-3.5 h-3.5 text-white" />
                        <span className="text-[10px] font-bold text-white">BLOQUEADA</span>
                      </div>
                    ) : lesson.watched ? (
                      <div className="flex items-center gap-1 bg-primary/85 backdrop-blur-md rounded-full px-2.5 py-0.5 ring-1 ring-white/20">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span className="text-[10px] font-bold text-white">VISTO</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Duration pill */}
                  <div className="absolute bottom-3 right-3">
                    <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-full px-2.5 py-1 ring-1 ring-white/10">
                      <Clock className="w-3 h-3 text-white/80" />
                      <span className="text-[11px] font-medium text-white/90 tabular-nums">{lesson.duration}</span>
                    </div>
                  </div>

                  {/* Centered play/icon emblem */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-md ring-1 ring-white/20 shadow-lg transition-transform duration-300 ${
                        isLocked
                          ? 'bg-black/50 text-muted-foreground'
                          : lesson.watched
                          ? 'bg-primary/30 group-hover:scale-110'
                          : 'bg-white/15 group-hover:bg-white/25 group-hover:scale-110'
                      }`}
                    >
                      {isLocked ? (
                        <Lock className="w-6 h-6 text-white/70" />
                      ) : (
                        renderTypeIcon(lesson.type, lesson.watched)
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className="px-4 pb-4 pt-1">
                <div className="flex items-start gap-2">
                  <span className="text-[11px] font-bold text-muted-foreground bg-accent rounded-md px-1.5 py-0.5 flex-shrink-0 tabular-nums">
                    {i + 1}
                  </span>
                  <h3
                    className={`font-semibold text-sm leading-tight line-clamp-2 transition-colors ${
                      isLocked
                        ? 'text-muted-foreground'
                        : lesson.watched
                        ? 'text-primary'
                        : 'text-foreground group-hover:text-primary'
                    }`}
                  >
                    {lesson.title}
                  </h3>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default LessonList;
