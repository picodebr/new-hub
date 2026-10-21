/**
 * Seletor de cores HSB especializado para o ecossistema visual (estilo Scratch).
 * 
 * Redesenhado para ser "infantil" e amigável:
 * - 3 sliders horizontais grandes e coloridos (Cor, Saturação, Brilho).
 * - Estética arredondada e fonte Outfit.
 * - Suporte a conta-gotas e transparência.
 */
'use client';
import React, { useState, useCallback, useRef, useEffect } from 'react';

// --- Utility: HSB <-> RGB ---
function hsb2hex(h: number, s: number, b: number): string {
    // Converte de 0-100 (estilo Scratch) para 0-360, 0-1, 0-1
    const hue = (h * 360) / 100;
    const sat = s / 100;
    const bri = b / 100;

    const k = (n: number) => (n + hue / 60) % 6;
    const f = (n: number) => bri * (1 - sat * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
    const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
    return `#${toHex(f(5))}${toHex(f(3))}${toHex(f(1))}`;
}

function hex2hsb(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d) {
        if (max === r) h = ((g - b) / d) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h = Math.round(h * 60);
        if (h < 0) h += 360;
    }
    // Retorna no formato 0-100 (Scratch)
    return [
        Math.round((h * 100) / 360),
        max ? Math.round((d / max) * 100) : 0,
        Math.round(max * 100)
    ];
}

interface Props {
    label?: string;
    initialColor?: string;
    isTransparent?: boolean;
    onColorChange?: (hex: string) => void;
    onTransparentToggle?: () => void;
    showTransparentToggle?: boolean;
    /** compact=true: Scratch-style small circle swatch */
    compact?: boolean;
    /** variant: 'fill' (solid circle) or 'stroke' (hollow ring) */
    variant?: 'fill' | 'stroke';
    /** isActive: shows a selection ring around the swatch */
    isActive?: boolean;
}

const CHECKERED = 'conic-gradient(#e0e0e0 0% 25%, #ffffff 0% 50%, #e0e0e0 0% 75%, #ffffff 0% 100%) 0 0 / 12px 12px';

export default function HsbColorPicker({
    label,
    initialColor = '#4c97ff',
    isTransparent = false,
    onColorChange,
    onTransparentToggle,
    showTransparentToggle = false,
    compact = false,
    variant = 'fill',
    isActive = false
}: Props) {
    const [open, setOpen] = useState(false);

    const [hue, setHue] = useState(() => hex2hsb(initialColor)[0]);
    const [sat, setSat] = useState(() => hex2hsb(initialColor)[1]);
    const [bri, setBri] = useState(() => hex2hsb(initialColor)[2]);

    const [transparent, setTransparent] = useState(isTransparent);
    const [eyedropperSupported, setEyedropperSupported] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Track last initialColor seen from parent to avoid running on every slider move
    const prevInitialColorRef = useRef(initialColor);

    useEffect(() => { setEyedropperSupported('EyeDropper' in window); }, []);

    const currentHex = hsb2hex(hue, sat, bri);

    // Sync HSB state only when the parent changes initialColor (not when sliders move)
    useEffect(() => {
        if (prevInitialColorRef.current === initialColor) return;
        prevInitialColorRef.current = initialColor;
        if (!initialColor || !initialColor.startsWith('#') || initialColor.length < 7) return;
        try {
            const [h, s, b] = hex2hsb(initialColor);
            setHue(h);
            setSat(Math.max(s, 0));
            setBri(Math.max(b, 0));
        } catch { /* ignore */ }
    }, [initialColor]);

    useEffect(() => { setTransparent(isTransparent); }, [isTransparent]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const applyChange = useCallback((h: number, s: number, b: number) => {
        setHue(h); setSat(s); setBri(b);
        const hex = hsb2hex(h, s, b);
        if (!transparent) onColorChange?.(hex);
    }, [transparent, onColorChange]);

    const handleTransparent = () => {
        const next = !transparent;
        setTransparent(next);
        if (next) onTransparentToggle?.();
        else onColorChange?.(currentHex);
    };

    const handleEyedropper = async () => {
        if (!(window as any).EyeDropper) return;
        try {
            const dropper = new (window as any).EyeDropper();
            const result = await dropper.open();
            const hex = result.sRGBHex;
            const [h, s, b] = hex2hsb(hex);
            setHue(h); setSat(s); setBri(b);
            setTransparent(false);
            onColorChange?.(hex);
        } catch { /* ignore */ }
    };

    const hueGrad = 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)';
    const satGrad = `linear-gradient(to right, ${hsb2hex(hue, 0, bri)}, ${hsb2hex(hue, 100, bri)})`;
    const briGrad = `linear-gradient(to right, #000000, ${hsb2hex(hue, sat, 100)})`;

    const dropdown = (
        <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-[1000] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-[4px] border-blue-100/60 p-6 w-[240px] max-w-[90vw] flex flex-col gap-6 animate-in fade-in zoom-in duration-200 origin-top select-none">

            {/* Display de Cor Central */}
            <div className="flex items-center justify-center gap-5 mb-1">
                <div className="w-16 h-16 rounded-[1.5rem] border-[4px] border-slate-200/60 shadow-[0_4px_15px_rgba(0,0,0,0.04)] relative overflow-hidden shrink-0"
                    style={{ background: transparent ? CHECKERED : currentHex }}>
                    {transparent && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-[140%] h-1 bg-red-500 -rotate-45 shadow-sm" />
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    {eyedropperSupported && (
                        <button onClick={handleEyedropper} className="w-11 h-11 rounded-full bg-slate-50 border-2 border-slate-100 text-slate-500 hover:bg-blue-100 hover:text-blue-500 hover:scale-110 active:scale-95 transition-all flex items-center justify-center shadow-sm">
                            <i className="bi bi-eyedropper text-lg" />
                        </button>
                    )}
                    {showTransparentToggle && (
                        <button onClick={handleTransparent} className={`w-11 h-11 rounded-full border-2 transition-all flex items-center justify-center shadow-sm ${transparent ? 'bg-red-500 border-red-600 text-white' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-red-300 hover:text-red-500'}`}>
                            <i className="bi bi-slash-circle text-lg" />
                        </button>
                    )}
                </div>
            </div>

            <SliderRow icon="bi bi-palette" label="Cor" value={hue} max={100} gradient={hueGrad} onChange={v => applyChange(v, sat, bri)} />
            <SliderRow icon="bi bi-droplet-half" label="Saturação" value={sat} max={100} gradient={satGrad} onChange={v => applyChange(hue, v, bri)} />
            <SliderRow icon="bi bi-brightness-high" label="Brilho" value={bri} max={100} gradient={briGrad} onChange={v => applyChange(hue, sat, v)} />
        </div>
    );

    return (
        <div ref={panelRef} className="relative inline-flex items-center font-sans">
            {label && !compact && <span className="mr-3 text-[13px] font-bold text-slate-500">{label}</span>}

            <button
                onClick={() => setOpen(!open)}
                className={`group relative outline-none focus:outline-none transition-all duration-300 flex items-center justify-center ${
                    compact 
                        ? `w-10 h-10 !rounded-full bg-white p-0 shadow-sm border-2 ${isActive || open ? 'border-blue-400 ring-[3.5px] ring-blue-400/20 shadow-[0_0_20px_rgba(59,130,246,0.15)] scale-105' : 'border-slate-200 hover:border-blue-200 hover:shadow-md hover:scale-105'}` 
                        : `h-10 px-4 rounded-2xl border-[3px] bg-white gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.03)] ${open ? 'border-blue-400 shadow-xl scale-105' : 'border-slate-300 hover:border-blue-200 hover:shadow-lg active:scale-95'}`
                }`}
            >
                {variant === 'fill' ? (
                    <div className={`${compact ? 'w-7 h-7' : 'w-full h-full'} rounded-full border border-black/5 relative overflow-hidden flex items-center justify-center`}
                        style={{ background: transparent ? CHECKERED : currentHex }}>
                        {transparent && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-[140%] h-[3px] bg-red-500/80 -rotate-45 shadow-sm" />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={`${compact ? 'w-7 h-7' : 'w-full h-full'} rounded-full border-[5px] relative flex items-center justify-center transition-all`}
                        style={{ borderColor: currentHex }}>
                         <div className="w-full h-full rounded-full bg-white flex items-center justify-center shadow-inner border border-black/5">
                            {transparent && (
                                <div className="w-[140%] h-[2px] bg-red-500/80 -rotate-45 shadow-sm" />
                            )}
                         </div>
                    </div>
                )}
                {!compact && (
                    <>
                        <span className="text-[12px] font-bold text-slate-600 tracking-tight">{currentHex}</span>
                        <i className={`bi bi-chevron-down text-[10px] transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                    </>
                )}
            </button>

            {open && dropdown}
        </div>
    );
}

function SliderRow({ icon, label, value, max, gradient, onChange }: {
    icon: string; label: string; value: number; max: number; gradient: string; onChange: (v: number) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                    <i className={`${icon} text-slate-400 text-xs`} />
                    <span className="text-[11px] text-slate-400">{label}</span>
                </div>
                <span className="text-[11px]  text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">{value}</span>
            </div>
            <div className="relative h-6 flex items-center group">
                <div className="absolute inset-0 rounded-full border-[3px] border-gray-500 shadow-[0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden"
                    style={{ background: gradient }} />

                <input
                    type="range" min={0} max={max} step={1} value={value}
                    onChange={e => onChange(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                <div
                    className="absolute w-6 h-6 rounded-full border-[4px] border-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] pointer-events-none transition-transform group-hover:scale-110 active:scale-95"
                    style={{
                        left: `calc(${(value / max) * 100}% - 12px)`,
                        backgroundColor: label === 'Cor' ? hsb2hex(value, 100, 100) : 'white'
                    }}
                />
            </div>
        </div>
    );
}
