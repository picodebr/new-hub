import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Coins,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Package,
} from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { formatCoin } from '@/_base/utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface StoreProduct {
  id: string;
  name: string;
  category: 'Maker' | 'Vestuário' | 'Acessórios';
  price: number;
  image: string;
  description: string;
}

const PRODUCTS: StoreProduct[] = [
  {
    id: '1',
    name: 'Placa Arduino Uno R3 PiCode',
    category: 'Maker',
    price: 35,
    image: '/svg/arduino.svg',
    description: 'Microcontrolador ATmega328P compatível com o Code Lab e Web Serial.',
  },
  {
    id: '2',
    name: 'Kit Sensores Inteligentes (Ultrassom + LDR + Som)',
    category: 'Maker',
    price: 25,
    image: '/svg/box.svg',
    description: 'Conjunto de 3 sensores com jumpers coloridos para projetos maker.',
  },
  {
    id: '3',
    name: 'Moletom Oficial PiCode Creator',
    category: 'Vestuário',
    price: 60,
    image: '/img/book.svg',
    description: 'Moletom com capuz e estampa exclusiva para criadores de tecnologia.',
  },
  {
    id: '4',
    name: 'Caneca Cerâmica PiCode Developer',
    category: 'Acessórios',
    price: 15,
    image: '/img/book.svg',
    description: 'Caneca térmica preta fosca com logo impresso em alta definição.',
  },
  {
    id: '5',
    name: 'Boné Trucker PiCode Robotics',
    category: 'Vestuário',
    price: 20,
    image: '/img/book.svg',
    description: 'Boné estilo trucker com ajuste traseiro e bordado frontal.',
  },
  {
    id: '6',
    name: 'Camiseta Dry-Fit PiCode Maker',
    category: 'Vestuário',
    price: 30,
    image: '/img/book.svg',
    description: 'Camiseta leve e respirável ideal para aulas e torneios de robótica.',
  },
];

export const StoreView: React.FC = () => {
  const { user } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [cart, setCart] = useState<{ product: StoreProduct; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userCoins, setUserCoins] = useState<number>(user?.metadata?.coins ?? 120);

  const categories = ['Todos', 'Maker', 'Vestuário', 'Acessórios'];

  const filteredProducts = PRODUCTS.filter(
    (p) => selectedCategory === 'Todos' || p.category === selectedCategory
  );

  const addToCart = (product: StoreProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQ = item.quantity + delta;
            return newQ > 0 ? { ...item, quantity: newQ } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: StoreProduct; quantity: number }[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const totalCartPrice = cart.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );
  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (userCoins < totalCartPrice) {
      toast.error('Saldo de moedas insuficiente para concluir o pedido!');
      return;
    }

    setUserCoins((prev) => prev - totalCartPrice);
    setCart([]);
    setIsCartOpen(false);
    toast.success('Pedido realizado com sucesso! Retire seus itens com seu professor.');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-6xl mx-auto"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Loja PiCode</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Troque suas moedas conquistadas em aulas e desafios por componentes e recompensas
            </p>
          </div>
        </div>

        {/* User Balance and Cart Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card border border-amber-500/30">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Seu Saldo:</span>
            <span className="text-sm font-bold text-amber-500">{formatCoin(userCoins)}</span>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-md relative"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Carrinho</span>
            {totalCartItems > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center -ml-1">
                {totalCartItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === cat
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'glass-card border border-border/40 text-muted-foreground hover:bg-accent'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className="glass-card !rounded-2xl p-5 flex flex-col justify-between hover:border-primary/50 transition-all hover:shadow-lg group"
          >
            <div>
              <div className="aspect-square rounded-xl bg-accent/30 flex items-center justify-center p-6 mb-4 overflow-hidden relative">
                <Package className="w-16 h-16 text-primary/40 group-hover:scale-110 transition-transform duration-300" />
                <span className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-md bg-background/80 backdrop-blur text-muted-foreground">
                  {p.category}
                </span>
              </div>

              <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {p.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                {p.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40">
              <div className="flex items-center gap-1.5 text-amber-500 font-bold text-sm">
                <Coins className="w-4 h-4" />
                <span>{p.price} PiCoins</span>
              </div>

              <button
                onClick={() => addToCart(p)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-semibold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Drawer / Modal */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-md glass-card !rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <span>Meu Carrinho</span>
            </DialogTitle>
          </DialogHeader>

          {cart.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <ShoppingBag className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-semibold text-foreground">Seu carrinho está vazio</p>
              <p className="text-xs text-muted-foreground">Escolha componentes e itens na loja.</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="max-h-[300px] overflow-y-auto divide-y divide-border/40 pr-1">
                {cart.map((item) => (
                  <div key={item.product.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-foreground truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-amber-500 font-medium">
                        {item.product.price} PiCoins cada
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 border border-border/50 rounded-lg p-0.5 bg-accent/20">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="p-1 hover:bg-accent rounded text-muted-foreground"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold px-2">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="p-1 hover:bg-accent rounded text-muted-foreground"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-border/40 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Itens no carrinho:</span>
                  <span>{totalCartItems}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-foreground">
                  <span>Total do Pedido:</span>
                  <span className="text-amber-500 flex items-center gap-1">
                    <Coins className="w-4 h-4" /> {totalCartPrice} PiCoins
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <button
              onClick={() => setIsCartOpen(false)}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Confirmar Compra
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default StoreView;
