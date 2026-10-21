import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Rocket, School as SchoolIcon } from 'lucide-react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import QuickGuide from '@/components/dashboard/QuickGuide';
import WelcomeVideo from '@/components/dashboard/WelcomeVideo';
import RecentProjects from '@/components/dashboard/RecentProjects';
import AccountSettings from '@/components/dashboard/AccountSettings';
import MyCertificates from '@/components/dashboard/MyCertificates';
import StudentHome from '@/components/dashboard/student/StudentHome';
import { useTheme } from '@/hooks/useTheme';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUser } from '@/hooks/useUser';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';


export const DashboardHome = () => {
  const { user } = useUser();
  const { isDark, toggle: toggleTheme } = useTheme();

  if (user?.role === 'student') {
    return <StudentHome />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4 md:space-y-6 overflow-x-hidden"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <WelcomeVideo />
        <MyCertificates />
      </div>
      <RecentProjects />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <QuickGuide />
        <AccountSettings isDark={isDark} onToggleTheme={toggleTheme} />
      </div>
    </motion.div>
  );
};

interface DashboardProps {
  initialNav?: string;
}

const Dashboard: React.FC<DashboardProps> = () => {
  const { isDark, toggle: toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const { user, isLoadingSession, chosenSchool, isTeacher, isMaster } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Synchronize route with activeNav
  const activeNav = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/courses')) return 'Cursos';
    if (path.includes('/classes') || path.includes('/turmas') || path.includes('/projects') || path.includes('/students')) {
      return user?.role === 'student' ? 'Meus Grupos' : 'Turmas';
    }
    if (path.includes('/groups')) return user?.role === 'student' ? 'Meus Grupos' : 'Turmas';
    if (path.includes('/planner')) return 'Meus Planejamentos';
    if (path.includes('/code')) return 'Code Lab';
    if (path.includes('/vision-lab')) return 'Vision Lab';
    if (path.includes('/stock')) return 'Estoque Maker';
    if (path.includes('/library') || path.includes('/biblioteca')) return 'Biblioteca';
    if (path.includes('/community') || path.includes('/comunidade')) return 'Comunidade';
    if (path.includes('/reports')) return 'Relatórios';
    if (path.includes('/ranking')) return 'Ranking';
    if (path.includes('/events')) return 'Eventos';
    if (path.includes('/support') || path.includes('/appointments')) return 'Suporte';
    if (path.includes('/store') || path.includes('/coinstore')) return 'Loja';
    return 'Home';
  }, [location.pathname, user?.role]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [isMobile]);

  // Allow guided tour (or other features) to request opening the sidebar
  useEffect(() => {
    const open = () => setSidebarOpen(true);
    window.addEventListener('picode:open-sidebar', open);
    return () => window.removeEventListener('picode:open-sidebar', open);
  }, []);

  // Redirect unauthenticated users ONLY after session verification completes
  useEffect(() => {
    if (!isLoadingSession && !user) {
      navigate('/');
    }
  }, [user, isLoadingSession, navigate]);

  // Auth Guard: Block rendering children while session is validating
  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse shadow-xl shadow-primary/10">
          <Rocket className="w-8 h-8 text-primary animate-bounce" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground animate-pulse">
          Carregando plataforma PiCode...
        </p>
      </div>
    );
  }

  // Not logged in (awaiting redirect)
  if (!user) {
    return null;
  }

  // School Guard: Teacher/Master must have their active school initialized
  if ((isTeacher || isMaster) && !chosenSchool) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-xl shadow-primary/10">
          <SchoolIcon className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground">
          Carregando dados da escola ativa...
        </p>
      </div>
    );
  }

  const handleNavChange = (navLabel: string) => {
    const navRoutes: Record<string, string> = {
      'Home': '/dashboard',
      'Cursos': '/courses',
      'Turmas': '/classes',
      'Meus Grupos': '/groups',
      'Meus Planejamentos': '/planner',
      'Code Lab': '/code',
      'Vision Lab': '/vision-lab',
      'Estoque Maker': '/stock',
      'Biblioteca': '/library',
      'Comunidade': '/community',
      'Relatórios': '/reports',
      'Ranking': '/ranking',
      'Eventos': '/events',
      'Suporte': '/support',
      'Loja': '/store',
    };
    const route = navRoutes[navLabel] || '/dashboard';
    navigate(route);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300 overflow-x-hidden">
      <DashboardNavbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      <div className="flex pt-16 overflow-x-hidden">
        <DashboardSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeNav={activeNav}
          onNavChange={handleNavChange}
        />

        <main className={`flex-1 min-w-0 overflow-x-hidden transition-all duration-300 ${sidebarOpen && !isMobile ? 'xl:ml-64' : 'ml-0'}`}>
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto overflow-x-hidden">
            <ErrorBoundary fallbackTitle="Erro ao carregar esta tela">
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>

      </div>
    </div>
  );
};

export default Dashboard;
