import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, MoreVertical, Pencil, Trash2, Share2, Code2, Sparkles, Globe, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ShareProjectDialog from './ShareProjectDialog';
import CodeThumbnail from './CodeThumbnail';
import { createCodeProject, removeCodeProject, updateCodeProject } from '@/_base/services/codeProject';
import { getCodeProjectFolder } from '@/_base/services/codeProjectFolder';
import { createVisionLabProject, getVisionLabFolder, removeVisionLabProject, updateVisionLabProject } from '@/_base/services/visionLab';
import { listRelatedUsers } from '@/_base/services/user';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  createdAt: string;
  codePreview: string[];
  isPublished?: boolean;
  privacy_type?: string;
  share_links?: any[];
  raw?: any;
}

interface FolderDetailViewProps {
  folderId?: string;
  folderName?: string;
  isVisionLab?: boolean;
  onBack?: () => void;
}

const DEFAULT_CODE_PREVIEW = [
  '#include <Arduino.h>',
  'int LED = 13;',
  'void setup() {',
  '  pinMode(LED, OUTPUT);',
  '  Serial.begin(9600);',
  '}',
  'void loop() {',
  '  digitalWrite(LED, HIGH);',
  '  delay(1000);',
  '}',
];

const FolderDetailView = ({
  folderId: propFolderId,
  folderName: propFolderName,
  isVisionLab = false,
  onBack: propOnBack,
}: FolderDetailViewProps) => {
  const navigate = useNavigate();
  const params = useParams<{ folderId?: string }>();
  const actualFolderId = propFolderId || params.folderId || '';

  const [folderName, setFolderName] = useState(propFolderName || 'Pasta');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [shareProject, setShareProject] = useState<Project | null>(null);

  const handleBack = () => {
    if (propOnBack) {
      propOnBack();
    } else {
      navigate(isVisionLab ? '/vision-lab' : '/code');
    }
  };

  useEffect(() => {
    if (!actualFolderId) return;
    let mounted = true;

    const loadFolder = async () => {
      try {
        setIsLoading(true);
        if (isVisionLab) {
          const res = await getVisionLabFolder(actualFolderId);
          if (mounted && res) {
            setFolderName(res.name || 'Pasta de Modelos');
            const mapped = (res.projects || []).map((p: any) => ({
              id: p.id,
              name: p.name,
              createdAt: p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : 'Recente',
              codePreview: ['// Modelo de Visão Computacional', `// ${p.name}`, 'Classes: ' + ((p.labels || []).join(', ') || 'Nenhuma'), 'void setup() {}'],
              isPublished: p.is_published,
              privacy_type: p.privacy_type,
              share_links: p.share_links || [],
              raw: p,
            }));
            setProjects(mapped);
          }
        } else {
          const [projectFolder] = await Promise.all([
            getCodeProjectFolder(actualFolderId),
            listRelatedUsers().catch(() => []),
          ]);
          if (mounted && projectFolder) {
            setFolderName(projectFolder.name || 'Pasta');
            const mapped = (projectFolder.projects || []).map((p: any) => ({
              id: p.id,
              name: p.name,
              createdAt: p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : 'Recente',
              codePreview: p.source_code?.code
                ? p.source_code.code.split('\n').slice(0, 10)
                : DEFAULT_CODE_PREVIEW,
              isPublished: p.is_published,
              privacy_type: p.privacy_type,
              share_links: p.share_links || [],
              raw: p,
            }));
            setProjects(mapped);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados da pasta:', err);
        toast.error('Não foi possível carregar os projetos da pasta.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadFolder();
    return () => {
      mounted = false;
    };
  }, [actualFolderId, isVisionLab]);

  const handleOpenProject = (projectId: string) => {
    if (isVisionLab) {
      navigate(`/vision-lab/${actualFolderId}/${projectId}`);
    } else {
      navigate(`/code/${actualFolderId}/${projectId}`);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !actualFolderId) return;
    const name = newProjectName.trim();
    setNewProjectName('');
    setShowNewProject(false);

    try {
      if (isVisionLab) {
        const created = await createVisionLabProject({ name, folder_id: actualFolderId } as any);
        toast.success('Modelo criado com sucesso!');
        if (created?.id) {
          navigate(`/vision-lab/${actualFolderId}/${created.id}`);
        } else {
          setProjects(prev => [{ id: Date.now().toString(), name, createdAt: 'agora', codePreview: ['// Novo Modelo'] }, ...prev]);
        }
      } else {
        const initialMetadata = {
          metadata: { version: '1.0', timestamp: new Date().toISOString() },
          settings: { mode: 'stage' },
          stage: { activeSpriteId: 'sprite1' },
          sprites: [
            {
              id: 'sprite1',
              name: 'Tobi',
              x: 0,
              y: 0,
              angle: 90,
              size: 100,
              visible: true,
              rotationStyle: 'all around',
              costume: '/svg/spriteLibrary/Tobi/tobi_costume1.svg',
              currentCostumeId: 'c1',
              costumes: [
                { id: 'c1', name: 'tobi_costume1', url: '/svg/spriteLibrary/Tobi/tobi_costume1.svg' },
                { id: 'c2', name: 'tobi_costume2', url: '/svg/spriteLibrary/Tobi/tobi_costume2.svg' },
              ],
              sounds: [{ id: 'sound1', name: 'Latido', url: '/song/tobi_sound.mp3', format: 'mp3' }],
              currentSoundId: 'sound1',
              volume: 100,
              bubbleText: '',
              bubbleType: null,
              draggable: false,
              blocks: { blocks: { languageVersion: 0, blocks: [] }, variables: [] },
              code: '',
            },
          ],
          uploadMode: { blocks: null, code: '' },
          updatedAt: Date.now(),
        };

        const created = await createCodeProject({
          name,
          folder_id: actualFolderId,
          source_code: { code: '', mode: 'block', simulation_elements_layout: [], variables: [] },
          metadata: initialMetadata,
        } as any);

        toast.success('Projeto criado com sucesso!');
        if (created?.id) {
          navigate(`/code/${actualFolderId}/${created.id}`);
        } else {
          setProjects(prev => [{ id: Date.now().toString(), name, createdAt: 'agora', codePreview: DEFAULT_CODE_PREVIEW }, ...prev]);
        }
      }
    } catch (err) {
      console.error('Erro ao criar projeto:', err);
      toast.error('Erro ao criar projeto no servidor');
    }
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) { setEditingId(null); return; }
    const name = editName.trim();
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name } : p));
    setEditingId(null);

    try {
      if (isVisionLab) {
        await updateVisionLabProject({ id, name } as any);
      } else {
        await updateCodeProject({ id, name } as any);
      }
      toast.success('Projeto renomeado!');
    } catch (err) {
      console.warn('Erro ao renomear projeto remoto:', err);
    }
  };

  const handleDelete = async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    try {
      if (isVisionLab) {
        await removeVisionLabProject(id);
      } else {
        await removeCodeProject(id);
      }
      toast.success('Projeto excluído!');
    } catch (err) {
      console.warn('Erro ao excluir projeto remoto:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center hover:bg-accent/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{folderName}</h1>
            <p className="text-sm text-muted-foreground">{projects.length} projetos nesta pasta</p>
          </div>
        </div>

        <Button
          onClick={() => setShowNewProject(true)}
          className="rounded-2xl gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Novo Projeto
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span>Carregando projetos da pasta...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center">
          <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Code2 className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground">Nenhum projeto nesta pasta</p>
          <Button onClick={() => setShowNewProject(true)} variant="outline" className="mt-4 rounded-2xl gap-2">
            <Plus className="w-4 h-4" />
            Criar Primeiro Projeto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              onClick={() => handleOpenProject(project.id)}
              className="group glass-card rounded-3xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer border border-border/50"
            >
              {/* Code thumbnail */}
              <div className="p-3 pb-2 h-40">
                <CodeThumbnail lines={project.codePreview} />
              </div>

              {/* Info */}
              <div className="px-4 pb-4 pt-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {editingId === project.id ? (
                      <Input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRename(project.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        onBlur={() => handleRename(project.id)}
                        className="h-7 text-sm rounded-xl px-2"
                      />
                    ) : (
                      <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <button className="p-1.5 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-accent transition-all shrink-0">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl min-w-[160px]">
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); setEditingId(project.id); setEditName(project.name); }}
                        className="gap-2 rounded-xl"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Renomear
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); setShareProject(project); }}
                        className="gap-2 rounded-xl"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Compartilhar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                        className="gap-2 rounded-xl text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Apagar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-muted-foreground/70 truncate">{project.createdAt}</p>
                  {(() => {
                    const isPrivate = project.privacy_type === 'private' || (!project.isPublished && project.privacy_type !== 'public');
                    return (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          isPrivate
                            ? 'bg-foreground/10 text-foreground border-foreground/20'
                            : 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400'
                        }`}
                        title={isPrivate ? 'Projeto privado — visível apenas para você' : 'Projeto público — visível para todos'}
                      >
                        {isPrivate ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                        {isPrivate ? 'PRIVADO' : 'PÚBLICO'}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* New Project Dialog */}
      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center mb-2 ring-1 ring-primary/20">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle>Novo Projeto</DialogTitle>
            <DialogDescription>Dê um nome para o seu novo projeto</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Ex: Seguidor de Linha v2"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
              className="rounded-2xl"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowNewProject(false)} className="rounded-2xl">
              Cancelar
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim()} className="rounded-2xl">
              Criar Projeto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Project Dialog */}
      {shareProject && (
        <ShareProjectDialog
          open={!!shareProject}
          onOpenChange={(open) => !open && setShareProject(null)}
          projectName={shareProject.name}
          targetProject={shareProject.raw || shareProject}
          initialIsPublished={shareProject.isPublished}
          onSavePermissions={(newPermissions, isPublished, privacyType) => {
            setProjects(prev =>
              prev.map(p =>
                p.id === shareProject.id
                  ? { ...p, isPublished, privacy_type: privacyType || (isPublished ? 'public' : 'private') }
                  : p
              )
            );
          }}
        />
      )}
    </div>
  );
};

export default FolderDetailView;
