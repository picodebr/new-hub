import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, X, ChevronDown, Search, Crown, Briefcase,
  Megaphone, Hammer, Users, AlertCircle, UserPlus, Sparkles,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Student } from './turmasData';
import { cn } from '@/lib/utils';

export type GroupRole = 'lider' | 'gestor' | 'social' | 'construtor' | null;

export interface GroupMember {
  student: Student;
  role: GroupRole;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableStudents: any[];
  onCreate: (group: { name: string; members: GroupMember[]; users: string[] }) => void;
}

const ROLE_OPTIONS: { value: Exclude<GroupRole, null>; label: string; shortLabel: string; icon: typeof Crown; color: string; max: number }[] = [
  { value: 'lider', label: 'Líder de Grupo', shortLabel: 'Líder', icon: Crown, color: 'hsl(45 93% 47%)', max: 1 },
  { value: 'gestor', label: 'Gestor de Projetos', shortLabel: 'Gestor', icon: Briefcase, color: 'hsl(217 91% 60%)', max: 1 },
  { value: 'social', label: 'Social Media', shortLabel: 'Social', icon: Megaphone, color: 'hsl(330 81% 60%)', max: 1 },
  { value: 'construtor', label: 'Construtor', shortLabel: 'Construtor', icon: Hammer, color: 'hsl(142 71% 45%)', max: 5 },
];

const MAX_MEMBERS = 8;
const MIN_MEMBERS = 3;
const RECOMMENDED = 5;

const CreateGroupDialog = ({ open, onOpenChange, availableStudents, onCreate }: Props) => {
  const [name, setName] = useState('');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [openRoleFor, setOpenRoleFor] = useState<string | null>(null);

  const reset = () => {
    setName(''); setMembers([]); setPickerOpen(false); setSearch(''); setOpenRoleFor(null);
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { lider: 0, gestor: 0, social: 0, construtor: 0 };
    members.forEach(m => { if (m.role) counts[m.role]++; });
    return counts;
  }, [members]);

  const filteredStudents = useMemo(() => {
    const selectedIds = new Set(members.map(m => m.student.id));
    return availableStudents.filter(s =>
      !selectedIds.has(s.id) &&
      s.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [availableStudents, members, search]);

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
  const hasRequiredRoles =
    roleCounts.lider === 1 && roleCounts.gestor === 1 && roleCounts.social === 1 && roleCounts.construtor <= 5;
  const canCreate =
    name.trim().length > 0 &&
    members.length >= MIN_MEMBERS &&
    members.length <= MAX_MEMBERS &&
    allHaveRoles &&
    hasRequiredRoles;

  const progressPct = Math.min((members.length / RECOMMENDED) * 100, 100);
  const counterColor =
    members.length === 0 ? 'bg-muted text-muted-foreground' :
    members.length < MIN_MEMBERS ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
    members.length === MAX_MEMBERS ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
    'bg-primary/10 text-primary';

  const handleCreate = () => {
    if (!canCreate) return;
    onCreate({
      name: name.trim(),
      members,
      users: members.map(m => m.student.id),
    } as any);
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

          {/* Member picker */}
          <div className="space-y-2 relative">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                <UserPlus className="w-3 h-3 text-primary" />
                Adicionar membros
              </label>
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums transition-colors", counterColor)}>
                {members.length} / {MAX_MEMBERS}
              </span>
            </div>

            <button
              type="button"
              onClick={() => canAddMore && setPickerOpen(p => !p)}
              disabled={!canAddMore}
              className={cn(
                "w-full flex items-center justify-between gap-2 h-11 px-3.5 rounded-xl border text-sm transition-all",
                canAddMore
                  ? "bg-accent/30 border-border/60 hover:border-primary/50 hover:bg-accent/50 text-foreground"
                  : "bg-muted/40 border-border/40 text-muted-foreground cursor-not-allowed"
              )}
            >
              <span className="truncate text-foreground/70">
                {canAddMore ? 'Selecione os membros do grupo' : `Limite de ${MAX_MEMBERS} membros atingido`}
              </span>
              <ChevronDown className={cn("w-4 h-4 transition-transform flex-shrink-0", pickerOpen && "rotate-180")} />
            </button>

            {/* Progress bar */}
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  members.length < MIN_MEMBERS ? "bg-amber-500" :
                  members.length >= RECOMMENDED ? "bg-emerald-500" : "bg-primary"
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
                          placeholder="Buscar aluno..."
                          className="w-full h-9 pl-9 pr-3 rounded-lg bg-accent/40 border border-border/60 text-sm outline-none placeholder:text-muted-foreground hover:border-primary/50 focus:border-primary/50 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto p-1">
                      {filteredStudents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6">
                          <Users className="w-5 h-5 text-muted-foreground/50 mb-1.5" />
                          <p className="text-xs text-muted-foreground">Nenhum aluno disponível</p>
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
                          <span className="text-sm font-medium text-foreground flex-1 truncate min-w-0">
                            {m.student.name}
                          </span>

                          {/* Role tag / picker beside name */}
                          <div className="relative flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => setOpenRoleFor(isOpen ? null : m.student.id)}
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border transition-all",
                                m.role && roleOpt
                                  ? "text-white border-transparent shadow-sm"
                                  : "bg-background/60 border-dashed border-border/70 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                              )}
                              style={m.role && roleOpt ? { backgroundColor: roleOpt.color } : undefined}
                            >
                              {RoleIcon ? <RoleIcon className="w-2.5 h-2.5" /> : <Crown className="w-2.5 h-2.5" />}
                              <span>{roleOpt?.shortLabel ?? 'Cargo'}</span>
                              <ChevronDown className={cn("w-2.5 h-2.5 transition-transform", isOpen && "rotate-180")} />
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
                                            "inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-full text-[11px] font-medium border whitespace-nowrap transition-all w-full",
                                            selected
                                              ? "text-white border-transparent shadow-sm"
                                              : disabled
                                                ? "bg-muted/40 border-border/40 text-muted-foreground/50 cursor-not-allowed"
                                                : "bg-background border-border/60 text-foreground/80 hover:border-primary/50 hover:bg-accent"
                                          )}
                                          style={selected ? { backgroundColor: opt.color } : undefined}
                                        >
                                          <Icon className="w-3 h-3 flex-shrink-0" style={!selected ? { color: opt.color } : undefined} />
                                          <span>{opt.shortLabel}</span>
                                          <span className={cn(
                                            "text-[9px] tabular-nums px-1 rounded-full",
                                            selected ? "bg-white/25" : "bg-muted/60 text-muted-foreground"
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

                          <button
                            type="button"
                            onClick={() => removeMember(m.student.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                            aria-label="Remover"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* Validation hints */}
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
                Adicione pelo menos {MIN_MEMBERS - members.length} membro(s) para criar o grupo.
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
              "h-10 px-5 sm:px-6 rounded-xl text-sm font-semibold transition-all",
              canCreate
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            Criar grupo
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;
