import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Shuffle, ChevronDown, Lock, Coins } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

/**
 * DiceBear "Avataaars" — clássico cartoon estilo Bitmoji.
 * Docs: https://www.dicebear.com/styles/avataaars/
 */

interface AvatarConfig {
  seed: string;
  skinColor: string;
  top: string;
  hairColor: string;
  facialHair: string;
  facialHairColor: string;
  facialHairProbability: number;
  eyebrows: string;
  eyes: string;
  mouth: string;
  accessories: string;
  accessoriesProbability: number;
  clothing: string;
  clothesColor: string;
  clothingGraphic: string;
  backgroundColor: string;
}

// Cores em HEX (a API espera hex, não nomes)
const SKIN_COLORS: string[] = [
  'fdd7c4', 'edb98a', 'f8d25c', 'fd9841', 'd08b5b', 'ae5d29', '614335',
];

const HAIR_COLORS: string[] = [
  '2c1b18', '4a312c', '724133', 'a55728', 'c93305',
  'b58143', 'd6b370', 'ecdcbf', 'e8e1e1', 'f59797',
];

const BG_COLORS = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf', 'transparent'];

const TOP_OPTIONS = [
  { value: 'shortFlat', label: 'Curto Liso' },
  { value: 'shortRound', label: 'Curto Redondo' },
  { value: 'shortCurly', label: 'Curto Cacheado' },
  { value: 'shortWaved', label: 'Curto Ondulado' },
  { value: 'theCaesar', label: 'Caesar' },
  { value: 'theCaesarAndSidePart', label: 'Caesar Lateral' },
  { value: 'frizzle', label: 'Frizzle' },
  { value: 'sides', label: 'Lados' },
  { value: 'shavedSides', label: 'Raspado dos Lados' },
  { value: 'dreads01', label: 'Dreads 1' },
  { value: 'dreads02', label: 'Dreads 2' },
  { value: 'shaggy', label: 'Despojado' },
  { value: 'shaggyMullet', label: 'Mullet' },
  { value: 'bigHair', label: 'Volumoso' },
  { value: 'bob', label: 'Chanel' },
  { value: 'bun', label: 'Coque' },
  { value: 'curly', label: 'Cacheado Longo' },
  { value: 'curvy', label: 'Ondulado Longo' },
  { value: 'dreads', label: 'Dreads Longo' },
  { value: 'fro', label: 'Black Power' },
  { value: 'froBand', label: 'Black Power c/ Faixa' },
  { value: 'frida', label: 'Frida' },
  { value: 'miaWallace', label: 'Mia Wallace' },
  { value: 'straight01', label: 'Liso Longo' },
  { value: 'straight02', label: 'Liso Longo 2' },
  { value: 'straightAndStrand', label: 'Liso c/ Mecha' },
  { value: 'longButNotTooLong', label: 'Médio' },
  { value: 'hat', label: 'Chapéu' },
  { value: 'hijab', label: 'Hijab' },
  { value: 'turban', label: 'Turbante' },
  { value: 'winterHat1', label: 'Gorro 1' },
  { value: 'winterHat02', label: 'Gorro 2' },
  { value: 'winterHat03', label: 'Gorro 3' },
  { value: 'winterHat04', label: 'Gorro 4' },
];

const EYEBROWS_OPTIONS = [
  { value: 'default', label: 'Padrão' },
  { value: 'defaultNatural', label: 'Natural' },
  { value: 'flatNatural', label: 'Reta' },
  { value: 'raisedExcited', label: 'Animada' },
  { value: 'raisedExcitedNatural', label: 'Animada Nat.' },
  { value: 'sadConcerned', label: 'Triste' },
  { value: 'sadConcernedNatural', label: 'Triste Nat.' },
  { value: 'upDown', label: 'Cético' },
  { value: 'upDownNatural', label: 'Cético Nat.' },
  { value: 'angry', label: 'Bravo' },
  { value: 'angryNatural', label: 'Bravo Nat.' },
  { value: 'frownNatural', label: 'Carrancudo' },
  { value: 'unibrowNatural', label: 'Unibrow' },
];

const EYES_OPTIONS = [
  { value: 'default', label: 'Padrão' },
  { value: 'happy', label: 'Feliz' },
  { value: 'wink', label: 'Piscando' },
  { value: 'winkWacky', label: 'Travesso' },
  { value: 'hearts', label: 'Coração' },
  { value: 'squint', label: 'Apertado' },
  { value: 'surprised', label: 'Surpreso' },
  { value: 'side', label: 'De Lado' },
  { value: 'closed', label: 'Fechado' },
  { value: 'cry', label: 'Chorando' },
  { value: 'eyeRoll', label: 'Revirando' },
  { value: 'xDizzy', label: 'Tonto' },
];

const MOUTH_OPTIONS = [
  { value: 'default', label: 'Padrão' },
  { value: 'smile', label: 'Sorriso' },
  { value: 'twinkle', label: 'Brilho' },
  { value: 'tongue', label: 'Língua' },
  { value: 'serious', label: 'Sério' },
  { value: 'sad', label: 'Triste' },
  { value: 'screamOpen', label: 'Gritando' },
  { value: 'eating', label: 'Comendo' },
  { value: 'grimace', label: 'Careta' },
  { value: 'concerned', label: 'Preocupado' },
  { value: 'disbelief', label: 'Descrente' },
  { value: 'vomit', label: 'Vomitando' },
];

const FACIAL_HAIR_OPTIONS = [
  { value: 'beardLight', label: 'Barba Leve' },
  { value: 'beardMedium', label: 'Barba Média' },
  { value: 'beardMajestic', label: 'Barba Cheia' },
  { value: 'moustacheFancy', label: 'Bigode Fancy' },
  { value: 'moustacheMagnum', label: 'Bigode Magnum' },
];

const ACCESSORIES_OPTIONS = [
  { value: 'kurt', label: 'Kurt' },
  { value: 'prescription01', label: 'Grau 1' },
  { value: 'prescription02', label: 'Grau 2' },
  { value: 'round', label: 'Redondo' },
  { value: 'sunglasses', label: 'Escuros' },
  { value: 'wayfarers', label: 'Wayfarers' },
];

const CLOTHING_OPTIONS = [
  { value: 'shirtCrewNeck', label: 'Camiseta' },
  { value: 'shirtScoopNeck', label: 'Decote U' },
  { value: 'shirtVNeck', label: 'Decote V' },
  { value: 'hoodie', label: 'Moletom' },
  { value: 'collarAndSweater', label: 'Suéter c/ Gola' },
  { value: 'graphicShirt', label: 'Camisa Estampa' },
  { value: 'blazerAndShirt', label: 'Blazer + Camisa' },
  { value: 'blazerAndSweater', label: 'Blazer + Suéter' },
  { value: 'overall', label: 'Jardineira' },
];

const CLOTHES_COLORS: string[] = [
  '262e33', '65c9ff', '5199e4', '25557c', 'e6e6e6', '929598', '3c4f5c',
  'b1e2ff', 'a7ffc4', 'ffafb9', 'ffffb1', 'ff488e', 'ff5c5c', 'ffffff',
];

const GRAPHIC_OPTIONS = [
  { value: 'bat', label: 'Morcego' },
  { value: 'cumbia', label: 'Cumbia' },
  { value: 'deer', label: 'Cervo' },
  { value: 'diamond', label: 'Diamante' },
  { value: 'hola', label: 'Hola' },
  { value: 'pizza', label: 'Pizza' },
  { value: 'resist', label: 'Resist' },
  { value: 'skull', label: 'Caveira' },
  { value: 'skullOutline', label: 'Caveira Linha' },
  { value: 'bear', label: 'Urso' },
];

type AvatarShopCategory =
  | 'top'
  | 'eyes'
  | 'eyebrows'
  | 'mouth'
  | 'accessories'
  | 'facialHair'
  | 'clothing'
  | 'clothingGraphic';

type ShopItem = {
  category: AvatarShopCategory;
  value: string;
  price: number;
};

const SHOP_ITEMS: ShopItem[] = [
  { category: 'top', value: 'froBand', price: 120 },
  { category: 'top', value: 'miaWallace', price: 140 },
  { category: 'top', value: 'straightAndStrand', price: 160 },
  { category: 'top', value: 'winterHat04', price: 90 },
  { category: 'eyes', value: 'hearts', price: 75 },
  { category: 'eyes', value: 'winkWacky', price: 80 },
  { category: 'mouth', value: 'vomit', price: 60 },
  { category: 'accessories', value: 'sunglasses', price: 110 },
  { category: 'accessories', value: 'wayfarers', price: 95 },
  { category: 'facialHair', value: 'beardMajestic', price: 130 },
  { category: 'clothing', value: 'blazerAndShirt', price: 150 },
  { category: 'clothing', value: 'graphicShirt', price: 100 },
  { category: 'clothingGraphic', value: 'diamond', price: 85 },
  { category: 'clothingGraphic', value: 'skull', price: 95 },
];

const itemKey = (category: AvatarShopCategory, value: string) => `${category}:${value}`;

const getShopItem = (category: AvatarShopCategory, value: string) =>
  SHOP_ITEMS.find((item) => item.category === category && item.value === value);

const formatPrice = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

const isUnlocked = (unlockedItems: Set<string>, category: AvatarShopCategory, value: string) => {
  const shopItem = getShopItem(category, value);
  return !shopItem || unlockedItems.has(itemKey(category, value));
};

const unlockedOptions = (
  options: { value: string; label: string }[],
  category: AvatarShopCategory,
  unlockedItems: Set<string>,
) => options.filter((option) => isUnlocked(unlockedItems, category, option.value));

export const DEFAULT_AVATAR: AvatarConfig = {
  seed: 'picode',
  skinColor: 'edb98a',
  top: 'shortFlat',
  hairColor: '724133',
  facialHair: 'beardLight',
  facialHairColor: '724133',
  facialHairProbability: 0,
  eyebrows: 'default',
  eyes: 'happy',
  mouth: 'smile',
  accessories: 'prescription02',
  accessoriesProbability: 0,
  clothing: 'hoodie',
  clothesColor: '5199e4',
  clothingGraphic: 'bear',
  backgroundColor: 'b6e3f4',
};

export const buildAvatarUrl = (cfg: AvatarConfig) => {
  const params = new URLSearchParams();
  params.set('seed', cfg.seed);
  params.set('skinColor', cfg.skinColor);
  params.set('top', cfg.top);
  params.set('hairColor', cfg.hairColor);
  params.set('facialHair', cfg.facialHair);
  params.set('facialHairColor', cfg.facialHairColor ?? cfg.hairColor);
  params.set('facialHairProbability', String(cfg.facialHairProbability));
  params.set('eyebrows', cfg.eyebrows);
  params.set('eyes', cfg.eyes === 'dizzy' ? 'xDizzy' : cfg.eyes);
  params.set('mouth', cfg.mouth);
  params.set('accessories', cfg.accessories);
  params.set('accessoriesProbability', String(cfg.accessoriesProbability));
  params.set('clothing', cfg.clothing);
  params.set('clothesColor', cfg.clothesColor);
  params.set('clothingGraphic', cfg.clothingGraphic);
  if (cfg.backgroundColor !== 'transparent') {
    params.set('backgroundColor', cfg.backgroundColor);
  }
  params.set('radius', '50');
  return `https://api.dicebear.com/9.x/avataaars/svg?${params.toString()}`;
};

interface AvatarPreviewProps {
  config: AvatarConfig;
  className?: string;
}

const AvatarPreview = ({ config, className }: AvatarPreviewProps) => {
  const url = useMemo(() => buildAvatarUrl(config), [config]);
  return (
    <img
      src={url}
      alt="Avatar"
      className={cn('h-full w-full object-cover', className)}
      draggable={false}
    />
  );
};

/* ---------- UI helpers ---------- */

// Zoom & posicionamento das miniaturas — destaca a parte que está mudando.
type FocusArea = 'head' | 'eyes' | 'mouth' | 'body' | 'full';

// Avataaars SVG: cabeça ocupa ~y 15-55%, olhos ~35%, boca ~50%, torso ~65-95%.
// O translate reposiciona o avatar dentro do recorte circular sem afetar o contorno do card.
const FOCUS_STYLE: Record<FocusArea, React.CSSProperties> = {
  // cabeça inteira (cabelo, sobrancelhas, óculos, barba)
  head: { transform: 'translateY(8%) scale(1.85)', transformOrigin: '50% 34%' },
  // olhos
  eyes: { transform: 'translateY(12%) scale(2.35)', transformOrigin: '50% 38%' },
  // boca
  mouth: { transform: 'translateY(-2%) scale(2.35)', transformOrigin: '50% 50%' },
  // torso/roupa
  body: { transform: 'translateY(-10%) scale(1.65)', transformOrigin: '50% 74%' },
  // sem zoom (estampa, fundo, etc.)
  full: {},
};

const FOCUS_BY_KEY: Partial<Record<keyof AvatarConfig, FocusArea>> = {
  top: 'head',
  hairColor: 'head',
  eyebrows: 'head',
  eyes: 'eyes',
  mouth: 'mouth',
  facialHair: 'head',
  accessories: 'eyes',
  clothing: 'body',
  clothesColor: 'body',
  clothingGraphic: 'body',
  skinColor: 'head',
};

interface ThumbnailPickerProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  onLockedSelect: (item: ShopItem, label: string) => void;
  baseConfig: AvatarConfig;
  configKey: AvatarShopCategory;
  unlockedItems: Set<string>;
}

const ThumbnailPicker = ({
  label,
  value,
  options,
  onChange,
  onLockedSelect,
  baseConfig,
  configKey,
  unlockedItems,
}: ThumbnailPickerProps) => {
  const current = options.find((o) => o.value === value);
  const focus = FOCUS_BY_KEY[configKey] ?? 'full';
  const focusStyle = FOCUS_STYLE[focus];

  const thumbs = useMemo(
    () =>
      options.map((opt) => ({
        ...opt,
        url: buildAvatarUrl({ ...baseConfig, [configKey]: opt.value }),
      })),
    [options, baseConfig, configKey],
  );

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 px-3 py-2.5">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-xl bg-background/60 px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <span className="truncate">{current?.label ?? '—'}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          onWheelCapture={(event) => event.stopPropagation()}
          onTouchMoveCapture={(event) => event.stopPropagation()}
          className="z-[60] w-[380px] rounded-2xl border-border/40 bg-popover/95 p-3 shadow-2xl backdrop-blur-xl"
        >
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <div className="grid max-h-[320px] grid-cols-3 gap-2 overflow-y-auto overscroll-contain p-0.5 pr-1.5 touch-pan-y">
            {thumbs.map((opt) => {
              const active = opt.value === value;
              const shopItem = getShopItem(configKey, opt.value);
              const locked = Boolean(shopItem && !unlockedItems.has(itemKey(configKey, opt.value)));
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => (locked && shopItem ? onLockedSelect(shopItem, opt.label) : onChange(opt.value))}
                  className={cn(
                    'group relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 transition-all',
                    active
                      ? 'border-primary bg-primary/10'
                      : 'border-transparent hover:bg-muted/60',
                    locked && 'bg-muted/30',
                  )}
                  title={opt.label}
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted ring-1 ring-border">
                    <img
                      src={opt.url}
                      alt={opt.label}
                      className="h-full w-full object-cover"
                      style={focusStyle}
                      loading="lazy"
                      draggable={false}
                    />
                    {locked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/55 backdrop-blur-[1px]">
                        <Lock className="h-4 w-4 text-foreground" />
                      </div>
                    )}
                  </div>
                  <span className="line-clamp-2 min-h-[2.2em] w-full text-center text-[10px] font-medium leading-tight text-foreground">
                    {opt.label}
                  </span>
                  {locked && shopItem && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                      <Coins className="h-2.5 w-2.5" />
                      {formatPrice(shopItem.price)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};


interface SwatchPickerProps {
  label: string;
  value: string;
  swatches: { value: string; hex: string }[] | string[];
  onChange: (v: string) => void;
}

const SwatchPicker = ({ label, value, swatches, onChange }: SwatchPickerProps) => {
  const items = swatches.map((s) =>
    typeof s === 'string' ? { value: s, hex: s } : s,
  );
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 px-3 py-2.5">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map(({ value: v, hex }) => {
          const isTransparent = hex === 'transparent';
          const active = value === v;
          return (
            <button
              key={v}
              onClick={() => onChange(v)}
              aria-label={v}
              className={cn(
                'h-7 w-7 rounded-full ring-offset-2 ring-offset-background transition-all',
                active ? 'ring-2 ring-foreground scale-110' : 'ring-1 ring-border hover:scale-105',
              )}
              style={{
                background: isTransparent
                  ? 'repeating-conic-gradient(#cbd5e1 0% 25%, #ffffff 0% 50%) 50% / 10px 10px'
                  : `#${hex}`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

interface ToggleWithVariantProps {
  label: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  onLockedSelect: (item: ShopItem, label: string) => void;
  baseConfig: AvatarConfig;
  configKey: AvatarShopCategory;
  unlockedItems: Set<string>;
}

const ToggleWithVariant = ({
  label,
  enabled,
  onToggle,
  value,
  options,
  onChange,
  onLockedSelect,
  baseConfig,
  configKey,
  unlockedItems,
}: ToggleWithVariantProps) => {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 px-3 py-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>
      {enabled && (
        <div className="mt-2">
          <ThumbnailPicker
            label={label}
            value={value}
            options={options}
            onChange={onChange}
            onLockedSelect={onLockedSelect}
            baseConfig={baseConfig}
            configKey={configKey}
            unlockedItems={unlockedItems}
          />
        </div>
      )}
    </div>
  );
};

/* ---------- Main ---------- */

interface AvatarCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: AvatarConfig;
  balance: number;
  onBalanceChange: (balance: number) => void;
  onConfirm: (config: AvatarConfig) => void;
}

const randomFrom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const AvatarCustomizer = ({ open, onOpenChange, initial, balance, onBalanceChange, onConfirm }: AvatarCustomizerProps) => {
  const [config, setConfig] = useState<AvatarConfig>(initial ?? DEFAULT_AVATAR);
  const [unlockedItems, setUnlockedItems] = useState<Set<string>>(() => new Set());
  const [pendingPurchase, setPendingPurchase] = useState<{ item: ShopItem; label: string } | null>(null);

  const update = <K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const requestPurchase = (item: ShopItem, label: string) => setPendingPurchase({ item, label });

  const confirmPurchase = () => {
    if (!pendingPurchase || balance < pendingPurchase.item.price) return;

    const { item } = pendingPurchase;
    setUnlockedItems((items) => new Set(items).add(itemKey(item.category, item.value)));
    setConfig((current) => ({ ...current, [item.category]: item.value }));
    onBalanceChange(balance - item.price);
    setPendingPurchase(null);
  };

  const randomize = () => {
    const clothing = randomFrom(unlockedOptions(CLOTHING_OPTIONS, 'clothing', unlockedItems)).value;
    setConfig({
      seed: Math.random().toString(36).slice(2, 10),
      skinColor: randomFrom(SKIN_COLORS),
      top: randomFrom(unlockedOptions(TOP_OPTIONS, 'top', unlockedItems)).value,
      hairColor: randomFrom(HAIR_COLORS),
      facialHair: randomFrom(unlockedOptions(FACIAL_HAIR_OPTIONS, 'facialHair', unlockedItems)).value,
      facialHairColor: randomFrom(HAIR_COLORS),
      facialHairProbability: Math.random() > 0.8 ? 100 : 0,
      eyebrows: randomFrom(EYEBROWS_OPTIONS).value,
      eyes: randomFrom(unlockedOptions(EYES_OPTIONS, 'eyes', unlockedItems)).value,
      mouth: randomFrom(unlockedOptions(MOUTH_OPTIONS, 'mouth', unlockedItems)).value,
      accessories: randomFrom(unlockedOptions(ACCESSORIES_OPTIONS, 'accessories', unlockedItems)).value,
      accessoriesProbability: Math.random() > 0.7 ? 100 : 0,
      clothing,
      clothesColor: randomFrom(CLOTHES_COLORS),
      clothingGraphic: randomFrom(unlockedOptions(GRAPHIC_OPTIONS, 'clothingGraphic', unlockedItems)).value,
      backgroundColor: randomFrom(BG_COLORS),
    });
  };

  const pendingHasEnoughBalance = pendingPurchase ? balance >= pendingPurchase.item.price : false;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-3xl border-border/40 bg-background/95 p-0 backdrop-blur-xl">
        <DialogTitle className="sr-only">Customizar Avatar</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Customizar Avatar</p>
              <p className="text-[11px] text-muted-foreground">Estilo Avataaars</p>
            </div>
          </div>
          <button
            onClick={randomize}
            className="mr-8 flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Shuffle className="h-3.5 w-3.5" />
            Aleatório
          </button>
          <div className="mr-8 hidden items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 sm:flex">
            <Coins className="h-3.5 w-3.5" />
            {formatPrice(balance)}
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 gap-6 px-6 pb-2 md:grid-cols-[220px,1fr] md:items-start">
          {/* Avatar preview */}
          <div className="flex flex-col items-center gap-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={JSON.stringify(config)}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary via-primary/40 to-amber-400 opacity-60 blur-lg" />
                <div
                  className="relative h-44 w-44 overflow-hidden rounded-full ring-4 ring-background shadow-xl"
                  style={{
                    background:
                      config.backgroundColor === 'transparent'
                        ? 'transparent'
                        : `#${config.backgroundColor}`,
                  }}
                >
                  <AvatarPreview config={config} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
            {/* Cores principais */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <SwatchPicker
                label="Cor da pele"
                value={config.skinColor}
                swatches={SKIN_COLORS}
                onChange={(v) => update('skinColor', v)}
              />
              <SwatchPicker
                label="Cor do cabelo"
                value={config.hairColor}
                swatches={HAIR_COLORS}
                onChange={(v) => update('hairColor', v)}
              />
            </div>

            {/* Rosto */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <ThumbnailPicker
                label="Cabelo / Topo"
                value={config.top}
                options={TOP_OPTIONS}
                onChange={(v) => update('top', v)}
                onLockedSelect={requestPurchase}
                baseConfig={config}
                configKey="top"
                unlockedItems={unlockedItems}
              />
              <ThumbnailPicker
                label="Olhos"
                value={config.eyes}
                options={EYES_OPTIONS}
                onChange={(v) => update('eyes', v)}
                onLockedSelect={requestPurchase}
                baseConfig={config}
                configKey="eyes"
                unlockedItems={unlockedItems}
              />
              <ThumbnailPicker
                label="Sobrancelhas"
                value={config.eyebrows}
                options={EYEBROWS_OPTIONS}
                onChange={(v) => update('eyebrows', v)}
                onLockedSelect={requestPurchase}
                baseConfig={config}
                configKey="eyebrows"
                unlockedItems={unlockedItems}
              />
              <ThumbnailPicker
                label="Boca"
                value={config.mouth}
                options={MOUTH_OPTIONS}
                onChange={(v) => update('mouth', v)}
                onLockedSelect={requestPurchase}
                baseConfig={config}
                configKey="mouth"
                unlockedItems={unlockedItems}
              />
            </div>

            {/* Roupa */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <ThumbnailPicker
                label="Roupa"
                value={config.clothing}
                options={CLOTHING_OPTIONS}
                onChange={(v) => update('clothing', v)}
                onLockedSelect={requestPurchase}
                baseConfig={config}
                configKey="clothing"
                unlockedItems={unlockedItems}
              />
              <SwatchPicker
                label="Cor da roupa"
                value={config.clothesColor}
                swatches={CLOTHES_COLORS}
                onChange={(v) => update('clothesColor', v)}
              />
            </div>

            {config.clothing === 'graphicShirt' && (
              <ThumbnailPicker
                label="Estampa da camisa"
                value={config.clothingGraphic}
                options={GRAPHIC_OPTIONS}
                onChange={(v) => update('clothingGraphic', v)}
                onLockedSelect={requestPurchase}
                baseConfig={config}
                configKey="clothingGraphic"
                unlockedItems={unlockedItems}
              />
            )}

            {/* Toggles */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <ToggleWithVariant
                label="Óculos"
                enabled={config.accessoriesProbability === 100}
                onToggle={(v) => update('accessoriesProbability', v ? 100 : 0)}
                value={config.accessories}
                options={ACCESSORIES_OPTIONS}
                onChange={(v) => update('accessories', v)}
                onLockedSelect={requestPurchase}
                baseConfig={{ ...config, accessoriesProbability: 100 }}
                configKey="accessories"
                unlockedItems={unlockedItems}
              />
              <ToggleWithVariant
                label="Barba / Bigode"
                enabled={config.facialHairProbability === 100}
                onToggle={(v) => update('facialHairProbability', v ? 100 : 0)}
                value={config.facialHair}
                options={FACIAL_HAIR_OPTIONS}
                onChange={(v) => update('facialHair', v)}
                onLockedSelect={requestPurchase}
                baseConfig={{ ...config, facialHairProbability: 100 }}
                configKey="facialHair"
                unlockedItems={unlockedItems}
              />
            </div>

            {config.facialHairProbability === 100 && (
              <SwatchPicker
                label="Cor da barba"
                value={config.facialHairColor}
                swatches={HAIR_COLORS}
                onChange={(v) => update('facialHairColor', v)}
              />
            )}

            <SwatchPicker
              label="Cor de fundo"
              value={config.backgroundColor}
              swatches={BG_COLORS}
              onChange={(v) => update('backgroundColor', v)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-3 p-6">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full border border-border bg-background px-8 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm(config);
              onOpenChange(false);
            }}
            className="rounded-full bg-foreground px-8 py-2.5 text-sm font-semibold text-background transition-all hover:scale-[1.02] hover:opacity-90"
          >
            Confirmar
          </button>
        </div>
      </DialogContent>
    </Dialog>
    <AlertDialog open={Boolean(pendingPurchase)} onOpenChange={(isOpen) => !isOpen && setPendingPurchase(null)}>
      <AlertDialogContent className="rounded-3xl border-border/40 bg-background/95 backdrop-blur-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Comprar item?</AlertDialogTitle>
          <AlertDialogDescription>
            {pendingPurchase
              ? `${pendingPurchase.label} custa ${formatPrice(pendingPurchase.item.price)}. Seu saldo atual é ${formatPrice(balance)}.`
              : ''}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {pendingPurchase && (() => {
          const cat = pendingPurchase.item.category as keyof AvatarConfig;
          const previewConfig = { ...config, [cat]: pendingPurchase.item.value } as AvatarConfig;
          return (
            <div className="flex items-center gap-4 rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 via-muted/30 to-amber-500/5 p-4">
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full bg-background ring-2 ring-primary/20 shadow-lg">
                <AvatarPreview config={previewConfig} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Pré-visualização
                </p>
                <p className="mt-0.5 truncate text-base font-semibold text-foreground">
                  {pendingPurchase.label}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 ring-1 ring-amber-500/20">
                  <Coins className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    {formatPrice(pendingPurchase.item.price)}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {!pendingHasEnoughBalance && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            Saldo insuficiente para desbloquear este item.
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={!pendingHasEnoughBalance} onClick={confirmPurchase}>
            Desbloquear
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export { AvatarPreview };
export type { AvatarConfig };
export default AvatarCustomizer;
