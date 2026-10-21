/**
 * Sidebar - Painel lateral de propriedades do Editor de Pintura.
 *
 * Responsabilidade: Fornecer controles visuais para ajustar propriedades
 * de desenho (cor de fundo, cor de contorno, largura do traço, tamanho
 * do pincel) e controles de zoom (ampliar, reduzir, ajustar à tela).
 * É um componente puramente visual (stateless), delegando toda a lógica
 * de estado para o componente pai via callbacks.
 *
 * Operações Principais:
 * - Seletores de cor (fill e stroke) com suporte a transparência.
 * - Sliders de largura de linha e tamanho de pincel.
 * - Indicador de zoom atual com botões de zoom in/out/fit.
 */
import React from 'react';
import { Search, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import HsbColorPicker from '../../../shared/HsbColorPicker';
import { PaintState } from './Header';

interface SidebarProps {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  brushSize: number;
  fillTransparent: boolean;
  zoom: number;
  onChangeState: (changes: Partial<PaintState>) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomToFit: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  fillColor,
  strokeColor,
  strokeWidth,
  brushSize,
  fillTransparent,
  zoom,
  onChangeState,
  onZoomIn,
  onZoomOut,
  onZoomToFit,
}) => {
  return (
    <div className="w-64 bg-white border-l border-slate-200 p-5 flex flex-col gap-8 overflow-y-auto shrink-0 shadow-[-2px_0_10px_rgba(0,0,0,0.02)]">
      {/* Cores */}
      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between px-1">
            🎨 Cor de Fundo
          </label>
          <div className="flex gap-4 items-center">
            <HsbColorPicker
              initialColor={fillColor}
              isTransparent={fillTransparent}
              onColorChange={(hex) => onChangeState({ fillColor: hex, fillTransparent: false })}
              onTransparentToggle={() => onChangeState({ fillTransparent: true })}
              showTransparentToggle
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">✏️ Contorno</label>
          <HsbColorPicker initialColor={strokeColor} onColorChange={(hex) => onChangeState({ strokeColor: hex })} />
        </div>
      </div>

      <div className="h-0.5 bg-slate-50" />

      {/* Sliders */}
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Linha</label>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold">{strokeWidth}px</span>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            value={strokeWidth}
            onChange={(e) => onChangeState({ strokeWidth: parseInt(e.target.value) })}
            className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-600"
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Pincel</label>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold">{brushSize}px</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={brushSize}
            onChange={(e) => onChangeState({ brushSize: parseInt(e.target.value) })}
            className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-amber-500 hover:accent-amber-600"
          />
        </div>
      </div>

      <div className="mt-auto pt-8 space-y-4">
        <div className="flex items-center justify-center gap-2 mb-2 p-3 bg-emerald-50 rounded-2xl border-2 border-emerald-100/50">
          <Search size={16} className="text-emerald-500" />
          <span className="text-sm font-black text-emerald-600">{Math.round(zoom * 100)}%</span>
        </div>
        <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-3xl border border-slate-200 shadow-inner">
          <button
            onClick={onZoomOut}
            className="p-2.5 bg-white text-slate-500 hover:text-indigo-500 rounded-2xl transition-all shadow-sm hover:scale-110 active:scale-95 flex items-center justify-center"
          >
            <ZoomOut size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={onZoomToFit}
            className="p-2.5 bg-white text-slate-500 hover:text-indigo-500 rounded-2xl transition-all shadow-sm hover:scale-110 active:scale-95 flex items-center justify-center"
          >
            <Maximize2 size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={onZoomIn}
            className="p-2.5 bg-white text-slate-500 hover:text-indigo-500 rounded-2xl transition-all shadow-sm hover:scale-110 active:scale-95 flex items-center justify-center"
          >
            <ZoomIn size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};
