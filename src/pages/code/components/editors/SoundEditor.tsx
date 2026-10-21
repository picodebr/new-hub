/**
 * SoundEditor - Editor de áudio com estética infantil inspirada no Scratch 3.0.
 * Efeitos portados fielmente do scratch-gui/src/lib/audio/audio-effects.js
 */
'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useProject } from '@/_base/context/ProjectContext';
import WaveformViewer, { WaveSelection } from '../shared/WaveformViewer';
import LiveWaveform from '../shared/LiveWaveform';
import { Undo2, Redo2, Volume2, Volume1, VolumeX, FastForward, Rewind, Waves, Bot, ChevronRight, ChevronLeft, Mic } from 'lucide-react';
import { applyEffect, EffectName } from '@/_base/lib/audio/AudioEffects';
import { AudioRecorder } from '@/_base/lib/audio/AudioRecorder';
import { ScratchAddButton } from '../shared/ScratchAddButton';

/* ── UI Helpers (Matching PaintEditor Pattern) ── */
const RibbonGroup: React.FC<{ label: string; color?: string; gap?: string; children: React.ReactNode; isShort?: boolean }> = ({
  label,
  color = 'text-sky-400',
  gap = 'gap-1',
  children,
  isShort,
}) => (
  <div className={`flex flex-col items-center shrink-0 border-r border-slate-100 last:border-0 ${isShort ? 'px-1.5 py-0.5' : 'px-3 py-1'}`}>
    <div className={`flex items-center justify-center ${gap} ${isShort ? 'h-7' : 'h-10'}`}>{children}</div>
    {!isShort && <span className={`text-[9px] uppercase tracking-wider font-bold ${color}`}>{label}</span>}
  </div>
);

const RibbonBtn: React.FC<{
  onClick: () => void;
  title: string;
  disabled?: boolean;
  isActive?: boolean;
  children: React.ReactNode;
  label?: string;
  isShort?: boolean;
}> = ({ onClick, title, disabled, isActive, children, label, isShort }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`flex flex-col items-center justify-center rounded-xl transition-all duration-150
            ${isShort ? 'p-1 min-w-[32px]' : 'p-2 min-w-[44px]'}
            ${
              disabled
                ? 'opacity-20 grayscale pointer-events-none'
                : isActive
                  ? 'bg-[#4483ff] text-white shadow-sm'
                  : 'text-[#4483ff] hover:bg-white hover:shadow-md hover:scale-105 active:scale-95'
            }`}
  >
    <div className={`flex items-center justify-center ${isShort ? 'h-4' : 'h-5'}`}>{children}</div>
    {label && !isShort && <span className="text-[9px] font-bold mt-0.5">{label}</span>}
  </button>
);

const Sep: React.FC<{ isShort?: boolean }> = ({ isShort }) => (
  <div className={`w-px ${isShort ? 'h-6' : 'h-10'} bg-gradient-to-b from-transparent via-slate-200 to-transparent mx-1 shrink-0`} />
);

export default function SoundEditor() {
  const { activeSprite, addSoundToSprite, removeSoundFromSprite, renameSound, switchSound, updateSoundData } = useProject();

  const [viewMode, setViewMode] = useState<'editor' | 'recorder'>('editor');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pilha de buffers para undo/redo
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [bufferHistory, setBufferHistory] = useState<AudioBuffer[]>([]);
  const [redoHistory, setRedoHistory] = useState<AudioBuffer[]>([]);
  const [applyingEffect, setApplyingEffect] = useState(false);
  const [, setActiveEffectKey] = useState<EffectName | null>(null);
  const [selection, setSelection] = useState<WaveSelection | null>(null);

  // Refs síncronos — evitam stale closures e race conditions entre efeitos
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const applyingRef = useRef(false);

  /** Atualiza buffer no state E no ref ao mesmo tempo (síncrono) */
  const updateBuffer = useCallback((buf: AudioBuffer | null) => {
    audioBufferRef.current = buf;
    setAudioBuffer(buf);
  }, []);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playhead, setPlayhead] = useState<number | null>(null);
  const [editingSoundId, setEditingSoundId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  // Recorder
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'finished'>('idle');
  const [recorderLevel, setRecorderLevel] = useState(0);
  const [liveData, setLiveData] = useState<Uint8Array | null>(null);
  const [recordedBuffer, setRecordedBuffer] = useState<AudioBuffer | null>(null);
  const [recordedSamples, setRecordedSamples] = useState<Float32Array | null>(null);
  const [recordedSampleRate, setRecordedSampleRate] = useState(44100);
  const [recordedName, setRecordedName] = useState('');
  const recorderRef = useRef<AudioRecorder | null>(null);
  const [recorderError, setRecorderError] = useState<string | null>(null);

  // Tela com pouca altura (ex: laptop pequeno, janela reduzida)
  const [isShortScreen, setIsShortScreen] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-height: 720px)');
    setIsShortScreen(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsShortScreen(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Preview da gravação na tela de salvar
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [recordedPlayhead, setRecordedPlayhead] = useState<number | null>(null);
  const recordedSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const recordedCtxRef = useRef<AudioContext | null>(null);
  const recordedAnimationRef = useRef<number | null>(null);

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);

  // ── Setup gravador ──────────────────────────────────────────────────
  useEffect(() => {
    if (viewMode === 'recorder') {
      setRecorderError(null);
      const recorder = new AudioRecorder((rms, data) => {
        setRecorderLevel(rms);
        setLiveData(new Uint8Array(data));
      });
      recorderRef.current = recorder;
      recorder.startListening().catch(() => setRecorderError('Não foi possível acessar o microfone. Verifique as permissões do navegador.'));
      return () => {
        recorder.stopListening();
        setRecordingStatus('idle');
        setRecordedBuffer(null);
        setLiveData(null);
      };
    }
  }, [viewMode]);

  const lastSoundIdRef = useRef<string | null>(null);

  // ── Carregar AudioBuffer do som atual ───────────────────────────────
  useEffect(() => {
    const soundId = activeSprite?.currentSoundId;

    if (viewMode !== 'editor' || !soundId) {
      updateBuffer(null);
      setBufferHistory([]);
      setRedoHistory([]);
      lastSoundIdRef.current = null;
      return;
    }

    const sound = (activeSprite.sounds ?? []).find((s) => s.id === soundId);
    if (!sound) {
      updateBuffer(null);
      return;
    }

    // Se o ID do som mudou (trocou de som na lista), resetamos o histórico
    if (soundId !== lastSoundIdRef.current) {
      setBufferHistory([]);
      setRedoHistory([]);
      setSelection(null);
      setActiveEffectKey(null);
      lastSoundIdRef.current = soundId;
    } else {
      // Se o ID é o mesmo e já temos um buffer, não recarregamos do URL.
      // Isso preserva o histórico de Undo quando salvamos o efeito de volta no projeto.
      if (audioBufferRef.current) {
        return;
      }
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(sound.url);
        const ab = await res.arrayBuffer();
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const decoded = await ctx.decodeAudioData(ab);
        if (!cancelled) {
          updateBuffer(decoded);
        }
      } catch {
        if (!cancelled) updateBuffer(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    stopPlayback();
    return () => {
      cancelled = true;
    };
  }, [activeSprite?.currentSoundId, activeSprite?.sounds, viewMode]);

  // ── Parar playback ──────────────────────────────────────────────────
  const stopPlayback = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
    setPlayhead(null);
  }, []);

  // ── Parar preview da gravação ────────────────────────────────────────
  const stopPlayingRecorded = useCallback(() => {
    if (recordedAnimationRef.current) cancelAnimationFrame(recordedAnimationRef.current);
    if (recordedSourceRef.current) {
      try {
        recordedSourceRef.current.stop();
      } catch {
        /* already stopped */
      }
      recordedSourceRef.current = null;
    }
    if (recordedCtxRef.current) {
      recordedCtxRef.current.close().catch(() => {});
      recordedCtxRef.current = null;
    }
    setIsPlayingRecorded(false);
    setRecordedPlayhead(null);
  }, []);

  // ── Play do preview da gravação ──────────────────────────────────────
  const handlePlayRecorded = useCallback(() => {
    if (!recordedBuffer) return;
    if (isPlayingRecorded) {
      stopPlayingRecorded();
      return;
    }
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    recordedCtxRef.current = ctx;
    const source = ctx.createBufferSource();
    source.buffer = recordedBuffer;
    source.connect(ctx.destination);

    const startedAt = ctx.currentTime;
    setIsPlayingRecorded(true);

    const tick = () => {
      const elapsed = ctx.currentTime - startedAt;
      const progress = Math.min(elapsed / recordedBuffer.duration, 1);
      setRecordedPlayhead(progress);
      if (progress < 1) recordedAnimationRef.current = requestAnimationFrame(tick);
    };
    recordedAnimationRef.current = requestAnimationFrame(tick);

    source.onended = () => {
      setIsPlayingRecorded(false);
      setRecordedPlayhead(null);
      recordedSourceRef.current = null;
      if (recordedAnimationRef.current) cancelAnimationFrame(recordedAnimationRef.current);
    };
    recordedSourceRef.current = source;
    source.start(0);
  }, [recordedBuffer, isPlayingRecorded, stopPlayingRecorded]);

  // ── Play usando AudioContext (buffer direto, sem URL) ────────────────
  const handlePlay = useCallback(() => {
    const buf = audioBufferRef.current;
    if (!buf) return;

    if (isPlaying) {
      stopPlayback();
      return;
    }

    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    audioCtxRef.current = ctx;
    const source = ctx.createBufferSource();
    source.buffer = buf;
    source.connect(ctx.destination);

    const startedAt = ctx.currentTime;
    setIsPlaying(true);

    const tick = () => {
      const elapsed = ctx.currentTime - startedAt;
      const progress = Math.min(elapsed / buf.duration, 1);
      setPlayhead(progress);
      if (progress < 1) animationRef.current = requestAnimationFrame(tick);
    };
    animationRef.current = requestAnimationFrame(tick);

    source.onended = () => {
      setIsPlaying(false);
      setPlayhead(null);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };

    source.start(0);
  }, [isPlaying, stopPlayback]);

  // ── Aplicar efeito (destructivo, com histórico para undo) ────────────
  const handleApplyEffect = useCallback(
    async (effectKey: EffectName) => {
      const buf = audioBufferRef.current;
      if (!buf || applyingRef.current) return;
      applyingRef.current = true;
      setApplyingEffect(true);
      stopPlayback();
      try {
        const result = await applyEffect(buf, effectKey, selection);
        setBufferHistory((prev) => [...prev, buf]);
        setRedoHistory([]);
        setActiveEffectKey(effectKey);
        updateBuffer(result);

        // Persistir no estado global/VM
        const samples = result.getChannelData(0);
        const blob = AudioRecorder.encodeWAV(samples, result.sampleRate);
        await updateSoundData(activeSprite.id, activeSprite.currentSoundId!, blob);
      } finally {
        applyingRef.current = false;
        setApplyingEffect(false);
      }
    },
    [stopPlayback, updateBuffer, selection, activeSprite, updateSoundData],
  );

  const handleUndo = useCallback(() => {
    const current = audioBufferRef.current;
    if (bufferHistory.length === 0 || !current) return;
    stopPlayback();
    const prev = bufferHistory[bufferHistory.length - 1];
    setBufferHistory((h) => h.slice(0, -1));
    setRedoHistory((r) => [...r, current]);
    setActiveEffectKey(null);
    updateBuffer(prev);

    // Persistir volta no estado global/VM
    const samples = prev.getChannelData(0);
    const blob = AudioRecorder.encodeWAV(samples, prev.sampleRate);
    updateSoundData(activeSprite.id, activeSprite.currentSoundId!, blob);
  }, [bufferHistory, stopPlayback, updateBuffer, activeSprite, updateSoundData]);

  const handleRedo = useCallback(() => {
    const current = audioBufferRef.current;
    if (redoHistory.length === 0 || !current) return;
    stopPlayback();
    const next = redoHistory[redoHistory.length - 1];
    setRedoHistory((r) => r.slice(0, -1));
    setBufferHistory((h) => [...h, current]);
    setActiveEffectKey(null);
    updateBuffer(next);

    // Persistir volta no estado global/VM
    const samples = next.getChannelData(0);
    const blob = AudioRecorder.encodeWAV(samples, next.sampleRate);
    updateSoundData(activeSprite.id, activeSprite.currentSoundId!, blob);
  }, [redoHistory, stopPlayback, updateBuffer, activeSprite, updateSoundData]);

  // ── Outros handlers ─────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await addSoundToSprite(activeSprite!.id, file);
      setViewMode('editor');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRenameSubmit = () => {
    if (editingSoundId && tempName.trim()) renameSound(activeSprite!.id, editingSoundId, tempName.trim());
    setEditingSoundId(null);
  };

  const handleStartRecording = () => {
    recorderRef.current?.startRecording();
    setRecordingStatus('recording');
  };

  const handleStopRecording = () => {
    const result = recorderRef.current?.stopRecording();
    if (result) {
      setRecordedSamples(result.samples);
      setRecordedSampleRate(result.sampleRate);
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const buf = ctx.createBuffer(1, result.samples.length, result.sampleRate);
      buf.getChannelData(0).set(result.samples);
      setRecordedBuffer(buf);
      const now = new Date();
      setRecordedName(`Gravação ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
      setRecordingStatus('finished');
    }
  };

  const handleSaveRecording = async () => {
    if (!recordedSamples?.length) return;
    stopPlayingRecorded();
    const blob = AudioRecorder.encodeWAV(recordedSamples, recordedSampleRate);
    const safeName = (recordedName.trim() || 'gravacao').replace(/[^a-zA-Z0-9À-ÿ\s_-]/g, '');
    const file = new File([blob], `${safeName}.wav`, { type: 'audio/wav' });
    await addSoundToSprite(activeSprite!.id, file);
    setViewMode('editor');
  };

  if (!activeSprite) {
    return <div className="p-4 flex-1 h-full bg-white flex items-center justify-center text-slate-400">Nenhum ator selecionado</div>;
  }

  // ── Tamanhos responsivos por altura de tela ──────────────────────────
  const S = isShortScreen;
  const headerH = S ? 40 : 56;
  const iconSize = S ? 28 : 36;
  const titleFs = S ? 15 : 18;
  const contentPad = S ? '8px 14px' : '24px 20px';
  const waveH = S ? 64 : 200; // Aumentado para preencher melhor o espaço
  const editorGap = S ? 6 : 24;
  const playSize = S ? 48 : 80; // Aumentado ligeiramente para telas grandes
  const playBorder = S ? 4 : 5;
  const playIconFs = S ? 20 : 28;

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex h-full w-full bg-[#f0f0f0] overflow-hidden min-h-0 min-w-0">
      {/* Unified Container with border matching Blockly Workspace */}
      <div className="flex-1 flex overflow-hidden border-t-[1px] border-r-[1px] border-[#ccc] rounded-tr-[16px] bg-[#fafafa] shadow-[inset_-3px_0_0_0_black]">
        {/* ── Sidebar ── */}
        <div className="w-[90px] flex flex-col bg-[#f8fafc] border-r border-[#ccc] flex-shrink-0 relative z-[200] overflow-visible">
          <div className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-2 items-center custom-scrollbar relative">
            {(activeSprite.sounds ?? []).map((sound, index) => {
              const isActive = activeSprite.currentSoundId === sound.id && viewMode === 'editor';
              const isEditing = editingSoundId === sound.id;

              return (
                <div
                  key={sound.id}
                  onClick={() => {
                    switchSound(activeSprite.id, sound.id);
                    setViewMode('editor');
                  }}
                  onDoubleClick={() => {
                    setEditingSoundId(sound.id);
                    setTempName(sound.name);
                  }}
                  className={`flex flex-col items-center w-full relative group cursor-pointer box-border rounded-[8px]
                                        ${
                                          isActive
                                            ? 'bg-[#4483ff] text-white border-2 border-[#4483ff] shadow-[0_0_0_2px_rgba(68,131,255,0.3)]'
                                            : 'bg-white text-[#575e75] border-2 border-[#c3cddb] hover:border-[#4483ff]'
                                        }`}
                  style={{
                    paddingTop: S ? '12px' : '20px',
                    paddingBottom: '4px',
                  }}
                >
                  <span className={`absolute top-1 left-2 text-[10px] font-bold ${isActive ? 'text-white' : 'text-[#575e75]'}`}>{index + 1}</span>

                  <div className="flex items-center justify-center mb-1">
                    <i
                      className={`bi bi-music-note-beamed ${isActive ? 'text-white' : 'text-[#4483ff]'}`}
                      style={{ fontSize: S ? '22px' : '32px' }}
                    ></i>
                  </div>

                  {isEditing ? (
                    <div className="px-1 w-full box-border">
                      <input
                        autoFocus
                        className="w-full text-center bg-white text-black border border-blue-400 outline-none rounded-sm shadow-inner"
                        style={{ fontSize: '12px', padding: '1px 0', height: '14px', lineHeight: '1' }}
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold truncate w-full text-center px-1">{sound.name}</span>
                  )}

                  <span className={`text-[8px] -mt-0.5 truncate w-full text-center px-1 ${isActive ? 'text-white/80' : 'text-[#888]'}`}>
                    {isActive && audioBuffer ? `${audioBuffer.duration.toFixed(2)}s` : '0.00s'}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSoundFromSprite(activeSprite.id, sound.id);
                    }}
                    className={`absolute d-flex align-items-center justify-content-center transition-all border-0 z-[10] ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto'}`}
                    style={{
                      width: '18px',
                      height: '18px',
                      top: '-5px',
                      right: '-5px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      color: '#575e75',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
                      cursor: 'pointer',
                      display: 'flex',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#ff4d4d';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = '#575e75';
                    }}
                  >
                    <i className="bi bi-x-lg" style={{ fontSize: '8px' }}></i>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Bottom Add Menu (Scratch Style) */}
          <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '80px', pointerEvents: 'none' }}>
            <div style={{ pointerEvents: 'auto' }}>
              <ScratchAddButton
                mainLabel="Escolher um Som"
                mainTitle="Adicionar Som"
                mainIcon="bi-plus-lg"
                onMainClick={() => {}}
                center={true}
                alignLabel="right"
                items={[
                  { icon: 'bi-mic-fill', title: 'Gravar Som', onClick: () => setViewMode('recorder') },
                  { icon: 'bi-upload', title: 'Carregar Som', onClick: () => fileInputRef.current?.click() },
                  { icon: 'bi-stars', title: 'Surpresa', onClick: () => addSoundToSprite(activeSprite.id) },
                ]}
              />
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" style={{ display: 'none' }} />
            </div>
          </div>
        </div>

        {/* ── Main Area ───────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#e9eef2]">
          {/* Ribbon Style Header */}
          <div
            className="flex bg-[#fafafa] border-b border-[#ccc] shrink-0 select-none overflow-x-auto overflow-y-hidden custom-scrollbar items-center px-2"
            style={{ height: headerH }}
          >
            {/* Group: Name & Info */}
            <RibbonGroup label="Som" isShort={S}>
              <div className="flex items-center gap-2 px-1">
                <div className="flex items-center justify-center text-sky-600 opacity-80" style={{ width: iconSize, height: iconSize }}>
                  <i className={`bi ${viewMode === 'recorder' ? 'bi-mic-fill' : 'bi-soundwave'}`} style={{ fontSize: iconSize * 0.5 }}></i>
                </div>
                {viewMode === 'editor' && activeSprite.currentSoundId ? (
                  <input
                    className="bg-transparent border-none font-bold text-slate-700 outline-none w-24 sm:w-40"
                    style={{ fontSize: titleFs }}
                    value={(activeSprite.sounds ?? []).find((s) => s.id === activeSprite.currentSoundId)?.name ?? ''}
                    onChange={(e) => renameSound(activeSprite.id, activeSprite.currentSoundId!, e.target.value)}
                    placeholder="Nome do som..."
                  />
                ) : (
                  <span className="font-bold text-slate-700 px-1" style={{ fontSize: titleFs }}>
                    {viewMode === 'recorder' ? 'Gravador' : 'Nenhum Som'}
                  </span>
                )}
              </div>
            </RibbonGroup>

            {/* Group: History */}
            {viewMode === 'editor' && (
              <RibbonGroup label="Editar" isShort={S}>
                <RibbonBtn onClick={handleUndo} title="Desfazer" disabled={bufferHistory.length === 0} isShort={S}>
                  <Undo2 size={S ? 14 : 18} strokeWidth={1.5} />
                </RibbonBtn>
                <RibbonBtn onClick={handleRedo} title="Refazer" disabled={redoHistory.length === 0} isShort={S}>
                  <Redo2 size={S ? 14 : 18} strokeWidth={1.5} />
                </RibbonBtn>
              </RibbonGroup>
            )}

            <Sep isShort={S} />

            {/* Group: Effects (Speed) */}
            {viewMode === 'editor' && activeSprite.currentSoundId && (
              <>
                <RibbonGroup label="Velocidade" isShort={S}>
                  <RibbonBtn onClick={() => handleApplyEffect('faster')} title="Mais Rápido" isShort={S}>
                    <FastForward size={S ? 14 : 18} strokeWidth={1.5} />
                  </RibbonBtn>
                  <RibbonBtn onClick={() => handleApplyEffect('slower')} title="Mais Devagar" isShort={S}>
                    <Rewind size={S ? 14 : 18} strokeWidth={1.5} />
                  </RibbonBtn>
                </RibbonGroup>

                <RibbonGroup label="Volume" isShort={S}>
                  <RibbonBtn onClick={() => handleApplyEffect('louder')} title="Mais Alto" isShort={S}>
                    <Volume2 size={S ? 14 : 18} strokeWidth={1.5} />
                  </RibbonBtn>
                  <RibbonBtn onClick={() => handleApplyEffect('softer')} title="Mais Baixo" isShort={S}>
                    <Volume1 size={S ? 14 : 18} strokeWidth={1.5} />
                  </RibbonBtn>
                  <RibbonBtn onClick={() => handleApplyEffect('mute')} title="Silenciar" isShort={S}>
                    <div className="relative">
                      <VolumeX size={S ? 14 : 18} strokeWidth={1.5} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-[2px] bg-red-500 rotate-45 transform"></div>
                      </div>
                    </div>
                  </RibbonBtn>
                </RibbonGroup>

                <RibbonGroup label="Efeitos" isShort={S}>
                  <RibbonBtn onClick={() => handleApplyEffect('echo')} title="Eco" isShort={S}>
                    <Waves size={S ? 14 : 18} strokeWidth={1.5} />
                  </RibbonBtn>
                  <RibbonBtn onClick={() => handleApplyEffect('robot')} title="Robô" isShort={S}>
                    <Bot size={S ? 14 : 18} strokeWidth={1.5} />
                  </RibbonBtn>
                  <RibbonBtn onClick={() => handleApplyEffect('reverse')} title="Inverter" isShort={S}>
                    <i className="bi bi-arrow-left-right" style={{ fontSize: S ? 12 : 16 }}></i>
                  </RibbonBtn>
                </RibbonGroup>

                <RibbonGroup label="Fade" isShort={S}>
                  <RibbonBtn onClick={() => handleApplyEffect('fadein')} title="Entrada" isShort={S}>
                    <ChevronRight size={S ? 14 : 18} strokeWidth={1.5} />
                  </RibbonBtn>
                  <RibbonBtn onClick={() => handleApplyEffect('fadeout')} title="Saída" isShort={S}>
                    <ChevronLeft size={S ? 14 : 18} strokeWidth={1.5} />
                  </RibbonBtn>
                </RibbonGroup>
              </>
            )}
          </div>

          {/* Canvas Area Style Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar flex flex-col" style={{ padding: contentPad }}>
            <div className={`max-w-4xl w-full mx-auto flex flex-col items-center flex-1 ${S ? 'justify-start' : 'justify-center'}`}>
              {/* Editor View */}
              {viewMode === 'editor' && activeSprite.currentSoundId && (
                <div className="flex flex-col items-center w-full flex-1 justify-center" style={{ gap: editorGap }}>
                  {/* Waveform Container */}
                  <div className="w-full flex-1 min-h-[140px] max-h-[300px] rounded-[24px] bg-white border border-[#ccc] shadow-[inset_0_2px_12px_rgba(0,0,0,0.03)] p-4 overflow-hidden relative flex items-center justify-center">
                    {loading || applyingEffect ? (
                      <div style={{ height: waveH }} className="flex flex-col items-center justify-center gap-2 text-sky-500">
                        <div
                          className={`border-2 border-sky-500 border-t-transparent rounded-full animate-spin ${S ? 'w-6 h-6' : 'w-10 h-10'}`}
                        ></div>
                        <span className="font-bold text-[11px] uppercase tracking-wider">{applyingEffect ? 'Aplicando...' : 'Carregando...'}</span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center">
                        <WaveformViewer
                          buffer={audioBuffer}
                          height={S ? 80 : 200}
                          playhead={playhead}
                          color="#4483ff"
                          selection={selection}
                          onSelectionChange={setSelection}
                        />
                      </div>
                    )}
                  </div>

                  {/* Control Bar */}
                  <div className="flex items-center justify-center w-full">
                    <button
                      onClick={handlePlay}
                      disabled={loading || !audioBuffer || applyingEffect}
                      className={`shadow-xl flex items-center justify-center transition-all duration-200 border-white
                                                ${isPlaying ? 'scale-110' : 'hover:scale-110 active:scale-95 shadow-lg'} 
                                                ${!audioBuffer || loading || applyingEffect ? 'opacity-80 grayscale-[0.3] cursor-not-allowed' : 'cursor-pointer'}`}
                      style={{
                        width: playSize,
                        height: playSize,
                        borderRadius: '50%',
                        borderWidth: playBorder,
                        backgroundColor: isPlaying ? '#ff4d4d' : '#4483ff',
                      }}
                    >
                      <i
                        className={`bi ${isPlaying ? 'bi-stop-fill' : 'bi-play-fill'} text-white ${!isPlaying && 'pl-1'}`}
                        style={{ fontSize: playIconFs }}
                      ></i>
                    </button>
                  </div>
                </div>
              )}

              {/* Recorder View */}
              {viewMode === 'recorder' && (
                <div className={`flex-1 flex flex-col items-center justify-center ${S ? 'gap-3' : 'gap-6'} py-4 w-full`}>
                  {(recordingStatus === 'idle' || recordingStatus === 'recording') &&
                    (recorderError ? (
                      <div className="bg-red-50 border-2 border-red-100 p-8 rounded-[32px] text-center max-w-sm">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <i className="bi bi-exclamation-triangle-fill text-red-500 text-[24px]"></i>
                        </div>
                        <h3 className="text-red-900 font-black text-lg mb-2">Ops!</h3>
                        <p className="text-red-700 font-medium mb-6 text-sm">{recorderError}</p>
                        <button
                          onClick={() => setViewMode('editor')}
                          className="bg-white border-2 border-red-200 text-red-600 px-6 py-2 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-colors shadow-sm"
                        >
                          Voltar
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          {recordingStatus === 'recording' && <div className="absolute inset-[-15px] rounded-full bg-red-500/10 animate-ping"></div>}
                          <div
                            className={`flex items-center justify-center shadow-2xl transition-all duration-500 ${recordingStatus === 'recording' ? 'bg-red-500 scale-110 shadow-red-500/30' : 'bg-sky-500 shadow-sky-500/30'}`}
                            style={{ width: S ? 80 : 120, height: S ? 80 : 120, borderRadius: '50%' }}
                          >
                            <Mic size={S ? 40 : 56} className="text-white" />
                          </div>
                        </div>

                        <div
                          className={`px-6 py-1.5 rounded-full font-black text-sm shadow-sm border-2 ${recordingStatus === 'recording' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-sky-50 border-sky-100 text-sky-600'}`}
                        >
                          {recordingStatus === 'recording' ? 'GRAVANDO' : 'PRONTO PARA GRAVAR'}
                        </div>

                        <div className="w-full max-w-md bg-white p-3 rounded-[24px] border border-[#ccc] shadow-sm overflow-hidden">
                          <LiveWaveform data={liveData} height={S ? 60 : 80} color={recordingStatus === 'recording' ? '#ef4444' : '#0ea5e9'} />
                          <div className="h-2 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-75 ${recordingStatus === 'recording' ? 'bg-red-500' : 'bg-sky-500'}`}
                              style={{ width: `${Math.min(recorderLevel * 150, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        <button
                          onClick={recordingStatus === 'idle' ? handleStartRecording : handleStopRecording}
                          className={`border-white shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95`}
                          style={{ 
                            width: playSize, 
                            height: playSize, 
                            borderRadius: '50%', 
                            borderWidth: playBorder - 1, 
                            cursor: 'pointer',
                            backgroundColor: recordingStatus === 'recording' ? '#333333' : '#ff4d4d'
                          }}
                        >
                          {recordingStatus === 'recording' ? (
                            <div className="w-5 h-5 bg-white rounded-sm" />
                          ) : (
                            <div className="w-5 h-5 bg-white rounded-full" />
                          )}
                        </button>
                      </>
                    ))}

                  {recordingStatus === 'finished' && (
                    <div className={`w-full max-w-lg flex flex-col ${S ? 'gap-2' : 'gap-4'} animate-in zoom-in-95 duration-300`}>
                      <div
                        className={`bg-white ${S ? 'p-3' : 'p-5'} rounded-[24px] border border-[#ccc] shadow-sm flex flex-col ${S ? 'gap-2' : 'gap-4'}`}
                      >
                        <div className="flex flex-col gap-1 px-2">
                          <label className="text-sky-600 font-bold text-[10px] tracking-widest uppercase">Nome do Som</label>
                          <input
                            autoFocus
                            className={`w-full ${S ? 'text-lg' : 'text-xl'} font-bold text-slate-700 border-b-2 border-sky-100 focus:border-sky-400 outline-none pb-1 transition-colors`}
                            value={recordedName}
                            onChange={(e) => setRecordedName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveRecording()}
                          />
                        </div>

                        <div className={`bg-sky-50 rounded-2xl ${S ? 'p-2' : 'p-3'} border border-sky-100`}>
                          <WaveformViewer buffer={recordedBuffer} height={S ? 60 : 100} color="#4483ff" playhead={recordedPlayhead} />
                        </div>

                        <div className="flex items-center justify-center">
                          <button
                            onClick={handlePlayRecorded}
                            className={`shadow-lg flex items-center justify-center transition-all border-white ${isPlayingRecorded ? 'bg-red-500' : ''}`}
                            style={{ 
                              width: S ? 40 : 64, 
                              height: S ? 40 : 64, 
                              borderRadius: '50%', 
                              borderWidth: S ? 3 : 4,
                              backgroundColor: isPlayingRecorded ? '#ff4d4d' : '#4483ff'
                            }}
                          >
                            <i
                              className={`bi ${isPlayingRecorded ? 'bi-stop-fill' : 'bi-play-fill'} text-white ${!isPlayingRecorded && 'pl-1'}`}
                              style={{ fontSize: S ? 18 : 28 }}
                            ></i>
                          </button>
                        </div>
                      </div>

                      <div className={`flex ${S ? 'gap-2' : 'gap-3'}`}>
                        <button
                          onClick={() => {
                            stopPlayingRecorded();
                            setRecordingStatus('idle');
                          }}
                          className={`flex-1 bg-white border border-slate-200 ${S ? 'py-2' : 'py-3'} rounded-[32px] font-bold text-sm text-slate-500 hover:bg-slate-50 transition-colors`}
                          style={{ borderRadius: '32px' }}
                        >
                          Descartar
                        </button>
                        <button
                          onClick={handleSaveRecording}
                          className={`flex-[2] ${S ? 'py-2' : 'py-3'} font-bold text-sm text-white shadow-lg shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all`}
                          style={{ borderRadius: '32px', backgroundColor: '#4483ff' }}
                        >
                          Salvar som
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Empty View */}
              {viewMode === 'editor' && !activeSprite.currentSoundId && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-60 py-8">
                  <div
                    className="rounded-full border-4 border-dashed border-slate-300 flex items-center justify-center grayscale"
                    style={{ width: S ? 100 : 160, height: S ? 100 : 160 }}
                  >
                    <i className="bi bi-soundwave text-slate-300" style={{ fontSize: S ? 48 : 80 }}></i>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 font-bold text-xs">Adicione um novo som na lista ao lado!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
