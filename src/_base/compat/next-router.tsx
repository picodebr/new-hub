import { useNavigate, useLocation, useParams } from 'react-router-dom';

export interface NextRouter {
  pathname: string;
  asPath: string;
  query: Record<string, string>;
  push: (url: string | { pathname: string; query?: Record<string, any> }) => void;
  replace: (url: string | { pathname: string; query?: Record<string, any> }) => void;
  back: () => void;
}

export const useRouter = (): NextRouter => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const queryParams = Object.fromEntries(new URLSearchParams(location.search));
  const query = { ...queryParams, ...params } as Record<string, string>;

  // Map camelCase <-> snake_case aliases so both work seamlessly
  if (params.classId) query.class_id = params.classId;
  if (params.class_id) query.classId = params.class_id;
  if (params.projectId) query.project_id = params.projectId;
  if (params.project_id) query.projectId = params.project_id;
  if (params.groupId) query.group_id = params.groupId;
  if (params.group_id) query.groupId = params.group_id;
  if (params.folderId) query.folder_id = params.folderId;
  if (params.folder_id) query.folderId = params.folder_id;
  if (params.courseId) query.course_id = params.courseId;
  if (params.course_id) query.courseId = params.course_id;
  if (params.moduleId) query.module_id = params.moduleId;
  if (params.module_id) query.moduleId = params.module_id;
  if (params.lessonId) query.lesson_id = params.lessonId;
  if (params.lesson_id) query.lessonId = params.lesson_id;
  if (params.studentId) query.student_id = params.studentId;
  if (params.student_id) query.studentId = params.student_id;
  if (params.reportId) query.report_id = params.reportId;
  if (params.report_id) query.reportId = params.report_id;
  if (params.id) {
    query.id = params.id;
    if (!query.class_id) query.class_id = params.id;
    if (!query.project_id) query.project_id = params.id;
  }

  const resolveTarget = (target: string | { pathname: string; query?: Record<string, any> }) => {
    if (typeof target === 'string') return target;
    const qs = target.query ? '?' + new URLSearchParams(target.query).toString() : '';
    return target.pathname + qs;
  };

  return {
    pathname: location.pathname,
    asPath: location.pathname + location.search,
    query,
    push: (target) => navigate(resolveTarget(target)),
    replace: (target) => navigate(resolveTarget(target), { replace: true }),
    back: () => navigate(-1),
  };
};

const router = {
  push: (url: string) => window.location.assign(url),
  replace: (url: string) => window.location.replace(url),
  back: () => window.history.back(),
};

export type Router = NextRouter;
export const Router = router;
export default router;

