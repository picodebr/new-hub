import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import AuthLogo from './AuthLogo';

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
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 3) {
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
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      setCode(pasted.split(''));
      refs[3].current?.focus();
    }
  };

  const isFilled = code.every((d) => d !== '');

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Simulate: code "1234" is valid
      if (code.join('') === '1234') {
        onSubmit(code.join(''));
      } else {
        setError('Código inválido ou não encontrado');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    }, 1500);
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
        {code.map((digit, i) => (
          <motion.input
            key={i}
            ref={refs[i]}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            className={`w-14 h-14 md:w-[60px] md:h-[60px] text-center text-xl font-semibold rounded-xl transition-all duration-200 outline-none ${
              error
                ? 'bg-destructive/10 border-2 border-destructive/50'
                : digit
                ? 'bg-input-hover border-2 border-transparent'
                : 'bg-input border-2 border-transparent'
            } focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.25)]`}
          />
        ))}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-destructive text-center mt-2"
        >
          {error}
        </motion.p>
      )}

      <button
        onClick={handleSubmit}
        className="apple-btn mt-6"
        disabled={!isFilled || loading}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Avançar'}
      </button>

      <p className="text-xs text-center text-muted-foreground mt-4">
        Use o código <span className="font-semibold text-foreground">1234</span> para testar
      </p>
    </motion.div>
  );
};

export default CodeInput;
