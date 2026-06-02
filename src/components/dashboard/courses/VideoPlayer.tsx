import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { Lesson, Module, Course } from './coursesData';
import { Progress } from '@/components/ui/progress';

interface Props {
  course: Course;
  module: Module;
  lesson: Lesson;
  onBack: () => void;
  onMarkWatched: (lessonId: string) => void;
}

const VideoPlayer = ({ course, module, lesson, onBack, onMarkWatched }: Props) => {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [markedComplete, setMarkedComplete] = useState(lesson.watched);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Parse duration from string "M:SS"
  const parsedDuration = (() => {
    const parts = lesson.duration.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  })();

  useEffect(() => {
    setDuration(parsedDuration);
  }, [parsedDuration]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 1;
          const pct = (next / parsedDuration) * 100;
          setProgress(pct);
          if (next >= parsedDuration) {
            setPlaying(false);
            if (!markedComplete) {
              setMarkedComplete(true);
              onMarkWatched(lesson.id);
            }
            if (intervalRef.current) clearInterval(intervalRef.current);
            return parsedDuration;
          }
          return next;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, parsedDuration, markedComplete, lesson.id, onMarkWatched]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    const newTime = (pct / 100) * parsedDuration;
    setCurrentTime(newTime);
    setProgress(pct);
    if (newTime >= parsedDuration && !markedComplete) {
      setMarkedComplete(true);
      onMarkWatched(lesson.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-accent/80 flex items-center justify-center hover:bg-accent transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-foreground truncate">{lesson.title}</h1>
            <p className="text-xs text-muted-foreground">{module.title} · {course.title}</p>
          </div>
        </div>
        {markedComplete && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full flex-shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-semibold">Concluído</span>
          </motion.div>
        )}
      </div>

      {/* Video area */}
      <div className="glass-card rounded-2xl overflow-hidden border border-border/50">
        {/* Simulated video */}
        <div
          className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center cursor-pointer group"
          onClick={() => setPlaying(!playing)}
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
          
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
              playing
                ? 'bg-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100'
                : 'bg-white/20 backdrop-blur-md'
            }`}
          >
            {playing ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" />
            )}
          </motion.div>

          {/* Time overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-8">
            {/* Clickable progress */}
            <div
              className="w-full h-1.5 bg-white/20 rounded-full mb-3 cursor-pointer group/bar"
              onClick={(e) => { e.stopPropagation(); handleProgressClick(e); }}
            >
              <div
                className="h-full bg-primary rounded-full transition-all duration-300 relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/bar:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); setPlaying(!playing); }}
                  className="text-white hover:text-primary transition-colors"
                >
                  {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <span className="text-xs text-white/80 font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
                  className="text-white hover:text-primary transition-colors"
                >
                  {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="text-white hover:text-primary transition-colors"
                >
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tip */}
      {!markedComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 glass-card rounded-xl p-3 border border-border/50 text-center"
        >
          <p className="text-xs text-muted-foreground">
            Assista o vídeo até o final para marcar como concluído e avançar no progresso do módulo
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default VideoPlayer;
