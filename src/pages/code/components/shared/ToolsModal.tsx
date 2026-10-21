/**
 * Componente ToolsModal - Menu de Ferramentas da Placa.
 *
 * Permite ao usuário escolher entre diferentes ferramentas de monitoramento:
 * - Monitor Serial (Terminal de texto)
 * - Monitor de Umidade
 * - Monitor de Luminosidade
 * - Monitor de Porcentagem Genérica
 */
/**
 * Modal versátil para ferramentas auxiliares e configurações rápidas.
 */
import { useState } from 'react';
import LuminosityModal from '../monitors/LuminosityModal';
import HumidityModal from '../monitors/HumidityModal';
import MLMonitorModal from '../monitors/MLMonitorModal';
import { useSerial } from '@/_base/context/SerialContext';

interface ToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSerial: () => void; // Abre o componente SerialMonitor
}

// Modos de visualização dentro do modal
type ToolMode = 'MENU' | 'LUMINOSITY' | 'HUMIDITY' | 'ML' | 'WARNING';

export default function ToolsModal({ isOpen, onClose, onOpenSerial }: ToolsModalProps) {
  const [activeTool, setActiveTool] = useState<ToolMode>('MENU');
  const { isConnected } = useSerial();

  if (!isOpen) {
    // Reseta para o menu principal quando o modal é fechado para uma melhor experiência (UX)
    if (activeTool !== 'MENU') setTimeout(() => setActiveTool('MENU'), 200);
    return null;
  }

  /**
   * Verifica e executa ação apenas se a placa estiver conectada.
   */
  const runIfConnected = (action: () => void) => {
    if (!isConnected) {
      setActiveTool('WARNING');
      return;
    }
    action();
  };

  // RENDERIZAÇÃO DE SUB-MODAIS (MONITORES ESPECÍFICOS)
  if (activeTool === 'LUMINOSITY') {
    return <LuminosityModal isOpen={true} onClose={onClose} onBack={() => setActiveTool('MENU')} />;
  }
  if (activeTool === 'HUMIDITY') {
    return <HumidityModal isOpen={true} onClose={onClose} onBack={() => setActiveTool('MENU')} />;
  }
  if (activeTool === 'ML') {
    return <MLMonitorModal isOpen={true} onClose={onClose} onBack={() => setActiveTool('MENU')} />;
  }

  // MODAL DE AVISO (WARNING)
  if (activeTool === 'WARNING') {
    return (
      <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="modal-body text-center py-5">
              <div className="mb-4">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mx-auto"
                  style={{ width: 80, height: 80, backgroundColor: '#fff3cd', color: '#ffc107' }}
                >
                  <i className="bi bi-exclamation-triangle-fill fs-1"></i>
                </div>
              </div>
              <h4 className="fw-bold text-dark mb-3">Conexão Necessária</h4>
              <p className="text-secondary px-4">Para utilizar as ferramentas de monitoramento, é necessário conectar a placa primeiro.</p>
              <button className="btn btn-primary rounded-pill px-5 fw-bold mt-3" onClick={() => setActiveTool('MENU')}>
                Entendi
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MENU PRINCIPAL DE SELEÇÃO
  return (
    <div
      className="modal fade show vision-lab-modal"
      style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
      tabIndex={-1}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '600px' }}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden" style={{ borderRadius: '16px' }}>
          {/* Header: Hybrid Scratch/CodePreview Style */}
          <div className="d-flex align-items-center p-4 bg-white position-relative border-bottom" style={{ borderColor: '#f1f5f9' }}>
            <div className="d-flex align-items-center gap-4">
              <div className="bg-primary bg-opacity-10 p-2 rounded-4 shadow-sm">
                <i className="bi bi-display text-primary fs-3"></i>
              </div>
              <div className="d-flex flex-column">
                <h2 className="m-0 fs-4 fw-bold text-dark leading-tight" style={{ color: '#1e293b' }}>
                  Monitores
                </h2>
                <p
                  className="m-0 text-[10px] font-bold text-primary uppercase tracking-widest mt-1 text-left"
                  style={{ fontSize: '0.65rem', letterSpacing: '0.1em' }}
                >
                  Ferramentas da Placa
                </p>
              </div>
            </div>

            <div className="position-absolute end-0 me-4">
              <button
                className="btn btn-sm px-2 py-1"
                onClick={onClose}
                style={{
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>
          <div className="modal-body p-4">
            <div className="row g-3 p-3">
              {/* CARD SERIAL */}
              <div className="col-6 col-md-3">
                <div className="tool-card card-serial" onClick={() => runIfConnected(onOpenSerial)}>
                  <div className="tool-card-banner">
                    <i className="bi bi-terminal"></i>
                  </div>
                  <div className="tool-card-content fw-normal">Serial</div>
                </div>
              </div>

              {/* CARD UMIDADE */}
              <div className="col-6 col-md-3">
                <div className="tool-card card-humidity" onClick={() => runIfConnected(() => setActiveTool('HUMIDITY'))}>
                  <div className="tool-card-banner">
                    <i className="bi bi-droplet-fill"></i>
                  </div>
                  <div className="tool-card-content fw-normal">Umidade</div>
                </div>
              </div>

              {/* CARD LUZ (LUMINOSIDADE) */}
              <div className="col-6 col-md-3">
                <div className="tool-card card-light" onClick={() => runIfConnected(() => setActiveTool('LUMINOSITY'))}>
                  <div className="tool-card-banner">
                    <i className="bi bi-brightness-high"></i>
                  </div>
                  <div className="tool-card-content fw-normal">Luz</div>
                </div>
              </div>

              {/* CARD ML RECONHECIMENTO */}
              <div className="col-6 col-md-3">
                <div className="tool-card card-percent" onClick={() => runIfConnected(() => setActiveTool('ML'))}>
                  <div className="tool-card-banner">
                    <i className="bi bi-eye-fill"></i>
                  </div>
                  <div className="tool-card-content fw-normal">Câmera IA</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
