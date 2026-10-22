import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { checkPrimaryCode } from '@/_base/services/user';
import AuthLogo from './AuthLogo';
import { toast } from 'sonner';

interface CodeInputProps {
  profile: 'student' | 'teacher';
  onBack: () => void;
  onSubmit: (code: string) => void;
}

const CodeInput = ({ profile, onBack, onSubmit }: CodeInputProps) => {
  const [code, setCode] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    refs[0].current?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (error) setError('');
    const char = value.slice(-1).toUpperCase();
    if (!/^[A-Z0-9]*$/.test(char)) return;

    const newCode = [...code];
    newCode[index] = char;
    setCode(newCode);

    if (char && index < 3) {
      refs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
    if (pasted.length === 4) {
      setCode(pasted.split(''));
      refs[3].current?.focus();
    }
  };

  const isFilled = code.every((d) => d !== '');

  const handleSubmit = async () => {
    const fullCode = code.join('');
    setLoading(true);
    try {
      const res = await checkPrimaryCode(profile, fullCode);
      if (res?.is_valid) {
        toast.success('Código validado com sucesso!');
        onSubmit(fullCode);
      } else {
        setError('Código inválido ou não encontrado.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Código inválido ou não encontrado.';
      setError(msg);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const subtitle =
    profile === 'student'
      ? 'Informe o código da sua turma fornecido pelo professor.'
      : 'Informe o código fornecido pela sua instituição.';

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
        Informe o código de acesso
      </h1>
      <p className="text-sm text-center text-muted-foreground mb-8">{subtitle}</p>

      <div className={`flex justify-center gap-3 mb-2 ${shake ? 'animate-shake' : ''}`}>
        {code.map((digit, idx) => (
          <input
            key={idx}
            ref={refs[idx]}
            type="text"
            inputMode="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={idx === 0 ? handlePaste : undefined}
            className={`w-14 h-16 text-center text-2xl font-bold rounded-2xl border bg-card/60 text-foreground transition-all duration-200 outline-none uppercase ${
              error
                ? 'border-destructive ring-2 ring-destructive/20'
                : digit
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
            }`}
          />
        ))}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-destructive text-center mt-2 mb-4"
        >
          {error}
        </motion.p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!isFilled || loading}
        className="apple-btn mt-6"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Verificar código'}
      </button>
    </motion.div>
  );
};

export default CodeInput;
