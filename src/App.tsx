import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/hooks/useUser";
import { StudentAvatarProvider } from "@/hooks/useStudentAvatar";
import Index from "./pages/Index";
import Dashboard, { DashboardHome } from "./pages/Dashboard";
import CodeIdePage from "./pages/CodeIdePage";
import VisionLabPage from "./pages/VisionLabPage";
import NotFound from "./pages/NotFound";
import ExportPdfClassForms from "./pages/ExportPdfClassForms";

import TurmasView from "@/components/dashboard/turmas/TurmasView";
import TurmaDetail from "@/components/dashboard/turmas/TurmaDetail";
import ProjectDetailView from "@/components/dashboard/turmas/ProjectDetailView";
import StudentGroupsView from "@/components/dashboard/turmas/StudentGroupsView";
import GroupDetailView from "@/components/dashboard/turmas/GroupDetailView";
import StudentProfile from "@/components/dashboard/turmas/StudentProfile";
import CoursesView from "@/components/dashboard/courses/CoursesView";
import MeusCodigosView from "@/components/dashboard/meuscodigos/MeusCodigosView";
import FolderDetailView from "@/components/dashboard/meuscodigos/FolderDetailView";
import EstoqueView from "@/components/dashboard/estoque/EstoqueView";
import BibliotecaView from "@/components/dashboard/biblioteca/BibliotecaView";
import ComunidadeView from "@/components/dashboard/comunidade/ComunidadeView";
import PlannerView from "@/components/dashboard/planner/PlannerView";
import ReportsView from "@/components/dashboard/reports/ReportsView";
import ReportDetailView from "@/components/dashboard/reports/ReportDetailView";
import SupportAppointmentsView from "@/components/dashboard/support/SupportAppointmentsView";
import RankingView from "@/components/dashboard/ranking/RankingView";
import EventsView from "@/components/dashboard/events/EventsView";
import StoreView from "@/components/dashboard/store/StoreView";
import { BrainCircuit } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary fallbackTitle="Erro ao iniciar a aplicação PiCode">
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <StudentAvatarProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>

            <Routes>
              {/* Public Auth Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Index />} />
              <Route path="/signup" element={<Index />} />
              <Route path="/recover_password" element={<Index />} />

              {/* Protected Dashboard Shell with Nested SPA Routes */}
              <Route element={<Dashboard />}>
                <Route path="/dashboard" element={<DashboardHome />} />
                <Route path="/profile" element={<DashboardHome />} />

                {/* Turmas & Classes */}
                <Route path="/classes" element={<TurmasView />} />
                <Route path="/turmas" element={<TurmasView />} />
                <Route path="/classes/:classId" element={<TurmaDetail />} />
                <Route path="/turmas/:classId" element={<TurmaDetail />} />

                {/* Projetos Pedagógicos */}
                <Route path="/projects/:projectId" element={<ProjectDetailView />} />

                {/* Grupos de Alunos */}
                <Route path="/groups" element={<StudentGroupsView />} />
                <Route path="/groups/:groupId" element={<GroupDetailView />} />

                {/* Perfil de Aluno */}
                <Route path="/students/:studentId" element={<StudentProfile />} />

                {/* Cursos, Módulos e Aulas */}
                <Route path="/courses" element={<CoursesView />} />
                <Route path="/courses/:courseId" element={<CoursesView />} />
                <Route path="/courses/:courseId/:moduleId" element={<CoursesView />} />
                <Route path="/courses/:courseId/:moduleId/:lessonId" element={<CoursesView />} />

                {/* Code Lab */}
                <Route path="/code" element={<MeusCodigosView />} />
                <Route path="/code/shared" element={<MeusCodigosView showSharedInitially />} />
                <Route path="/code/:folderId" element={<FolderDetailView />} />

                {/* Vision Lab */}
                <Route
                  path="/vision-lab"
                  element={
                    <MeusCodigosView
                      title="Vision Lab"
                      subtitle="Organize seus modelos de inteligência artificial"
                      icon={BrainCircuit}
                    />
                  }
                />
                <Route path="/vision-lab/:folderId" element={<FolderDetailView isVisionLab />} />

                {/* Estoque Maker */}
                <Route path="/stock" element={<EstoqueView />} />

                {/* Biblioteca */}
                <Route path="/library" element={<BibliotecaView />} />
                <Route path="/biblioteca" element={<BibliotecaView />} />

                {/* Comunidade */}
                <Route path="/community" element={<ComunidadeView />} />
                <Route path="/comunidade" element={<ComunidadeView />} />

                {/* Planejamentos */}
                <Route path="/planner" element={<PlannerView />} />

                {/* Relatórios e Chamados */}
                <Route path="/reports" element={<ReportsView />} />
                <Route path="/reports/:reportId" element={<ReportDetailView />} />

                {/* Suporte & Agendamentos */}
                <Route path="/support" element={<SupportAppointmentsView />} />
                <Route path="/appointments" element={<SupportAppointmentsView />} />

                {/* Gamificação & Eventos */}
                <Route path="/ranking" element={<RankingView />} />
                <Route path="/events" element={<EventsView />} />
                <Route path="/store" element={<StoreView />} />
                <Route path="/coinstore" element={<StoreView />} />
              </Route>

              {/* Fullscreen IDE Routes */}
              <Route path="/code/:folderId/:projectId" element={<CodeIdePage />} />
              <Route path="/vision-lab/:folderId/:projectId" element={<VisionLabPage />} />

              {/* PDF Export Route */}
              <Route path="/export-pdf/class-forms" element={<ExportPdfClassForms />} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </StudentAvatarProvider>
    </UserProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

