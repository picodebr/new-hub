import { motion } from 'framer-motion';
import { Play, CheckCircle2, Clock, BookOpen } from 'lucide-react';
import { Course } from './coursesData';
import { Progress } from '@/components/ui/progress';

interface Props {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
}

const CourseList = ({ courses, onSelectCourse }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Play className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Meus Cursos e Trilhas</h1>
          <p className="text-sm text-muted-foreground">{courses.length} cursos disponíveis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {courses.map((course, i) => {
          const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
          const watchedLessons = course.modules.reduce(
            (acc, m) => acc + m.lessons.filter((l) => l.watched).length,
            0
          );

          return (
            <motion.button
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelectCourse(course)}
              className="group relative glass-card rounded-3xl overflow-hidden text-left cursor-pointer border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
            >
              {/* "Image" header with gradient + emblem */}
              <div className="p-3 pb-2 h-36">
                <div className={`relative w-full h-full overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br ${course.color}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.35),transparent_60%)]" />
                  <div
                    className="absolute inset-0 opacity-[0.12]"
                    style={{
                      backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
                      backgroundSize: '14px 14px',
                    }}
                  />
                  <BookOpen
                    className="absolute -bottom-3 -right-3 w-24 h-24 text-white/20"
                    strokeWidth={1.5}
                  />

                  {/* Status pill */}
                  <div className="absolute top-3 right-3">
                    {course.status === 'completed' && (
                      <div className="flex items-center gap-1 bg-white/25 backdrop-blur-md rounded-full px-2.5 py-1 ring-1 ring-white/30">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span className="text-[11px] font-semibold text-white">CONCLUÍDO</span>
                      </div>
                    )}
                    {course.status === 'not_started' && (
                      <div className="flex items-center gap-1 bg-white/25 backdrop-blur-md rounded-full px-2.5 py-1 ring-1 ring-white/30">
                        <Clock className="w-3.5 h-3.5 text-white" />
                        <span className="text-[11px] font-semibold text-white">NÃO INICIADO</span>
                      </div>
                    )}
                    {course.status === 'in_progress' && (
                      <div className="flex items-center gap-1 bg-white/25 backdrop-blur-md rounded-full px-2.5 py-1 ring-1 ring-white/30">
                        <Play className="w-3.5 h-3.5 text-white" />
                        <span className="text-[11px] font-semibold text-white">{course.progress}%</span>
                      </div>
                    )}
                  </div>

                  {/* Centered emblem */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/25 backdrop-blur-md flex items-center justify-center ring-1 ring-white/30 shadow-lg transition-transform duration-300 group-hover:scale-110">
                      <BookOpen className="w-7 h-7 text-white" strokeWidth={2} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className="px-4 pb-4 pt-1">
                <h3 className="font-semibold text-foreground text-sm mb-2 truncate group-hover:text-primary transition-colors">
                  {course.title}
                </h3>
                <p className="text-[11px] text-muted-foreground mb-2">
                  {course.modules.length} módulo{course.modules.length !== 1 ? 's' : ''} · {totalLessons} aula{totalLessons !== 1 ? 's' : ''}
                </p>
                <Progress value={(watchedLessons / totalLessons) * 100} className="h-1.5" />
                <p className="text-[10px] text-muted-foreground/80 mt-1.5 tabular-nums">{watchedLessons}/{totalLessons} aulas concluídas</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default CourseList;
