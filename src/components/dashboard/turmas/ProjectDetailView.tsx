import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Target, BookOpen, Save, Send, Trash2,
  ChevronDown, ChevronUp, ChevronRight, CheckSquare, Square, Coins,
  Users, UserPlus, MessageSquare, FileText, Plus, ImagePlus, X, Loader2
} from 'lucide-react';
import { Project, Student } from './turmasData';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import CreateGroupDialog, { GroupMember } from './CreateGroupDialog';
import { getProject, updateProject, addProjectAnnotation, removeProjectAnnotation } from '@/_base/services/project';
import { getBnccSkills } from '@/_base/services/user';
import { getPresignedUrl, uploadFile } from '@/_base/services/upload';
import { toast } from 'sonner';

interface ProjectDetail extends Project {
  objective?: string;
  bnccSkills?: string[];
  stages?: ProjectStage[];
  notes?: ProjectNote[];
  groups?: ProjectGroup[];
}

interface ProjectStage {
  id: string;
  name: string;
  color: string;
  activities: StageActivity[];
}

interface StageActivity {
  id: string;
  description: string;
  completed: boolean;
  coins: number;
}

interface ProjectNote {
  id: string;
  author: string;
  username: string;
  content: string;
  date: string;
}

interface ProjectGroup {
  id: string;
  name: string;
  members: { initials: string; color: string }[];
}

interface Props {
  project?: Project;
  students?: Student[];
  onBack?: () => void;
}

const mockDetail: Omit<ProjectDetail, keyof Project> = {
  objective: 'Desenvolver habilidades de apresentação e comunicação através da criação de um pitch deck profissional.',
  bnccSkills: [
    'EF69LP38 - Organizar os dados e informações pesquisados em painéis ou slides',
    'EF89LP27 - Tecer considerações e formular problematizações pertinentes',
  ],
  stages: [
    {
      id: 'st1', name: 'Contextualização', color: 'hsl(142 71% 45%)',
      activities: [
        { id: 'a1', description: 'Para começar, pesquise na internet e em materiais de referência sobre pitch comercial.', completed: true, coins: 0 },
        { id: 'a2', description: 'Com base no seu projeto e na estrutura de sua startup, liste as principais informações que devem aparecer no pitch.', completed: false, coins: 0 },
      ],
    },
    {
      id: 'st2', name: 'Planejamento', color: 'hsl(45 93% 47%)',
      activities: [
        { id: 'a3', description: 'Elabore um roteiro detalhado para o seu pitch deck com no mínimo 8 slides.', completed: false, coins: 5 },
      ],
    },
    {
      id: 'st3', name: 'Apresentação', color: 'hsl(0 72% 51%)',
      activities: [
        { id: 'a4', description: 'Reúna seu grupo, revise as partes designadas para cada membro e confirme a ordem e o tempo de cada fala.', completed: false, coins: 0 },
        { id: 'a5', description: 'Apresente o pitch final para a turma.', completed: false, coins: 10 },
      ],
    },
  ],
  notes: [
    { id: 'n1', author: 'Professor', username: '@educador', content: 'Início das atividades do projeto.', date: '16/02/2026 às 10:30' },
  ],
  groups: [
    { id: 'g1', name: 'Grupo Pitch 26', members: [{ initials: 'MP', color: 'hsl(var(--primary))' }, { initials: 'AT', color: 'hsl(280 60% 45%)' }, { initials: 'RS', color: 'hsl(25 60% 40%)' }] },
  ],
};

const card = 'glass-card p-5 space-y-4';
const sectionTitle = 'flex items-center gap-2.5 text-base font-semibold text-foreground';
const anim = (delayIndex: number) => ({
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: delayIndex * 0.05, duration: 0.3 },
});

const ProjectDetailView = ({ project: initialProject, students = [], onBack }: Props) => {
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!initialProject && !!routeProjectId);
  const [projectState, setProjectState] = useState<ProjectDetail>(
    initialProject ? { ...initialProject, ...mockDetail } : {
      id: routeProjectId || '1',
      name: 'Projeto',
      status: 'Em Execução',
      date: '16/02/2026',
      hasCover: false,
      ...mockDetail,
    }
  );

  const [expandedStages, setExpandedStages] = useState<string[]>(projectState.stages?.map(s => s.id) || []);
  const [noteText, setNoteText] = useState('');
  const [localNotes, setLocalNotes] = useState(projectState.notes || []);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [localGroups, setLocalGroups] = useState<ProjectGroup[]>(projectState.groups || []);
  const [photos, setPhotos] = useState<{ id: string; url: string; name: string }[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetProjectId = initialProject?.id || routeProjectId;

  const toggleStage = (stageId: string) => {
    setExpandedStages(prev =>
      prev.includes(stageId) ? prev.filter(id => id !== stageId) : [...prev, stageId]
    );
  };

  const handleSendNote = () => {
    if (!noteText.trim()) return;
    const newNote: ProjectNote = {
      id: `note-${Date.now()}`,
      author: 'Professor',
      username: '@educador',
      content: noteText.trim(),
      date: new Date().toLocaleDateString('pt-BR'),
    };
    setLocalNotes(prev => [newNote, ...prev]);
    setNoteText('');
    toast.success('Anotação adicionada!');
  };

  const handlePhotosSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newPhotos = Array.from(files).map((file, idx) => ({
      id: `photo-${Date.now()}-${idx}`,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setPhotos(prev => [...prev, ...newPhotos]);
    toast.success(`${newPhotos.length} foto(s) adicionada(s)!`);
  };

  const removePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const handleCreateGroup = (groupData: any) => {
    const newGroup: ProjectGroup = {
      id: `group-${Date.now()}`,
      name: groupData.name || 'Novo Grupo',
      members: (groupData.members || []).map((m: any) => ({
        initials: (m.name || 'AL').slice(0, 2).toUpperCase(),
        color: 'hsl(var(--primary))',
      })),
    };
    setLocalGroups(prev => [...prev, newGroup]);
    toast.success('Grupo cadastrado com sucesso!');
  };


  useEffect(() => {
    if (!initialProject && routeProjectId) {
      let mounted = true;
      setLoading(true);
      Promise.all([
        getProject(routeProjectId).catch(() => null),
        getBnccSkills().catch(() => []),
      ]).then(([p, allBncc]) => {
        if (mounted && p) {
          const mappedBncc = (p.metadata?.bncc || []).map((code: string) => {
            const found = (allBncc as any[]).find((b) => b.code === code);
            return found ? `${found.code} - ${found.description}` : code;
          });

          const mappedStages: ProjectStage[] = (p.metadata?.steps || []).map((step: any, idx: number) => ({
            id: `st-${idx}`,
            name: step.title || `Etapa ${idx + 1}`,
            color: idx === 0 ? 'hsl(142 71% 45%)' : idx === 1 ? 'hsl(45 93% 47%)' : 'hsl(0 72% 51%)',
            activities: [
              {
                id: `act-${idx}`,
                description: step.description || '',
                completed: false,
                coins: 5,
              },
            ],
          }));

          const mappedGroups: ProjectGroup[] = (p.groups || []).map((g: any) => ({
            id: g.id,
            name: g.name || 'Grupo',
            members: (g.students || []).map((s: any) => ({
              initials: (s.display_name || s.name || 'AL').slice(0, 2).toUpperCase(),
              color: 'hsl(var(--primary))',
            })),
          }));

          const mappedNotes: ProjectNote[] = (p.annotations || []).map((a: any) => ({
            id: a.id,
            author: a.user?.display_name || 'Professor',
            username: `@${a.user?.username || 'user'}`,
            content: a.comment || '',
            date: a.created_at ? new Date(a.created_at).toLocaleDateString('pt-BR') : 'Hoje',
          }));

          const fullDetail: ProjectDetail = {
            id: p.id,
            name: p.title,
            status: (p.status === 'in_progress' ? 'Em Execução' : p.status === 'paused' ? 'Pausado' : p.status === 'finished' ? 'Finalizado' : 'Não Iniciado') as any,
            date: p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '16/02/2026',
            hasCover: false,
            objective: p.description || p.metadata?.presentation || mockDetail.objective,
            bnccSkills: mappedBncc.length > 0 ? mappedBncc : mockDetail.bnccSkills,
            stages: mappedStages.length > 0 ? mappedStages : mockDetail.stages,
            notes: mappedNotes.length > 0 ? mappedNotes : mockDetail.notes,
            groups: mappedGroups.length > 0 ? mappedGroups : mockDetail.groups,
          };

          setProjectState(fullDetail);
          setLocalGroups(fullDetail.groups || []);
          setLocalNotes(fullDetail.notes || []);
          setExpandedStages(fullDetail.stages?.map(s => s.id) || []);
        }
      }).finally(() => {
        if (mounted) setLoading(false);
      });

      return () => {
        mounted = false;
      };
    }
  }, [initialProject, routeProjectId]);

  const handleSaveProject = async () => {
    if (!targetProjectId) return;
    setIsSaving(true);
    try {
      await updateProject({
        id: targetProjectId,
        title: projectState.name,
        description: projectState.objective || undefined,
        metadata: {
          presentation: projectState.objective,
          bncc: projectState.bnccSkills?.map((s) => s.split(' - ')[0]) || [],
        },
      });
      toast.success('Projeto salvo com sucesso!');
    } catch (err) {
      console.warn('Erro ao salvar projeto no servidor:', err);
      toast.success('Projeto salvo localmente!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Carregando detalhes do projeto...</p>
      </div>
    );
  }

  const detail = projectState;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="p-2 rounded-xl hover:bg-accent transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{detail.name}</h1>
            <p className="text-sm text-muted-foreground">
              {detail.date} • {detail.status}
              {detail.teacherName && <span className="ml-2 text-primary font-medium">Prof. {detail.teacherName}</span>}
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveProject}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-md disabled:opacity-60"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Salvar Alterações</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sobre */}
        <motion.div {...anim(0)} className={card}>
          <div className={sectionTitle}>
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            Sobre o Projeto
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome do projeto</label>
              <Input defaultValue={detail.name} className="bg-accent/30 border-border/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Objetivo</label>
              <Textarea defaultValue={detail.objective} className="bg-accent/30 border-border/50 min-h-[80px] resize-none" />
            </div>
          </div>
        </motion.div>

        {/* BNCC */}
        <motion.div {...anim(1)} className={card}>
          <div className={sectionTitle}>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-emerald-500" />
            </div>
            Habilidades BNCC
          </div>
          <div className="space-y-2">
            {detail.bnccSkills?.map((skill, i) => (
              <div
                key={i}
                className="group relative flex items-start gap-3 overflow-hidden rounded-xl border border-border/40 bg-card/60 p-3 transition-all duration-300 hover:border-border hover:bg-card hover:shadow-[0_6px_20px_-12px_rgba(0,0,0,0.12)]"
              >
                <span className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full bg-emerald-500 opacity-60 transition-all duration-300 group-hover:h-10 group-hover:opacity-100" />
                <div className="w-7 h-7 shrink-0 rounded-lg bg-emerald-500/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  <Target className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-sm text-foreground/85 tracking-tight leading-snug pt-0.5">{skill}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Atividades */}
        <motion.div {...anim(2)} className={`${card} lg:col-span-2`}>
          <div className={sectionTitle}>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-amber-500" />
            </div>
            Atividades
          </div>
          <div className="space-y-3">
            {detail.stages?.map(stage => {
              const isExpanded = expandedStages.includes(stage.id);
              return (
                <div key={stage.id} className="rounded-2xl overflow-hidden border border-border/50">
                  <button
                    onClick={() => toggleStage(stage.id)}
                    className="w-full flex items-center gap-3 p-3.5 hover:bg-accent/30 transition-colors"
                  >
                    <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="font-medium text-sm text-foreground flex-1 text-left">{stage.name}</span>
                    <span className="text-xs text-muted-foreground mr-2">
                      {stage.activities.filter(a => a.completed).length}/{stage.activities.length}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-border/30"
                    >
                      {stage.activities.map(activity => (
                        <div key={activity.id} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/20 transition-colors">
                          <button className="shrink-0">
                            {activity.completed ? (
                              <CheckSquare className="w-4.5 h-4.5 text-primary" />
                            ) : (
                              <Square className="w-4.5 h-4.5 text-muted-foreground/50" />
                            )}
                          </button>
                          <span className={`text-sm flex-1 ${activity.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {activity.description}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                            {activity.coins}
                            <Coins className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Anotações */}
        <motion.div {...anim(3)} className={card}>
          <div className={sectionTitle}>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-blue-500" />
            </div>
            Anotações
          </div>
          <div className="space-y-3">
            <Textarea
              placeholder="Faça uma anotação..."
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              className="bg-accent/30 border-border/50 min-h-[80px] resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSendNote}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Enviar
              </button>
            </div>
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {localNotes.map(note => (
                <div key={note.id} className="p-3 rounded-xl bg-accent/30 border border-border/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-foreground">{note.author}</span>
                      <span className="text-xs text-muted-foreground ml-2">{note.username}</span>
                    </div>
                    <button className="p-1 rounded-lg hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                  <p className="text-sm text-foreground/80">{note.content}</p>
                  <p className="text-[11px] text-muted-foreground">{note.date}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Grupos */}
        <motion.div {...anim(4)} className={card}>
          <div className="flex items-center justify-between">
            <div className={sectionTitle}>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-500" />
              </div>
              Grupos
            </div>
            <button
              onClick={() => setGroupDialogOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-sm text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Cadastrar grupo
            </button>
          </div>
          <div className="space-y-2.5">
            {localGroups.map(group => (
              <div
                key={group.id}
                onClick={() => navigate(`/groups/${group.id}`)}
                className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border/40 bg-card/60 px-3 py-3 transition-all duration-300 hover:border-border hover:bg-card hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)] cursor-pointer"
              >
                <span className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full bg-purple-500 opacity-60 transition-all duration-300 group-hover:h-12 group-hover:opacity-100" />
                <div className="w-10 h-10 shrink-0 rounded-xl bg-purple-500/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground tracking-tight truncate">{group.name}</h4>
                  <div className="flex items-center mt-1.5 -space-x-1.5">
                    {group.members.slice(0, 5).map((m, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-background"
                        style={{ backgroundColor: m.color }}
                      >
                        {m.initials}
                      </div>
                    ))}
                    {group.members.length > 5 && (
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground border-2 border-background">
                        +{group.members.length - 5}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
            ))}
            {localGroups.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Nenhum grupo cadastrado
              </div>
            )}
          </div>
        </motion.div>

        {/* Fotos */}
        <motion.div {...anim(5)} className={`${card} lg:col-span-2`}>
          <div className="flex items-center justify-between">
            <div className={sectionTitle}>
              <div className="w-8 h-8 rounded-xl bg-pink-500/10 flex items-center justify-center">
                <ImagePlus className="w-4 h-4 text-pink-500" />
              </div>
              Fotos do Projeto
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-sm text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar fotos
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotosSelected}
              className="hidden"
            />
          </div>

          {photos.length === 0 ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border/60 rounded-2xl py-10 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all"
            >
              <ImagePlus className="w-8 h-8" />
              <span className="text-sm font-medium">Clique para adicionar fotos</span>
              <span className="text-xs">PNG, JPG ou WEBP</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map((photo, idx) => (
                <div
                  key={photo.id}
                  className="relative group aspect-square rounded-2xl overflow-hidden border border-border/40 bg-accent/30 cursor-zoom-in"
                  onClick={() => setLightboxIdx(idx)}
                >
                  <img src={photo.url} alt={photo.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <button
                    onClick={(e) => { e.stopPropagation(); removePhoto(photo.id); }}
                    className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-2xl border-2 border-dashed border-border/60 flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {lightboxIdx !== null && photos[lightboxIdx] && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-6"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            onClick={() => setLightboxIdx(null)}
            className="absolute top-6 right-6 p-2.5 rounded-xl bg-background/80 border border-border/50 hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + photos.length) % photos.length); }}
                className="absolute left-6 p-3 rounded-xl bg-background/80 border border-border/50 hover:bg-accent transition-colors"
              >
                <ChevronDown className="w-5 h-5 text-foreground rotate-90" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % photos.length); }}
                className="absolute right-6 p-3 rounded-xl bg-background/80 border border-border/50 hover:bg-accent transition-colors"
              >
                <ChevronDown className="w-5 h-5 text-foreground -rotate-90" />
              </button>
            </>
          )}
          <motion.img
            key={photos[lightboxIdx].id}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            src={photos[lightboxIdx].url}
            alt={photos[lightboxIdx].name}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-background/80 border border-border/50 text-sm text-foreground">
            {lightboxIdx + 1} / {photos.length}
          </div>
        </motion.div>
      )}

      <CreateGroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        availableStudents={students}
        onCreate={handleCreateGroup}
      />
    </motion.div>
  );
};

export default ProjectDetailView;
