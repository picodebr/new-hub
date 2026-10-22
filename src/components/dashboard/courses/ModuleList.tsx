import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Award, CheckCircle2, BookOpen, Play, Loader2 } from 'lucide-react';
import { Course, Module } from './coursesData';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUser } from '@/hooks/useUser';
import { getCertificateByCourse, listUserCertificates, registerCertificate } from '@/_base/services/certificates';
import { getPresignedUrl, uploadFile } from '@/_base/services/upload';
import { formatShortName } from '@/_base/utils';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { toast } from 'sonner';

interface Props {
  course: Course;
  onBack: () => void;
  onSelectModule: (module: Module) => void;
}

const ModuleList = ({ course, onBack, onSelectModule }: Props) => {
  const { user } = useUser();
  const [loadingCert, setLoadingCert] = useState(false);

  const totalLessons = course.modules.reduce((a, m) => a + m.lessons.length, 0);
  const watchedLessons = course.modules.reduce(
    (a, m) => a + m.lessons.filter((l) => l.watched).length,
    0
  );
  const overallPercent = totalLessons > 0 ? Math.round((watchedLessons / totalLessons) * 100) : 0;
  const allComplete = totalLessons > 0 && watchedLessons === totalLessons;

  const handleEmitCertificate = async () => {
    if (!allComplete || loadingCert) return;

    try {
      setLoadingCert(true);
      toast.info('Verificando certificado...');

      // 1. Check if user already has certificate for this course
      const userCerts = await listUserCertificates().catch(() => []);
      const existing = (userCerts || []).find((c) => c.hub_course_id === course.id);
      if (existing?.link) {
        window.open(existing.link, '_blank');
        toast.success('Certificado aberto!');
        return;
      }

      // 2. Fetch certificate template
      const templateRes = await getCertificateByCourse(course.id);
      const template = templateRes?.templates?.[0];
      if (!template?.link) {
        toast.error('Template de certificado não encontrado para este curso.');
        return;
      }

      toast.info('Gerando certificado em PDF...');
      const response = await fetch(template.link);
      const existingPdfBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      pdfDoc.registerFontkit(fontkit);

      const fontRes = await fetch('/fonts/noteworthy.ttf');
      const fontBytes = await fontRes.arrayBuffer();
      const noteWorthyFont = await pdfDoc.embedFont(fontBytes);

      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const text = formatShortName(user?.name || '', true);
      const fontSize = 40;
      const maxWidth = 612;
      const textWidth = noteWorthyFont.widthOfTextAtSize(text, fontSize);
      const centeredX = 115 + (maxWidth - textWidth) / 2;

      firstPage.drawText(text, {
        x: centeredX,
        y: 298,
        size: fontSize,
        font: noteWorthyFont,
        color: rgb(0.122, 0.114, 0.239),
        maxWidth,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const presigned = await getPresignedUrl('application/pdf', 'certificates');
      const filename = presigned.path.split('/').pop() || `certificado_${course.id}.pdf`;
      const file = new File([blob], filename, { type: 'application/pdf' });
      await uploadFile(presigned.link, file);

      const newCert = await registerCertificate(course.id, presigned.path);
      const downloadUrl = newCert?.link || URL.createObjectURL(blob);
      window.open(downloadUrl, '_blank');
      toast.success('Certificado gerado com sucesso!');
    } catch (err: any) {
      console.error('Erro ao emitir certificado:', err);
      toast.error('Erro ao emitir certificado: ' + (err?.message || 'Falha no processamento.'));
    } finally {
      setLoadingCert(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-accent/80 flex items-center justify-center hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">{course.title}</h1>
          <p className="text-sm text-muted-foreground">{course.modules.length} módulos · {totalLessons} aulas · {overallPercent}% concluído</p>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={allComplete ? { scale: 1.05 } : {}}
                whileTap={allComplete ? { scale: 0.95 } : {}}
                disabled={!allComplete || loadingCert}
                onClick={handleEmitCertificate}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
                  allComplete
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40'
                    : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                }`}
              >
                {loadingCert ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : allComplete ? (
                  <Award className="w-4 h-4" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {loadingCert ? 'Emitindo...' : 'Emitir Certificado'}
                </span>
              </motion.button>
            </TooltipTrigger>
            {!allComplete && (
              <TooltipContent side="bottom" className="max-w-[220px] text-center">
                <p>Conclua todos os módulos para emitir seu certificado</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Module cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {course.modules.map((mod, i) => {
          const modWatched = mod.lessons.filter((l) => l.watched).length;
          const modTotal = mod.lessons.length;
          const modPercent = modTotal > 0 ? Math.round((modWatched / modTotal) * 100) : 0;
          const isComplete = modWatched === modTotal && modTotal > 0;

          return (
            <motion.button
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelectModule(mod)}
              className="group relative glass-card rounded-3xl overflow-hidden text-left cursor-pointer border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
            >
              {/* "Image" header with gradient + module number emblem */}
              <div className="p-3 pb-2 h-36">
                <div className={`relative w-full h-full overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br ${course.color}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.35),transparent_60%)]" />
                  <div
                    className="absolute inset-0 opacity-[0.12]"
                    style={{
                      backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
                      backgroundSize: '14px 14px',
                    }}
                  />
                  <BookOpen
                    className="absolute -bottom-3 -right-3 w-24 h-24 text-white/20"
                    strokeWidth={1.5}
                  />

                  {/* Status pill */}
                  <div className="absolute top-3 right-3">
                    {isComplete ? (
                      <div className="flex items-center gap-1 bg-white/25 backdrop-blur-md rounded-full px-2.5 py-1 ring-1 ring-white/30">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span className="text-[11px] font-semibold text-white">CONCLUÍDO</span>
                      </div>
                    ) : modWatched > 0 ? (
                      <div className="flex items-center gap-1 bg-white/25 backdrop-blur-md rounded-full px-2.5 py-1 ring-1 ring-white/30">
                        <Play className="w-3.5 h-3.5 text-white" />
                        <span className="text-[11px] font-semibold text-white">{modPercent}%</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-white/25 backdrop-blur-md rounded-full px-2.5 py-1 ring-1 ring-white/30">
                        <BookOpen className="w-3.5 h-3.5 text-white" />
                        <span className="text-[11px] font-semibold text-white">NOVO</span>
                      </div>
                    )}
                  </div>

                  {/* Centered numbered emblem */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/25 backdrop-blur-md flex items-center justify-center text-white font-bold text-xl ring-1 ring-white/30 shadow-lg transition-transform duration-300 group-hover:scale-110 tabular-nums">
                      {i + 1}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className="px-4 pb-4 pt-1">
                <h3 className="font-semibold text-foreground text-sm mb-2 truncate group-hover:text-primary transition-colors">
                  {mod.title}
                </h3>
                <p className="text-[11px] text-muted-foreground mb-2">
                  {modTotal} aula{modTotal !== 1 ? 's' : ''}
                </p>
                <Progress value={modPercent} className="h-1.5" />
                <p className="text-[10px] text-muted-foreground/80 mt-1.5 tabular-nums">{modWatched}/{modTotal} aulas concluídas</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ModuleList;
