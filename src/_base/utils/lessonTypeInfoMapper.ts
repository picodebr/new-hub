import React from 'react';
import { HubModuleLessonType } from '../interfaces/module';
import { Video, GitFork, Compass, HelpCircle } from 'lucide-react';

export type IconType = React.ComponentType<{ className?: string; size?: number | string; [key: string]: any }>;

export const lessonTypeInfoMapper: Record<HubModuleLessonType, { label: string; icon: IconType }> = {
  video: { label: 'Vídeo', icon: Video },
  algorithm: { label: 'Algoritmo', icon: GitFork },
  map: { label: 'Mapa', icon: Compass },
  quiz: { label: 'Quiz', icon: HelpCircle },
};
