import React, { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, X, Download, Video, UploadCloud, CheckCircle2 } from 'lucide-react';
import { useVisionLabStore } from '@/_base/hooks';
import { predictImage, getModelArtifacts } from '@/_base/lib/ml';
import { getGlobalWebcam, getGlobalWebcamStream } from '@/_base/lib/webcam';
import { toast } from 'sonner';

export function PreviewPanel() {
  const { classes, isTrained } = useVisionLabStore();
  const [mode, setMode] = useState<'webcam' | 'file'>('webcam');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [predictions, setPredictions] = useState<number[]>([]);
  const isPredictingRef = useRef(false);

  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!isTrained) return;

    const runPredictLoop = async () => {
      if (mode === 'webcam' && videoRef.current) {
        try {
          const scores = await predictImage(videoRef.current, true);
          setPredictions(scores);
        } catch (e) {}
      }

      if (isPredictingRef.current) {
        requestAnimationFrame(runPredictLoop);
      }
    };

    if (mode === 'webcam') {
      getGlobalWebcam()
        .then(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = getGlobalWebcamStream();
            isPredictingRef.current = true;
            runPredictLoop();
          }
        })
        .catch(console.error);
    } else {
      isPredictingRef.current = false;
      if (videoRef.current) videoRef.current.srcObject = null;
    }

    return () => {
      isPredictingRef.current = false;
    };
  }, [isTrained, mode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setFileUrl(url);

    const img = new Image();
    img.src = url;
    img.onload = async () => {
      try {
        const scores = await predictImage(img, false);
        setPredictions(scores);
      } catch (err) {
        console.error(err);
      }
    };
  };

  const handleExportModel = async () => {
    try {
      const artifacts = await getModelArtifacts();
      const blob = new Blob([JSON.stringify(artifacts)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vision_lab_model.json';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Modelo exportado com sucesso!');
    } catch (err) {
      console.warn('Erro ao exportar modelo:', err);
      toast.error('Erro ao exportar modelo.');
    }
  };

  if (!isTrained) {
    return (
      <div className="glass-card flex-1 min-w-[300px] rounded-3xl p-6 border border-border/60 shadow-xl flex flex-col items-center justify-center text-center text-muted-foreground min-h-[360px]">
        <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center mb-3">
          <ImageIcon className="w-8 h-8 opacity-40" />
        </div>
        <h3 className="text-base font-bold text-foreground">Prévia do Modelo</h3>
        <p className="text-xs max-w-xs mt-1">
          Treine o modelo com as amostras para habilitar o teste em tempo real com webcam ou fotos.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card flex-1 min-w-[320px] rounded-3xl p-6 border border-border/60 shadow-xl flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div>
          <h3 className="text-base font-bold text-foreground">Teste do Modelo</h3>
          <p className="text-xs text-muted-foreground">Classificação em tempo real</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switch */}
          <div className="bg-muted/60 p-1 rounded-xl flex gap-1">
            <button
              type="button"
              onClick={() => setMode('webcam')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                mode === 'webcam' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Testar com Webcam"
            >
              <Video className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setMode('file')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                mode === 'file' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Testar com Imagem"
            >
              <UploadCloud className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportModel}
            className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            title="Exportar Modelo"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Viewport */}
      <div className="relative aspect-video w-full rounded-2xl bg-black overflow-hidden border border-border/60 flex items-center justify-center">
        {mode === 'webcam' ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
        ) : fileUrl ? (
          <img ref={imageRef} src={fileUrl} alt="Preview" className="w-full h-full object-contain" />
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer flex flex-col items-center justify-center text-muted-foreground hover:text-foreground p-4 text-center"
          >
            <UploadCloud className="w-8 h-8 mb-2" />
            <span className="text-xs font-semibold">Clique para carregar uma imagem de teste</span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Predictions Output Bars */}
      <div className="space-y-2.5 pt-2 flex-1">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Probabilidade das Classes
        </span>

        {classes.map((cls, idx) => {
          const rawPct = (predictions[idx] || 0) * 100;
          const pct = Math.min(100, Math.max(0, Math.round(rawPct)));
          const isHighest = predictions.length > 0 && Math.max(...predictions) === (predictions[idx] || 0) && pct > 30;

          return (
            <div key={cls.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold ${isHighest ? 'text-primary font-bold' : 'text-foreground'}`}>
                  {cls.name}
                </span>
                <span className="font-mono text-muted-foreground font-medium">{pct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isHighest ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
