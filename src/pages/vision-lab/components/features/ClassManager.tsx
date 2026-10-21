import React, { useRef } from 'react';
import { PlusCircle, Trash2, Video, Upload } from 'lucide-react';
import { useVisionLabStore, VisionLabClassData } from '@/_base/hooks';
import { extractFeatures } from '@/_base/lib/ml';

export function ClassManager() {
  const { classes, addClass } = useVisionLabStore();

  return (
    <div className="glass-card flex-1 rounded-3xl p-6 border border-border/60 shadow-xl flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
        <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
        <h3 className="text-base font-bold text-foreground">Aprendizado de Máquina (Classes)</h3>
      </div>

      {/* Classes Container */}
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {classes.map((cls, index) => (
          <ClassCard key={cls.id} classData={cls} index={index} />
        ))}
      </div>

      {/* Add Class */}
      <div className="pt-3 border-t border-border/40">
        <button
          type="button"
          onClick={addClass}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-border/80 hover:border-primary/60 text-muted-foreground hover:text-primary font-bold text-xs flex items-center justify-center gap-2 transition-all hover:bg-primary/5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Adicionar Outra Classe</span>
        </button>
      </div>
    </div>
  );
}

interface ClassCardProps {
  classData: VisionLabClassData;
  index: number;
}

export function ClassCard({ classData, index }: ClassCardProps) {
  const { classes, updateClassName, removeSample, addSample, openWebcamModal, openConfirmModal } = useVisionLabStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasSamples = classData.samples.length > 0;

  const handleDeleteClassClick = () => {
    if (classes.length <= 2) {
      openConfirmModal(classData.id, 'info_min_classes');
    } else {
      openConfirmModal(classData.id, 'remove');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      await new Promise<void>((resolve) => {
        const img = new window.Image();
        const url = URL.createObjectURL(file);
        img.onload = async () => {
          try {
            const { activation, thumbnail } = await extractFeatures(img, false);
            addSample(classData.id, thumbnail, activation);
          } catch (err) {
            console.error('Erro ao processar imagem:', err);
          }
          URL.revokeObjectURL(url);
          resolve();
        };
        img.src = url;
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-sm flex flex-col space-y-3 transition-all hover:border-primary/50">
      {/* Header do Card */}
      <div className="flex items-center justify-between gap-2">
        <input
          value={classData.name}
          onChange={(e) => updateClassName(classData.id, e.target.value)}
          placeholder="Nome da Classe"
          className="flex-1 font-bold text-sm text-foreground bg-muted/40 hover:bg-muted px-3 py-1.5 rounded-xl border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
        />

        <button
          type="button"
          onClick={handleDeleteClassClick}
          className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
          title={classes.length <= 2 ? 'Limpar fotos da classe' : 'Excluir classe'}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Conteúdo do Card */}
      <div>
        {!hasSamples ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => openWebcamModal(classData.id)}
              className="py-2.5 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Video className="w-4 h-4" />
              <span>Webcam</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-3 rounded-xl bg-accent hover:bg-accent/80 text-foreground text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Arquivo</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
              <span>{classData.samples.length} Exemplos Coletados</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openWebcamModal(classData.id)}
                  className="p-1 rounded-lg hover:bg-accent text-foreground transition-colors"
                  title="Capturar mais com Webcam"
                >
                  <Video className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 rounded-lg hover:bg-accent text-foreground transition-colors"
                  title="Enviar mais fotos"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Lista de Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-1 min-h-[50px]">
              {classData.samples.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => removeSample(classData.id, sample.id)}
                  className="relative group w-12 h-12 rounded-xl overflow-hidden border border-border shrink-0 cursor-pointer shadow-sm"
                  title="Clique para excluir foto"
                >
                  <img src={sample.thumbnail} alt="Amostra" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        multiple
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}
