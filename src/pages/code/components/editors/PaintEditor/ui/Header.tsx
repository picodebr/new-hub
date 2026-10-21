/**
 * PaintEditor Header - Painel de controle superior (Ribbon-style).
 *
 * Responsabilidade: Gerir as ações globais de edição (Undo/Redo, Flip, Group),
 * controles de estilo (Cores, Espessura de Traço, Fonte) e organização de
 * camadas. Implementa um design responsivo que adapta o tamanho dos ícones
 * e sliders conforme a largura da viewport.
 */
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Undo2,
  Redo2,
  FlipHorizontal,
  FlipVertical,
  Group,
  Ungroup,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Copy,
  Trash2,
} from 'lucide-react';
import HsbColorPicker from '../../../shared/HsbColorPicker';
import { PaintState } from '@/_base/domain/entities/IPaintEditor';

export type { PaintState };

interface HeaderProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onMoveForward: () => void;
  onMoveBackward: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  brushSize: number;
  fillTransparent: boolean;
  strokeTransparent: boolean;
  fontFamily: string;
  fontSize: number;
  activeToolId: string;
  onChangeState: (changes: Partial<PaintState>) => void;
}

/* ── Hook responsivo: retorna tamanhos baseados na largura da tela ── */
function useResponsiveSize() {
  const defaultSizes = React.useMemo(
    () => ({ icon: 16, pad: 'p-1.5', gap: 'gap-1', gpx: 'px-1.5', colorBox: 'w-7 h-7', slider: 'w-16 sm:w-20', fontSize: 'text-[12px]' }),
    [],
  );

  const calc = useCallback(() => {
    if (typeof window === 'undefined') return defaultSizes;
    const w = window.innerWidth;
    if (w < 800)
      return { icon: 12, pad: 'p-0.5', gap: 'gap-0.5', gpx: 'px-0.5', colorBox: 'w-5 h-5', slider: 'w-8 sm:w-10', fontSize: 'text-[10px]' };
    if (w < 1100) return { icon: 14, pad: 'p-1', gap: 'gap-0.5', gpx: 'px-1', colorBox: 'w-6 h-6', slider: 'w-12 sm:w-14', fontSize: 'text-[11px]' };
    if (w < 1400)
      return { icon: 16, pad: 'p-1.5', gap: 'gap-1', gpx: 'px-1.5', colorBox: 'w-7 h-7', slider: 'w-16 sm:w-20', fontSize: 'text-[12px]' };
    return { icon: 18, pad: 'p-2', gap: 'gap-2', gpx: 'px-2', colorBox: 'w-8 h-8', slider: 'w-20 sm:w-24', fontSize: 'text-[13px]' };
  }, [defaultSizes]);

  const [sizes, setSizes] = useState(defaultSizes);

  useEffect(() => {
    Promise.resolve().then(() => {
      const current = calc();
      setSizes((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(current)) return prev;
        return current;
      });
    });

    const onResize = () => setSizes(calc());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [calc]);

  return sizes;
}

/* ── Grupo estilo ribbon + visual infantil ── */
const RibbonGroup: React.FC<{ label: string; color?: string; gap?: string; gpx?: string; children: React.ReactNode }> = ({
  label,
  color = 'text-sky-400',
  gap = 'gap-0.5',
  gpx = 'px-1.5',
  children,
}) => (
  <div className="flex flex-col items-center shrink-0" title={label}>
    <div className={`flex items-end justify-center ${gap} ${gpx} py-1`}>{children}</div>
    <span className={`text-[8px] sm:text-[9px] uppercase tracking-wider pb-0.5 ${color}`}>{label}</span>
  </div>
);

/* ── Separador colorido ── */
const Sep = () => (
  <div className="hidden sm:block w-px self-stretch bg-gradient-to-b from-transparent via-slate-200 to-transparent shrink-0 mx-1 lg:mx-3" />
);

/* ── Botão infantil responsivo ── */
const Btn: React.FC<{
  onClick: () => void;
  title: string;
  disabled?: boolean;
  color?: string;
  pad?: string;
  children: React.ReactNode;
}> = ({ onClick, title, disabled, color = 'text-slate-500', pad = 'p-2', children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`${pad} rounded-xl transition-all duration-150 flex items-center justify-center ${disabled ? 'text-slate-300 cursor-default' : `${color} hover:bg-white hover:shadow-md hover:scale-110 active:scale-95 active:text-sky-500`}`}
  >
    {children}
  </button>
);

export const Header: React.FC<HeaderProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onFlipHorizontal,
  onFlipVertical,
  onGroup,
  onUngroup,
  onBringToFront,
  onSendToBack,
  onMoveForward,
  onMoveBackward,
  onDelete,
  onDuplicate,
  fillColor,
  strokeColor,
  strokeWidth,
  brushSize,
  fillTransparent,
  strokeTransparent,
  fontFamily,
  fontSize,
  activeToolId,
  onChangeState,
}) => {
  const s = useResponsiveSize();

  return (
    <div className="flex flex-col bg-[#fafafa] border-b-2 border-indigo-100 shrink-0 select-none">
      {/* ── LINHA SUPERIOR ── */}
      <div className="flex flex-wrap items-end justify-center md:justify-around gap-x-2 gap-y-1 px-2 py-1.5 border-b border-slate-100/50">
        {/* ↩️ Desfazer */}
        <RibbonGroup label="Desfazer" color="text-sky-400" gap={s.gap} gpx={s.gpx}>
          <Btn onClick={onUndo} title="Desfazer (Ctrl+Z)" disabled={!canUndo} color="text-slate-500" pad={s.pad}>
            <Undo2 size={s.icon} strokeWidth={2.5} />
          </Btn>
          <Btn onClick={onRedo} title="Refazer (Ctrl+Shift+Z)" disabled={!canRedo} color="text-slate-500" pad={s.pad}>
            <Redo2 size={s.icon} strokeWidth={2.5} />
          </Btn>
        </RibbonGroup>

        <Sep />

        {/* ✂️ Editar */}
        <RibbonGroup label="Editar" color="text-sky-400" gap={s.gap} gpx={s.gpx}>
          <Btn onClick={onDuplicate} title="Duplicar" color="text-slate-500" pad={s.pad}>
            <Copy size={s.icon} strokeWidth={2.5} />
          </Btn>
          <Btn onClick={onDelete} title="Apagar (Delete)" color="text-slate-400" pad={s.pad}>
            <Trash2 size={s.icon} strokeWidth={2.5} />
          </Btn>
        </RibbonGroup>

        <Sep />

        {/* 🎨 Cores */}
        <RibbonGroup label="Cores" color="text-sky-400" gap={s.gap} gpx={s.gpx}>
          <div className="flex items-center gap-2 px-1">
            <HsbColorPicker
              initialColor={fillColor}
              isTransparent={fillTransparent}
              onColorChange={(hex) => onChangeState({ fillColor: hex, fillTransparent: false })}
              onTransparentToggle={() => onChangeState({ fillTransparent: true })}
              compact
              variant="fill"
              isActive={!fillTransparent}
            />

            <button
              onClick={() => onChangeState({ fillTransparent: !fillTransparent })}
              className={`w-10 h-10 !rounded-full border-2 outline-none focus:outline-none transition-all flex items-center justify-center shadow-sm ${
                fillTransparent 
                  ? 'bg-white border-blue-400 ring-4 ring-blue-50/50 scale-105' 
                  : 'bg-white border-slate-200 text-slate-300 hover:border-blue-200 hover:shadow-md'
              }`}
              title="Sem Preenchimento"
            >
              <div className="relative w-7 h-7 rounded-full border border-slate-100 flex items-center justify-center overflow-hidden">
                <div className="absolute w-[140%] h-[3px] bg-red-500/80 -rotate-45" />
              </div>
            </button>

            <HsbColorPicker 
              initialColor={strokeColor} 
              isTransparent={strokeTransparent}
              onColorChange={(hex) => onChangeState({ strokeColor: hex, strokeTransparent: false })} 
              onTransparentToggle={() => onChangeState({ strokeTransparent: true })}
              compact 
              variant="stroke" 
              isActive={false} 
            />
          </div>
        </RibbonGroup>

        <Sep />

        {/* 🖊️ Traço */}
        <RibbonGroup label="Traço" color="text-sky-400" gap={s.gap} gpx={s.gpx}>
          <div className="flex items-center gap-3 lg:gap-6 px-1">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[8px] sm:text-[12px] text-sky-400/80">Linha</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={strokeWidth}
                  onChange={(e) => onChangeState({ strokeWidth: parseInt(e.target.value) })}
                  className={`${s.slider} cursor-pointer accent-sky-600 h-1.5 bg-slate-100 rounded-lg appearance-none transition-all hover:bg-slate-200`}
                />
                <span className="min-w-[36px] text-center text-[12px] font-black text-sky-600 bg-white border-[2.5px] border-sky-200 px-2 py-1.5 rounded-2xl shadow-sm transition-all hover:scale-110 hover:border-sky-300">
                  {strokeWidth}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[8px] sm:text-[12px] text-sky-400/80">{activeToolId === 'eraser' ? 'Borracha' : 'Pincel'}</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={brushSize}
                  onChange={(e) => onChangeState({ brushSize: parseInt(e.target.value) })}
                  className={`${s.slider} cursor-pointer accent-sky-600 h-1.5 bg-slate-100 rounded-lg appearance-none transition-all hover:bg-slate-200`}
                />
                <span className="min-w-[36px] text-center text-[12px] font-black text-sky-600 bg-white border-[2.5px] border-sky-200 px-2 py-1.5 rounded-2xl shadow-sm transition-all hover:scale-110 hover:border-sky-400">
                  {brushSize}
                </span>
              </div>
            </div>
          </div>
        </RibbonGroup>
      </div>

      {/* ── LINHA INFERIOR ── */}
      <div className="flex flex-wrap items-end justify-center gap-x-1 sm:gap-x-2 md:gap-x-4 lg:gap-x-6 px-1 lg:px-4 py-1.5">
        <RibbonGroup label="Fonte" color="text-sky-400" gap={s.gap} gpx={s.gpx}>
          <div className="flex items-center gap-1">
            <select
              value={fontFamily}
              onChange={(e) => onChangeState({ fontFamily: e.target.value })}
              className={`h-5 sm:h-6 md:h-7 text-[9px] bg-white border-[2px] border-slate-200 rounded-lg px-1 outline-none text-sky-700 cursor-pointer hover:border-sky-300 focus:border-sky-400 transition-all w-[60px] sm:w-[155px] appearance-none`}
              style={{
                backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23475569%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 4px top 50%',
                backgroundSize: '6px auto',
              }}
            >
              <option value="Arial">Arial</option>
              <option value="Verdana">Verdana</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Comic Sans MS">Comic Sans MS</option>
            </select>
            <input
              type="number"
              min={8}
              max={150}
              value={fontSize}
              onChange={(e) => onChangeState({ fontSize: parseInt(e.target.value) || 12 })}
              className={`h-5 sm:h-6 md:h-7 w-9 sm:w-11 bg-white border-[2px] border-slate-200 rounded-lg px-0.5 outline-none text-center text-sky-700 hover:border-sky-300 focus:border-sky-400 transition-all text-[9px]`}
            />
          </div>
        </RibbonGroup>

        <Sep />

        <RibbonGroup label="Transformar" color="text-sky-400" gap={s.gap} gpx={s.gpx}>
          <Btn onClick={onFlipHorizontal} title="Inverter Horizontal" color="text-slate-500" pad={s.pad}>
            <FlipHorizontal size={s.icon} strokeWidth={2.5} />
          </Btn>
          <Btn onClick={onFlipVertical} title="Inverter Vertical" color="text-slate-500" pad={s.pad}>
            <FlipVertical size={s.icon} strokeWidth={2.5} />
          </Btn>
        </RibbonGroup>

        <Sep />

        <RibbonGroup label="Agrupar" color="text-sky-400" gap={s.gap} gpx={s.gpx}>
          <Btn onClick={onGroup} title="Agrupar" color="text-slate-500" pad={s.pad}>
            <Group size={s.icon} strokeWidth={2.5} />
          </Btn>
          <Btn onClick={onUngroup} title="Desagrupar" color="text-slate-500" pad={s.pad}>
            <Ungroup size={s.icon} strokeWidth={2.5} />
          </Btn>
        </RibbonGroup>

        <Sep />

        <RibbonGroup label="Organizar" color="text-sky-400" gap={s.gap} gpx={s.gpx}>
          <Btn onClick={onMoveForward} title="Mover para Frente" color="text-slate-500" pad={s.pad}>
            <ChevronUp size={s.icon} strokeWidth={3} />
          </Btn>
          <Btn onClick={onBringToFront} title="Trazer ao Topo" color="text-slate-500" pad={s.pad}>
            <ChevronsUp size={s.icon} strokeWidth={3} />
          </Btn>
          <Btn onClick={onMoveBackward} title="Mover para Trás" color="text-slate-500" pad={s.pad}>
            <ChevronDown size={s.icon} strokeWidth={3} />
          </Btn>
          <Btn onClick={onSendToBack} title="Enviar ao Fundo" color="text-slate-500" pad={s.pad}>
            <ChevronsDown size={s.icon} strokeWidth={3} />
          </Btn>
        </RibbonGroup>
      </div>
    </div>
  );
};
