import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Turma, Project } from './turmasData';
import ProjectsTab from './ProjectsTab';
import StudentsTab from './StudentsTab';
import AttendanceTab from './AttendanceTab';
import EvaluationsTab from './EvaluationsTab';
import { getClassData } from '@/_base/services/class';
import { useUser } from '@/hooks/useUser';

interface Props {
  turma?: Turma;
  onBack?: () => void;
}

const tabs = ['Projetos', 'Alunos', 'Lista de Presença', 'Avaliações'] as const;

const TurmaDetail = ({ turma: initialTurma, onBack }: Props) => {
  const { classId: routeClassId } = useParams<{ classId?: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [turma, setTurma] = useState<Turma | null>(initialTurma || null);
  const [loading, setLoading] = useState(!initialTurma && !!routeClassId);
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Projetos');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [studentSelected, setStudentSelected] = useState(false);

  const targetClassId = initialTurma?.id || routeClassId;

  useEffect(() => {
    if (!targetClassId) return;

    let mounted = true;
    const loadClass = async () => {
      try {
        setLoading(true);
        const full = await getClassData(targetClassId);
        if (mounted && full) {
          const mapped: Turma = {
            id: full.id,
            name: full.display_name || (full as any).name || `Turma ${full.grade || ''}`,
            code: full.code ? `#${full.code}` : undefined,
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
              groups: [],
              coins: s.metadata?.coins || 0,
            })),
            projects: (full.projects || []).map((p: any) => ({
              id: p.id,
              name: p.title || p.name,
              status: (p.status === 'in_progress' ? 'Em Execução' : p.status === 'paused' ? 'Pausado' : p.status === 'finished' ? 'Finalizado' : 'Não Iniciado') as any,
              date: p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '16/02/2026',
              teacherName: (full as any).educator?.display_name || user?.name || 'Professor',
              teacherInitials: (full as any).educator?.display_name ? (full as any).educator.display_name[0] : (user?.initial || 'PR'),
              hasCover: !!p.thumbnail,
            })),
          };
          setTurma(mapped);
        }
      } catch (err) {
        console.warn('Erro ao carregar detalhes completos da turma:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadClass();
    return () => {
      mounted = false;
    };
  }, [targetClassId, user?.name, user?.initial]);

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
        <p className="text-sm text-muted-foreground font-medium">Carregando dados da turma...</p>
      </div>
    );
  }

  if (!turma) {
    return (
      <div className="glass-card p-12 text-center space-y-4">
        <p className="text-muted-foreground font-medium">Turma não encontrada.</p>
        <button
          onClick={handleBack}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
        >
          Voltar para Turmas
        </button>
      </div>
    );
  }

  const showHeader = !selectedProject && !studentSelected;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {showHeader && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <button onClick={handleBack} className="p-2 rounded-xl hover:bg-accent transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{turma.name}</h1>
              <p className="text-sm text-muted-foreground">
                {turma.studentCount} alunos • {turma.projects.length} projetos
                {turma.code && <span className="ml-2 text-primary font-medium">{turma.code}</span>}
              </p>
            </div>
          </div>

          {/* Tab switcher */}
          <div data-tour="turma-tabs" className="glass-card rounded-2xl p-1.5 inline-flex mb-6 gap-1">
            {tabs.map(tab => (
              <button
                key={tab}
                data-tour={`turma-tab-${tab.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')}`}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </>
      )}

      {activeTab === 'Projetos' && (
        <ProjectsTab
          turma={turma}
          selectedProject={selectedProject}
          onSelectProject={(p) => {
            if (p) navigate(`/projects/${p.id}`);
            else setSelectedProject(null);
          }}
        />
      )}
      {activeTab === 'Alunos' && <StudentsTab turma={turma} onSelectionChange={setStudentSelected} />}
      {activeTab === 'Lista de Presença' && <AttendanceTab turma={turma} />}
      {activeTab === 'Avaliações' && <EvaluationsTab turma={turma} />}
    </motion.div>
  );
};

export default TurmaDetail;
