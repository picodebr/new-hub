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
import { listCourses, listModules, listModuleLessons, getModuleLesson, getCourseActivity, sendModuleLesson } from '@/_base/services/course';
import { IHubModuleLesson } from '@/_base/interfaces/module';
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2, Clock, Trophy, Target } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

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

  const [challengeIndex, setChallengeIndex] = useState(0);
  const [accumulatedAnswers, setAccumulatedAnswers] = useState<any[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [resultModal, setResultModal] = useState<{
    open: boolean;
    correctCount: number;
    totalCount: number;
    time: string;
  } | null>(null);

  useEffect(() => {
    setChallengeIndex(0);
    setAccumulatedAnswers([]);
    setStartTime(Date.now());
  }, [lessonId]);


  // Fetch courses on mount from real API
  useEffect(() => {
    let mounted = true;
    const fetchCourses = async () => {
      try {
        const response = await listCourses();
        const coursesList = response?.results || (response as any)?.data || [];
        const activities = response?.activities || [];
        if (mounted && coursesList.length > 0) {
          const apiCourses: Course[] = coursesList.map((c: any) => {
            const total = (c.modules || []).flatMap((m: any) => m.lessons || []).length;
            const finished = (activities || [])
              .filter((act: any) => act.hub_course_id === c.id)
              .flatMap((act: any) => (act.metadata || []).flatMap((m: any) => m.lessons || []))
              .filter((lesson: any) => !!lesson.finished_at).length;
            const progress = total > 0 ? Math.min(Math.ceil((finished / total) * 100), 100) : 0;

            return {
              id: c.id,
              title: c.name || c.title || 'Curso PiCode',
              description: c.description || 'Aprenda robótica e programação na prática.',
              category: c.category || 'Robótica',
              duration: `${c.hours || 10}h`,
              lessonsCount: total || c.lessons_count || 12,
              progress,
              status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started',
              modules: (c.modules || []).map((m: any) => ({
                id: m.id,
                title: m.name || m.title,
                lessonsCount: (m.lessons || []).length || m.lessons_count || 0,
                duration: `${m.hours || 2}h`,
                metadata: m.metadata,
                respect_hierarchy: m.metadata?.respect_hierarchy,
                lessons: (m.lessons || []).map((l: any) => ({
                  id: l.id,
                  title: l.name || l.title,
                  duration: l.duration || '5:00',
                  position: l.position || 1,
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

  const handleChallengeAnswer = async (answer: any) => {
    const updated = accumulatedAnswers.filter((a) => a.hub_challenge_id !== answer.hub_challenge_id);
    updated.push(answer);
    setAccumulatedAnswers(updated);

    const challenges = fullLesson?.challenges || [];
    if (challenges.length > 1 && challengeIndex + 1 < challenges.length) {
      setChallengeIndex((prev) => prev + 1);
      toast.info(`Desafio ${challengeIndex + 1} de ${challenges.length} registrado!`);
    } else {
      // Completed all challenges for this lesson
      try {
        const res = await sendModuleLesson({
          course_id: activeCourse?.id || courseId!,
          module_id: activeModule?.id || moduleId!,
          lesson_id: fullLesson?.id || lessonId!,
          answers: updated,
        });

        const diff = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
        const correctCount = res?.lessonData?.correctAnswersCount ?? updated.length;

        setResultModal({
          open: true,
          correctCount,
          totalCount: challenges.length || 1,
          time: timeStr,
        });
        if (fullLesson?.id || lessonId) {
          handleMarkWatched(fullLesson?.id || lessonId!);
        }
      } catch (err) {
        console.warn('Erro ao finalizar aula de desafios:', err);
        if (fullLesson?.id || lessonId) {
          handleMarkWatched(fullLesson?.id || lessonId!);
        }
        setResultModal({
          open: true,
          correctCount: updated.length,
          totalCount: challenges.length || 1,
          time: '1m',
        });
      }
    }
  };

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

    const challenges = fullLesson?.challenges || [];
    const activeChallenge: any = challenges[challengeIndex] || challenges[0];
    const quizAnswers: any[] = activeChallenge?.data?.quiz_answers || activeChallenge?.quiz_field?.options || [];

    const currentLessonData: any = fullLesson ? {
      id: fullLesson.id,
      title: fullLesson.title,
      duration: '10:00',
      watched: lessonIsFinished,
      type: activeChallenge?.type || fullLesson.lesson_type,
      video: fullLesson.video,
      challenges: fullLesson.challenges,
      quiz_data: activeChallenge ? {
        question: activeChallenge.title || activeChallenge.description || 'Pergunta',
        options: quizAnswers.map((o: any) => o.text || o),
        correctIndex: quizAnswers.findIndex((o: any) => o.is_correct) >= 0 ? quizAnswers.findIndex((o: any) => o.is_correct) : 0,
        explanation: activeChallenge.description || '',
      } : undefined,
    } : activeLesson || {
      id: lessonId,
      title: 'Aula',
      type: 'video',
      duration: '5:00',
      watched: lessonIsFinished,
    };

    const effectiveType = activeChallenge?.type || fullLesson?.lesson_type || currentLessonData.type || 'video';

    const commonProps = {
      course: activeCourse,
      module: activeModule,
      lesson: currentLessonData,
      challenge: activeChallenge,
      fullModuleLesson: fullLesson,
      isFinished: lessonIsFinished,
      onBack: () => {
        navigate(`/courses/${activeCourse.id}/${activeModule.id}`);
        setSelectedLesson(null);
        setFullLesson(null);
      },
      onMarkWatched: handleMarkWatched,
      onAnswer: handleChallengeAnswer,
    };

    return (
      <div className="space-y-4">
        {challenges.length > 1 && (
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl glass-card border border-border/40">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Desafio {challengeIndex + 1} de {challenges.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={challengeIndex === 0}
                onClick={() => setChallengeIndex((i) => Math.max(0, i - 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border/40 hover:bg-accent disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Anterior
              </button>
              <button
                type="button"
                disabled={challengeIndex >= challenges.length - 1}
                onClick={() => setChallengeIndex((i) => Math.min(challenges.length - 1, i + 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
              >
                Próximo <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {(() => {
          switch (effectiveType) {
            case 'quiz':
              return <QuizLesson key={`quiz-${challengeIndex}`} {...commonProps} />;
            case 'algorithm':
              return <AlgorithmLesson key={`algo-${challengeIndex}`} {...commonProps} />;
            case 'map':
              return <MazeLesson key={`maze-${challengeIndex}`} {...commonProps} />;
            case 'video':
            default:
              return <VideoPlayer key="video" {...commonProps} />;
          }
        })()}
      </div>
    );
  };

  return (
    <>
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

      {/* Result Dialog */}
      <Dialog
        open={!!resultModal?.open}
        onOpenChange={(open) => {
          if (!open) {
            setResultModal(null);
            navigate(`/courses/${activeCourse?.id || courseId}/${activeModule?.id || moduleId}`);
          }
        }}
      >
        <DialogContent className="glass-card max-w-md p-6 sm:rounded-3xl border-border/50 text-center">
          <DialogHeader className="items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-3 ring-1 ring-emerald-500/20">
              <Trophy className="h-8 w-8" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              Aula Concluída com Sucesso!
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Você finalizou todos os desafios propostos para esta etapa.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 my-4">
            <div className="p-3 rounded-2xl border border-border/40 bg-card/60">
              <div className="flex items-center justify-center gap-1.5 text-primary text-xs font-bold mb-1">
                <Target className="w-3.5 h-3.5" /> Acertos
              </div>
              <p className="text-lg font-extrabold text-foreground">
                {resultModal?.correctCount || 0}/{resultModal?.totalCount || 1}
              </p>
            </div>

            <div className="p-3 rounded-2xl border border-border/40 bg-card/60">
              <div className="flex items-center justify-center gap-1.5 text-amber-500 text-xs font-bold mb-1">
                <Clock className="w-3.5 h-3.5" /> Tempo
              </div>
              <p className="text-lg font-extrabold text-foreground">
                {resultModal?.time || '1m'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setResultModal(null);
              navigate(`/courses/${activeCourse?.id || courseId}/${activeModule?.id || moduleId}`);
            }}
            className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
          >
            Continuar Jornada
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CoursesView;
