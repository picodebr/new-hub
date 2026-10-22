import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, ExternalLink, Medal, ChevronRight, Loader2 } from 'lucide-react';
import { listUserCertificates } from '@/_base/services/certificates';
import { IHubCertificate } from '@/_base/interfaces/certificate';

interface CertificateItem {
  id: string;
  name: string;
  date: string;
  color: string;
  url?: string;
}

const MyCertificates = () => {
  const [certs, setCerts] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listUserCertificates()
      .then((data: IHubCertificate[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setCerts(
            data.map((c, i) => ({
              id: c.id || `c-${i}`,
              name: c.title || (c as any).course_title || 'Certificado PiCode',
              date: new Date(c.created_at).toLocaleDateString('pt-BR'),
              color: i % 2 === 0 ? '#F59E0B' : '#3B82F6',
              url: c.link || (c as any).certificate_url,
            }))
          );
        } else {
          setCerts([]);
        }
      })
      .catch((err) => {
        console.warn('Erro ao listar certificados da API:', err);
        setCerts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleOpenCertificate = (c: CertificateItem) => {
    if (c.url) {
      window.open(c.url, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card overflow-hidden p-5 md:p-6"
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
            <Medal className="h-[18px] w-[18px] text-amber-500" />
          </div>
          <h2 className="text-base font-semibold text-foreground sm:text-lg">Meus Certificados</h2>
        </div>
        {certs.length > 0 && (
          <span className="text-xs font-semibold text-muted-foreground">{certs.length} emitido(s)</span>
        )}
      </div>

      <div className="space-y-2.5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : certs.length > 0 ? (
          certs.map((c, i) => (
            <motion.button
              type="button"
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.995 }}
              onClick={() => handleOpenCertificate(c)}
              className="group relative w-full text-left flex items-center gap-4 overflow-hidden rounded-2xl border border-border/40 bg-card/60 px-4 py-3 transition-all duration-300 hover:border-border hover:bg-card hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)]"
            >
              {/* Accent bar */}
              <span
                className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full opacity-60 transition-all duration-300 group-hover:h-12 group-hover:opacity-100"
                style={{ backgroundColor: c.color }}
              />

              {/* Icon */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundColor: c.color }}
              >
                <Award className="h-5 w-5 text-white" />
              </div>

              {/* Name + date */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground tracking-tight truncate">{c.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{c.date}</p>
              </div>

              {/* Action */}
              <div className="flex items-center gap-2 shrink-0 ml-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  Visualizar
                  <ExternalLink className="w-3 h-3" />
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
            </motion.button>
          ))
        ) : (
          <div className="text-center py-8 text-xs text-muted-foreground">
            Você ainda não possui certificados emitidos
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MyCertificates;
