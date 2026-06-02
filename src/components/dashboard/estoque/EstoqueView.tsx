import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, BarChart3, ShoppingCart, Heart, Search, PackagePlus, Package } from 'lucide-react';
import { estoqueItems, EstoqueItem } from './estoqueData';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import AddItemDialog, { NewItemPayload } from './AddItemDialog';

const tabs = ['Estoque', 'Solicitações de revenda', 'Reservas', 'Pedidos'];

const EstoqueView = () => {
  const [activeTab, setActiveTab] = useState('Estoque');
  const [items, setItems] = useState<EstoqueItem[]>(estoqueItems);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [metricsOpen, setMetricsOpen] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const handleAddItem = (payload: NewItemPayload) => {
    const newItem: EstoqueItem = {
      id: `${Date.now()}`,
      name: payload.name,
      image: payload.image,
      quantity: payload.quantity,
      cartCount: 0,
      interestCount: 0,
    };
    setItems(prev => [newItem, ...prev]);
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      )
    );
  };

  const setQuantity = (id: string, value: string) => {
    const num = parseInt(value) || 0;
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity: Math.max(0, num) } : item
      )
    );
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Estoque Maker</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie os itens do seu estoque</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 glass-card rounded-2xl text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <PackagePlus className="w-4 h-4" />
            Adicionar Item
          </button>
        </div>
      </div>

      <AddItemDialog open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAddItem} />

      {/* Tab Switch */}
      <div className="glass-card rounded-2xl p-1.5 inline-flex gap-1 mb-6">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Estoque' && (
        <>
          {/* Search */}
          <div className="relative mb-6 w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar item..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <AnimatePresence>
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -4 }}
                  className="group glass-card rounded-3xl overflow-hidden border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
                >
                  {/* Image header */}
                  <div className="p-3 pb-2 h-40">
                    <div
                      className="relative w-full h-full overflow-hidden rounded-2xl border border-border/40 bg-accent/30 cursor-pointer"
                      onClick={() => setExpandedImage(item.image)}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />

                      {/* Metrics pill */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMetricsOpen(metricsOpen === item.id ? null : item.id);
                        }}
                        className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-white/25 backdrop-blur-md rounded-full px-2 py-1 ring-1 ring-white/30 hover:bg-white/40 transition-colors"
                        title="Métricas"
                      >
                        <BarChart3 className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-semibold text-white">MÉTRICAS</span>
                      </button>

                      {/* Quantity pill */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-white/25 backdrop-blur-md rounded-full px-2 py-1 ring-1 ring-white/30">
                        <span className="text-[10px] font-semibold text-white tabular-nums">
                          QTD {item.quantity}
                        </span>
                      </div>

                      {/* Metrics popover */}
                      <AnimatePresence>
                        {metricsOpen === item.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -5 }}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-12 right-2.5 z-20 glass-card rounded-xl p-3 shadow-xl min-w-[160px]"
                          >
                            <p className="text-xs font-semibold text-foreground mb-2">Métricas</p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs">
                                <ShoppingCart className="w-3.5 h-3.5 text-primary" />
                                <span className="text-muted-foreground">No carrinho:</span>
                                <span className="font-semibold text-foreground ml-auto">{item.cartCount}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <Heart className="w-3.5 h-3.5 text-pink-500" />
                                <span className="text-muted-foreground">Interesse:</span>
                                <span className="font-semibold text-foreground ml-auto">{item.interestCount}</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Footer info */}
                  <div className="px-4 pb-4 pt-1">
                    <h3 className="font-semibold text-foreground text-sm mb-3 line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-accent hover:bg-accent/80 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5 text-foreground" />
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={item.quantity}
                        onChange={e => setQuantity(item.id, e.target.value.replace(/\D/g, ''))}
                        className="w-14 text-center text-sm font-semibold text-foreground bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-lg py-1 tabular-nums"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-accent hover:bg-accent/80 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-foreground" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      {activeTab !== 'Estoque' && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-muted-foreground text-sm">Seção "{activeTab}" em desenvolvimento</p>
        </div>
      )}

      {/* Expanded image dialog */}
      <Dialog open={!!expandedImage} onOpenChange={() => setExpandedImage(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl bg-background/95 backdrop-blur-xl border-border/50">
          {expandedImage && (
            <div className="relative">
              <img
                src={expandedImage}
                alt="Item expandido"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default EstoqueView;
