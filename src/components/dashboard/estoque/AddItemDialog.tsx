import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { Upload, X, Plus, Minus, ImagePlus, Crop } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import ImageCropDialog from './ImageCropDialog';

export interface NewItemPayload {
  name: string;
  quantity: number;
  reusable: boolean;
  isService: boolean;
  image: string;
  file?: File | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (item: NewItemPayload) => void;
}

function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

const schema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do item').max(120, 'Máximo 120 caracteres'),
  quantity: z.number().int().min(0, 'Quantidade inválida').max(99999, 'Quantidade muito alta'),
});

const AddItemDialog = ({ open, onClose, onAdd }: Props) => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reusable, setReusable] = useState(false);
  const [isService, setIsService] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  const reset = () => {
    setName('');
    setQuantity(1);
    setReusable(false);
    setIsService(false);
    setImage(null);
    setRawImage(null);
    setFileToUpload(null);
    setCropOpen(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Arquivo inválido', description: 'Selecione uma imagem.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Imagem muito grande', description: 'Tamanho máximo: 5 MB.', variant: 'destructive' });
      return;
    }
    setFileToUpload(file);
    const reader = new FileReader();
    reader.onload = e => {
      setRawImage(e.target?.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    const result = schema.safeParse({ name, quantity });
    if (!result.success) {
      toast({
        title: 'Verifique os campos',
        description: result.error.issues[0].message,
        variant: 'destructive',
      });
      return;
    }
    onAdd({
      name: result.data.name,
      quantity: result.data.quantity,
      reusable,
      isService,
      image: image || '',
      file: fileToUpload,
    });
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl border-border/50 bg-background/95 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="p-6"
        >
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground tracking-tight">Adicionar item ao estoque</h2>
            <p className="text-sm text-muted-foreground mt-1">Preencha os detalhes do componente</p>
          </div>

          {/* Image upload */}
          <div className="mb-5">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Imagem do item</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => handleFile(e.target.files?.[0])}
            />
            {image ? (
              <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-border/50 group">
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setImage(null); setRawImage(null); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center hover:bg-background transition-colors"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
                <div className="absolute bottom-2 right-2 flex gap-1.5">
                  {rawImage && (
                    <button
                      onClick={() => setCropOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md text-xs font-medium text-foreground hover:bg-background transition-colors"
                    >
                      <Crop className="w-3 h-3" />
                      Ajustar
                    </button>
                  )}
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md text-xs font-medium text-foreground hover:bg-background transition-colors"
                  >
                    Trocar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-40 rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-accent/30 transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ImagePlus className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Selecione a imagem</span>
                <span className="text-[11px] text-muted-foreground">PNG ou JPG até 5 MB · você poderá recortar em seguida</span>
              </button>
            )}
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nome do componente</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={120}
              placeholder="Ex: Abraçadeira de nylon 40 cm"
              className="w-full px-4 py-2.5 rounded-xl bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
            />
          </div>

          {/* Quantity + toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="min-w-0">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Quantidade</label>
              <div className="flex items-center gap-1 bg-card border border-border/50 rounded-xl p-1 h-11">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(0, quantity - 1))}
                  className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center bg-accent hover:bg-accent/80 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5 text-foreground" />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={quantity}
                  onChange={e => {
                    const v = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                    setQuantity(Math.min(99999, Math.max(0, v)));
                  }}
                  className="flex-1 min-w-0 w-full text-center text-sm font-semibold text-foreground bg-transparent border-0 focus:outline-none tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(99999, quantity + 1))}
                  className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center bg-accent hover:bg-accent/80 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-foreground" />
                </button>
              </div>
            </div>

            <div className="flex flex-col min-w-0">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">É reutilizável?</label>
              <div className="h-11 flex items-center justify-between px-3 rounded-xl bg-card border border-border/50">
                <span className="text-xs text-muted-foreground">{reusable ? 'Sim' : 'Não'}</span>
                <Switch checked={reusable} onCheckedChange={setReusable} />
              </div>
            </div>

            <div className="flex flex-col min-w-0">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">É um serviço?</label>
              <div className="h-11 flex items-center justify-between px-3 rounded-xl bg-card border border-border/50">
                <span className="text-xs text-muted-foreground">{isService ? 'Sim' : 'Não'}</span>
                <Switch checked={isService} onCheckedChange={setIsService} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:brightness-110 transition-all shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Adicionar
            </button>
          </div>
        </motion.div>
      </DialogContent>

      {rawImage && (
        <ImageCropDialog
          open={cropOpen}
          imageSrc={rawImage}
          onClose={() => setCropOpen(false)}
          onConfirm={(cropped) => {
            const croppedFile = dataURLtoFile(cropped, fileToUpload?.name || 'item.png');
            setFileToUpload(croppedFile);
            setImage(cropped);
            setCropOpen(false);
          }}
        />
      )}
    </Dialog>
  );
};

export default AddItemDialog;
