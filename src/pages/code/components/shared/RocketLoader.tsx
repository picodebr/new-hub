/**
 * Componente RocketLoader - Animação de carregamento visual (Foguete).
 * 
 * Este componente é exibido durante o processo de upload do código para a placa.
 * Ele fornece feedback visual sobre o progresso e o resultado da operação.
 */

/**
 * Splash screen animada e indicadora de carregamento core da aplicação.
 */
'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

interface RocketLoaderProps {
    isVisible: boolean; // Controla se o overlay está visível
    phase: 'ready' | 'compiling' | 'flying' | 'success' | 'failure' | ''; // Fase atual do upload
    errorMessage?: string; // Mensagem de erro personalizada
}

export default function RocketLoader({ isVisible, phase, errorMessage }: RocketLoaderProps) {
    const [isClient, setIsClient] = useState(false);
    const [countdown, setCountdown] = useState(4);

    useEffect(() => {
        // Assíncrono para evitar aviso de renderização em cascata
        const timer = setTimeout(() => setIsClient(true), 0);
        return () => clearTimeout(timer);
    }, []);

    // Reset do contador sempre que a fase muda para failure (ajuste durante o render)
    const [prevPhase, setPrevPhase] = useState(phase);
    if (isVisible && phase === 'failure' && prevPhase !== 'failure') {
        setPrevPhase('failure');
        setCountdown(3);
    } else if (phase !== 'failure' && prevPhase === 'failure') {
        setPrevPhase(phase);
    }

    useEffect(() => {
        if (isVisible && phase === 'failure') {
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isVisible, phase]);

    if (!isClient) return null;

    // --- Mapeamento de Textos por Fase ---
    const getLoadingText = () => {
        switch (phase) {
            case 'ready': return 'Pronto para o lançamento...';
            case 'compiling': return 'Compilando...';
            case 'flying': return 'Carregando na placa...';
            default: return '';
        }
    };

    // Estilos injetados dinamicamente para manter o componente 100% self-contained
    const componentStyles = `
        @keyframes floatPulse {
            0% { transform: translateY(0px) scale(1); filter: drop-shadow(0 0 15px rgba(76, 151, 255, 0.4)); }
            50% { transform: translateY(-10px) scale(1.02); filter: drop-shadow(0 0 30px rgba(76, 151, 255, 0.8)); }
            100% { transform: translateY(0px) scale(1); filter: drop-shadow(0 0 15px rgba(76, 151, 255, 0.4)); }
        }
        @keyframes flyAway {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            40% { transform: translateY(20px) scale(0.9); opacity: 1; } /* Antecipação */
            100% { transform: translateY(-150vh) scale(0.5); opacity: 0; } /* Decolagem */
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0) translateY(0); }
            25% { transform: translateX(-2px) translateY(2px) rotate(-1deg); }
            75% { transform: translateX(2px) translateY(-2px) rotate(1deg); }
        }
        @keyframes fadeInScale {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
        /* Ilusão de Voo das Estrelas */
        @keyframes starFall {
            from { transform: translateY(-50%); }
            to { transform: translateY(0); }
        }
        @keyframes nebulaPulse {
            from { opacity: 0.2; transform: translate(-50%, -50%) scale(1); }
            to { opacity: 0.5; transform: translate(-50%, -50%) scale(1.1); }
        }

        /* Chamas do foguete */
        @keyframes flameFlicker {
            0% { transform: scaleY(1) scaleX(1); opacity: 0.9; }
            50% { transform: scaleY(1.2) scaleX(0.9); opacity: 1; }
            100% { transform: scaleY(0.9) scaleX(1.1); opacity: 0.8; }
        }

        .rocket-logo-animate {
            width: 120px;
            height: auto;
            transition: all 0.5s ease;
            position: relative;
            z-index: 10;
        }

        .phase-compiling .rocket-logo-animate { animation: floatPulse 1.5s ease-in-out infinite; }
        .phase-flying .rocket-logo-animate { animation: shake 0.2s infinite; filter: drop-shadow(0 0 40px rgba(76, 151, 255, 0.9)); }
        .phase-success .rocket-logo-animate { animation: flyAway 1.2s cubic-bezier(0.55, 0.055, 0.675, 0.19) forwards; }
        .phase-failure .rocket-logo-animate { filter: grayscale(1) opacity(0.5); }
        
        .result-box {
            animation: fadeInScale 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            position: relative;
            z-index: 20;
        }

        /* Fundo de Galáxia Gerado via CSS */
        .galaxy-background {
            position: absolute;
            inset: 0;
            overflow: hidden;
            pointer-events: none;
            z-index: 1;
            opacity: 0;
            transition: opacity 1s ease;
        }
        
        .is-flying .galaxy-background {
            opacity: 1; /* Ilusão de movimento apenas voando */
        }

        .star-layer {
            position: absolute;
            top: -100%;
            left: 0;
            width: 100%;
            height: 200%; /* Altura dupla para scroll infinito limpo */
        }

        .stars-1 {
            background-image: 
                radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)),
                radial-gradient(1px 1px at 40px 70px, #ffffff, rgba(0,0,0,0)),
                radial-gradient(1px 1px at 50px 160px, #ffffff, rgba(0,0,0,0)),
                radial-gradient(1px 1px at 90px 40px, #ffffff, rgba(0,0,0,0)),
                radial-gradient(1px 1px at 130px 80px, #ffffff, rgba(0,0,0,0));
            background-repeat: repeat;
            background-size: 200px 200px;
            animation: starFall 2s linear infinite;
        }

        .stars-2 {
            background-image: 
                radial-gradient(2px 2px at 50px 50px, #8bb0f6, rgba(0,0,0,0)),
                radial-gradient(2px 2px at 100px 150px, #8bb0f6, rgba(0,0,0,0)),
                radial-gradient(1.5px 1.5px at 150px 200px, #ffffff, rgba(0,0,0,0));
            background-repeat: repeat;
            background-size: 300px 300px;
            animation: starFall 1s linear infinite; /* Mais rápido, mais perto */
        }

        .nebula {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100vw;
            height: 100vh;
            background: radial-gradient(circle at 30% 70%, rgba(76, 151, 255, 0.15) 0%, transparent 50%),
                        radial-gradient(circle at 70% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
            filter: blur(60px);
            animation: nebulaPulse 8s ease-in-out infinite alternate;
        }

        /* Elementos da Chama */
        .rocket-flames {
            position: absolute;
            bottom: -35px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            opacity: 0;
            transition: opacity 0.3s;
            z-index: 5;
        }
        
        /* Liga os motores SOMENTE na fase flying. Desliga suavemente na success */
        .phase-flying .rocket-flames {
            opacity: 1; 
        }
        .phase-success .rocket-flames {
            opacity: 0;
        }

        .flame-core { width: 12px; height: 35px; background: white; border-radius: 50%; box-shadow: 0 0 20px white, 0 0 40px #4c97ff; animation: flameFlicker 0.1s infinite alternate; }
        .flame-mid { width: 22px; height: 50px; background: #4c97ff; border-radius: 50%; margin-top: -25px; filter: blur(2px); opacity: 0.8; animation: flameFlicker 0.15s infinite alternate-reverse; }
        .flame-outer { width: 35px; height: 70px; background: #8b5cf6; border-radius: 50%; margin-top: -40px; filter: blur(5px); opacity: 0.5; animation: flameFlicker 0.2s infinite alternate; }
        
        @keyframes failurePulse {
            0% { background-color: rgba(30, 5, 5, 0.95); }
            50% { background-color: rgba(45, 5, 5, 0.98); }
            100% { background-color: rgba(30, 5, 5, 0.95); }
        }
        .is-failing { animation: failurePulse 2s infinite; }
    `;

    const portalContent = (
        <>
            <style>{componentStyles}</style>

            <div
                className={`rocket-loader-container d-flex flex-column align-items-center justify-content-center ${phase === 'flying' || phase === 'success' ? 'is-flying' : ''} ${phase === 'failure' ? 'is-failing' : ''}`}
                style={{
                    /* 100% Full Screen Override - Estilo Inline Robusto */
                    position: 'fixed',
                    inset: 0,
                    zIndex: 999999, /* Extremamente alto para cobrir Navbars e Dropdowns */
                    backgroundColor: phase === 'failure' ? 'rgba(30, 5, 5, 0.95)' : 'rgba(2, 2, 8, 1)', /* Fundo Espacial Sólido */

                    /* Lógica de Transição de Visibilidade e Interatividade */
                    opacity: isVisible ? 1 : 0,
                    pointerEvents: isVisible ? 'auto' : 'none',
                    visibility: isVisible ? 'visible' : 'hidden', /* Previne scroll acidental no fundo quando inativo */
                    transition: 'opacity 0.6s ease-in-out, visibility 0.6s ease-in-out, background-color 0.8s ease',

                    color: 'white',
                    fontFamily: 'var(--font-outfit), sans-serif',
                    textAlign: 'center',
                    padding: '20px'
                }}
            >
                {/* Visuals: Galáxia e Estrelas (Sempre montados, controlados por opacidade) */}
                <div className="galaxy-background">
                    <div className="nebula"></div>
                    <div className="star-layer stars-1"></div>
                    <div className="star-layer stars-2"></div>
                </div>

                {/* Cena Principal: Foguete e Auras */}
                <div
                    className={`rocket-scene phase-${phase}`}
                    style={{ position: 'relative', marginBottom: '40px', zIndex: 10 }}
                >
                    <Image
                        src="/img/logoPi.png"
                        alt="Pico Logo Rocket"
                        width={120}
                        height={120}
                        className="rocket-logo-animate"
                        style={{ height: 'auto' }}
                    />

                    {/* Chamas de Decolagem */}
                    <div className="rocket-flames">
                        <div className="flame-core"></div>
                        <div className="flame-mid"></div>
                        <div className="flame-outer"></div>
                    </div>
                </div>

                {/* Interface de Feedback (Textos) */}
                <div
                    className="loader-feedback-ui"
                    style={{
                        minHeight: '120px', /* Previne saltos de layout quando o texto muda */
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        zIndex: 20 /* Fica por cima da galáxia */
                    }}
                >
                    {/* Estados Ativos: Preparando, Compilando, Voando */}
                    {(phase === 'ready' || phase === 'compiling' || phase === 'flying') && (
                        <h3 style={{
                            fontWeight: 600,
                            letterSpacing: '1px',
                            textShadow: '0 0 15px rgba(255,255,255,0.3)',
                            fontSize: 'clamp(1.2rem, 4vw, 1.8rem)'
                        }}>
                            {getLoadingText()}
                        </h3>
                    )}

                    {/* Estado: SUCESSO */}
                    {phase === 'success' && (
                        <div className="result-box text-center">
                            <div style={{ display: 'inline-block', padding: '15px', borderRadius: '50%', backgroundColor: 'rgba(46, 204, 113, 0.2)', marginBottom: '15px' }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <h2 style={{ fontWeight: 700, marginBottom: '10px' }}>Upload Concluído!</h2>
                            <p className="text-white-50">O código já está rodando na sua placa.</p>
                        </div>
                    )}

                    {/* Estado: FALHA */}
                    {phase === 'failure' && (
                        <div className="result-box text-center">
                            <div style={{ display: 'inline-block', padding: '15px', borderRadius: '50%', backgroundColor: 'rgba(231, 76, 60, 0.2)', marginBottom: '15px' }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                </svg>
                            </div>
                            <h2 style={{ fontWeight: 700, marginBottom: '15px' }}>Ocorreu uma Falha</h2>

                            <div style={{
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                border: '1px solid rgba(231, 76, 60, 0.3)',
                                borderRadius: '12px',
                                padding: '15px 25px',
                                color: '#ff7979',
                                fontSize: '0.95rem',
                                maxWidth: '90vw',
                                margin: '0 auto 20px auto'
                            }}>
                                {errorMessage || 'Erro de conexão ou compilação inválida.'}
                            </div>

                            <div className="d-flex align-items-center justify-content-center text-white-50" style={{ fontSize: '0.9rem' }}>
                                <div className="spinner-border spinner-border-sm me-2" role="status" style={{ opacity: 0.6 }}></div>
                                Fechando tela em {countdown}s...
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    return createPortal(portalContent as any, document.body) as any;
}
