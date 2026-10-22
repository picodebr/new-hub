import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Play,
  Users,
  CodeXml,
  Package,
  BookOpen,
  MessageCircle,
  BrainCircuit,
  ChevronLeft,
  Coins,
  Flame,
  CalendarRange,
  FileText,
  Trophy,
  Calendar,
  ShoppingBag,
  LifeBuoy,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUser } from '@/hooks/useUser';
import { useStudentAvatar } from '@/hooks/useStudentAvatar';
import { AvatarPreview } from '@/components/dashboard/student/AvatarCustomizer';
import { formatCoin } from '@/_base/utils';

import { useSelectedSchool } from '@/hooks/useSelectedSchool';

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
  { icon: CalendarRange, label: 'Meus Planejamentos' },
  { icon: CodeXml, label: 'Code Lab' },
  { icon: BrainCircuit, label: 'Vision Lab' },
  { icon: Package, label: 'Estoque Maker', badge: true },
  { icon: BookOpen, label: 'Biblioteca' },
  { icon: MessageCircle, label: 'Comunidade' },
  { icon: FileText, label: 'Relatórios' },
  { icon: Trophy, label: 'Ranking' },
  { icon: Calendar, label: 'Eventos' },
  { icon: LifeBuoy, label: 'Suporte' },
];

const studentNav: NavItem[] = [
  { icon: Home, label: 'Home' },
  { icon: Play, label: 'Cursos' },
  { icon: Users, label: 'Meus Grupos' },
  { icon: CodeXml, label: 'Code Lab' },
  { icon: BrainCircuit, label: 'Vision Lab' },
  { icon: BookOpen, label: 'Biblioteca' },
  { icon: ShoppingBag, label: 'Loja' },
  { icon: Trophy, label: 'Ranking' },
  { icon: Calendar, label: 'Eventos' },
  { icon: LifeBuoy, label: 'Suporte' },
];

const DashboardSidebar = ({ open, onClose, activeNav, onNavChange }: Props) => {
  const isMobile = useIsMobile();
  const { user, isMaster } = useUser();
  const { school, schools, schoolGroups, selectedSchoolGroup, changeSchool, changeSchoolGroup } = useSelectedSchool();
  const { avatar } = useStudentAvatar();
  const navItems = user?.role === 'student' ? studentNav : teacherNav;
  const isStudent = user?.role === 'student';

  const userCoins = Number(user?.metadata?.coins ?? 0);
  const userStreak =
    user?.metadata?.streak != null
      ? Number(user.metadata.streak)
      : user?.metadata?.first_access
      ? Math.max(0, Math.floor((Date.now() - new Date(user.metadata.first_access).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
  const schoolName = school?.display_name || user?.school_group?.display_name || 'Escola PiCode';

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
                <p className="text-[11px] text-muted-foreground truncate leading-tight">
                  {isStudent ? schoolName : user?.email ?? schoolName}
                </p>
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
                    <p className="truncate text-xs font-bold text-foreground">
                      {formatCoin(userCoins)}
                    </p>
                  </div>
                </div>
                <div className="w-px bg-border/60" />
                <div className="flex items-center gap-2 px-3 py-2">
                  <Flame className="h-4 w-4 shrink-0 text-rose-500" />
                  <div className="min-w-0 leading-tight">
                    <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Sequência</p>
                    <p className="truncate text-xs font-bold text-foreground">
                      {userStreak} dias
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isStudent && (
              <div className="mt-3 space-y-2 md:hidden">
                {isMaster && schoolGroups.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Rede</label>
                    <select
                      value={selectedSchoolGroup?.id || ''}
                      onChange={(e) => changeSchoolGroup(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-border/60 bg-accent/30 text-foreground"
                    >
                      {schoolGroups.map((g) => (
                        <option key={g.id} value={g.id}>{g.display_name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {schools.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Escola Ativa</label>
                    <select
                      value={school?.hub_school_id || ''}
                      onChange={(e) => changeSchool(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-border/60 bg-accent/30 text-foreground"
                    >
                      {schools.map((s) => (
                        <option key={s.hub_school_id} value={s.hub_school_id}>{s.display_name}</option>
                      ))}
                    </select>
                  </div>
                )}
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
                  whileHover={{ scale: 1.02, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold shadow-md'
                      : 'text-foreground font-normal hover:bg-accent'
                  }`}
                >
                  <item.icon className="flex-shrink-0" style={{ width: 18, height: 18 }} />
                  <span className="truncate">{item.label}</span>
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
