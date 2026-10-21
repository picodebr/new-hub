import { motion } from 'framer-motion';
import { ArrowLeft, Download, Maximize2, Minimize2 } from 'lucide-react';
import { useState } from 'react';
import { IHubBook } from '@/_base/interfaces/book';

interface Props {
  material?: { title: string; pdfUrl?: string; file?: string };
  book?: IHubBook;
  onBack: () => void;
}

const PdfReader = ({ material, book, onBack }: Props) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const title = book?.title || material?.title || 'Documento PDF';
  const fileUrl = book?.file || material?.file || material?.pdfUrl || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col h-[calc(100vh-8rem)]"
    >
      {/* Header */}
      <div className="glass-card !rounded-2xl p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">Leitor de PDF</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={fileUrl}
            download={`${title}.pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            Baixar
          </a>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl hover:bg-accent transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Maximize2 className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 glass-card !rounded-2xl overflow-hidden">
        <iframe
          src={`${fileUrl}#toolbar=0`}
          className="w-full h-full border-0"
          title={title}
        />
      </div>
    </motion.div>
  );
};

export default PdfReader;
