import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Turma } from './turmasData';
import TurmasList from './TurmasList';
import AddTurmaDialog from './AddTurmaDialog';
import { useUser } from '@/hooks/useUser';
import { listMyClasses, listAllClasses, removeClass, downloadClassForms } from '@/_base/services/class';
import { sortGradesByClass, getColorByGrade } from '@/_base/utils';
import { toast } from 'sonner';

const TurmasView = () => {
  const { user, chosenSchool, isMaster } = useUser();
  const navigate = useNavigate();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [allSchoolTurmas, setAllSchoolTurmas] = useState<Turma[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Active school ID from unified store
  const activeSchoolId = chosenSchool?.hub_school_id || user?.chosen_school_id;

  const mapClassToTurma = useCallback((c: any): Turma => {
    const rawCode = c.code ? String(c.code).replace(/^#+/, '') : undefined;
    const grade = c.grade || '';
    const color = getColorByGrade(grade);

    return {
      id: c.id,
      name: c.display_name || c.name || `Turma ${grade}`,
      code: rawCode,
      grade,
      color,
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
        groups: (s.groups || []).map((g: any) => g.display_name || g.name || 'Grupo'),
        coins: s.metadata?.coins || 0,
      })),
      projects: (c.projects || []).map((p: any) => ({
        id: p.id,
        name: p.title || p.name,
        status: (p.status === 'in_progress' ? 'Em Execução' : p.status === 'paused' ? 'Pausado' : p.status === 'finished' ? 'Finalizado' : 'Não Iniciado') as any,
        date: p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '',
        teacherName: user?.name || 'Professor',
        teacherInitials: user?.initial || 'PR',
        hasCover: !!(p.thumbnail || p.metadata?.thumbnail),
      })),
      raw: c,
    };
  }, [user?.name, user?.initial]);

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
          const myClassesList = Array.isArray(myClasses) ? myClasses : ((myClasses as any)?.results || []);
          const allClassesList = Array.isArray(allClasses) ? allClasses : ((allClasses as any)?.results || []);

          const sortedMy = sortGradesByClass(myClassesList).map(mapClassToTurma);
          const sortedAll = sortGradesByClass(allClassesList).map(mapClassToTurma);

          setAllSchoolTurmas(sortedAll);
          setTurmas(isMaster ? sortedAll : sortedMy);
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
  }, [activeSchoolId, isMaster, mapClassToTurma]);

  const handleSelectTurma = (turma: Turma) => {
    navigate(`/classes/${turma.id}?_p=${encodeURIComponent(turma.name)}`);
  };

  const handleExportAllEvaluations = async () => {
    if (!turmas.length) return;
    setIsExporting(true);
    try {
      const classIds = turmas.map((c) => c.id);
      const response = await downloadClassForms(classIds);
      if (!response) {
        toast.error('Nenhum dado retornado para exportação.');
        return;
      }

      const url = window.URL.createObjectURL(new Blob([response], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      const schoolName = chosenSchool?.display_name || user?.chosen_school?.display_name || 'Turmas';
      link.setAttribute('download', `Historico_Avaliacoes_${schoolName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Relatório gerado com sucesso!');
    } catch (err) {
      console.error('Erro ao exportar PDF via API:', err);
      toast.error('Erro ao gerar o PDF de avaliações. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRemoveTurma = async (turma: Turma) => {
    const codeToRemove = turma.code || turma.id;
    if (!codeToRemove) return;
    setIsRemoving(true);
    try {
      await removeClass(codeToRemove);
      setTurmas((prev) => prev.filter((t) => t.id !== turma.id));
      toast.success('Turma removida com sucesso!');
    } catch (err) {
      console.error('Erro ao remover turma:', err);
      toast.error('Erro ao remover turma do painel.');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleClassesAdded = (newClasses: any[]) => {
    const mapped = newClasses.map(mapClassToTurma);
    setTurmas((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const newlyAdded = mapped.filter((t) => !existingIds.has(t.id));
      return sortGradesByClass([...newlyAdded, ...prev]);
    });
  };

  const alreadyLinkedIds = useMemo(() => turmas.map((t) => t.id), [turmas]);

  return (
    <>
      <TurmasList
        turmas={turmas}
        onSelectTurma={handleSelectTurma}
        onAddTurma={() => setShowAddDialog(true)}
        onExportEvaluations={handleExportAllEvaluations}
        isExporting={isExporting}
        onRemoveTurma={handleRemoveTurma}
        isRemoving={isRemoving}
      />

      <AddTurmaDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        allTurmas={allSchoolTurmas}
        alreadyLinkedIds={alreadyLinkedIds}
        onClassesAdded={handleClassesAdded}
        schoolName={chosenSchool?.display_name}
      />
    </>
  );
};

export default TurmasView;
