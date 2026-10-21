import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, FileCode2, ArrowRight, Loader2 } from 'lucide-react';
import { getCodeProjects } from '@/_base/services/codeProject';
import { ICodeProject } from '@/_base/interfaces/codeProject/IProject';

interface ProjectItem {
  id: string;
  name: string;
  date: string;
  accent: string;
}

const DEFAULT_PROJECTS: ProjectItem[] = [
  { id: '1', name: 'Inteligência Energética', date: '08/04/2026', accent: 'hsl(211 100% 50%)' },
  { id: '2', name: 'Outdoor', date: '08/04/2026', accent: 'hsl(280 80% 60%)' },
  { id: '3', name: 'Pitch Deck', date: '07/04/2026', accent: 'hsl(32 95% 55%)' },
  { id: '4', name: 'MVP', date: '24/03/2026', accent: 'hsl(160 70% 45%)' },
  { id: '5', name: 'Descobrimento do Brasil', date: '06/03/2026', accent: 'hsl(0 80% 60%)' },
  { id: '6', name: '60+', date: '06/03/2026', accent: 'hsl(250 75% 60%)' },
];

const ACCENT_COLORS = [
  'hsl(211 100% 50%)',
  'hsl(280 80% 60%)',
  'hsl(32 95% 55%)',
  'hsl(160 70% 45%)',
  'hsl(0 80% 60%)',
  'hsl(250 75% 60%)',
];

const RecentProjects = () => {
  const [projectList, setProjectList] = useState<ProjectItem[]>(DEFAULT_PROJECTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCodeProjects()
      .then((res) => {
        if (res && Array.isArray(res.results) && res.results.length > 0) {
          setProjectList(
            res.results.slice(0, 6).map((p: ICodeProject, i: number) => ({
              id: p.id,
              name: p.name || (p as any).title || 'Projeto sem nome',
              date: new Date(p.updated_at || p.created_at).toLocaleDateString('pt-BR'),
              accent: ACCENT_COLORS[i % ACCENT_COLORS.length],
            }))
          );
        }
      })
      .catch((err) => {
        console.warn('Usando projetos demonstrativos:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card overflow-hidden p-6"
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <FolderOpen className="text-primary" style={{ width: 18, height: 18 }} />
          </div>
          <h2 className="text-[15px] font-semibold text-foreground tracking-tight">Meus Projetos Recentes</h2>
        </div>
        <button className="group flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80">
          Ver todos
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {projectList.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i + 0.2, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-3 text-left transition-all duration-300 hover:border-border hover:bg-card hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)]"
            >
              {/* Accent bar */}
              <span
                className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full opacity-60 transition-all duration-300 group-hover:h-12 group-hover:opacity-100"
                style={{ backgroundColor: p.accent }}
              />

              {/* Icon */}
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundColor: `${p.accent}15` }}
              >
                <FileCode2 style={{ width: 18, height: 18, color: p.accent }} />
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground tracking-tight">{p.name}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">{p.date}</p>
              </div>

              {/* Arrow */}
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-foreground" />
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default RecentProjects;
