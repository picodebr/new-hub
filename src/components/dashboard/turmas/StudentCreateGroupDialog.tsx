import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, X, ChevronDown, Search, Crown, Briefcase,
  Megaphone, Hammer, Users, AlertCircle, UserPlus, Sparkles, FolderKanban,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Student, Project } from './turmasData';
import { cn } from '@/lib/utils';

import { listAvailableUsersForGroupByProject } from '@/_base/services/group';

export type GroupRole = 'lider' | 'gestor' | 'social' | 'construtor' | null;

export interface GroupMember {
  student: Student;
  role: GroupRole;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStudent: Student;
  availableStudents?: Student[];
  availableProjects: Project[];
  onCreate: (group: { name: string; projectId: string; members: GroupMember[] }) => void;
}

export const ROLE_OPTIONS: { value: Exclude<GroupRole, null>; label: string; shortLabel: string; icon: typeof Crown; color: string; max: number }[] = [
  { value: 'lider', label: 'Líder de Grupo', shortLabel: 'Líder', icon: Crown, color: 'hsl(45 93% 47%)', max: 1 },
  { value: 'gestor', label: 'Gestor de Projetos', shortLabel: 'Gestor', icon: Briefcase, color: 'hsl(217 91% 60%)', max: 1 },
  { value: 'social', label: 'Social Media', shortLabel: 'Social', icon: Megaphone, color: 'hsl(330 81% 60%)', max: 1 },
  { value: 'construtor', label: 'Construtor', shortLabel: 'Construtor', icon: Hammer, color: 'hsl(142 71% 45%)', max: 5 },
];

const MAX_MEMBERS = 8;
const MIN_MEMBERS = 3;
const RECOMMENDED = 5;

const StudentCreateGroupDialog = ({ open, onOpenChange, currentStudent, availableStudents = [], availableProjects, onCreate }: Props) => {
  const initialMembers = (): GroupMember[] => [{ student: currentStudent, role: 'lider' }];
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>(initialMembers);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [openRoleFor, setOpenRoleFor] = useState<string | null>(null);
  const [availableStudentsList, setAvailableStudentsList] = useState<Student[]>(availableStudents);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setAvailableStudentsList([]);
      return;
    }
    let mounted = true;
    setLoadingStudents(true);
    listAvailableUsersForGroupByProject(projectId)
      .then((users) => {
        if (mounted) {
          const mapped: Student[] = (users || [])
            .filter((u) => u.id !== currentStudent.id)
            .map((u) => {
              const displayName = u.display_name || u.name || 'Colega';
              return {
                id: u.id,
                name: displayName,
                username: `@${(u.username || displayName).toLowerCase().replace(/\s+/g, '-')}`,
                initials: displayName.slice(0, 2).toUpperCase(),
                color: 'hsl(var(--primary))',
                status: 'Presente',
                avatar: u.avatar || '',
                groups: [],
                coins: Number(u.metadata?.coins || 0),
              };
            });
          setAvailableStudentsList(mapped);
        }
      })
      .catch((err) => {
        console.warn('Erro ao carregar colegas disponíveis para o grupo:', err);
        if (mounted) setAvailableStudentsList([]);
      })
      .finally(() => {
        if (mounted) setLoadingStudents(false);
      });

    return () => {
      mounted = false;
    };
  }, [projectId, currentStudent.id]);

  const reset = () => {
    setName(''); setProjectId(''); setProjectPickerOpen(false);
    setMembers(initialMembers()); setPickerOpen(false); setSearch(''); setOpenRoleFor(null);
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const selectedProject = availableProjects.find(p => p.id === projectId);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { lider: 0, gestor: 0, social: 0, construtor: 0 };
    members.forEach(m => { if (m.role) counts[m.role]++; });
    return counts;
  }, [members]);

  const filteredStudents = useMemo(() => {
    const selectedIds = new Set(members.map(m => m.student.id));
    return availableStudentsList.filter(s =>
      !selectedIds.has(s.id) &&
      s.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [availableStudentsList, members, search]);

  const canAddMore = members.length < MAX_MEMBERS;

  const addMember = (student: Student) => {
    if (!canAddMore) return;
    setMembers(prev => [...prev, { student, role: null }]);
    setSearch('');
  };

  const removeMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.student.id !== id));
    if (openRoleFor === id) setOpenRoleFor(null);
  };

  const setRole = (studentId: string, role: GroupRole) => {
    setMembers(prev => prev.map(m => m.student.id === studentId ? { ...m, role } : m));
    setOpenRoleFor(null);
  };

  const isRoleDisabled = (role: Exclude<GroupRole, null>, currentStudentId: string) => {
    const opt = ROLE_OPTIONS.find(r => r.value === role)!;
    const currentRole = members.find(m => m.student.id === currentStudentId)?.role;
    if (currentRole === role) return false;
    return roleCounts[role] >= opt.max;
  };

  const allHaveRoles = members.length > 0 && members.every(m => m.role !== null);
  const hasRequiredRoles = roleCounts.lider === 1 && roleCounts.gestor === 1 && roleCounts.social === 1;
  const hasEducator = !!selectedProject?.educator;
  const canCreate =
    name.trim().length > 0 &&
    !!projectId &&
    hasEducator &&
    members.length >= MIN_MEMBERS &&
    members.length <= MAX_MEMBERS &&
    roleCounts.construtor <= 5 &&
    hasRequiredRoles &&
    allHaveRoles;

  const progressPct = Math.min((members.length / RECOMMENDED) * 100, 100);
  const counterColor =
    members.length === 0 ? 'bg-muted text-muted-foreground' :
    members.length < MIN_MEMBERS ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
    members.length === MAX_MEMBERS ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
    'bg-primary/10 text-primary';

  const handleCreate = () => {
    if (!canCreate) return;
    onCreate({ name: name.trim(), projectId, members });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-full max-w-lg p-0 overflow-hidden bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl sm:rounded-3xl shadow-2xl gap-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 sm:px-6 pt-5 pb-4 border-b border-border/40">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20 flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-foreground truncate">Cadastrar Grupo</h2>
            <p className="text-[11px] text-muted-foreground truncate">Monte a equipe e atribua os cargos</p>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 space-y-5 max-h-[65vh] sm:max-h-[70vh] overflow-y-auto">
          {/* Group name */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-primary" />
              Nome do grupo
            </label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Equipe Inovação"
              className="h-11 rounded-xl bg-accent/30 border-border/60 hover:border-primary/50 focus-visible:border-primary/50 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
              maxLength={50}
            />
          </div>

          {/* Project picker */}
          <div className="space-y-2 relative">
            <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
              <FolderKanban className="w-3 h-3 text-primary" />
              Projeto vinculado
            </label>
            <button
              type="button"
              onClick={() => setProjectPickerOpen(p => !p)}
              className="w-full flex items-center justify-between gap-2 h-11 px-3.5 rounded-xl border bg-accent/30 border-border/60 hover:border-primary/50 hover:bg-accent/50 text-sm transition-all"
            >
              <span className={cn('truncate', selectedProject ? 'text-foreground' : 'text-foreground/60')}>
                {selectedProject ? selectedProject.name : 'Selecione o projeto'}
              </span>
              <ChevronDown className={cn('w-4 h-4 transition-transform flex-shrink-0', projectPickerOpen && 'rotate-180')} />
            </button>

            <AnimatePresence initial={false}>
              {projectPickerOpen && (
                <motion.div
                  key="proj-picker"
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="bg-popover/80 backdrop-blur-xl border border-border/60 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto p-1">
                    {availableProjects.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6">
                        <FolderKanban className="w-5 h-5 text-muted-foreground/50 mb-1.5" />
                        <p className="text-xs text-muted-foreground">Nenhum projeto disponível</p>
                      </div>
                    ) : availableProjects.map(p => {
                      const selected = projectId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => { setProjectId(p.id); setProjectPickerOpen(false); }}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-left',
                            selected ? 'bg-primary/10 text-primary' : 'hover:bg-accent text-foreground'
                          )}
                        >
                          <div className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                            selected ? 'bg-primary/20' : 'bg-accent'
                          )}>
                            <FolderKanban className={cn('w-3.5 h-3.5', selected ? 'text-primary' : 'text-muted-foreground')} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{p.status} · {p.date}</p>
                          </div>
                          {selected && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Professor Responsável display or warning */}
          {selectedProject && (
            selectedProject.educator ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 border border-border/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  {(selectedProject.educator.name || 'PR').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Professor Responsável</p>
                  <p className="text-xs font-bold text-foreground truncate">{selectedProject.educator.name}</p>
                  {selectedProject.educator.email && (
                    <p className="text-[10px] text-muted-foreground truncate">{selectedProject.educator.email}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p>
                  Este projeto não possui um professor responsável vinculado. Não é possível cadastrar grupo.
                </p>
              </div>
            )
          )}

          {/* Member picker */}
          <div className="space-y-2 relative">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                <UserPlus className="w-3 h-3 text-primary" />
                Adicionar membros
              </label>
              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums transition-colors', counterColor)}>
                {members.length} / {MAX_MEMBERS}
              </span>
            </div>

            <button
              type="button"
              onClick={() => canAddMore && setPickerOpen(p => !p)}
              disabled={!canAddMore}
              className={cn(
                'w-full flex items-center justify-between gap-2 h-11 px-3.5 rounded-xl border text-sm transition-all',
                canAddMore
                  ? 'bg-accent/30 border-border/60 hover:border-primary/50 hover:bg-accent/50 text-foreground'
                  : 'bg-muted/40 border-border/40 text-muted-foreground cursor-not-allowed'
              )}
            >
              <span className="truncate text-foreground/70">
                {canAddMore ? 'Selecione os colegas da sua turma' : `Limite de ${MAX_MEMBERS} membros atingido`}
              </span>
              <ChevronDown className={cn('w-4 h-4 transition-transform flex-shrink-0', pickerOpen && 'rotate-180')} />
            </button>

            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  members.length < MIN_MEMBERS ? 'bg-amber-500' :
                  members.length >= RECOMMENDED ? 'bg-emerald-500' : 'bg-primary'
                )}
                initial={false}
                animate={{ width: `${progressPct}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              />
            </div>

            <AnimatePresence initial={false}>
              {pickerOpen && canAddMore && (
                <motion.div
                  key="picker"
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="bg-popover/80 backdrop-blur-xl border border-border/60 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-border/40">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        <input
                          autoFocus
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          placeholder="Buscar colega..."
                          className="w-full h-9 pl-9 pr-3 rounded-lg bg-accent/40 border border-border/60 text-sm outline-none placeholder:text-muted-foreground hover:border-primary/50 focus:border-primary/50 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto p-1">
                      {filteredStudents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6">
                          <Users className="w-5 h-5 text-muted-foreground/50 mb-1.5" />
                          <p className="text-xs text-muted-foreground">Nenhum colega disponível</p>
                        </div>
                      ) : filteredStudents.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => addMember(s)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-accent transition-colors text-left group"
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: s.color }}
                          >
                            {s.initials}
                          </div>
                          <span className="text-sm text-foreground truncate flex-1">{s.name}</span>
                          <UserPlus className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Members list */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-foreground/80">
              Membros e cargos
            </h3>

            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 px-4 rounded-xl border border-dashed border-border/60 bg-accent/20">
                <Users className="w-6 h-6 text-muted-foreground/60 mb-2" />
                <p className="text-xs text-muted-foreground text-center">
                  Nenhum membro adicionado
                </p>
                <p className="text-[10px] text-muted-foreground/70 text-center mt-1">
                  Mín. {MIN_MEMBERS} · Recomendado {RECOMMENDED} · Máx. {MAX_MEMBERS}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {members.map(m => {
                    const roleOpt = ROLE_OPTIONS.find(r => r.value === m.role);
                    const RoleIcon = roleOpt?.icon;
                    const isOpen = openRoleFor === m.student.id;
                    return (
                      <motion.div
                        key={m.student.id}
                        layout
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.18 }}
                        className="rounded-xl bg-accent/40 border border-border/40 overflow-visible"
                      >
                        <div className="flex items-center gap-2 p-2 pl-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: m.student.color }}
                          >
                            {m.student.initials}
                          </div>
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <span className="text-sm font-medium text-foreground truncate">
                              {m.student.name}
                            </span>
                            {m.student.id === currentStudent.id && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/15 text-primary border border-primary/20 flex-shrink-0">
                                Você
                              </span>
                            )}
                          </div>

                          <div className="relative flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => setOpenRoleFor(isOpen ? null : m.student.id)}
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border transition-all',
                                m.role && roleOpt
                                  ? 'text-white border-transparent shadow-sm'
                                  : 'bg-background/60 border-dashed border-border/70 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                              )}
                              style={m.role && roleOpt ? { backgroundColor: roleOpt.color } : undefined}
                            >
                              {RoleIcon ? <RoleIcon className="w-2.5 h-2.5" /> : <Crown className="w-2.5 h-2.5" />}
                              <span>{roleOpt?.shortLabel ?? 'Cargo'}</span>
                              <ChevronDown className={cn('w-2.5 h-2.5 transition-transform', isOpen && 'rotate-180')} />
                            </button>

                            <AnimatePresence>
                              {isOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                                  transition={{ duration: 0.14 }}
                                  className="absolute right-0 top-full mt-1.5 z-30 w-[260px] max-w-[calc(100vw-2rem)] bg-popover/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-xl p-2"
                                >
                                  <div className="grid grid-cols-2 gap-1.5">
                                    {ROLE_OPTIONS.map(opt => {
                                      const Icon = opt.icon;
                                      const disabled = isRoleDisabled(opt.value, m.student.id);
                                      const used = roleCounts[opt.value];
                                      const selected = m.role === opt.value;
                                      return (
                                        <button
                                          key={opt.value}
                                          type="button"
                                          disabled={disabled && !selected}
                                          onClick={() => setRole(m.student.id, selected ? null : opt.value)}
                                          title={`${opt.label} (${used}/${opt.max})`}
                                          className={cn(
                                            'inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-full text-[11px] font-medium border whitespace-nowrap transition-all w-full',
                                            selected
                                              ? 'text-white border-transparent shadow-sm'
                                              : disabled
                                                ? 'bg-muted/40 border-border/40 text-muted-foreground/50 cursor-not-allowed'
                                                : 'bg-background border-border/60 text-foreground/80 hover:border-primary/50 hover:bg-accent'
                                          )}
                                          style={selected ? { backgroundColor: opt.color } : undefined}
                                        >
                                          <Icon className="w-3 h-3 flex-shrink-0" style={!selected ? { color: opt.color } : undefined} />
                                          <span>{opt.shortLabel}</span>
                                          <span className={cn(
                                            'text-[9px] tabular-nums px-1 rounded-full',
                                            selected ? 'bg-white/25' : 'bg-muted/60 text-muted-foreground'
                                          )}>
                                            {used}/{opt.max}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {m.student.id !== currentStudent.id ? (
                            <button
                              type="button"
                              onClick={() => removeMember(m.student.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                              aria-label="Remover"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <div className="w-7 h-7 flex-shrink-0" aria-hidden />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {members.length > 0 && !allHaveRoles && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  Atribua um cargo para cada membro do grupo.
                </p>
              </div>
            )}
            {members.length > 0 && members.length < MIN_MEMBERS && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Users className="w-3 h-3 flex-shrink-0" />
                Adicione pelo menos {MIN_MEMBERS - members.length} colega(s) para criar o grupo.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 sm:px-6 py-3.5 border-t border-border/40 bg-accent/20">
          <button
            type="button"
            onClick={() => handleClose(false)}
            className="h-10 px-4 sm:px-5 rounded-xl border border-border/60 bg-background text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canCreate}
            className={cn(
              'h-10 px-5 sm:px-6 rounded-xl text-sm font-semibold transition-all',
              canCreate
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            Criar grupo
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentCreateGroupDialog;
