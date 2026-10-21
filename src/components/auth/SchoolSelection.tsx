import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, ChevronDown, Check, X, Loader2, Building2 } from 'lucide-react';
import { listSchoolsByGroupCode } from '@/_base/services/school';
import { IHubUserSchool } from '@/_base/interfaces/school';
import AuthLogo from './AuthLogo';

interface SchoolSelectionProps {
  primaryCode?: string;
  onBack: () => void;
  onNext: (schoolCodes: string[]) => void;
}

const DEFAULT_SCHOOLS = [
  { id: '1', display_name: 'Escola Municipal São José', code: 'EMSJ' },
  { id: '2', display_name: 'Escola Estadual Dom Pedro II', code: 'EEDP' },
  { id: '3', display_name: 'Colégio Santa Maria', code: 'CSM' },
  { id: '4', display_name: 'Instituto Educacional Progresso', code: 'IEP' },
  { id: '5', display_name: 'Escola Técnica Federal', code: 'ETF' },
  { id: '6', display_name: 'Centro Educacional Novo Horizonte', code: 'CENH' },
];

const SchoolSelection = ({ primaryCode, onBack, onNext }: SchoolSelectionProps) => {
  const [schools, setSchools] = useState<Array<{ id: string; display_name: string; code: string }>>(DEFAULT_SCHOOLS);
  const [search, setSearch] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!primaryCode) return;
    setLoadingSchools(true);
    listSchoolsByGroupCode(primaryCode)
      .then((res: IHubUserSchool[]) => {
        if (Array.isArray(res) && res.length > 0) {
          setSchools(
            res.map((s) => ({
              id: s.hub_school_id || (s as any).id,
              display_name: s.display_name,
              code: (s as any).code || s.hub_school_id || (s as any).id,
            }))
          );
        }
      })
      .catch((err) => {
        console.warn('Usando escolas de demonstração:', err);
      })
      .finally(() => setLoadingSchools(false));
  }, [primaryCode]);

  const filtered = schools.filter((s) =>
    s.display_name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (code: string) => {
    setError('');
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const remove = (code: string) => {
    setSelectedCodes((prev) => prev.filter((c) => c !== code));
  };

  const handleNext = () => {
    if (selectedCodes.length === 0) {
      setError('Selecione pelo menos uma escola para continuar');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onNext(selectedCodes);
    }, 400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <AuthLogo />

      <h1 className="text-[22px] font-semibold text-center text-foreground mb-1">
        Selecione suas escolas
      </h1>
      <p className="text-sm text-center text-muted-foreground mb-6">
        Escolha uma ou mais instituições em que você leciona
      </p>

      {/* Selected tags */}
      {selectedCodes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {selectedCodes.map((code) => {
            const sc = schools.find((s) => s.code === code);
            return (
              <span
                key={code}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20"
              >
                {sc?.display_name || code}
                <button
                  type="button"
                  onClick={() => remove(code)}
                  className="hover:text-destructive transition-colors ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Dropdown container */}
      <div ref={dropRef} className="relative mb-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`apple-input w-full flex items-center justify-between text-left ${
            error ? 'border-destructive ring-2 ring-destructive/20' : ''
          }`}
        >
          <span className="text-muted-foreground text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            {loadingSchools
              ? 'Carregando escolas da instituição...'
              : selectedCodes.length > 0
              ? `${selectedCodes.length} selecionada(s)`
              : 'Buscar escolas...'}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl glass-card border border-border/80 shadow-2xl z-50 bg-background/95 backdrop-blur-xl"
            >
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filtrar por nome..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-card border border-border/50 text-foreground outline-none focus:border-primary"
                  autoFocus
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {filtered.map((school) => {
                  const isSel = selectedCodes.includes(school.code);
                  return (
                    <button
                      key={school.code}
                      type="button"
                      onClick={() => toggle(school.code)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors ${
                        isSel
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-accent text-foreground'
                      }`}
                    >
                      <span className="truncate pr-2">{school.display_name}</span>
                      {isSel && <Check className="w-3.5 h-3.5 shrink-0 text-primary" />}
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhuma escola encontrada
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p className={`text-xs text-destructive mt-1 mb-2 ${shake ? 'animate-shake' : ''}`}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleNext}
        disabled={loading}
        className="apple-btn mt-6"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Continuar'}
      </button>
    </motion.div>
  );
};

export default SchoolSelection;
