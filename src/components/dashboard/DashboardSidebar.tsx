import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Play, Users, CodeXml, Package, BookOpen, MessageCircle, BrainCircuit, ChevronLeft, Coins, Flame,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUser } from '@/hooks/useUser';
import { useStudentAvatar } from '@/hooks/useStudentAvatar';
import { AvatarPreview } from '@/components/dashboard/student/AvatarCustomizer';

interface Props {
  open: boolean;
  onClose: () => void;
  activeNav: string;
  onNavChange: (nav: string) => void;
}

type NavItem = { icon: typeof Home; label: string; badge?: boolean };

const teacherNav: NavItem[] = [
  { icon: Home, label: 'Home' },
  { icon: Play, label: 'Cursos' },
  { icon: Users, label: 'Turmas' },
  { icon: CodeXml, label: 'Code Lab' },
  { icon: BrainCircuit, label: 'Vision Lab' },
  { icon: Package, label: 'Estoque Maker', badge: true },
  { icon: BookOpen, label: 'Biblioteca' },
  { icon: MessageCircle, label: 'Comunidade' },
];

const studentNav: NavItem[] = [
  { icon: Home, label: 'Home' },
  { icon: Play, label: 'Cursos' },
  { icon: Users, label: 'Meus Grupos' },
  { icon: CodeXml, label: 'Code Lab' },
  { icon: BrainCircuit, label: 'Vision Lab' },
  { icon: BookOpen, label: 'Biblioteca' },
];

const DashboardSidebar = ({ open, onClose, activeNav, onNavChange }: Props) => {
  const isMobile = useIsMobile();
  const { user } = useUser();
  const { avatar } = useStudentAvatar();
  const navItems = user?.role === 'student' ? studentNav : teacherNav;
  const isStudent = user?.role === 'student';

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          exit={{ x: -280 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-16 left-0 bottom-0 w-64 max-w-[85vw] z-40 glass-card !rounded-none !rounded-tr-2xl border-r border-border/50 flex flex-col shadow-2xl"
        >
          {/* User profile */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              {isStudent ? (
                <div className="w-11 h-11 rounded-full overflow-hidden bg-primary/15 ring-1 ring-border/50 flex items-center justify-center shrink-0">
                  <AvatarPreview config={avatar} />
                </div>
              ) : (
                <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                  {user?.initial ?? 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user?.name ?? 'Convidado'}</p>
                {isStudent ? (
                  <p className="text-[11px] text-muted-foreground truncate leading-tight">Escola PiCode</p>
                ) : (
                  <p className="text-xs text-muted-foreground truncate">{user?.email ?? '—'}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {isStudent && (
              <div className="mt-3 flex items-stretch rounded-xl border border-border/50 bg-card/60 overflow-hidden">
                <div className="flex-1 flex items-center gap-2 px-3 py-2">
                  <Coins className="h-4 w-4 shrink-0 text-amber-500" />
                  <div className="min-w-0 leading-tight">
                    <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Saldo</p>
                    <p className="truncate text-xs font-bold text-foreground">R$ 14.874,14</p>
                  </div>
                </div>
                <div className="w-px bg-border/60" />
                <div className="flex items-center gap-2 px-3 py-2">
                  <Flame className="h-4 w-4 shrink-0 text-rose-500" />
                  <div className="min-w-0 leading-tight">
                    <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Sequência</p>
                    <p className="truncate text-xs font-bold text-foreground">7 dias</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav data-tour="sidebar-nav" className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = activeNav === item.label;
              const tourId = item.label
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '-');
              return (
                <motion.button
                  key={item.label}
                  data-tour={`nav-${tourId}`}
                  onClick={() => onNavChange(item.label)}
                  whileHover={{ scale: 1.03, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold shadow-md'
                      : 'text-foreground font-normal hover:bg-accent'
                  }`}
                >
                  <item.icon className="flex-shrink-0" style={{ width: 18, height: 18 }} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-destructive" />
                  )}
                </motion.button>
              );
            })}
          </nav>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default DashboardSidebar;
