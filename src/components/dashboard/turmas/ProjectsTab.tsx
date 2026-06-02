import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, FolderOpen, Play, Pause, CheckCircle2, Lock, Hand,
  Calendar, ArrowUpRight,
} from 'lucide-react';
import { Turma, Project } from './turmasData';
import NewProjectDialog from './NewProjectDialog';
import ProjectDetailView from './ProjectDetailView';

interface Props {
  turma: Turma;
  selectedProject: Project | null;
  onSelectProject: (project: Project | null) => void;
}

type StatusKey = 'Em Execução' | 'Pausado' | 'Finalizado' | 'Não Iniciado';

const statusConfig: Record<StatusKey, { accent: string; icon: typeof Play; label: string }> = {
  'Em Execução': { accent: 'hsl(211 100% 50%)', icon: Play,         label: 'Em execução'  },
  'Pausado':     { accent: 'hsl(0 80% 60%)',    icon: Pause,        label: 'Pausado'      },
  'Finalizado':  { accent: 'hsl(142 71% 45%)',  icon: CheckCircle2, label: 'Finalizado'   },
  'Não Iniciado':{ accent: 'hsl(220 9% 55%)',   icon: Lock,         label: 'Não iniciado' },
};

const ProjectsTab = ({ turma, selectedProject, onSelectProject }: Props) => {
  const [showNewProject, setShowNewProject] = useState(false);
  const [localProjects, setLocalProjects] = useState<Project[]>(turma.projects);

  const handleCreateProject = (projectData: Omit<Project, 'id'>) => {
    const newProject: Project = {
      ...projectData,
      id: `p-${Date.now()}`,
    };
    setLocalProjects(prev => [newProject, ...prev]);
  };

  if (selectedProject) {
    return (
      <ProjectDetailView
        project={selectedProject}
        students={turma.students}
        onBack={() => onSelectProject(null)}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowNewProject(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors shadow-md"
        >
          <Plus className="w-4 h-4" />
          Novo Projeto
        </button>
      </div>

      {localProjects.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
          <FolderOpen className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">Nenhum projeto nesta turma</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Crie um novo projeto para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {localProjects.map((project, i) => {
            const status = statusConfig[project.status as StatusKey];
            const StatusIcon = status.icon;
            const accent = status.accent;
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4 }}
                onClick={() => onSelectProject(project)}
                className="group glass-card rounded-3xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer border border-border/50"
              >
                {/* Themed header with centered emblem */}
                <div className="p-3 pb-2 h-40">
                  <div
                    className="relative w-full h-full overflow-hidden rounded-2xl border border-border/40"
                    style={{
                      background: `linear-gradient(135deg, ${accent}26 0%, ${accent}0d 60%, transparent 100%)`,
                    }}
                  >
                    {/* Decorative blob */}
                    <div
                      className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-30 blur-2xl"
                      style={{ backgroundColor: accent }}
                    />

                    {/* Centered emblem */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-md ring-1 transition-transform duration-500 group-hover:scale-110"
                        style={{ backgroundColor: `${accent}26`, boxShadow: `inset 0 0 0 1px ${accent}40` }}
                      >
                        <FolderOpen style={{ width: 26, height: 26, color: accent }} />
                      </div>
                    </div>

                    {/* Status pill */}
                    <div
                      className="absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold tracking-tight backdrop-blur-md"
                      style={{
                        backgroundColor: `${accent}1f`,
                        color: accent,
                        border: `1px solid ${accent}40`,
                      }}
                    >
                      <StatusIcon className="w-2.5 h-2.5" />
                      {status.label}
                    </div>

                    {/* Hover arrow */}
                    <div className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-background/70 backdrop-blur-md border border-border/40 flex items-center justify-center opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                      <ArrowUpRight className="w-3.5 h-3.5 text-foreground" />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="px-4 pb-4 pt-1">
                  <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors mb-2">
                    {project.name}
                  </h3>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/70 tabular-nums truncate">
                      <Calendar className="w-3 h-3" />
                      {project.date}
                    </span>

                    {project.teacherInitials ? (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-background shrink-0"
                        style={{ backgroundColor: accent }}
                        title="Professor responsável"
                      >
                        {project.teacherInitials}
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/60 text-[10px] font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors shrink-0"
                      >
                        <Hand className="w-3 h-3" />
                        Reivindicar
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <NewProjectDialog
        open={showNewProject}
        onOpenChange={setShowNewProject}
        onCreateProject={handleCreateProject}
      />
    </motion.div>
  );
};

export default ProjectsTab;
