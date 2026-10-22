import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  FolderOpen,
  Calendar,
  ArrowUpRight,
  Loader2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Turma } from './turmasData';
import NewProjectDialog from './NewProjectDialog';
import { IProject } from '@/_base/interfaces/project';
import { HubStatus, hubStatuses } from '@/_base/interfaces/shared';
import { statusLabelMapper } from '@/_base/utils';
import { updateProject } from '@/_base/services/project';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface Props {
  turma: Turma;
  selectedProject?: any;
  onSelectProject?: (project: any) => void;
  onReloadClass?: () => void;
}

const statusColorStyles: Record<string, { bg: string; text: string; border: string }> = {
  stopped: { bg: 'bg-rose-500/10', text: 'text-rose-600', border: 'border-rose-500/30' },
  running: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/30' },
  finished: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/30' },
};

const ProjectsTab = ({ turma, onReloadClass }: Props) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [showNewProject, setShowNewProject] = useState(false);
  const [factoryProjectToStart, setFactoryProjectToStart] = useState<IProject | null>(null);
  const [updatingProjectId, setUpdatingProjectId] = useState<string | null>(null);
  const [localProjects, setLocalProjects] = useState<IProject[]>(() => {
    return turma?.raw?.projects || [];
  });

  // Keep localProjects synced when turma changes
  useMemo(() => {
    if (turma?.raw?.projects) {
      setLocalProjects(turma.raw.projects);
    }
  }, [turma?.raw?.projects]);

  const sortedProjects = useMemo(() => {
    return [...localProjects].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [localProjects]);

  const handleUpdateProjectStatus = async (id: string, status: HubStatus) => {
    setUpdatingProjectId(id);
    try {
      const updated = await updateProject({ id, status });
      setLocalProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
      );
      toast.success(`Status atualizado para: ${statusLabelMapper[status]}`);
      setFactoryProjectToStart(null);
      if (onReloadClass) onReloadClass();
    } catch (err) {
      console.error('Erro ao atualizar status do projeto:', err);
      toast.error('Erro ao atualizar status do projeto');
    } finally {
      setUpdatingProjectId(null);
    }
  };

  const handleProjectCreated = (newProject: IProject) => {
    setLocalProjects((prev) => [newProject, ...prev]);
    if (onReloadClass) onReloadClass();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Action Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Projetos da Turma</h2>
          <p className="text-xs text-muted-foreground">
            Acompanhe o andamento das atividades e protótipos
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewProject(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-105 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Projeto</span>
        </button>
      </div>

      {sortedProjects.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center rounded-2xl border border-border/60 bg-card/60">
          <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
            <FolderOpen className="w-6 h-6" />
          </div>
          <p className="text-base font-semibold text-foreground">Nenhum projeto nesta turma</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Crie um novo projeto manualmente ou use a Inteligência Artificial para gerar um plano maker completo alinhado à BNCC.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {sortedProjects.map((project, i) => {
            const rawStatus = (project.status || 'stopped') as HubStatus;
            const statusInfo = statusColorStyles[rawStatus] || statusColorStyles.stopped;
            const canEditStatus = project.user_id === user?.id || user?.role === 'master';
            const isFactoryProject = !project.educator?.id && !!project.project_id;
            const thumbnail = project.project?.metadata?.thumbnail || '/images/book.svg';

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -4 }}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 cursor-pointer"
              >
                {/* Thumbnail Area */}
                <div
                  className="h-40 w-full relative bg-cover bg-center border-b border-border/60 bg-muted/30"
                  style={{
                    backgroundImage: `url(${thumbnail})`,
                    backgroundPosition: project.project?.metadata?.thumbnail ? 'bottom' : 'center',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                  {/* Status Dropdown / Badge */}
                  <div
                    className="absolute top-2.5 right-2.5 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {canEditStatus ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md shadow-sm transition-transform active:scale-95 ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                          >
                            {updatingProjectId === project.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : null}
                            <span>{statusLabelMapper[rawStatus]}</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36 rounded-xl">
                          {hubStatuses.map((st) => (
                            <DropdownMenuItem
                              key={st}
                              onClick={() => handleUpdateProjectStatus(project.id, st as HubStatus)}
                              className="font-medium text-xs cursor-pointer"
                            >
                              <span
                                className={`w-2 h-2 rounded-full mr-2 ${
                                  st === 'running'
                                    ? 'bg-emerald-500'
                                    : st === 'finished'
                                    ? 'bg-blue-500'
                                    : 'bg-rose-500'
                                }`}
                              />
                              {statusLabelMapper[st]}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md shadow-sm ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                      >
                        {statusLabelMapper[rawStatus]}
                      </span>
                    )}
                  </div>

                  {/* Arrow Indicator on Hover */}
                  <div className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-background/80 backdrop-blur-md border border-border/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="w-4 h-4 text-foreground" />
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                    {project.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {project.description}
                      </p>
                    )}
                  </div>

                  {/* Footer: Date + Educator/PiCode Icon */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {project.created_at
                          ? new Date(project.created_at).toLocaleDateString('pt-BR')
                          : '—'}
                      </span>
                    </div>

                    {/* PiCode Project Icon or Educator Avatar */}
                    {isFactoryProject ? (
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <div
                          className="w-9 h-9 rounded-full bg-card border-2 border-border flex items-center justify-center shadow-sm"
                          title="Projeto da PiCode"
                        >
                          <img
                            src="/logo/pi-logo-dark.svg"
                            alt="PiCode"
                            className="w-5 h-5 object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          title="Iniciar projeto PiCode"
                          onClick={() => setFactoryProjectToStart(project)}
                          className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-card shadow-sm hover:scale-110 transition-transform"
                        >
                          <Plus className="w-3 h-3 stroke-[3]" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shadow-sm"
                        title={project.educator?.name || 'Educador'}
                      >
                        {project.educator?.avatar ? (
                          <img
                            src={project.educator.avatar}
                            alt={project.educator.name || 'Educador'}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          (project.educator?.name || 'PR').slice(0, 2).toUpperCase()
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Start PiCode Factory Project Confirmation Modal */}
      <Dialog
        open={!!factoryProjectToStart}
        onOpenChange={(open) => !open && setFactoryProjectToStart(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <DialogTitle>Iniciar projeto PiCode</DialogTitle>
            </div>
          </DialogHeader>
          <div className="py-2 text-sm text-foreground/80 leading-relaxed">
            Você está prestes a iniciar o projeto{' '}
            <strong className="text-foreground">{factoryProjectToStart?.title}</strong>. Mantenha a
            consistência com sua turma.
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              disabled={!!updatingProjectId}
              onClick={() => setFactoryProjectToStart(null)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!!updatingProjectId}
              onClick={() =>
                factoryProjectToStart &&
                handleUpdateProjectStatus(factoryProjectToStart.id, 'running')
              }
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md hover:brightness-105 transition-all"
            >
              {updatingProjectId ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Iniciando...
                </>
              ) : (
                'Iniciar o projeto'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Project Dialog */}
      <NewProjectDialog
        open={showNewProject}
        onOpenChange={setShowNewProject}
        turmaId={turma.id}
        onProjectCreated={handleProjectCreated}
      />
    </motion.div>
  );
};

export default ProjectsTab;
