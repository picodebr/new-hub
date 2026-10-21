import { create } from "zustand";
import * as tf from "@tensorflow/tfjs";

export interface VisionLabSample {
  id: string;
  thumbnail: string; // URL em base64 (dataURL) para exibir visualmente sem precisar de canvas extra
  activation: tf.Tensor; // O Tensor já processado pelo MobileNet (conv_preds)
}

export interface VisionLabClassData {
  id: number;
  name: string;
  samples: VisionLabSample[];
}

interface AppState {
  classes: VisionLabClassData[];
  nextClassId: number;

  // Inicializa o estado a partir de um projeto salvo
  initFromProject: (labels: string[]) => void;

  // Ações de Classe
  addClass: () => void;
  updateClassName: (id: number, name: string) => void;
  removeClass: (id: number) => void;

  // Ações de Amostra
  addSample: (
    classId: number,
    thumbnail: string,
    activation: tf.Tensor,
  ) => void;
  removeSample: (classId: number, sampleId: string) => void;
  clearSamples: (classId: number) => void;

  // Estado da UI (Modal)
  activeModalClassId: number | null;
  openWebcamModal: (id: number) => void;
  closeWebcamModal: () => void;

  activeConfirmModal: {
    classId: number | null;
    action:
      | "clear"
      | "remove"
      | "info_min_classes"
      | "error_no_samples"
      | "error_min_classes_train";
  } | null;
  openConfirmModal: (
    classId: number | null,
    action:
      | "clear"
      | "remove"
      | "info_min_classes"
      | "error_no_samples"
      | "error_min_classes_train",
  ) => void;
  closeConfirmModal: () => void;

  // Estado do Projeto
  projectName: string;
  setProjectName: (name: string) => void;

  // Estado do Treinamento
  isTraining: boolean;
  isTrained: boolean;
  trainingProgress: string;
  setTrainingState: (
    state: Partial<{
      isTraining: boolean;
      isTrained: boolean;
      trainingProgress: string;
    }>,
  ) => void;
}

export const useVisionLabStore = create<AppState>((set, get) => ({
  projectName: 'Meu Modelo de Visão',
  setProjectName: (name: string) => set({ projectName: name }),

  // Começamos com 2 classes por padrão (como no script original)
  classes: [
    { id: 0, name: "Classe 1", samples: [] },
    { id: 1, name: "Classe 2", samples: [] },
  ],
  nextClassId: 2,

  activeModalClassId: null,
  activeConfirmModal: null,
  isTraining: false,
  isTrained: false,
  trainingProgress: "",

  setTrainingState: (newState) => set((state) => ({ ...state, ...newState })),

  initFromProject: (labels) => {
    const state = get();
    state.classes.forEach((cls) => cls.samples.forEach((s) => s.activation.dispose()));
    const classes = labels.map((name, index) => ({ id: index, name, samples: [] }));
    set({ classes, nextClassId: labels.length, isTrained: true, isTraining: false, trainingProgress: '' });
  },

  openWebcamModal: (id) => set({ activeModalClassId: id }),
  closeWebcamModal: () => set({ activeModalClassId: null }),

  openConfirmModal: (classId, action) =>
    set({ activeConfirmModal: { classId, action } }),
  closeConfirmModal: () => set({ activeConfirmModal: null }),

  addClass: () =>
    set((state) => ({
      classes: [
        ...state.classes,
        {
          id: state.nextClassId,
          name: `Classe ${state.nextClassId + 1}`,
          samples: [],
        },
      ],
      nextClassId: state.nextClassId + 1,
      isTrained: false,
    })),

  updateClassName: (id, name) =>
    set((state) => ({
      classes: state.classes.map((c) => (c.id === id ? { ...c, name } : c)),
    })),

  removeClass: (id) => {
    const state = get();
    // Limpa a memória dos tensores antes de remover a classe
    const classToRemove = state.classes.find((c) => c.id === id);
    if (classToRemove) {
      classToRemove.samples.forEach((s) => s.activation.dispose());
    }

    set((state) => ({
      classes: state.classes.filter((c) => c.id !== id),
      isTrained: false,
    }));
  },

  addSample: (classId, thumbnail, activation) =>
    set((state) => {
      const newSample = {
        id: Math.random().toString(36).substring(7),
        thumbnail,
        activation,
      };

      return {
        classes: state.classes.map((c) =>
          c.id === classId ? { ...c, samples: [...c.samples, newSample] } : c,
        ),
      };
    }),

  removeSample: (classId, sampleId) => {
    const state = get();
    const targetClass = state.classes.find((c) => c.id === classId);
    if (targetClass) {
      const sampleToRemove = targetClass.samples.find((s) => s.id === sampleId);
      if (sampleToRemove) {
        sampleToRemove.activation.dispose(); // Previne memory leak
      }
    }

    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId
          ? { ...c, samples: c.samples.filter((s) => s.id !== sampleId) }
          : c,
      ),
    }));
  },

  clearSamples: (classId) => {
    const state = get();
    const targetClass = state.classes.find((c) => c.id === classId);
    if (targetClass) {
      targetClass.samples.forEach((s) => s.activation.dispose());
    }

    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId ? { ...c, samples: [] } : c,
      ),
    }));
  },
}));
