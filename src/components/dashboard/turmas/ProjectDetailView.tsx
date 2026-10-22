import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Target,
  Save,
  Send,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Coins,
  Users,
  UserPlus,
  MessageSquare,
  FileText,
  Plus,
  ImagePlus,
  X,
  Loader2,
  AlertTriangle,
  Edit2,
  Sparkles,
  Search,
  Check,
  Wrench,
} from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import {
  getProject,
  updateProject,
  addProjectAnnotation,
  removeProjectAnnotation,
} from '@/_base/services/project';
import { giveCashback } from '@/_base/services/project/giveCashback';
import { getBnccSkills } from '@/_base/services/user';
import { getPresignedUrl } from '@/_base/services/upload';
import {
  acceptGroup,
  removeGroup,
  addGroupToProject,
  listAvailableUsersForGroupByProject,
} from '@/_base/services/group';
import { IProject, IHubProjectStep } from '@/_base/interfaces/project';
import { IBnccSkill } from '@/_base/interfaces/shared/IBnccSkill';
import { IHubGroup } from '@/_base/interfaces/group';
import { ClassProjectMetadataReward } from '@/_base/interfaces/project/IClassProjectMetadata';
import { IHubUser } from '@/_base/interfaces/user';
import { formatShortName, formatCoin } from '@/_base/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import CreateGroupDialog from './CreateGroupDialog';
import { toast } from 'sonner';

interface Props {
  project?: any;
  students?: any[];
  onBack?: () => void;
}

type ModalStep =
  | 'hidden'
  | 'missing_students'
  | 'taxed_students'
  | 'students_rewarded'
  | 'edit_activity';

const formatCoins = (value: number): string => `${Math.round((Number(value) || 0) * 100) / 100}`;

const sumCashbacks = (data: IHubProjectStep[]): number =>
  data.reduce((acc, v) => acc + Number(v.cashback || 0), 0);

const stepIsFinished = (project: IProject, step: IHubProjectStep): boolean =>
  !!project.metadata?.finished_activities?.includes(`${step?.parent || '-'}.${step?.title}`);

const ProjectDetailView = ({ onBack }: Props) => {
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<IProject | null>(null);
  const [savedProject, setSavedProject] = useState<IProject | null>(null);
  const [bnccSkills, setBnccSkills] = useState<IBnccSkill[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Expanded stages
  const [expandedStages, setExpandedStages] = useState<string[]>([]);

  // Annotations
  const [noteText, setNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [annotationToDelete, setAnnotationToDelete] = useState<string | null>(null);

  // BNCC Modal
  const [showBnccModal, setShowBnccModal] = useState(false);
  const [bnccSearch, setBnccSearch] = useState('');

  // Groups
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [availableGroupStudents, setAvailableGroupStudents] = useState<IHubUser[]>([]);
  const [pendingGroupAction, setPendingGroupAction] = useState<{
    group: IHubGroup;
    accept: boolean;
  } | null>(null);

  // Photos
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cashback / Activities Flow
  const [activityModalStep, setActivityModalStep] = useState<ModalStep>('hidden');
  const [targetRewards, setTargetRewards] = useState<IHubProjectStep[]>([]);
  const [missingStudents, setMissingStudents] = useState<string[]>([]);
  const [taxedStudents, setTaxedStudents] = useState<Record<string, string>>({});

  // Edit Finished Activity Modal
  const [editingActivity, setEditingActivity] = useState<IHubProjectStep | null>(null);
  const [editingMissingStudents, setEditingMissingStudents] = useState<string[]>([]);
  const [editingTaxedStudents, setEditingTaxedStudents] = useState<Record<string, string>>({});

  // Fetch project and BNCC data
  useEffect(() => {
    if (!routeProjectId) return;
    let mounted = true;
    setLoading(true);

    Promise.all([
      getProject(routeProjectId).catch(() => null),
      getBnccSkills().catch(() => []),
    ])
      .then(([p, allBncc]) => {
        if (mounted && p) {
          setProject(p);
          setSavedProject(p);
          setBnccSkills(allBncc || []);
          const initialParents = (p.project?.metadata?.steps || [])
            .map((s: any) => s.parent || '')
            .filter(Boolean);
          setExpandedStages(Array.from(new Set(initialParents)));
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar dados do projeto:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [routeProjectId]);

  // Tools / Materials
  const [newTool, setNewTool] = useState('');

  const canEdit = user?.id === project?.user_id || user?.role === 'master';
  const isFactoryProject = !project?.educator?.id && !!project?.project_id;

  const handleAddTool = () => {
    if (!newTool.trim() || !project) return;
    const currentTools = project.metadata?.tools || [];
    if (currentTools.includes(newTool.trim())) {
      toast.error('Este material já foi adicionado.');
      return;
    }
    setProject({
      ...project,
      metadata: {
        ...project.metadata,
        tools: [...currentTools, newTool.trim()],
      },
    });
    setNewTool('');
  };

  const handleRemoveTool = (tool: string) => {
    if (!project) return;
    setProject({
      ...project,
      metadata: {
        ...project.metadata,
        tools: (project.metadata?.tools || []).filter((t) => t !== tool),
      },
    });
  };

  const needSave = useMemo<boolean>(() => {
    if (!project || !savedProject) return false;
    return (
      JSON.stringify(project) !== JSON.stringify(savedProject) ||
      files.length > 0
    );
  }, [project, savedProject, files]);

  // Main Save Handler
  const handleSave = useCallback(
    async (
      newProjectData?: IProject,
      newRewards?: Record<string, ClassProjectMetadataReward[]>
    ) => {
      const _project = newProjectData || project;
      if (!_project) return;
      setIsSaving(true);
      try {
        const metadataCopy = { ..._project.metadata };

        // 1. Upload new photos to S3 via presigned URLs
        if (files.length > 0) {
          const presignedData = await Promise.all(
            files.map((f) => getPresignedUrl(f.type || 'image/jpeg', 'user_projects'))
          );

          await Promise.all(
            presignedData.map((e, i) =>
              axios.put(e.link, files[i], {
                headers: { 'Content-Type': files[i].type || 'image/jpeg' },
              })
            )
          );

          metadataCopy.attachments = [
            ...(metadataCopy.attachments || []),
            ...presignedData.map((e) => e.path),
          ];
        }

        // 2. Call updateProject API
        const updated = await updateProject({
          id: _project.id,
          title: _project.title,
          description: _project.description || undefined,
          metadata: metadataCopy,
        });

        // 3. Call giveCashback API if rewards provided
        if (newRewards) {
          await giveCashback(_project.id, { rewards: newRewards });
        }

        const merged: IProject = {
          ..._project,
          ...updated,
          metadata: metadataCopy,
          hub_class: _project.hub_class,
          educator: _project.educator,
        };

        setProject(merged);
        setSavedProject(merged);
        setFiles([]);
        toast.success('Projeto salvo com sucesso!');
      } catch (err) {
        console.error('Erro ao salvar projeto:', err);
        toast.error('Ocorreu um erro ao salvar o projeto. Tente novamente.');
      } finally {
        setIsSaving(false);
      }
    },
    [project, files]
  );

  // --- Annotation Handlers ---
  const handleAddAnnotation = async () => {
    if (!project || !noteText.trim()) return;
    setIsAddingNote(true);
    try {
      const annotation = await addProjectAnnotation({
        hub_project_class_id: project.id,
        metadata: { message: noteText.trim(), attachments: [] },
      });
      setProject((p) => (p ? { ...p, annotations: [annotation, ...(p.annotations || [])] } : p));
      setSavedProject((p) => (p ? { ...p, annotations: [annotation, ...(p.annotations || [])] } : p));
      setNoteText('');
      toast.success('Anotação adicionada com sucesso!');
    } catch (err) {
      console.error('Erro ao adicionar anotação:', err);
      toast.error('Erro ao adicionar anotação.');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleConfirmDeleteAnnotation = async () => {
    if (!annotationToDelete || !project) return;
    try {
      await removeProjectAnnotation(annotationToDelete);
      setProject((p) =>
        p ? { ...p, annotations: p.annotations.filter((a) => a.id !== annotationToDelete) } : p
      );
      setSavedProject((p) =>
        p ? { ...p, annotations: p.annotations.filter((a) => a.id !== annotationToDelete) } : p
      );
      toast.success('Anotação excluída!');
    } catch (err) {
      console.error('Erro ao remover anotação:', err);
      toast.error('Erro ao remover anotação.');
    } finally {
      setAnnotationToDelete(null);
    }
  };

  // --- Group Handlers ---
  const handleOpenCreateGroup = async () => {
    if (!project) return;
    try {
      const students = await listAvailableUsersForGroupByProject(project.id);
      setAvailableGroupStudents(students);
      setGroupDialogOpen(true);
    } catch (err) {
      console.error('Erro ao listar alunos disponíveis para o grupo:', err);
      toast.error('Erro ao buscar alunos da turma.');
    }
  };

  const handleConfirmCreateGroup = async (groupData: { name: string; users: string[]; members?: any[] }) => {
    if (!project) return;
    try {
      const ROLE_LABEL_MAP: Record<string, string> = {
        lider: 'Líder de Grupo',
        gestor: 'Gestor de Projetos',
        social: 'Social Media',
        construtor: 'Construtor',
        'Líder de Grupo': 'Líder de Grupo',
        'Gestor de Projetos': 'Gestor de Projetos',
        'Social Media': 'Social Media',
        Construtor: 'Construtor',
      };
      const user_roles = (groupData.members || []).reduce((acc: any, m: any) => {
        const studentId = m.student?.id || m.id;
        if (studentId && m.role) {
          acc[studentId] = ROLE_LABEL_MAP[m.role] || m.role || 'Construtor';
        }
        return acc;
      }, {});

      const newGroup = await addGroupToProject({
        display_name: groupData.name.trim(),
        hub_project_class_id: project.id,
        users: groupData.users,
        user_roles,
      });
      setProject((p) => (p ? { ...p, groups: [newGroup, ...(p.groups || [])] } : p));
      setSavedProject((p) => (p ? { ...p, groups: [newGroup, ...(p.groups || [])] } : p));
      toast.success('Grupo cadastrado com sucesso!');
    } catch (err) {
      console.error('Erro ao adicionar grupo ao projeto:', err);
      toast.error('Erro ao cadastrar grupo.');
    }
  };

  const handleConfirmPendingGroupAction = async () => {
    if (!pendingGroupAction || !project) return;
    const { group, accept } = pendingGroupAction;
    try {
      if (accept) {
        const updated = await acceptGroup(group.id);
        setProject((p) =>
          p
            ? {
                ...p,
                groups: p.groups.map((g) =>
                  g.id === group.id ? { ...g, approved_at: updated.approved_at } : g
                ),
              }
            : p
        );
        toast.success(`Grupo "${group.display_name}" aprovado!`);
      } else {
        await removeGroup(group.id);
        setProject((p) =>
          p ? { ...p, groups: p.groups.filter((g) => g.id !== group.id) } : p
        );
        toast.success(`Grupo "${group.display_name}" recusado!`);
      }
    } catch (err) {
      console.error('Erro ao gerenciar grupo pendente:', err);
      toast.error('Erro ao atualizar grupo.');
    } finally {
      setPendingGroupAction(null);
    }
  };

  // --- Photo Handlers ---
  const handlePhotosSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;
    setFiles((prev) => [...prev, ...Array.from(selected)]);
    toast.info('Foto selecionada! Lembre-se de clicar em "Salvar" no topo da página.');
  };

  const handleRemoveLocalFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveSavedAttachment = (pathToRemove: string) => {
    if (!project) return;
    setProject({
      ...project,
      metadata: {
        ...project.metadata,
        attachments: (project.metadata?.attachments || []).filter((p) => p !== pathToRemove),
      },
    });
  };

  // --- Activities & Cashback Handlers ---
  const toggleStage = (parent: string) => {
    setExpandedStages((prev) =>
      prev.includes(parent) ? prev.filter((p) => p !== parent) : [...prev, parent]
    );
  };

  const toggleTargetReward = (step: IHubProjectStep) => {
    setTargetRewards((prev) => {
      const exists = prev.some((s) => s.title === step.title && s.parent === step.parent);
      if (exists) {
        return prev.filter((s) => !(s.title === step.title && s.parent === step.parent));
      }
      return [...prev, step];
    });
  };

  const handleOpenConcludeActivities = () => {
    if (targetRewards.length === 0) return;
    setMissingStudents([]);
    setTaxedStudents({});
    setActivityModalStep('missing_students');
  };

  const handleConfirmFinishActivities = async () => {
    if (!project || targetRewards.length === 0) return;
    const students = project.hub_class?.students || [];
    const newRewards: Record<string, ClassProjectMetadataReward[]> = {};

    const rewards = students.reduce(
      (acc, student) => {
        acc[student.id] ||= [];
        newRewards[student.id] ||= [];

        const oldRewards = (project.metadata?.rewards || {})[student.id];
        if (oldRewards?.length) acc[student.id].push(...oldRewards);

        if (missingStudents.includes(student.id)) {
          targetRewards.forEach((reward) => {
            const missingReward: ClassProjectMetadataReward = {
              reward_value: '0',
              tax_value: '0',
              activity_title: reward.title || '',
              is_missing: true,
            };
            acc[student.id].push(missingReward);
            newRewards[student.id].push(missingReward);
          });
          return acc;
        }

        targetRewards.forEach((reward) => {
          const baseCashback = Number(reward.cashback || 0);
          const taxPercentage = Number(taxedStudents[student.id] || 0);
          const finalCashback = baseCashback * (1 - taxPercentage / 100);

          const newReward: ClassProjectMetadataReward = {
            reward_value: `${formatCoins(finalCashback)}`,
            tax_value: `${taxPercentage}`,
            activity_title: reward.title || '',
            is_missing: false,
          };
          acc[student.id].push(newReward);
          newRewards[student.id].push(newReward);
        });
        return acc;
      },
      {} as Record<string, ClassProjectMetadataReward[]>
    );

    const newFinished = [
      ...(project.metadata?.finished_activities || []),
      ...targetRewards.map((e) => `${e.parent || '-'}.${e.title}`),
    ].filter((v, i, a) => a.indexOf(v) === i);

    const updatedProject: IProject = {
      ...project,
      metadata: {
        ...project.metadata,
        rewards,
        finished_activities: newFinished,
      },
    };

    setActivityModalStep('hidden');
    setTargetRewards([]);
    await handleSave(updatedProject, newRewards);
  };

  // Edit Completed Activity
  const handleOpenEditActivity = (step: IHubProjectStep) => {
    setEditingActivity(step);
    const currentMissing: string[] = [];
    const currentTaxed: Record<string, string> = {};

    project?.hub_class?.students?.forEach((student) => {
      const studentRewards = project.metadata?.rewards?.[student.id] || [];
      const activityReward = studentRewards.find((r) => r.activity_title === step.title);
      if (activityReward?.is_missing) {
        currentMissing.push(student.id);
      }
      if (activityReward?.tax_value) {
        currentTaxed[student.id] = activityReward.tax_value;
      }
    });

    setEditingMissingStudents(currentMissing);
    setEditingTaxedStudents(currentTaxed);
    setActivityModalStep('edit_activity');
  };

  const handleConfirmEditActivity = async () => {
    if (!project || !editingActivity) return;
    const students = project.hub_class?.students || [];
    const newRewards: Record<string, ClassProjectMetadataReward[]> = {};

    const rewards = students.reduce(
      (acc, student) => {
        acc[student.id] ||= [];
        newRewards[student.id] ||= [];

        const oldRewards = (project.metadata?.rewards || {})[student.id] || [];
        const filteredOld = oldRewards.filter(
          (r) => r.activity_title !== editingActivity.title
        );
        acc[student.id].push(...filteredOld);

        if (editingMissingStudents.includes(student.id)) {
          const missingReward: ClassProjectMetadataReward = {
            reward_value: '0',
            tax_value: '0',
            activity_title: editingActivity.title || '',
            is_missing: true,
          };
          acc[student.id].push(missingReward);
          newRewards[student.id].push(missingReward);
          return acc;
        }

        const baseCashback = Number(editingActivity.cashback || 0);
        const taxPercentage = Number(editingTaxedStudents[student.id] || 0);
        const finalCashback = baseCashback * (1 - taxPercentage / 100);

        const newReward: ClassProjectMetadataReward = {
          reward_value: `${formatCoins(finalCashback)}`,
          tax_value: `${taxPercentage}`,
          activity_title: editingActivity.title || '',
          is_missing: false,
        };
        acc[student.id].push(newReward);
        newRewards[student.id].push(newReward);
        return acc;
      },
      {} as Record<string, ClassProjectMetadataReward[]>
    );

    const updatedProject: IProject = {
      ...project,
      metadata: {
        ...project.metadata,
        rewards,
      },
    };

    setActivityModalStep('hidden');
    setEditingActivity(null);
    await handleSave(updatedProject, newRewards);
  };

  const handleBack = () => {
    if (onBack) onBack();
    else if (project?.class_id) navigate(`/classes/${project.class_id}`);
    else navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">Carregando dados do projeto...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="glass-card p-12 text-center rounded-2xl border border-border bg-card space-y-4">
        <p className="text-muted-foreground font-semibold">Projeto não encontrado.</p>
        <button
          onClick={handleBack}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md hover:brightness-105"
        >
          Voltar
        </button>
      </div>
    );
  }

  // All activities parents
  const stepsList = project.project?.metadata?.steps || [];
  const parentStages = Array.from(new Set(stepsList.map((s: any) => s.parent || 'Geral')));

  // BNCC Filter
  const filteredBnccSkills = bnccSkills.filter(
    (b) =>
      b.tag.toLowerCase().includes(bnccSearch.toLowerCase()) ||
      b.title.toLowerCase().includes(bnccSearch.toLowerCase()) ||
      (b.description || '').toLowerCase().includes(bnccSearch.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 pb-12"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2.5 rounded-xl border border-border/70 bg-card hover:bg-accent text-foreground transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight line-clamp-1">
              {project.title}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {project.hub_class?.display_name || 'Turma'} • Criado em{' '}
              {project.created_at ? new Date(project.created_at).toLocaleDateString('pt-BR') : '—'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            disabled={!needSave || isSaving}
            onClick={() => handleSave()}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all ${
              needSave
                ? 'bg-primary text-primary-foreground hover:brightness-105 animate-pulse'
                : 'bg-muted text-muted-foreground/60 cursor-not-allowed border border-border/50'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Projeto</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Sobre o Projeto, Atividades, Grupos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Sobre o Projeto */}
          <div className="p-5 rounded-2xl border border-border/70 bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-foreground text-base">Sobre o Projeto</h3>
              </div>
              {isFactoryProject && (
                <span className="text-[11px] font-semibold text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                  Projeto PiCode (Bloqueado para edição de título)
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Título do Projeto</label>
                <Input
                  disabled={!canEdit || isFactoryProject}
                  value={project.title}
                  onChange={(e) => setProject({ ...project, title: e.target.value })}
                  className="rounded-xl font-semibold disabled:opacity-80 disabled:bg-muted/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Objetivo Pedagógico / Descrição</label>
                <Textarea
                  disabled={!canEdit || isFactoryProject}
                  value={project.description || ''}
                  onChange={(e) => setProject({ ...project, description: e.target.value })}
                  rows={3}
                  className="rounded-xl resize-none disabled:opacity-80 disabled:bg-muted/30"
                />
              </div>
            </div>
          </div>

          {/* Card: Materiais e Ferramentas */}
          <div className="p-5 rounded-2xl border border-border/70 bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">Materiais e Ferramentas</h3>
                  <p className="text-xs text-muted-foreground">
                    Recursos e componentes necessários para a execução deste projeto
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full">
                {(project.metadata?.tools || []).length} {(project.metadata?.tools || []).length === 1 ? 'item' : 'itens'}
              </span>
            </div>

            {canEdit && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Adicionar novo material ou ferramenta..."
                  value={newTool}
                  onChange={(e) => setNewTool(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTool();
                    }
                  }}
                  className="rounded-xl text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddTool}
                  disabled={!newTool.trim()}
                  className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:brightness-105 transition-all disabled:opacity-50 shrink-0"
                  title="Adicionar material"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {(project.metadata?.tools || []).map((tool, idx) => (
                <div
                  key={`${tool}-${idx}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/10 hover:border-border transition-colors"
                >
                  <span className="text-sm font-medium text-foreground">{tool}</span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTool(tool)}
                      className="text-muted-foreground/50 hover:text-destructive p-1 rounded-lg transition-colors"
                      title="Remover material"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {(project.metadata?.tools || []).length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-6">
                  Nenhum material cadastrado para este projeto.
                </p>
              )}
            </div>
          </div>

          {/* Card: Atividades e Fluxo de Cashback */}
          {stepsList.length > 0 && (
            <div className="p-5 rounded-2xl border border-border/70 bg-card shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-base">Atividades do Livro</h3>
                    <p className="text-xs text-muted-foreground">
                      Conclua as atividades e recompense os alunos com moedas digitais
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!canEdit || targetRewards.length === 0}
                  onClick={handleOpenConcludeActivities}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                    canEdit && targetRewards.length > 0
                      ? 'bg-amber-500 text-slate-900 hover:brightness-105'
                      : 'bg-muted text-muted-foreground/60 cursor-not-allowed border border-border/50'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  Concluir Atividades ({targetRewards.length})
                </button>
              </div>

              <div className="space-y-3 pt-1">
                {parentStages.map((parent) => {
                  const isExpanded = expandedStages.includes(parent);
                  const parentSteps = stepsList.filter((s: any) => (s.parent || 'Geral') === parent);
                  const finishedCount = parentSteps.filter((s: any) => stepIsFinished(project, s)).length;
                  const firstColor = parentSteps[0]?.color || '#10B981';

                  return (
                    <div
                      key={parent}
                      className="rounded-xl border border-border/60 bg-muted/10 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleStage(parent)}
                        className="w-full flex items-center justify-between p-3.5 hover:bg-accent/40 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-2 h-6 rounded-full"
                            style={{ backgroundColor: firstColor }}
                          />
                          <span className="font-bold text-sm text-foreground">{parent}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-muted-foreground">
                            {finishedCount}/{parentSteps.length} concluídas
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border/50 divide-y divide-border/40"
                          >
                            {parentSteps.map((step: any, idx: number) => {
                              const isFinished = stepIsFinished(project, step);
                              const isSelected = targetRewards.some(
                                (s) => s.title === step.title && s.parent === step.parent
                              );

                              return (
                                <div
                                  key={step.title + idx}
                                  onClick={() => {
                                    if (!canEdit) return;
                                    if (isFinished) {
                                      handleOpenEditActivity(step);
                                    } else {
                                      toggleTargetReward(step);
                                    }
                                  }}
                                  className={`flex items-center justify-between p-3.5 transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-primary/10'
                                      : isFinished
                                      ? 'bg-muted/20 hover:bg-accent/30'
                                      : 'hover:bg-accent/40'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0 pr-4">
                                    <div className="shrink-0">
                                      {isFinished ? (
                                        <CheckSquare className="w-5 h-5 text-emerald-500" />
                                      ) : isSelected ? (
                                        <CheckSquare className="w-5 h-5 text-primary" />
                                      ) : (
                                        <Square className="w-5 h-5 text-muted-foreground/40" />
                                      )}
                                    </div>
                                    <span
                                      className={`text-xs font-medium ${
                                        isFinished
                                          ? 'line-through text-muted-foreground/70'
                                          : 'text-foreground'
                                      }`}
                                    >
                                      {step.title}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 font-bold text-xs">
                                    <span>+{step.cashback || 0}</span>
                                    <Coins className="w-3.5 h-3.5" />
                                  </div>
                                </div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Card: Grupos do Projeto */}
          <div className="p-5 rounded-2xl border border-border/70 bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">Grupos do Projeto</h3>
                  <p className="text-xs text-muted-foreground">Equipes formadas para este projeto</p>
                </div>
              </div>

              {canEdit && (
                <button
                  type="button"
                  onClick={handleOpenCreateGroup}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:brightness-105 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Cadastrar grupo
                </button>
              )}
            </div>

            <div className="space-y-3">
              {(project.groups || []).map((group) => {
                const isPending = !group.approved_at;

                return (
                  <div
                    key={group.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      isPending
                        ? 'bg-amber-500/5 border-amber-500/30'
                        : 'bg-muted/10 border-border/60 hover:border-primary/40 cursor-pointer'
                    }`}
                    onClick={() => {
                      if (!isPending) navigate(`/groups/${group.id}`);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-foreground text-sm">
                            {group.display_name || (group as any).name}
                          </h4>
                          {isPending && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                              Pendente
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {group.students?.length || 0} membros
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {/* Avatars */}
                      <div className="flex -space-x-1.5 mr-2">
                        {(group.students || []).slice(0, 4).map((s) => (
                          <div
                            key={s.id}
                            className="w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-[9px] flex items-center justify-center ring-2 ring-card"
                            title={s.name}
                          >
                            {(s.name || 'AL').slice(0, 2).toUpperCase()}
                          </div>
                        ))}
                      </div>

                      {/* Approval buttons for pending groups */}
                      {isPending && canEdit && (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setPendingGroupAction({ group, accept: true })}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-bold text-xs hover:brightness-105"
                          >
                            Aprovar
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingGroupAction({ group, accept: false })}
                            className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground font-bold text-xs hover:brightness-105"
                          >
                            Recusar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {(project.groups || []).length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-6">
                  Nenhum grupo cadastrado neste projeto ainda.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): BNCC, Fotos, Anotações */}
        <div className="space-y-6">
          {/* Card: Habilidades BNCC */}
          <div className="p-5 rounded-2xl border border-border/70 bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-foreground text-base">Habilidades BNCC</h3>
              </div>

              {canEdit && !isFactoryProject && (
                <button
                  type="button"
                  onClick={() => setShowBnccModal(true)}
                  className="p-2 rounded-lg bg-accent/60 hover:bg-accent text-foreground transition-colors"
                  title="Editar habilidades BNCC"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {(project.metadata?.bncc || []).map((bnccTag) => {
                const skill = bnccSkills.find((b) => b.tag === bnccTag);

                return (
                  <div
                    key={bnccTag}
                    className="p-3 rounded-xl border border-border/60 bg-muted/10 space-y-1 hover:border-border transition-colors"
                  >
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                      {bnccTag}
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {skill ? `${skill.title} - ${skill.description}` : 'Habilidade BNCC'}
                    </p>
                  </div>
                );
              })}

              {(project.metadata?.bncc || []).length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-6">
                  Nenhuma habilidade BNCC selecionada.
                </p>
              )}
            </div>
          </div>

          {/* Card: Fotos do Projeto */}
          <div className="p-5 rounded-2xl border border-border/70 bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <ImagePlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-foreground text-base">Fotos do Projeto</h3>
              </div>

              {canEdit && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    onChange={handlePhotosSelected}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-lg bg-accent/60 hover:bg-accent text-foreground transition-colors"
                    title="Adicionar fotos"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {files.length > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 font-medium">
                {files.length} nova(s) foto(s) pendente(s). Lembre-se de clicar em <strong>Salvar Projeto</strong> no topo da página.
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {/* Saved photos */}
              {(project.metadata?.attachments || []).map((path, idx) => (
                <div
                  key={path}
                  onClick={() => setLightboxIdx(idx)}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-muted/40 cursor-pointer"
                >
                  <img
                    src={`https://hub-files-hml.s3.amazonaws.com/${path}`}
                    alt="Foto do projeto"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  {canEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSavedAttachment(path);
                      }}
                      className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}

              {/* Local unsaved previews */}
              {files.map((file, idx) => {
                const localUrl = URL.createObjectURL(file);
                return (
                  <div
                    key={`local-${idx}`}
                    className="group relative aspect-square rounded-xl overflow-hidden border-2 border-primary/40 bg-muted/40 cursor-pointer"
                  >
                    <img
                      src={localUrl}
                      alt={file.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveLocalFile(idx);
                      }}
                      className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              {(project.metadata?.attachments || []).length === 0 && files.length === 0 && (
                <div className="col-span-3 text-xs text-muted-foreground italic text-center py-8">
                  Nenhuma foto anexada ao projeto.
                </div>
              )}
            </div>
          </div>

          {/* Card: Anotações */}
          <div className="p-5 rounded-2xl border border-border/70 bg-card shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-foreground text-base">Anotações do Professor</h3>
            </div>

            {canEdit && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Escreva uma anotação pedagógica sobre o projeto..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={2}
                  className="rounded-xl resize-none text-xs"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={!noteText.trim() || isAddingNote}
                    onClick={handleAddAnnotation}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:brightness-105 transition-all disabled:opacity-50"
                  >
                    {isAddingNote ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Enviar</span>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {(project.annotations || []).map((ann) => (
                <div
                  key={ann.id}
                  className="p-3.5 rounded-xl border border-border/60 bg-muted/10 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-[9px] flex items-center justify-center">
                        {(ann.user?.name || 'PR').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-foreground block">
                          {ann.user?.name || 'Professor'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          @{ann.user?.username || 'educador'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {ann.created_at
                          ? new Date(ann.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setAnnotationToDelete(ann.id)}
                          className="text-muted-foreground/50 hover:text-destructive transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {ann.metadata?.message || ''}
                  </p>
                </div>
              ))}

              {(project.annotations || []).length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-6">
                  Nenhuma anotação registrada ainda.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL BNCC SKILLS */}
      <Dialog open={showBnccModal} onOpenChange={setShowBnccModal}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle>Habilidades BNCC</DialogTitle>
            <DialogDescription>
              Selecione as habilidades que o projeto desenvolve
            </DialogDescription>
          </DialogHeader>

          <div className="relative my-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código (ex: EF06CI01) ou palavras-chave..."
              value={bnccSearch}
              onChange={(e) => setBnccSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[50vh]">
            {filteredBnccSkills.map((skill) => {
              const isSelected = (project.metadata?.bncc || []).includes(skill.tag);

              return (
                <div
                  key={skill.tag}
                  onClick={() => {
                    const current = project.metadata?.bncc || [];
                    const updated = isSelected
                      ? current.filter((t) => t !== skill.tag)
                      : [...current, skill.tag];
                    setProject({
                      ...project,
                      metadata: { ...project.metadata, bncc: updated },
                    });
                  }}
                  className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-card border-border/60 hover:bg-accent/40'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {skill.tag} • {skill.subject} ({skill.grade})
                    </span>
                    <p className="text-xs text-foreground/90 leading-relaxed">
                      <strong>{skill.title}</strong> - {skill.description}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-emerald-500 text-white'
                        : 'border-2 border-muted-foreground/30'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="pt-3 border-t border-border/50">
            <button
              type="button"
              onClick={() => setShowBnccModal(false)}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md"
            >
              Confirmar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 1: Ausentes */}
      <Dialog
        open={activityModalStep === 'missing_students'}
        onOpenChange={(open) => !open && setActivityModalStep('hidden')}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alunos Ausentes</DialogTitle>
            <DialogDescription>
              Marque os alunos que faltaram. Eles não receberão cashback desta atividade.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {project.hub_class?.students?.map((student) => {
              const isMissing = missingStudents.includes(student.id);
              return (
                <div
                  key={student.id}
                  onClick={() =>
                    setMissingStudents((prev) =>
                      isMissing ? prev.filter((id) => id !== student.id) : [...prev, student.id]
                    )
                  }
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isMissing
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : 'bg-card border-border/60 hover:bg-accent/40'
                  }`}
                >
                  <span className="text-xs font-semibold text-foreground">
                    {formatShortName(student.name, true)}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                      isMissing ? 'bg-rose-500 text-white' : 'border-2 border-muted-foreground/30'
                    }`}
                  >
                    {isMissing && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setActivityModalStep('hidden')}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => setActivityModalStep('taxed_students')}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md"
            >
              Avançar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Imposto de Comportamento */}
      <Dialog
        open={activityModalStep === 'taxed_students'}
        onOpenChange={(open) => !open && setActivityModalStep('hidden')}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Imposto de Comportamento</DialogTitle>
            <DialogDescription>
              Defina o desconto (%) no cashback por mau comportamento (0 a 100%).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {project.hub_class?.students
              ?.filter((s) => !missingStudents.includes(s.id))
              .map((student) => (
                <div
                  key={student.id}
                  className="p-3 rounded-xl border border-border/60 bg-card flex items-center justify-between"
                >
                  <span className="text-xs font-semibold text-foreground">
                    {formatShortName(student.name, true)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={taxedStudents[student.id] || 0}
                      onChange={(e) =>
                        setTaxedStudents({ ...taxedStudents, [student.id]: e.target.value })
                      }
                      className="w-16 h-8 text-center text-xs font-bold rounded-lg"
                    />
                    <span className="text-xs font-bold text-muted-foreground">%</span>
                  </div>
                </div>
              ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setActivityModalStep('missing_students')}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-accent"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={() => setActivityModalStep('students_rewarded')}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md"
            >
              Avançar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Resumo Cashback */}
      <Dialog
        open={activityModalStep === 'students_rewarded'}
        onOpenChange={(open) => !open && setActivityModalStep('hidden')}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resumo Cashback</DialogTitle>
            <DialogDescription>
              Revise os valores e clique em "Concluir" para distribuir as moedas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {project.hub_class?.students
              ?.filter((s) => !missingStudents.includes(s.id))
              .map((student) => {
                const base = sumCashbacks(targetRewards);
                const tax = Number(taxedStudents[student.id] || 0);
                const finalVal = base * (1 - tax / 100);

                return (
                  <div
                    key={student.id}
                    className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        {formatShortName(student.name, true)}
                      </span>
                      {tax > 0 && (
                        <span className="text-[10px] text-muted-foreground">Desconto: {tax}%</span>
                      )}
                    </div>
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      +{formatCoins(finalVal)}
                      <Coins className="w-4 h-4" />
                    </span>
                  </div>
                );
              })}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setActivityModalStep('taxed_students')}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-accent"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={handleConfirmFinishActivities}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md hover:brightness-105"
            >
              Concluir e Salvar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: Editar Atividade Concluída */}
      <Dialog
        open={activityModalStep === 'edit_activity'}
        onOpenChange={(open) => !open && setActivityModalStep('hidden')}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar: {editingActivity?.title}</DialogTitle>
            <DialogDescription>
              Ajuste ausentes e taxas desta atividade concluída retroativamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <h4 className="text-xs font-bold text-foreground mb-2">Ausentes</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {project.hub_class?.students?.map((s) => {
                  const isMissing = editingMissingStudents.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() =>
                        setEditingMissingStudents((prev) =>
                          isMissing ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                        )
                      }
                      className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer text-xs ${
                        isMissing
                          ? 'bg-rose-500/10 border-rose-500/30 font-bold'
                          : 'bg-card border-border/50'
                      }`}
                    >
                      <span>{formatShortName(s.name, true)}</span>
                      {isMissing && <span className="text-[10px] text-rose-600">Ausente</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-foreground mb-2">Descontos (%)</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {project.hub_class?.students
                  ?.filter((s) => !editingMissingStudents.includes(s.id))
                  .map((s) => (
                    <div
                      key={s.id}
                      className="p-2.5 rounded-lg border border-border/50 bg-card flex items-center justify-between text-xs"
                    >
                      <span>{formatShortName(s.name, true)}</span>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={editingTaxedStudents[s.id] || 0}
                        onChange={(e) =>
                          setEditingTaxedStudents({
                            ...editingTaxedStudents,
                            [s.id]: e.target.value,
                          })
                        }
                        className="w-16 h-7 text-center text-xs font-bold"
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setActivityModalStep('hidden')}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmEditActivity}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md"
            >
              Salvar Alterações
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL CONFIRMAÇÃO EXCLUSÃO ANOTAÇÃO */}
      <Dialog
        open={!!annotationToDelete}
        onOpenChange={(open) => !open && setAnnotationToDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir anotação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir essa anotação pedagógica?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setAnnotationToDelete(null)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteAnnotation}
              className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground font-bold text-sm shadow-sm"
            >
              Excluir
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL CONFIRMAÇÃO APROVAR/RECUSAR GRUPO PENDENTE */}
      <Dialog
        open={!!pendingGroupAction}
        onOpenChange={(open) => !open && setPendingGroupAction(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pendingGroupAction?.accept ? 'Aprovar grupo' : 'Recusar grupo'}
            </DialogTitle>
            <DialogDescription>
              {pendingGroupAction?.accept
                ? `Deseja aprovar o grupo "${pendingGroupAction?.group.display_name}" para este projeto?`
                : `Tem certeza que deseja recusar o grupo "${pendingGroupAction?.group.display_name}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setPendingGroupAction(null)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmPendingGroupAction}
              className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${
                pendingGroupAction?.accept
                  ? 'bg-emerald-600 text-white'
                  : 'bg-destructive text-destructive-foreground'
              }`}
            >
              {pendingGroupAction?.accept ? 'Sim, aprovar' : 'Sim, recusar'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE GROUP DIALOG */}
      <CreateGroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        availableStudents={availableGroupStudents as any}
        onCreate={handleConfirmCreateGroup}
      />
    </motion.div>
  );
};

export default ProjectDetailView;
