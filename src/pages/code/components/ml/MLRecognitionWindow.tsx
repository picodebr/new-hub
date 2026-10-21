/**
 * MLRecognitionWindow - A "Janela de Vidência" da IA.
 *
 * Responsabilidade: Gerenciar a webcam do usuário (aba WEBCAM) ou analisar uma
 * imagem enviada pelo usuário (aba ARQUIVO) e executar o loop de inferência.
 * Orquestra a injeção dinâmica dos scripts do TensorFlow.js e MobileNet,
 * carrega os pesos do modelo customizado e emite eventos globais com as predições
 * para que os blocos do Blockly possam reagir ao que a câmera "vê".
 */
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { useProject } from '@/_base/context/ProjectContext';
import { useUI } from '@/_base/context/UIContext';
import { ITMModel, IMLPrediction } from '@/_base/domain/entities';

type InputTab = 'webcam' | 'arquivo';

interface MLRecognitionWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

// Envolver em memo para evitar re-renderizações inúteis quando o pai (BlocklyWorkspace) re-renderiza
export const MLRecognitionWindow: React.FC<MLRecognitionWindowProps> = React.memo(({ isOpen, onClose }) => {
  const { activeStageMLModel, activeUploadMLModel } = useProject();
  const { isUploadMode } = useUI();

  const activeModel = isUploadMode ? activeUploadMLModel : activeStageMLModel;

  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<InputTab>('webcam');
  const windowRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileImgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [fileImageReady, setFileImageReady] = useState(false);

  // TF.js & Model State
  const [modelLoading, setModelLoading] = useState(false);
  const tmModelRef = useRef<ITMModel | null>(null);
  const reqAnimFrameRef = useRef<number | null>(null);
  const [predictions, setPredictions] = useState<IMLPrediction[]>([]);

  const loadedModelUrlRef = useRef<string | null>(null);
  useEffect(() => {
    const currentUrl = activeModel?.modelJsonUrl;
    if (currentUrl && loadedModelUrlRef.current && loadedModelUrlRef.current !== currentUrl) {
      tmModelRef.current = null;
      setPredictions([]);
    }
    if (currentUrl) {
      loadedModelUrlRef.current = currentUrl;
    }
  }, [activeModel]);

  // Initial position shifted right to avoid overlapping the toolbox
  const [position, setPosition] = useState({ x: 350, y: 50 });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const [size, setSize] = useState({ width: 320, height: 480 });
  const isResizing = useRef(false);
  const resizeDir = useRef<string | null>(null);
  const startResize = useRef({ width: 0, height: 0, mouseX: 0, mouseY: 0, x: 0, y: 0 });

  const [isDraggingState, setIsDraggingState] = useState(false);
  const [isResizingState, setIsResizingState] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const threshold = 650; // Altura base para começar a escalar
      const vh = window.innerHeight;
      if (vh < threshold) {
        setScale(vh / threshold);
      } else {
        setScale(1);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    setIsDraggingState(true);

    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      // Compensamos o scale no offset para o drag ser suave em qualquer tamanho
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'move';
  };

  const handleResizeMouseDown = (e: React.MouseEvent, dir: string) => {
    e.stopPropagation();
    e.preventDefault();
    isResizing.current = true;
    resizeDir.current = dir;
    setIsResizingState(true);
    startResize.current = {
      width: size.width,
      height: size.height,
      mouseX: e.clientX,
      mouseY: e.clientY,
      x: position.x,
      y: position.y,
    };
    document.body.style.userSelect = 'none';

    // Set specific cursor for the body during resize
    const cursors: Record<string, string> = {
      e: 'e-resize',
      w: 'w-resize',
      s: 's-resize',
      se: 'nwse-resize',
      sw: 'nesw-resize',
    };
    document.body.style.cursor = cursors[dir] || 'nwse-resize';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const newX = e.clientX - dragOffset.current.x;
        const newY = e.clientY - dragOffset.current.y;
        setPosition({ x: newX, y: newY });
      } else if (isResizing.current && resizeDir.current) {
        const dir = resizeDir.current;
        const dx_screen = e.clientX - startResize.current.mouseX;
        const dy_screen = e.clientY - startResize.current.mouseY;
        const dx = dx_screen / scale;
        const dy = dy_screen / scale;

        let newWidth = startResize.current.width;
        let newHeight = startResize.current.height;
        let newX = startResize.current.x;
        const newY = startResize.current.y;

        if (dir.includes('e')) {
          newWidth = Math.max(280, Math.min(800, startResize.current.width + dx));
        }
        if (dir.includes('w')) {
          const possibleWidth = startResize.current.width - dx;
          if (possibleWidth >= 280 && possibleWidth <= 800) {
            newWidth = possibleWidth;
            newX = startResize.current.x + dx_screen;
          } else if (possibleWidth < 280) {
            // Travar no mínimo
            const lockedDx = (startResize.current.width - 280) * scale;
            newWidth = 280;
            newX = startResize.current.x + lockedDx;
          }
        }
        if (dir.includes('s')) {
          newHeight = Math.max(300, Math.min(900, startResize.current.height + dy));
        }

        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      if (isDragging.current || isResizing.current) {
        isDragging.current = false;
        isResizing.current = false;
        resizeDir.current = null;
        setIsDraggingState(false);
        setIsResizingState(false);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
    };

    if (isOpen) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen]);

  // --- Carrega o modelo TF (sem câmera) ---
  const ensureModelLoaded = useCallback(async (): Promise<boolean> => {
    if (tmModelRef.current) return true;
    if (!activeModel) return false;

    setCameraError(null);
    setModelLoading(true);
    try {
      await tf.ready();

      const [modelResponse, binResponse] = await Promise.all([
        fetch(activeModel.modelJsonUrl),
        fetch(activeModel.modelBinUrl),
      ]);

      if (!modelResponse.ok) throw new Error(`Falha ao baixar model.json (${modelResponse.status})`);
      if (!binResponse.ok) throw new Error(`Falha ao baixar weights.bin (${binResponse.status})`);

      const modelJson = await modelResponse.json();
      const weightData = await binResponse.arrayBuffer();
      const weightSpecs = modelJson.weightsManifest?.[0]?.weights ?? [];

      const baseModel = await mobilenet.load();
      const customModel = await tf.loadLayersModel(tf.io.fromMemory(modelJson.modelTopology, weightSpecs, weightData));

      tmModelRef.current = {
        baseModel: baseModel as unknown as ITMModel['baseModel'],
        customModel: customModel as unknown as ITMModel['customModel'],
      };
      setModelLoading(false);
      return true;
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : 'Erro ao carregar modelo');
      setModelLoading(false);
      return false;
    }
  }, [activeModel]);

  // Função auxiliar: roda inferência em qualquer elemento de imagem/vídeo
  const runInference = useCallback(
    (source: HTMLVideoElement | HTMLImageElement) => {
      if (!tmModelRef.current || !activeModel) return;

      const { baseModel, customModel } = tmModelRef.current;
      let formattedData: IMLPrediction[] = [];

      tf.tidy(() => {
        const imgTensor = tf.browser.fromPixels(source);
        const resized = tf.image.resizeBilinear(imgTensor, [224, 224]);
        const activation = (baseModel as any).infer(resized as tf.Tensor3D, true);

        const preds = (customModel as tf.LayersModel).predict(activation) as tf.Tensor;
        const data = preds.dataSync() as Float32Array;
        formattedData = Array.from(data).map((val: number, i: number) => ({
          label: activeModel?.labels?.[i] || `Classe ${i}`,
          value: Math.round(val * 100),
        }));
      });

      if (formattedData.length > 0) {
        setPredictions(formattedData);
        window.dispatchEvent(new CustomEvent('ml-predictions-update', { detail: formattedData }));
      }
    },
    [activeModel],
  );

  // --- Inicialização de Modelo & Câmera (Loop de Predição) para aba WEBCAM ---
  useEffect(() => {
    if (activeTab !== 'webcam') return;
    let isPredicting = true;

    const initModelAndCamera = async () => {
      if (!isOpen || collapsed || !activeModel) return;

      setCameraError(null);
      setCameraReady(false);
      const ok = await ensureModelLoaded();
      if (!ok) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => console.warn('Auto-play:', e));
          setCameraReady(true);
          loop();
        }
      } catch (err) {
        setCameraError(err instanceof Error ? err.message : 'Erro ao acessar câmera');
      }
    };

    // LOOP DE PREDIÇÃO (INFERENCE LOOP):
    // Captura o quadro atual da webcam, redimensiona para 224x224 (padrão MobileNet)
    // e passa pela rede neural customizada. O uso de 'tf.tidy' é CRÍTICO para
    // evitar vazamento de memória (Memory Leak) na GPU do navegador.
    const loop = () => {
      if (!isPredicting) return;
      if (videoRef.current && videoRef.current.readyState >= 2) {
        try {
          runInference(videoRef.current);
        } catch {
          /* ignora erros de frame */
        }
      }
      reqAnimFrameRef.current = window.requestAnimationFrame(loop);
    };

    initModelAndCamera();

    const videoElem = videoRef.current;
    return () => {
      isPredicting = false;
      if (reqAnimFrameRef.current) window.cancelAnimationFrame(reqAnimFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoElem) videoElem.srcObject = null;
      setCameraReady(false);
    };
  }, [isOpen, activeModel, collapsed, activeTab, ensureModelLoaded, runInference]);

  // --- Para a câmera ao mudar para aba ARQUIVO ---
  useEffect(() => {
    if (activeTab !== 'arquivo') return;
    if (reqAnimFrameRef.current) window.cancelAnimationFrame(reqAnimFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
    setPredictions([]);
  }, [activeTab]);

  // --- Inferência ao carregar imagem do arquivo ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    const url = URL.createObjectURL(file);
    setUploadedImageUrl(url);
    setFileImageReady(false);
    setPredictions([]);
  };

  const handleFileImageLoad = async () => {
    setFileImageReady(true);
    const ok = await ensureModelLoaded();
    if (!ok || !fileImgRef.current) return;
    try {
      runInference(fileImgRef.current);
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : 'Erro na inferência');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={windowRef}
      className={`fixed bg-[#ffffff] rounded-[16px] shadow-lg overflow-hidden flex flex-col ${isDraggingState || isResizingState ? '' : 'transition-all duration-300'} animate-in zoom-in h-auto`}
      style={{
        zIndex: 100000,
        width: `${size.width}px`,
        height: collapsed ? 'auto' : `${size.height}px`,
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        border: 'none',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Overlay invisível durante o drag para garantir que mousemove não seja perdido */}
      {isDraggingState && <div className="absolute inset-0 z-[1001] cursor-move" />}

      {/* Header / Titular (Matching CodePreview Style) */}
      <div
        className="d-flex justify-content-between align-items-center px-2 py-2 select-none cursor-move border-b border-gray-100 flex-nowrap"
        onMouseDown={handleMouseDown}
        style={{ backgroundColor: '#ffffff', minHeight: '44px' }}
      >
        <div className="d-flex align-items-center flex-shrink-0 me-2 overflow-hidden">
          <span
            className={`me-1 ${cameraReady && !collapsed ? 'blink-dot' : ''}`}
            style={{
              color: cameraError ? '#dc3545' : cameraReady ? '#22c55e' : '#cbd5e1',
              fontSize: '0.5rem',
            }}
          >
            ●
          </span>
          <h6 className="m-0 fw-semibold whitespace-nowrap text-truncate" style={{ color: '#1e293b', fontSize: '0.85rem' }}>
            Câmera IA
          </h6>
        </div>

        <div className="d-flex align-items-center gap-1 relative z-30 flex-shrink-0">
          {/* Abas WEBCAM / ARQUIVO compactas no Header */}
          <div className="flex bg-[#f1f5f9] rounded-[6px] p-[2px] gap-[2px] border border-[#e2e8f0]">
            {(['webcam', 'arquivo'] as InputTab[]).map((tab) => (
              <button
                key={tab}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => {
                  setActiveTab(tab);
                  setCameraError(null);
                }}
                className="px-2 py-0.5 rounded-[4px] transition-all duration-200 whitespace-nowrap"
                style={{
                  backgroundColor: activeTab === tab ? '#ffffff' : 'transparent',
                  color: activeTab === tab ? '#1e293b' : '#64748b',
                  boxShadow: activeTab === tab ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  border: 'none',
                  lineHeight: '1.2',
                  fontSize: '11px',
                  fontWeight: 'normal',
                }}
              >
                {tab === 'webcam' ? 'Webcam' : 'Arquivo'}
              </button>
            ))}
          </div>

          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(!collapsed);
            }}
            className="btn btn-sm d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              borderRadius: '6px',
              width: '24px',
              height: '24px',
              padding: 0,
              transition: 'all 0.2s ease',
            }}
            title={collapsed ? 'Expandir' : 'Minimizar'}
          >
            <i className={`bi ${collapsed ? 'bi-fullscreen' : 'bi-dash-lg'}`} style={{ fontSize: '0.75rem' }} />
          </button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="btn btn-sm d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              borderRadius: '6px',
              width: '24px',
              height: '24px',
              padding: 0,
              transition: 'all 0.2s ease',
            }}
            title="Fechar Vídeo"
          >
            <i className="bi bi-x-lg" style={{ fontSize: '0.75rem' }} />
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex flex-col bg-[#ffffff] overflow-y-auto min-h-0 custom-scrollbar flex-grow" style={{ display: collapsed ? 'none' : 'flex' }}>
        <div className="p-3 pb-0">
          {/* Área de visualização (câmera ou imagem) */}
          <div className="relative w-full aspect-[4/3] bg-gray-900 rounded-[1.2rem] border-4 border-white overflow-hidden shadow-inner">
            {cameraError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 text-[10px] font-black px-4 text-center uppercase tracking-widest">
                <i className="bi bi-exclamation-triangle-fill mb-2 text-2xl animate-pulse" />
                <span>{cameraError}</span>
              </div>
            ) : activeTab === 'webcam' ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                {!cameraReady && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-[10px] font-black uppercase animate-pulse">
                    <i className="bi bi-camera-video mr-2 text-2xl" /> Ligando...
                  </div>
                )}
              </>
            ) : /* Aba ARQUIVO */
            uploadedImageUrl ? (
              <>
                <img
                  ref={fileImgRef}
                  src={uploadedImageUrl}
                  alt="Imagem para análise"
                  onLoad={handleFileImageLoad}
                  className="w-full h-full object-contain"
                  crossOrigin="anonymous"
                />
                {!fileImageReady && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-[10px] font-black uppercase animate-pulse">
                    Carregando...
                  </div>
                )}
              </>
            ) : (
              /* Drop zone / botão de upload */
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer bg-transparent border-none w-full"
              >
                <i className="bi bi-cloud-upload text-4xl" />
                <span className="text-[10px] font-black uppercase tracking-widest">Escolher Imagem</span>
                <span className="text-[9px] text-gray-600 normal-case font-medium">PNG, JPG, WEBP</span>
              </button>
            )}
          </div>

          {/* Input de arquivo oculto */}
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleFileChange} />

          {/* Botão de trocar imagem (aba ARQUIVO, após upload) */}
          {activeTab === 'arquivo' && uploadedImageUrl && (
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => {
                setUploadedImageUrl(null);
                setFileImageReady(false);
                setPredictions([]);
                setCameraError(null);
              }}
              className="mt-2 w-full text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none py-1"
            >
              <i className="bi bi-arrow-repeat me-1" /> Trocar imagem
            </button>
          )}
        </div>

        <div className="bg-[#ffffff] mt-3 border-t-4 border-[#ffffff] overflow-hidden">
          <div className="flex flex-col gap-3 max-h-[136px] overflow-y-auto custom-scrollbar px-8 my-6 mx-2">
            {!activeModel ? (
              <div className="text-center py-6">
                <i className="bi bi-box-seam text-4xl text-gray-200 mb-2 block"></i>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Sem Modelo</p>
              </div>
            ) : modelLoading ? (
              <div className="text-center py-6">
                <i className="bi bi-arrow-repeat animate-spin text-3xl text-[#4C97FF] mb-2 block"></i>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Carregando IA...</p>
              </div>
            ) : (
              (() => {
                // Se tivermos predições, usamos elas.
                // Se não, mas tivermos um modelo, mostramos as classes com 0%.
                const items = predictions.length > 0 ? predictions : (activeModel?.labels || []).map((label) => ({ label, value: 0 }));

                if (items.length === 0) {
                  return (
                    <div className="text-center py-6 italic text-[10px] text-gray-400 font-black uppercase tracking-widest">
                      {activeTab === 'webcam' ? 'Aguardando vídeo...' : 'Envie uma imagem...'}
                    </div>
                  );
                }

                return items.map((item, idx) => {
                  const isHighConf = item.value > 80;
                  const barColor = isHighConf ? 'bg-[#FFD93D]' : item.value > 40 ? 'bg-[#4C97FF]' : 'bg-[#004bb3]';

                  return (
                    <div key={idx} className="flex items-center gap-3 w-full">
                      <span className="text-[9px] font-black text-gray-400 w-12 truncate text-right uppercase tracking-tighter shrink-0">
                        {item.label}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full text-center relative overflow-hidden h-5 shadow-inner border border-gray-50/50">
                        <div
                          className={`absolute top-0 left-0 h-full transition-all duration-300 ease-out rounded-full ${barColor}`}
                          style={{ width: `${Math.max(item.value, 5)}%` }}
                        />
                        <span
                          className={`relative z-10 text-[9px] font-black flex items-center justify-center h-full drop-shadow-sm ${item.value > 20 ? 'text-white' : item.value > 0 ? 'text-gray-400' : 'text-transparent'}`}
                        >
                          {item.value}%
                        </span>
                      </div>
                    </div>
                  );
                });
              })()
            )}
          </div>
        </div>
      </div>

      {/* RESIZE HANDLES */}
      {!collapsed && (
        <>
          {/* Borda Direita */}
          <div
            className="absolute top-0 right-0 w-1.5 h-full cursor-e-resize z-[1002] hover:bg-black/5"
            onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
          />
          {/* Borda Esquerda */}
          <div
            className="absolute top-0 left-0 w-1.5 h-full cursor-w-resize z-[1002] hover:bg-black/5"
            onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
          />
          {/* Borda Inferior */}
          <div
            className="absolute bottom-0 left-0 w-full h-1.5 cursor-s-resize z-[1002] hover:bg-black/5"
            onMouseDown={(e) => handleResizeMouseDown(e, 's')}
          />
          {/* Canto Inferior Direito (Atualizado) */}
          <div
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-[1003] d-flex align-items-end justify-content-end p-1 hover:bg-black/10 rounded-bl-[12px]"
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-300"
            >
              <line x1="21" y1="21" x2="9" y2="9" />
              <line x1="21" y1="15" x2="15" y2="21" />
            </svg>
          </div>
          {/* Canto Inferior Esquerdo */}
          <div
            className="absolute bottom-0 left-0 w-6 h-6 cursor-nesw-resize z-[1003] d-flex align-items-end justify-content-start p-1 hover:bg-black/10 rounded-br-[12px]"
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-300"
              style={{ transform: 'scaleX(-1)' }}
            >
              <line x1="21" y1="21" x2="9" y2="9" />
              <line x1="21" y1="15" x2="15" y2="21" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
});

MLRecognitionWindow.displayName = 'MLRecognitionWindow';
