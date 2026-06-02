import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { coursesData, Course, Module, Lesson } from './coursesData';
import CourseList from './CourseList';
import ModuleList from './ModuleList';
import LessonList from './LessonList';
import VideoPlayer from './VideoPlayer';

type View = 'courses' | 'modules' | 'lessons' | 'video';

const CoursesView = () => {
  const [courses, setCourses] = useState(coursesData);
  const [view, setView] = useState<View>('courses');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const handleMarkWatched = useCallback((lessonId: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        const updated = {
          ...c,
          modules: c.modules.map((m) => ({
            ...m,
            lessons: m.lessons.map((l) =>
              l.id === lessonId ? { ...l, watched: true } : l
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

    // Update local selected refs
    setSelectedModule((prev) =>
      prev
        ? {
            ...prev,
            lessons: prev.lessons.map((l) =>
              l.id === lessonId ? { ...l, watched: true } : l
            ),
          }
        : null
    );
    setSelectedLesson((prev) =>
      prev && prev.id === lessonId ? { ...prev, watched: true } : prev
    );
  }, []);

  // Keep selected course/module in sync with courses state
  const currentCourse = selectedCourse
    ? courses.find((c) => c.id === selectedCourse.id) || selectedCourse
    : null;
  const currentModule = currentCourse && selectedModule
    ? currentCourse.modules.find((m) => m.id === selectedModule.id) || selectedModule
    : null;

  return (
    <AnimatePresence mode="wait">
      {view === 'courses' && (
        <CourseList
          key="courses"
          courses={courses}
          onSelectCourse={(c) => {
            setSelectedCourse(c);
            setView('modules');
          }}
        />
      )}
      {view === 'modules' && currentCourse && (
        <ModuleList
          key="modules"
          course={currentCourse}
          onBack={() => {
            setView('courses');
            setSelectedCourse(null);
          }}
          onSelectModule={(m) => {
            setSelectedModule(m);
            setView('lessons');
          }}
        />
      )}
      {view === 'lessons' && currentCourse && currentModule && (
        <LessonList
          key="lessons"
          course={currentCourse}
          module={currentModule}
          onBack={() => {
            setView('modules');
            setSelectedModule(null);
          }}
          onSelectLesson={(l) => {
            setSelectedLesson(l);
            setView('video');
          }}
        />
      )}
      {view === 'video' && currentCourse && currentModule && selectedLesson && (
        <VideoPlayer
          key="video"
          course={currentCourse}
          module={currentModule}
          lesson={selectedLesson}
          onBack={() => {
            setView('lessons');
            setSelectedLesson(null);
          }}
          onMarkWatched={handleMarkWatched}
        />
      )}
    </AnimatePresence>
  );
};

export default CoursesView;
