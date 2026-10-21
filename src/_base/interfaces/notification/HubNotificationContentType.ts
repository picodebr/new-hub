import { BookOpen, GraduationCap, Package, Users, Sparkles } from 'lucide-react';

export const hubNotificationContentTypes = <const>[
  `picode_project_activity_finished`,
  `book_added`,
  `course_added`,
  `course_certificate_available`,
  `alert`,
  `received_coins`,
];
export type HubNotificationContentType = (typeof hubNotificationContentTypes)[number];

// 1. Identidade Visual das Categorias (categoryConfig & iconConfig unificados)
export const hubNotificationLabels: Record<
  HubNotificationContentType,
  { Icon: typeof Package; color: string; bg: string; ring: string; label: string }
> = {
  picode_project_activity_finished: { label: 'Projetos', Icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10', ring: 'ring-blue-500/20' },
  book_added: { label: 'Biblioteca', Icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20' },
  course_added: { label: 'Cursos', Icon: GraduationCap, color: 'text-indigo-500', bg: 'bg-indigo-500/10', ring: 'ring-indigo-500/20' },
  course_certificate_available: { label: 'Cursos', Icon: GraduationCap, color: 'text-amber-500', bg: 'bg-amber-500/10', ring: 'ring-amber-500/20' },
  alert: { label: 'Alerta', Icon: Users, color: 'text-red-500', bg: 'bg-red-500/10', ring: 'ring-red-500/20' },
  received_coins: { label: 'Cashback', Icon: Sparkles, color: 'text-yellow-500', bg: 'bg-yellow-500/10', ring: 'ring-yellow-500/20' },
};
