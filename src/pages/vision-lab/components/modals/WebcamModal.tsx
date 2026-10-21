import React, { useEffect, useRef, useState } from 'react';
import { X, Video as VideoIcon, Disc } from 'lucide-react';
import { useVisionLabStore } from '@/_base/hooks';
import { getGlobalWebcam, getGlobalWebcamStream } from '@/_base/lib/webcam';
import { extractFeatures } from '@/_base/lib/ml';

export function VisionLabWebcamModal() {
  const { activeModalClassId, classes, closeWebcamModal, addSample } = useVisionLabStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const activeClass = classes.find((c) => c.id === activeModalClassId);

  useEffect(() => {
    if (activeModalClassId !== null) {
      getGlobalWebcam()
        .then(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = getGlobalWebcamStream();
          }
        })
        .catch(console.error);
    } else {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [activeModalClassId]);

  if (activeModalClassId === null || !activeClass) return null;

  const captureFrame = async () => {
    if (!videoRef.current) return;
    try {
      const { activation, thumbnail } = await extractFeatures(videoRef.current, true);
      addSample(activeClass.id, thumbnail, activation);
    } catch (err) {
      console.error(err);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    captureFrame();
    recordIntervalRef.current = setInterval(captureFrame, 100);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={closeWebcamModal}
      />

      {/* Modal Content */}
      <div className="glass-card relative z-10 w-full max-w-xl max-h-[92vh] rounded-3xl overflow-hidden border border-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border/60 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <VideoIcon className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              Capturar Imagens - <span className="text-primary">{activeClass.name}</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={closeWebcamModal}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-accent text-muted-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 flex flex-col items-center justify-center gap-4 overflow-y-auto">
          {/* Video Container */}
          <div className="relative w-full max-w-md aspect-square rounded-2xl bg-black overflow-hidden shadow-inner border-2 border-border/60">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            {isRecording && (
              <div className="absolute top-3 right-3 bg-rose-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
                REC
              </div>
            )}
          </div>

          {/* Record Button */}
          <button
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`w-full max-w-md py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg select-none transition-all ${
              isRecording
                ? 'bg-rose-700 scale-[0.98]'
                : 'bg-rose-600 hover:bg-rose-500 active:scale-95'
            }`}
          >
            <Disc className="w-5 h-5 animate-spin" />
            <span>SEGURE PARA GRAVAR</span>
          </button>
        </div>

        {/* Footer (Thumbnails Recentes) */}
        <div className="p-4 border-t border-border/60 bg-muted/20">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Capturadas Agora ({activeClass.samples.length})
          </p>

          <div className="flex gap-2 overflow-x-auto pb-1 min-h-[70px]">
            {activeClass.samples.slice(-15).map((sample) => (
              <div
                key={sample.id}
                className="w-14 h-14 rounded-xl overflow-hidden border border-border shrink-0"
              >
                <img src={sample.thumbnail} className="w-full h-full object-cover" alt="sample" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
