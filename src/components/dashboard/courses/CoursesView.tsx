import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Course, Module, Lesson } from './coursesData';
import CourseList from './CourseList';
import ModuleList from './ModuleList';
import LessonList from './LessonList';
import VideoPlayer from './VideoPlayer';
import QuizLesson from './QuizLesson';
import AlgorithmLesson from './AlgorithmLesson';
import MazeLesson from './MazeLesson';
import { listCourses, listModules, listModuleLessons, getModuleLesson, getCourseActivity } from '@/_base/services/course';
import { IHubModuleLesson } from '@/_base/interfaces/module';
import { Loader2 } from 'lucide-react';

const CoursesView = () => {
  const { courseId, moduleId, lessonId } = useParams<{
    courseId?: string;
    moduleId?: string;
    lessonId?: string;
  }>();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseState, setSelectedCourse] = useState<Course | null>(null);
  const [selectedModuleState, setSelectedModule] = useState<Module | null>(null);
  const [selectedLessonState, setSelectedLesson] = useState<Lesson | null>(null);
  const [fullLesson, setFullLesson] = useState<IHubModuleLesson | null>(null);
  const [isLoadingLesson, setIsLoadingLesson] = useState(false);
  const [lessonIsFinished, setLessonIsFinished] = useState(false);
  const [loading, setLoading] = useState(false);


  // Fetch courses on mount from real API
  useEffect(() => {
    let mounted = true;
    const fetchCourses = async () => {
      try {
        const response = await listCourses();
        const coursesList = response?.results || (response as any)?.data || [];
        if (mounted && coursesList.length > 0) {
          const apiCourses: Course[] = coursesList.map((c: any) => {
            const act = (response as any)?.activities?.find((a: any) => a.course_id === c.id);
            const progress = act?.progress || 0;
            return {
              id: c.id,
              title: c.name || c.title || 'Curso PiCode',
              description: c.description || 'Aprenda robótica e programação na prática.',
              category: c.category || 'Robótica',
              duration: `${c.hours || 10}h`,
              lessonsCount: c.lessons_count || 12,
              progress,
              status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started',
              modules: (c.modules || []).map((m: any) => ({
                id: m.id,
                title: m.name || m.title,
                lessonsCount: m.lessons_count || 0,
                duration: `${m.hours || 2}h`,
                lessons: (m.lessons || []).map((l: any) => ({
                  id: l.id,
                  title: l.name || l.title,
                  duration: l.duration || '5:00',
                  watched: !!l.watched,
                  type: l.type || 'video',
                })),
              })),
            };
          });

          if (apiCourses.length > 0) {
            setCourses(apiCourses);
          }
        }
      } catch (err) {
        console.warn('Usando catálogo local de cursos:', err);
      }
    };

    fetchCourses();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch modules for active courseId if needed
  useEffect(() => {
    if (!courseId) return;
    const foundCourse = courses.find((c) => c.id === courseId);
    if (foundCourse && (!foundCourse.modules || foundCourse.modules.length === 0)) {
      listModules(courseId).then((res) => {
        const modulesList = res?.results || (res as any)?.data || [];
        if (modulesList.length > 0) {
          const fetchedModules: Module[] = modulesList.map((m: any) => ({
            id: m.id,
            title: m.name || m.title,
            lessonsCount: m.lessons_count || 0,
            duration: `${m.hours || 1}h`,
            lessons: [],
          }));
          setCourses((prev) =>
            prev.map((c) => (c.id === courseId ? { ...c, modules: fetchedModules } : c))
          );
        }
      }).catch(console.warn);
    }
  }, [courseId, courses]);

  // Fetch lessons for active moduleId if needed
  useEffect(() => {
    if (!courseId || !moduleId) return;
    const foundCourse = courses.find((c) => c.id === courseId);
    const foundModule = foundCourse?.modules?.find((m) => m.id === moduleId);
    if (foundModule && (!foundModule.lessons || foundModule.lessons.length === 0)) {
      listModuleLessons(courseId, moduleId).then((res) => {
        const lessonsList = res?.results || (res as any)?.data || [];
        if (lessonsList.length > 0) {
          const fetchedLessons: Lesson[] = lessonsList.map((l: any) => ({
            id: l.id,
            title: l.name || l.title,
            duration: l.duration || '5:00',
            watched: !!l.watched,
            type: l.type || 'video',
          }));
          setCourses((prev) =>
            prev.map((c) =>
              c.id === courseId
                ? {
                    ...c,
                    modules: c.modules.map((m) =>
                      m.id === moduleId ? { ...m, lessons: fetchedLessons } : m
                    ),
                  }
                : c
            )
          );
        }
      }).catch(console.warn);
    }
  }, [courseId, moduleId, courses]);

  const activeCourse = useMemo(() => {
    if (courseId) return courses.find((c) => c.id === courseId) || null;
    return selectedCourseState;
  }, [courseId, courses, selectedCourseState]);

  const activeModule = useMemo(() => {
    if (activeCourse && moduleId) {
      return activeCourse.modules?.find((m) => m.id === moduleId) || null;
    }
    return selectedModuleState;
  }, [activeCourse, moduleId, selectedModuleState]);

  const activeLesson = useMemo(() => {
    if (activeModule && lessonId) {
      return activeModule.lessons?.find((l) => l.id === lessonId) || null;
    }
    return selectedLessonState;
  }, [activeModule, lessonId, selectedLessonState]);

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    navigate(`/courses/${course.id}`);
  };

  const handleSelectModule = (module: Module) => {
    setSelectedModule(module);
    const targetCourseId = courseId || activeCourse?.id;
    if (targetCourseId) {
      navigate(`/courses/${targetCourseId}/${module.id}`);
    }
  };

  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    const targetCourseId = courseId || activeCourse?.id;
    const targetModuleId = moduleId || activeModule?.id;
    if (targetCourseId && targetModuleId) {
      navigate(`/courses/${targetCourseId}/${targetModuleId}/${lesson.id}`);
    }
  };

  const handleMarkWatched = useCallback((id: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        const updated = {
          ...c,
          modules: c.modules.map((m) => ({
            ...m,
            lessons: m.lessons.map((l) =>
              l.id === id ? { ...l, watched: true } : l
            ),
          })),
        };
        const total = updated.modules.reduce((a, m) => a + m.lessons.length, 0);
        const watched = updated.modules.reduce(
          (a, m) => a + m.lessons.filter((l) => l.watched).length,
          0
        );
        const progress = total > 0 ? Math.round((watched / total) * 100) : 0;
        return {
          ...updated,
          progress,
          status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started',
        } as Course;
      })
    );
  }, []);

  // Fetch real lesson details and course activity when lessonId is active in URL
  useEffect(() => {
    if (!courseId || !moduleId || !lessonId) {
      setFullLesson(null);
      setLessonIsFinished(false);
      return;
    }

    let mounted = true;
    setIsLoadingLesson(true);

    Promise.all([
      getModuleLesson(courseId, moduleId, lessonId).catch(() => null),
      getCourseActivity(courseId).catch(() => null),
    ]).then(([moduleLesson, courseActivity]) => {
      if (mounted) {
        if (moduleLesson) {
          setFullLesson(moduleLesson);
        }
        if (courseActivity?.metadata) {
          const isFinished = !!courseActivity.metadata.find((m: any) =>
            m.lessons?.find((l: any) => l.entity_id === lessonId && !!l.finished_at)
          );
          setLessonIsFinished(isFinished);
        }
      }
    }).finally(() => {
      if (mounted) setIsLoadingLesson(false);
    });

    return () => {
      mounted = false;
    };
  }, [courseId, moduleId, lessonId]);

  const renderLessonRunner = () => {
    if (!activeCourse || !activeModule) return null;

    if (isLoadingLesson && !activeLesson && !fullLesson) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Carregando aula do curso...</p>
        </div>
      );
    }

    const firstChallenge: any = fullLesson?.challenges?.[0];
    const quizAnswers: any[] = firstChallenge?.data?.quiz_answers || firstChallenge?.quiz_field?.options || [];

    const currentLessonData: any = fullLesson ? {
      id: fullLesson.id,
      title: fullLesson.title,
      duration: '10:00',
      watched: lessonIsFinished,
      type: fullLesson.lesson_type,
      video: fullLesson.video,
      challenges: fullLesson.challenges,
      quiz_data: firstChallenge ? {
        question: firstChallenge.title || firstChallenge.description || 'Pergunta',
        options: quizAnswers.map((o: any) => o.text || o),
        correctIndex: quizAnswers.findIndex((o: any) => o.is_correct) >= 0 ? quizAnswers.findIndex((o: any) => o.is_correct) : 0,
        explanation: firstChallenge.description || '',
      } : undefined,
    } : activeLesson || {
      id: lessonId,
      title: 'Aula',
      type: 'video',
      duration: '5:00',
      watched: lessonIsFinished,
    };

    const effectiveType = fullLesson?.lesson_type || currentLessonData.type || 'video';

    const commonProps = {
      course: activeCourse,
      module: activeModule,
      lesson: currentLessonData,
      fullModuleLesson: fullLesson,
      isFinished: lessonIsFinished,
      onBack: () => {
        navigate(`/courses/${activeCourse.id}/${activeModule.id}`);
        setSelectedLesson(null);
        setFullLesson(null);
      },
      onMarkWatched: handleMarkWatched,
    };

    switch (effectiveType) {
      case 'quiz':
        return <QuizLesson key="quiz" {...commonProps} />;
      case 'algorithm':
        return <AlgorithmLesson key="algorithm" {...commonProps} />;
      case 'map':
        return <MazeLesson key="maze" {...commonProps} />;
      case 'video':
      default:
        return <VideoPlayer key="video" {...commonProps} />;
    }
  };


  return (
    <AnimatePresence mode="wait">
      {lessonId && activeLesson ? (
        renderLessonRunner()
      ) : moduleId && activeModule && activeCourse ? (
        <LessonList
          key="lessons"
          course={activeCourse}
          module={activeModule}
          onBack={() => {
            navigate(`/courses/${activeCourse.id}`);
            setSelectedModule(null);
          }}
          onSelectLesson={handleSelectLesson}
        />
      ) : courseId && activeCourse ? (
        <ModuleList
          key="modules"
          course={activeCourse}
          onBack={() => {
            navigate('/courses');
            setSelectedCourse(null);
          }}
          onSelectModule={handleSelectModule}
        />
      ) : (
        <CourseList
          key="courses"
          courses={courses}
          onSelectCourse={handleSelectCourse}
        />
      )}
    </AnimatePresence>
  );
};

export default CoursesView;
