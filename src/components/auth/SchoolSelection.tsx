import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, ChevronDown, Check, X, Loader2 } from 'lucide-react';
import AuthLogo from './AuthLogo';

interface SchoolSelectionProps {
  onBack: () => void;
  onNext: (schools: string[]) => void;
}

const MOCK_SCHOOLS = [
  'Escola Municipal São José',
  'Escola Estadual Dom Pedro II',
  'Colégio Santa Maria',
  'Instituto Educacional Progresso',
  'Escola Técnica Federal',
  'Centro Educacional Novo Horizonte',
];

const SchoolSelection = ({ onBack, onNext }: SchoolSelectionProps) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const filtered = MOCK_SCHOOLS.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
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

  const toggle = (school: string) => {
    setError('');
    setSelected((prev) =>
      prev.includes(school) ? prev.filter((s) => s !== school) : [...prev, school]
    );
  };

  const remove = (school: string) => {
    setSelected((prev) => prev.filter((s) => s !== school));
  };

  const handleNext = () => {
    if (selected.length === 0) {
      setError('Selecione pelo menos uma escola para continuar');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onNext(selected);
    }, 800);
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

      <h1 className="text-2xl font-semibold text-center text-foreground mb-1">
        Quais são suas escolas?
      </h1>
      <p className="text-sm text-center text-muted-foreground mb-6">
        Selecione as escolas onde você leciona
      </p>

      {/* Chips */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 mb-3"
          >
            {selected.map((s) => (
              <motion.span
                key={s}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary"
              >
                {s}
                <button onClick={() => remove(s)} className="hover:bg-primary/20 rounded-full p-0.5 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search dropdown */}
      <div ref={dropRef} className="relative">
        <div
          className={`relative ${shake ? 'animate-shake' : ''} ${
            error ? 'ring-2 ring-destructive/50 rounded-xl' : ''
          }`}
        >
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar ou selecionar escolas"
            className="apple-input pl-10 pr-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setOpen(true)}
          />
          <ChevronDown
            className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute z-10 w-full mt-2 bg-card rounded-xl shadow-lg border border-border max-h-52 overflow-y-auto"
            >
              {filtered.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">
                  Nenhuma escola encontrada
                </p>
              ) : (
                filtered.map((school) => {
                  const isSelected = selected.includes(school);
                  return (
                    <button
                      key={school}
                      onClick={() => toggle(school)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors hover:bg-muted ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                    >
                      <span className="text-foreground">{school}</span>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-destructive mt-2"
        >
          {error}
        </motion.p>
      )}

      <button onClick={handleNext} className="apple-btn mt-6" disabled={loading}>
        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Avançar'}
      </button>
    </motion.div>
  );
};

export default SchoolSelection;
