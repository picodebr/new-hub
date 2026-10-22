export const getColorByGrade = (grade?: string | null): string => {
  if (!grade) return '#6366F1';
  const colorMap: Record<string, string> = {
    G3: '#D946EF',
    '6': '#8B5CF6',
    '7': '#06B6D4',
    '8': '#10B981',
    '9': '#F59E0B',
    'MakersPro Mini': '#EC4899',
    'MakersPro Explorers': '#3B82F6',
    'MakersPro Creators': '#8B5CF6',
    'MakersPro Innovators': '#06B6D4',
    'MakersPro Experts': '#F59E0B',
    CulturaTech: '#EF4444',
  };
  return colorMap[grade] || '#6366F1';
};
