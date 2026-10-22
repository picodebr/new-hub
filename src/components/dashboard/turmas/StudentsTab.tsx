import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserX, Coins, ChevronRight } from 'lucide-react';
import { Turma } from './turmasData';
import { formatCoin } from '@/_base/utils';

interface Props {
  turma: Turma;
  onSelectionChange?: (selected: boolean) => void;
}

const StudentsTab = ({ turma }: Props) => {
  const navigate = useNavigate();

  const students = turma.students || [];

  if (students.length === 0) {
    return (
      <div className="glass-card p-12 flex flex-col items-center justify-center text-center rounded-2xl border border-border/70 bg-card">
        <UserX className="w-12 h-12 text-muted-foreground/40 mb-3" />
        <p className="text-base font-semibold text-foreground">Nenhum aluno cadastrado nesta turma</p>
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
      {students.map((student, i) => {
        const groupsList: string[] = (student.groups || []).map((g: any) =>
          typeof g === 'string' ? g : g.display_name || g.name || 'Grupo'
        );

        return (
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
            className="group relative w-full text-left flex items-center gap-4 overflow-hidden rounded-2xl border border-border/60 bg-card px-4 py-3.5 transition-all duration-300 hover:border-border hover:shadow-md"
          >
            {/* Accent bar */}
            <span
              className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full opacity-60 transition-all duration-300 group-hover:h-12 group-hover:opacity-100"
              style={{ backgroundColor: student.color || 'hsl(var(--primary))' }}
            />

            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105"
              style={{ backgroundColor: student.color || 'hsl(var(--primary))' }}
            >
              {student.initials}
            </div>

            {/* Name + username */}
            <div className="min-w-0 w-48 md:w-56 shrink-0">
              <p className="text-sm font-bold text-foreground tracking-tight truncate">{student.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{student.username}</p>
            </div>

            {/* Groups badges */}
            <div className="hidden md:flex flex-1 flex-wrap gap-1.5 min-w-0">
              {groupsList.length === 0 ? (
                <span className="text-xs text-muted-foreground/60 italic">—</span>
              ) : (
                groupsList.map((g) => (
                  <span
                    key={g}
                    className="px-2.5 py-0.5 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-[11px] font-bold"
                  >
                    {g}
                  </span>
                ))
              )}
            </div>

            {/* Coins */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm font-bold tabular-nums">
                <Coins className="w-3.5 h-3.5" />
                {formatCoin(student.coins || 0)}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-foreground" />
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
};

export default StudentsTab;
