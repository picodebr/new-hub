import { TourProps } from 'antd';
import { create } from 'zustand';

interface IHubTourProps {
  steps: TourProps['steps'];
  setSteps: (data: TourProps['steps']) => void;
  startTour: () => void;
  stopTour: () => void;
  isOpen: boolean;

  navbar: Omit<IHubTourProps, `steps` | `setSteps` | `navbar`>;
}
export const useHubTour = create<IHubTourProps>((set) => ({
  steps: [],
  setSteps: (steps) => set((e) => ({ ...e, steps })),
  startTour: () => set((e) => ({ ...e, isOpen: true })),
  stopTour: () => set((e) => ({ ...e, isOpen: false })),
  isOpen: false,

  navbar: {
    startTour: () => set((e) => ({ ...e, navbar: { ...e.navbar, isOpen: true } })),
    stopTour: () => set((e) => ({ ...e, navbar: { ...e.navbar, isOpen: false } })),
    isOpen: false,
  },
}));
