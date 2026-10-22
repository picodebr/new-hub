import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Paperclip,
  Upload,
  X,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IHubReport } from '@/_base/interfaces/report';
import { listReports, createReport } from '@/_base/services/report';
import { getPresignedUrl, uploadFile } from '@/_base/services/upload';
import { useUser } from '@/hooks/useUser';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

const REPORT_CONTEXTS = ['Todos', 'Kits / Placas', 'Plataforma', 'Biblioteca', 'Outros'] as const;

export const ReportsView: React.FC = () => {
  const [reports, setReports] = useState<IHubReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContext, setSelectedContext] = useState<string>('Todos');

  // Modal create
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formContext, setFormContext] = useState<string>('Plataforma');
  const [formSubject, setFormSubject] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formFiles, setFormFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, chosenSchool } = useUser();
  const navigate = useNavigate();

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const data = await listReports();
      setReports(Array.isArray(data) ? data : ((data as any)?.results || (data as any)?.data || []));
    } catch (err) {
      console.error('Error loading reports:', err);
      // Fallback empty
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleCreate = async () => {
    const effectiveSubject = formContext === 'Plataforma' ? 'Plataforma' : formSubject.trim();
    if (!effectiveSubject || !formDescription.trim()) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      setIsSubmitting(true);
      let fileUrls: string[] = [];

      if (formFiles.length > 0) {
        const presignedUrls = await Promise.all(
          formFiles.map((file) => getPresignedUrl(file.type || 'image/png', 'reports').then((r) => ({ ...r, file })))
        );
        await Promise.all(presignedUrls.map(({ link, file }) => uploadFile(link, file)));
        fileUrls = presignedUrls.map((r) => r.path);
      }

      const schoolName = chosenSchool?.display_name || user?.school?.name || 'Escola PiCode';

      const newReport = await createReport({
        context: formContext as any,
        subject: effectiveSubject,
        text: formDescription.trim(),
        files: fileUrls,
        metadata: {
          school_name: schoolName,
        },
      });

      setReports((prev) => [newReport, ...prev]);
      toast.success('Chamado aberto com sucesso!');
      setIsModalOpen(false);
      setFormSubject('');
      setFormDescription('');
      setFormFiles([]);
    } catch (err) {
      toast.error('Erro ao abrir chamado');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesQuery =
      r.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.text || (r as any).description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(r.readable_id).includes(searchQuery);
    const matchesContext = selectedContext === 'Todos' || r.context === selectedContext;
    return matchesQuery && matchesContext;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatórios e Chamados</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Acompanhe suas solicitações de suporte e informe problemas técnicos ou pedagógicos
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Chamado</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {REPORT_CONTEXTS.map((ctx) => (
            <button
              key={ctx}
              onClick={() => setSelectedContext(ctx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedContext === ctx
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border/40 text-muted-foreground hover:bg-accent'
              }`}
            >
              {ctx}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por chamado..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Reports Table/Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Carregando chamados...</span>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="glass-card !rounded-2xl p-12 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
          <h3 className="text-base font-bold text-foreground">Nenhum chamado encontrado</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? 'Tente ajustar os filtros ou o termo de pesquisa.'
              : 'Você ainda não registrou nenhum chamado de suporte. Clique em "Novo Chamado" para reportar qualquer dúvida ou problema.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => {
            const isResolved = report.status === 'finished';
            return (
              <div
                key={report.id}
                onClick={() => navigate(`/reports/${report.id}`)}
                className="glass-card !rounded-2xl p-5 cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-primary">
                      #{report.readable_id || report.id.substring(0, 6)}
                    </span>
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                        isResolved
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {isResolved ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Resolvido
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" /> Em andamento
                        </>
                      )}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {report.subject || 'Sem assunto'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                    {report.text || (report as any).description}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="bg-accent/40 px-2 py-0.5 rounded-md font-medium">
                    {report.context}
                  </span>
                  <span>{new Date(report.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Novo Chamado */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md glass-card !rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Abrir Novo Chamado</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Categoria / Assunto *
              </label>
              <select
                value={formContext}
                onChange={(e) => setFormContext(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="Plataforma">Plataforma (Hub / Login / IDE)</option>
                <option value="Kits / Placas">Kits / Placas (Arduino, Sensores, Componentes)</option>
                <option value="Biblioteca">Biblioteca (Apostilas, PDFs, Vídeos)</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            {formContext !== 'Plataforma' && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  {formContext === 'Kits / Placas'
                    ? 'Qual componente? *'
                    : formContext === 'Biblioteca'
                    ? 'Qual livro? *'
                    : 'Assunto *'}
                </label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder={
                    formContext === 'Kits / Placas'
                      ? 'Ex: Sensor ultrassônico, Servo motor SG90...'
                      : formContext === 'Biblioteca'
                      ? 'Ex: Apostila Robótica 1º Ano...'
                      : 'Ex: Dúvida sobre acesso...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Descreva o problema *
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Explique o que aconteceu, o que esperava que ocorresse e como reproduzir..."
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Anexar fotos ou arquivos
              </label>
              <input
                type="file"
                multiple
                id="report-files"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    setFormFiles(Array.from(e.target.files));
                  }
                }}
              />
              <label
                htmlFor="report-files"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-border/80 hover:border-primary text-xs text-muted-foreground cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4 text-primary" />
                <span>
                  {formFiles.length > 0
                    ? `${formFiles.length} arquivo(s) selecionado(s)`
                    : 'Clique para selecionar imagens ou logs'}
                </span>
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Enviar Chamado</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ReportsView;
