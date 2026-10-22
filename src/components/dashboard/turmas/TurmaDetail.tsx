import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Users } from 'lucide-react';
import { Turma } from './turmasData';
import ProjectsTab from './ProjectsTab';
import StudentsTab from './StudentsTab';
import AttendanceTab from './AttendanceTab';
import EvaluationsTab from './EvaluationsTab';
import { getClassData } from '@/_base/services/class';
import { useUser } from '@/hooks/useUser';
import { getColorByGrade } from '@/_base/utils';
import { IHubClass } from '@/_base/interfaces/class';

interface Props {
  turma?: Turma;
  onBack?: () => void;
}

const tabs = ['Projetos', 'Alunos', 'Lista de Presença', 'Avaliações'] as const;

const TurmaDetail = ({ turma: initialTurma, onBack }: Props) => {
  const { classId: routeClassId } = useParams<{ classId?: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [hubClass, setHubClass] = useState<IHubClass | null>(null);
  const [turma, setTurma] = useState<Turma | null>(initialTurma || null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Projetos');

  const targetClassId = initialTurma?.id || routeClassId;

  const loadClass = useCallback(async () => {
    if (!targetClassId) return;
    try {
      setLoading(true);
      const full = await getClassData(targetClassId);
      if (full) {
        setHubClass(full);

        const cleanCode = full.code ? full.code.replace(/^#+/, '') : undefined;
        const gradeColor = getColorByGrade(full.grade);

        const mapped: Turma = {
          id: full.id,
          name: full.display_name || (full as any).name || `Turma ${full.grade || ''}`,
          code: cleanCode,
          grade: full.grade,
          color: gradeColor,
          studentCount: full.students?.length || 0,
          students: (full.students || []).map((s: any) => ({
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
            lastAccess: s.metadata?.last_access,
          })),
          projects: (full.projects || []).map((p: any) => ({
            id: p.id,
            name: p.title || p.name,
            status: (p.status === 'in_progress'
              ? 'Em Execução'
              : p.status === 'paused'
              ? 'Pausado'
              : p.status === 'finished'
              ? 'Finalizado'
              : 'Não Iniciado') as any,
            date: p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '',
            teacherName: (full as any).educator?.display_name || user?.name || 'Professor',
            teacherInitials: (full as any).educator?.display_name
              ? (full as any).educator.display_name[0]
              : user?.initial || 'PR',
            hasCover: !!(p.thumbnail || p.metadata?.thumbnail),
          })),
          raw: full,
        };

        setTurma(mapped);
      }
    } catch (err) {
      console.warn('Erro ao carregar detalhes completos da turma:', err);
    } finally {
      setLoading(false);
    }
  }, [targetClassId, user?.name, user?.initial]);

  useEffect(() => {
    loadClass();
  }, [loadClass]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/classes');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">Carregando dados da turma...</p>
      </div>
    );
  }

  if (!turma) {
    return (
      <div className="glass-card p-12 text-center rounded-2xl border border-border/60 bg-card space-y-4">
        <p className="text-muted-foreground font-semibold">Turma não encontrada.</p>
        <button
          onClick={handleBack}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md hover:brightness-105"
        >
          Voltar para Turmas
        </button>
      </div>
    );
  }

  const cleanCode = turma.code ? turma.code.replace(/^#+/, '') : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleBack}
          className="p-2.5 rounded-xl border border-border/70 bg-card hover:bg-accent text-foreground transition-colors shadow-sm"
          title="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            {turma.name}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {turma.studentCount} {turma.studentCount === 1 ? 'aluno' : 'alunos'} •{' '}
            {turma.projects.length} {turma.projects.length === 1 ? 'projeto' : 'projetos'}
            {cleanCode && (
              <span className="ml-2 font-mono font-bold text-primary">
                #{cleanCode}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div
        data-tour="turma-tabs"
        className="glass-card rounded-2xl p-1.5 inline-flex mb-6 gap-1 bg-muted/40 border border-border/50"
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            data-tour={`turma-tab-${tab
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/\s+/g, '-')}`}
            onClick={() => setActiveTab(tab)}
            className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Views */}
      {activeTab === 'Projetos' && (
        <ProjectsTab
          turma={turma}
          onReloadClass={loadClass}
        />
      )}
      {activeTab === 'Alunos' && <StudentsTab turma={turma} />}
      {activeTab === 'Lista de Presença' && <AttendanceTab turma={turma} hubClass={hubClass} />}
      {activeTab === 'Avaliações' && <EvaluationsTab turma={turma} hubClass={hubClass} onReloadClass={loadClass} />}
    </motion.div>
  );
};

export default TurmaDetail;
