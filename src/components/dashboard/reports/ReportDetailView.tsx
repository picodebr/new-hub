import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  School,
  Tag,
  Paperclip,
  ExternalLink,
  Loader2,
  Network,
} from 'lucide-react';
import { IHubReport } from '@/_base/interfaces/report';
import { showReport } from '@/_base/services/report';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useUser } from '@/hooks/useUser';

export const ReportDetailView: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const { chosenSchool } = useUser();
  const [report, setReport] = useState<IHubReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!reportId) return;
    const fetchReport = async () => {
      try {
        setIsLoading(true);
        const data = await showReport(reportId);
        setReport(data);
      } catch (err) {
        console.error('Error fetching report detail:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [reportId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span>Carregando detalhes do chamado...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="glass-card !rounded-2xl p-8 text-center space-y-4">
        <p className="text-muted-foreground">Chamado não encontrado ou indisponível.</p>
        <button
          onClick={() => navigate('/reports')}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
        >
          Voltar para a lista
        </button>
      </div>
    );
  }

  const isResolved = report.status === 'finished';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Top bar with back */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Relatórios</span>
        </button>

        <span
          className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 ${
            isResolved
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
          }`}
        >
          {isResolved ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" /> Resolvido
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5" /> Em andamento
            </>
          )}
        </span>
      </div>

      {/* Main card */}
      <div className="glass-card !rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-xs font-mono font-bold text-primary">
            Chamado #{report.readable_id || report.id.substring(0, 8)}
          </span>
          <h1 className="text-2xl font-bold text-foreground mt-1">
            {report.subject || 'Sem assunto especificado'}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>
                Solicitado em {new Date(report.created_at).toLocaleDateString('pt-BR')} às{' '}
                {new Date(report.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-primary" />
              <span>{report.context}</span>
            </div>
            {(chosenSchool?.hub_school_group?.display_name || (chosenSchool as any)?.school_group?.display_name) && (
              <div className="flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-primary" />
                <span>{chosenSchool?.hub_school_group?.display_name || (chosenSchool as any)?.school_group?.display_name}</span>
              </div>
            )}
            {report.metadata?.school_name && (
              <div className="flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-primary" />
                <span>{report.metadata.school_name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border/40 pt-6">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
            Descrição do Problema
          </h3>
          <div className="p-4 rounded-xl bg-accent/20 border border-border/30 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {report.text || (report as any).description}
          </div>
        </div>

        {report.files && report.files.length > 0 && (
          <div className="border-t border-border/40 pt-6">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-primary" />
              Anexos ({report.files.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {report.files.map((fileUrl, index) => {
                const isImg = fileUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i);
                return (
                  <div
                    key={index}
                    onClick={() => isImg && setPreviewImage(fileUrl)}
                    className="glass-card !rounded-xl p-2 overflow-hidden group cursor-pointer hover:border-primary/50 transition-all"
                  >
                    {isImg ? (
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                        <img
                          src={fileUrl}
                          alt={`Anexo ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ) : (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-xs text-primary p-2"
                      >
                        <FileText className="w-4 h-4 shrink-0" />
                        <span className="truncate">Arquivo {index + 1}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 ml-auto" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl glass-card p-2 bg-black/95 border-none">
          {previewImage && (
            <img src={previewImage} alt="Preview do anexo" className="w-full h-auto rounded-xl max-h-[85vh] object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ReportDetailView;
