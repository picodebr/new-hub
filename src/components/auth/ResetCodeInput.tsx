import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { checkRecoveryToken } from '@/_base/services/user';
import { toast } from 'sonner';
import AuthLogo from './AuthLogo';

interface ResetCodeInputProps {
  email: string; // Identifier (email or username)
  onBack: () => void;
  onVerified: (token: string) => void;
}

const ResetCodeInput = ({ email, onBack, onVerified }: ResetCodeInputProps) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  useEffect(() => {
    refs[0].current?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (error) setError('');
    const char = value.slice(-1);
    if (!/^[a-zA-Z0-9]*$/.test(char)) return;

    const newCode = [...code];
    newCode[index] = char;
    setCode(newCode);

    if (char && index < 5) {
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
    const pasted = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      refs[5].current?.focus();
    }
  };

  const isFilled = code.every((d) => d !== '');

  const handleSubmit = async () => {
    const fullCode = code.join('');
    setLoading(true);
    try {
      const res = await checkRecoveryToken({ identifier: email, token: fullCode });
      if (res?.is_valid) {
        toast.success('Código verificado com sucesso!');
        onVerified(fullCode);
      } else {
        setError(res?.message || 'Código inválido. Verifique e tente novamente.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Código inválido. Verifique e tente novamente.';
      setError(msg);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
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
        Digite o código
      </h1>
      <p className="text-sm text-center text-muted-foreground mb-2">
        Enviamos um código de 6 dígitos para
      </p>
      <p className="text-xs font-semibold text-center text-primary mb-6 break-all">
        {email}
      </p>

      <div className={`flex justify-center gap-2 mb-2 ${shake ? 'animate-shake' : ''}`}>
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
            className={`w-11 h-14 text-center text-xl font-bold rounded-xl border bg-card/60 text-foreground transition-all duration-200 outline-none uppercase ${
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
        <p className="text-xs text-destructive text-center mt-2 mb-3">
          {error}
        </p>
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

export default ResetCodeInput;
