import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Cropper, { Area } from 'react-easy-crop';
import { Check, X, RotateCw } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';

interface Props {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onConfirm: (croppedDataUrl: string) => void;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', err => reject(err));
    img.crossOrigin = 'anonymous';
    img.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d ctx');

  const rotRad = (rotation * Math.PI) / 180;
  const { width: bBoxWidth, height: bBoxHeight } = {
    width:
      Math.abs(Math.cos(rotRad) * image.width) +
      Math.abs(Math.sin(rotRad) * image.height),
    height:
      Math.abs(Math.sin(rotRad) * image.width) +
      Math.abs(Math.cos(rotRad) * image.height),
  };

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.putImageData(data, 0, 0);

  return canvas.toDataURL('image/jpeg', 0.9);
}

const ImageCropDialog = ({ open, imageSrc, onClose, onConfirm }: Props) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const cropped = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onConfirm(cropped);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-3xl border-border/50 bg-background/95 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="p-6"
        >
          <div className="mb-4">
            <h2 className="text-lg font-bold text-foreground tracking-tight">Ajustar imagem</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Arraste para reposicionar e use o slider para aproximar
            </p>
          </div>

          {/* Crop area (1:1 to match card thumb) */}
          <div className="relative w-full h-72 bg-black rounded-2xl overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="rect"
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* Controls */}
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Zoom</label>
              <Slider
                value={[zoom]}
                onValueChange={v => setZoom(v[0])}
                min={1}
                max={3}
                step={0.01}
              />
            </div>

            <button
              onClick={() => setRotation(r => (r + 90) % 360)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent hover:bg-accent/80 transition-colors text-xs font-medium text-foreground"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Girar 90°
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 mt-6">
            <button
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={processing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:brightness-110 transition-all shadow-sm disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {processing ? 'Processando...' : 'Aplicar'}
            </button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropDialog;
