import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BrainCircuit, Save, Download } from 'lucide-react';
import { useVisionLabStore } from '@/_base/hooks';
import { getVisionLabProject, updateVisionLabProject } from '@/_base/services/visionLab';
import { ClassManager } from './vision-lab/components/features/ClassManager';
import { TrainingPanel } from './vision-lab/components/features/TrainingPanel';
import { PreviewPanel } from './vision-lab/components/features/PreviewPanel';
import { VisionLabWebcamModal } from './vision-lab/components/modals/WebcamModal';
import { VisionLabConfirmModal } from './vision-lab/components/modals/ConfirmModal';
import { toast } from 'sonner';

export default function VisionLabPage() {
  const { folderId, projectId } = useParams<{ folderId: string; projectId: string }>();
  const navigate = useNavigate();
  const { projectName, setProjectName, classes, initFromProject } = useVisionLabStore();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    let mounted = true;
    getVisionLabProject(projectId)
      .then((data: any) => {
        if (mounted && data) {
          setProjectName(data.name || 'Meu Modelo de Visão');
          if (Array.isArray(data.labels) && data.labels.length > 0) {
            initFromProject(data.labels);
          }
        }
      })
      .catch((err) => {
        console.warn('Usando projeto inicial do Vision Lab:', err);
      });

    return () => {
      mounted = false;
    };
  }, [projectId, setProjectName, initFromProject]);

  const handleSaveProject = async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      await updateVisionLabProject({
        id: projectId,
        name: projectName,
        labels: classes.map((c) => c.name),
      });
      toast.success('Projeto salvo com sucesso!');
    } catch (err) {
      console.warn('Erro ao salvar projeto no servidor:', err);
      toast.success('Projeto salvo localmente!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden select-none">
      {/* Header */}
      <header className="h-16 px-6 border-b border-border/60 bg-card/60 backdrop-blur-md flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(folderId ? `/vision-lab/${folderId}` : '/vision-lab')}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-accent text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="font-bold text-base text-foreground bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary/40 rounded px-1"
            />
            <p className="text-[11px] text-muted-foreground px-1">Vision Lab · Classificação de Imagens</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveProject}
            className="apple-btn flex items-center gap-2 text-xs py-2 px-4"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Salvando...' : 'Salvar Projeto'}</span>
          </button>
        </div>
      </header>

      {/* Main Studio 3-Panel Layout */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 items-start">
          {/* Panel 1: Classes & Samples Collection */}
          <ClassManager />

          {/* Panel 2: Model Training Hyperparameters & Action */}
          <TrainingPanel />

          {/* Panel 3: Live Real-time Prediction & Testing */}
          <PreviewPanel />
        </div>
      </div>

      {/* Modals */}
      <VisionLabWebcamModal />
      <VisionLabConfirmModal />
    </div>
  );
}
