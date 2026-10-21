import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Turma } from './turmasData';
import TurmasList from './TurmasList';
import AddTurmaDialog from './AddTurmaDialog';
import { useUser } from '@/hooks/useUser';
import { listMyClasses, listAllClasses, addClasses, removeClass } from '@/_base/services/class';
import { toast } from 'sonner';

const TurmasView = () => {
  const { user, chosenSchool, isMaster } = useUser();
  const navigate = useNavigate();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [allSchoolTurmas, setAllSchoolTurmas] = useState<Turma[]>([]);
  const [addedTurmaIds, setAddedTurmaIds] = useState<string[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  // Active school ID from unified store
  const activeSchoolId = chosenSchool?.hub_school_id || user?.chosen_school_id;

  // Load teacher classes and school classes from real API
  useEffect(() => {
    if (!activeSchoolId) return;

    let mounted = true;
    const loadClasses = async () => {
      setLoading(true);
      try {
        const [myClasses, allClasses] = await Promise.all([
          listMyClasses(activeSchoolId).catch(() => []),
          listAllClasses(activeSchoolId).catch(() => []),
        ]);

        if (mounted) {
          const mapClassToTurma = (c: any): Turma => ({
            id: c.id,
            name: c.display_name || c.name || `Turma ${c.grade || ''}`,
            code: c.code ? `#${c.code}` : undefined,
            studentCount: c.students?.length || 0,
            students: (c.students || []).map((s: any) => ({
              id: s.id,
              name: s.display_name || s.name || 'Aluno',
              username: `@${s.username || s.id}`,
              initials: (s.display_name || s.name || 'AL')
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase(),
              color: 'hsl(var(--primary))',
              groups: [],
              coins: s.metadata?.coins || 0,
            })),
            projects: (c.projects || []).map((p: any) => ({
              id: p.id,
              name: p.title || p.name,
              status: (p.status === 'in_progress' ? 'Em Execução' : p.status === 'paused' ? 'Pausado' : p.status === 'finished' ? 'Finalizado' : 'Não Iniciado') as any,
              date: p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '16/02/2026',
              teacherName: user?.name || 'Professor',
              teacherInitials: user?.initial || 'PR',
              hasCover: !!p.thumbnail,
            })),
          });

          const myClassesList = Array.isArray(myClasses) ? myClasses : ((myClasses as any)?.results || []);
          const allClassesList = Array.isArray(allClasses) ? allClasses : ((allClasses as any)?.results || []);
          const mappedMy = myClassesList.map(mapClassToTurma);
          const mappedAll = allClassesList.map(mapClassToTurma);


          setAllSchoolTurmas(mappedAll);
          setTurmas(isMaster ? mappedAll : mappedMy);
          setAddedTurmaIds(mappedMy.map((t) => t.id));
        }
      } catch (err) {
        console.warn('Erro ao carregar turmas remotas:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadClasses();
    return () => {
      mounted = false;
    };
  }, [activeSchoolId, isMaster, user?.name, user?.initial]);

  const handleSelectTurma = (turma: Turma) => {
    navigate(`/classes/${turma.id}`);
  };

  const handleToggleTurma = (id: string) => {
    setAddedTurmaIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleAll = (selectAll: boolean) => {
    setAddedTurmaIds(selectAll ? allSchoolTurmas.map((t) => t.id) : []);
  };

  const handleSaveAddClasses = async () => {
    try {
      await addClasses({
        class_ids: addedTurmaIds,
      });
      toast.success('Turmas vinculadas com sucesso!');
      // Update local teacher list
      const linked = allSchoolTurmas.filter((t) => addedTurmaIds.includes(t.id));
      setTurmas(linked);
    } catch (err) {
      console.warn('Erro ao vincular turmas na API:', err);
      toast.error('Erro ao vincular turmas');
    }
    setShowAddDialog(false);
  };

  const displayTurmas = isMaster ? (allSchoolTurmas.length > 0 ? allSchoolTurmas : turmas) : turmas;

  return (
    <>
      <TurmasList
        turmas={displayTurmas}
        onSelectTurma={handleSelectTurma}
        onAddTurma={() => setShowAddDialog(true)}
      />

      <AddTurmaDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        allTurmas={allSchoolTurmas}
        addedIds={addedTurmaIds}
        onToggle={handleToggleTurma}
        onToggleAll={handleToggleAll}
      />
    </>
  );
};

export default TurmasView;
