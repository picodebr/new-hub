import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, ArrowUpRight, Loader2 } from 'lucide-react';
import StudentCreateGroupDialog, { GroupMember } from './StudentCreateGroupDialog';
import { useUser } from '@/hooks/useUser';
import { listStudentGroups, listTeacherGroups, createGroup } from '@/_base/services/group';
import { listAvailableProjectsForStudent } from '@/_base/services/project';
import { toast } from 'sonner';

interface StudentGroup {
  id: string;
  name: string;
  projectName: string;
  turmaName: string;
  membersCount: number;
  isPending?: boolean;
  members: { id: string; initials: string; color: string }[];
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

const StudentGroupsView = () => {
  const { user, chosenSchool, isStudent } = useUser();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  const activeSchoolId = chosenSchool?.hub_school_id || user?.chosen_school_id || '';

  const loadData = async () => {
    try {
      if (isStudent) {
        const [remoteGroups, projects] = await Promise.all([
          listStudentGroups().catch(() => []),
          listAvailableProjectsForStudent().catch(() => []),
        ]);

        setAvailableProjects(projects || []);
        const mapped: StudentGroup[] = (remoteGroups || []).map((g: any) => ({
          id: g.id,
          name: g.display_name || g.name || 'Grupo',
          projectName: g.project?.title || 'Projeto',
          turmaName: g.project?.hub_class?.display_name || g.project?.hub_class?.name || (g.project?.hub_class?.grade ? `Turma ${g.project.hub_class.grade}` : 'Turma'),
          membersCount: g.students?.length || g.student_links?.length || 0,
          isPending: !g.approved_at,
          members: (g.students || []).map((s: any) => ({
            id: s.id,
            initials: (s.display_name || s.name || 'AL').slice(0, 2).toUpperCase(),
            color: accentFor(s.id || '1'),
          })),
        }));
        setGroups(mapped);
      } else if (activeSchoolId) {
        const remoteGroups = await listTeacherGroups(activeSchoolId).catch(() => []);
        const mapped: StudentGroup[] = (remoteGroups || []).map((g: any) => ({
          id: g.id,
          name: g.display_name || g.name || 'Grupo',
          projectName: g.project?.title || 'Projeto',
          turmaName: g.project?.hub_class?.display_name || g.project?.hub_class?.name || (g.project?.hub_class?.grade ? `Turma ${g.project.hub_class.grade}` : 'Turma'),
          membersCount: g.students?.length || 0,
          isPending: !g.approved_at,
          members: (g.students || []).map((s: any) => ({
            id: s.id,
            initials: (s.display_name || s.name || 'AL').slice(0, 2).toUpperCase(),
            color: accentFor(s.id || '1'),
          })),
        }));
        setGroups(mapped);
      }
    } catch (err) {
      console.warn('Erro ao carregar grupos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [isStudent, activeSchoolId]);

  const ROLE_LABEL_MAP: Record<string, string> = {
    lider: 'Líder de Grupo',
    gestor: 'Gestor de Projetos',
    social: 'Social Media',
    construtor: 'Construtor',
  };

  const handleCreate = async ({ name, projectId, members }: { name: string; projectId: string; members: GroupMember[] }) => {
    try {
      const user_roles: Record<string, string> = {};
      members.forEach((m) => {
        user_roles[m.student.id] = (m.role && ROLE_LABEL_MAP[m.role]) || 'Construtor';
      });

      const created = await createGroup({
        display_name: name.trim(),
        hub_project_class_id: projectId,
        users: members.map((m) => m.student.id),
        user_roles,
      });

      toast.success(isStudent ? 'Solicitação de criação de grupo enviada para o professor' : 'Grupo criado com sucesso!');
      await loadData();
      if (created?.id) {
        navigate(`/groups/${created.id}`);
      }
    } catch (err: any) {
      console.warn('Erro ao criar grupo na API:', err);
      toast.error(err?.response?.data?.message || 'Erro ao criar grupo');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Carregando grupos...</p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Meus Grupos</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Grupos dos quais você faz parte
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:brightness-110 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Adicionar Grupo
          </button>
        </div>

        {/* Groups grid OR empty */}
        {groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 py-16 text-center px-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Você ainda não está em nenhum grupo</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Crie um grupo para um dos projetos da sua turma e convide seus colegas.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:brightness-110 transition-all"
            >
              <Plus className="w-4 h-4" />
              Adicionar Grupo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groups.map((g, i) => {
              const accent = accentFor(g.id);
              return (
                <motion.button
                  type="button"
                  key={g.id}
                  onClick={() => navigate(`/groups/${g.id}`)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.99 }}
                  className="group relative w-full overflow-hidden rounded-2xl border border-border/50 bg-card text-left transition-all duration-300 hover:border-border hover:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.18)]"
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(120% 80% at 100% 0%, ${accent}26 0%, ${accent}0d 35%, transparent 65%)`,
                    }}
                  />
                  <span
                    className="absolute left-0 bottom-5 h-12 w-[3px] rounded-r-full opacity-80 transition-all duration-300 group-hover:h-16 group-hover:opacity-100"
                    style={{ backgroundColor: accent }}
                  />

                  <div className="relative p-5">
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
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums backdrop-blur-md"
                          style={{
                            backgroundColor: `${accent}1f`,
                            color: accent,
                            border: `1px solid ${accent}33`,
                          }}
                        >
                          {g.projectName}
                        </span>
                        {g.isPending && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            Pendente de aprovação
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-base font-semibold text-foreground tracking-tight truncate mb-1">
                      {g.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground truncate">{g.turmaName}</p>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {g.membersCount} {g.membersCount === 1 ? 'Membro' : 'Membros'}
                        </span>
                        <div className="flex -space-x-1.5">
                          {g.members.slice(0, 3).map(m => (
                            <div
                              key={m.id}
                              className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white ring-2 ring-card"
                              style={{ backgroundColor: m.color }}
                            >
                              {m.initials}
                            </div>
                          ))}
                          {g.membersCount > 3 && (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[8px] font-bold text-muted-foreground ring-2 ring-card">
                              +{g.membersCount - 3}
                            </div>
                          )}
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </motion.div>

      <StudentCreateGroupDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        currentStudent={{
          id: user?.id || 'curr-student',
          name: user?.display_name || user?.name || 'Eu',
          status: 'Presente',
          avatar: user?.avatar || '',
        } as any}
        availableStudents={[]}
        availableProjects={(availableProjects || []).map((p: any) => ({
          id: p.id || 'p-1',
          name: p.title || p.name || 'Projeto',
          status: p.status || 'Em Execução',
          date: p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : 'Hoje',
          hasCover: false,
          educator: p.educator || p.user || null,
        })) as any}
        onCreate={handleCreate}
      />

    </>
  );
};

export default StudentGroupsView;
