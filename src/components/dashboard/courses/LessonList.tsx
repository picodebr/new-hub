import { motion } from 'framer-motion';
import { ArrowLeft, Play, CheckCircle2, Clock } from 'lucide-react';
import { Module, Lesson, Course } from './coursesData';
import { Progress } from '@/components/ui/progress';

interface Props {
  course: Course;
  module: Module;
  onBack: () => void;
  onSelectLesson: (lesson: Lesson) => void;
}

const LessonList = ({ course, module, onBack, onSelectLesson }: Props) => {
  const watched = module.lessons.filter((l) => l.watched).length;
  const total = module.lessons.length;
  const percent = total > 0 ? Math.round((watched / total) * 100) : 0;

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
        {module.lessons.map((lesson, i) => (
          <motion.button
            key={lesson.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelectLesson(lesson)}
            className="group relative glass-card rounded-3xl overflow-hidden text-left cursor-pointer border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
          >
            {/* Video "image" header */}
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

                {/* Status pill */}
                {lesson.watched && (
                  <div className="absolute top-3 right-3">
                    <div className="flex items-center gap-1 bg-primary/85 backdrop-blur-md rounded-full px-2.5 py-1 ring-1 ring-white/20">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span className="text-[11px] font-semibold text-white">VISTO</span>
                    </div>
                  </div>
                )}

                {/* Duration pill */}
                <div className="absolute bottom-3 right-3">
                  <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-full px-2.5 py-1 ring-1 ring-white/10">
                    <Clock className="w-3 h-3 text-white/80" />
                    <span className="text-[11px] font-medium text-white/90 tabular-nums">{lesson.duration}</span>
                  </div>
                </div>

                {/* Centered play/check emblem */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-md ring-1 ring-white/20 shadow-lg transition-transform duration-300 group-hover:scale-110 ${
                      lesson.watched ? 'bg-primary/30' : 'bg-white/15 group-hover:bg-white/25'
                    }`}
                  >
                    {lesson.watched ? (
                      <CheckCircle2 className="w-7 h-7 text-primary-foreground" strokeWidth={2} />
                    ) : (
                      <Play className="w-7 h-7 text-white ml-0.5" strokeWidth={2} fill="currentColor" />
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
                  className={`font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors ${
                    lesson.watched ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {lesson.title}
                </h3>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default LessonList;
