import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserX, Coins, ChevronRight } from 'lucide-react';
import { Turma } from './turmasData';

interface Props {
  turma: Turma;
  onSelectionChange?: (selected: boolean) => void;
}

const StudentsTab = ({ turma }: Props) => {
  const navigate = useNavigate();

  if (turma.students.length === 0) {
    return (
      <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
        <UserX className="w-12 h-12 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground font-medium">Nenhum aluno cadastrado</p>
      </div>
    );
  }

  return (
    <motion.div
      data-tour="students-list"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-2.5"
    >
      {(turma?.students || []).map((student, i) => (

        <motion.button
          type="button"
          key={student.id}
          data-tour="student-row"
          onClick={() => navigate(`/students/${student.id}`)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.995 }}
          className="group relative w-full text-left flex items-center gap-4 overflow-hidden rounded-2xl border border-border/40 bg-card/60 px-4 py-3 transition-all duration-300 hover:border-border hover:bg-card hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)]"
        >
          {/* Accent bar */}
          <span
            className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full opacity-60 transition-all duration-300 group-hover:h-12 group-hover:opacity-100"
            style={{ backgroundColor: student.color }}
          />

          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundColor: student.color }}
          >
            {student.initials}
          </div>

          {/* Name + username */}
          <div className="min-w-0 w-48 md:w-56 shrink-0">
            <p className="text-sm font-semibold text-foreground tracking-tight truncate">{student.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{student.username}</p>
          </div>

          {/* Groups */}
          <div className="hidden md:flex flex-1 flex-wrap gap-1.5 min-w-0">
            {student.groups.length === 0 ? (
              <span className="text-xs text-muted-foreground/60">—</span>
            ) : (
              student.groups.map(g => (
                <span
                  key={g}
                  className="px-2 py-0.5 rounded-md bg-accent/60 text-[11px] font-medium text-foreground/80"
                >
                  {g}
                </span>
              ))
            )}
          </div>

          {/* Coins */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-sm font-bold tabular-nums">
              <Coins className="w-3.5 h-3.5" />
              R$ {student.coins.toFixed(2).replace('.', ',')}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-foreground" />
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default StudentsTab;
