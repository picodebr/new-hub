import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckSquare, Square, Coins, Package, Users as UsersIcon,
  Kanban, Plus, Wallet, Boxes, Sparkles, GraduationCap,
  Trash2, Check, X, CalendarDays, Clock, AlertTriangle, CheckCircle2, ChevronRight,
  ShoppingBag, ShoppingCart, Minus, Tag, Store, ArrowRight, Info, Flame, Gift, Paperclip, Loader2, FolderKanban,
  Edit3, Heart, HeartOff, FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
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
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useUser } from '@/hooks/useUser';
import {
  getGroupById,
  updateGroup,
  addGroupActivity,
  removeGroupActivity,
  addGroupActivityCategory,
  removeGroupActivityCategory,
  addOrder,
  acceptOrder,
  rejectOrder,
  listAvailableUsersForGroupByProject,
  updateOrderItem,
} from '@/_base/services/group';
import { updateOrderStatus } from '@/_base/services/group/updateOrder';
import { getStockMaker, getStockResales, resaleStockItem, acceptResaleStockItem } from '@/_base/services/storeMaker';
import { makeDonation } from '@/_base/services/student/makeDonation';
import { getPresignedUrl, uploadFile } from '@/_base/services/upload';
import { updateProfile } from '@/_base/services/user';
import { formatCoin } from '@/_base/utils';
import { IHubGroup, IHubGroupOrder, IHubGroupActivity, IHubGroupActivityCategory } from '@/_base/interfaces/group';
import { IStockMaker, IStoreMakerResale } from '@/_base/interfaces/storeMaker';
import { IHubUser } from '@/_base/interfaces/user';

export interface GroupMemberInfo {
  id: string;
  name: string;
  username: string;
  initials: string;
  color: string;
  role: string;
  balance: number;
}

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  assignees?: { initials: string; color: string }[];
  tag?: { label: string; color: string };
  dueDate?: string;
}

export interface KanbanColumn {
  id: 'todo' | 'doing' | 'done';
  title: string;
  accent: string;
  cards: KanbanCard[];
}

export interface GroupItem {
  id: string;
  hub_group_order_item_id?: string;
  orderItemId?: string;
  orderId?: string;
  name: string;
  image: string;
  quantity: number;
  unitPrice: number;
  type: 'Consumível' | 'Serviço';
  is_service?: boolean;
  order_item_metadata?: any;
  store_item?: any;
}

interface Props {
  group?: { id: string; name: string; members: { initials: string; color: string }[] };
  onBack?: () => void;
  variant?: 'teacher' | 'student';
}

const TABS = ['Atividades', 'Planejamentos', 'Loja Online', 'Membros'] as const;
type Tab = (typeof TABS)[number];

const tabIcon: Record<Tab, React.ElementType> = {
  'Atividades': CheckSquare,
  'Planejamentos': Kanban,
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

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const DEFAULT_KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'todo', title: 'A Fazer', accent: 'hsl(221 83% 53%)', cards: [] },
  { id: 'doing', title: 'Em andamento', accent: 'hsl(45 93% 47%)', cards: [] },
  { id: 'done', title: 'Feito', accent: 'hsl(142 71% 45%)', cards: [] },
];

const GroupDetailView = ({ group: initialGroup, onBack, variant: propVariant }: Props) => {
  const { groupId: routeGroupId } = useParams<{ groupId?: string }>();
  const navigate = useNavigate();
  const { user, setUser, chosenSchool, isStudent } = useUser();
  const variant = propVariant || (isStudent ? 'student' : 'teacher');

  const targetGroupId = initialGroup?.id || routeGroupId;
  const [remoteGroup, setRemoteGroup] = useState<IHubGroup | null>(null);
  const [savedGroup, setSavedGroup] = useState<IHubGroup | null>(null);
  const [stockList, setStockList] = useState<IStockMaker[]>([]);
  const [resaleList, setResaleList] = useState<IStoreMakerResale[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>('Atividades');
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>(DEFAULT_KANBAN_COLUMNS);
  const [peerMember, setPeerMember] = useState<GroupMemberInfo | null>(null);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);

  const activeSchoolId =
    chosenSchool?.hub_school_id ||
    user?.chosen_school_id ||
    (remoteGroup?.project as any)?.hub_class?.hub_school_id ||
    '';

  // Paridade exata canEdit do hub-web
  const canEdit =
    (user?.role === 'student' || remoteGroup?.project?.user_id === user?.id || user?.role === 'master' || user?.role === 'teacher') &&
    (user?.role !== 'student' || !!remoteGroup?.student_links?.find((e: any) => e.hub_user_id === user?.id) || !!remoteGroup?.students?.find((s: any) => s.id === user?.id));

  const tabs = TABS;

  // Carregar dados reais da API
  const loadGroupData = async () => {
    if (!targetGroupId) return;
    try {
      setLoading(true);
      const schoolId = chosenSchool?.hub_school_id || user?.chosen_school_id || '';
      const [groupData, stockData, resalesData] = await Promise.all([
        getGroupById(targetGroupId).catch(() => null),
        getStockMaker().catch(() => []),
        schoolId ? getStockResales(schoolId).catch(() => []) : Promise.resolve([]),
      ]);

      if (groupData) {
        setRemoteGroup(groupData);
        setSavedGroup(groupData);

        if (groupData.metadata?.kanban) {
          try {
            const parsed = JSON.parse(groupData.metadata.kanban);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setKanbanColumns(parsed);
            }
          } catch (e) {
            console.warn('Erro ao parsear kanban:', e);
          }
        }
      }
      setStockList(stockData || []);
      setResaleList(resalesData || []);
    } catch (err) {
      console.error('Erro ao carregar dados do grupo:', err);
      toast.error('Erro ao carregar dados do grupo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupData();
  }, [targetGroupId, activeSchoolId]);

  // Lista de membros reais
  const members: GroupMemberInfo[] = useMemo(() => {
    if (!remoteGroup?.students) return [];
    return remoteGroup.students.map((s, i) => {
      const link = remoteGroup.student_links?.find((l) => l.hub_user_id === s.id);
      const role = s.group_role || (link as any)?.role || (link as any)?.metadata?.role || (i === 0 ? 'Líder de Grupo' : 'Membro');
      return {
        id: s.id,
        name: s.display_name || s.name || 'Aluno',
        username: `@${(s.username || s.name || 'aluno').toLowerCase().replace(/\s+/g, '-')}`,
        initials: (s.display_name || s.name || 'AL').slice(0, 2).toUpperCase(),
        color: roleColors[role] || roleColors['Membro'],
        role,
        balance: Number(s.metadata?.coins || 0),
      };
    });
  }, [remoteGroup]);

  // Saldo real somado dos membros
  const groupBalance = useMemo(() => {
    if (!remoteGroup?.students) return 0;
    return remoteGroup.students.reduce((acc, s) => acc + Number(s.metadata?.coins || 0), 0);
  }, [remoteGroup]);

  // Patrimônio real calculado sobre os pedidos aprovados
  const groupPatrimony = useMemo(() => {
    if (!remoteGroup?.orders) return 0;
    return remoteGroup.orders
      .filter((o) => !!o.approved_at && !o.metadata?.denied_at)
      .flatMap((o) => (o.items || []).map((i) => ({ ...o, ...i, ...i.store_item })))
      .filter((i: any) => !i.store_item?.metadata?.is_service)
      .reduce((acc, v: any) => acc + (v.quantity || 0) * Number(v.price || v.store_item?.price || 0), 0);
  }, [remoteGroup]);

  // Itens reais do grupo adquiridos via pedidos aprovados
  const groupItems: GroupItem[] = useMemo(() => {
    if (!remoteGroup?.orders) return [];
    const itemsMap = new Map<string, GroupItem>();
    (remoteGroup.orders || [])
      .filter((o) => !!o.approved_at && !o.metadata?.denied_at)
      .flatMap((o) => (o.items || []).map((i) => ({ ...i, orderId: o.id })))
      .forEach((item: any) => {
        const product = item.store_item || item;
        const key = product.id || item.id;
        const isService = Boolean(product.metadata?.is_service);
        const existing = itemsMap.get(key);
        const qty = item.quantity || 1;
        const price = Number(item.price || product.price || 0);
        if (existing) {
          existing.quantity += qty;
          if (item.metadata?.service_consumed_quantity) {
            existing.order_item_metadata = {
              ...(existing.order_item_metadata || {}),
              service_consumed_quantity:
                (existing.order_item_metadata?.service_consumed_quantity || 0) +
                (item.metadata.service_consumed_quantity || 0),
            };
          }
        } else {
          itemsMap.set(key, {
            id: key,
            hub_group_order_item_id: item.id,
            orderItemId: item.id,
            orderId: item.orderId,
            name: product.name || 'Item Maker',
            image: product.picture || product.image || product.metadata?.image || 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400&h=400&fit=crop',
            quantity: qty,
            unitPrice: price,
            type: isService ? 'Serviço' : 'Consumível',
            is_service: isService,
            order_item_metadata: item.metadata || {},
            store_item: product,
          });
        }
      });
    return Array.from(itemsMap.values());
  }, [remoteGroup]);
  // Aluno logado (se houver)
  const currentStudentId = useMemo(() => {
    if (variant !== 'student' || !user?.id) return null;
    return members.find((m) => m.id === user.id)?.id || members[0]?.id || null;
  }, [variant, user, members]);

  const currentStudentBalance = useMemo(() => {
    return members.find((m) => m.id === currentStudentId)?.balance ?? 0;
  }, [members, currentStudentId]);

  // Detecta necessidade de salvar (Kanban ou Nome)
  const needSave = useMemo(() => {
    if (!remoteGroup || !savedGroup) return false;
    const kanbanChanged = JSON.stringify(remoteGroup.metadata?.kanban) !== JSON.stringify(savedGroup.metadata?.kanban);
    const nameChanged = remoteGroup.display_name !== savedGroup.display_name;
    return kanbanChanged || nameChanged;
  }, [remoteGroup, savedGroup]);

  // Salvar grupo
  const handleSaveGroup = async () => {
    if (!remoteGroup) return;
    try {
      setSaving(true);
      const updated = await updateGroup({
        id: remoteGroup.id,
        metadata: remoteGroup.metadata,
        display_name: remoteGroup.display_name,
      });
      setRemoteGroup((g) => (g ? { ...g, ...updated } : updated));
      setSavedGroup((g) => (g ? { ...g, ...updated } : updated));
      toast.success('Grupo salvo com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar grupo:', err);
      toast.error('Erro ao salvar grupo');
    } finally {
      setSaving(false);
    }
  };

  // Atualização local do Kanban
  const handleKanbanChange = (newCols: KanbanColumn[]) => {
    setKanbanColumns(newCols);
    setRemoteGroup((g) => {
      if (!g) return g;
      return {
        ...g,
        metadata: {
          ...(g.metadata || {}),
          kanban: JSON.stringify(newCols),
        },
      };
    });
  };

  // Pedidos e Loja
  const handleFinishOrder = async (items: { id: string; quantity: number }[]) => {
    if (!remoteGroup) return;
    try {
      const updated = await addOrder({ group_id: remoteGroup.id, items });
      setRemoteGroup((g) => (g ? { ...g, ...updated } : updated));
      setSavedGroup((g) => (g ? { ...g, ...updated } : updated));
      toast.success('Pedido enviado para aprovação do professor!');
    } catch (err) {
      console.error('Erro ao finalizar pedido:', err);
      toast.error('Erro ao enviar pedido');
      throw err;
    }
  };

  const handleFinishResaleOrder = async (items: any[]) => {
    if (!remoteGroup) return;
    try {
      const updated = await addOrder({
        group_id: remoteGroup.id,
        items: items.map((i) => ({ id: i.store_maker_item_id, quantity: i.quantity, hub_store_maker_resale_id: i.id })),
        is_resale: true,
      });
      setRemoteGroup((g) => (g ? { ...g, ...updated } : updated));
      setSavedGroup((g) => (g ? { ...g, ...updated } : updated));
      toast.success('Compra no Marketplace finalizada!');
    } catch (err) {
      console.error('Erro ao comprar no marketplace:', err);
      toast.error('Erro ao processar compra no marketplace');
    }
  };

  const handleApproveOrder = async (order: IHubGroupOrder) => {
    if (!remoteGroup) return;
    try {
      await acceptOrder({ order_id: order.id, group_id: remoteGroup.id });
      setRemoteGroup((g) => {
        if (!g) return g;
        return {
          ...g,
          orders: g.orders.map((o) => (o.id === order.id ? { ...o, approved_at: new Date().toISOString() } : o)),
        };
      });
      toast.success('Pedido aprovado com sucesso!');
    } catch (err) {
      toast.error('Erro ao aprovar pedido');
    }
  };

  const handleRejectOrder = async (order: IHubGroupOrder) => {
    if (!remoteGroup) return;
    try {
      await rejectOrder({ order_id: order.id, group_id: remoteGroup.id });
      setRemoteGroup((g) => {
        if (!g) return g;
        return {
          ...g,
          orders: g.orders.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  metadata: {
                    ...(o.metadata || {}),
                    status: o.metadata?.status || 'in_separation',
                    denied_at: new Date().toISOString(),
                  },
                }
              : o
          ),
        };
      });
      toast.success('Pedido recusado');
    } catch (err) {
      toast.error('Erro ao recusar pedido');
    }
  };

  const handleChangeOrderStatus = async (order: IHubGroupOrder, status: any) => {
    try {
      await updateOrderStatus({ order_id: order.id, status });
      setRemoteGroup((g) => {
        if (!g) return g;
        return {
          ...g,
          orders: g.orders.map((o) => (o.id === order.id ? { ...o, metadata: { ...(o.metadata || {}), status } } : o)),
        };
      });
      toast.success('Status do pedido atualizado');
    } catch (err) {
      toast.error('Erro ao atualizar status');
    }
  };

  // Voltar
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

  if (!remoteGroup) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">Grupo não encontrado</p>
        <button onClick={handleBack} className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
          Voltar
        </button>
      </div>
    );
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
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button onClick={handleBack} className="p-2 rounded-xl hover:bg-accent transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md shrink-0">
              <UsersIcon className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground truncate">{remoteGroup.display_name}</h1>
                {!isStudent && (
                  <button
                    onClick={() => setShowEditGroupModal(true)}
                    className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title="Editar grupo e membros"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {members.length} {members.length === 1 ? 'membro' : 'membros'} • {remoteGroup.project?.title || 'Projeto'}
              </p>
            </div>
          </div>
        </div>

        {/* Saldo, Patrimônio e Botão Salvar */}
        <div className="flex items-center gap-3 flex-wrap">
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

          {needSave && (
            <motion.button
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={handleSaveGroup}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 shadow-md transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Salvar
            </motion.button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card rounded-2xl p-1.5 inline-flex mb-6 gap-1 flex-wrap">
        {tabs.map((tab) => {
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
              group={remoteGroup}
              setRemoteGroup={setRemoteGroup}
              variant={variant}
            />
          )}

          {activeTab === 'Planejamentos' && (
            <KanbanBoard
              columns={kanbanColumns}
              setColumns={handleKanbanChange}
              members={members}
            />
          )}

          {activeTab === 'Loja Online' && (
            <StudentShop
              group={remoteGroup}
              groupBalance={groupBalance}
              items={groupItems}
              members={members}
              stockMakerList={stockList}
              resaleList={resaleList}
              onFinishOrder={handleFinishOrder}
              onFinishResaleOrder={handleFinishResaleOrder}
              onApproveOrder={handleApproveOrder}
              onRejectOrder={handleRejectOrder}
              onChangeOrderStatus={handleChangeOrderStatus}
              canEdit={canEdit}
              isTeacher={!isStudent}
              schoolId={activeSchoolId}
              reloadGroup={loadGroupData}
              user={user}
              setUser={setUser}
            />
          )}

          {activeTab === 'Membros' && (
            <MembersList
              members={members}
              isTeacher={!isStudent}
              onEditGroup={() => setShowEditGroupModal(true)}
              onSelect={(m) => {
                if (variant === 'student') {
                  setPeerMember(m);
                } else {
                  navigate(`/students/${m.id}`);
                }
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modal doar moedas (visão aluno) */}
      {variant === 'student' && (
        <PeerMemberDialog
          member={peerMember}
          open={!!peerMember}
          onOpenChange={(o) => !o && setPeerMember(null)}
          isSelf={peerMember?.id === currentStudentId}
          donorBalance={currentStudentBalance}
          projectName={remoteGroup.display_name}
          onSuccessDonation={loadGroupData}
        />
      )}

      {/* Modal editar membros e cargos (visão professor) */}
      {!isStudent && showEditGroupModal && (
        <TeacherEditGroupModal
          group={remoteGroup}
          open={showEditGroupModal}
          onOpenChange={setShowEditGroupModal}
          onUpdated={(updated) => {
            setRemoteGroup(updated);
            setSavedGroup(updated);
          }}
        />
      )}
    </motion.div>
  );
};

/* ---------------- Aba Atividades (Real) ---------------- */

const ActivitiesTab = ({
  group,
  setRemoteGroup,
  variant,
}: {
  group: IHubGroup;
  setRemoteGroup: React.Dispatch<React.SetStateAction<IHubGroup | null>>;
  variant: 'teacher' | 'student';
}) => {
  const isStudent = variant === 'student';
  const projectSteps = group.project?.project?.metadata?.steps || [];
  const customCategories = group.activity_categories || [];
  const deliveries = group.activities || [];

  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [uploadingForCat, setUploadingForCat] = useState<string | null>(null);
  const [annotation, setAnnotation] = useState(group.metadata?.annotation || '');
  const [savingAnnotation, setSavingAnnotation] = useState(false);

  const handleSaveAnnotation = async () => {
    try {
      setSavingAnnotation(true);
      await updateGroup({
        id: group.id,
        metadata: { ...(group.metadata || {}), annotation },
      });
      setRemoteGroup((g) => (g ? { ...g, metadata: { ...(g.metadata || {}), annotation } } : g));
      toast.success('Anotações salvas com sucesso!');
    } catch (err) {
      toast.error('Erro ao salvar anotações');
    } finally {
      setSavingAnnotation(false);
    }
  };

  // Criar categoria customizada
  const handleCreateCategory = async () => {
    if (!newCatTitle.trim()) return;
    try {
      const created = await addGroupActivityCategory({
        hub_group_id: group.id,
        title: newCatTitle.trim(),
        description: newCatDesc.trim() || undefined,
      });
      setRemoteGroup((g) => {
        if (!g) return g;
        return {
          ...g,
          activity_categories: [...(g.activity_categories || []), created],
        };
      });
      setNewCatTitle('');
      setNewCatDesc('');
      setNewCatOpen(false);
      toast.success('Categoria adicionada com sucesso!');
    } catch (err) {
      toast.error('Erro ao adicionar categoria');
    }
  };

  // Remover categoria customizada
  const handleRemoveCategory = async (catId: string) => {
    try {
      await removeGroupActivityCategory(catId);
      setRemoteGroup((g) => {
        if (!g) return g;
        return {
          ...g,
          activity_categories: (g.activity_categories || []).filter((c) => c.id !== catId),
        };
      });
      toast.success('Categoria removida');
    } catch (err) {
      toast.error('Erro ao remover categoria');
    }
  };

  // Upload e entrega de atividade
  const handleUploadDelivery = async (e: React.ChangeEvent<HTMLInputElement>, categoryId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.info('Enviando entrega...');
      const presigned = await getPresignedUrl(file.type || 'application/octet-stream', 'groups', 'public-read');
      await uploadFile(presigned.link, file);
      const file_url = `https://hub-files-hml.s3.amazonaws.com/${presigned.path}`;

      const created = await addGroupActivity({
        hub_group_id: group.id,
        hub_group_activity_category_id: categoryId,
        title: file.name,
        file_url,
      });

      setRemoteGroup((g) => {
        if (!g) return g;
        return {
          ...g,
          activities: [...(g.activities || []), created],
        };
      });
      toast.success('Atividade entregue com sucesso!');
    } catch (err) {
      console.error('Erro ao enviar atividade:', err);
      toast.error('Erro ao enviar anexo da atividade');
    } finally {
      e.target.value = '';
      setUploadingForCat(null);
    }
  };

  // Remover entrega
  const handleRemoveDelivery = async (activityId: string) => {
    try {
      await removeGroupActivity(activityId);
      setRemoteGroup((g) => {
        if (!g) return g;
        return {
          ...g,
          activities: (g.activities || []).filter((a) => a.id !== activityId),
        };
      });
      toast.success('Entrega removida');
    } catch (err) {
      toast.error('Erro ao remover entrega');
    }
  };

  return (
    <div className="space-y-8">
      {/* Etapas do Livro / Projeto PiCode */}
      {projectSteps.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Etapas do Projeto</h2>
            <span className="text-xs text-muted-foreground">({projectSteps.length} etapas)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projectSteps.map((step, idx) => (
              <div
                key={idx}
                className="glass-card p-4 space-y-2 border-l-4 rounded-xl"
                style={{ borderLeftColor: step.color || 'hsl(var(--primary))' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-foreground leading-snug">{step.title}</h4>
                  {step.cashback ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 tabular-nums shrink-0">
                      <Coins className="w-3.5 h-3.5" />
                      {step.cashback}
                    </span>
                  ) : null}
                </div>
                {step.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{step.description}</p>
                )}
                {step.parent && (
                  <span className="inline-block text-[10px] font-semibold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
                    {step.parent}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Categorias Customizadas e Entregas do Grupo */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Entregas e Atividades do Grupo</h2>
            <span className="text-xs text-muted-foreground">({deliveries.length} anexos)</span>
          </div>
          {!isStudent && (
            <button
              onClick={() => setNewCatOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:brightness-110 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Categoria
            </button>
          )}
        </div>

        {/* Modal criar categoria */}
        <Dialog open={newCatOpen} onOpenChange={setNewCatOpen}>
          <DialogContent className="max-w-md p-6 bg-card border-border/60">
            <DialogTitle className="text-base font-bold text-foreground">Adicionar Categoria de Atividade</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Crie uma categoria para organizar as entregas e anexos do grupo.
            </DialogDescription>
            <div className="space-y-3 mt-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Título</label>
                <input
                  value={newCatTitle}
                  onChange={(e) => setNewCatTitle(e.target.value)}
                  placeholder="Ex: Roteiro do Pitch / Fotos Protótipo"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border/60 bg-accent/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Descrição (opcional)</label>
                <textarea
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  rows={3}
                  placeholder="Instruções para os alunos..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border/60 bg-accent/30 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setNewCatOpen(false)}
                  className="px-4 py-2 text-sm rounded-xl text-muted-foreground hover:bg-accent"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateCategory}
                  disabled={!newCatTitle.trim()}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-50"
                >
                  Criar Categoria
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Lista de Categorias com Entregas */}
        {customCategories.length === 0 && deliveries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center bg-card/30">
            <Paperclip className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Nenhuma entrega registrada ainda</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isStudent ? 'Envie anexos e documentos do seu projeto.' : 'Crie categorias para solicitar entregas.'}
            </p>
            {isStudent && (
              <label className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold cursor-pointer hover:brightness-110 shadow-sm transition-all">
                <Paperclip className="w-3.5 h-3.5" />
                Anexar Arquivo
                <input type="file" className="hidden" onChange={(e) => handleUploadDelivery(e)} />
              </label>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {customCategories.map((cat) => {
              const catDeliveries = deliveries.filter((d) => d.hub_group_activity_category_id === cat.id);
              return (
                <div key={cat.id} className="rounded-2xl border border-border/50 bg-card/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{cat.title}</h3>
                      {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-semibold cursor-pointer transition-colors">
                        <Paperclip className="w-3 h-3" />
                        Entregar
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => handleUploadDelivery(e, cat.id)}
                        />
                      </label>
                      {!isStudent && (
                        <button
                          onClick={() => handleRemoveCategory(cat.id)}
                          className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Remover categoria"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {catDeliveries.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-2">Nenhuma entrega nesta categoria ainda.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {catDeliveries.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-border/40 bg-background/60"
                        >
                          <a
                            href={d.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 min-w-0 flex-1 hover:underline text-xs font-medium text-foreground truncate"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate">{d.title}</span>
                          </a>
                          <button
                            onClick={() => handleRemoveDelivery(d.id)}
                            className="p-1 rounded text-muted-foreground hover:text-destructive shrink-0"
                            title="Remover entrega"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Entregas avulsas (sem categoria) */}
            {deliveries.filter((d) => !d.hub_group_activity_category_id).length > 0 && (
              <div className="rounded-2xl border border-border/50 bg-card/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Outros Anexos</h3>
                  <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-semibold cursor-pointer transition-colors">
                    <Paperclip className="w-3 h-3" />
                    Novo Anexo
                    <input type="file" className="hidden" onChange={(e) => handleUploadDelivery(e)} />
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {deliveries
                    .filter((d) => !d.hub_group_activity_category_id)
                    .map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-border/40 bg-background/60"
                      >
                        <a
                          href={d.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 min-w-0 flex-1 hover:underline text-xs font-medium text-foreground truncate"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">{d.title}</span>
                        </a>
                        <button
                          onClick={() => handleRemoveDelivery(d.id)}
                          className="p-1 rounded text-muted-foreground hover:text-destructive shrink-0"
                          title="Remover entrega"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Anotações Gerais do Grupo */}
      <section className="glass-card rounded-2xl p-4 border border-border/50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-500" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Anotações Gerais do Grupo</h2>
          </div>
          <button
            onClick={handleSaveAnnotation}
            disabled={savingAnnotation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:brightness-110 shadow-sm transition-all disabled:opacity-50"
          >
            {savingAnnotation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Salvar Anotações
          </button>
        </div>
        <textarea
          value={annotation}
          onChange={(e) => setAnnotation(e.target.value)}
          placeholder="Registre aqui anotações, lembretes, ata de reuniões e ideias gerais do grupo..."
          rows={4}
          className="w-full p-3 text-xs sm:text-sm rounded-xl border border-border/60 bg-accent/20 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
        />
      </section>
    </div>
  );
};

/* ---------------- Kanban Board (Real) ---------------- */

const KanbanBoard = ({
  columns,
  setColumns,
  members,
}: {
  columns: KanbanColumn[];
  setColumns: (cols: KanbanColumn[]) => void;
  members: GroupMemberInfo[];
}) => {
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [activeColId, setActiveColId] = useState<string | null>(null);
  const [newTaskCol, setNewTaskCol] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<{ colId: string; card: KanbanCard } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current;
    if (data?.type === 'card') {
      setActiveCard(data.card);
      setActiveColId(data.columnId);
    }
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveCard(null);
    setActiveColId(null);
    if (!over) return;

    const activeCol = active.data.current?.columnId;
    const overType = over.data.current?.type;
    const overCol = overType === 'column' ? over.data.current?.columnId : over.data.current?.columnId;

    if (!activeCol || !overCol) return;

    if (activeCol === overCol) {
      if (active.id !== over.id) {
        setColumns(
          columns.map((c) => {
            if (c.id !== activeCol) return c;
            const oldIdx = c.cards.findIndex((i) => i.id === active.id);
            const newIdx = c.cards.findIndex((i) => i.id === over.id);
            return { ...c, cards: arrayMove(c.cards, oldIdx, newIdx) };
          })
        );
      }
    } else {
      const sourceCard = columns.find((c) => c.id === activeCol)?.cards.find((i) => i.id === active.id);
      if (!sourceCard) return;

      setColumns(
        columns.map((c) => {
          if (c.id === activeCol) {
            return { ...c, cards: c.cards.filter((i) => i.id !== active.id) };
          }
          if (c.id === overCol) {
            return { ...c, cards: [sourceCard, ...c.cards] };
          }
          return c;
        })
      );
    }
  };

  const handleCreateTask = ({ title, description, dueDate, assigneeIds }: any) => {
    const assignees = members
      .filter((m) => assigneeIds.includes(m.id))
      .map((m) => ({ initials: m.initials, color: m.color }));

    const newCard: KanbanCard = {
      id: `task-${Date.now()}`,
      title,
      description,
      dueDate,
      assignees,
    };

    setColumns(
      columns.map((c) => (c.id === (newTaskCol || 'todo') ? { ...c, cards: [newCard, ...c.cards] } : c))
    );
    setNewTaskCol(null);
  };

  const handleEditTask = ({ title, description, dueDate, assigneeIds }: any) => {
    if (!editingCard) return;
    const assignees = members
      .filter((m) => assigneeIds.includes(m.id))
      .map((m) => ({ initials: m.initials, color: m.color }));

    setColumns(
      columns.map((c) => {
        if (c.id !== editingCard.colId) return c;
        return {
          ...c,
          cards: c.cards.map((card) =>
            card.id === editingCard.card.id ? { ...card, title, description, dueDate, assignees } : card
          ),
        };
      })
    );
    setEditingCard(null);
  };

  const handleRemoveTask = (colId: string, cardId: string) => {
    setColumns(
      columns.map((c) => (c.id === colId ? { ...c, cards: c.cards.filter((i) => i.id !== cardId) } : c))
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => (
          <KanbanColumnView
            key={col.id}
            col={col}
            onOpenNew={() => setNewTaskCol(col.id)}
            onRemove={(cardId) => handleRemoveTask(col.id, cardId)}
            onEdit={(card) => setEditingCard({ colId: col.id, card })}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard && (
          <div className="glass-card p-3 rounded-2xl shadow-xl ring-2 ring-primary/40 opacity-90">
            <p className="text-sm font-semibold text-foreground">{activeCard.title}</p>
          </div>
        )}
      </DragOverlay>

      {/* Task Create Dialog */}
      <TaskDialog
        mode="create"
        open={newTaskCol !== null}
        onOpenChange={(o) => !o && setNewTaskCol(null)}
        members={members}
        onSubmit={handleCreateTask}
      />

      {/* Task Edit Dialog */}
      <TaskDialog
        mode="edit"
        open={editingCard !== null}
        onOpenChange={(o) => !o && setEditingCard(null)}
        members={members}
        initialTitle={editingCard?.card.title}
        initialDescription={editingCard?.card.description}
        initialDueDate={editingCard?.card.dueDate}
        initialAssigneeIds={editingCard?.card.assignees?.map((a) => members.find((m) => m.initials === a.initials)?.id || '').filter(Boolean)}
        onSubmit={handleEditTask}
      />
    </DndContext>
  );
};

const KanbanColumnView = ({
  col,
  onOpenNew,
  onRemove,
  onEdit,
}: {
  col: KanbanColumn;
  onOpenNew: () => void;
  onRemove: (cardId: string) => void;
  onEdit: (card: KanbanCard) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: col.id, data: { type: 'column', columnId: col.id } });

  return (
    <div
      ref={setNodeRef}
      className={`glass-card p-3 rounded-2xl flex flex-col min-h-[420px] transition-all ${
        isOver ? 'ring-2 ring-primary/40 bg-primary/5' : ''
      }`}
    >
      <div className="flex items-center justify-between px-2 py-1.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.accent }} />
          <h3 className="text-sm font-bold text-foreground">{col.title}</h3>
          <span className="text-xs text-muted-foreground bg-accent/50 px-1.5 py-0.5 rounded-md tabular-nums font-semibold">
            {col.cards.length}
          </span>
        </div>
        <button
          onClick={onOpenNew}
          className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Nova tarefa"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <SortableContext items={col.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5">
          {col.cards.map((card) => (
            <SortableKanbanCard
              key={card.id}
              card={card}
              columnId={col.id}
              accent={col.accent}
              onRemove={() => onRemove(card.id)}
              onEdit={() => onEdit(card)}
            />
          ))}
          {col.cards.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground border border-dashed border-border/40 rounded-xl">
              Nenhuma tarefa
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

const SortableKanbanCard = ({
  card,
  columnId,
  accent,
  onRemove,
  onEdit,
}: {
  card: KanbanCard;
  columnId: string;
  accent: string;
  onRemove: () => void;
  onEdit: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', columnId, card },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onEdit}
      className="group relative rounded-xl border border-border/50 bg-background/80 p-3 hover:border-primary/40 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">{card.title}</p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {card.description && (
        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">{card.description}</p>
      )}

      <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-border/40">
        <div className="flex items-center -space-x-1.5">
          {(card.assignees || []).map((a, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white ring-1 ring-card"
              style={{ backgroundColor: a.color }}
            >
              {a.initials}
            </div>
          ))}
        </div>
        {card.dueDate && (
          <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1 tabular-nums">
            <CalendarDays className="w-3 h-3 text-primary" />
            {new Date(card.dueDate).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>
    </div>
  );
};

/* Task create/edit dialog */
const TaskDialog = ({
  mode,
  open,
  onOpenChange,
  members,
  onSubmit,
  initialTitle = '',
  initialDescription = '',
  initialDueDate,
  initialAssigneeIds = [],
}: any) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [dueDate, setDueDate] = useState<Date | undefined>(initialDueDate ? new Date(initialDueDate) : undefined);
  const [assigneeIds, setAssigneeIds] = useState<string[]>(initialAssigneeIds);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setDescription(initialDescription);
      setDueDate(initialDueDate ? new Date(initialDueDate) : undefined);
      setAssigneeIds(initialAssigneeIds);
    }
  }, [open, initialTitle, initialDescription, initialDueDate, initialAssigneeIds]);

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const submit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      assigneeIds,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-card border-border/60">
        <DialogTitle className="text-base font-bold text-foreground">
          {mode === 'create' ? 'Nova Tarefa' : 'Editar Tarefa'}
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-1">
          Planejamento de atividades e metas do grupo.
        </DialogDescription>
        <div className="space-y-3.5 mt-4">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Montar circuito com Arduino"
              className="w-full px-3 py-2 text-sm rounded-xl border border-border/60 bg-accent/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detalhes sobre a entrega..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-border/60 bg-accent/30 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Responsáveis</label>
            <div className="flex flex-wrap gap-1.5">
              {members.map((m: any) => {
                const selected = assigneeIds.includes(m.id);
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => toggleAssignee(m.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                      selected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-accent/40 text-muted-foreground border-border/50 hover:bg-accent'
                    )}
                  >
                    <span>{m.initials}</span>
                    <span>{m.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm rounded-xl text-muted-foreground hover:bg-accent">
              Cancelar
            </button>
            <button
              onClick={submit}
              disabled={!title.trim()}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-50"
            >
              {mode === 'create' ? 'Criar Tarefa' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ---------------- Aba Itens do Grupo (Real) ---------------- */

const ItemsGrid = ({
  items,
  schoolId,
  group,
  reloadGroup,
  isTeacher,
  isStudent,
}: {
  items: GroupItem[];
  schoolId: string;
  group: IHubGroup;
  reloadGroup: () => Promise<void>;
  isTeacher: boolean;
  isStudent: boolean;
}) => {
  const [sellingItem, setSellingItem] = useState<GroupItem | null>(null);
  const [updatingServiceItem, setUpdatingServiceItem] = useState<GroupItem | null>(null);
  const [subType, setSubType] = useState<'consumables' | 'services'>('consumables');

  const consumableItems = useMemo(() => items.filter((i) => !i.is_service), [items]);
  const serviceItems = useMemo(() => items.filter((i) => !!i.is_service), [items]);
  const currentList = subType === 'consumables' ? consumableItems : serviceItems;

  return (
    <div className="space-y-4">
      {/* Switch Consumíveis / Serviços */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="glass-card rounded-2xl p-1 inline-flex gap-1">
          <button
            onClick={() => setSubType('consumables')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              subType === 'consumables'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent/50'
            }`}
          >
            Consumíveis ({consumableItems.length})
          </button>
          <button
            onClick={() => setSubType('services')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              subType === 'services'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent/50'
            }`}
          >
            Serviços ({serviceItems.length})
          </button>
        </div>
      </div>

      {currentList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center bg-card/30">
          <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-foreground">
            {subType === 'consumables' ? 'Nenhum item consumível adquirido' : 'Nenhum serviço contratado'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {subType === 'consumables'
              ? 'Os itens solicitados na Loja PiCode e aprovados pelo professor aparecerão aqui.'
              : 'As reservas de serviços do grupo aparecerão aqui.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentList.map((item) => {
            const consumed = item.order_item_metadata?.service_consumed_quantity || 0;
            const remaining = Math.max(0, item.quantity - consumed);
            const isCompleted = item.is_service && remaining === 0;

            return (
              <div
                key={item.id}
                className="glass-card rounded-2xl overflow-hidden border border-border/50 flex flex-col hover:border-primary/40 transition-all justify-between"
              >
                <div className="h-36 bg-accent/20 overflow-hidden relative">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-background/80 backdrop-blur-md border border-border/40">
                    {item.type}
                  </span>
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground shadow-sm">
                    {item.quantity}×
                  </span>
                  {isCompleted && (
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Finalizado
                    </span>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-bold text-foreground text-sm truncate">{item.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Unitário: <span className="font-semibold text-foreground">{formatCurrency(item.unitPrice)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total: <span className="font-bold text-primary">{formatCurrency(item.quantity * item.unitPrice)}</span>
                    </p>

                    {item.is_service && (
                      <div className="mt-2 p-2 rounded-xl bg-accent/30 text-xs space-y-1">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Consumido:</span>
                          <span className="font-semibold text-foreground">
                            {consumed} {item.store_item?.metadata?.unit || 'un'}
                          </span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Restante:</span>
                          <span className="font-bold text-primary">
                            {remaining} {item.store_item?.metadata?.unit || 'un'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ação do Aluno: Vender item consumível */}
                  {isStudent && !item.is_service && (
                    <button
                      onClick={() => setSellingItem(item)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      Vender item
                    </button>
                  )}

                  {/* Ação do Professor: Atualizar consumo de serviço */}
                  {isTeacher && item.is_service && (
                    <button
                      onClick={() => setUpdatingServiceItem(item)}
                      disabled={remaining === 0}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:brightness-110 shadow-sm transition-all disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {remaining === 0 ? 'Serviço Concluído' : 'Atualizar Consumo'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Vender Item */}
      {sellingItem && (
        <SellItemModal
          item={sellingItem}
          open={!!sellingItem}
          onOpenChange={(o) => !o && setSellingItem(null)}
          group={group}
          schoolId={schoolId}
          onSuccess={reloadGroup}
        />
      )}

      {/* Modal Atualizar Consumo de Serviço */}
      {updatingServiceItem && (
        <UpdateServiceModal
          item={updatingServiceItem}
          open={!!updatingServiceItem}
          onOpenChange={(o) => !o && setUpdatingServiceItem(null)}
          onSuccess={reloadGroup}
        />
      )}
    </div>
  );
};

/* Modal Professor Atualizar Consumo de Serviço */
const UpdateServiceModal = ({
  item,
  open,
  onOpenChange,
  onSuccess,
}: {
  item: GroupItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
}) => {
  const alreadyConsumed = item.order_item_metadata?.service_consumed_quantity || 0;
  const remaining = Math.max(0, item.quantity - alreadyConsumed);
  const unitLabel = item.store_item?.metadata?.unit || 'hora(s)';

  const [consumedQuantity, setConsumedQuantity] = useState(1);
  const [consumedAt, setConsumedAt] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (consumedQuantity <= 0 || consumedQuantity > remaining) return;
    try {
      setLoading(true);
      await updateOrderItem({
        item_id: item.orderItemId || item.hub_group_order_item_id || item.id,
        order_id: item.orderId || '',
        service_consumed_at: new Date(consumedAt),
        service_consumed_quantity: consumedQuantity,
      });
      toast.success('Consumo de serviço atualizado com sucesso!');
      await onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error('Erro ao atualizar consumo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-card border-border/60">
        <DialogTitle className="text-base font-bold text-foreground">
          Atualizar Consumo: {item.name}
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-1">
          Registre o uso de horas/unidades do serviço reservado pelo grupo.
        </DialogDescription>

        <div className="mt-4 space-y-4">
          <div className="p-3 rounded-xl bg-accent/30 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total contratado:</span>
              <span className="font-semibold text-foreground">
                {item.quantity} {unitLabel}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Já consumido:</span>
              <span className="font-semibold text-foreground">
                {alreadyConsumed} {unitLabel}
              </span>
            </div>
            <div className="flex justify-between text-primary font-bold pt-1 border-t border-border/40">
              <span>Saldo restante disponível:</span>
              <span>
                {remaining} {unitLabel}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Data do consumo</label>
            <input
              type="date"
              value={consumedAt}
              onChange={(e) => setConsumedAt(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border/60 bg-accent/30 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              Quantidade a descontar agora ({unitLabel})
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConsumedQuantity((q) => Math.max(1, q - 1))}
                disabled={consumedQuantity <= 1}
                className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-bold disabled:opacity-40"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={remaining}
                value={consumedQuantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (isNaN(val)) setConsumedQuantity(1);
                  else setConsumedQuantity(Math.min(remaining, Math.max(1, val)));
                }}
                className="flex-1 px-3 py-1.5 text-center text-sm font-bold rounded-xl border border-border/60 bg-accent/30"
              />
              <button
                type="button"
                onClick={() => setConsumedQuantity((q) => Math.min(remaining, q + 1))}
                disabled={consumedQuantity >= remaining}
                className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-bold disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-xs rounded-xl text-muted-foreground hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              onClick={handleUpdate}
              disabled={loading || consumedQuantity <= 0 || consumedQuantity > remaining}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Atualização'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* Modal Vender Item */
const SellItemModal = ({
  item,
  open,
  onOpenChange,
  group,
  schoolId,
  onSuccess,
}: {
  item: GroupItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: IHubGroup;
  schoolId: string;
  onSuccess: () => Promise<void>;
}) => {
  const [step, setStep] = useState<'choose' | 'teacher' | 'marketplace'>('choose');
  const [qty, setQty] = useState(1);

  // Depreciação de 20% para o professor e 10% recomendada para o marketplace
  const teacherUnitPrice = Math.round(Number(item.unitPrice || 0) * 0.8);
  const groupRecommendedUnitPrice = Math.round(Number(item.unitPrice || 0) * 0.9);

  const [teacherCustomPrice, setTeacherCustomPrice] = useState(teacherUnitPrice);
  const [marketplaceCustomPrice, setMarketplaceCustomPrice] = useState(groupRecommendedUnitPrice.toString());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTeacherCustomPrice(teacherUnitPrice);
    setMarketplaceCustomPrice(groupRecommendedUnitPrice.toString());
    setQty(1);
    setStep('choose');
  }, [item, open]);

  const handleSellToTeacher = async () => {
    try {
      setLoading(true);
      await resaleStockItem({
        hub_group_seller_id: group.id,
        store_maker_item_id: item.store_item?.id || item.id,
        hub_group_order_item_id: item.hub_group_order_item_id || item.orderItemId || item.id,
        hub_school_id: schoolId,
        quantity: qty,
        price: (qty * Number(teacherCustomPrice)).toFixed(2),
        metadata: { target_buyer: 'teacher' } as any,
      });
      toast.success('Solicitação de revenda enviada para aprovação do professor!');
      await onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error('Erro ao enviar pedido de revenda');
    } finally {
      setLoading(false);
    }
  };

  const handleSellToMarketplace = async () => {
    const parsed = parseFloat(marketplaceCustomPrice.replace(',', '.'));
    if (!parsed || parsed <= 0) return;
    try {
      setLoading(true);
      await resaleStockItem({
        hub_group_seller_id: group.id,
        store_maker_item_id: item.store_item?.id || item.id,
        hub_group_order_item_id: item.hub_group_order_item_id || item.orderItemId || item.id,
        hub_school_id: schoolId,
        quantity: qty,
        price: (qty * parsed).toFixed(2),
        metadata: { target_buyer: 'groups' } as any,
      });
      toast.success('Item publicado no Marketplace com sucesso!');
      await onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error('Erro ao publicar item no Marketplace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-card border-border/60">
        <DialogTitle className="text-base font-bold text-foreground">Vender Item: {item.name}</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-1">
          Escolha como deseja revender este item do grupo.
        </DialogDescription>

        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between text-xs bg-accent/30 p-2.5 rounded-xl border border-border/40">
            <span>Quantidade a vender:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center font-bold disabled:opacity-40"
              >
                -
              </button>
              <span className="font-bold tabular-nums">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(item.quantity, q + 1))}
                disabled={qty >= item.quantity}
                className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center font-bold disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>

          {step === 'choose' && (
            <div className="space-y-2.5">
              <button
                onClick={() => setStep('teacher')}
                className="w-full text-left p-3.5 rounded-2xl border border-border/60 hover:border-primary/50 bg-accent/20 hover:bg-accent/40 transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Vender ao professor</p>
                  <p className="text-xs text-muted-foreground">
                    Valor fixo de até 80% do preço original (-20% depreciação)
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => setStep('marketplace')}
                className="w-full text-left p-3.5 rounded-2xl border border-border/60 hover:border-primary/50 bg-accent/20 hover:bg-accent/40 transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Publicar no Marketplace</p>
                  <p className="text-xs text-muted-foreground">
                    Defina o valor livremente para vender a outros grupos (sugerido -10%)
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          )}

          {step === 'teacher' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-accent/30 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preço unitário original:</span>
                  <span className="font-semibold">{formatCurrency(item.unitPrice)}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>Depreciação:</span>
                  <span>-20%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preço recomendado:</span>
                  <span className="font-semibold text-foreground">{formatCurrency(teacherUnitPrice)}</span>
                </div>
                <div className="flex justify-between font-bold text-primary pt-1 border-t border-border/40">
                  <span>Total da revenda ({qty}×):</span>
                  <span>{formatCurrency(qty * teacherCustomPrice)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Valor unitário desejado (máx. {formatCurrency(teacherUnitPrice)})
                </label>
                <input
                  type="number"
                  min="1"
                  max={teacherUnitPrice}
                  value={teacherCustomPrice}
                  onChange={(e) => setTeacherCustomPrice(Math.min(teacherUnitPrice, Math.max(1, Number(e.target.value))))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border/60 bg-accent/30 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setStep('choose')} className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent rounded-xl">
                  Voltar
                </button>
                <button
                  onClick={handleSellToTeacher}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-50"
                >
                  Confirmar Venda ao Professor
                </button>
              </div>
            </div>
          )}

          {step === 'marketplace' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-accent/30 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preço original:</span>
                  <span>{formatCurrency(item.unitPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sugerido (-10%):</span>
                  <span className="font-semibold">{formatCurrency(groupRecommendedUnitPrice)}</span>
                </div>
                <div className="flex justify-between font-bold text-purple-600 dark:text-purple-400 pt-1 border-t border-border/40">
                  <span>Total no Marketplace ({qty}×):</span>
                  <span>{formatCurrency(qty * (parseFloat(marketplaceCustomPrice.replace(',', '.')) || 0))}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Preço unitário de venda (R$)</label>
                <input
                  type="number"
                  step="0.5"
                  value={marketplaceCustomPrice}
                  onChange={(e) => setMarketplaceCustomPrice(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border/60 bg-accent/30 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setStep('choose')} className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent rounded-xl">
                  Voltar
                </button>
                <button
                  onClick={handleSellToMarketplace}
                  disabled={loading || !parseFloat(marketplaceCustomPrice) || parseFloat(marketplaceCustomPrice) <= 0}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-50"
                >
                  Publicar no Marketplace
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* Modal de Divisão de Custos da Compra (Loja e Marketplace) */
const CheckoutSplitModal = ({
  open,
  onOpenChange,
  title,
  totalPrice,
  students,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  totalPrice: number;
  students: { id: string; name: string; avatar?: string; metadata?: { coins?: number } }[];
  onConfirm: () => Promise<void>;
  loading: boolean;
}) => {
  const count = students.length || 1;
  const splitAmount = totalPrice / count;

  // Verifica se alguém tem saldo <= 0 ou se ficaria negativo
  const hasMemberWithZeroCoins = students.some((s) => Number(s.metadata?.coins || 0) <= 0);
  const hasMemberWithInsufficient = students.some((s) => Number(s.metadata?.coins || 0) - splitAmount < 0);
  const isBlocked = hasMemberWithZeroCoins || hasMemberWithInsufficient;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-card border-border/60">
        <DialogTitle className="text-base font-bold text-foreground">{title}</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-1">
          O valor total será dividido igualmente entre todos os participantes do grupo.
        </DialogDescription>

        <div className="mt-4 space-y-4">
          {isBlocked ? (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Saldo insuficiente no grupo
              </p>
              <p>
                Um ou mais integrantes possuem saldo negativo ou zerado. Todos os membros devem possuir saldo suficiente para finalizar o pedido.
              </p>
              <p className="text-[11px] text-muted-foreground pt-1">
                Lembrando: colegas podem doar moedas na aba <b>Membros</b>.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-accent/30 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor total da compra:</span>
                <span className="font-bold text-foreground">{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-primary font-bold pt-1 border-t border-border/40">
                <span>Desconto por integrante ({count} membros):</span>
                <span>{formatCurrency(splitAmount)}</span>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {students.map((student) => {
              const currentCoins = Number(student.metadata?.coins || 0);
              const postCoins = currentCoins - splitAmount;
              const isStudentOk = currentCoins > 0 && postCoins >= 0;

              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-2 rounded-xl border border-border/40 bg-accent/20 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                    <div className="w-7 h-7 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[11px] shrink-0">
                      {student.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="truncate font-medium">{student.name}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 tabular-nums">
                    <span className={currentCoins > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-destructive font-semibold'}>
                      {formatCurrency(currentCoins)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className={isStudentOk ? 'text-foreground font-bold' : 'text-destructive font-bold'}>
                      {formatCurrency(postCoins)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-xs rounded-xl text-muted-foreground hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isBlocked || loading}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Pedido'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* Modal de Detalhes do Pedido */
const OrderDetailsModal = ({
  order,
  open,
  onOpenChange,
  isTeacher,
  onApprove,
  onReject,
  onChangeStatus,
}: {
  order: IHubGroupOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTeacher: boolean;
  onApprove: (order: IHubGroupOrder) => Promise<void>;
  onReject: (order: IHubGroupOrder) => Promise<void>;
  onChangeStatus: (order: IHubGroupOrder, status: any) => Promise<void>;
}) => {
  const [status, setStatus] = useState<string>(order?.metadata?.status || 'in_separation');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order) {
      setStatus(order.metadata?.status || 'in_separation');
    }
  }, [order]);

  if (!order) return null;

  const isPending = !order.approved_at && !order.metadata?.denied_at;
  const isApproved = !!order.approved_at;
  const isDenied = !!order.metadata?.denied_at;

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    await onChangeStatus(order, newStatus);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-card border-border/60 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-2">
          <div>
            <DialogTitle className="text-base font-bold text-foreground">
              Pedido #{order.readable_id || order.id.slice(0, 6)}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Solicitado em {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')} por{' '}
              <span className="font-semibold text-foreground">{order.student?.name || 'Aluno'}</span>
            </DialogDescription>
          </div>
          {isPending && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
              Pendente
            </span>
          )}
          {isApproved && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
              Aprovado
            </span>
          )}
          {isDenied && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">
              Recusado
            </span>
          )}
        </div>

        <div className="mt-4 space-y-4">
          <div className="space-y-2 border border-border/40 rounded-xl p-3 bg-accent/20">
            <h5 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Itens Solicitados</h5>
            {(order.items || []).map((it: any, idx: number) => {
              const product = it.store_item || it;
              const img = product.picture || product.image;
              const price = Number(order.metadata?.is_resale ? order.total : product.price || 0);

              return (
                <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                    {img && <img src={img} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />}
                    <div className="truncate">
                      <p className="font-medium truncate">{product.name || 'Item'}</p>
                      <p className="text-[11px] text-muted-foreground tabular-nums">
                        {it.quantity} × {formatCurrency(price)}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold tabular-nums ml-2">{formatCurrency(it.quantity * price)}</span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center px-1 text-sm font-bold">
            <span>Total do Pedido:</span>
            <span className="text-primary text-base">{formatCurrency(Number(order.total || 0))}</span>
          </div>

          {/* Seletor de Status pelo Professor para Pedido Aprovado */}
          {isApproved && isTeacher && (
            <div className="p-3 rounded-xl border border-border/50 bg-accent/30 space-y-2">
              <label className="text-xs font-semibold text-foreground block">Status de Entrega do Pedido:</label>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-border/60 bg-background text-foreground font-medium"
              >
                <option value="in_separation">Em separação</option>
                <option value="waiting_group">Aguardando retirada</option>
                <option value="delivered">Entregue</option>
                <option value="forgotten">Esquecido</option>
              </select>
            </div>
          )}

          {/* Ações do Professor em Pedido Pendente */}
          {isPending && isTeacher && (
            <div className="flex gap-2 pt-2 border-t border-border/40">
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    await onApprove(order);
                    onOpenChange(false);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="flex-1 py-2 rounded-xl bg-emerald-500 text-white font-semibold text-xs hover:brightness-110 shadow-sm disabled:opacity-50"
              >
                Aprovar Pedido
              </button>
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    await onReject(order);
                    onOpenChange(false);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="flex-1 py-2 rounded-xl bg-destructive text-destructive-foreground font-semibold text-xs hover:brightness-110 shadow-sm disabled:opacity-50"
              >
                Recusar Pedido
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DELIVERY_STATUS_MAP: Record<string, { label: string; color: string }> = {
  in_separation: { label: 'Em separação', color: 'bg-amber-500/20 text-amber-700 dark:text-amber-300' },
  waiting_group: { label: 'Aguardando retirada', color: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' },
  delivered: { label: 'Entregue', color: 'bg-primary/20 text-primary' },
  forgotten: { label: 'Esquecido', color: 'bg-muted text-muted-foreground' },
};

/* Quadro de pedidos real */
const OrdersBoardView = ({
  orders,
  isTeacher,
  onApprove,
  onReject,
  onChangeStatus,
}: {
  orders: IHubGroupOrder[];
  isTeacher: boolean;
  onApprove: (order: IHubGroupOrder) => Promise<void>;
  onReject: (order: IHubGroupOrder) => Promise<void>;
  onChangeStatus: (order: IHubGroupOrder, status: any) => Promise<void>;
}) => {
  const [selectedOrder, setSelectedOrder] = useState<IHubGroupOrder | null>(null);

  const pending = useMemo(
    () => orders.filter((o) => !o.approved_at && !o.metadata?.denied_at).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [orders]
  );
  const approved = useMemo(
    () => orders.filter((o) => !!o.approved_at).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [orders]
  );
  const denied = useMemo(
    () => orders.filter((o) => !!o.metadata?.denied_at).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [orders]
  );

  const renderColumn = (title: string, list: IHubGroupOrder[], color: string) => (
    <div className="rounded-2xl border border-border/50 bg-card/60 p-4 space-y-3" style={{ borderTop: `3px solid ${color}` }}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold" style={{ color }}>{title}</h4>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-accent">{list.length}</span>
      </div>

      <div className="space-y-2.5">
        {list.map((o) => {
          const statusInfo = DELIVERY_STATUS_MAP[o.metadata?.status || 'in_separation'];
          return (
            <div
              key={o.id}
              onClick={() => setSelectedOrder(o)}
              className="p-3 rounded-xl border border-border/40 bg-background/80 space-y-2 text-xs hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="font-bold text-foreground">#{o.readable_id || o.id.slice(0, 6)}</span>
                <span className="text-[11px]">{format(new Date(o.created_at), 'dd/MM/yy HH:mm')}</span>
              </div>

              <div className="space-y-1">
                {(o.items || []).slice(0, 2).map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center gap-2">
                    <span className="truncate pr-1 text-foreground">{it.store_item?.name || 'Item'}</span>
                    <span className="font-semibold tabular-nums shrink-0">{it.quantity}×</span>
                  </div>
                ))}
                {(o.items || []).length > 2 && (
                  <p className="text-[10px] text-muted-foreground italic">+{o.items.length - 2} outro(s) item(ns)</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                <span className="text-muted-foreground truncate">
                  por <span className="font-semibold text-foreground">{o.student?.name?.split(' ')[0] || 'Aluno'}</span>
                </span>
                <span className="font-bold text-primary tabular-nums">{formatCurrency(Number(o.total || 0))}</span>
              </div>

              {!!o.approved_at && (
                <div className="pt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
              )}
            </div>
          );
        })}
        {list.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">Nenhum pedido</p>}
      </div>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderColumn('Pendentes', pending, 'hsl(38 92% 50%)')}
        {renderColumn('Aprovados', approved, 'hsl(142 71% 45%)')}
        {renderColumn('Recusados', denied, 'hsl(0 72% 51%)')}
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          open={!!selectedOrder}
          onOpenChange={(open) => !open && setSelectedOrder(null)}
          isTeacher={isTeacher}
          onApprove={onApprove}
          onReject={onReject}
          onChangeStatus={onChangeStatus}
        />
      )}
    </>
  );
};

/* ---------------- Aba Loja Online & Pedidos & Marketplace (Real) ---------------- */

const SUB_TABS = ['Pedidos', 'Loja PiCode', 'Itens do grupo', 'Marketplace'] as const;
type SubTab = (typeof SUB_TABS)[number];

const StudentShop = ({
  group,
  groupBalance,
  items,
  members,
  stockMakerList,
  resaleList,
  onFinishOrder,
  onFinishResaleOrder,
  onApproveOrder,
  onRejectOrder,
  onChangeOrderStatus,
  canEdit,
  isTeacher,
  schoolId,
  reloadGroup,
  user,
  setUser,
}: any) => {
  const [subTab, setSubTab] = useState<SubTab>('Loja PiCode');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [purchasingResale, setPurchasingResale] = useState<IStoreMakerResale | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);

  // Catálogo real de itens da loja Maker
  const realStockItems = useMemo(() => {
    return (stockMakerList || []).filter((e: any) => !e.hub_user_id);
  }, [stockMakerList]);

  // Itens do Marketplace aprovados para grupos
  const marketplaceItems = useMemo(() => {
    return (resaleList || []).filter(
      (r: any) => !r.hub_group_buyer_id && r.metadata?.target_buyer === 'groups' && !!r.approved_at
    );
  }, [resaleList]);

  // Lista de interesses / desejos do aluno
  const userInterests = useMemo(() => {
    return ((user?.metadata?.store_interests || []) as string[]);
  }, [user]);

  // Restaurar carrinho salvo do usuário em user.metadata.cart[group.id]
  useEffect(() => {
    if (!group?.id) return;
    const savedCart = user?.metadata?.cart?.[group.id];
    if (savedCart && Array.isArray(savedCart)) {
      const restored: Record<string, number> = {};
      savedCart.forEach((it: any) => {
        const stockItem = realStockItems.find((s: any) => (s.store_item?.id || s.id) === it.id);
        if (stockItem && stockItem.quantity > 0) {
          restored[it.id] = Math.min(it.quantity, stockItem.quantity);
        }
      });
      setCart(restored);
    }
  }, [group?.id, realStockItems]);

  // Sincronizar carrinho com o perfil
  const syncCartWithProfile = (newCart: Record<string, number>) => {
    if (!group?.id) return;
    const cartPayload = Object.entries(newCart)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => ({ id, quantity: qty }));

    updateProfile({
      cart: {
        ...(user?.metadata?.cart || {}),
        [group.id]: cartPayload,
      },
    })
      .then((updated) => {
        if (setUser && updated) setUser(updated);
      })
      .catch(() => {});
  };

  // Alternar item na lista de desejos
  const handleToggleWishlist = async (storeMakerItemId: string) => {
    const isAlready = userInterests.includes(storeMakerItemId);
    const updated = isAlready
      ? userInterests.filter((id) => id !== storeMakerItemId)
      : [...userInterests, storeMakerItemId];

    try {
      const updatedUser = await updateProfile({ store_interests: updated });
      if (setUser && updatedUser) setUser(updatedUser);
      toast.success(isAlready ? 'Item removido da lista de desejos' : 'Item adicionado à lista de desejos');
    } catch {
      toast.error('Erro ao atualizar lista de desejos');
    }
  };

  // Itens selecionados no carrinho
  const cartItems = useMemo(() => {
    return realStockItems
      .filter((s: any) => (cart[s.store_item?.id || s.id] || 0) > 0)
      .map((s: any) => {
        const storeItem = s.store_item || s;
        const id = storeItem.id;
        return {
          id,
          store_item: storeItem,
          name: storeItem.name,
          price: Number(storeItem.price || 0),
          image: storeItem.picture || storeItem.image || 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400&h=400&fit=crop',
          qty: cart[id],
          availableStock: s.quantity,
        };
      });
  }, [realStockItems, cart]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((acc, it) => acc + it.price * it.qty, 0);
  }, [cartItems]);

  // Adicionar ao carrinho
  const addToCart = (item: any) => {
    const storeItem = item.store_item || item;
    const id = storeItem.id;
    const available = item.quantity;
    const current = cart[id] || 0;

    if (current + 1 > available) {
      toast.error('Limite do estoque atingido');
      return;
    }

    const next = { ...cart, [id]: current + 1 };
    setCart(next);
    syncCartWithProfile(next);
    toast.success('Item adicionado ao carrinho');
  };

  // Remover / Decrementar do carrinho
  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const next = { ...prev };
      if (!next[id]) return prev;
      next[id] -= 1;
      if (next[id] <= 0) delete next[id];
      syncCartWithProfile(next);
      return next;
    });
  };

  // Limpar carrinho
  const clearCart = () => {
    setCart({});
    syncCartWithProfile({});
  };

  // Confirmar compra da Loja PiCode
  const handleConfirmStoreOrder = async () => {
    try {
      setLoadingOrder(true);
      await onFinishOrder(cartItems.map((i) => ({ id: i.id, quantity: i.qty })));
      clearCart();
      setShowCheckoutModal(false);
      await reloadGroup();
      setSubTab('Pedidos');
    } catch {
      // toast shown in parent
    } finally {
      setLoadingOrder(false);
    }
  };

  // Confirmar compra do Marketplace
  const handleConfirmResaleOrder = async () => {
    if (!purchasingResale) return;
    try {
      setLoadingOrder(true);
      await onFinishResaleOrder([purchasingResale]);
      setPurchasingResale(null);
      await reloadGroup();
      setSubTab('Pedidos');
    } catch {
      // toast shown in parent
    } finally {
      setLoadingOrder(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="glass-card rounded-2xl p-1.5 inline-flex gap-1 flex-wrap">
        {SUB_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              subTab === t ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent/50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {subTab === 'Pedidos' && (
        <OrdersBoardView
          orders={group.orders || []}
          isTeacher={isTeacher}
          onApprove={onApproveOrder}
          onReject={onRejectOrder}
          onChangeStatus={onChangeOrderStatus}
        />
      )}

      {subTab === 'Loja PiCode' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {realStockItems.map((s: any) => {
              const item = s.store_item || s;
              const inCart = cart[item.id] || 0;
              const isService = !!item.metadata?.is_service;
              const isOutOfStock = s.quantity <= 0;
              const isInterest = userInterests.includes(item.id);

              return (
                <div
                  key={s.id || item.id}
                  className="glass-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <div className="h-36 bg-accent/20 overflow-hidden relative">
                    <img
                      src={item.picture || item.image || 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400&h=400&fit=crop'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-background/80 backdrop-blur-md">
                        {isService ? 'Serviço' : 'Consumível'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isOutOfStock ? 'bg-destructive/80 text-destructive-foreground' : 'bg-primary/80 text-primary-foreground'
                      }`}>
                        {isOutOfStock ? 'Item em falta' : `${s.quantity} em estoque`}
                      </span>
                    </div>

                    {/* Botão de Lista de Desejos (Interesse) para item esgotado */}
                    {isOutOfStock && !isTeacher && (
                      <button
                        onClick={() => handleToggleWishlist(item.id)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                        title={isInterest ? 'Remover da lista de desejos' : 'Adicionar à lista de desejos'}
                      >
                        <Heart className={`w-4 h-4 ${isInterest ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                      </button>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <div>
                      <h4 className="font-bold text-foreground text-sm truncate">{item.name}</h4>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description}</p>
                      )}
                    </div>

                    <p className="text-base font-bold text-primary tabular-nums">
                      {formatCurrency(Number(item.price || 0))}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      {isOutOfStock ? (
                        <div className="w-full text-center py-1.5 px-3 rounded-xl bg-accent/40 text-xs text-muted-foreground italic font-medium">
                          Indisponível no momento
                        </div>
                      ) : inCart === 0 ? (
                        <button
                          onClick={() => addToCart(s)}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:brightness-110 shadow-sm transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Adicionar ao Carrinho
                        </button>
                      ) : (
                        <div className="w-full flex items-center justify-between bg-accent/50 p-1 rounded-xl">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold tabular-nums">{inCart}</span>
                          <button
                            onClick={() => addToCart(s)}
                            className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Carrinho Lateral */}
          <aside className="lg:sticky lg:top-4 lg:self-start">
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Carrinho</h3>
                </div>
                {cartItems.length > 0 && (
                  <button onClick={clearCart} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                    Limpar
                  </button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">Nenhum item selecionado</p>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {cartItems.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-accent/30">
                      <div className="min-w-0 flex-1 truncate pr-2">
                        <p className="font-semibold truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground tabular-nums">
                          {item.qty} × {formatCurrency(item.price)}
                        </p>
                      </div>
                      <span className="font-bold tabular-nums">{formatCurrency(item.qty * item.price)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-border/50 pt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Saldo do grupo:</span>
                  <span className="font-semibold">{formatCurrency(groupBalance)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm">
                  <span>Total:</span>
                  <span className={cartTotal > groupBalance ? 'text-destructive' : 'text-primary'}>
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
                <button
                  onClick={() => setShowCheckoutModal(true)}
                  disabled={cartItems.length === 0 || cartTotal > groupBalance}
                  className="w-full mt-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:brightness-110 disabled:opacity-50 shadow-md transition-all"
                >
                  Finalizar Compra / Solicitar Pedido
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {subTab === 'Itens do grupo' && (
        <ItemsGrid
          items={items}
          schoolId={schoolId}
          group={group}
          reloadGroup={reloadGroup}
          isTeacher={isTeacher}
          isStudent={!isTeacher}
        />
      )}

      {subTab === 'Marketplace' && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Itens publicados por outros grupos para compra e revenda (aprovados pelo professor).
          </p>
          {marketplaceItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center text-xs text-muted-foreground bg-card/30">
              <Store className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              Nenhum item disponível no Marketplace atualmente.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {marketplaceItems.map((resale: any) => {
                const storeItem = resale.store_maker_item || {};
                const sellerName = resale.seller_group?.display_name || resale.group?.display_name || 'Outro Grupo';

                return (
                  <div key={resale.id} className="glass-card rounded-2xl overflow-hidden border border-border/50 flex flex-col justify-between hover:border-primary/40 transition-all">
                    <div className="h-36 bg-accent/20 overflow-hidden relative">
                      <img
                        src={storeItem.picture || 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400&h=400&fit=crop'}
                        alt={storeItem.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground shadow-sm">
                        {resale.quantity}× disponível
                      </span>
                    </div>

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-bold truncate text-foreground">{storeItem.name || 'Item Marketplace'}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Grupo Vendedor: <span className="font-semibold text-foreground">{sellerName}</span>
                        </p>
                        <p className="text-base font-bold text-primary mt-1">
                          {formatCurrency(Number(resale.price || 0))}
                        </p>
                      </div>

                      {!isTeacher && (
                        <button
                          onClick={() => setPurchasingResale(resale)}
                          className="w-full px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:brightness-110 shadow-sm transition-all"
                        >
                          Comprar Oferta
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Checkout da Loja PiCode */}
      {showCheckoutModal && (
        <CheckoutSplitModal
          open={showCheckoutModal}
          onOpenChange={setShowCheckoutModal}
          title="Finalizar Pedido - Loja PiCode"
          totalPrice={cartTotal}
          students={group.students || []}
          onConfirm={handleConfirmStoreOrder}
          loading={loadingOrder}
        />
      )}

      {/* Modal Checkout do Marketplace */}
      {purchasingResale && (
        <CheckoutSplitModal
          open={!!purchasingResale}
          onOpenChange={(open) => !open && setPurchasingResale(null)}
          title={`Comprar no Marketplace: ${purchasingResale.store_maker_item?.name || 'Item'}`}
          totalPrice={Number(purchasingResale.price || 0)}
          students={group.students || []}
          onConfirm={handleConfirmResaleOrder}
          loading={loadingOrder}
        />
      )}
    </div>
  );
};

/* ---------------- Aba Membros (Real) ---------------- */

const MembersList = ({
  members,
  onSelect,
  isTeacher,
  onEditGroup,
}: {
  members: GroupMemberInfo[];
  onSelect: (m: GroupMemberInfo) => void;
  isTeacher: boolean;
  onEditGroup: () => void;
}) => (
  <div className="space-y-4">
    {isTeacher && (
      <div className="flex justify-end">
        <button
          onClick={onEditGroup}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:brightness-110 shadow-sm"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Editar Grupo e Cargos
        </button>
      </div>
    )}

    <div className="space-y-2.5">
      {members.map((m, i) => {
        const roleColor = roleColors[m.role] || roleColors['Membro'];
        return (
          <button
            type="button"
            onClick={() => onSelect(m)}
            key={m.id}
            className="w-full text-left flex items-center gap-4 rounded-2xl border border-border/40 bg-card/60 px-4 py-3 hover:border-border hover:bg-card transition-all cursor-pointer"
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ backgroundColor: m.color }}
            >
              {m.initials}
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <h4 className="text-sm font-semibold text-foreground truncate">{m.name}</h4>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border"
                  style={{ backgroundColor: `${roleColor}15`, color: roleColor, borderColor: `${roleColor}35` }}
                >
                  {m.role}
                </span>
                <span className="text-xs text-muted-foreground">{m.username}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-sm font-bold tabular-nums">
                <Coins className="w-3.5 h-3.5" />
                {formatCurrency(m.balance)}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

/* Dialog doar moedas entre alunos */
const PeerMemberDialog = ({
  member,
  open,
  onOpenChange,
  isSelf,
  donorBalance,
  projectName,
  onSuccessDonation,
}: any) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  if (!member) return null;
  const parsed = parseFloat(amount.replace(',', '.')) || 0;
  const canDonate = parsed > 0 && parsed <= donorBalance;

  const handleDonate = async () => {
    if (!canDonate) return;
    try {
      setLoading(true);
      await makeDonation(member.id, parsed);
      toast.success(`Doação de ${formatCurrency(parsed)} enviada com sucesso para ${member.name}!`);
      await onSuccessDonation();
      onOpenChange(false);
    } catch (err) {
      toast.error('Erro ao realizar doação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-6 bg-card border-border/60 text-center">
        <div
          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-xl font-bold text-white shadow-md mb-2"
          style={{ backgroundColor: member.color }}
        >
          {member.initials}
        </div>
        <DialogTitle className="text-base font-bold text-foreground">{member.name}</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-0.5">{member.role}</DialogDescription>

        <div className="my-4 p-3 rounded-2xl bg-accent/30 text-xs flex justify-between items-center">
          <span className="text-muted-foreground">Saldo do colega:</span>
          <span className="font-bold text-foreground">{formatCurrency(member.balance)}</span>
        </div>

        {!isSelf && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block text-left">Valor a doar (R$)</label>
              <input
                type="number"
                step="1"
                min="1"
                max={donorBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 10"
                className="w-full px-3 py-2 text-sm rounded-xl border border-border/60 bg-accent/30 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <p className="text-[11px] text-muted-foreground mt-1 text-left">
                Seu saldo disponível: <span className="font-semibold text-foreground">{formatCurrency(donorBalance)}</span>
              </p>
            </div>
            <button
              onClick={handleDonate}
              disabled={!canDonate || loading}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:brightness-110 disabled:opacity-50"
            >
              Confirmar Doação
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

/* Modal Professor Editar Grupo e Membros */
const TeacherEditGroupModal = ({ group, open, onOpenChange, onUpdated }: any) => {
  const [displayName, setDisplayName] = useState(group.display_name || '');
  const [availableUsers, setAvailableUsers] = useState<IHubUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    (group.students || []).map((s: any) => s.id)
  );
  const [userRoles, setUserRoles] = useState<Record<string, string>>(() => {
    const roles: Record<string, string> = {};
    (group.students || []).forEach((s: any, idx: number) => {
      roles[s.id] = s.group_role || (idx === 0 ? 'Líder de Grupo' : 'Construtor');
    });
    return roles;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const projId = group.hub_project_class_id || group.project?.id;
      if (projId) {
        listAvailableUsersForGroupByProject(projId)
          .then((users) => {
            const all = [...(group.students || []), ...(users || [])];
            const unique = Array.from(new Map(all.map((u) => [u.id, u])).values());
            setAvailableUsers(unique);
          })
          .catch(() => setAvailableUsers(group.students || []));
      } else {
        setAvailableUsers(group.students || []);
      }
    }
  }, [open, group]);

  const toggleUser = (id: string) => {
    setSelectedUserIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      } else {
        if (prev.length >= 8) return prev;
        return [...prev, id];
      }
    });
  };

  const handleRoleChange = (id: string, role: string) => {
    setUserRoles((prev) => ({ ...prev, [id]: role }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updated = await updateGroup({
        id: group.id,
        display_name: displayName.trim(),
        users: selectedUserIds,
        user_roles: userRoles,
      });
      toast.success('Grupo e cargos atualizados!');
      onUpdated(updated);
      onOpenChange(false);
    } catch (err) {
      toast.error('Erro ao atualizar grupo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 bg-card border-border/60 max-h-[85vh] overflow-y-auto">
        <DialogTitle className="text-base font-bold text-foreground">Editar Grupo e Membros</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-1">
          Ajuste o nome do grupo e a distribuição de cargos da equipe.
        </DialogDescription>

        <div className="space-y-4 mt-4">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Nome do Grupo</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border/60 bg-accent/30 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-2 block">
              Membros ({selectedUserIds.length} selecionados, mín. 3 e máx. 8)
            </label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {availableUsers.map((u) => {
                const isSelected = selectedUserIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-border/40 bg-accent/20"
                  >
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer min-w-0 flex-1 truncate">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleUser(u.id)}
                        className="rounded border-border text-primary"
                      />
                      <span className="truncate">{u.display_name || u.name}</span>
                    </label>

                    {isSelected && (
                      <select
                        value={userRoles[u.id] || 'Construtor'}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="text-xs px-2 py-1 rounded-lg border border-border/60 bg-background text-foreground"
                      >
                        <option value="Líder de Grupo">Líder de Grupo</option>
                        <option value="Gestor de Projetos">Gestor de Projetos</option>
                        <option value="Social Media">Social Media</option>
                        <option value="Construtor">Construtor</option>
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
            <button onClick={() => onOpenChange(false)} className="px-4 py-2 text-xs rounded-xl text-muted-foreground hover:bg-accent">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={selectedUserIds.length < 3 || loading || !displayName.trim()}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-50"
            >
              Salvar Grupo
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupDetailView;
