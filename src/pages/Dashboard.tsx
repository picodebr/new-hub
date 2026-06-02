import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import QuickGuide from '@/components/dashboard/QuickGuide';
import WelcomeVideo from '@/components/dashboard/WelcomeVideo';
import RecentProjects from '@/components/dashboard/RecentProjects';
import AccountSettings from '@/components/dashboard/AccountSettings';
import MyCertificates from '@/components/dashboard/MyCertificates';
import CoursesView from '@/components/dashboard/courses/CoursesView';
import TurmasView from '@/components/dashboard/turmas/TurmasView';
import StudentGroupsView from '@/components/dashboard/turmas/StudentGroupsView';
import MeusCodigosView from '@/components/dashboard/meuscodigos/MeusCodigosView';
import EstoqueView from '@/components/dashboard/estoque/EstoqueView';
import BibliotecaView from '@/components/dashboard/biblioteca/BibliotecaView';
import ComunidadeView from '@/components/dashboard/comunidade/ComunidadeView';
import StudentHome from '@/components/dashboard/student/StudentHome';
import { useTheme } from '@/hooks/useTheme';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUser } from '@/hooks/useUser';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { isDark, toggle: toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const { user } = useUser();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Home');

  useEffect(() => {
    setSidebarOpen(false);
  }, [isMobile]);

  // Allow guided tour (or other features) to request opening the sidebar
  useEffect(() => {
    const open = () => setSidebarOpen(true);
    window.addEventListener('picode:open-sidebar', open);
    return () => window.removeEventListener('picode:open-sidebar', open);
  }, []);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  // Reset to Home if active nav isn't available for current role
  useEffect(() => {
    setActiveNav('Home');
  }, [user?.role]);

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
          onNavChange={(nav) => {
            setActiveNav(nav);
            if (isMobile) setSidebarOpen(false);
          }}
        />

        <main className={`flex-1 min-w-0 overflow-x-hidden transition-all duration-300 ${sidebarOpen && !isMobile ? 'xl:ml-64' : 'ml-0'}`}>
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto overflow-x-hidden">
            {activeNav === 'Cursos' ? (
              <CoursesView />
            ) : activeNav === 'Meus Grupos' ? (
              <StudentGroupsView />
            ) : activeNav === 'Turmas' ? (
              <TurmasView />
            ) : activeNav === 'Code Lab' ? (
              <MeusCodigosView />
            ) : activeNav === 'Vision Lab' ? (
              <MeusCodigosView
                title="Vision Lab"
                subtitle="Organize seus projetos de visão computacional"
                icon={BrainCircuit}
              />
            ) : activeNav === 'Estoque Maker' ? (
              <EstoqueView />
            ) : activeNav === 'Biblioteca' ? (
              <BibliotecaView />
            ) : activeNav === 'Comunidade' ? (
              <ComunidadeView />
            ) : user?.role === 'student' ? (
              <StudentHome />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4 md:space-y-6 overflow-x-hidden"
              >
                {/* Welcome + Video row */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                  <WelcomeVideo />
                  <MyCertificates />
                </div>
                {/* Projects */}
                <RecentProjects />
                {/* Guide + Settings */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                  <QuickGuide />
                  <AccountSettings isDark={isDark} onToggleTheme={toggleTheme} />
                </div>
              </motion.div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && isMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
