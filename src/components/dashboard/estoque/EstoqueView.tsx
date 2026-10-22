import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Minus,
  BarChart3,
  Search,
  PackagePlus,
  Package,
  CheckCircle2,
  Clock,
  Save,
  Loader2,
  XCircle,
  Eye,
  Check,
  X,
  Layers,
  Wrench,
  Sparkles,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AddItemDialog, { NewItemPayload } from './AddItemDialog';
import { useUser } from '@/hooks/useUser';
import {
  getStockMaker,
  addItemInStockMaker,
  updateStockMaker,
  getStockResales,
  acceptResaleStockItem,
} from '@/_base/services/storeMaker';
import {
  listTeacherGroups,
  acceptOrder,
  rejectOrder,
  updateOrderStatus,
  updateOrderItem,
} from '@/_base/services/group';
import { getPresignedUrl, uploadFile } from '@/_base/services/upload';
import { updateChosenSchool } from '@/_base/services/user';
import { getNotifications } from '@/_base/services/notifications';
import { IStockMaker, IStoreMakerResale } from '@/_base/interfaces/storeMaker';
import {
  IHubGroup,
  IHubGroupOrder,
  HubOrderStatusType,
  hubOrderStatusTypes,
} from '@/_base/interfaces/group';
import { formatClassGrade, formatShortName } from '@/_base/utils';
import { toast } from 'sonner';

const tabs = ['Estoque', 'Solicitações de revenda', 'Reservas', 'Pedidos'] as const;
type TabType = (typeof tabs)[number];

const LABEL_STATUSES: Record<HubOrderStatusType, string> = {
  in_separation: 'Em separação',
  waiting_group: 'Aguardando retirada',
  delivered: 'Entregue',
  forgotten: 'Esquecido',
};

const EstoqueView = () => {
  const { user, chosenSchool } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('Estoque');

  // Stock state
  const [stock, setStock] = useState<IStockMaker[]>([]);
  const [unsavedStock, setUnsavedStock] = useState<IStockMaker[]>([]);
  const [groups, setGroups] = useState<IHubGroup[]>([]);
  const [resales, setResales] = useState<IStoreMakerResale[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [metricsItem, setMetricsItem] = useState<IStockMaker | null>(null);

  // Resale modal state
  const [selectedResale, setSelectedResale] = useState<IStoreMakerResale | null>(null);

  // Reserves sub-tab & update state
  const [reserveTab, setReserveTab] = useState<'consumables' | 'services'>('services');
  const [serviceToUpdate, setServiceToUpdate] = useState<any | null>(null);
  const [serviceConsumedQty, setServiceConsumedQty] = useState<number>(1);
  const [serviceConsumedDate, setServiceConsumedDate] = useState<string>('');
  const [isUpdatingService, setIsUpdatingService] = useState(false);

  // Orders modal state
  const [selectedOrder, setSelectedOrder] = useState<IHubGroupOrder | null>(null);
  const [orderStatusSelection, setOrderStatusSelection] = useState<HubOrderStatusType>('in_separation');

  // Helper getters for robust IStockMaker handling
  const getItemName = useCallback((s: IStockMaker): string => {
    return (
      (s.hub_user_id ? s.metadata?.name : s.store_item?.name) ||
      s.metadata?.name ||
      s.store_item?.name ||
      'Item sem nome'
    );
  }, []);

  const getItemImage = useCallback((s: IStockMaker): string => {
    return (
      (s.hub_user_id ? s.metadata?.image : s.store_item?.picture) ||
      s.metadata?.image ||
      s.store_item?.picture ||
      '/scratch/default_project.png'
    );
  }, []);

  const getIsService = useCallback((s: IStockMaker): boolean => {
    return Boolean(s.store_item?.metadata?.is_service || s.metadata?.is_service);
  }, []);

  const activeSchoolId = useMemo(() => {
    return chosenSchool?.hub_school_id || user?.chosen_school_id || user?.schools?.[0]?.hub_school_id;
  }, [chosenSchool, user]);

  // Load all data robustly in parallel
  const loadData = useCallback(async () => {
    const schoolId = activeSchoolId;
    try {
      setLoading(true);

      // Ensure chosen_school_id is active on backend session if missing
      if (user && !user.chosen_school_id && schoolId) {
        try {
          await updateChosenSchool(schoolId);
        } catch (e) {
          console.warn('Erro ao atualizar escola ativa na sessão:', e);
        }
      }

      const [stockRes, groupsRes, resalesRes, notifRes] = await Promise.allSettled([
        getStockMaker(),
        schoolId ? listTeacherGroups(schoolId) : Promise.resolve([]),
        schoolId ? getStockResales(schoolId) : Promise.resolve([]),
        schoolId ? getNotifications(schoolId) : Promise.resolve(null),
      ]);

      let stockList: IStockMaker[] = [];
      if (stockRes.status === 'fulfilled') {
        const val = stockRes.value;
        stockList = Array.isArray(val) ? val : ((val as any)?.results || (val as any)?.data || []);
      }
      if (stockList.length === 0 && notifRes.status === 'fulfilled' && (notifRes.value as any)?.stocks?.length) {
        stockList = (notifRes.value as any).stocks;
      }
      setStock(stockList);
      setUnsavedStock(stockList);

      if (groupsRes.status === 'fulfilled') {
        const gVal = groupsRes.value;
        const gList = Array.isArray(gVal) ? gVal : ((gVal as any)?.results || []);
        setGroups(gList);
      } else {
        setGroups([]);
      }

      if (resalesRes.status === 'fulfilled') {
        const rVal = resalesRes.value;
        const rList = Array.isArray(rVal) ? rVal : ((rVal as any)?.results || []);
        setResales(rList);
      } else {
        setResales([]);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do estoque:', err);
      toast.error('Não foi possível carregar os dados do estoque.');
    } finally {
      setLoading(false);
    }
  }, [activeSchoolId, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Detect unsaved stock changes
  const needSave = useMemo(() => {
    return JSON.stringify(unsavedStock) !== JSON.stringify(stock);
  }, [unsavedStock, stock]);

  // Save stock alterations
  const handleSaveStock = async () => {
    try {
      setIsSaving(true);
      await updateStockMaker({
        items: stock.map((s) => ({ id: s.id, quantity: s.quantity })),
      });
      setUnsavedStock(stock);
      toast.success('Estoque salvo com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar estoque:', err);
      toast.error('Erro ao salvar estoque no servidor');
    } finally {
      setIsSaving(false);
    }
  };

  // Add Item to Stock
  const handleAddItem = async (payload: NewItemPayload) => {
    try {
      setIsSaving(true);
      let imagePath = payload.image || '';

      if (payload.file) {
        try {
          const presigned = await getPresignedUrl(payload.file.type || 'image/png', 'store-maker');
          await uploadFile(presigned.link, payload.file);
          imagePath = presigned.path;
        } catch (uploadErr) {
          console.warn('Erro ao fazer upload da imagem:', uploadErr);
        }
      }

      const newItem = await addItemInStockMaker({
        name: payload.name,
        quantity: payload.quantity,
        reusable: payload.reusable,
        is_service: payload.isService,
        image: imagePath,
        hub_school_id: activeSchoolId || '',
      });

      setStock((prev) => [...prev, newItem]);
      setUnsavedStock((prev) => [...prev, newItem]);
      toast.success('Item adicionado ao estoque!');
    } catch (err) {
      console.error('Erro ao adicionar item:', err);
      toast.error('Erro ao adicionar item no servidor');
    } finally {
      setIsSaving(false);
    }
  };

  // Quantity handlers
  const handleQuantityChange = (id: string, delta: number) => {
    setStock((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, quantity: Math.max(0, item.quantity + delta) };
        }
        return item;
      })
    );
  };

  const handleQuantityInput = (id: string, value: string) => {
    const qty = Math.max(0, parseInt(value.replace(/\D/g, '') || '0', 10));
    setStock((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: qty } : item))
    );
  };

  // Filtered & sorted stock items
  const filteredStock = useMemo(() => {
    return stock
      .filter((item) =>
        getItemName(item).toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) =>
        getItemName(a).localeCompare(getItemName(b), undefined, { sensitivity: 'base' })
      );
  }, [stock, searchQuery, getItemName]);

  // Resale Tab actions
  const pendingResales = useMemo(() => {
    return resales.filter((r) => !r.approved_at);
  }, [resales]);

  const handleAcceptResale = async (resaleId: string) => {
    try {
      await acceptResaleStockItem(resaleId);
      setResales((prev) => prev.filter((r) => r.id !== resaleId));
      setSelectedResale(null);
      toast.success('Revenda aceita com sucesso!');
      await loadData();
    } catch (err) {
      console.error('Erro ao aceitar revenda:', err);
      toast.error('Erro ao aceitar revenda');
    }
  };

  // Reserves Tab derived items
  const approvedOrders = useMemo(() => {
    return groups
      .flatMap((g) => (g.orders || []).map((o) => ({ ...o, group: g })))
      .filter((o) => !!o.approved_at);
  }, [groups]);

  const reservedConsumables = useMemo(() => {
    return approvedOrders
      .flatMap((order) =>
        (order.items || []).map((orderItem) => ({
          ...order,
          ...orderItem,
          order_item_id: orderItem.id,
          order_id: order.id,
          group: order.group,
          store_item: orderItem.store_item,
          order_item_metadata: orderItem.metadata,
        }))
      )
      .filter((item) => !item.store_item?.metadata?.is_service)
      .reduce((acc, v) => {
        if (!v.quantity) return acc;
        const target = acc.find(
          (e) => e.store_maker_item_id === v.store_maker_item_id && e.order_id === v.order_id
        );
        if (target) {
          target.quantity += v.quantity;
        } else {
          acc.push({ ...v });
        }
        return acc;
      }, [] as any[]);
  }, [approvedOrders]);

  const reservedServices = useMemo(() => {
    return approvedOrders
      .flatMap((order) =>
        (order.items || []).map((orderItem) => ({
          ...order,
          ...orderItem,
          order_item_id: orderItem.id,
          order_id: order.id,
          group: order.group,
          store_item: orderItem.store_item,
          order_item_metadata: orderItem.metadata,
        }))
      )
      .filter((item) => !!item.store_item?.metadata?.is_service);
  }, [approvedOrders]);

  const handleUpdateServiceConsumption = async () => {
    if (!serviceToUpdate) return;
    try {
      setIsUpdatingService(true);
      await updateOrderItem({
        item_id: serviceToUpdate.order_item_id,
        order_id: serviceToUpdate.order_id,
        service_consumed_at: serviceConsumedDate ? new Date(serviceConsumedDate) : null,
        service_consumed_quantity: serviceConsumedQty,
      });
      toast.success('Consumo do serviço atualizado!');
      setServiceToUpdate(null);
      await loadData();
    } catch (err) {
      console.error('Erro ao atualizar consumo do serviço:', err);
      toast.error('Erro ao atualizar consumo do serviço');
    } finally {
      setIsUpdatingService(false);
    }
  };

  // Orders Tab derived data
  const allOrders = useMemo(() => {
    return groups
      .flatMap((g) => (g.orders || []).map((o) => ({ ...o, group: g })))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [groups]);

  const pendingOrders = useMemo(
    () => allOrders.filter((o) => !o.approved_at && !o.metadata?.denied_at),
    [allOrders]
  );
  const approvedOrdersList = useMemo(
    () => allOrders.filter((o) => !!o.approved_at),
    [allOrders]
  );
  const deniedOrdersList = useMemo(
    () => allOrders.filter((o) => !!o.metadata?.denied_at),
    [allOrders]
  );

  const handleApproveOrder = async (order: IHubGroupOrder) => {
    try {
      await acceptOrder({ order_id: order.id, group_id: order.hub_group_id });
      setSelectedOrder(null);
      toast.success('Pedido aprovado com sucesso!');
      await loadData();
    } catch (err) {
      console.error('Erro ao aprovar pedido:', err);
      toast.error('Erro ao aprovar pedido');
    }
  };

  const handleRejectOrder = async (order: IHubGroupOrder) => {
    try {
      await rejectOrder({ order_id: order.id, group_id: order.hub_group_id });
      setSelectedOrder(null);
      toast.success('Pedido negado!');
      await loadData();
    } catch (err) {
      console.error('Erro ao negar pedido:', err);
      toast.error('Erro ao negar pedido');
    }
  };

  const handleStatusChange = async (order: IHubGroupOrder, newStatus: HubOrderStatusType) => {
    try {
      await updateOrderStatus({ order_id: order.id, status: newStatus });
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === order.hub_group_id) {
            return {
              ...g,
              orders: (g.orders || []).map((o) =>
                o.id === order.id
                  ? { ...o, metadata: { ...o.metadata, status: newStatus } }
                  : o
              ),
            };
          }
          return g;
        })
      );
      setSelectedOrder(null);
      toast.success('Status do pedido atualizado!');
    } catch (err) {
      console.error('Erro ao atualizar status do pedido:', err);
      toast.error('Erro ao atualizar status do pedido');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6 pb-12"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Estoque Maker</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gerencie peças, sensores, serviços, solicitações de revenda e pedidos dos alunos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'Estoque' && (
            <>
              <button
                onClick={handleSaveStock}
                disabled={isSaving || !needSave}
                className={`flex items-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm ${
                  needSave
                    ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                    : 'border border-border/80 text-muted-foreground hover:bg-accent disabled:opacity-50'
                }`}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{needSave ? 'Salvar Alterações *' : 'Salvar'}</span>
              </button>

              <button
                onClick={() => setAddOpen(true)}
                className="apple-btn flex items-center gap-2 text-xs py-2.5 px-4"
              >
                <PackagePlus className="w-4 h-4" />
                <span>Adicionar Item</span>
              </button>
            </>
          )}
        </div>
      </div>

      <AddItemDialog open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAddItem} />

      {/* Tabs */}
      <div className="glass-card rounded-2xl p-1.5 inline-flex gap-1 border border-border/50">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
            }`}
          >
            {tab}
            {tab === 'Solicitações de revenda' && pendingResales.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500 text-white font-bold">
                {pendingResales.length}
              </span>
            )}
            {tab === 'Pedidos' && pendingOrders.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-primary-foreground/20 text-white font-bold">
                {pendingOrders.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: ESTOQUE */}
      {activeTab === 'Estoque' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome do componente..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-card border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm transition-all"
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm">Carregando itens do estoque Maker...</p>
            </div>
          ) : filteredStock.length === 0 ? (
            <div className="glass-card rounded-3xl p-14 text-center border border-border/50">
              <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-base font-semibold text-foreground">Nenhum componente encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Adicione novos componentes para que fiquem disponíveis na loja Maker.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredStock.map((item) => {
                const name = getItemName(item);
                const image = getItemImage(item);
                const isService = getIsService(item);

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-4 rounded-2xl border border-border/60 flex flex-col justify-between hover:shadow-lg transition-all duration-200"
                  >
                    <div>
                      {/* Thumbnail */}
                      <div
                        className="aspect-square rounded-xl overflow-hidden mb-3 bg-muted/40 cursor-pointer relative group flex items-center justify-center border border-border/30"
                        onClick={() => setExpandedImage(image)}
                      >
                        <img
                          src={image}
                          alt={name}
                          className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/scratch/default_project.png';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                      </div>

                      {/* Header & Badges */}
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-tight" title={name}>
                          {name}
                        </h3>
                      </div>

                      {isService && (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20 mb-2">
                          Serviço
                        </span>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                      {isService ? (
                        <span className="text-xs text-muted-foreground font-medium">Controle de Horas</span>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/40">
                          <button
                            onClick={() => handleQuantityChange(item.id, -1)}
                            className="w-7 h-7 rounded-lg bg-card hover:bg-accent flex items-center justify-center text-foreground transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="text"
                            value={item.quantity}
                            onChange={(e) => handleQuantityInput(item.id, e.target.value)}
                            className="w-10 text-center text-xs font-bold text-foreground bg-transparent border-0 focus:outline-none tabular-nums"
                          />
                          <button
                            onClick={() => handleQuantityChange(item.id, 1)}
                            className="w-7 h-7 rounded-lg bg-card hover:bg-accent flex items-center justify-center text-foreground transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => setMetricsItem(item)}
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span className="font-medium">Métricas</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SOLICITAÇÕES DE REVENDA */}
      {activeTab === 'Solicitações de revenda' && (
        <div className="space-y-4">
          {pendingResales.length === 0 ? (
            <div className="glass-card rounded-3xl p-14 text-center border border-border/50">
              <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mx-auto mb-3" />
              <p className="text-base font-semibold text-foreground">Nenhuma solicitação de revenda pendente</p>
              <p className="text-xs text-muted-foreground mt-1">
                Todas as solicitações de revenda dos grupos foram analisadas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingResales.map((resale) => (
                <div
                  key={resale.id}
                  className="glass-card p-5 rounded-2xl border border-border/60 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="flex gap-4">
                    <img
                      src={resale.store_maker_item?.picture || '/scratch/default_project.png'}
                      alt={resale.store_maker_item?.name}
                      className="w-20 h-20 rounded-xl object-contain bg-muted/40 p-1 border border-border/40"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 flex-wrap">
                        <h4 className="font-semibold text-sm text-foreground line-clamp-1">
                          {resale.store_maker_item?.name || 'Componente Maker'}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          Pendente
                        </span>
                      </div>
                      <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        resale.metadata?.target_buyer === 'teacher'
                          ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                          : 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
                      }`}>
                        {resale.metadata?.target_buyer === 'teacher'
                          ? 'Venda para o Professor (Retorna ao Estoque)'
                          : 'Venda para Grupos (Marketplace)'}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Grupo: <span className="font-medium text-foreground">{resale.seller_group?.display_name || 'Grupo'}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Qtd: <span className="font-medium text-foreground">{resale.quantity} un.</span>
                      </p>
                      <p className="text-xs font-semibold text-primary mt-1">
                        R$ {resale.price}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedResale(resale)}
                      className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                    >
                      Ver detalhes
                    </button>
                    <button
                      onClick={() => handleAcceptResale(resale.id)}
                      className="text-xs px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-sm"
                    >
                      Aprovar Revenda
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RESERVAS */}
      {activeTab === 'Reservas' && (
        <div className="space-y-4">
          {/* Sub-tab Switch */}
          <div className="flex gap-2">
            <button
              onClick={() => setReserveTab('services')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                reserveTab === 'services'
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              Serviços ({reservedServices.length})
            </button>
            <button
              onClick={() => setReserveTab('consumables')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                reserveTab === 'consumables'
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              Consumíveis ({reservedConsumables.length})
            </button>
          </div>

          {reserveTab === 'consumables' ? (
            reservedConsumables.length === 0 ? (
              <div className="glass-card rounded-3xl p-14 text-center border border-border/50">
                <Clock className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-base font-semibold text-foreground">Nenhuma reserva de consumíveis</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Itens consumíveis aprovados em pedidos de grupos aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {reservedConsumables.map((item, idx) => (
                  <div key={idx} className="glass-card p-4 rounded-2xl border border-border/60">
                    <div className="aspect-video rounded-xl bg-muted/40 p-2 mb-3 flex items-center justify-center">
                      <img
                        src={item.store_item?.picture || '/scratch/default_project.png'}
                        alt={item.store_item?.name}
                        className="max-h-full object-contain"
                      />
                    </div>
                    <h4 className="font-semibold text-sm text-foreground line-clamp-1">{item.store_item?.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">Grupo: {item.group?.display_name}</p>
                    <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Reservado:</span>
                      <span className="text-xs font-bold text-foreground">{item.quantity} un.</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            reservedServices.length === 0 ? (
              <div className="glass-card rounded-3xl p-14 text-center border border-border/50">
                <Wrench className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-base font-semibold text-foreground">Nenhum serviço em aberto</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Serviços contratados por grupos aparecerão aqui para acompanhamento do consumo.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reservedServices.map((item, idx) => {
                  const consumed = item.order_item_metadata?.service_consumed_quantity || 0;
                  const total = item.quantity || 1;
                  const remaining = Math.max(0, total - consumed);

                  return (
                    <div key={idx} className="glass-card p-5 rounded-2xl border border-border/60 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-sm text-foreground">{item.store_item?.name}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                            Serviço
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Grupo: {item.group?.display_name}</p>
                        <p className="text-xs text-muted-foreground">Solicitante: {item.student?.name}</p>

                        <div className="mt-4 p-3 rounded-xl bg-muted/40 border border-border/40 space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Contratado:</span>
                            <span className="font-semibold text-foreground">{total}h</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Consumido:</span>
                            <span className="font-semibold text-amber-500">{consumed}h</span>
                          </div>
                          <div className="flex justify-between text-xs font-semibold">
                            <span>Restante:</span>
                            <span className={remaining > 0 ? 'text-emerald-500' : 'text-muted-foreground'}>
                              {remaining}h
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/40 flex justify-end">
                        <button
                          onClick={() => {
                            setServiceToUpdate(item);
                            setServiceConsumedQty(consumed);
                            setServiceConsumedDate(new Date().toISOString().split('T')[0]);
                          }}
                          className="text-xs px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all"
                        >
                          Atualizar Consumo
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}

      {/* TAB 4: PEDIDOS */}
      {activeTab === 'Pedidos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pendentes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b-2 border-amber-500">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <span>Pendentes</span>
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white">
                  {pendingOrders.length}
                </span>
              </h3>
            </div>

            {pendingOrders.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">Nenhum pedido pendente</p>
            ) : (
              pendingOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => {
                    setSelectedOrder(order);
                    setOrderStatusSelection(order.metadata?.status || 'in_separation');
                  }}
                  className="glass-card p-4 rounded-2xl border border-border/60 hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer space-y-3"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-amber-500">#{order.readable_id || order.id.slice(0, 6)}</span>
                    <span className="text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {order.items?.slice(0, 2).map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-xs">
                        <img
                          src={item.store_item?.picture || '/scratch/default_project.png'}
                          alt={item.store_item?.name}
                          className="w-7 h-7 rounded-lg object-contain bg-muted/40 p-0.5"
                        />
                        <span className="flex-1 truncate text-foreground">{item.store_item?.name}</span>
                        <span className="text-muted-foreground">{item.quantity}x</span>
                      </div>
                    ))}
                    {(order.items?.length || 0) > 2 && (
                      <p className="text-[11px] text-muted-foreground italic">
                        +{order.items.length - 2} outro(s) item(ns)
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border/40 flex justify-between items-center text-xs">
                    <span className="text-muted-foreground truncate max-w-[140px]">
                      {order.group?.display_name || order.student?.name}
                    </span>
                    <span className="font-bold text-foreground">R$ {order.total}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Aprovados */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b-2 border-emerald-500">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <span>Aprovados</span>
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-500 text-white">
                  {approvedOrdersList.length}
                </span>
              </h3>
            </div>

            {approvedOrdersList.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">Nenhum pedido aprovado</p>
            ) : (
              approvedOrdersList.map((order) => (
                <div
                  key={order.id}
                  onClick={() => {
                    setSelectedOrder(order);
                    setOrderStatusSelection(order.metadata?.status || 'in_separation');
                  }}
                  className="glass-card p-4 rounded-2xl border border-border/60 hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer space-y-3"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-emerald-500">#{order.readable_id || order.id.slice(0, 6)}</span>
                    <span className="text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {order.items?.slice(0, 2).map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-xs">
                        <img
                          src={item.store_item?.picture || '/scratch/default_project.png'}
                          alt={item.store_item?.name}
                          className="w-7 h-7 rounded-lg object-contain bg-muted/40 p-0.5"
                        />
                        <span className="flex-1 truncate text-foreground">{item.store_item?.name}</span>
                        <span className="text-muted-foreground">{item.quantity}x</span>
                      </div>
                    ))}
                    {(order.items?.length || 0) > 2 && (
                      <p className="text-[11px] text-muted-foreground italic">
                        +{order.items.length - 2} outro(s) item(ns)
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border/40 flex justify-between items-center text-xs">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                      {LABEL_STATUSES[order.metadata?.status as HubOrderStatusType] || 'Em separação'}
                    </span>
                    <span className="font-bold text-foreground">R$ {order.total}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Negados */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b-2 border-red-500">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <span>Negados</span>
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white">
                  {deniedOrdersList.length}
                </span>
              </h3>
            </div>

            {deniedOrdersList.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">Nenhum pedido negado</p>
            ) : (
              deniedOrdersList.map((order) => (
                <div
                  key={order.id}
                  onClick={() => {
                    setSelectedOrder(order);
                    setOrderStatusSelection(order.metadata?.status || 'in_separation');
                  }}
                  className="glass-card p-4 rounded-2xl border border-border/60 hover:border-red-500/50 hover:shadow-md transition-all cursor-pointer space-y-3 opacity-75"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-red-500">#{order.readable_id || order.id.slice(0, 6)}</span>
                    <span className="text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {order.items?.slice(0, 2).map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-xs">
                        <img
                          src={item.store_item?.picture || '/scratch/default_project.png'}
                          alt={item.store_item?.name}
                          className="w-7 h-7 rounded-lg object-contain bg-muted/40 p-0.5"
                        />
                        <span className="flex-1 truncate text-foreground">{item.store_item?.name}</span>
                        <span className="text-muted-foreground">{item.quantity}x</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-border/40 flex justify-between items-center text-xs">
                    <span className="text-red-500 font-medium">Rejeitado</span>
                    <span className="font-bold text-foreground">R$ {order.total}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* METRICS MODAL */}
      <Dialog open={!!metricsItem} onOpenChange={() => setMetricsItem(null)}>
        <DialogContent className="max-w-2xl bg-card border border-border/60 rounded-3xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-foreground">
              {metricsItem ? getItemName(metricsItem) : ''} · Métricas de Interesse
            </DialogTitle>
          </DialogHeader>

          {metricsItem && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* No Carrinho */}
              <div className="glass-card p-4 rounded-2xl border border-border/50">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  No Carrinho ({metricsItem.cart_additions?.length || 0})
                </h4>
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {(metricsItem.cart_additions?.length || 0) === 0 ? (
                    <p className="text-xs text-muted-foreground py-6 text-center">Nenhum aluno com o item no carrinho</p>
                  ) : (
                    metricsItem.cart_additions?.map((student) => (
                      <div key={student.id} className="p-2.5 rounded-xl bg-muted/30 border border-border/40 text-xs">
                        <div className="flex justify-between items-center font-semibold text-foreground">
                          <span>{formatShortName(student.name, true)}</span>
                          <span className="text-primary font-bold">{formatClassGrade(student.grade)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-muted-foreground mt-0.5">
                          <span>{student.group_name || 'Individual'}</span>
                          <span>{student.class_name}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Demonstrou Interesse */}
              <div className="glass-card p-4 rounded-2xl border border-border/50">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Demonstrou Interesse ({metricsItem.interested_users?.length || 0})
                </h4>
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {(metricsItem.interested_users?.length || 0) === 0 ? (
                    <p className="text-xs text-muted-foreground py-6 text-center">Nenhum aluno demonstrou interesse ainda</p>
                  ) : (
                    metricsItem.interested_users?.map((student) => (
                      <div key={student.id} className="p-2.5 rounded-xl bg-muted/30 border border-border/40 text-xs">
                        <div className="flex justify-between items-center font-semibold text-foreground">
                          <span>{formatShortName(student.name, true)}</span>
                          <span className="text-primary font-bold">{formatClassGrade(student.grade)}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          <span>{student.class_name}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* RESALE DETAILS MODAL */}
      <Dialog open={!!selectedResale} onOpenChange={() => setSelectedResale(null)}>
        <DialogContent className="max-w-md bg-card border border-border/60 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Solicitação de Revenda
            </DialogTitle>
          </DialogHeader>

          {selectedResale && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedResale.store_maker_item?.picture || '/scratch/default_project.png'}
                  alt={selectedResale.store_maker_item?.name}
                  className="w-20 h-20 rounded-2xl object-contain bg-muted/40 p-2 border border-border/40"
                />
                <div>
                  <h4 className="font-semibold text-sm text-foreground">
                    {selectedResale.store_maker_item?.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Grupo vendedor: {selectedResale.seller_group?.display_name}
                  </p>
                  <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    selectedResale.metadata?.target_buyer === 'teacher'
                      ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                      : 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
                  }`}>
                    {selectedResale.metadata?.target_buyer === 'teacher'
                      ? 'Venda para o Professor (Retorna ao Estoque)'
                      : 'Venda para Grupos (Marketplace)'}
                  </span>
                  <p className="text-xs font-bold text-primary mt-1">
                    R$ {selectedResale.price} ({selectedResale.quantity} un.)
                  </p>
                </div>
              </div>

              {/* Students in seller group */}
              <div className="rounded-2xl bg-muted/30 p-3 border border-border/40 space-y-2">
                <p className="text-xs font-semibold text-foreground">Membros do grupo:</p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedResale.seller_group?.students?.map((s) => (
                    <div key={s.id} className="flex justify-between text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{s.name}</span>
                      <span>@{s.username}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setSelectedResale(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-accent"
                >
                  Fechar
                </button>
                <button
                  onClick={() => handleAcceptResale(selectedResale.id)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                >
                  Aprovar Revenda
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* UPDATE SERVICE CONSUMPTION MODAL */}
      <Dialog open={!!serviceToUpdate} onOpenChange={() => setServiceToUpdate(null)}>
        <DialogContent className="max-w-sm bg-card border border-border/60 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Atualizar Consumo de Serviço
            </DialogTitle>
          </DialogHeader>

          {serviceToUpdate && (() => {
            const consumed = serviceToUpdate.order_item_metadata?.service_consumed_quantity || 0;
            const remaining = Math.max(0, serviceToUpdate.quantity - consumed);
            return (
              <div className="space-y-4 pt-2">
                <p className="text-xs text-muted-foreground">
                  Serviço: <span className="font-semibold text-foreground">{serviceToUpdate.store_item?.name}</span>
                </p>

                <div className="p-2.5 rounded-xl bg-accent/30 text-xs space-y-1 border border-border/40">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total contratado:</span>
                    <span className="font-bold">{serviceToUpdate.quantity}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horas já utilizadas:</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{consumed}h</span>
                  </div>
                  <div className="flex justify-between border-t border-border/40 pt-1">
                    <span className="text-muted-foreground">Saldo restante:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{remaining}h</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Quantidade a descontar (Horas) — máx {remaining}h
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={remaining}
                    value={serviceConsumedQty}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setServiceConsumedQty(Math.min(remaining, Math.max(0, val)));
                    }}
                    className="w-full h-10 px-3 rounded-xl bg-card border border-border/60 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Data de consumo
                  </label>
                  <input
                    type="date"
                    value={serviceConsumedDate}
                    onChange={(e) => setServiceConsumedDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-card border border-border/60 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setServiceToUpdate(null)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-accent"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpdateServiceConsumption}
                    disabled={isUpdatingService || remaining <= 0}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {isUpdatingService && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Salvar Consumo</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ORDER DETAILS MODAL */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg bg-card border border-border/60 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Pedido #{selectedOrder?.readable_id || selectedOrder?.id.slice(0, 6)} · {selectedOrder?.group?.display_name}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-muted/30 border border-border/40 text-xs space-y-1">
                <p>
                  <span className="text-muted-foreground">Solicitado por:</span>{' '}
                  <span className="font-semibold text-foreground">{selectedOrder.student?.name}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Data:</span>{' '}
                  <span className="font-medium text-foreground">
                    {new Date(selectedOrder.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </p>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Itens do Pedido</p>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {selectedOrder.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-border/40 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.store_item?.picture || '/scratch/default_project.png'}
                          alt={item.store_item?.name}
                          className="w-9 h-9 rounded-lg object-contain bg-muted/40 p-1"
                        />
                        <div>
                          <p className="font-semibold text-foreground">{item.store_item?.name}</p>
                          <p className="text-muted-foreground">{item.quantity} unidade(s)</p>
                        </div>
                      </div>
                      <span className="font-bold text-foreground">
                        R$ {selectedOrder.metadata?.is_resale ? selectedOrder.total : item.store_item?.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-border/40 text-sm font-bold">
                <span>Total:</span>
                <span className="text-primary text-base">R$ {selectedOrder.total}</span>
              </div>

              {/* If Order is Approved, allow changing order status */}
              {selectedOrder.approved_at && !selectedOrder.metadata?.denied_at && (
                <div className="pt-2 border-t border-border/40 space-y-2">
                  <label className="text-xs font-medium text-muted-foreground block">Status de Entrega:</label>
                  <div className="flex gap-2">
                    <select
                      value={orderStatusSelection}
                      onChange={(e) => setOrderStatusSelection(e.target.value as HubOrderStatusType)}
                      className="flex-1 h-9 px-3 rounded-xl bg-card border border-border/60 text-xs text-foreground focus:outline-none"
                    >
                      {hubOrderStatusTypes.map((st) => (
                        <option key={st} value={st}>
                          {LABEL_STATUSES[st]}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleStatusChange(selectedOrder, orderStatusSelection)}
                      className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              )}

              {/* Pending Actions */}
              {!selectedOrder.approved_at && !selectedOrder.metadata?.denied_at && (
                <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
                  <button
                    onClick={() => handleRejectOrder(selectedOrder)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    Rejeitar Pedido
                  </button>
                  <button
                    onClick={() => handleApproveOrder(selectedOrder)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm"
                  >
                    Aprovar Pedido
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* EXPANDED IMAGE MODAL */}
      <Dialog open={!!expandedImage} onOpenChange={() => setExpandedImage(null)}>
        <DialogContent className="max-w-md p-4 bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl flex items-center justify-center">
          {expandedImage && (
            <img
              src={expandedImage}
              alt="Expanded"
              className="max-h-[70vh] w-auto rounded-2xl object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default EstoqueView;
