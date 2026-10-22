import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ListTodo,
  Plus,
  Save,
  Trash2,
  AlertCircle,
  Edit2,
  CalendarDays,
  Loader2,
} from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { updateProfile } from '@/_base/services/user';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export type KanbanColumnType = 'todo' | 'doing' | 'finished';

export interface KanbanItemType {
  id: string;
  title: string;
  content: string;
  column: KanbanColumnType;
  end_date?: string;
  bgcolor?: string;
  users?: string[];
}

export interface KanbanColumnData {
  type: KanbanColumnType;
  title: string;
  items: KanbanItemType[];
}

const DEFAULT_COLUMNS: KanbanColumnData[] = [
  { type: 'todo', title: 'A Fazer', items: [] },
  { type: 'doing', title: 'Em Andamento', items: [] },
  { type: 'finished', title: 'Feito', items: [] },
];

const COLOR_OPTIONS = [
  { label: 'Padrão', value: '' },
  { label: 'Azul', value: 'border-l-4 border-blue-500' },
  { label: 'Verde', value: 'border-l-4 border-emerald-500' },
  { label: 'Amarelo', value: 'border-l-4 border-amber-500' },
  { label: 'Roxo', value: 'border-l-4 border-purple-500' },
  { label: 'Vermelho', value: 'border-l-4 border-rose-500' },
];

const SortableKanbanCard = ({
  item,
  onEdit,
  onDelete,
}: {
  item: KanbanItemType;
  onEdit: (item: KanbanItemType) => void;
  onDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { item },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`glass-card !rounded-xl p-3.5 mb-2.5 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group ${
        item.bgcolor || 'border-border/40'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {item.title}
        </h4>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent/60"
            title="Editar card"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Excluir card"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {item.content && (
        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3 whitespace-pre-wrap">
          {item.content}
        </p>
      )}

      {item.end_date && (
        <div className="flex items-center gap-1.5 mt-3 text-[11px] text-muted-foreground bg-accent/40 rounded-lg px-2 py-1 w-fit">
          <CalendarDays className="w-3 h-3 text-primary" />
          <span>Entrega: {item.end_date}</span>
        </div>
      )}
    </div>
  );
};

export const PlannerView: React.FC = () => {
  const { user, setUser } = useUser();
  const [columns, setColumns] = useState<KanbanColumnData[]>(DEFAULT_COLUMNS);
  const [initialJson, setInitialJson] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<KanbanItemType | null>(null);
  const [targetColumn, setTargetColumn] = useState<KanbanColumnType>('todo');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formColor, setFormColor] = useState('');

  // Sensors for DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('id');

  // Load kanban from user metadata
  useEffect(() => {
    try {
      if (user?.metadata?.kanban) {
        const parsed = JSON.parse(user.metadata.kanban) as KanbanColumnData[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = parsed.map(col => ({
            ...col,
            items: Array.isArray(col.items) ? col.items : [],
          }));
          setColumns(sanitized);
          setInitialJson(JSON.stringify(sanitized));

          if (targetId) {
            const foundItem = sanitized.flatMap((col) => col.items || []).find((i) => i.id === targetId);

            if (foundItem) {
              setEditingItem(foundItem);
              setFormTitle(foundItem.title);
              setFormContent(foundItem.content);
              setFormDate(foundItem.end_date || '');
              setFormColor(foundItem.bgcolor || '');
              setTargetColumn(foundItem.column);
              setIsModalOpen(true);
            }
          }
          return;
        }
      }
    } catch (e) {
      console.error('Error parsing kanban metadata:', e);
    }
    setColumns(DEFAULT_COLUMNS);
    setInitialJson(JSON.stringify(DEFAULT_COLUMNS));
  }, [user?.metadata?.kanban, targetId]);

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(columns) !== initialJson;
  }, [columns, initialJson]);

  // Handle DnD
  const findColumnOfItem = (itemId: string): KanbanColumnData | undefined => {
    return columns.find((col) => col.items.some((item) => item.id === itemId));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const sourceCol = findColumnOfItem(activeId);
    // Over could be a column type or an item
    const targetCol =
      columns.find((col) => col.type === overId) || findColumnOfItem(overId);

    if (!sourceCol || !targetCol || sourceCol.type === targetCol.type) return;

    setColumns((prev) => {
      const activeItem = sourceCol.items.find((i) => i.id === activeId);
      if (!activeItem) return prev;

      return prev.map((col) => {
        if (col.type === sourceCol.type) {
          return { ...col, items: col.items.filter((i) => i.id !== activeId) };
        }
        if (col.type === targetCol.type) {
          return {
            ...col,
            items: [...col.items, { ...activeItem, column: targetCol.type }],
          };
        }
        return col;
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const sourceCol = findColumnOfItem(activeId);
    const targetCol =
      columns.find((col) => col.type === overId) || findColumnOfItem(overId);

    if (!sourceCol || !targetCol) return;

    if (sourceCol.type === targetCol.type) {
      const oldIndex = sourceCol.items.findIndex((i) => i.id === activeId);
      const newIndex = sourceCol.items.findIndex((i) => i.id === overId);

      if (oldIndex !== newIndex && newIndex !== -1) {
        setColumns((prev) =>
          prev.map((col) => {
            if (col.type !== sourceCol.type) return col;
            const newItems = [...col.items];
            const [moved] = newItems.splice(oldIndex, 1);
            newItems.splice(newIndex, 0, moved);
            return { ...col, items: newItems };
          })
        );
      }
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const jsonStr = JSON.stringify(columns);
      await updateProfile({ kanban: jsonStr });
      if (user) {
        setUser({ ...user, metadata: { ...user.metadata, kanban: jsonStr } });
      }
      setInitialJson(jsonStr);
      toast.success('Planejamento salvo com sucesso!');
    } catch (err) {
      toast.error('Erro ao salvar planejamento');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const openAddModal = (columnType: KanbanColumnType) => {
    setEditingItem(null);
    setTargetColumn(columnType);
    setFormTitle('');
    setFormContent('');
    setFormDate('');
    setFormColor('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: KanbanItemType) => {
    setEditingItem(item);
    setTargetColumn(item.column);
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormDate(item.end_date || '');
    setFormColor(item.bgcolor || '');
    setIsModalOpen(true);
  };

  const handleSaveCard = () => {
    if (!formTitle.trim()) {
      toast.error('Informe o título do cartão');
      return;
    }

    if (editingItem) {
      // Update existing item
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          items: col.items.map((i) =>
            i.id === editingItem.id
              ? {
                  ...i,
                  title: formTitle.trim(),
                  content: formContent.trim(),
                  end_date: formDate.trim() || undefined,
                  bgcolor: formColor,
                }
              : i
          ),
        }))
      );
      toast.success('Cartão atualizado!');
    } else {
      // Create new item
      const newItem: KanbanItemType = {
        id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: formTitle.trim(),
        content: formContent.trim(),
        column: targetColumn,
        end_date: formDate.trim() || undefined,
        bgcolor: formColor,
      };

      setColumns((prev) =>
        prev.map((col) =>
          col.type === targetColumn
            ? { ...col, items: [newItem, ...col.items] }
            : col
        )
      );
      toast.success('Novo cartão adicionado!');
    }

    setIsModalOpen(false);
  };

  const handleDeleteCard = (cardId: string) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        items: col.items.filter((i) => i.id !== cardId),
      }))
    );
    toast.success('Cartão removido!');
  };

  const columnHeaders: Record<
    KanbanColumnType,
    { icon: React.ReactNode; color: string; badge: string }
  > = {
    todo: {
      icon: <ListTodo className="w-4 h-4 text-blue-500" />,
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      badge: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    },
    doing: {
      icon: <Clock className="w-4 h-4 text-amber-500" />,
      color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      badge: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    },
    finished: {
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      badge: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meus Planejamentos</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Organize suas metas, cronogramas de aula e tarefas pedagógicas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Alterações não salvas</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Salvar Quadro</span>
          </button>
        </div>
      </div>

      {/* Kanban Board with DndContext */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => {
            const header = columnHeaders[column.type];
            return (
              <div
                key={column.type}
                className="glass-card !rounded-2xl p-4 flex flex-col h-[calc(100vh-14rem)] min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg border ${header.color}`}>
                      {header.icon}
                    </div>
                    <h3 className="font-bold text-sm text-foreground">{column.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${header.badge}`}>
                      {column.items.length}
                    </span>
                  </div>
                  <button
                    onClick={() => openAddModal(column.type)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-colors"
                    title="Adicionar cartão"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto pr-1">
                  <SortableContext
                    items={column.items.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {column.items.map((item) => (
                      <SortableKanbanCard
                        key={item.id}
                        item={item}
                        onEdit={openEditModal}
                        onDelete={handleDeleteCard}
                      />
                    ))}
                  </SortableContext>

                  {column.items.length === 0 && (
                    <div
                      onClick={() => openAddModal(column.type)}
                      className="h-32 border-2 border-dashed border-border/40 rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 cursor-pointer transition-all"
                    >
                      <Plus className="w-5 h-5 mb-1 opacity-60" />
                      <span className="text-xs">Novo cartão</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DndContext>

      {/* Add / Edit Card Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md glass-card !rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingItem ? 'Editar Cartão' : 'Adicionar Novo Cartão'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Título *
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ex: Planejar aula de Robótica com LED"
                className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Descrição
              </label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Detalhes, objetivos e materiais necessários..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Data de Entrega / Prazo
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-card border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Etiqueta de Cor
              </label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setFormColor(c.value)}
                    className={`flex-1 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                      formColor === c.value
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border/50 text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveCard}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              {editingItem ? 'Salvar Alterações' : 'Criar Cartão'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default PlannerView;
