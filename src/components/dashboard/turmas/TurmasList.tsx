import { motion } from 'framer-motion';
import { Plus, Users, ArrowUpRight } from 'lucide-react';

import { Turma } from './turmasData';

interface Props {
  turmas: Turma[];
  onSelectTurma: (turma: Turma) => void;
  onAddTurma: () => void;
}

const ACCENTS = [
  'hsl(211 100% 50%)',
  'hsl(280 70% 55%)',
  'hsl(160 70% 42%)',
  'hsl(25 90% 55%)',
  'hsl(340 75% 55%)',
  'hsl(200 85% 48%)',
];
const accentFor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
};

const TurmasList = ({ turmas, onSelectTurma, onAddTurma }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Turmas</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie suas turmas e alunos</p>
          </div>
        </div>
        <button
          onClick={onAddTurma}
          data-tour="add-turma-btn"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:brightness-110 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Adicionar Turma
        </button>
      </div>

      <div data-tour="turmas-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {turmas.map((turma, i) => {
          const accent = accentFor(turma.id);
          return (
            <motion.button
              type="button"
              key={turma.id}
              data-tour="turma-card"
              onClick={() => onSelectTurma(turma)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.99 }}
              className="group relative w-full overflow-hidden rounded-2xl border border-border/50 bg-card text-left transition-all duration-300 hover:border-border hover:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.18)]"
            >
              {/* Soft accent gradient background */}
              <div
                className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background: `radial-gradient(120% 80% at 100% 0%, ${accent}26 0%, ${accent}0d 35%, transparent 65%)`,
                }}
              />

              {/* Left accent bar */}
              <span
                className="absolute left-0 bottom-5 h-12 w-[3px] rounded-r-full opacity-80 transition-all duration-300 group-hover:h-16 group-hover:opacity-100"
                style={{ backgroundColor: accent }}
              />

              <div className="relative p-5">
                {/* Top: icon + code */}
                <div className="flex items-start justify-between mb-8">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                    style={{
                      backgroundColor: `${accent}1a`,
                      boxShadow: `inset 0 0 0 1px ${accent}33`,
                    }}
                  >
                    <Users className="h-[18px] w-[18px]" style={{ color: accent }} strokeWidth={2.2} />
                  </div>
                  {turma.code && (
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums backdrop-blur-md"
                      style={{
                        backgroundColor: `${accent}1f`,
                        color: accent,
                        border: `1px solid ${accent}33`,
                      }}
                    >
                      #{turma.code}
                    </span>
                  )}
                </div>

                {/* Name */}
                <h3 className="text-base font-semibold text-foreground tracking-tight truncate mb-1">
                  {turma.name}
                </h3>

                {/* Footer */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {turma.studentCount} {turma.studentCount === 1 ? 'Aluno' : 'Alunos'}
                    </span>
                    {turma.studentCount > 0 && (
                      <div className="flex -space-x-1.5">
                        {turma.students.slice(0, 3).map(s => (
                          <div
                            key={s.id}
                            className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white ring-2 ring-card"
                            style={{ backgroundColor: s.color }}
                          >
                            {s.initials}
                          </div>
                        ))}
                        {turma.studentCount > 3 && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[8px] font-bold text-muted-foreground ring-2 ring-card">
                            +{turma.studentCount - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default TurmasList;
