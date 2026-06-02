import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Turma, Project } from './turmasData';
import ProjectsTab from './ProjectsTab';
import StudentsTab from './StudentsTab';
import AttendanceTab from './AttendanceTab';
import EvaluationsTab from './EvaluationsTab';

interface Props {
  turma: Turma;
  onBack: () => void;
}

const tabs = ['Projetos', 'Alunos', 'Lista de Presença', 'Avaliações'] as const;

const TurmaDetail = ({ turma, onBack }: Props) => {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Projetos');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [studentSelected, setStudentSelected] = useState(false);

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
            <button onClick={onBack} className="p-2 rounded-xl hover:bg-accent transition-colors">
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
          onSelectProject={setSelectedProject}
        />
      )}
      {activeTab === 'Alunos' && <StudentsTab turma={turma} onSelectionChange={setStudentSelected} />}
      {activeTab === 'Lista de Presença' && <AttendanceTab turma={turma} />}
      {activeTab === 'Avaliações' && <EvaluationsTab turma={turma} />}
    </motion.div>
  );
};

export default TurmaDetail;
