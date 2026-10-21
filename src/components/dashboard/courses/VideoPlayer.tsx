import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Play,
  Download,
  FileText,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Lesson, Module, Course } from './coursesData';
import { sendModuleLesson, getModuleLesson } from '@/_base/services/course';
import { IHubModuleLesson } from '@/_base/interfaces/module';
import { toast } from 'sonner';

interface Props {
  course: Course;
  module: Module;
  lesson: Lesson | IHubModuleLesson;
  fullModuleLesson?: IHubModuleLesson | null;
  isFinished?: boolean;
  onBack: () => void;
  onMarkWatched: (lessonId: string) => void;
}

const VideoPlayer = ({
  course,
  module,
  lesson,
  fullModuleLesson,
  isFinished = false,
  onBack,
  onMarkWatched,
}: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [markedComplete, setMarkedComplete] = useState(isFinished || (lesson as any).watched || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchedVideoUrl, setFetchedVideoUrl] = useState<string | null>(null);
  const [fetchedPosterUrl, setFetchedPosterUrl] = useState<string | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);

  const videoUrl =
    (lesson as any)?.video?.file ||
    fullModuleLesson?.video?.file ||
    fetchedVideoUrl ||
    (lesson as any)?.videoUrl ||
    (lesson as any)?.url ||
    '';

  const posterUrl =
    (lesson as any)?.video?.thumbnail ||
    fullModuleLesson?.video?.thumbnail ||
    fetchedPosterUrl ||
    (lesson as any)?.thumbnail ||
    '';

  // Fallback: se o objeto da aula não tiver video.file, busca getModuleLesson diretamente
  useEffect(() => {
    if (!videoUrl && course.id && module.id && lesson.id) {
      setIsLoadingVideo(true);
      getModuleLesson(course.id, module.id, lesson.id)
        .then((ml) => {
          if (ml?.video?.file) {
            setFetchedVideoUrl(ml.video.file);
            if (ml.video.thumbnail) setFetchedPosterUrl(ml.video.thumbnail);
          }
        })
        .catch((err) => {
          console.warn('Não foi possível carregar vídeo da aula via getModuleLesson:', err);
        })
        .finally(() => {
          setIsLoadingVideo(false);
        });
    }
  }, [videoUrl, course.id, module.id, lesson.id]);

  useEffect(() => {
    if (isFinished || (lesson as any).watched) {
      setMarkedComplete(true);
    }
  }, [isFinished, lesson]);

  const handleComplete = async () => {
    if (markedComplete || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await sendModuleLesson({
        course_id: course.id,
        module_id: module.id,
        lesson_id: lesson.id,
        answers: [],
      });
      toast.success('Aula concluída com sucesso!');
    } catch (err) {
      console.warn('Erro ao registrar conclusão do vídeo na API:', err);
      toast.success('Aula marcada como concluída!');
    } finally {
      setIsSubmitting(false);
      setMarkedComplete(true);
      onMarkWatched(lesson.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
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

        {markedComplete ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full flex-shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-semibold">Concluído</span>
          </motion.div>
        ) : (
          <button
            type="button"
            onClick={handleComplete}
            disabled={isSubmitting}
            className="apple-btn text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Salvando...' : 'Marcar como Concluída'}</span>
          </button>
        )}
      </div>

      {/* Video area */}
      <div className="glass-card rounded-3xl overflow-hidden border border-border/50 shadow-lg">
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          {isLoadingVideo ? (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-medium">Carregando arquivo de vídeo...</p>
            </div>
          ) : videoUrl ? (
            <video
              ref={videoRef}
              key={videoUrl}
              src={videoUrl}
              poster={posterUrl || undefined}
              controls
              autoPlay
              preload="metadata"
              controlsList="nodownload"
              className="w-full h-full aspect-video object-contain bg-black"
              onTimeUpdate={(e) => {
                const el = e.currentTarget;
                setCurrentTime(el.currentTime);
                if (el.duration) {
                  setDuration(el.duration);
                  const pct = (el.currentTime / el.duration) * 100;
                  setProgress(pct);
                  if (pct > 90 && !markedComplete) {
                    setMarkedComplete(true);
                    handleComplete();
                  }
                }
              }}
              onEnded={() => {
                if (!markedComplete) {
                  setMarkedComplete(true);
                  handleComplete();
                }
              }}
            >
              <source src={videoUrl} type="video/mp4" />
              Seu navegador não suporta a tag de vídeo HTML5.
            </video>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <Play className="w-8 h-8 text-white/50 ml-1" />
              </div>
              <p className="text-sm font-medium">Nenhum arquivo de vídeo anexado a esta aula.</p>
            </div>
          )}
        </div>
      </div>

      {/* Material Complementar & Anexos */}
      <div className="glass-card rounded-2xl p-5 border border-border/50 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span>Materiais de Apoio e Anexos</span>
        </h3>
        <p className="text-xs text-muted-foreground">
          Faça o download do esquemático de ligação e do código-fonte para acompanhar as etapas práticas da aula.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60 hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Guia_Pratico_Aula.pdf</p>
                <p className="text-[10px] text-muted-foreground">PDF · 1.4 MB</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toast.success('Iniciando download do material complementar...')}
              className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Baixar material"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60 hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <ExternalLink className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Diagrama de Conexão no Tinkercad</p>
                <p className="text-[10px] text-muted-foreground">Link externo interativo</p>
              </div>
            </div>
            <a
              href="https://www.tinkercad.com"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Abrir no Tinkercad"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoPlayer;
