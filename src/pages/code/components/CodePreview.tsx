/**
 * Componente CodePreview - Exibição do código C++ gerado.
 *
 * Este componente mostra o código que será enviado para a placa.
 * Ele inclui realce de sintaxe básico (Syntax Highlighting) para palavras-chave do C++/Arduino.
 */

import { useUI } from '@/_base/context/UIContext';
import React from 'react';

interface CodePreviewProps {
  onToggle?: () => void; // Função para alternar visibilidade do painel
  isOpen?: boolean; // Estado de abertura
  isUploadMode?: boolean; // Se está no modo upload
}

export default function CodePreview({ onToggle, isOpen = true, isUploadMode = true }: CodePreviewProps) {
  const { uploadCode } = useUI();
  const [copied, setCopied] = React.useState(false);

  const isVisible = isOpen && isUploadMode;

  /**
   * Copia o código atual para a área de transferência do usuário.
   */
  const handleCopy = () => {
    if (uploadCode) {
      navigator.clipboard.writeText(uploadCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="d-flex flex-column bg-white shadow-lg"
      style={{
        position: 'fixed',
        right: isVisible ? '10px' : '-450px',
        top: '70px',
        bottom: '25px',
        width: '400px',
        borderRadius: '16px',
        zIndex: 1050,
        border: 'none',
        transition: 'all 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'all' : 'none',
      }}
    >
      {/* Cabeçalho do Painel de Código */}
      <div className="d-flex justify-content-between align-items-center p-3">
        <div className="d-flex align-items-center">
          <span className="me-2" style={{ color: '#22c55e', fontSize: '0.6rem' }}>
            ●
          </span>
          <h6 className="m-0 fw-semibold" style={{ color: '#1e293b', fontSize: '0.95rem' }}>
            Código
          </h6>
        </div>

        {/* Botões de Ação do Cabeçalho */}
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-sm px-3 py-1 d-flex align-items-center"
            onClick={handleCopy}
            style={{
              backgroundColor: copied ? '#22c55e' : '#f1f5f9',
              border: '1px solid',
              borderColor: copied ? '#22c55e' : '#e2e8f0',
              color: copied ? '#fff' : '#64748b',
              borderRadius: '8px',
              fontSize: '0.8rem',
              transition: 'all 0.2s ease',
            }}
          >
            <i className={`bi ${copied ? 'bi-check-lg' : 'bi-clipboard'} me-1`}></i>
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
          {onToggle && (
            <button
              className="btn btn-sm px-2 py-1"
              onClick={onToggle}
              style={{
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                borderRadius: '6px',
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>
      </div>

      {/* Área do Código - Fundo escuro com realce de sintaxe customizado */}
      <div
        className="flex-grow-1 font-monospace p-4 overflow-auto"
        style={{
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          fontSize: '0.85rem',
          whiteSpace: 'pre-wrap',
          color: '#e2e8f0',
          margin: '15px',
        }}
      >
        {uploadCode ? (
          <code style={{ color: '#e2e8f0' }}>
            {uploadCode.split('\n').map((line, i) => {
              // Escapa caracteres HTML para evitar injeção
              const escapedLine = line.replace(/</g, '&lt;').replace(/>/g, '&gt;');

              // Aplica realce de sintaxe via Regex (Substitui palavras-chave por spans coloridos)
              const highlightedLine = escapedLine
                .replace(/^(\s*#\w+)/g, "<span style='color:#c084fc'>$1</span>") // Diretivas (#include, #define)
                .replace(/("[^"]*")/g, "<span style='color:#fbbf24'>$1</span>") // Strings
                .replace(/(\/\/.*)/g, "<span style='color:#6b7280'>$1</span>") // Comentários
                .replace(
                  /\b(void|int|float|bool|long|String|if|else|for|while|return|include|define|const|unsigned|char|byte|double|short|static|extern|volatile|switch|case|break|continue|default|typedef|struct|enum|class|private|public|protected|virtual|true|false|HIGH|LOW|INPUT|OUTPUT|INPUT_PULLUP)\b/g,
                  "<span style='color:#60a5fa'>$1</span>",
                ) // Tipos e Estruturas
                .replace(
                  /\b(setup|loop|pinMode|digitalWrite|digitalRead|analogWrite|analogRead|delay|delayMicroseconds|millis|micros|Serial|Wire|SPI|begin|end|println|print|read|write|available|parseInt|parseFloat|attachInterrupt|detachInterrupt|map|constrain|min|max|abs|pow|sqrt|sin|cos|tan|random|randomSeed)\b/g,
                  "<span style='color:#34d399'>$1</span>",
                ); // Funções Arduino

              return <div key={i} dangerouslySetInnerHTML={{ __html: highlightedLine || '&nbsp;' }} />;
            })}
          </code>
        ) : (
          <span style={{ color: '#64748b' }}>{`// Nenhum bloco conectado...`}</span>
        )}
      </div>
    </div>
  );
}
