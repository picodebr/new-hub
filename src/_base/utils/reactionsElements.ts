import React from 'react';
import { PostReactionKey } from '../interfaces/community/PostReaction';
import { ThumbsUp, Heart, Lightbulb, Award } from 'lucide-react';

export type IconType = React.ComponentType<{ className?: string; size?: number | string; [key: string]: any }>;

export const reactionsElements: Array<{ key: PostReactionKey; label: string; icon: IconType; color: string }> = [
  { key: 'like', label: 'Gostei', color: '#3D7AFF', icon: ThumbsUp },
  { key: 'love', label: 'Amei', color: '#FF525C', icon: Heart },
  { key: 'insightful', label: 'Genial', color: '#F5BA3D', icon: Lightbulb },
  { key: 'aid', label: 'Apoio', color: '#21E080', icon: Award },
];
