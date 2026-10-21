/**
 * PaintEditor Toolbar - Seletor lateral de ferramentas.
 * 
 * Responsabilidade: Prover a interface para troca rápida de ferramentas 
 * (Lápis, Borracha, Sel, etc.). Inclui Tooltips customizados e feedback 
 * visual de ferramenta ativa com efeitos de brilho e escala.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { MousePointer2, Pencil, Eraser, PaintBucket, Square, Circle, Minus, Type } from 'lucide-react';

interface ToolbarProps {
    activeToolId: string;
    onSelectTool: (id: string) => void;
}

const toolsList = [
    { id: 'select', icon: MousePointer2, label: 'Selecionar' },
    { id: 'pencil', icon: Pencil, label: 'Lápis' },
    { id: 'eraser', icon: Eraser, label: 'Borracha' },
    { id: 'bucket', icon: PaintBucket, label: 'Preencher' },
    { id: 'rect', icon: Square, label: 'Retângulo' },
    { id: 'circle', icon: Circle, label: 'Círculo' },
    { id: 'line', icon: Minus, label: 'Linha' },
    { id: 'text', icon: Type, label: 'Texto' },
];

/* ── Hook responsivo: retorna tamanhos baseados na largura da tela ── */
function useResponsiveSize() {
    // Valores padrão seguros para SSR
    const defaultSizes = React.useMemo(() => ({ icon: 18, pad: 'p-2', gap: 'gap-2', barPad: 'p-2' }), []);

    const calc = useCallback(() => {
        if (typeof window === 'undefined') return defaultSizes;
        const w = window.innerWidth;
        if (w < 900) return { icon: 14, pad: 'p-1.5', gap: 'gap-1', barPad: 'p-1' };
        if (w < 1200) return { icon: 16, pad: 'p-2', gap: 'gap-1.5', barPad: 'p-1.5' };
        return { icon: 18, pad: 'p-2', gap: 'gap-2', barPad: 'p-2' };
    }, [defaultSizes]);

    const [sizes, setSizes] = useState(defaultSizes);

    useEffect(() => {
        // Atualiza para o tamanho real após a montagem no cliente
        // Promise.resolve().then() evita o erro de 'setState síncrono dentro de effect'
        Promise.resolve().then(() => {
            const current = calc();
            setSizes(prev => {
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

export const Toolbar: React.FC<ToolbarProps> = ({ activeToolId, onSelectTool }) => {
    const s = useResponsiveSize();

    return (
        <div className={`flex flex-col ${s.gap} ${s.barPad} bg-white border-r border-slate-200 shadow-[2px_0_10px_rgba(0,0,0,0.02)] z-10 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
            {toolsList.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeToolId === tool.id;
                return (
                    <button
                        key={tool.id}
                        onClick={() => onSelectTool(tool.id)}
                        className={`
                            ${s.pad} rounded-full flex items-center justify-center transition-all group relative
                            ${isActive
                                ? 'text-sky-600 drop-shadow-[0_0_6px_rgba(14,165,233,0.5)] scale-110'
                                : 'text-slate-400 hover:text-sky-500 hover:bg-sky-50 hover:scale-105 active:scale-95 active:text-sky-600'
                            }
                        `}
                        title={tool.label}
                    >
                        <Icon size={s.icon} strokeWidth={isActive ? 2.5 : 2} />
                        {!isActive && (
                            <span className="absolute left-full ml-3 px-3 py-1.5 bg-slate-800 text-white text-[11px] font-bold rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl transition-opacity">
                                {tool.label}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};
