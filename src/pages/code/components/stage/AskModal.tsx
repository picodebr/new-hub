'use client';

import { useExecutionRunner } from '@/_base/context/ExecutionRunnerContext';
import React, { useState, useEffect, useRef } from 'react';
import { FaCheck } from 'react-icons/fa6';

/**
 * AskModal - Modal de entrada de dados para o bloco 'pergunte [ ] e espere'.
 *
 * Design: Premium, com efeito glassmorphism, animações suaves e
 * identidade visual alinhada à categoria de Sensores (azul #5CB1D6).
 */
export const AskModal = () => {
  const { activeQuestion, submitAsk } = useExecutionRunner();
  const [answer, setAnswer] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Foca automaticamente no campo de texto quando a pergunta muda
  useEffect(() => {
    if (activeQuestion) {
      setAnswer('');
      // Pequeno delay para garantir que a animação de entrada começou
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeQuestion]);

  if (!activeQuestion) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    submitAsk(answer);
    setAnswer('');
  };

  return (
    <div
      className="ask-modal-container"
      style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        width: '100%',
        padding: '12px 16px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(0, 0, 0, 0.08)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0px',
        boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.08)',
        animation: 'askSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px',
      }}
    >
      <style>{`
                @keyframes askSlideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .ask-input:focus {
                    border-color: #5CB1D6;
                    box-shadow: 0 0 0 4px rgba(92, 177, 214, 0.15);
                }
                .ask-submit-btn:active {
                    transform: scale(0.9);
                }
            `}</style>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          gap: '12px',
          width: '100%',
          alignItems: 'center',
        }}
      >
        <input
          ref={inputRef}
          className="ask-input"
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Digite sua resposta..."
          style={{
            flex: 1,
            padding: '12px 18px',
            borderRadius: '26px',
            border: '2px solid #E2E8F0',
            outline: 'none',
            fontSize: '15px',
            backgroundColor: 'white',
            color: '#1A202C',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            fontFamily: 'inherit',
          }}
        />
        <button
          type="submit"
          className="ask-submit-btn"
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: '#5CB1D6',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            boxShadow: '0 4px 14px rgba(92, 177, 214, 0.35)',
          }}
        >
          <FaCheck size={24} strokeWidth={3} />
        </button>
      </form>
    </div>
  );
};
