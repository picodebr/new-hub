import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import AuthLogo from './AuthLogo';

interface ResetCodeInputProps {
  email: string;
  onBack: () => void;
  onVerified: () => void;
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
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
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
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      refs[5].current?.focus();
    }
  };

  const isFilled = code.every((d) => d !== '');

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (code.join('') === '123456') {
        onVerified();
      } else {
        setError('Código inválido. Verifique e tente novamente.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    }, 1500);
  };

  // Mask email
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(b.length) + c);

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
        Verifique seu e-mail
      </h1>
      <p className="text-sm text-center text-muted-foreground mb-8">
        Enviamos um código de 6 dígitos para{' '}
        <span className="font-medium text-foreground">{maskedEmail}</span>
      </p>

      <div className={`flex justify-center gap-2 mb-2 ${shake ? 'animate-shake' : ''}`}>
        {code.map((digit, i) => (
          <motion.input
            key={i}
            ref={refs[i]}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.06 }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            className={`w-11 h-12 md:w-12 md:h-14 text-center text-lg font-semibold rounded-xl transition-all duration-200 outline-none ${
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
        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Verificar código'}
      </button>

      <p className="text-xs text-center text-muted-foreground mt-4">
        Use o código <span className="font-semibold text-foreground">123456</span> para testar
      </p>
    </motion.div>
  );
};

export default ResetCodeInput;
