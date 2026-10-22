import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Menu,
  Bell,
  LogOut,
  Rocket,
  ChevronDown,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  BellOff,
  Package,
  GraduationCap,
  BookOpen,
  Users,
  Sparkles,
  CheckCheck,
  Building2,
  School,
  Check,
  Network,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/hooks/useUser';
import { useSelectedSchool } from '@/hooks/useSelectedSchool';
import { listSchoolGroups } from '@/_base/services/school';
import {
  getNotifications,
  markNotificationAsRead,
  readAllNotifications,
  deleteAllNotifications,
} from '@/_base/services/notifications';
import { IHubSchoolGroup, IHubUserSchool } from '@/_base/interfaces/school';
import { IHubNotification } from '@/_base/interfaces/notification';
import { IStoreMakerSchool } from '@/_base/interfaces/storeMaker';
import { toast } from 'sonner';

interface UINotification {
  id: string;
  category: string;
  icon: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  time: string;
  read: boolean;
  raw?: IHubNotification | IStoreMakerSchool;
}

const initialMockNotifications: UINotification[] = [
  { id: '1', category: 'ESTOQUE MAKER', icon: 'warning', title: 'Item em falta no estoque', description: 'Abraçadeira de nylon preta - 0 un', time: '2 min', read: false },
  { id: '2', category: 'TURMAS', icon: 'info', title: 'Novo aluno adicionado', description: 'João Silva entrou na turma Robótica A', time: '10 min', read: false },
  { id: '3', category: 'CURSOS', icon: 'success', title: 'Módulo concluído', description: 'Você completou o módulo "Introdução ao Arduino"', time: '1h', read: false },
  { id: '4', category: 'COMUNIDADE', icon: 'info', title: 'Nova postagem', description: 'Novo projeto compartilhado na comunidade', time: '3h', read: true },
];

const iconConfig = {
  warning: { Icon: AlertTriangle, bg: 'bg-amber-500/10', color: 'text-amber-500', ring: 'ring-amber-500/20' },
  info: { Icon: Info, bg: 'bg-primary/10', color: 'text-primary', ring: 'ring-primary/20' },
  success: { Icon: CheckCircle, bg: 'bg-emerald-500/10', color: 'text-emerald-500', ring: 'ring-emerald-500/20' },
} as const;

const categoryConfig: Record<string, { Icon: typeof Package; color: string }> = {
  'ESTOQUE MAKER': { Icon: Package, color: 'text-amber-500' },
  'TURMAS': { Icon: GraduationCap, color: 'text-primary' },
  'CURSOS': { Icon: BookOpen, color: 'text-emerald-500' },
  'COMUNIDADE': { Icon: Users, color: 'text-purple-500' },
};

interface Props {
  onToggleSidebar: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

const DashboardNavbar = ({ onToggleSidebar, isDark, onToggleTheme }: Props) => {
  const navigate = useNavigate();
  const { user, logout, isMaster, isTeacher, isStudent } = useUser();
  const {
    school,
    schools,
    schoolGroups,
    selectedSchoolGroup,
    changeSchool,
    changeSchoolGroup,
    isLoadingSchool,
  } = useSelectedSchool();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<UINotification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const [openNetwork, setOpenNetwork] = useState(false);
  const [openSchool, setOpenSchool] = useState(false);
  const networkRef = useRef<HTMLDivElement>(null);
  const schoolRef = useRef<HTMLDivElement>(null);

  // Buscar notificações reais da escola ativa
  const activeSchoolId = school?.hub_school_id || user?.chosen_school_id || '';

  const fetchRealNotifications = useCallback(async () => {
    if (!activeSchoolId || activeSchoolId === 'default') return;
    try {
      const res = await getNotifications(activeSchoolId);
      const items: UINotification[] = [];

      // Notificações de estoque zerado/baixo
      if (Array.isArray(res.stocks)) {
        res.stocks.slice(0, 5).forEach((st: any, i: number) => {
          items.push({
            id: `stock-${st.id || i}`,
            category: 'ESTOQUE MAKER',
            icon: 'warning',
            title: 'Item em falta no estoque',
            description: `${st.name || st.title || st.store_maker?.name || 'Componente'} - ${st.amount ?? st.quantity ?? 0} un`,
            time: 'Hoje',
            read: false,
            raw: st,
          });
        });
      }

      // Notificações da API
      if (res.notifications && Array.isArray(res.notifications.results)) {
        res.notifications.results.forEach((n: any) => {
          const isRead = n.opened_by?.includes(user?.id || '');
          let cat = 'TURMAS';
          let ic: 'warning' | 'info' | 'success' = 'info';

          if (String(n.target_type) === 'course') {
            cat = 'CURSOS';
            ic = 'success';
          } else if (String(n.target_type) === 'post') {
            cat = 'COMUNIDADE';
            ic = 'info';
          } else if (String(n.target_type) === 'stock') {
            cat = 'ESTOQUE MAKER';
            ic = 'warning';
          }

          items.push({
            id: n.id,
            category: cat,
            icon: ic,
            title: n.message || 'Nova notificação',
            description: n.message || '',
            time: new Date(n.created_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            read: isRead,
            raw: n,
          });
        });
      }

      if (items.length > 0) {
        setNotifications(items);
      }
    } catch (err) {
      console.warn('Erro ao sincronizar notificações:', err);
    }
  }, [activeSchoolId, user?.id]);

  useEffect(() => {
    fetchRealNotifications();
  }, [fetchRealNotifications]);

  // Listener para fechar dropdowns no clique fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (networkRef.current && !networkRef.current.contains(e.target as Node)) {
        setOpenNetwork(false);
      }
      if (schoolRef.current && !schoolRef.current.contains(e.target as Node)) {
        setOpenSchool(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      if (activeSchoolId && activeSchoolId !== 'default') {
        await readAllNotifications(activeSchoolId);
      }
    } catch (err) {
      console.warn('Erro ao marcar notificações como lidas:', err);
    }
  };

  const handleNotificationClick = async (notif: UINotification) => {
    setShowNotifications(false);
    if (!notif.read) {
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
      try {
        if (!notif.id.startsWith('stock-')) {
          await markNotificationAsRead(notif.id);
        }
      } catch (err) {
        console.warn('Erro ao marcar notificação:', err);
      }
    }

    const raw: any = notif.raw || {};
    const targetType = String(raw.target_type || '').toLowerCase();
    const isStockAlert = notif.id.startsWith('stock-') || targetType === 'stock';

    if (isStockAlert) {
      navigate('/stock');
    } else if (targetType === 'course') {
      navigate(`/courses/${raw.redirect_id || ''}`);
    } else if (targetType === 'post') {
      navigate('/community');
    } else if (targetType === 'book') {
      navigate(`/library?id=${raw.redirect_id || ''}`);
    } else if (targetType === 'planner') {
      navigate(`/planner?id=${raw.redirect_id || ''}`);
    } else if (targetType === 'group') {
      navigate(`/groups/${raw.redirect_id || ''}`);
    } else if (targetType === 'project') {
      navigate(`/projects/${raw.redirect_id || ''}`);
    } else if (targetType === 'class') {
      navigate(`/classes/${raw.redirect_id || ''}`);
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
    try {
      if (activeSchoolId && activeSchoolId !== 'default') {
        await deleteAllNotifications(activeSchoolId);
      }
      toast.success('Todas as notificações foram limpas');
    } catch (err) {
      console.warn('Erro ao limpar notificações:', err);
    }
  };

  const handleSelectGroup = async (group: IHubSchoolGroup) => {
    setOpenNetwork(false);
    try {
      await changeSchoolGroup(group.id);
      toast.success(`Rede alterada para: ${group.display_name}`);
    } catch {
      toast.error('Erro ao alterar rede');
    }
  };

  const handleSelectSchool = async (s: IHubUserSchool) => {
    setOpenSchool(false);
    try {
      await changeSchool(s.hub_school_id);
      toast.success(`Escola ativa: ${s.display_name}`);
    } catch {
      toast.error('Erro ao alterar escola');
    }
  };

  // Group by category
  const grouped = notifications.reduce<Record<string, UINotification[]>>((acc, n) => {
    (acc[n.category] = acc[n.category] || []).push(n);
    return acc;
  }, {});

  const currentGroupName =
    selectedSchoolGroup?.display_name ||
    user?.school_group?.display_name ||
    schoolGroups[0]?.display_name ||
    'Instituição PiCode';

  const currentSchoolName =
    school?.display_name ||
    schools[0]?.display_name ||
    'Selecione uma escola';

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 h-16 glass-card !rounded-none border-b border-border/50"
    >
      <div className="h-full flex items-center justify-between px-4 md:px-6">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            data-tour="sidebar-toggle"
            className="p-2 rounded-xl hover:bg-accent transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Rocket className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold text-foreground tracking-tight hidden sm:block">
              PiCode Education
            </span>
          </div>
        </div>

        {/* Center - Network/School selectors (master / teacher) */}
        {isTeacher && (
          <div className="hidden md:flex items-center gap-2">
            {/* Network dropdown (exclusive for master) */}
            {isMaster && (
              <div className="relative" ref={networkRef}>
                <button
                  onClick={() => {
                    setOpenNetwork((o) => !o);
                    setOpenSchool(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm ${
                    openNetwork
                      ? 'bg-primary/10 border-primary/30 text-foreground'
                      : 'bg-accent/60 border-transparent hover:bg-accent text-foreground'
                  }`}
                >
                  <Network className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground text-xs">Rede:</span>
                  <span className="font-medium max-w-[140px] truncate">{currentGroupName}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${openNetwork ? 'rotate-180' : ''}`} />
                </button>
              <AnimatePresence>
                {openNetwork && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-0 top-12 w-72 rounded-2xl border border-border bg-popover shadow-2xl shadow-foreground/15 overflow-hidden z-50"
                  >
                    <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-border/60">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground leading-tight">Selecionar Rede</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">Mude para outra instituição</p>
                      </div>
                    </div>
                    <div className="p-1.5 max-h-72 overflow-y-auto">
                      {(schoolGroups.length > 0 ? schoolGroups : [{ id: '1', display_name: currentGroupName }]).map((grp) => {
                        const active = grp.display_name === currentGroupName;
                        return (
                          <button
                            key={grp.id}
                            onClick={() => handleSelectGroup(grp as IHubSchoolGroup)}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                              active ? 'bg-primary/10 text-foreground' : 'hover:bg-accent text-foreground/90'
                            }`}
                          >
                            <span className="flex items-center gap-2.5 min-w-0">
                              <Building2 className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                              <span className={`truncate ${active ? 'font-semibold' : 'font-medium'}`}>{grp.display_name}</span>
                            </span>
                            {active && <Check className="w-4 h-4 text-primary shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            )}

            {/* School dropdown */}
            <div className="relative" ref={schoolRef}>
              <button
                onClick={() => {
                  setOpenSchool((o) => !o);
                  setOpenNetwork(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm ${
                  openSchool
                    ? 'bg-primary/10 border-primary/30 text-foreground'
                    : 'bg-accent/60 border-transparent hover:bg-accent text-foreground'
                }`}
              >
                <School className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-medium max-w-[160px] truncate">{currentSchoolName}</span>
                {isLoadingSchool ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                ) : (
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${openSchool ? 'rotate-180' : ''}`} />
                )}
              </button>
              <AnimatePresence>
                {openSchool && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-0 top-12 w-72 rounded-2xl border border-border bg-popover shadow-2xl shadow-foreground/15 overflow-hidden z-50"
                  >
                    <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-border/60">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                        <School className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground leading-tight">Selecionar Escola</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">Em {currentGroupName}</p>
                      </div>
                    </div>
                    <div className="p-1.5 max-h-72 overflow-y-auto">
                      {(schools.length > 0 ? schools : [{ hub_school_id: 'default', display_name: currentSchoolName } as any]).map((s) => {
                        const active = s.hub_school_id === school?.hub_school_id;
                        return (
                          <button
                            key={s.hub_school_id}
                            onClick={() => handleSelectSchool(s)}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                              active ? 'bg-primary/10 text-foreground' : 'hover:bg-accent text-foreground/90'
                            }`}
                          >
                            <span className="flex items-center gap-2.5 min-w-0">
                              <School className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                              <span className={`truncate ${active ? 'font-semibold' : 'font-medium'}`}>{s.display_name}</span>
                            </span>
                            {active && <Check className="w-4 h-4 text-primary shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Right */}
        <div className="flex items-center gap-2">
          <div className="relative" ref={panelRef} data-tour="notifications">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl hover:bg-accent transition-colors"
            >
              <Bell className="w-5 h-5 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute right-0 top-12 w-[22rem] sm:w-[26rem] max-h-[75vh] rounded-3xl border border-border bg-popover shadow-2xl shadow-foreground/20 overflow-hidden flex flex-col z-50"
                >
                  {/* Decorative gradient */}
                  <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent pointer-events-none" />

                  {/* Header */}
                  <div className="relative flex items-center justify-between px-5 pt-4 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                        <Bell className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground leading-tight">Notificações</h3>
                        <p className="text-[11px] text-muted-foreground leading-tight">
                          {unreadCount > 0 ? `${unreadCount} não ${unreadCount === 1 ? 'lida' : 'lidas'}` : 'Tudo em dia'}
                        </p>
                      </div>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-primary px-2.5 py-1.5 rounded-xl hover:bg-primary/10 transition-colors"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Marcar todas
                      </button>
                    )}
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                  {/* Body */}
                  <div className="overflow-y-auto flex-1 px-2 py-2 space-y-3">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-accent/50 flex items-center justify-center mb-3">
                          <BellOff className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Nenhuma notificação</p>
                        <p className="text-xs text-muted-foreground mt-1">Você está em dia com tudo</p>
                      </div>
                    ) : (
                      Object.entries(grouped).map(([category, items]) => {
                        const cat = categoryConfig[category] || { Icon: Sparkles, color: 'text-muted-foreground' };
                        const CatIcon = cat.Icon;
                        return (
                          <div key={category} className="space-y-1">
                            <div className="flex items-center gap-2 px-3 pt-1 pb-1.5">
                              <CatIcon className={`w-3.5 h-3.5 ${cat.color}`} />
                              <span className="text-[10px] font-bold text-muted-foreground tracking-[0.12em] uppercase">
                                {category}
                              </span>
                              <div className="flex-1 h-px bg-border/40" />
                              <span className="text-[10px] font-medium text-muted-foreground/70">
                                {items.length}
                              </span>
                            </div>
                            {items.map((n, idx) => {
                              const conf = iconConfig[n.icon];
                              const NIcon = conf.Icon;
                              return (
                                <motion.div
                                  key={n.id}
                                  initial={{ opacity: 0, x: -6 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.025, duration: 0.2 }}
                                  onClick={() => handleNotificationClick(n)}
                                  className={`relative flex items-start gap-3 px-3 py-3 mx-1 rounded-2xl transition-all duration-200 group cursor-pointer ${
                                    !n.read
                                      ? 'bg-primary/5 hover:bg-primary/10'
                                      : 'hover:bg-accent/50'
                                  }`}
                                >
                                  {!n.read && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-primary" />
                                  )}
                                  <div className={`mt-0.5 w-9 h-9 rounded-xl ${conf.bg} ring-1 ${conf.ring} flex items-center justify-center shrink-0`}>
                                    <NIcon className={`w-4 h-4 ${conf.color}`} />
                                  </div>
                                  <div className="flex-1 min-w-0 space-y-0.5">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-foreground' : 'font-medium text-foreground/85'}`}>
                                        {n.title}
                                      </p>
                                      <span className="text-[10px] font-medium text-muted-foreground/80 shrink-0 mt-0.5">{n.time}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{n.description}</p>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      dismissNotification(n.id);
                                    }}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-background/80 backdrop-blur-sm border border-border/40 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all"
                                    aria-label="Dispensar"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </motion.div>
                              );
                            })}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="p-2 border-t border-border/40 flex items-center justify-between">
                      <button
                        onClick={clearAllNotifications}
                        className="px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Limpar todas
                      </button>
                      <button
                        onClick={markAllRead}
                        className="px-3 py-1.5 text-xs text-primary font-medium hover:underline"
                      >
                        Marcar como lidas
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="p-2 rounded-xl hover:bg-accent transition-colors"
            title="Sair"
          >
            <LogOut className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

export default DashboardNavbar;
