'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useProject } from '@/_base/context/ProjectContext';
import { IGlobalWindow, IMLModel } from '@/_base/domain/entities';
import { getVisionLabFolders } from '@/_base/services/visionLab/getVisionLabFolders';

interface DisplayModel {
  id: string;
  name: string;
  modelJsonUrl: string;
  modelBinUrl: string;
  labels: string[];
  folderName: string;
}

const DEFAULT_MODEL_DEFS = [
  {
    id: 'model_especies',
    name: 'Classificador de Espécies',
    modelJsonUrl: '/mock_api/model_especies/teachable-machine-model.json',
    modelBinUrl: '/mock_api/model_especies/teachable-machine-model.weights.bin',
    metadataUrl: '/mock_api/model_especies/metadata.json',
  },
  {
    id: 'model_libras',
    name: 'Classificador de Libras',
    modelJsonUrl: '/mock_api/model_libras/teachable-machine-model.json',
    modelBinUrl: '/mock_api/model_libras/teachable-machine-model.weights.bin',
    metadataUrl: '/mock_api/model_libras/metadata.json',
  },
];

async function loadDefaultModels(): Promise<DisplayModel[]> {
  return Promise.all(
    DEFAULT_MODEL_DEFS.map(async (m) => {
      try {
        const meta = await fetch(m.metadataUrl).then((r) => r.json());
        return {
          id: m.id,
          name: m.name,
          modelJsonUrl: m.modelJsonUrl,
          modelBinUrl: m.modelBinUrl,
          labels: meta.labels ?? [],
          folderName: 'Modelos Padrão',
        };
      } catch {
        return { id: m.id, name: m.name, modelJsonUrl: m.modelJsonUrl, modelBinUrl: m.modelBinUrl, labels: [], folderName: 'Modelos Padrão' };
      }
    }),
  );
}

async function loadApiModels(): Promise<DisplayModel[]> {
  try {
    const response = await getVisionLabFolders();
    return response.results.flatMap((folder) =>
      folder.projects
        .filter((p) => p.model_path !== null && p.bin_path !== null)
        .map((p) => ({
          id: p.id,
          name: p.name,
          modelJsonUrl: p.model_path!,
          modelBinUrl: p.bin_path!,
          labels: p.labels.length > 0 ? p.labels : ['Desconhecido'],
          folderName: folder.name,
        })),
    );
  } catch (err) {
    console.error('Erro ao carregar modelos da API:', err);
    return [];
  }
}

interface MLExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'stage' | 'upload';
}

export const MLExtensionModal: React.FC<MLExtensionModalProps> = ({ isOpen, onClose, mode }) => {
  const { setActiveStageMLModel, activeStageMLModel, setActiveUploadMLModel, activeUploadMLModel } = useProject();

  const [models, setModels] = useState<DisplayModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleScale = () => {
      const threshold = 820;
      const vh = window.innerHeight;
      setScale(vh < threshold ? vh / threshold : 1);
    };
    handleScale();
    window.addEventListener('resize', handleScale);
    return () => window.removeEventListener('resize', handleScale);
  }, []);

  const activeModelId = mode === 'stage' ? activeStageMLModel?.id : activeUploadMLModel?.id;

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      const [defaults, apiModels] = await Promise.all([loadDefaultModels(), loadApiModels()]);
      setModels([...defaults, ...apiModels]);
      setLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (activeStageMLModel) {
      const win = window as unknown as IGlobalWindow;
      win.ml_labels = { ...(win.ml_labels || {}), stage: activeStageMLModel.labels };
      win.activeMLModelLabels = activeStageMLModel.labels;
    }
  }, [activeStageMLModel]);

  useEffect(() => {
    if (activeUploadMLModel) {
      const win = window as unknown as IGlobalWindow;
      win.ml_labels = { ...(win.ml_labels || {}), upload: activeUploadMLModel.labels };
      win.activeUploadMLModelLabels = activeUploadMLModel.labels;
    }
  }, [activeUploadMLModel]);

  const handleSelectModel = (model: DisplayModel) => {
    const activeModel: IMLModel = {
      id: model.id,
      name: model.name,
      modelJsonUrl: model.modelJsonUrl,
      modelBinUrl: model.modelBinUrl,
      metadataUrl: '',
      labels: model.labels.length > 0 ? model.labels : ['Desconhecido'],
    };

    if (mode === 'stage') {
      setActiveStageMLModel(activeModel);
    } else {
      setActiveUploadMLModel(activeModel);
    }
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6" style={{ zIndex: 1000000 }}>
      <div
        className="bg-white shadow-2xl flex flex-col max-h-[95vh] overflow-hidden transform transition-all duration-300"
        style={{
          width: 'min(900px, 95vw)',
          borderRadius: '16px',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          border: 'none',
        }}
      >
        {/* Header */}
        <div className="flex items-center p-4 bg-white relative border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 p-2.5 rounded-2xl shadow-sm">
              <i className="bi bi-robot text-[#0d6efd] text-2xl"></i>
            </div>
            <div className="flex flex-col">
              <h2 className="m-0 text-xl font-bold text-[#1e293b] leading-tight">Vision Lab</h2>
              <p className="m-0 text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1 text-left">Escolha seu Modelo</p>
            </div>
          </div>
          <div className="absolute right-4">
            <button
              onClick={onClose}
              className="p-2 transition-all duration-200"
              style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '8px' }}
              title="Fechar"
            >
              <i className="bi bi-x-lg text-lg"></i>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 bg-[#F8FAFC]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative w-20 h-20 animate-bounce">
                <i className="bi bi-cpu text-6xl text-blue-400"></i>
              </div>
              <p className="mt-4 font-black text-blue-500 text-lg animate-pulse tracking-wide">Despertando os robôs...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {models.map((model, index) => {
                const isSelected = model.id === activeModelId;
                return (
                  <div
                    key={model.id}
                    onClick={() => handleSelectModel(model)}
                    className={`group relative bg-white border-2 rounded-2xl aspect-square p-5 cursor-pointer transition-all duration-300 flex flex-col items-center justify-between text-center shadow-sm hover:shadow-md hover:-translate-y-1 active:scale-95 ${
                      isSelected ? 'border-[#0d6efd] bg-blue-50/30' : 'border-gray-100 hover:border-blue-200'
                    }`}
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 bg-[#0d6efd] text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md animate-in fade-in zoom-in z-10 border-2 border-white">
                        <i className="bi bi-check-lg text-sm"></i>
                      </div>
                    )}

                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-colors duration-300 shadow-inner shrink-0 ${
                        isSelected ? 'bg-blue-100' : 'bg-gray-50 group-hover:bg-blue-50'
                      }`}
                    >
                      <i
                        className={`bi bi-cpu-fill text-3xl transition-colors duration-300 ${
                          isSelected ? 'text-[#0d6efd]' : 'text-gray-400 group-hover:text-blue-400'
                        }`}
                      ></i>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center w-full my-2 gap-1">
                      <p className="text-lg font-bold leading-tight wrap-break-word line-clamp-2 w-full" style={{ color: '#64748b' }}>
                        {model.name}
                      </p>
                      <span className="text-[10px] text-gray-400 truncate w-full">{model.folderName}</span>
                    </div>

                    <div
                      className={`text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-full transition-all w-full shrink-0 ${
                        isSelected ? 'bg-[#0d6efd] text-white shadow-sm' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                      }`}
                    >
                      {isSelected ? 'Em Uso' : 'Selecionar'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
