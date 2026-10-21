import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckSquare, Square, Coins, Package, Users as UsersIcon,
  Kanban, Plus, MoreHorizontal, Wallet, Boxes, Sparkles, GraduationCap,
  Trash2, GripVertical, Check, X, CalendarDays, Clock, AlertTriangle, CheckCircle2, ChevronRight,
  ShoppingBag, ShoppingCart, Minus, Tag, Store, ArrowRight, Info, Flame, Gift, Paperclip, Loader2, FolderKanban
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners, useDroppable
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove, verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import StudentProfile, { StudentProfileData } from './StudentProfile';
import { useParams, useNavigate } from 'react-router-dom';
import { getGroupById } from '@/_base/services/group';
import { getStockMaker } from '@/_base/services/storeMaker';

interface GroupMemberInfo {
  id: string;
  name: string;
  username: string;
  initials: string;
  color: string;
  role: string;
  balance: number;
}

interface GroupActivity {
  id: string;
  title: string;
  description: string;
  origin: 'Material Didático' | 'Professor';
  completed: boolean;
  coins: number;
  category: 'obrigatoria' | 'extra';
}

interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  assignees?: { initials: string; color: string }[];
  tag?: { label: string; color: string };
  dueDate?: string;
}

interface KanbanColumn {
  id: 'todo' | 'doing' | 'done';
  title: string;
  accent: string;
  cards: KanbanCard[];
}

interface GroupItem {
  id: string;
  name: string;
  image: string;
  quantity: number;
  unitPrice: number;
  type: 'Consumível' | 'Serviço';
}

interface GroupData {
  id: string;
  name: string;
  members: GroupMemberInfo[];
  activities: GroupActivity[];
  kanban: KanbanColumn[];
  items: GroupItem[];
}

interface Props {
  group?: { id: string; name: string; members: { initials: string; color: string }[] };
  onBack?: () => void;
  variant?: 'teacher' | 'student';
}

const TEACHER_TABS = ['Atividades', 'Planejamentos', 'Itens do grupo', 'Membros'] as const;
const STUDENT_TABS = ['Atividades', 'Planejamentos', 'Loja Online', 'Membros'] as const;
type Tab = 'Atividades' | 'Planejamentos' | 'Itens do grupo' | 'Loja Online' | 'Membros';

const tabIcon: Record<Tab, React.ElementType> = {
  'Atividades': CheckSquare,
  'Planejamentos': Kanban,
  'Itens do grupo': Package,
  'Loja Online': ShoppingBag,
  'Membros': UsersIcon,
};

const roleColors: Record<string, string> = {
  'Líder de Grupo': 'hsl(45 93% 47%)',
  'Gestor de Projetos': 'hsl(221 83% 53%)',
  'Construtor': 'hsl(142 71% 45%)',
  'Social Media': 'hsl(280 60% 55%)',
  'Membro': 'hsl(220 9% 46%)',
};

const buildMockData = (group: Props['group']): GroupData => {
  const memberRoles = ['Líder de Grupo', 'Gestor de Projetos', 'Construtor', 'Social Media', 'Membro'];
  const memberNames = ['Moises Picode', 'Aluno Teste', 'Raffaela Suffi', 'João Estudante', 'Maria Silva'];
  const members: GroupMemberInfo[] = group.members.map((m, i) => ({
    id: `m-${i}`,
    name: memberNames[i % memberNames.length],
    username: `@${memberNames[i % memberNames.length].toLowerCase().replace(/\s/g, '-')}`,
    initials: m.initials,
    color: m.color,
    role: memberRoles[i % memberRoles.length],
    balance: Math.round((50 + Math.random() * 250) * 100) / 100,
  }));

  return {
    id: group.id,
    name: group.name,
    members,
    activities: [
      { id: 'a1', title: 'Pesquisa inicial', description: 'Pesquisar sobre pitch comercial em fontes confiáveis.', origin: 'Material Didático', completed: true, coins: 5, category: 'obrigatoria' },
      { id: 'a2', title: 'Roteiro do pitch', description: 'Elaborar roteiro detalhado com no mínimo 8 slides.', origin: 'Material Didático', completed: false, coins: 10, category: 'obrigatoria' },
      { id: 'a3', title: 'Identidade visual', description: 'Definir paleta de cores e tipografia do projeto.', origin: 'Professor', completed: false, coins: 8, category: 'obrigatoria' },
      { id: 'a4', title: 'Apresentação para a turma', description: 'Apresentar o pitch final.', origin: 'Material Didático', completed: false, coins: 15, category: 'obrigatoria' },
      { id: 'e1', title: 'Vídeo institucional', description: 'Gravar um vídeo de 1 minuto sobre o projeto.', origin: 'Professor', completed: false, coins: 12, category: 'extra' },
      { id: 'e2', title: 'Logo da startup', description: 'Criar uma proposta de logo aplicável a diferentes mídias.', origin: 'Professor', completed: true, coins: 6, category: 'extra' },
    ],
    kanban: [
      {
        id: 'todo', title: 'A Fazer', accent: 'hsl(221 83% 53%)',
        cards: [
          { id: 'k1', title: 'Definir personas', description: 'Listar 3 perfis de cliente ideal', assignees: members.slice(0, 2).map(m => ({ initials: m.initials, color: m.color })), tag: { label: 'Pesquisa', color: 'hsl(221 83% 53%)' } },
          { id: 'k2', title: 'Gravar pitch', assignees: members.slice(0, 1).map(m => ({ initials: m.initials, color: m.color })), tag: { label: 'Mídia', color: 'hsl(280 60% 55%)' } },
        ],
      },
      {
        id: 'doing', title: 'Em andamento', accent: 'hsl(45 93% 47%)',
        cards: [
          { id: 'k3', title: 'Estrutura dos slides', description: 'Montar wireframe dos 8 slides', assignees: members.slice(1, 3).map(m => ({ initials: m.initials, color: m.color })), tag: { label: 'Design', color: 'hsl(280 60% 55%)' } },
        ],
      },
      {
        id: 'done', title: 'Feito', accent: 'hsl(142 71% 45%)',
        cards: [
          { id: 'k4', title: 'Pesquisa de mercado', assignees: members.slice(0, 3).map(m => ({ initials: m.initials, color: m.color })), tag: { label: 'Pesquisa', color: 'hsl(221 83% 53%)' } },
        ],
      },
    ],
    items: [
      { id: 'i1', name: 'Arduino Uno', image: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400&h=400&fit=crop', quantity: 2, unitPrice: 75.00, type: 'Consumível' },
      { id: 'i2', name: 'Sensor Ultrassônico', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop', quantity: 4, unitPrice: 12.50, type: 'Consumível' },
      { id: 'i3', name: 'Impressão 3D (hora)', image: 'https://images.unsplash.com/photo-1612886623327-f6c4ccd2e2c6?w=400&h=400&fit=crop', quantity: 3, unitPrice: 18.00, type: 'Serviço' },
      { id: 'i4', name: 'Servo Motor SG90', image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=400&h=400&fit=crop', quantity: 6, unitPrice: 9.90, type: 'Consumível' },
      { id: 'i5', name: 'Corte a Laser (peça)', image: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=400&h=400&fit=crop', quantity: 2, unitPrice: 24.00, type: 'Serviço' },
      { id: 'i6', name: 'Protoboard 830', image: 'https://images.unsplash.com/photo-1581090700227-1e37b190418e?w=400&h=400&fit=crop', quantity: 3, unitPrice: 15.00, type: 'Consumível' },
    ],
  };
};

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const GroupDetailView = ({ group: initialGroup, onBack, variant = 'teacher' }: Props) => {
  const { groupId: routeGroupId } = useParams<{ groupId?: string }>();
  const navigate = useNavigate();
  const targetGroupId = initialGroup?.id || routeGroupId;
  const [remoteGroup, setRemoteGroup] = useState<any>(null);
  const [loading, setLoading] = useState(!initialGroup && !!routeGroupId);

  useEffect(() => {
    if (!initialGroup && routeGroupId) {
      let mounted = true;
      setLoading(true);
      Promise.all([
        getGroupById(routeGroupId).catch(() => null),
        getStockMaker().catch(() => []),
      ]).then(([g, stockData]) => {
        if (mounted && g) {
          setRemoteGroup(g);
        }
      }).finally(() => {
        if (mounted) setLoading(false);
      });
      return () => { mounted = false; };
    }
  }, [initialGroup, routeGroupId]);

  const activeGroup = useMemo(() => {
    if (remoteGroup) {
      return {
        id: remoteGroup.id,
        name: remoteGroup.name || 'Grupo',
        members: (remoteGroup.students || []).map((s: any) => ({
          initials: (s.display_name || s.name || 'AL').slice(0, 2).toUpperCase(),
          color: 'hsl(var(--primary))',
        })),
      };
    }
    return initialGroup || { id: targetGroupId || '1', name: 'Grupo', members: [] };
  }, [remoteGroup, initialGroup, targetGroupId]);

  const data = useMemo(() => buildMockData(activeGroup), [activeGroup]);
  const tabs = variant === 'student' ? STUDENT_TABS : TEACHER_TABS;
  const [activeTab, setActiveTab] = useState<Tab>('Atividades');
  const [activities, setActivities] = useState<GroupActivity[]>(data.activities);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>(data.kanban);
  const [selectedMember, setSelectedMember] = useState<StudentProfileData | null>(null);
  const [peerMember, setPeerMember] = useState<GroupMemberInfo | null>(null);
  // Mock: o aluno logado é o primeiro membro do grupo
  const currentStudentId = variant === 'student' ? data.members[0]?.id : null;
  const currentStudentBalance = useMemo(
    () => data.members.find((m) => m.id === currentStudentId)?.balance ?? 0,
    [data.members, currentStudentId]
  );

  useEffect(() => {
    setActivities(data.activities);
    setKanbanColumns(data.kanban);
  }, [data.activities, data.kanban]);

  const groupBalance = useMemo(
    () => data.members.reduce((sum, m) => sum + m.balance, 0),
    [data.members]
  );
  const groupPatrimony = useMemo(
    () => data.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0),
    [data.items]
  );

  const obrigatorias = activities.filter(a => a.category === 'obrigatoria');
  const extras = activities.filter(a => a.category === 'extra');

  // Líder do grupo (responsável padrão pelas atividades adicionadas pelo professor)
  const leader = useMemo(
    () => data.members.find(m => m.role === 'Líder de Grupo') ?? data.members[0],
    [data.members]
  );

  const toggleActivity = (id: string) =>
    setActivities(prev => prev.map(a => a.id === id ? { ...a, completed: !a.completed } : a));

  const addActivity = (
    category: 'obrigatoria' | 'extra',
    title: string,
    coins: number,
    dueDate?: Date,
  ) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const baseId = Date.now();
    setActivities(prev => [
      ...prev,
      {
        id: `na-${baseId}`,
        title: trimmed,
        description: '',
        origin: 'Professor',
        completed: false,
        coins: Number.isFinite(coins) ? coins : 0,
        category,
      },
    ]);

    // Cria automaticamente um card na aba Planejamentos (coluna "A Fazer")
    // com o líder do grupo como responsável.
    const tagColor = category === 'obrigatoria' ? 'hsl(221 83% 53%)' : 'hsl(280 60% 55%)';
    const newCard: KanbanCard = {
      id: `nk-${baseId}`,
      title: trimmed,
      description: 'Atividade criada pelo professor — atribua os responsáveis.',
      assignees: leader ? [{ initials: leader.initials, color: leader.color }] : [],
      tag: { label: category === 'obrigatoria' ? 'Obrigatória' : 'Extra', color: tagColor },
      dueDate: dueDate ? dueDate.toISOString() : undefined,
    };
    setKanbanColumns(prev => prev.map(col =>
      col.id === 'todo' ? { ...col, cards: [newCard, ...col.cards] } : col
    ));
  };

  const removeActivity = (id: string) =>
    setActivities(prev => prev.filter(a => a.id !== id));

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Carregando dados do grupo...</p>
      </div>
    );
  }

  if (selectedMember) {
    navigate(`/students/${selectedMember.id}`);
    setSelectedMember(null);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1">
          <button onClick={handleBack} className="p-2 rounded-xl hover:bg-accent transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md">
              <UsersIcon className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{data.name}</h1>
              <p className="text-sm text-muted-foreground">
                {data.members.length} membros • Grupo do projeto
              </p>
            </div>
          </div>
        </div>

        {/* Saldo & Patrimônio */}
        <div className="flex items-center gap-3">
          <div className="glass-card px-4 py-2.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Saldo do grupo</p>
              <p className="text-base font-bold text-foreground leading-tight">{formatCurrency(groupBalance)}</p>
            </div>
          </div>
          <div className="glass-card px-4 py-2.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <Boxes className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Patrimônio</p>
              <p className="text-base font-bold text-foreground leading-tight">{formatCurrency(groupPatrimony)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card rounded-2xl p-1.5 inline-flex mb-6 gap-1 flex-wrap">
        {tabs.map(tab => {
          const Icon = tabIcon[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === 'Atividades' && (
            <ActivitiesTab
              obrigatorias={obrigatorias}
              extras={extras}
              onToggle={toggleActivity}
              onAdd={addActivity}
              onRemove={removeActivity}
              variant={variant}
            />
          )}
          {activeTab === 'Planejamentos' && (
            <KanbanBoard columns={kanbanColumns} setColumns={setKanbanColumns} members={data.members} />
          )}
          {activeTab === 'Itens do grupo' && (
            <ItemsGrid items={data.items} />
          )}
          {activeTab === 'Loja Online' && (
            <StudentShop groupBalance={groupBalance} items={data.items} members={data.members} />
          )}
          {activeTab === 'Membros' && (
            <MembersList
              members={data.members}
              onSelect={(m) => {
                if (variant === 'student') {
                  setPeerMember(m);
                } else {
                  setSelectedMember({
                    id: m.id,
                    name: m.name,
                    username: m.username,
                    initials: m.initials,
                    color: m.color,
                    coins: m.balance,
                    groups: [data.name],
                  });
                }
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {variant === 'student' && (
        <PeerMemberDialog
          member={peerMember}
          open={!!peerMember}
          onOpenChange={(o) => !o && setPeerMember(null)}
          isSelf={peerMember?.id === currentStudentId}
          donorBalance={currentStudentBalance}
          projectName={data.name}
        />
      )}
    </motion.div>
  );
};

/* ---------------- Atividades ---------------- */

const ActivityCard = ({
  a, onToggle, onRemove, variant = 'teacher',
}: {
  a: GroupActivity;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  variant?: 'teacher' | 'student';
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attached, setAttached] = useState<string[]>([]);
  const isStudent = variant === 'student';

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const names = Array.from(files).map(f => f.name);
    setAttached(prev => [...prev, ...names]);
    e.target.value = '';
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className={`glass-card p-4 space-y-3 transition-all group relative ${
        a.completed ? 'bg-primary/5 border-primary/30' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(a.id)}
          className="shrink-0 mt-0.5 hover:scale-110 transition-transform"
          aria-label={a.completed ? 'Marcar como pendente' : 'Marcar como concluída'}
        >
          {a.completed ? (
            <CheckSquare className="w-5 h-5 text-primary" />
          ) : (
            <Square className="w-5 h-5 text-muted-foreground/50 hover:text-primary" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <h4 className={`text-sm font-semibold ${a.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
              {a.title}
            </h4>
            {a.completed && (
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-primary/15 text-primary"
              >
                <Check className="w-2.5 h-2.5" /> Concluída
              </motion.span>
            )}
          </div>
          {a.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>
          )}
        </div>
        {!isStudent && (
          <button
            onClick={() => onRemove(a.id)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 transition-all shrink-0"
            aria-label="Remover atividade"
          >
            <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
          </button>
        )}
      </div>

      {isStudent && attached.length > 0 && (
        <div className="space-y-1">
          {attached.map((name, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-accent/30 rounded-md px-2 py-1">
              <Paperclip className="w-3 h-3 text-primary shrink-0" />
              <span className="truncate">{name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <div className="flex items-center gap-1.5">
          {a.origin === 'Material Didático' ? (
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          ) : (
            <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
          )}
          <span className="text-[11px] font-medium text-muted-foreground">{a.origin}</span>
        </div>
        <div className="flex items-center gap-2">
          {isStudent && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handlePick}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                <Paperclip className="w-3 h-3" />
                Anexar
              </button>
            </>
          )}
          <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
            {a.coins} <Coins className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AddActivityCard = ({
  category, onAdd,
}: {
  category: 'obrigatoria' | 'extra';
  onAdd: (category: 'obrigatoria' | 'extra', title: string, coins: number, dueDate?: Date) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [coins, setCoins] = useState('0');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const submit = () => {
    if (!title.trim()) return;
    onAdd(category, title, parseInt(coins, 10) || 0, dueDate);
    setTitle('');
    setCoins('0');
    setDueDate(undefined);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="aspect-square max-w-[160px] rounded-2xl flex flex-col items-center justify-center gap-1.5 border border-dashed border-border/40 bg-accent/10 hover:bg-primary/5 hover:border-primary/40 text-muted-foreground/60 hover:text-primary transition-all opacity-70 hover:opacity-100"
      >
        <Plus className="w-4 h-4" />
        <span className="text-xs font-medium">Adicionar</span>
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-4 space-y-3 border-primary/40 ring-2 ring-primary/20"
    >
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false); }}
        placeholder="Título da atividade"
        className="w-full bg-accent/40 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-accent/40 border border-border/50 rounded-lg px-2.5 py-1.5 flex-1 min-w-0">
          <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <input
            type="number"
            min={0}
            value={coins}
            onChange={e => setCoins(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground focus:outline-none"
          />
        </div>
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex items-center gap-1.5 bg-accent/40 border border-border/50 rounded-lg px-2.5 py-1.5 text-xs transition-colors hover:bg-accent/60',
                dueDate ? 'text-foreground font-medium' : 'text-muted-foreground'
              )}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              {dueDate ? format(dueDate, "dd MMM", { locale: ptBR }) : 'Prazo'}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={(d) => { setDueDate(d); setDatePickerOpen(false); }}
              initialFocus
              locale={ptBR}
              className={cn('p-3 pointer-events-auto')}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => { setOpen(false); setTitle(''); setDueDate(undefined); }}
          className="p-2 rounded-lg bg-accent text-muted-foreground hover:bg-accent/70 transition-colors"
          aria-label="Cancelar"
        >
          <X className="w-4 h-4" />
        </button>
        <button
          onClick={submit}
          className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          aria-label="Confirmar"
        >
          <Check className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

const ActivitiesTab = ({
  obrigatorias, extras, onToggle, onAdd, onRemove, variant = 'teacher',
}: {
  obrigatorias: GroupActivity[];
  extras: GroupActivity[];
  onToggle: (id: string) => void;
  onAdd: (category: 'obrigatoria' | 'extra', title: string, coins: number, dueDate?: Date) => void;
  onRemove: (id: string) => void;
  variant?: 'teacher' | 'student';
}) => {
  const isStudent = variant === 'student';
  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Atividades obrigatórias</h2>
          <span className="text-xs text-muted-foreground">
            ({obrigatorias.filter(a => a.completed).length}/{obrigatorias.length})
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {obrigatorias.map(a => (
              <ActivityCard key={a.id} a={a} onToggle={onToggle} onRemove={onRemove} variant={variant} />
            ))}
          </AnimatePresence>
          {!isStudent && <AddActivityCard category="obrigatoria" onAdd={onAdd} />}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Atividades extras</h2>
          <span className="text-xs text-muted-foreground">
            ({extras.filter(a => a.completed).length}/{extras.length})
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {extras.map(a => (
              <ActivityCard key={a.id} a={a} onToggle={onToggle} onRemove={onRemove} variant={variant} />
            ))}
          </AnimatePresence>
          {!isStudent && <AddActivityCard category="extra" onAdd={onAdd} />}
        </div>
      </section>
    </div>
  );
};

/* ---------------- Kanban (drag & drop) ---------------- */

type TaskStatus = 'done' | 'late' | 'ontrack' | 'none';

const getTaskStatus = (card: KanbanCard, columnId?: string): { kind: TaskStatus; label: string } => {
  if (columnId === 'done') return { kind: 'done', label: 'Concluída' };
  if (!card.dueDate) return { kind: 'none', label: '' };
  const due = new Date(card.dueDate);
  due.setHours(23, 59, 59, 999);
  const now = new Date();
  return now > due
    ? { kind: 'late', label: 'Atrasada' }
    : { kind: 'ontrack', label: 'Em dia' };
};

const StatusBadge = ({ status }: { status: { kind: TaskStatus; label: string } }) => {
  if (status.kind === 'none') return null;
  const styles: Record<Exclude<TaskStatus, 'none'>, { cls: string; Icon: typeof Clock }> = {
    done: { cls: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20', Icon: CheckCircle2 },
    ontrack: { cls: 'bg-primary/10 text-primary ring-primary/20', Icon: Clock },
    late: { cls: 'bg-destructive/10 text-destructive ring-destructive/20', Icon: AlertTriangle },
  };
  const s = styles[status.kind as Exclude<TaskStatus, 'none'>];
  const Icon = s.Icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ring-1 ${s.cls}`}>
      <Icon className="w-2.5 h-2.5" />
      {status.label}
    </span>
  );
};

interface SortableCardProps {
  card: KanbanCard;
  onRemove: () => void;
  onEdit?: () => void;
  isOverlay?: boolean;
  columnId?: string;
  accent?: string;
}

const KanbanCardView = ({ card, onRemove, onEdit, isOverlay, columnId, accent, dragHandleProps, style, setNodeRef, isDragging }: SortableCardProps & {
  dragHandleProps?: Record<string, unknown>;
  style?: React.CSSProperties;
  setNodeRef?: (el: HTMLElement | null) => void;
  isDragging?: boolean;
}) => {
  const status = getTaskStatus(card, columnId);
  const isDone = status.kind === 'done';
  return (
  <div
    ref={setNodeRef}
    style={style}
    {...(dragHandleProps || {})}
    onClick={(e) => {
      if (isOverlay || isDragging) return;
      e.stopPropagation();
      onEdit?.();
    }}
    className={`group relative overflow-hidden bg-card/60 border rounded-2xl p-3 pl-4 transition-all duration-300 select-none touch-none ${
      isOverlay
        ? 'border-primary shadow-2xl rotate-2 scale-105 cursor-grabbing'
        : isDragging
        ? 'border-primary/40 opacity-40 cursor-grabbing'
        : 'border-border/40 hover:border-border hover:bg-card hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 cursor-grab active:cursor-grabbing'
    }`}
  >
    {/* Accent bar */}
    <span
      className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full opacity-60 transition-all duration-300 group-hover:h-12 group-hover:opacity-100"
      style={{ backgroundColor: accent }}
    />
    <div className="flex items-start gap-2">
      <div className="flex-1 min-w-0">
        {status.kind !== 'none' && (
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <StatusBadge status={status} />
          </div>
        )}
        <p className={`text-sm font-semibold tracking-tight leading-snug ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
          {card.title}
        </p>
        {card.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1 truncate">{card.description}</p>
        )}
        <div className="flex items-center justify-between mt-2 gap-2">
          {card.assignees && card.assignees.length > 0 ? (
            <div className="flex items-center -space-x-1.5">
              {card.assignees.slice(0, 4).map((a, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white border-2 border-card"
                  style={{ backgroundColor: a.color }}
                  title={a.initials}
                >
                  {a.initials}
                </div>
              ))}
              {card.assignees.length > 4 && (
                <div className="w-5 h-5 rounded-full bg-muted text-[8px] font-bold text-muted-foreground flex items-center justify-center border-2 border-card">
                  +{card.assignees.length - 4}
                </div>
              )}
            </div>
          ) : <span />}
          {card.dueDate && (
            <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1 tabular-nums">
              <CalendarDays className="w-2.5 h-2.5" />
              {new Date(card.dueDate).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>
      {!isOverlay && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 transition-all shrink-0"
          aria-label="Remover"
        >
          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
        </button>
      )}
    </div>
  </div>
  );
};

const SortableCard = ({ card, columnId, accent, onRemove, onEdit }: { card: KanbanCard; columnId: string; accent: string; onRemove: () => void; onEdit: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', columnId, card },
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <KanbanCardView
      card={card}
      columnId={columnId}
      accent={accent}
      onRemove={onRemove}
      onEdit={onEdit}
      setNodeRef={setNodeRef}
      style={style}
      isDragging={isDragging}
      dragHandleProps={{ ...attributes, ...listeners }}
    />
  );
};

const KanbanColumnView = ({
  col, onOpenNew, onRemove, onEdit,
}: {
  col: KanbanColumn;
  onOpenNew: (colId: string) => void;
  onRemove: (colId: string, cardId: string) => void;
  onEdit: (colId: string, card: KanbanCard) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: col.id, data: { type: 'column', columnId: col.id } });
  const canCreate = col.id === 'todo';

  return (
    <div
      ref={setNodeRef}
      className={`glass-card p-3 flex flex-col min-h-[400px] transition-all ${
        isOver ? 'ring-2 ring-primary/40 bg-primary/5' : ''
      }`}
    >
      <div className="flex items-center justify-between px-2 py-1.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.accent }} />
          <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
          <span className="text-xs text-muted-foreground bg-accent/50 px-1.5 py-0.5 rounded-md">
            {col.cards.length}
          </span>
        </div>
        <button className="p-1 rounded-md hover:bg-accent transition-colors">
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        <SortableContext items={col.cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {col.cards.map(card => (
            <SortableCard
              key={card.id}
              card={card}
              columnId={col.id}
              accent={col.accent}
              onRemove={() => onRemove(col.id, card.id)}
              onEdit={() => onEdit(col.id, card)}
            />
          ))}
        </SortableContext>

        {col.cards.length === 0 && (
          <div className="border-2 border-dashed border-border/50 rounded-xl py-6 text-center text-xs text-muted-foreground/70">
            Solte um card aqui
          </div>
        )}

        {canCreate && (
          <button
            onClick={() => onOpenNew(col.id)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova tarefa
          </button>
        )}
      </div>
    </div>
  );
};

const KanbanBoard = ({ columns, setColumns, members }: { columns: KanbanColumn[]; setColumns: React.Dispatch<React.SetStateAction<KanbanColumn[]>>; members: GroupMemberInfo[] }) => {
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [activeColId, setActiveColId] = useState<string | undefined>();
  const [newTaskCol, setNewTaskCol] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ colId: string; card: KanbanCard } | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const findColumnByCardId = (cardId: string) =>
    columns.find(c => c.cards.some(card => card.id === cardId));

  const cardFromMembers = (ids: string[]) =>
    members
      .filter(m => ids.includes(m.id))
      .map(m => ({ initials: m.initials, color: m.color }));

  const handleCreateTask = (data: {
    title: string; description: string; dueDate: string; assigneeIds: string[];
  }) => {
    if (!newTaskCol) return;
    const assignees = cardFromMembers(data.assigneeIds);
    setColumns(prev => prev.map(c => c.id === newTaskCol
      ? {
          ...c,
          cards: [
            ...c.cards,
            {
              id: `k-${Date.now()}`,
              title: data.title,
              description: data.description || undefined,
              dueDate: data.dueDate,
              assignees,
            },
          ],
        }
      : c
    ));
    setNewTaskCol(null);
  };

  const handleEditTask = (data: {
    title: string; description: string; dueDate: string; assigneeIds: string[];
  }) => {
    if (!editing) return;
    const assignees = cardFromMembers(data.assigneeIds);
    setColumns(prev => prev.map(c => c.id === editing.colId
      ? {
          ...c,
          cards: c.cards.map(card => card.id === editing.card.id
            ? {
                ...card,
                title: data.title,
                description: data.description || undefined,
                dueDate: data.dueDate,
                assignees,
              }
            : card
          ),
        }
      : c
    ));
    setEditing(null);
  };

  const handleRemove = (colId: string, cardId: string) => {
    setColumns(prev => prev.map(c => c.id === colId
      ? { ...c, cards: c.cards.filter(card => card.id !== cardId) }
      : c
    ));
  };

  const handleDragStart = (e: DragStartEvent) => {
    const card = e.active.data.current?.card as KanbanCard | undefined;
    const colId = e.active.data.current?.columnId as string | undefined;
    if (card) setActiveCard(card);
    setActiveColId(colId);
  };

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const activeCol = findColumnByCardId(activeId);
    if (!activeCol) return;

    const overIsColumn = columns.some(c => c.id === overId);
    const overCol = overIsColumn ? columns.find(c => c.id === overId)! : findColumnByCardId(overId);
    if (!overCol || activeCol.id === overCol.id) return;

    setColumns(prev => {
      const next = prev.map(c => ({ ...c, cards: [...c.cards] }));
      const from = next.find(c => c.id === activeCol.id)!;
      const to = next.find(c => c.id === overCol.id)!;
      const idx = from.cards.findIndex(c => c.id === activeId);
      if (idx === -1) return prev;
      const [moved] = from.cards.splice(idx, 1);
      const overIdx = overIsColumn ? to.cards.length : to.cards.findIndex(c => c.id === overId);
      to.cards.splice(overIdx === -1 ? to.cards.length : overIdx, 0, moved);
      return next;
    });
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveCard(null);
    setActiveColId(undefined);
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const col = findColumnByCardId(activeId);
    const overCol = findColumnByCardId(overId);
    if (!col || !overCol || col.id !== overCol.id) return;

    setColumns(prev => prev.map(c => {
      if (c.id !== col.id) return c;
      const oldIdx = c.cards.findIndex(card => card.id === activeId);
      const newIdx = c.cards.findIndex(card => card.id === overId);
      if (oldIdx === -1 || newIdx === -1) return c;
      return { ...c, cards: arrayMove(c.cards, oldIdx, newIdx) };
    }));
  };

  const editingAssigneeIds = editing
    ? members
        .filter(m => editing.card.assignees?.some(a => a.initials === m.initials && a.color === m.color))
        .map(m => m.id)
    : [];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => { setActiveCard(null); setActiveColId(undefined); }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map(col => (
          <KanbanColumnView
            key={col.id}
            col={col}
            onOpenNew={setNewTaskCol}
            onRemove={handleRemove}
            onEdit={(colId, card) => setEditing({ colId, card })}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
        {activeCard ? (
          <KanbanCardView card={activeCard} columnId={activeColId} onRemove={() => {}} isOverlay />
        ) : null}
      </DragOverlay>

      <TaskDialog
        mode="create"
        open={newTaskCol !== null}
        onOpenChange={(o) => { if (!o) setNewTaskCol(null); }}
        members={members}
        onSubmit={handleCreateTask}
      />
      <TaskDialog
        mode="edit"
        open={editing !== null}
        onOpenChange={(o) => { if (!o) setEditing(null); }}
        members={members}
        initialTitle={editing?.card.title}
        initialDescription={editing?.card.description}
        initialDueDate={editing?.card.dueDate}
        initialAssigneeIds={editingAssigneeIds}
        onSubmit={handleEditTask}
      />
    </DndContext>
  );
};

/* ---------------- Task Dialog (create + edit) ---------------- */

const TaskDialog = ({
  mode, open, onOpenChange, members, onSubmit,
  initialTitle, initialDescription, initialDueDate, initialAssigneeIds,
}: {
  mode: 'create' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: GroupMemberInfo[];
  onSubmit: (data: { title: string; description: string; dueDate: string; assigneeIds: string[] }) => void;
  initialTitle?: string;
  initialDescription?: string;
  initialDueDate?: string;
  initialAssigneeIds?: string[];
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [dateOpen, setDateOpen] = useState(false);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ title?: boolean; date?: boolean; assignees?: boolean }>({});

  useEffect(() => {
    if (open) {
      setTitle(initialTitle ?? '');
      setDescription(initialDescription ?? '');
      setDueDate(initialDueDate ? new Date(initialDueDate) : undefined);
      setAssigneeIds(initialAssigneeIds ?? []);
      setErrors({});
    }
  }, [open, initialTitle, initialDescription, initialDueDate, initialAssigneeIds]);

  const toggleAssignee = (id: string) => {
    setAssigneeIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    setErrors(e => ({ ...e, assignees: false }));
  };

  const submit = () => {
    const next: typeof errors = {};
    if (!title.trim()) next.title = true;
    if (!dueDate) next.date = true;
    if (assigneeIds.length === 0) next.assignees = true;
    if (Object.keys(next).length > 0) { setErrors(next); return; }
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate!.toISOString().slice(0, 10),
      assigneeIds,
    });
  };

  const isEdit = mode === 'edit';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] p-0 overflow-hidden bg-card border-border/60">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Kanban className="w-4 h-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                {isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {isEdit ? 'Atualize as informações desta tarefa' : 'Crie uma tarefa para o planejamento do grupo'}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-foreground">Título da tarefa</label>
              <input
                autoFocus
                value={title}
                onChange={e => { setTitle(e.target.value); setErrors(er => ({ ...er, title: false })); }}
                placeholder="Ex: Desenvolver nova landing page"
                className={`w-full bg-accent/30 border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                  errors.title ? 'border-destructive ring-destructive/30' : 'border-border/50 focus:ring-primary/40 focus:border-primary/40'
                }`}
              />
              {errors.title && <p className="text-[11px] text-destructive">Informe o título da tarefa</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Data limite *</label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={`w-full h-[42px] inline-flex items-center justify-between px-3.5 rounded-xl bg-accent/30 border text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                      errors.date ? 'border-destructive ring-1 ring-destructive/30 text-destructive' : 'border-border/50 hover:border-primary/40 text-foreground'
                    }`}
                  >
                    <span className="capitalize">
                      {dueDate ? format(dueDate, "dd 'de' MMM, yyyy", { locale: ptBR }) : 'Selecionar data'}
                    </span>
                    <CalendarDays className="w-4 h-4 text-primary shrink-0 ml-2" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl border-border/60 shadow-lg" align="end">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(d) => { if (d) { setDueDate(d); setErrors(er => ({ ...er, date: false })); setDateOpen(false); } }}
                    locale={ptBR}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {errors.date && <p className="text-[11px] text-destructive">Selecione uma data limite</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Descrição detalhada</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Informe o que precisa ser feito nesta tarefa..."
              className="w-full bg-accent/30 border border-border/50 rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <UsersIcon className="w-3.5 h-3.5" /> Atribuir a *
              {assigneeIds.length > 0 && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                  {assigneeIds.length}
                </span>
              )}
            </label>
            {members.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">Nenhum membro disponível</p>
            ) : (
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1 rounded-xl ${errors.assignees ? 'ring-1 ring-destructive/40 p-1' : ''}`}>
                {members.map(m => {
                  const selected = assigneeIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleAssignee(m.id)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left ${
                        selected
                          ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/30'
                          : 'bg-accent/30 border-border/50 hover:border-primary/30 hover:bg-accent/50'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: m.color }}
                      >
                        {m.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{m.role}</p>
                      </div>
                      {selected && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {errors.assignees && <p className="text-[11px] text-destructive">Atribua a tarefa a pelo menos um membro</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/50 bg-accent/20">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            {isEdit ? 'Salvar' : 'Confirmar'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};



/* ---------------- Itens ---------------- */

const ItemsGrid = ({
  items,
  variant = 'teacher',
}: {
  items: GroupItem[];
  variant?: 'teacher' | 'student';
}) => {
  const [sellingItem, setSellingItem] = useState<GroupItem | null>(null);
  const isStudent = variant === 'student';

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item, i) => {
          const total = item.quantity * item.unitPrice;
          const isService = item.type === 'Serviço';
          const accent = isService ? 'hsl(280 70% 60%)' : 'hsl(211 100% 50%)';
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="group glass-card rounded-3xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 border border-border/50 flex flex-col"
            >
              {/* Image header */}
              <div className="p-3 pb-2 h-40">
                <div className="relative w-full h-full overflow-hidden rounded-2xl border border-border/40 bg-accent/20">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent pointer-events-none" />

                  <span
                    className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold tracking-tight backdrop-blur-md"
                    style={{
                      backgroundColor: `${accent}26`,
                      color: '#fff',
                      border: `1px solid ${accent}66`,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
                    {item.type}
                  </span>

                  <span className="absolute top-2.5 right-2.5 inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold text-foreground bg-background/85 backdrop-blur-md border border-border/40 tabular-nums">
                    {item.quantity}×
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="px-4 pb-4 pt-1 flex-1 flex flex-col">
                <h4 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors mb-2.5">
                  {item.name}
                </h4>
                <div className="flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70 font-medium">Total</p>
                    <p
                      className="text-base font-bold tracking-tight tabular-nums leading-tight"
                      style={{ color: accent }}
                    >
                      {formatCurrency(total)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70 font-medium">Unitário</p>
                    <p className="text-xs font-semibold text-foreground tabular-nums leading-tight">
                      {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                </div>

                {isStudent && (
                  <button
                    onClick={() => setSellingItem(item)}
                    className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    Vender item
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {isStudent && (
        <SellItemDialog
          item={sellingItem}
          open={!!sellingItem}
          onOpenChange={(o) => !o && setSellingItem(null)}
        />
      )}
    </>
  );
};

/* ---- Sell Item Dialog (aluno) ---- */

const SellItemDialog = ({
  item,
  open,
  onOpenChange,
}: {
  item: GroupItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [step, setStep] = useState<'choose' | 'teacher' | 'marketplace'>('choose');
  const [marketPrice, setMarketPrice] = useState<string>('');
  const [qty, setQty] = useState<number>(1);

  useEffect(() => {
    if (open) {
      setStep('choose');
      setQty(1);
      setMarketPrice(item ? (item.unitPrice * 0.8).toFixed(2).replace('.', ',') : '');
    }
  }, [open, item]);

  if (!item) return null;

  const maxQty = item.quantity;
  const teacherUnit = item.unitPrice * 0.8;
  const teacherTotal = teacherUnit * qty;
  const parsedMarket = parseFloat(marketPrice.replace(',', '.')) || 0;
  const marketTotal = parsedMarket * qty;

  const decQty = () => setQty((q) => Math.max(1, q - 1));
  const incQty = () => setQty((q) => Math.min(maxQty, q + 1));

  const handleConfirmTeacher = () => {
    onOpenChange(false);
  };

  const handleConfirmMarketplace = () => {
    onOpenChange(false);
  };

  /* Reusable: persistent item preview shown across all steps */
  const ItemPreview = (
    <div className="flex items-center gap-3 p-3 rounded-2xl border border-border/50 bg-accent/20">
      <div className="w-14 h-14 rounded-xl overflow-hidden border border-border/40 bg-background shrink-0">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: item.type === 'Serviço' ? 'hsl(280 70% 60% / 0.15)' : 'hsl(211 100% 50% / 0.15)',
              color: item.type === 'Serviço' ? 'hsl(280 70% 60%)' : 'hsl(211 100% 50%)',
            }}
          >
            {item.type}
          </span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {maxQty} disponíve{maxQty !== 1 ? 'is' : 'l'}
          </span>
        </div>
      </div>
    </div>
  );

  /* Reusable: quantity stepper */
  const QtyStepper = (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1.5">
        Quantidade a vender
      </label>
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-xl border border-border/50 bg-background overflow-hidden">
          <button
            type="button"
            onClick={decQty}
            disabled={qty <= 1}
            className="w-9 h-9 flex items-center justify-center text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-12 text-center text-sm font-bold tabular-nums">{qty}</span>
          <button
            type="button"
            onClick={incQty}
            disabled={qty >= maxQty}
            className="w-9 h-9 flex items-center justify-center text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className="text-[11px] text-muted-foreground">
          de <span className="font-semibold tabular-nums text-foreground">{maxQty}</span> disponíve{maxQty !== 1 ? 'is' : 'l'}
        </span>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-border/50">
        <div className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogTitle className="text-lg font-bold tracking-tight">Vender item</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Confira os detalhes antes de confirmar a venda.
          </DialogDescription>
        </div>

        <div className="px-6 py-5 space-y-4">
          {ItemPreview}

          <AnimatePresence mode="wait">
            {step === 'choose' && (
              <motion.div
                key="choose"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {QtyStepper}

                <p className="text-sm text-foreground/80 pt-1">Para quem deseja vender?</p>

                <button
                  onClick={() => setStep('teacher')}
                  className="group w-full text-left p-4 rounded-2xl border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Vender ao professor</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Valor fixo de 80% do preço pago (depreciação)
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
                </button>

                <button
                  onClick={() => setStep('marketplace')}
                  className="group w-full text-left p-4 rounded-2xl border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Vender no Marketplace</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Defina o valor livremente para outros grupos
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
                </button>
              </motion.div>
            )}

            {step === 'teacher' && (
              <motion.div
                key="teacher"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {QtyStepper}

                <div className="rounded-2xl border border-border/50 bg-accent/20 p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Valor pago (unitário)</span>
                    <span className="font-semibold text-foreground tabular-nums line-through opacity-60">
                      {formatCurrency(item.unitPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Depreciação</span>
                    <span className="font-semibold text-destructive tabular-nums">−20%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Unitário com depreciação</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {formatCurrency(teacherUnit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Quantidade</span>
                    <span className="font-semibold text-foreground tabular-nums">{qty}×</span>
                  </div>
                  <div className="h-px bg-border/50" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Você recebe (total)</span>
                    <span className="text-lg font-bold text-primary tabular-nums">
                      {formatCurrency(teacherTotal)}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    Após aprovação do professor, o item retorna ao estoque dele e as moedas serão creditadas ao grupo.
                    Esta venda não aparece no marketplace.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStep('choose')}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleConfirmTeacher}
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    Enviar pedido ao professor
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'marketplace' && (
              <motion.div
                key="marketplace"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {QtyStepper}

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Valor de venda (unitário)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                      R$
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={marketPrice}
                      onChange={(e) => setMarketPrice(e.target.value.replace(/[^0-9.,]/g, ''))}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border/50 bg-background text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                      placeholder="0,00"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Valor original pago: <span className="tabular-nums font-medium">{formatCurrency(item.unitPrice)}</span>
                  </p>
                </div>

                <div className="rounded-2xl border border-border/50 bg-accent/20 p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Unitário</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {formatCurrency(parsedMarket)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Quantidade</span>
                    <span className="font-semibold text-foreground tabular-nums">{qty}×</span>
                  </div>
                  <div className="h-px bg-border/50" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Total da publicação</span>
                    <span className="text-lg font-bold text-primary tabular-nums">
                      {formatCurrency(marketTotal)}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-purple-500/5 border border-purple-500/20 rounded-xl p-3">
                  <Info className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                  <span>
                    O item será publicado no Marketplace e ficará visível aos demais grupos da turma.
                    Você pode definir qualquer valor — sem trava.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStep('choose')}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleConfirmMarketplace}
                    disabled={parsedMarket <= 0}
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Publicar no Marketplace
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ---------------- Membros ---------------- */

const MembersList = ({
  members,
  onSelect,
}: {
  members: GroupMemberInfo[];
  onSelect: (m: GroupMemberInfo) => void;
}) => (
  <div className="space-y-2.5">
    {members.map((m, i) => {
      const roleColor = roleColors[m.role] || roleColors['Membro'];
      return (
        <motion.button
          type="button"
          onClick={() => onSelect(m)}
          key={m.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.995 }}
          className="group relative w-full text-left flex items-center gap-4 overflow-hidden rounded-2xl border border-border/40 bg-card/60 px-4 py-3 transition-all duration-300 hover:border-border hover:bg-card hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)] cursor-pointer"
        >
          <span
            className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full opacity-60 transition-all duration-300 group-hover:h-12 group-hover:opacity-100"
            style={{ backgroundColor: roleColor }}
          />
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundColor: m.color }}
          >
            {m.initials}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <h4 className="text-sm font-semibold text-foreground tracking-tight truncate">{m.name}</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border"
                style={{
                  backgroundColor: `${roleColor}15`,
                  color: roleColor,
                  borderColor: `${roleColor}35`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: roleColor }} />
                {m.role}
              </span>
              <span className="text-[11px] text-muted-foreground truncate">{m.username}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-sm font-bold tabular-nums">
              <Coins className="w-3.5 h-3.5" />
              {formatCurrency(m.balance)}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-foreground" />
          </div>
        </motion.button>
      );
    })}
  </div>
);

/* ---------------- Peer Member Dialog (visão aluno → colega) ---------------- */

const MOCK_SKILLS_POOL = [
  'Programação', 'Eletrônica', 'Modelagem 3D', 'Design', 'Robótica',
  'Liderança', 'Comunicação', 'Pensamento crítico', 'Marcenaria', 'Documentação',
];

const hashCode = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const PeerMemberDialog = ({
  member,
  open,
  onOpenChange,
  isSelf,
  donorBalance,
  projectName,
}: {
  member: GroupMemberInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSelf: boolean;
  donorBalance: number;
  projectName: string;
}) => {
  const [donateOpen, setDonateOpen] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) {
      setDonateOpen(false);
      setAmount('');
      setSuccess(false);
    }
  }, [open]);

  const seed = hashCode(member?.id ?? '');
  const skills = useMemo(() => {
    if (!member) return [];
    const count = 3 + (seed % 3);
    const start = seed % MOCK_SKILLS_POOL.length;
    return Array.from({ length: count }, (_, i) =>
      MOCK_SKILLS_POOL[(start + i) % MOCK_SKILLS_POOL.length]
    );
  }, [seed, member]);

  if (!member) return null;

  const streak = 3 + (seed % 28);
  const roleColor = roleColors[member.role] || roleColors['Membro'];

  const parsedAmount = parseFloat(amount.replace(',', '.')) || 0;
  const canDonate = parsedAmount > 0 && parsedAmount <= donorBalance;

  const handleDonate = () => {
    if (!canDonate) return;
    setSuccess(true);
    setTimeout(() => onOpenChange(false), 1400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden border-border/50">
        <DialogTitle className="sr-only">Perfil de {member.name}</DialogTitle>
        <DialogDescription className="sr-only">
          Visualizar dados do colega de grupo e doar moedas
        </DialogDescription>

        <div
          className="relative px-6 pt-7 pb-5 text-center"
          style={{
            background: `linear-gradient(135deg, ${member.color}22 0%, ${member.color}08 100%)`,
          }}
        >
          <div
            className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg ring-4 ring-background"
            style={{ backgroundColor: member.color }}
          >
            {member.initials}
          </div>
          <h3 className="mt-3 text-lg font-bold tracking-tight text-foreground">{member.name}</h3>

          <div className="mt-2 inline-flex flex-col items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border"
              style={{
                backgroundColor: `${roleColor}15`,
                color: roleColor,
                borderColor: `${roleColor}35`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: roleColor }} />
              {member.role}
            </span>

            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <GraduationCap className="w-3.5 h-3.5" />
              <span className="text-foreground font-medium">Turma 9º ano</span>
              <span className="opacity-60">·</span>
              <span>9º ANO</span>
            </div>

            <div className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 max-w-[260px]">
              <FolderKanban className="w-3.5 h-3.5 shrink-0" />
              <span className="font-semibold truncate">{projectName}</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-border/50 bg-amber-500/5 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400">
                <Coins className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-bold tracking-wide">Carteira</span>
              </div>
              <p className="mt-1 text-base font-bold tabular-nums text-foreground">
                {formatCurrency(member.balance)}
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-orange-500/5 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-orange-600 dark:text-orange-400">
                <Flame className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-bold tracking-wide">Sequência</span>
              </div>
              <p className="mt-1 text-base font-bold tabular-nums text-foreground">
                {streak} <span className="text-[10px] font-medium text-muted-foreground">dias</span>
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <h4 className="text-[11px] uppercase font-bold tracking-wide text-muted-foreground">
                Skills
              </h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {!isSelf && (
            <AnimatePresence mode="wait" initial={false}>
              {!donateOpen && !success && (
                <motion.button
                  key="donate-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setDonateOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <Gift className="w-4 h-4" />
                  Doar moedas
                </motion.button>
              )}

              {donateOpen && !success && (
                <motion.div
                  key="donate-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-3 rounded-2xl border border-border/50 bg-accent/20 p-4"
                >
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Sua carteira</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {formatCurrency(donorBalance)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Valor a doar
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                        R$
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        autoFocus
                        value={amount}
                        onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                        placeholder="0,00"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border/50 bg-background text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                      />
                    </div>
                    {parsedAmount > donorBalance && (
                      <p className="mt-1.5 text-[11px] text-destructive flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Valor maior que sua carteira
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setDonateOpen(false); setAmount(''); }}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDonate}
                      disabled={!canDonate}
                      className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirmar doação
                    </button>
                  </div>
                </motion.div>
              )}

              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border border-green-500/30 bg-green-500/10"
                >
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                  <p className="text-sm font-semibold text-foreground">Doação enviada!</p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    {formatCurrency(parsedAmount)} para {member.name.split(' ')[0]}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ---------------- Loja Online (aluno) ---------------- */


interface ShopProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  type: 'Consumível' | 'Serviço';
  stock: number;
  description: string;
}

const SHOP_PRODUCTS: ShopProduct[] = [
  { id: 'p1', name: 'Arduino Uno R3', image: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400&h=400&fit=crop', price: 75.00, type: 'Consumível', stock: 12, description: 'Placa microcontroladora ideal para projetos.' },
  { id: 'p2', name: 'Sensor Ultrassônico HC-SR04', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop', price: 12.50, type: 'Consumível', stock: 30, description: 'Mede distâncias por ultrassom.' },
  { id: 'p3', name: 'Impressão 3D (por hora)', image: 'https://images.unsplash.com/photo-1612886623327-f6c4ccd2e2c6?w=400&h=400&fit=crop', price: 18.00, type: 'Serviço', stock: 99, description: 'Hora de impressora 3D do FabLab.' },
  { id: 'p4', name: 'Servo Motor SG90', image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=400&h=400&fit=crop', price: 9.90, type: 'Consumível', stock: 25, description: 'Servo motor leve para protótipos.' },
  { id: 'p5', name: 'Corte a Laser (peça)', image: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=400&h=400&fit=crop', price: 24.00, type: 'Serviço', stock: 50, description: 'Corte a laser sob demanda.' },
  { id: 'p6', name: 'Protoboard 830 pontos', image: 'https://images.unsplash.com/photo-1581090700227-1e37b190418e?w=400&h=400&fit=crop', price: 15.00, type: 'Consumível', stock: 20, description: 'Protoboard para montagem de circuitos.' },
  { id: 'p7', name: 'Kit Jumpers (40 un.)', image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&h=400&fit=crop', price: 11.00, type: 'Consumível', stock: 40, description: 'Fios jumper macho-macho coloridos.' },
  { id: 'p8', name: 'LEDs Sortidos (50 un.)', image: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=400&fit=crop', price: 7.50, type: 'Consumível', stock: 60, description: 'Pacote variado de LEDs 5mm.' },
];

/* ---- Pedidos / Marketplace mocks ---- */

interface OrderItemLine { name: string; qty: number; price: number; image: string; }
interface ShopOrder {
  id: string;
  createdAt: string; // ISO
  items: OrderItemLine[];
  total: number;
  status: 'pendente' | 'aprovado' | 'negado';
  buyer: string;
  reason?: string;
}

const INITIAL_ORDERS: ShopOrder[] = [
  {
    id: 'o-1001', createdAt: '2026-04-22T10:15:00Z', status: 'pendente',
    buyer: 'Moises Picode', total: 87.50,
    items: [
      { name: 'Arduino Uno R3', qty: 1, price: 75.00, image: SHOP_PRODUCTS[0].image },
      { name: 'Sensor Ultrassônico HC-SR04', qty: 1, price: 12.50, image: SHOP_PRODUCTS[1].image },
    ],
  },
  {
    id: 'o-1000', createdAt: '2026-04-18T14:02:00Z', status: 'aprovado',
    buyer: 'Aluno Teste', total: 36.00,
    items: [
      { name: 'Impressão 3D (por hora)', qty: 2, price: 18.00, image: SHOP_PRODUCTS[2].image },
    ],
  },
  {
    id: 'o-0999', createdAt: '2026-04-12T09:40:00Z', status: 'negado',
    buyer: 'Raffaela Suffi', total: 150.00,
    reason: 'Item fora do escopo do projeto atual.',
    items: [
      { name: 'Arduino Uno R3', qty: 2, price: 75.00, image: SHOP_PRODUCTS[0].image },
    ],
  },
];

interface MarketplaceListing {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice: number;
  type: 'Consumível' | 'Serviço';
  sellerGroup: string;
  description: string;
}

const MARKETPLACE_LISTINGS: MarketplaceListing[] = [
  { id: 'mk1', name: 'Sensor de Gás MQ-2', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop', price: 28.00, originalPrice: 42.00, type: 'Consumível', sellerGroup: 'Grupo Pitch 26', description: 'Pouco usado, em ótimo estado.' },
  { id: 'mk2', name: 'Servo Motor SG90', image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=400&h=400&fit=crop', price: 6.50, originalPrice: 9.90, type: 'Consumível', sellerGroup: 'Equipe Maker', description: 'Sobra do projeto anterior.' },
  { id: 'mk3', name: 'Impressão 3D (1h)', image: 'https://images.unsplash.com/photo-1612886623327-f6c4ccd2e2c6?w=400&h=400&fit=crop', price: 12.00, originalPrice: 18.00, type: 'Serviço', sellerGroup: 'Time Robótica', description: 'Hora não utilizada do FabLab.' },
  { id: 'mk4', name: 'Protoboard 830', image: 'https://images.unsplash.com/photo-1581090700227-1e37b190418e?w=400&h=400&fit=crop', price: 9.00, originalPrice: 15.00, type: 'Consumível', sellerGroup: 'Grupo Inovação', description: 'Sem uso, lacrada.' },
];

const SUB_TABS = ['Pedidos', 'Loja PiCode', 'Itens do grupo', 'Marketplace'] as const;
type SubTab = typeof SUB_TABS[number];

const StudentShop = ({ groupBalance, items, members }: { groupBalance: number; items: GroupItem[]; members: GroupMemberInfo[] }) => {
  const [subTab, setSubTab] = useState<SubTab>('Loja PiCode');

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="glass-card rounded-2xl p-1.5 inline-flex gap-1 flex-wrap">
        {SUB_TABS.map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              subTab === t
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={subTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          {subTab === 'Pedidos' && <OrdersBoard />}
          {subTab === 'Loja PiCode' && <ShopGrid groupBalance={groupBalance} members={members} />}
          {subTab === 'Itens do grupo' && <ItemsGrid items={items} variant="student" />}
          {subTab === 'Marketplace' && <MarketplaceGrid groupBalance={groupBalance} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ---- Pedidos ---- */

const ORDER_COLUMNS: { id: ShopOrder['status']; title: string; accent: string; emptyMsg: string }[] = [
  { id: 'pendente', title: 'Pendentes', accent: 'hsl(38 92% 50%)', emptyMsg: 'Não há pedidos pendentes' },
  { id: 'aprovado', title: 'Aprovados', accent: 'hsl(142 71% 45%)', emptyMsg: 'Não há pedidos aprovados' },
  { id: 'negado', title: 'Negados', accent: 'hsl(0 72% 51%)', emptyMsg: 'Não há pedidos negados' },
];

const OrdersBoard = () => {
  const [orders] = useState<ShopOrder[]>(INITIAL_ORDERS);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {ORDER_COLUMNS.map(col => {
        const list = orders.filter(o => o.status === col.id);
        return (
          <div
            key={col.id}
            className="rounded-2xl border border-border/50 bg-card/60 p-4 space-y-3"
            style={{ borderTop: `3px solid ${col.accent}` }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight" style={{ color: col.accent }}>
                {col.title}
              </h3>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums"
                style={{ backgroundColor: `${col.accent}1f`, color: col.accent }}
              >
                {list.length}
              </span>
            </div>

            {list.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6">{col.emptyMsg}</p>
            ) : (
              <div className="space-y-2.5">
                {list.map(o => (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-background/60 border border-border/40 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-muted-foreground">#{o.id}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {format(new Date(o.createdAt), "dd MMM ''yy", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {o.items.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <img src={it.image} alt="" className="w-7 h-7 rounded-md object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-foreground truncate">{it.name}</p>
                            <p className="text-[10px] text-muted-foreground tabular-nums">
                              {it.qty} × {formatCurrency(it.price)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <span className="text-[10px] text-muted-foreground truncate">por {o.buyer}</span>
                      <span className="text-xs font-bold text-foreground tabular-nums">
                        {formatCurrency(o.total)}
                      </span>
                    </div>
                    {o.reason && (
                      <p className="text-[10px] text-destructive bg-destructive/5 rounded-md px-2 py-1.5 flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                        {o.reason}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ---- Marketplace ---- */

const MarketplaceGrid = ({ groupBalance }: { groupBalance: number }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-muted-foreground">
          Itens vendidos por outros grupos. Aproveite preços mais baixos!
        </p>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          Saldo disponível: <span className="font-semibold text-foreground">{formatCurrency(groupBalance)}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {MARKETPLACE_LISTINGS.map((p, i) => {
          const accent = p.type === 'Serviço' ? 'hsl(280 70% 60%)' : 'hsl(160 70% 42%)';
          const discount = Math.round((1 - p.price / p.originalPrice) * 100);
          const tooExpensive = p.price > groupBalance;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3 }}
              className="group glass-card rounded-3xl overflow-hidden border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
            >
              <div className="p-3 pb-2 h-36">
                <div className="relative w-full h-full overflow-hidden rounded-2xl border border-border/40 bg-accent/20">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none" />
                  <span
                    className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold backdrop-blur-md text-white"
                    style={{ backgroundColor: `${accent}33`, border: `1px solid ${accent}66` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
                    {p.type}
                  </span>
                  {discount > 0 && (
                    <span className="absolute top-2.5 right-2.5 inline-flex items-center px-2 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold tabular-nums shadow-md">
                      -{discount}%
                    </span>
                  )}
                </div>
              </div>
              <div className="px-4 pb-4 pt-1 space-y-2">
                <div>
                  <h4 className="font-semibold text-foreground text-sm truncate">{p.name}</h4>
                  <p className="text-[10px] text-muted-foreground truncate">de {p.sellerGroup}</p>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{p.description}</p>
                <div className="flex items-end justify-between gap-2 pt-1">
                  <div>
                    <p className="text-[10px] text-muted-foreground line-through tabular-nums">
                      {formatCurrency(p.originalPrice)}
                    </p>
                    <p className="text-base font-bold tabular-nums tracking-tight" style={{ color: accent }}>
                      {formatCurrency(p.price)}
                    </p>
                  </div>
                  <button
                    disabled={tooExpensive}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:brightness-110 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Comprar
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};



const ShopGrid = ({ groupBalance, members }: { groupBalance: number; members: GroupMemberInfo[] }) => {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<'Todos' | 'Consumível' | 'Serviço'>('Todos');
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const filtered = SHOP_PRODUCTS.filter(p => filter === 'Todos' ? true : p.type === filter);
  const cartItems = SHOP_PRODUCTS.filter(p => cart[p.id] > 0).map(p => ({ ...p, qty: cart[p.id] }));
  const cartTotal = cartItems.reduce((s, i) => s + i.qty * i.price, 0);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const insufficient = cartTotal > groupBalance;

  const add = (id: string) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const sub = (id: string) => setCart(c => {
    const next = { ...c };
    if (!next[id]) return c;
    next[id] -= 1;
    if (next[id] <= 0) delete next[id];
    return next;
  });

  const finalize = () => {
    if (submitting) return;
    setSubmitting(true);
    // Carregamento leve antes de mostrar a tela de pedido enviado
    window.setTimeout(() => {
      setSubmitting(false);
      setConfirming(false);
      setSuccess(true);
    }, 1100);
  };

  const closeSuccess = () => {
    setSuccess(false);
    setCart({});
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
      {/* Catálogo */}
      <div>
        {/* Filters */}
        <div className="flex items-center gap-2 mb-4">
          {(['Todos', 'Consumível', 'Serviço'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === f
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-accent/40 text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p, i) => {
            const accent = p.type === 'Serviço' ? 'hsl(280 70% 60%)' : 'hsl(211 100% 50%)';
            const inCart = cart[p.id] || 0;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3 }}
                className="group glass-card rounded-3xl overflow-hidden border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
              >
                <div className="p-3 pb-2 h-36">
                  <div className="relative w-full h-full overflow-hidden rounded-2xl border border-border/40 bg-accent/20">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none" />
                    <span
                      className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold backdrop-blur-md text-white"
                      style={{ backgroundColor: `${accent}33`, border: `1px solid ${accent}66` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
                      {p.type}
                    </span>
                    {inCart > 0 && (
                      <span className="absolute top-2.5 right-2.5 inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold tabular-nums shadow-md">
                        {inCart}
                      </span>
                    )}
                  </div>
                </div>
                <div className="px-4 pb-4 pt-1">
                  <h4 className="font-semibold text-foreground text-sm truncate mb-0.5">{p.name}</h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mb-3">{p.description}</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-base font-bold tabular-nums tracking-tight" style={{ color: accent }}>
                      {formatCurrency(p.price)}
                    </p>
                    {inCart === 0 ? (
                      <button
                        onClick={() => add(p.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:brightness-110 transition-all shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-1 bg-accent/60 rounded-xl p-0.5">
                        <button
                          onClick={() => sub(p.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-background transition-colors"
                          aria-label="Diminuir"
                        >
                          <Minus className="w-3.5 h-3.5 text-foreground" />
                        </button>
                        <span className="min-w-[24px] text-center text-xs font-bold text-foreground tabular-nums">{inCart}</span>
                        <button
                          onClick={() => add(p.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary text-primary-foreground hover:brightness-110 transition-all"
                          aria-label="Aumentar"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Carrinho lateral */}
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Carrinho</h3>
                <p className="text-[11px] text-muted-foreground">{cartCount} {cartCount === 1 ? 'item' : 'itens'}</p>
              </div>
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={() => setCart({})}
                className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
              >
                Limpar
              </button>
            )}
          </div>

          {cartItems.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-accent/40 flex items-center justify-center mb-3">
                <ShoppingBag className="w-5 h-5 text-muted-foreground/60" />
              </div>
              <p className="text-xs text-muted-foreground">Adicione itens da loja para comprar com o saldo do grupo.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl bg-accent/30">
                  <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground tabular-nums">
                      {item.qty} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="text-xs font-bold text-foreground tabular-nums shrink-0">
                    {formatCurrency(item.qty * item.price)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-border/50 pt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Saldo do grupo</span>
              <span className="font-semibold text-foreground tabular-nums">{formatCurrency(groupBalance)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className={`text-lg font-bold tabular-nums ${insufficient ? 'text-destructive' : 'text-foreground'}`}>
                {formatCurrency(cartTotal)}
              </span>
            </div>
            {insufficient && (
              <p className="text-[11px] text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Saldo insuficiente
              </p>
            )}
            <button
              disabled={cartItems.length === 0 || insufficient}
              onClick={() => setConfirming(true)}
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Finalizar compra
            </button>
          </div>
        </div>
      </aside>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-card border-border/60">
          {(() => {
            const OVERDRAFT_LIMIT = 8; // Cheque especial: cada aluno pode ficar até R$ 8,00 negativo
            const n = Math.max(members.length, 1);
            const perMemberRaw = cartTotal / n;
            // Distribuição exatamente igual entre os alunos (em centavos para evitar erro de arredondamento)
            const totalCents = Math.round(cartTotal * 100);
            const baseCents = Math.floor(totalCents / n);
            const remainder = totalCents - baseCents * n;
            const split = members.map((m, idx) => {
              const cents = baseCents + (idx < remainder ? 1 : 0);
              const share = cents / 100;
              const newBalance = m.balance - share;
              const canPay = newBalance >= -OVERDRAFT_LIMIT;
              return {
                member: m,
                share,
                newBalance,
                canPay,
                // Quanto falta para caber no limite do cheque especial
                missing: Math.max(0, -newBalance - OVERDRAFT_LIMIT),
              };
            });
            const blocked = split.some(s => !s.canPay);
            const blockers = split.filter(s => !s.canPay);

            return (
              <>
                <div className="px-6 py-5 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-1">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                  </div>
                  <DialogTitle className="text-base font-semibold text-foreground">Divisão da compra</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    O total de <strong className="text-foreground">{formatCurrency(cartTotal)}</strong> será dividido igualmente entre {n} {n === 1 ? 'aluno' : 'alunos'} ({formatCurrency(perMemberRaw)} cada).
                  </DialogDescription>

                  <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                    {split.map(({ member, share, newBalance, canPay, missing }) => (
                      <div
                        key={member.id}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
                          canPay ? 'border-border/40 bg-accent/20' : 'border-destructive/40 bg-destructive/5'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{member.name}</p>
                          <p className="text-[10px] text-muted-foreground tabular-nums">
                            -{formatCurrency(share)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 text-xs tabular-nums">
                          <span className="text-emerald-600 dark:text-emerald-500 font-semibold">
                            {formatCurrency(member.balance)}
                          </span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span
                            className={`font-bold ${
                              newBalance < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-500'
                            }`}
                          >
                            {formatCurrency(newBalance)}
                          </span>
                          <Coins className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] px-1">
                    <span className="text-muted-foreground">Cheque especial por aluno</span>
                    <span className="font-semibold text-foreground tabular-nums">até {formatCurrency(OVERDRAFT_LIMIT)}</span>
                  </div>

                  {blocked && (
                    <div className="rounded-xl bg-destructive/5 border border-destructive/30 p-3 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                      <div className="text-[11px] text-destructive leading-relaxed">
                        <p className="font-semibold mb-0.5">
                          Compra bloqueada — {blockers.length} {blockers.length === 1 ? 'aluno ultrapassa' : 'alunos ultrapassam'} o limite do cheque especial ({formatCurrency(OVERDRAFT_LIMIT)}).
                        </p>
                        <p className="text-destructive/80">
                          {blockers.length === 1 ? 'Esse aluno' : 'Esses alunos'} {blockers.length === 1 ? 'precisa' : 'precisam'} fazer mais atividades para ganhar moedas, ou receber doações dos colegas. Faltam: {blockers.map(b => `${b.member.name.split(' ')[0]} ${formatCurrency(b.missing)}`).join(', ')}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/50 bg-accent/20">
                  <button
                    onClick={() => setConfirming(false)}
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={finalize}
                    disabled={blocked || submitting}
                    className="min-w-[160px] px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:brightness-110 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando pedido...
                      </>
                    ) : (
                      'Confirmar compra'
                    )}
                  </button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Animação final: pedido enviado para aprovação do professor */}
      <Dialog open={success} onOpenChange={(o) => !o && closeSuccess()}>
        <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden bg-card border-border/60">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-6 py-8 flex flex-col items-center text-center space-y-5"
          >
            {/* Ícone animado */}
            <div className="relative">
              <motion.div
                initial={{ scale: 0, opacity: 0.4 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full bg-emerald-500/30"
              />
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
              >
                <motion.div
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.45, ease: 'easeOut' }}
                >
                  <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
                </motion.div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.35 }}
              className="space-y-2"
            >
              <DialogTitle className="text-lg font-semibold text-foreground">
                Compra finalizada!
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                Seu pedido foi enviado e está <strong className="text-foreground">aguardando aprovação do professor</strong>. Você pode acompanhar o status na aba <strong className="text-foreground">Pedidos</strong>.
              </DialogDescription>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.35 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-500">
                Pedido pendente de aprovação
              </span>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.35 }}
              onClick={closeSuccess}
              className="w-full mt-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all shadow-sm"
            >
              Concluir
            </motion.button>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupDetailView;
