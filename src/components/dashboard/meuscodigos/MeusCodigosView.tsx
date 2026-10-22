import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, Plus, Share2, MoreVertical, ArrowLeft, Calendar, Layers,
  Pencil, Trash2, Sparkles, Code2, BrainCircuit, Loader2,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CodeThumbnail from './CodeThumbnail';
import {
  listCodeProjectFolders,
  createCodeProjectFolder,
  updateCodeProjectFolder,
  removeCodeProjectFolder,
} from '@/_base/services/codeProjectFolder';
import { getCodeProjectsSharedWithMe } from '@/_base/services/codeProject';
import {
  getVisionLabFolders,
  createVisionLabFolder,
  updateVisionLabFolder,
  removeVisionLabFolder,
} from '@/_base/services/visionLab';
import { toast } from 'sonner';

interface Folder {
  id: string;
  name: string;
  projectCount: number;
  createdAt: string;
  gradient: string;
  codePreview: string[];
}

interface SharedProject {
  id: string;
  folder_id: string;
  name: string;
  sharedBy: string;
  sharedByAvatar?: string;
  sharedAt: string;
  mode?: string;
  snapshot?: string;
  codePreview: string[];
}

const FOLDER_GRADIENTS = [
  'from-sky-400 to-blue-600',
  'from-violet-400 to-purple-600',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-600',
  'from-pink-400 to-rose-600',
  'from-cyan-400 to-sky-600',
];

const PLACEHOLDER_CODE = [
  '#include <Arduino.h>',
  'int LED = 13;',
  'void setup() {',
  '  pinMode(LED, OUTPUT);',
  '  Serial.begin(9600);',
  '}',
  'void loop() {',
  '}',
];

interface MeusCodigosViewProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  showSharedInitially?: boolean;
}

const MeusCodigosView = ({
  title = 'Code Lab',
  subtitle = 'Organize seus projetos em pastas',
  icon: HeaderIcon = Code2,
  showSharedInitially = false,
}: MeusCodigosViewProps = {}) => {
  const navigate = useNavigate();
  const isVisionLab = title.toLowerCase().includes('vision');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [sharedProjects, setSharedProjects] = useState<SharedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showShared, setShowShared] = useState(showSharedInitially);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');

  // Load real folders from API
  useEffect(() => {
    let mounted = true;
    const fetchFolders = async () => {
      try {
        setIsLoading(true);
        if (isVisionLab) {
          const res = await getVisionLabFolders();
          const list = (res as any)?.results || (Array.isArray(res) ? res : []);
          if (mounted && list && list.length > 0) {
            setFolders(
              list.map((f: any, idx: number) => ({
                id: f.id,
                name: f.name,
                projectCount: f.projects_count || f.projects?.length || 0,
                createdAt: f.created_at ? new Date(f.created_at).toLocaleDateString('pt-BR') : 'Recente',
                gradient: FOLDER_GRADIENTS[idx % FOLDER_GRADIENTS.length],
                codePreview: ['// Vision Lab', `// ${f.name}`, 'void setup() {}'],
              }))
            );
          } else if (mounted) {
            setFolders([]);
          }
        } else {
          const res = await listCodeProjectFolders();
          const list = (res as any)?.results || (Array.isArray(res) ? res : []);
          if (mounted && list && list.length > 0) {
            setFolders(
              list.map((f: any, idx: number) => ({
                id: f.id,
                name: f.name,
                projectCount: f.projects_count || f.projects?.length || 0,
                createdAt: f.created_at ? new Date(f.created_at).toLocaleDateString('pt-BR') : 'Recente',
                gradient: FOLDER_GRADIENTS[idx % FOLDER_GRADIENTS.length],
                codePreview: PLACEHOLDER_CODE,
              }))
            );
          } else if (mounted) {
            setFolders([]);
          }

          // Also load shared projects
          getCodeProjectsSharedWithMe()
            .then((shared) => {
              if (mounted && shared && shared.length > 0) {
                setSharedProjects(
                  shared.map((p: any) => ({
                    id: p.id,
                    folder_id: p.folder_id,
                    name: p.name,
                    sharedBy: p.folder?.user?.name || p.user?.display_name || 'Usuário',
                    sharedByAvatar: p.folder?.user?.avatar,
                    sharedAt: p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : 'Recente',
                    mode: p.source_code?.mode,
                    snapshot: p.snapshot,
                    codePreview: PLACEHOLDER_CODE,
                  }))
                );
              }
            })
            .catch(() => {});
        }
      } catch (err) {
        console.error('Erro ao listar pastas:', err);
        if (mounted) setFolders([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchFolders();
    return () => {
      mounted = false;
    };
  }, [isVisionLab]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const name = newFolderName.trim();
    setNewFolderName('');
    setShowNewFolder(false);

    try {
      if (isVisionLab) {
        const created = await createVisionLabFolder(name);
        toast.success('Pasta criada com sucesso!');
        setFolders(prev => [
          ...prev,
          {
            id: created?.id || Date.now().toString(),
            name,
            projectCount: 0,
            createdAt: 'agora',
            gradient: FOLDER_GRADIENTS[prev.length % FOLDER_GRADIENTS.length],
            codePreview: PLACEHOLDER_CODE,
          },
        ]);
      } else {
        const created = await createCodeProjectFolder({ name } as any);
        toast.success('Pasta criada com sucesso!');
        setFolders(prev => [
          ...prev,
          {
            id: created?.id || Date.now().toString(),
            name,
            projectCount: 0,
            createdAt: 'agora',
            gradient: FOLDER_GRADIENTS[prev.length % FOLDER_GRADIENTS.length],
            codePreview: PLACEHOLDER_CODE,
          },
        ]);
      }
    } catch (err) {
      console.error('Erro ao sincronizar pasta remota:', err);
      toast.error('Erro ao criar pasta no servidor');
    }
  };

  const handleDeleteFolder = async (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    try {
      if (isVisionLab) {
        await removeVisionLabFolder(id);
      } else {
        await removeCodeProjectFolder(id);
      }
      toast.success('Pasta excluída com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir pasta remota:', err);
      toast.error('Erro ao excluir pasta');
    }
  };

  const handleRenameFolder = async (id: string) => {
    if (!editFolderName.trim()) {
      setEditingFolderId(null);
      return;
    }
    const name = editFolderName.trim();
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f));
    setEditingFolderId(null);
    setEditFolderName('');

    try {
      if (isVisionLab) {
        await updateVisionLabFolder({ id, name } as any);
      } else {
        await updateCodeProjectFolder({ id, name } as any);
      }
      toast.success('Pasta renomeada com sucesso!');
    } catch (err) {
      console.error('Erro ao renomear pasta remota:', err);
      toast.error('Erro ao renomear pasta');
    }
  };

  const handleFolderClick = (folder: Folder) => {
    if (isVisionLab) {
      navigate(`/vision-lab/${folder.id}`);
    } else {
      navigate(`/code/${folder.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <AnimatePresence mode="wait">
        {showShared ? (
          <motion.div
            key="shared"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowShared(false)}
                  className="rounded-2xl"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Compartilhados Comigo</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Projetos que outros compartilharam com você
                  </p>
                </div>
              </div>
            </div>

            {/* Shared Projects Grid */}
            {sharedProjects.length === 0 ? (
              <div className="glass-card rounded-3xl p-12 text-center">
                <p className="text-muted-foreground">Nenhum projeto compartilhado com você no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sharedProjects.map((project, i) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ y: -4 }}
                    onClick={() => navigate(`/code/${project.folder_id || 'shared'}/${project.id}?_p=${encodeURIComponent(project.name)}`)}
                    className="glass-card rounded-3xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer border border-border/50 group"
                  >
                    <div className="p-3 pb-2 h-40">
                      <CodeThumbnail lines={project.codePreview} />
                    </div>
                    <div className="px-4 pb-4 pt-1">
                      <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">{project.sharedBy}</span>
                        <span className="text-[11px]">{project.sharedAt}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="folders-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                  <HeaderIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isVisionLab && (
                  <Button
                    variant="outline"
                    onClick={() => setShowShared(true)}
                    className="rounded-2xl gap-2 border-border/60 hover:bg-accent"
                  >
                    <Share2 className="w-4 h-4" />
                    Compartilhados comigo
                  </Button>
                )}

                <Button
                  onClick={() => setShowNewFolder(true)}
                  className="rounded-2xl gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                >
                  <Plus className="w-4 h-4" />
                  Nova Pasta
                </Button>
              </div>
            </div>

            {/* Folders Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span>Carregando pastas...</span>
              </div>
            ) : folders.length === 0 ? (
              <div className="glass-card rounded-3xl p-12 text-center">
                <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">Nenhuma pasta encontrada.</p>
                <Button onClick={() => setShowNewFolder(true)} variant="outline" className="mt-4 rounded-2xl gap-2">
                  <Plus className="w-4 h-4" />
                  Criar Primeira Pasta
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {folders.map((folder, i) => (
                  <motion.div
                    key={folder.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ y: -4 }}
                    onClick={() => handleFolderClick(folder)}
                    className="group glass-card rounded-3xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer border border-border/50"
                  >
                    {/* Visual card header */}
                    <div className="p-3 pb-2 h-40">
                      <CodeThumbnail lines={folder.codePreview} />
                    </div>

                    {/* Info */}
                    <div className="px-4 pb-4 pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                          <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                            {folder.name}
                          </h3>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <button className="p-1.5 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-accent transition-all shrink-0">
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-2xl min-w-[160px]">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingFolderId(folder.id);
                                setEditFolderName(folder.name);
                              }}
                              className="gap-2 rounded-xl"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Renomear
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(folder.id);
                              }}
                              className="gap-2 rounded-xl text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Apagar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5" />
                          {folder.projectCount} {folder.projectCount === 1 ? 'projeto' : 'projetos'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {folder.createdAt}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center mb-2 ring-1 ring-primary/20">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle>Nova Pasta</DialogTitle>
            <DialogDescription>Dê um nome para a sua pasta de projetos</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Ex: Projetos Robótica 2026"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
              className="rounded-2xl"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowNewFolder(false)} className="rounded-2xl">
              Cancelar
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()} className="rounded-2xl">
              Criar Pasta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default MeusCodigosView;
