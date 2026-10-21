/**
 * Componente MLMonitorModal - Monitor de Reconhecimento de Machine Learning.
 *
 * Exibe o feed de vídeo da câmera e as barras de probabilidade das classes detectadas
 * usando os mesmos estilos do SerialMonitor.
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { MLExtensionModal } from '../ml/MLExtensionModal';
import { useProject } from '@/_base/context/ProjectContext';
import { useFirmware } from '@/_base/context/FirmwareContext';
import { ITMModel } from '@/_base/domain/entities';

type InputTab = 'webcam' | 'arquivo';

interface MLMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
}


export default function MLMonitorModal({ isOpen, onClose, onBack }: MLMonitorModalProps) {
  const { activeUploadMLModel } = useProject();
  const { serialPort, board, isSerialConnected } = useFirmware();

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileImgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<InputTab>('webcam');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [fileImageReady, setFileImageReady] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false); // Ligar/Desligar câmera
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);

  // TF.js & Model State
  const [modelLoading, setModelLoading] = useState(false);
  const tmModelRef = useRef<ITMModel | null>(null);
  const reqAnimFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [predictions, setPredictions] = useState<{ label: string; value: number }[]>([]);

  const borderColor = '#6f42c1'; // Roxo (Cor comum para IA/ML)
  const labelsRef = useRef<string[]>([]);
  const lastSentClassRef = useRef<string>('');
  const frameCounterRef = useRef(0);

  const loadedModelUrlRef = useRef<string | null>(null);

  // Keep labelsRef in sync with model
  useEffect(() => {
    if (activeUploadMLModel?.labels) {
      labelsRef.current = activeUploadMLModel.labels;
    }

    const currentUrl = activeUploadMLModel?.modelJsonUrl;
    if (currentUrl && loadedModelUrlRef.current && loadedModelUrlRef.current !== currentUrl) {
      // O modelo mudou! Limpar rede neural antiga da RAM para não sobrepor classes velhas
      tmModelRef.current = null;
      setPredictions([]);
      setIsMonitoring(false);
      setCameraReady(false);

      if (reqAnimFrameRef.current) {
        window.cancelAnimationFrame(reqAnimFrameRef.current);
        reqAnimFrameRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    if (currentUrl) {
      loadedModelUrlRef.current = currentUrl;
    }
  }, [activeUploadMLModel]);

  // Limpar recursos ao fechar
  const stopCameraAndIA = useCallback(() => {
    setIsMonitoring(false);
    setCameraReady(false);
    if (reqAnimFrameRef.current) {
      window.cancelAnimationFrame(reqAnimFrameRef.current);
      reqAnimFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setPredictions([]);

    // Reverte para o baud rate padrão (Firmata) para não quebrar os blocos
    if (isSerialConnected && board && 'setBaudRate' in board) {
      (board as unknown as { setBaudRate: (br: number) => Promise<void> }).setBaudRate(9600).catch((e: unknown) => console.warn(e));
    }
  }, [isSerialConnected, board]);

  useEffect(() => {
    if (!isOpen) {
      stopCameraAndIA();
      setIsModelSelectorOpen(false);
    } else if (!activeUploadMLModel) {
      // Se abrir o monitor e não tiver modelo, já pede para escolher
      setIsModelSelectorOpen(true);
    }
  }, [isOpen, activeUploadMLModel, stopCameraAndIA]);

  // --- Inicialização de Modelo & Câmera ---
  const startMonitoring = async () => {
    if (!isOpen || !activeUploadMLModel) {
      if (!activeUploadMLModel) setCameraError('Nenhum modelo carregado no projeto.');
      return;
    }

    // Verifica se a placa está conectada para o modo Upload
    if (!isSerialConnected) {
      setCameraError('A placa não está conectada. Conecte a placa primeiro para enviar os dados.');
      return;
    }

    setCameraError(null);
    setModelLoading(true);
    setCameraReady(false);
    setIsMonitoring(true);

    // Aplica o baud rate de 9600 para comunicação serial simples de ML
    if (isSerialConnected && board && 'setBaudRate' in board) {
      try {
        await (board as unknown as { setBaudRate: (br: number) => Promise<void> }).setBaudRate(9600);
      } catch (e) {
        console.warn('Falha ao mudar baud rate para ML:', e);
      }
    }

    try {
      await tf.ready();

      // Carregar modelos apenas se não estiverem na ref
      if (!tmModelRef.current) {
        const [modelResponse, binResponse] = await Promise.all([
          fetch(activeUploadMLModel.modelJsonUrl),
          fetch(activeUploadMLModel.modelBinUrl),
        ]);
        if (!modelResponse.ok)
          throw new Error(`Falha ao baixar model.json (HTTP ${modelResponse.status})`);
        if (!binResponse.ok)
          throw new Error(`Falha ao baixar weights.bin (HTTP ${binResponse.status})`);

        const modelJson = await modelResponse.json();
        const weightData = await binResponse.arrayBuffer();
        const weightSpecs = modelJson.weightsManifest?.[0]?.weights ?? [];

        const baseModel = await mobilenet.load();
        const customModel = await tf.loadLayersModel(
          tf.io.fromMemory(modelJson.modelTopology, weightSpecs, weightData),
        );
        tmModelRef.current = {
          baseModel: baseModel as unknown as ITMModel['baseModel'],
          customModel: customModel as unknown as ITMModel['customModel'],
        };
      }

      setModelLoading(false);

      // Ligar Câmera (apenas aba webcam)
      if (activeTab === 'webcam') {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      }
      loop(); // Iniciar predição (com a fonte baseada na aba)
    } catch (err: unknown) {
      console.error('Erro ao iniciar ML:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao carregar modelo ou câmera';
      setCameraError(msg);
      setModelLoading(false);
      setIsMonitoring(false);
    }
  };

  const loop = async () => {
    // Usa isMonitoring em tempo real através do fechamento ou de uma var if necessary,
    // mas as we re-trigger loop it will stop if the video element is unmounted or pause
    if (tmModelRef.current) {
      try {
        let sourceElement: HTMLVideoElement | HTMLImageElement | null = null;
        if (activeTab === 'webcam' && videoRef.current && videoRef.current.readyState >= 2) {
          sourceElement = videoRef.current;
        } else if (activeTab === 'arquivo' && fileImgRef.current && fileImageReady && uploadedImageUrl) {
          sourceElement = fileImgRef.current;
        }

        if (sourceElement) {
          const { baseModel, customModel } = tmModelRef.current;
          let formattedData: { label: string; value: number }[] = [];

          tf.tidy(() => {
            const imgTensor = tf.browser.fromPixels(sourceElement!);
            const resized = tf.image.resizeBilinear(imgTensor, [224, 224]);
            const activation = (baseModel as any).infer(resized as tf.Tensor3D, true);

            const preds = (customModel as tf.LayersModel).predict(activation) as tf.Tensor;
            const data = preds.dataSync() as Float32Array;

            formattedData = Array.from(data).map((val: number, i: number) => ({
              label: labelsRef.current[i] || `Classe ${i}`,
              value: Number((val * 100).toFixed(1)),
            }));
          });

          if (formattedData.length > 0) {
            // Atualiza UI a ~15fps (a cada 4 frames) para não sobrecarregar o React
            frameCounterRef.current = (frameCounterRef.current + 1) % 4;
            if (frameCounterRef.current === 0) {
              setPredictions(formattedData);
              window.dispatchEvent(new CustomEvent('ml-predictions-update', { detail: formattedData }));
            }

            // Send top class via Serial to Arduino continuously
            const topClass = formattedData.reduce((a, b) => (a.value > b.value ? a : b));
            if (topClass) {
              const payload = `${topClass.label}:${topClass.value.toFixed(1)}\n`;

              // Avoid flooding the console, only log when changed
              if (topClass.label !== lastSentClassRef.current) {
                lastSentClassRef.current = topClass.label;
                console.log('[ML Serial] TX:', JSON.stringify(payload));
              }

              // Obtenção da serial para enviar toda iteração
              if (isSerialConnected && board) {
                if (typeof board.writeString === 'function') {
                  // Usa then/catch vazio para não bloquear a thread aguardando
                  board.writeString(payload).catch((e) => console.warn(e));
                } else if (serialPort?.writable && !serialPort.writable.locked) {
                  try {
                    const writer = serialPort.writable.getWriter();
                    const encoder = new TextEncoder();
                    writer.write(encoder.encode(payload)).finally(() => writer.releaseLock());
                  } catch {
                    // Ignora erros de escrita serial
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('Predict error:', e);
      }
    }

    // Mantém rodando *apenas* se estivermos ligados
    // Nota: como lemos do escopo funcional, dependemos da limpeza cancelando o AF
    reqAnimFrameRef.current = window.requestAnimationFrame(loop);
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl);
    const url = URL.createObjectURL(file);
    setUploadedImageUrl(url);
    setFileImageReady(false);
    setPredictions([]);
  };

  const handleFileImageLoad = () => {
    setFileImageReady(true);
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal fade show"
      style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }}
      tabIndex={-1}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden" style={{ border: `3px solid ${borderColor}`, maxHeight: '95vh' }}>
          {/* CABEÇALHO (Unificado com Serial/Luz/Umidade) */}
          <div className="modal-header border-0 bg-white pb-2 flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 40, height: 40, backgroundColor: '#e2d9f3', color: borderColor }}
              >
                <i className="bi bi-eye-fill fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark lh-1">Câmera de IA</h5>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Visão Computacional e Inteligência Artificial
                </small>
              </div>
            </div>

            <div className="ms-auto d-flex align-items-center gap-2">
              {/* Abas WEBCAM / ARQUIVO compactas no Header */}
              <div
                className="d-flex"
                style={{ backgroundColor: '#f1f5f9', borderRadius: '6px', padding: '2px', gap: '2px', border: '1px solid #e2e8f0' }}
              >
                {(['webcam', 'arquivo'] as InputTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setCameraError(null);
                      stopCameraAndIA();
                    }}
                    className="btn btn-sm px-2 py-0 m-0 border-0"
                    style={{
                      backgroundColor: activeTab === tab ? '#ffffff' : 'transparent',
                      color: activeTab === tab ? '#1e293b' : '#64748b',
                      boxShadow: activeTab === tab ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                      fontSize: '0.75rem',
                      borderRadius: '4px',
                    }}
                  >
                    {tab === 'webcam' ? 'Webcam' : 'Arquivo'}
                  </button>
                ))}
              </div>
              <button
                className="btn btn-sm btn-outline-primary px-3 rounded-pill fw-bold"
                onClick={() => setIsModelSelectorOpen(true)}
                title="Trocar ou escolher um modelo Picode Hub"
              >
                <i className="bi bi-box-seam me-1"></i> Modelo
              </button>
              <button
                className="btn btn-sm px-2 py-1"
                onClick={() => {
                  stopCameraAndIA();
                  onBack();
                }}
                style={{
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          {/* CORPO DO MONITOR */}
          <div className="modal-body bg-white p-3 d-flex flex-column gap-3">
            {/* Feed de Vídeo Estilo Serial */}
            <div
              className="bg-black rounded-3 p-1 shadow-inner d-flex justify-content-center align-items-center position-relative overflow-hidden flex-shrink-0"
              style={{ height: '350px', maxHeight: '40vh', minHeight: '180px', border: '1px solid #444' }}
            >
              {cameraError ? (
                <div className="text-danger text-center font-monospace">
                  <i className="bi bi-exclamation-triangle-fill fs-3 mb-2 d-block"></i>
                  {cameraError}
                </div>
              ) : !isMonitoring ? (
                <div className="text-secondary text-center font-monospace">
                  <i className={`bi ${activeTab === 'webcam' ? 'bi-camera-video-off' : 'bi-file-image'} fs-1 mb-2 d-block`}></i>
                  {/* Clique em Conectar para iniciar a predição. */}
                </div>
              ) : activeTab === 'webcam' ? (
                <>
                  {(modelLoading || !cameraReady) && (
                    <div className="position-absolute top-50 start-50 translate-middle text-center font-monospace" style={{ zIndex: 10 }}>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      <span className={modelLoading ? 'text-info' : 'text-warning'}>
                        {modelLoading ? '// Carregando modelo...' : '// Ligando câmera...'}
                      </span>
                    </div>
                  )}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    onLoadedMetadata={() => setCameraReady(true)}
                    className="h-100 w-100 object-fit-contain"
                    style={{
                      transform: 'scaleX(-1)',
                      opacity: cameraReady ? 1 : 0,
                    }}
                  />
                </>
              ) : (
                <>
                  {uploadedImageUrl ? (
                    <>
                      <img
                        ref={fileImgRef}
                        src={uploadedImageUrl}
                        alt="Upload IA"
                        onLoad={handleFileImageLoad}
                        className="h-100 w-100 object-fit-contain"
                        crossOrigin="anonymous"
                      />
                      {!fileImageReady && (
                        <div className="position-absolute top-50 start-50 translate-middle text-center font-monospace" style={{ zIndex: 10 }}>
                          <span className="spinner-border spinner-border-sm me-2 text-warning" role="status" aria-hidden="true"></span>
                        </div>
                      )}
                      <div className="position-absolute bottom-0 end-0 p-2 opacity-75">
                        <button onClick={() => fileInputRef.current?.click()} className="btn btn-sm btn-dark bg-opacity-75 rounded border-0">
                          <i className="bi bi-arrow-repeat me-1"></i>Trocar
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-outline-secondary rounded-4 border-2 border-secondary d-flex flex-column align-items-center p-3"
                    >
                      <i className="bi bi-cloud-upload fs-2 mb-1"></i>
                      <span className="font-monospace small text-uppercase fw-bold">Escolher Imagem</span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="d-none"
                    onChange={handleFileChange}
                  />
                </>
              )}
            </div>

            {/* Área das Barras de Previsão */}
            <div className="bg-light rounded-3 p-3 shadow-sm border overflow-auto" style={{ minHeight: '120px', maxHeight: '30vh' }}>
              <h6 className="fw-bold text-secondary mb-3 fs-6">
                <i className="bi bi-bar-chart-fill me-2"></i>Classes Detectadas
              </h6>
              <div className="d-flex flex-column gap-2">
                {!activeUploadMLModel ? (
                  <span className="text-muted small font-monospace">Nenhum modelo selecionado no Vision Lab.</span>
                ) : (
                  (() => {
                    const items = predictions.length > 0 ? predictions : (activeUploadMLModel.labels || []).map((label) => ({ label, value: 0 }));

                    if (items.length === 0) {
                      return (
                        <span className="text-muted small font-monospace">
                          {activeTab === 'webcam' ? 'Ligue a câmera para começar' : 'Envie uma imagem para análise'}
                        </span>
                      );
                    }

                    return items.map((p, idx) => (
                      <div key={idx} className="d-flex align-items-center gap-2">
                        <span className="text-dark small font-monospace fw-bold text-truncate" style={{ width: '80px' }}>
                          {p.label}
                        </span>
                        <div className="progress flex-grow-1" style={{ height: '20px', backgroundColor: '#e9ecef' }}>
                          <div
                            className={`progress-bar ${p.value > 80 ? 'bg-success' : 'bg-primary'}`}
                            role="progressbar"
                            style={{ width: `${Math.max(p.value, 2)}%` }}
                            aria-valuenow={p.value}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            {p.value}%
                          </div>
                        </div>
                      </div>
                    ));
                  })()
                )}
              </div>
            </div>
          </div>

          {/* RODAPÉ E CONTROLES DE CONEXÃO */}
          <div className="modal-footer border-0 bg-white d-flex justify-content-end py-3">
            {!isMonitoring ? (
              <button
                className="btn btn-sm btn-primary px-4 rounded-pill fw-bold shadow-sm"
                onClick={startMonitoring}
                disabled={!activeUploadMLModel || isModelSelectorOpen}
              >
                <i className="bi bi-play-fill me-1"></i> Conectar
              </button>
            ) : (
              <button className="btn btn-sm btn-danger px-4 rounded-pill fw-bold" onClick={stopCameraAndIA}>
                <i className="bi bi-power me-1"></i> Parar
              </button>
            )}
          </div>
        </div>
      </div>

      <MLExtensionModal isOpen={isModelSelectorOpen} onClose={() => setIsModelSelectorOpen(false)} mode="upload" />
    </div>
  );
}
